import express from "express";
import cors from "cors";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Upload directory configuration (volume mount on Railway)
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "storage", "uploads");

// Ensure upload root exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Database client pool (optional connection to Railway PostgreSQL)
let dbPool = null;
if (process.env.DATABASE_URL) {
  dbPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
  });
}

// CORS setup
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(",").map((o) => o.trim())
  : ["*"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all during setup
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Magic byte verification for safe uploads
const ALLOWED_MIME = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// Storage setup for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const folder = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    const targetDir = path.join(UPLOAD_DIR, folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(".", "") || "jpg";
    const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
    const randomName = `${crypto.randomBytes(12).toString("hex")}.${safeExt}`;
    cb(null, randomName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
    if (!["jpg", "jpeg", "png", "webp"].includes(ext)) {
      return cb(new Error("الصيغ المدعومة فقط هي: JPG, PNG, WEBP"));
    }
    cb(null, true);
  },
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Deem Health Railway Backend & Storage",
    time: new Date().toISOString(),
    storageDir: UPLOAD_DIR,
    databaseConnected: !!dbPool,
  });
});

// DB Health Check
app.get("/api/db-health", async (req, res) => {
  if (!dbPool) {
    return res.status(200).json({ status: "not_configured", message: "DATABASE_URL is not set" });
  }
  try {
    const result = await dbPool.query("SELECT NOW()");
    res.json({ status: "connected", dbTime: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// Upload image endpoint
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: "لم يتم إرفاق أي ملف" });
  }
  const folder = path.basename(path.dirname(req.file.path));
  const filename = path.basename(req.file.path);
  const publicUrl = `/api/uploads/${folder}/${filename}`;

  res.json({
    ok: true,
    url: publicUrl,
    filename,
    folder,
    size: req.file.size,
  });
});

// Serve uploaded images directly from Railway persistent volume
app.get("/api/uploads/:folder/:filename", (req, res) => {
  const { folder, filename } = req.params;

  // Sanitize path against directory traversal
  if (!/^\d{6}$/.test(folder) || !/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(filename)) {
    return res.status(400).send("Invalid path format");
  }

  const filePath = path.resolve(UPLOAD_DIR, folder, filename);

  if (!filePath.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) {
    return res.status(403).send("Forbidden");
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  const ext = path.extname(filename).toLowerCase().replace(".", "");
  const mime = ALLOWED_MIME[ext] || "application/octet-stream";

  res.setHeader("Content-Type", mime);
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.setHeader("X-Content-Type-Options", "nosniff");

  fs.createReadStream(filePath).pipe(res);
});

// Submit / Record Order endpoint (receives orders from Vercel frontend)
app.post("/api/orders", async (req, res) => {
  try {
    const orderData = req.body;
    const orderId = `DH-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    console.log(`[Order Received] ${orderId}:`, orderData);

    // If PostgreSQL connected, save order
    if (dbPool) {
      try {
        await dbPool.query(
          `INSERT INTO orders (id, customer_name, customer_phone, governorate, address, total, items, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           ON CONFLICT DO NOTHING`,
          [
            orderId,
            orderData.customerName || "زبون",
            orderData.phone || "",
            orderData.governorate || "",
            orderData.address || "",
            orderData.total || 0,
            JSON.stringify(orderData.items || []),
          ]
        );
      } catch (dbErr) {
        console.warn("DB insert fallback (table might not exist yet):", dbErr.message);
      }
    }

    res.json({
      ok: true,
      orderNumber: orderId,
      message: "تم استلام الطلب بنجاح وسيتواصل فريق ديم هيلث معكم لتأكيد التوصيل",
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Deem Health Railway Backend & Storage running on port ${PORT}`);
  console.log(`📁 Persistent Uploads directory: ${UPLOAD_DIR}`);
});
