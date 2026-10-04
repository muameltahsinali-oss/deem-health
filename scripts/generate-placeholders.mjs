/**
 * Generates the DEMO product / category placeholder images in brand colours.
 * Real product photography should replace these (upload from Admin → Products).
 *
 *   node scripts/generate-placeholders.mjs
 *
 * Requires `sharp` (installed with Next.js as an optional dependency).
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = (p) => join(root, "public", "images", p);

const C = {
  plum: "#200b2c",
  plum7: "#4c3160",
  lav: "#b090c3",
  lav1: "#f1e8f6",
  lav2: "#e4d4ee",
  lav3: "#cdb4de",
  sun: "#ffd068",
  sun1: "#fff1cc",
  white: "#fefeff",
  canvas: "#fbf9fc",
};

// Leaf silhouette echoing the identity's cover artwork
const leaf = (x, y, s, rot, fill, opacity = 1) =>
  `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" opacity="${opacity}">
     <path d="M0 0 C 120 -40 260 20 300 180 C 150 200 30 130 0 0 Z" fill="${fill}"/>
     <path d="M20 12 C 110 60 200 120 280 172" stroke="${C.white}" stroke-opacity="0.35" stroke-width="6" fill="none"/>
   </g>`;

function container({ type, body, cap, label, labelText, title, sub, x = 500, y = 520 }) {
  const t = (txt, yy, size, color, weight = 700, ls = 2) =>
    `<text x="${x}" y="${yy}" text-anchor="middle" font-family="DejaVu Sans, Segoe UI, Arial, sans-serif" font-weight="${weight}" font-size="${size}" letter-spacing="${ls}" fill="${color}">${txt}</text>`;
  if (type === "jar") {
    return `
      <ellipse cx="${x}" cy="${y + 250}" rx="230" ry="26" fill="${C.plum}" opacity="0.12"/>
      <rect x="${x - 170}" y="${y - 250}" width="340" height="80" rx="18" fill="${cap}"/>
      <rect x="${x - 205}" y="${y - 175}" width="410" height="420" rx="60" fill="${body}"/>
      <rect x="${x - 205}" y="${y - 70}" width="410" height="210" fill="${label}"/>
      ${t(title, y + 10, 40, labelText)}
      ${t(sub, y + 62, 24, labelText, 400, 3)}
      <rect x="${x - 175}" y="${y - 150}" width="26" height="370" rx="13" fill="${C.white}" opacity="0.18"/>`;
  }
  if (type === "syrup") {
    return `
      <ellipse cx="${x}" cy="${y + 280}" rx="170" ry="22" fill="${C.plum}" opacity="0.12"/>
      <rect x="${x - 52}" y="${y - 330}" width="104" height="70" rx="12" fill="${cap}"/>
      <path d="M${x - 45} ${y - 262} h90 v60 c0 30 110 40 110 110 v360 a30 30 0 0 1 -30 30 h-250 a30 30 0 0 1 -30 -30 v-360 c0 -70 110 -80 110 -110 z" fill="${body}"/>
      <rect x="${x - 155}" y="${y - 20}" width="310" height="200" fill="${label}"/>
      ${t(title, y + 65, 36, labelText)}
      ${t(sub, y + 115, 22, labelText, 400, 3)}
      <rect x="${x - 125}" y="${y - 110}" width="20" height="360" rx="10" fill="${C.white}" opacity="0.2"/>`;
  }
  // bottle (capsules / tablets)
  return `
    <ellipse cx="${x}" cy="${y + 280}" rx="190" ry="24" fill="${C.plum}" opacity="0.12"/>
    <rect x="${x - 115}" y="${y - 300}" width="230" height="90" rx="16" fill="${cap}"/>
    <rect x="${x - 115}" y="${y - 300}" width="230" height="14" rx="7" fill="${C.white}" opacity="0.15"/>
    <rect x="${x - 170}" y="${y - 220}" width="340" height="500" rx="46" fill="${body}"/>
    <rect x="${x - 170}" y="${y - 90}" width="340" height="250" fill="${label}"/>
    ${t(title, y + 10, 38, labelText)}
    ${t(sub, y + 62, 23, labelText, 400, 3)}
    <rect x="${x - 140}" y="${y - 195}" width="22" height="440" rx="11" fill="${C.white}" opacity="0.18"/>`;
}

const products = [
  ["vitamin-d3-5000", "bottle", "VITAMIN D3", "5000 IU · 60", C.plum, C.sun, C.sun, C.plum],
  ["vitamin-c-1000", "bottle", "VITAMIN C", "1000 MG · 60", C.sun, C.plum, C.white, C.plum],
  ["daily-multivitamin", "bottle", "MULTI", "DAILY · 90", C.lav, C.plum, C.white, C.plum],
  ["vitamin-b12-1000", "bottle", "B12", "1000 MCG · 60", C.plum7, C.sun, C.lav1, C.plum],
  ["omega-3-fish-oil-1000", "bottle", "OMEGA 3", "1000 MG · 120", C.plum, C.lav, C.lav1, C.plum],
  ["magnesium-glycinate-400", "bottle", "MAGNESIUM", "400 MG · 90", C.white, C.plum, C.lav, C.plum],
  ["marine-collagen-peptides", "jar", "COLLAGEN", "MARINE · 300 G", C.white, C.sun, C.plum, C.white],
  ["zinc-50", "bottle", "ZINC", "50 MG · 100", C.lav3, C.plum, C.white, C.plum],
  ["apple-cider-vinegar-gummies", "jar", "ACV GUMMIES", "APPLE · 60", C.lav, C.plum, C.white, C.plum],
  ["iron-vitamin-syrup", "syrup", "IRON SYRUP", "250 ML", C.sun, C.plum, C.white, C.plum],
  ["honey-ginseng-tonic", "syrup", "HONEY GINSENG", "TONIC · 200 ML", C.plum7, C.sun, C.sun1, C.plum],
  // Real Nutriplus products — DEMO placeholders until real photos are uploaded from the admin
  ["nutriplus-chamomile-extract", "jar", "CHAMOMILE", "NUTRIPLUS", C.sun1, C.plum, C.white, C.plum],
  ["nutriplus-chicory-coffee-collagen", "jar", "CHICORY", "COLLAGEN · NUTRIPLUS", C.plum7, C.sun, C.lav1, C.plum],
  ["nutriplus-recharge", "bottle", "RECHARGE", "NUTRIPLUS", C.plum, C.sun, C.sun, C.plum],
];

const demoTag = `<text x="960" y="970" text-anchor="end" font-family="DejaVu Sans, Segoe UI, Arial, sans-serif" font-size="18" letter-spacing="3" fill="${C.plum}" opacity="0.35">DEMO IMAGE</text>`;

async function write(svg, file, width = 1000, height = 1000) {
  mkdirSync(dirname(file), { recursive: true });
  await sharp(Buffer.from(svg)).resize(width, height).webp({ quality: 86 }).toFile(file);
}

for (const [slug, type, title, sub, body, cap, label, labelText] of products) {
  const art = container({ type, body, cap, label, labelText, title, sub });
  const svg1 = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">
    <defs><radialGradient id="g" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="${C.white}"/><stop offset="1" stop-color="${C.lav1}"/></radialGradient></defs>
    <rect width="1000" height="1000" fill="url(#g)"/>
    ${leaf(640, 90, 1.25, 20, C.lav2)}
    ${leaf(60, 700, 0.9, -30, C.sun1)}
    ${art}${demoTag}</svg>`;
  const svg2 = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">
    <rect width="1000" height="1000" fill="${type === "syrup" ? C.sun1 : C.lav2}"/>
    ${leaf(-40, 120, 1.6, 10, C.white, 0.6)}
    <g transform="rotate(-8 500 520)">${art}</g>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${140 + i * 150}" y="${860 + (i % 2) * 30}" width="70" height="30" rx="15" fill="${i % 2 ? C.sun : C.plum}" opacity="0.85" transform="rotate(${i * 25 - 40} ${175 + i * 150} ${875})"/>`).join("")}
    ${demoTag}</svg>`;
  await write(svg1, out(`products/${slug}-1.webp`));
  await write(svg2, out(`products/${slug}-2.webp`));
}

const cats = [
  ["vitamins", C.sun1, container({ type: "bottle", body: C.plum, cap: C.sun, label: C.sun, labelText: C.plum, title: "VITAMINS", sub: "DAILY" })],
  ["supplements", C.lav1, container({ type: "bottle", body: C.white, cap: C.plum, label: C.lav, labelText: C.plum, title: "SUPPLEMENTS", sub: "ESSENTIALS" })],
  ["weight-loss", C.lav2, container({ type: "jar", body: C.lav, cap: C.plum, label: C.white, labelText: C.plum, title: "WEIGHT CARE", sub: "ROUTINE" })],
  ["tonics", C.sun1, container({ type: "syrup", body: C.plum7, cap: C.sun, label: C.sun1, labelText: C.plum, title: "TONICS", sub: "SYRUPS" })],
];
for (const [slug, bg, art] of cats) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">
    <rect width="1000" height="1000" fill="${bg}"/>${leaf(560, 60, 1.4, 25, C.white, 0.7)}${art}${demoTag}</svg>`;
  await write(svg, out(`categories/${slug}.webp`), 800, 800);
}

console.log("Placeholders generated.");
