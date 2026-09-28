FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install --production

# Copy server code
COPY server.js ./

# Create persistent storage mount directory
RUN mkdir -p /app/storage/uploads

# Expose default port
EXPOSE 3001

ENV PORT=3001
ENV UPLOAD_DIR=/app/storage/uploads

CMD ["node", "server.js"]
