FROM mysql:5.7

# Add labels for metadata
LABEL maintainer="devops-team" \
      version="1.0" \
      description="MySQL database for desafio-devops"

# Copy initialization scripts
COPY init.sql /docker-entrypoint-initdb.d/

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD} || exit 1