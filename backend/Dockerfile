# Practical 11: Containerization with Docker & Docker Compose
# Student: Manav Lathiya (24CS048)
# Node.js backend container definition

FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy dependency manifests first to leverage Docker layer caching
COPY package*.json ./

# Install application dependencies inside container
RUN npm install

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 5000

# Start Node.js Express server
CMD ["node", "server.js"]
