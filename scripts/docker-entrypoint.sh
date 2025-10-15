#!/bin/sh
set -e

# Enhanced Docker entrypoint script for Hasivu Platform
# Optimized for production performance and blue-green deployments

echo "🚀 Starting Hasivu Platform (Optimized)..."

# Environment variables with defaults
BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-3000}
HEALTH_CHECK_TIMEOUT=${HEALTH_CHECK_TIMEOUT:-60}
STARTUP_TIMEOUT=${STARTUP_TIMEOUT:-120}

# Function to log with timestamps
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check service health
check_health() {
    local service=$1
    local url=$2
    local timeout=$3
    local start_time=$(date +%s)

    log "Checking $service health at $url..."

    while true; do
        if curl -f --max-time 5 --silent "$url" > /dev/null 2>&1; then
            local elapsed=$(( $(date +%s) - start_time ))
            log "✅ $service is healthy after ${elapsed}s"
            return 0
        fi

        local elapsed=$(( $(date +%s) - start_time ))
        if [ $elapsed -ge $timeout ]; then
            log "❌ $service health check timed out after ${elapsed}s"
            return 1
        fi

        sleep 2
    done
}

# Pre-startup checks
log "Running pre-startup checks..."

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    log "⚠️  Warning: DATABASE_URL not set"
fi

if [ -z "$REDIS_URL" ]; then
    log "⚠️  Warning: REDIS_URL not set"
fi

# Run database migrations with retry logic
log "Running database migrations..."
MAX_RETRIES=3
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if npx prisma migrate deploy --schema=./prisma/schema.prisma; then
        log "✅ Database migrations completed successfully"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            log "⚠️  Database migration failed, retrying in 5 seconds... ($RETRY_COUNT/$MAX_RETRIES)"
            sleep 5
        else
            log "❌ Database migration failed after $MAX_RETRIES attempts"
            exit 1
        fi
    fi
done

# Generate Prisma client if needed
if [ ! -d "node_modules/.prisma" ]; then
    log "Generating Prisma client..."
    npx prisma generate
fi

# Start backend server with optimized settings
log "Starting backend server on port $BACKEND_PORT..."
export PORT=$BACKEND_PORT
export NODE_ENV=production

# Use exec to replace shell process for better signal handling
node dist/index.js &
BACKEND_PID=$!

# Wait for backend to be ready with timeout
if ! check_health "Backend" "http://localhost:$BACKEND_PORT/health" $HEALTH_CHECK_TIMEOUT; then
    log "❌ Backend failed to start properly"
    kill -TERM $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Start frontend server
log "Starting frontend server on port $FRONTEND_PORT..."
cd web
export PORT=$FRONTEND_PORT

# Start frontend with production settings
npm start &
FRONTEND_PID=$!

# Wait for frontend to be ready
if ! check_health "Frontend" "http://localhost:$FRONTEND_PORT/api/health" $HEALTH_CHECK_TIMEOUT; then
    log "❌ Frontend failed to start properly"
    kill -TERM $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

log "🎉 All services started successfully!"
log "📊 Backend: http://localhost:$BACKEND_PORT"
log "🌐 Frontend: http://localhost:$FRONTEND_PORT"

# Function to handle graceful shutdown
shutdown() {
    log "🛑 Received shutdown signal, stopping services gracefully..."

    # Stop frontend first
    if kill -TERM $FRONTEND_PID 2>/dev/null; then
        log "Waiting for frontend to stop..."
        wait $FRONTEND_PID 2>/dev/null || true
        log "✅ Frontend stopped"
    fi

    # Stop backend
    if kill -TERM $BACKEND_PID 2>/dev/null; then
        log "Waiting for backend to stop..."
        wait $BACKEND_PID 2>/dev/null || true
        log "✅ Backend stopped"
    fi

    log "👋 Shutdown complete"
    exit 0
}

# Function to handle health check failures
health_check_failure() {
    log "💥 Health check failed, initiating emergency shutdown..."
    shutdown
}

# Trap signals for graceful shutdown
trap shutdown SIGTERM SIGINT SIGQUIT
trap health_check_failure SIGUSR1

# Periodic health monitoring (optional background process)
if [ "$ENABLE_HEALTH_MONITORING" = "true" ]; then
    (
        while true; do
            sleep 30
            if ! curl -f --max-time 5 --silent "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; then
                log "💥 Backend health check failed, triggering shutdown..."
                kill -USR1 $$
                break
            fi
            if ! curl -f --max-time 5 --silent "http://localhost:$FRONTEND_PORT/api/health" > /dev/null 2>&1; then
                log "💥 Frontend health check failed, triggering shutdown..."
                kill -USR1 $$
                break
            fi
        done
    ) &
    MONITOR_PID=$!
fi

# Wait for processes
log "⏳ Services are running, waiting for termination signal..."
wait $BACKEND_PID $FRONTEND_PID

# Clean up monitor process if it exists
if [ -n "$MONITOR_PID" ]; then
    kill $MONITOR_PID 2>/dev/null || true
fi

log "🏁 Entrypoint script finished"
