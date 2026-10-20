# ==============================================================================
# Practical 11: Containerization with Docker & Docker Compose
# Student: Manav Lathiya (24CS048)
# Multi-stage Dockerfile for React (Vite) Frontend
# ==============================================================================

# Stage 1: Build the React Application (Node 20+ required for Vite 8 / Rolldown)
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency manifests and install all build tools
COPY package*.json ./
RUN npm install

# Copy application source code and compile production bundle
COPY . .
RUN npm run build

# Stage 2: Production Runtime Stage (Supplementary Problem: Multi-stage build)
FROM node:20-alpine AS production

WORKDIR /app

# Install runtime dependencies including Vite preview runner
COPY package*.json ./
RUN npm install

# Copy compiled dist from build stage
COPY --from=build /app/dist ./dist

# Expose Vite preview port
EXPOSE 5173

# Serve production build using Vite preview accessible across Docker bridge network
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
