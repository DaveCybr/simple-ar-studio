# Build stage - Use Debian-based image instead of Alpine
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --prefer-offline --no-audit

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install vite for preview server
RUN npm install vite --no-save

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/vite.config.ts ./vite.config.ts

# Expose port (Railway will set PORT env)
EXPOSE 8080

# Start the preview server
CMD npx vite preview --host 0.0.0.0 --port ${PORT:-8080}