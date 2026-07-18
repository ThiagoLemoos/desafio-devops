# Stage 1: Builder
FROM node:24-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies with npm install (no package-lock.json exists)
RUN npm install --omit=dev --ignore-scripts && \
    npm cache clean --force

# Copy application source
COPY . .

# Stage 2: Runtime
FROM node:24-alpine AS runtime

WORKDIR /usr/src/app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy dependencies and application from builder
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/node_modules ./node_modules/
COPY --from=builder --chown=nodejs:nodejs /usr/src/app ./

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

EXPOSE 3000

CMD ["node", "index.js"]
