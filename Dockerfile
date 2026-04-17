# Use an official Node.js 18 runtime (matches backend package engines).
FROM node:18-alpine

# Work from project root so backend code and static frontend files are available.
WORKDIR /app

# Copy only backend dependency manifests first to leverage Docker layer caching.
COPY backend/package*.json ./backend/

# Install production dependencies for the backend service.
RUN cd backend && npm ci --omit=dev

# Copy the full project (backend + static files served by backend/server.js).
COPY . .

# Switch into backend runtime directory.
WORKDIR /app/backend

# Ensure SQLite folder exists (backend/db.js stores store.db here).
RUN mkdir -p data

# Document app port.
EXPOSE 3000

# Start the backend server.
CMD ["npm", "start"]
