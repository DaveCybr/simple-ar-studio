# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --prefer-offline --no-audit

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install vite for preview server
RUN npm install vite --no-save

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/vite.config.ts ./vite.config.ts

# Expose port (Railway will set PORT env)
EXPOSE $PORT

# Start the preview server
CMD npx vite preview --host 0.0.0.0 --port ${PORT:-8080}