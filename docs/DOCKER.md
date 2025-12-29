# Docker Setup Documentation

This document provides a comprehensive guide to understanding and using the Docker setup for the Next.js pharma-aggregator-client application.

## Table of Contents

1. [Overview](#overview)
2. [How the Next.js Application is Built Inside Docker](#how-the-nextjs-application-is-built-inside-docker)
3. [How the Container Starts and Runs the Application](#how-the-container-starts-and-runs-the-application)
4. [How to Build and Run the Docker Image Locally](#how-to-build-and-run-the-docker-image-locally)
5. [Dockerfile Structure Explained](#dockerfile-structure-explained)
6. [Troubleshooting](#troubleshooting)

## Overview

This Next.js application is containerized using a multi-stage Docker build process. The Docker setup ensures that the application runs consistently across different environments and provides an optimized production build.

### Key Features

- **Multi-stage build**: Reduces final image size by separating build dependencies from runtime
- **Standalone output**: Uses Next.js standalone mode for minimal production builds
- **Security**: Runs as a non-root user inside the container
- **Optimized**: Only includes necessary files in the final image

## How the Next.js Application is Built Inside Docker

The Docker build process uses a **multi-stage build** approach with three distinct stages:

### Stage 1: Dependencies (`deps`)

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
```

**What happens:**
1. Starts with a Node.js 20 Alpine Linux base image (lightweight)
2. Sets the working directory to `/app`
3. Copies only `package.json` and `package-lock.json` files
4. Runs `npm ci` to install dependencies in a clean, reproducible way

**Why this stage exists:**
- Docker can cache this layer separately from application code
- If dependencies don't change, Docker reuses the cached layer, speeding up builds
- Only installs production dependencies needed for the build

### Stage 2: Builder

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
```

**What happens:**
1. Creates a new stage from the same base image
2. Copies the `node_modules` from the `deps` stage (avoids reinstalling)
3. Copies all application source code
4. Sets environment variables:
   - `NODE_ENV=production`: Optimizes Next.js for production builds
   - `NEXT_TELEMETRY_DISABLED=1`: Disables Next.js telemetry
5. Runs `npm run build` which executes `next build`

**During `next build`:**
- Next.js compiles TypeScript/JavaScript code
- Optimizes React components
- Generates static pages where possible
- Creates the `.next` directory with:
  - `standalone/`: Minimal production server files
  - `static/`: Static assets (CSS, images, etc.)
  - Build artifacts and optimized bundles

**Important:** The `next.config.ts` file has `output: 'standalone'` configured, which tells Next.js to create a minimal production build that includes only the necessary files and dependencies.

### Stage 3: Runner (Production)

```dockerfile
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
```

**What happens:**
1. Creates a minimal runtime environment
2. Sets up a non-root user (`nextjs`) for security
3. Copies only the necessary files:
   - `public/`: Static public assets
   - `.next/standalone/`: The minimal production server (includes `server.js`)
   - `.next/static/`: Static assets generated during build
4. Changes ownership to the non-root user
5. Switches to the non-root user
6. Exposes port 3000
7. Sets environment variables for the server
8. Starts the application with `node server.js`

**Why this approach:**
- Final image is much smaller (doesn't include build tools, source code, or dev dependencies)
- More secure (runs as non-root user)
- Faster container startup
- Only includes what's needed to run the application

## How the Container Starts and Runs the Application

### Container Initialization

1. **Image Pull/Start**: When you run `docker run`, Docker:
   - Loads the built image (or pulls it from a registry)
   - Creates a new container instance
   - Sets up the filesystem with the copied files

2. **Environment Setup**: The container:
   - Sets `NODE_ENV=production`
   - Sets `PORT=3000` and `HOSTNAME="0.0.0.0"` (allows external connections)
   - Initializes the working directory `/app`

3. **User Context**: The container runs as the `nextjs` user (UID 1001), not root, for security

### Application Startup

When the container starts, it executes:

```bash
node server.js
```

**What `server.js` does:**
- This file is generated by Next.js during the build process (in the standalone output)
- It's a minimal HTTP server that:
  - Serves the Next.js application
  - Handles routing for both static and dynamic pages
  - Manages server-side rendering (SSR) and API routes
  - Serves static assets from the `.next/static` directory

**Server Behavior:**
- Listens on `0.0.0.0:3000` (accessible from outside the container)
- Handles incoming HTTP requests
- Processes Next.js pages, API routes, and static files
- Manages React Server Components and Server Actions

### Request Flow

1. **External Request** → Docker port mapping (e.g., `localhost:3000` → container `3000`)
2. **Container Network** → Request reaches the Node.js server
3. **Next.js Server** → Processes the request:
   - Static files: Served directly
   - Pages: Rendered server-side or client-side as configured
   - API Routes: Executed server-side
4. **Response** → Sent back through the container network to the host

## How to Build and Run the Docker Image Locally

### Prerequisites

- Docker installed on your machine ([Download Docker](https://www.docker.com/get-started))
- Docker Desktop running (if on Windows/Mac)

### Step 1: Build the Docker Image

Navigate to the project root directory and run:

```bash
docker build -t pharma-aggregator-client:latest .
```

**What this does:**
- `-t pharma-aggregator-client:latest`: Tags the image with name `pharma-aggregator-client` and tag `latest`
- `.`: Uses the current directory as the build context (Docker reads the Dockerfile from here)

**Build Process:**
1. Docker reads the `Dockerfile`
2. Executes each stage sequentially:
   - Builds the `deps` stage (installs dependencies)
   - Builds the `builder` stage (compiles the Next.js app)
   - Builds the `runner` stage (creates the final image)
3. Creates the final image with all layers

**Expected Output:**
```
[+] Building 45.2s (15/15) FINISHED
 => [deps 1/4] FROM docker.io/library/node:20-alpine
 => [deps 2/4] WORKDIR /app
 => [deps 3/4] COPY package.json package-lock.json* ./
 => [deps 4/4] RUN npm ci
 => [builder 1/5] FROM docker.io/library/node:20-alpine
 => [builder 2/5] COPY --from=deps /app/node_modules ./node_modules
 => [builder 3/5] COPY . .
 => [builder 4/5] RUN npm run build
 => [runner 1/8] FROM docker.io/library/node:20-alpine
 => [runner 2/8] WORKDIR /app
 => [runner 3/8] RUN addgroup --system --gid 1001 nodejs
 => [runner 4/8] RUN adduser --system --uid 1001 nextjs
 => [runner 5/8] COPY --from=builder /app/public ./public
 => [runner 6/8] COPY --from=builder /app/.next/standalone ./
 => [runner 7/8] COPY --from=builder /app/.next/static ./.next/static
 => [runner 8/8] RUN chown -R nextjs:nodejs /app
 => exporting to image
 => => exporting layers
 => => writing image sha256:...
 => => naming to docker.io/library/pharma-aggregator-client:latest
```

**Build Time:** First build may take 2-5 minutes. Subsequent builds are faster due to Docker layer caching.

### Step 2: Verify the Image was Created

```bash
docker images | grep pharma-aggregator-client
```

You should see your image listed with its size (typically 200-400 MB for a Next.js app).

### Step 3: Run the Docker Container

```bash
docker run -p 3000:3000 pharma-aggregator-client:latest
```

**What this does:**
- `-p 3000:3000`: Maps port 3000 from the container to port 3000 on your host machine
  - Format: `host_port:container_port`
  - You can change the host port: `-p 8080:3000` would make it accessible on `localhost:8080`
- `pharma-aggregator-client:latest`: The image to run

**Expected Output:**
```
> Ready on http://0.0.0.0:3000
```

### Step 4: Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

You should see your Next.js application running!

### Step 5: Stop the Container

Press `Ctrl+C` in the terminal where the container is running, or in another terminal:

```bash
docker ps
# Note the CONTAINER ID
docker stop <CONTAINER_ID>
```

### Running in Detached Mode (Background)

To run the container in the background:

```bash
docker run -d -p 3000:3000 --name pharma-client pharma-aggregator-client:latest
```

**Flags:**
- `-d`: Detached mode (runs in background)
- `--name pharma-client`: Gives the container a friendly name

**To view logs:**
```bash
docker logs pharma-client
```

**To stop:**
```bash
docker stop pharma-client
```

**To remove:**
```bash
docker rm pharma-client
```

## Dockerfile Structure Explained

### Multi-Stage Build Benefits

1. **Smaller Final Image**: Only includes runtime dependencies, not build tools
2. **Faster Builds**: Docker caches each stage independently
3. **Security**: Build tools aren't included in the production image
4. **Separation of Concerns**: Clear distinction between build and runtime

### Key Configuration Choices

#### Base Image: `node:20-alpine`
- **Alpine Linux**: Minimal Linux distribution (~5MB base)
- **Node.js 20**: Latest LTS version with good performance
- **Result**: Small, secure, and efficient image

#### Standalone Output Mode
- Configured in `next.config.ts` with `output: 'standalone'`
- Next.js creates a minimal server with only required dependencies
- Reduces image size significantly compared to including all `node_modules`

#### Non-Root User
- Security best practice
- If the container is compromised, attacker has limited privileges
- Uses UID/GID 1001 (standard for Node.js applications)

#### Port Configuration
- `EXPOSE 3000`: Documents that the app uses port 3000
- `ENV PORT=3000`: Sets the port environment variable
- `ENV HOSTNAME="0.0.0.0"`: Allows connections from outside the container

## Troubleshooting

### Docker Desktop Not Running (Windows/Mac)

**Error:** `error during connect: open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`

**Problem:** Docker Desktop is not running or hasn't fully initialized.

**Solutions:**

1. **Start Docker Desktop:**
   - **Windows:** Open Docker Desktop from the Start menu or run:
     ```powershell
     Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
     ```
   - **Mac:** Open Docker Desktop from Applications or Spotlight
   - Wait 30-60 seconds for Docker Desktop to fully start

2. **Verify Docker is running:**
   ```bash
   docker version
   ```
   You should see both Client and Server version information. If you only see Client info, Docker Desktop is still starting.

3. **Check Docker Desktop status:**
   - Look for the Docker icon in your system tray (Windows) or menu bar (Mac)
   - The icon should be steady (not animating) when Docker is ready
   - Click the icon to open Docker Desktop and check its status

4. **PowerShell script to wait for Docker (Windows):**
   ```powershell
   Write-Host "Waiting for Docker Desktop to start..."
   $maxAttempts = 12
   $attempt = 0
   while ($attempt -lt $maxAttempts) {
       $attempt++
       try {
           docker version 2>&1 | Out-Null
           if ($LASTEXITCODE -eq 0) {
               Write-Host "Docker Desktop is ready!"
               break
           }
       } catch { }
       Write-Host "Waiting... ($attempt/$maxAttempts)"
       Start-Sleep -Seconds 5
   }
   ```

5. **If Docker Desktop won't start:**
   - Restart your computer
   - Check if virtualization is enabled in BIOS (required for Docker Desktop)
   - Reinstall Docker Desktop if the problem persists

### Build Fails with "npm ci" Error

**Problem:** Dependency installation fails

**Solutions:**
- Ensure `package-lock.json` exists and is up to date
- Run `npm install` locally to regenerate `package-lock.json`
- Check for network issues (npm registry access)

### Build Fails During "next build"

**Problem:** TypeScript or build errors

**Solutions:**
- Fix any TypeScript errors in your code
- Ensure all dependencies are properly installed
- Check `next.config.ts` for configuration issues
- Build locally first: `npm run build` to see detailed errors

### Container Starts but Can't Access Application

**Problem:** Port mapping issue or application not listening correctly

**Solutions:**
- Verify port mapping: `docker ps` should show `0.0.0.0:3000->3000/tcp`
- Check if port 3000 is already in use: `netstat -an | grep 3000` (Linux/Mac) or `netstat -an | findstr 3000` (Windows)
- Use a different host port: `docker run -p 8080:3000 ...`
- Check container logs: `docker logs <CONTAINER_ID>`

### "Permission Denied" Errors

**Problem:** File permission issues

**Solutions:**
- The Dockerfile sets proper ownership with `chown -R nextjs:nodejs /app`
- If issues persist, check that the base image supports the user creation commands
- On some systems, you may need to adjust file permissions on the host

### Application Runs but Shows Errors

**Problem:** Runtime errors in the application

**Solutions:**
- Check container logs: `docker logs <CONTAINER_ID>`
- Verify environment variables are set correctly
- Ensure all required files are copied in the Dockerfile
- Test the application locally first: `npm run build && npm start`

### Image Size is Too Large

**Problem:** Final image is unexpectedly large

**Solutions:**
- Verify `.dockerignore` is working (check what's being copied)
- Ensure you're using the multi-stage build correctly
- Check that `output: 'standalone'` is set in `next.config.ts`
- Remove unnecessary files from the build context

## Docker Commands Reference

This section provides a comprehensive reference of Docker commands useful for working with this project.

### Container Management

#### List Containers
```bash
# Running containers only
docker ps

# All containers (including stopped)
docker ps -a

# Container IDs only
docker ps -q

# Custom format (names, status, ports)
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

#### Container Lifecycle
```bash
# Start a stopped container
docker start <CONTAINER_ID_OR_NAME>

# Stop a running container
docker stop <CONTAINER_ID_OR_NAME>

# Restart a container
docker restart <CONTAINER_ID_OR_NAME>

# Remove a stopped container
docker rm <CONTAINER_ID_OR_NAME>

# Force remove a running container
docker rm -f <CONTAINER_ID_OR_NAME>

# Remove all stopped containers
docker container prune
```

#### Run Container
```bash
# Foreground (see logs)
docker run -p 3000:3000 pharma-aggregator-client:latest

# Background (detached)
docker run -d -p 3000:3000 --name pharma-client pharma-aggregator-client:latest

# With environment variable
docker run -p 3000:3000 -e NEXT_PUBLIC_BACKEND_URL=http://localhost:8000 pharma-aggregator-client:latest

# With environment file
docker run -p 3000:3000 --env-file .env pharma-aggregator-client:latest

# Custom port mapping
docker run -p 8080:3000 pharma-aggregator-client:latest
```

### Image Management

#### List Images
```bash
docker images

# Filter by name
docker images pharma-aggregator-client
```

#### Build Images
```bash
# Standard build
docker build -t pharma-aggregator-client:latest .

# Build without cache
docker build --no-cache -t pharma-aggregator-client:latest .

# Build with progress output
docker build --progress=plain -t pharma-aggregator-client:latest .

# Build with build arguments
docker build --build-arg NODE_ENV=production -t pharma-aggregator-client:latest .
```

#### Remove Images
```bash
# Remove specific image
docker rmi pharma-aggregator-client:latest

# Force remove (even if in use)
docker rmi -f pharma-aggregator-client:latest

# Remove all unused images
docker image prune -a
```

#### Inspect Images
```bash
# View image details
docker inspect pharma-aggregator-client:latest

# View image layers/history
docker history pharma-aggregator-client:latest

# View image size
docker images pharma-aggregator-client:latest
```

### Logs and Debugging

#### View Logs
```bash
# View logs
docker logs <CONTAINER_ID_OR_NAME>

# Follow logs (real-time)
docker logs -f <CONTAINER_ID_OR_NAME>

# Last N lines
docker logs --tail 100 <CONTAINER_ID_OR_NAME>

# With timestamps
docker logs -t <CONTAINER_ID_OR_NAME>

# Since specific time
docker logs --since 2024-01-01T00:00:00 <CONTAINER_ID_OR_NAME>
```

#### Container Inspection
```bash
# View container details
docker inspect <CONTAINER_ID_OR_NAME>

# View container stats (CPU, memory, network)
docker stats <CONTAINER_ID_OR_NAME>

# View all containers stats
docker stats

# Execute command in running container
docker exec -it <CONTAINER_ID_OR_NAME> /bin/sh

# Execute command non-interactively
docker exec <CONTAINER_ID_OR_NAME> ls -la
```

### System Management

#### System Information
```bash
# Docker version
docker version

# Docker system info
docker info

# Disk usage
docker system df

# Detailed disk usage
docker system df -v
```

#### Cleanup Commands
```bash
# Remove all stopped containers, unused networks, images, and build cache
docker system prune -a

# Include volumes (⚠️ Warning: removes all unused volumes)
docker system prune -a --volumes

# Remove only stopped containers
docker container prune

# Remove only unused images
docker image prune

# Remove only unused volumes
docker volume prune
```

⚠️ **Warning:** `docker system prune -a` removes all unused containers, networks, images, and build cache. Use with caution!

### Network Management

#### Network Commands
```bash
# List networks
docker network ls

# Inspect network
docker network inspect bridge

# Create network
docker network create my-network

# Connect container to network
docker network connect my-network <CONTAINER_ID>

# Disconnect container from network
docker network disconnect my-network <CONTAINER_ID>

# Remove network
docker network rm my-network
```

### Help and Documentation

#### Get Help
```bash
# General help
docker --help

# Command-specific help
docker build --help
docker run --help
docker ps --help
docker logs --help
```

#### Search Docker Hub
```bash
# Search for images
docker search node
docker search nextjs
```

### Useful Command Combinations

#### Build and Run
```bash
docker build -t pharma-aggregator-client:latest . && docker run -d -p 3000:3000 --name pharma-client pharma-aggregator-client:latest
```

#### Stop and Remove
```bash
docker stop pharma-client && docker rm pharma-client
```

#### Rebuild and Restart
```bash
docker stop pharma-client && docker rm pharma-client && docker build -t pharma-aggregator-client:latest . && docker run -d -p 3000:3000 --name pharma-client pharma-aggregator-client:latest
```

#### View Logs and Container Status
```bash
docker ps && docker logs pharma-client
```

#### Clean Everything and Rebuild
```bash
docker stop $(docker ps -aq) && docker rm $(docker ps -aq) && docker rmi pharma-aggregator-client:latest && docker build -t pharma-aggregator-client:latest .
```

### PowerShell-Specific Commands (Windows)

#### Check Docker Status
```powershell
docker version
```

#### Start Docker Desktop
```powershell
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

#### Wait for Docker to be Ready
```powershell
$maxAttempts = 12
$attempt = 0
while ($attempt -lt $maxAttempts) {
    $attempt++
    try {
        docker version 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Docker Desktop is ready!"
            break
        }
    } catch { }
    Write-Host "Waiting... ($attempt/$maxAttempts)"
    Start-Sleep -Seconds 5
}
```

### Common Workflows

#### Development Workflow
```bash
# 1. Build the image
docker build -t pharma-aggregator-client:latest .

# 2. Run the container
docker run -d -p 3000:3000 --name pharma-client pharma-aggregator-client:latest

# 3. Check logs
docker logs -f pharma-client

# 4. Stop when done
docker stop pharma-client
```

#### Debugging Workflow
```bash
# 1. Check if container is running
docker ps

# 2. View logs
docker logs pharma-client

# 3. Check container stats
docker stats pharma-client

# 4. Execute shell in container
docker exec -it pharma-client /bin/sh
```

#### Cleanup Workflow
```bash
# 1. Stop all containers
docker stop $(docker ps -aq)

# 2. Remove all containers
docker rm $(docker ps -aq)

# 3. Remove image
docker rmi pharma-aggregator-client:latest

# 4. Clean system (optional)
docker system prune -a
```

## Environment Variables

### Using Environment Variables in Next.js

The project includes a `.env` file for local development and a `.env.example` template file.

#### Local Development

1. Copy `.env.example` to `.env` (if not already created):
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set your backend URL:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   ```

3. Restart your development server:
   ```bash
   npm run dev
   ```

#### Important Notes

- **`NEXT_PUBLIC_` prefix**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser and can be accessed in client-side code
- **Server-side only**: Variables without the prefix are only available in server-side code (API routes, Server Components, etc.)
- **Build-time vs Runtime**: `NEXT_PUBLIC_` variables are embedded at build time. For runtime changes, you'll need to rebuild

#### Using Environment Variables in Code

**Client-side (browser):**
```typescript
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
```

**Server-side only:**
```typescript
const backendUrl = process.env.BACKEND_URL;
```

### Docker and Environment Variables

#### Option 1: Pass Environment Variables at Runtime

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_BACKEND_URL=http://your-backend-url:8000 \
  pharma-aggregator-client:latest
```

#### Option 2: Use an Environment File

Create a `.env.production` file (or any name) and pass it to Docker:

```bash
docker run -p 3000:3000 \
  --env-file .env.production \
  pharma-aggregator-client:latest
```

#### Option 3: Build-time Environment Variables

If you need environment variables at build time (for `NEXT_PUBLIC_` variables), pass them during the build:

```bash
docker build \
  --build-arg NEXT_PUBLIC_BACKEND_URL=http://your-backend-url:8000 \
  -t pharma-aggregator-client:latest .
```

**Note:** For `NEXT_PUBLIC_` variables, you typically need to rebuild the image when they change, as they're embedded during the build process.

#### Docker Compose Example

Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_BACKEND_URL=http://backend:8000
    env_file:
      - .env.production
```

Then run:
```bash
docker-compose up
```

## Next Steps

- **Docker Compose**: Consider creating a `docker-compose.yml` for easier orchestration
- **Volume Mounting**: Mount volumes for persistent data if needed
- **Health Checks**: Add health check endpoints for container monitoring
- **CI/CD Integration**: Integrate Docker builds into your CI/CD pipeline

## References

- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

