# ====================== Stage 1: Build ======================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# ====================== Stage 2: Production ======================
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install necessary system dependencies (if needed)
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs expressuser

# Copy node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application files
COPY . .

# Change ownership to non-root user
RUN chown -R expressuser:nodejs /app

# Switch to non-root user
USER expressuser

# Expose port
EXPOSE 8000

# Environment variables
ENV NODE_ENV=production
ENV PORT=8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000 || exit 1

# Start the application
CMD ["node", "app.js"]
