# Practical 11: Containerization with Docker and Docker Compose
**Course**: Advanced Web Development Frameworks (ITUE301)  
**Student**: Manav Lathiya (ID: 24CS048)  
**Department**: Department of Computer Science & Engineering, CSPIT, CHARUSAT  
**Repository**: [24CS048Manav/ITUE301-AWDF_Practical11](https://github.com/24CS048Manav/ITUE301-AWDF_Practical11)

---

## 1. Practical Overview & Objectives
- **Course Outcome (CO)**: CO5 / PO3, PO5
- **Objective**: Containerize the complete full-stack Task Management application (React frontend, Node.js/Express backend, MongoDB database) into isolated microservice containers and orchestrate them using **Docker Compose** on an isolated bridge network with persistent volume storage.

---

## 2. Multi-Container Architecture Diagram

```
                 HOST MACHINE (Browser / REST Client)
                   │                          │
        Port 5173  │                          │ Port 5000
                   ▼                          ▼
       ┌───────────────────────┐  ┌───────────────────────┐
       │   Frontend Container  │  │   Backend Container   │
       │(task_manager_frontend)│  │(task_manager_backend) │
       │  React (Vite Preview) │  │  Node.js / Express    │
       │    Port 5173:5173     │  │    Port 5000:5000     │
       └───────────────────────┘  └───────────┬───────────┘
                   │                          │
                   │                          │ mongodb://mongodb:27017
                   │   Docker Bridge Network  │ (Docker DNS resolution)
                   │       (app-network)      │
                   └──────────────────────────┼──────────┐
                                              ▼          │
                                 ┌───────────────────────┴┐
                                 │   MongoDB Container    │
                                 │ (task_manager_mongodb) │
                                 │   Official mongo image │
                                 │      Port 27017        │
                                 └────────────┬───────────┘
                                              │
                                              ▼
                                 ┌────────────────────────┐
                                 │      Named Volume      │
                                 │     (mongodb_data)     │
                                 │      /data/db          │
                                 └────────────────────────┘
```

---

## 3. Core Implementation Details

### A. Backend Dockerfile (`backend/Dockerfile`)
Uses `node:18-alpine` for a lightweight runtime, sets working directory, copies dependency manifests (`package*.json`) first to maximize Docker layer cache efficiency, installs dependencies, copies source code, and exposes port 5000.
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

### B. Frontend Multi-Stage Dockerfile (`frontend/Dockerfile`)
Implements a 2-stage multi-stage build to minimize the final container image footprint:
- **Stage 1 (Build)**: Installs devDependencies, compiles the Vite React production bundle into `/app/dist`.
- **Stage 2 (Production)**: Copies only runtime dependencies and compiled `/app/dist` assets, executing `npm run preview -- --host 0.0.0.0 --port 5173`.
```dockerfile
# Stage 1: Build Stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production Runtime Stage
FROM node:18-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
```

### C. Docker Compose Orchestration (`docker-compose.yml`)
Orchestrates all 3 services (`mongodb`, `backend`, `frontend`) under a single command:
```yaml
services:
  mongodb:
    image: mongo:latest
    container_name: task_manager_mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    networks:
      - app-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: task_manager_backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - MONGO_URI=mongodb://mongodb:27017/task_manager_24cs048
      - JWT_SECRET=supersecretjwtkey_24cs048_manav_practical11
    depends_on:
      - mongodb
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: task_manager_frontend
    restart: unless-stopped
    ports:
      - "5173:5173"
    depends_on:
      - backend
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  mongodb_data:
    driver: local
```

---

## 4. Supplementary Problems Solutions

| # | Supplementary Problem | Implementation Solution |
| :--- | :--- | :--- |
| **1** | **Context Exclusion (`.dockerignore`)** | Created `.dockerignore` in root, `backend/`, and `frontend/` excluding `node_modules`, `.env`, `.git`, and `dist`. This prevents bloated build contexts, protects secrets, and avoids architecture-mismatched native binaries. |
| **2** | **Multi-Stage Frontend Build** | Created two separate build targets (`AS build` and `AS production`) in `frontend/Dockerfile`. Unused build-time tools (`@vitejs/plugin-react`, `oxlint`, TypeScript definitions) are stripped from the final runtime container. |
| **3** | **Persistent Storage for MongoDB** | Configured named volume `mongodb_data` mapped to `/data/db`. Database state and user tasks persist cleanly across container stop/rebuild/restart cycles. |

---

## 5. Answers to Key Analysis Questions (Viva Preparation)

### Q1: Why does the backend container need to reference the MongoDB container by its service name (`mongodb`) rather than `localhost`?
> In Docker, each container operates in its own isolated network namespace with its own `localhost` (loopback interface `127.0.0.1`). If the backend attempted to connect to `localhost:27017`, it would query its own container rather than the database container. By attaching both containers to a user-defined bridge network (`app-network`), Docker Compose activates an embedded DNS server that automatically resolves service names (e.g., `mongodb`) to the respective container's internal IP address.

### Q2: What is the difference between `EXPOSE` in a Dockerfile and the `ports` mapping in `docker-compose.yml`?
> - `EXPOSE <port>` in a Dockerfile serves primarily as documentation and metadata. It informs container engines that the container listens on that port at runtime, but **does not publish or open the port to the host machine**.
> - `ports: - "<HOST>:<CONTAINER>"` in `docker-compose.yml` creates an active network port-forwarding rule (via iptables/Windows NAT) that maps a host machine port to the container port, allowing external host browsers and clients to communicate with the containerized service.

### Q3: Why is it considered bad practice to copy `node_modules` into a Docker image instead of running `npm install` inside the container?
> 1. **OS / Architecture Mismatch**: Host machines often run different operating systems (e.g., Windows x64 or macOS ARM64) than the container Linux environment (`node:18-alpine`). Native compiled C++ bindings (e.g., `bcrypt`, `node-gyp`) compiled on the host will fail inside Linux.
> 2. **Build Context Bloat**: Copying hundreds of megabytes of `node_modules` through Docker's build context drastically slows down build and image transfer times.
> 3. **Layer Caching Invalidation**: Running `COPY package*.json ./` followed by `RUN npm install` allows Docker to cache dependencies indefinitely until `package.json` actually changes.

---

## 6. Verification Commands

1. **Verify Docker & Docker Compose Installation**:
   ```bash
   docker --version
   docker compose version
   ```
2. **Start All Services in Single Command**:
   ```bash
   docker-compose up --build
   ```
   *(or `docker compose up --build -d` for detached background execution)*
3. **Verify Running Containers**:
   ```bash
   docker ps
   ```
4. **Access the Applications**:
   - Frontend UI: `http://localhost:5173`
   - Backend API Overview: `http://localhost:5000/`
   - Health Probe: `http://localhost:5000/health`
5. **Stop All Containers**:
   ```bash
   docker-compose down
   ```
