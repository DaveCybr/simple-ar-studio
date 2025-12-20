# Build stage
FROM node:20 AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# SOLUSI: Paksa install platform-specific dependency yang hilang
# Ini mengatasi bug npm terkait optional dependencies di Docker
RUN npm install @rollup/rollup-linux-x64-gnu
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Gunakan 'serve' atau 'http-server' sebagai alternatif yang lebih ringan dari vite full
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 8080

# Jalankan server statis (lebih stabil untuk produksi dibanding 'vite preview')
CMD ["serve", "-s", "dist", "-l", "8080"]
