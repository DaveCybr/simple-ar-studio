# Build stage
FROM node:20 AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install ALL dependencies including optional ones
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Install vite for preview server
RUN npm install -g vite

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/vite.config.ts ./vite.config.ts
COPY --from=builder /app/package.json ./package.json

# Expose port
EXPOSE 8080

# Start the preview server
CMD vite preview --host 0.0.0.0 --port ${PORT:-8080}