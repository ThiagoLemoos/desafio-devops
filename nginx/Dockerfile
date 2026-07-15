FROM nginx:1.25-alpine

# Add labels for metadata
LABEL maintainer="devops-team" \
      version="1.0" \
      description="Nginx reverse proxy for desafio-devops"

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
