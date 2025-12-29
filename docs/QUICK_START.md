# Quick Start Guide - Running Your Project in Docker

This is a quick reference guide for running your Next.js project inside Docker.

> **Note for Windows/PowerShell Users:** PowerShell uses `;` instead of `&&` to chain commands. Commands marked with `powershell` are for Windows PowerShell, while `bash` commands work on Linux/Mac/Git Bash.

## Quick Commands

```bash
# Build the image
docker build -t pharma-aggregator-client:latest .

# Run the container (background)
docker run -d -p 3000:3000 --name pharma-client pharma-aggregator-client:latest

# View logs
docker logs pharma-client

# Stop container
docker stop pharma-client

# Access: http://localhost:3000
```

## How to Start This Project in Docker (Step-by-Step)

This section is the main guide for working with this project in Docker.

### 1. Create or Update the Docker Image

From the project root:

```bash
docker build -t pharma-aggregator-client:latest .
```

- **First time:** This creates the image.
- **Later:** Run the same command again to **update** the image after code changes.

If you want to force a clean rebuild (ignore cache):

```bash
docker build --no-cache -t pharma-aggregator-client:latest .
```

### 2. Run the Container

Run the app in the background (recommended):

```bash
docker run -d -p 3000:3000 --name pharma-client pharma-aggregator-client:latest
```

- **`-d`**: run in background (detached)
- **`-p 3000:3000`**: map host port 3000 → container port 3000
- **`--name pharma-client`**: easy-to-remember container name

Then open:

```text
http://localhost:3000
```

### 3. Check Container Status

```bash
docker ps
```

You should see `pharma-client` with status `Up` and port `0.0.0.0:3000->3000/tcp`.

### 4. Check Logs

Basic logs:

```bash
docker logs pharma-client
```

Follow logs in real time:

```bash
docker logs -f pharma-client
```

### 5. Stop the Container

```bash
docker stop pharma-client
```

### 6. Start the Container Again

```bash
docker start pharma-client
```

### 7. Remove the Container

Only after stopping it:

```bash
docker stop pharma-client
docker rm pharma-client
```

### 8. Full Refresh After Code Changes

If you changed code and want a fresh build and run:

**Bash/Linux/Mac:**
```bash
docker stop pharma-client 2>/dev/null || true
docker rm pharma-client 2>/dev/null || true
docker build -t pharma-aggregator-client:latest .
docker run -d -p 3000:3000 --name pharma-client pharma-aggregator-client:latest
```

**PowerShell/Windows:**
```powershell
# Stop and remove if exists (ignore errors)
docker stop pharma-client 2>$null ; docker rm pharma-client 2>$null
docker build -t pharma-aggregator-client:latest .
docker run -d -p 3000:3000 --name pharma-client pharma-aggregator-client:latest

# Or use separate lines (more readable)
docker stop pharma-client 2>$null
docker rm pharma-client 2>$null
docker build -t pharma-aggregator-client:latest .
docker run -d -p 3000:3000 --name pharma-client pharma-aggregator-client:latest
```

---

## Prerequisites

- Docker installed and running ([Download Docker](https://www.docker.com/get-started))
- **Docker Desktop must be running** (if on Windows/Mac)
  - Check the system tray/menu bar for the Docker icon
  - If not running, start Docker Desktop and wait 30-60 seconds for it to initialize
  - Verify with: `docker version` (should show both Client and Server versions)

## Step-by-Step Instructions

### Step 1: Build the Docker Image

Open a terminal in your project root directory and run:

```bash
docker build -t pharma-aggregator-client:latest .
```

**What happens:**
- Docker reads the `Dockerfile`
- Installs dependencies
- Builds your Next.js application
- Creates a production-ready image

**Time:** First build takes 2-5 minutes. Subsequent builds are faster.

### Step 2: Run the Container

#### Option A: Run in Foreground (See logs)

```bash
docker run -p 3000:3000 pharma-aggregator-client:latest
```

**To stop:** Press `Ctrl+C`

#### Option B: Run in Background (Detached)

```bash
docker run -d -p 3000:3000 --name pharma-client pharma-aggregator-client:latest
```

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

### Step 3: Access Your Application

Open your browser and go to:
```
http://localhost:3000
```

Your Next.js application should be running! 🎉

## With Environment Variables

If you need to set environment variables (like backend URL):

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_BACKEND_URL=http://localhost:8000 \
  pharma-aggregator-client:latest
```

Or use an environment file:

```bash
docker run -p 3000:3000 \
  --env-file .env \
  pharma-aggregator-client:latest
```

## Docker Commands Reference

### Container Management

#### View Running Containers
```bash
docker ps
```

#### View All Containers (Including Stopped)
```bash
docker ps -a
```

#### View Containers with Custom Format
```bash
# Show only names and status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Show container IDs only
docker ps -q
```

#### Start a Container
```bash
docker start <CONTAINER_ID_OR_NAME>
```

#### Stop a Container
```bash
docker stop <CONTAINER_ID_OR_NAME>
```

#### Restart a Container
```bash
docker restart <CONTAINER_ID_OR_NAME>
```

#### Remove a Container
```bash
# Remove stopped container
docker rm <CONTAINER_ID_OR_NAME>

# Force remove running container
docker rm -f <CONTAINER_ID_OR_NAME>
```

#### Remove All Stopped Containers
```bash
docker container prune
```

### Image Management

#### List Images
```bash
docker images
```

#### Remove an Image
```bash
docker rmi pharma-aggregator-client:latest
```

#### Remove All Unused Images
```bash
docker image prune -a
```

#### View Image Details
```bash
docker inspect pharma-aggregator-client:latest
```

#### View Image History (Layers)
```bash
docker history pharma-aggregator-client:latest
```

#### View Image Size
```bash
docker images pharma-aggregator-client:latest
```

### Logs and Debugging

#### View Container Logs
```bash
docker logs <CONTAINER_ID_OR_NAME>
```

#### Follow Logs (Real-time)
```bash
docker logs -f <CONTAINER_ID_OR_NAME>
```

#### View Last N Lines of Logs
```bash
docker logs --tail 100 <CONTAINER_ID_OR_NAME>
```

#### View Logs with Timestamps
```bash
docker logs -t <CONTAINER_ID_OR_NAME>
```

#### Execute Command in Running Container
```bash
docker exec -it <CONTAINER_ID_OR_NAME> /bin/sh
```

#### View Container Stats (CPU, Memory, etc.)
```bash
docker stats <CONTAINER_ID_OR_NAME>
```

#### View All Container Stats
```bash
docker stats
```

### Build Commands

#### Build Image
```bash
docker build -t pharma-aggregator-client:latest .
```

#### Build Without Cache
```bash
docker build --no-cache -t pharma-aggregator-client:latest .
```

#### Build with Build Arguments
```bash
docker build --build-arg NODE_ENV=production -t pharma-aggregator-client:latest .
```

#### View Build Progress
```bash
docker build --progress=plain -t pharma-aggregator-client:latest .
```

### Run Commands

#### Run Container in Foreground
```bash
docker run -p 3000:3000 pharma-aggregator-client:latest
```

#### Run Container in Background (Detached)
```bash
docker run -d -p 3000:3000 --name pharma-client pharma-aggregator-client:latest
```

#### Run with Environment Variables
```bash
docker run -p 3000:3000 -e NEXT_PUBLIC_BACKEND_URL=http://localhost:8000 pharma-aggregator-client:latest
```

#### Run with Environment File
```bash
docker run -p 3000:3000 --env-file .env pharma-aggregator-client:latest
```

#### Run with Volume Mount
```bash
docker run -p 3000:3000 -v $(pwd):/app pharma-aggregator-client:latest
```

#### Run with Custom Port Mapping
```bash
docker run -p 8080:3000 pharma-aggregator-client:latest
```

### System Commands

#### View Docker System Information
```bash
docker info
```

#### View Docker Version
```bash
docker version
```

#### Clean Up Everything (Dangerous!)
```bash
# Remove all stopped containers, unused networks, images, and build cache
docker system prune -a

# Remove volumes as well
docker system prune -a --volumes
```

#### View Disk Usage
```bash
docker system df
```

#### View Detailed Disk Usage
```bash
docker system df -v
```

### Network Commands

#### List Networks
```bash
docker network ls
```

#### Inspect Network
```bash
docker network inspect bridge
```

#### Create Network
```bash
docker network create my-network
```

#### Connect Container to Network
```bash
docker network connect my-network <CONTAINER_ID>
```

### Help Commands

#### Get Help for Any Command
```bash
docker --help
docker build --help
docker run --help
docker ps --help
```

#### Search Docker Hub for Images
```bash
docker search node
```

### Quick Reference

#### Bash/Linux/Mac Commands

```bash
# Build and run in one go
docker build -t pharma-aggregator-client:latest . && docker run -d -p 3000:3000 --name pharma-client pharma-aggregator-client:latest

# Stop and remove container
docker stop pharma-client && docker rm pharma-client

# View logs and follow
docker logs -f pharma-client

# Rebuild and restart
docker stop pharma-client && docker rm pharma-client && docker build -t pharma-aggregator-client:latest . && docker run -d -p 3000:3000 --name pharma-client pharma-aggregator-client:latest
```

#### PowerShell/Windows Commands

```powershell
# Build and run in one go
docker build -t pharma-aggregator-client:latest . ; docker run -d -p 3000:3000 --name pharma-client pharma-aggregator-client:latest

# Stop and remove container
docker stop pharma-client ; docker rm pharma-client

# View logs and follow
docker logs -f pharma-client

# Rebuild and restart (PowerShell)
docker stop pharma-client ; docker rm pharma-client ; docker build -t pharma-aggregator-client:latest . ; docker run -d -p 3000:3000 --name pharma-client pharma-aggregator-client:latest

# Alternative: Use separate lines (more readable)
docker stop pharma-client
docker rm pharma-client
docker build -t pharma-aggregator-client:latest .
docker run -d -p 3000:3000 --name pharma-client pharma-aggregator-client:latest
```

**Note:** In PowerShell, use `;` instead of `&&` to chain commands. The `&&` operator is not supported in PowerShell.

## Troubleshooting

### Docker Desktop Not Running (Windows/Mac)

**Error:** `error during connect: open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`

**Problem:** Docker Desktop is not running or hasn't fully started.

**Solution:**

1. **Start Docker Desktop manually:**
   - Open Docker Desktop from the Start menu (Windows) or Applications folder (Mac)
   - Wait 30-60 seconds for it to fully start
   - Look for the Docker icon in your system tray to confirm it's running

2. **Or start via PowerShell (Windows):**
   ```powershell
   Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
   ```

3. **Verify Docker is ready:**
   ```bash
   docker version
   ```
   If this command works without errors, Docker is ready.

4. **Wait for Docker to be ready (PowerShell script):**
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

### Port Already in Use

If port 3000 is already in use, use a different port:

```bash
docker run -p 8080:3000 pharma-aggregator-client:latest
```

Then access at `http://localhost:8080`

### Container Won't Start

Check the logs:
```bash
docker logs <CONTAINER_ID>
```

### Rebuild After Code Changes

After making code changes, rebuild the image:

```bash
docker build -t pharma-aggregator-client:latest .
docker run -p 3000:3000 pharma-aggregator-client:latest
```

### Clean Up Everything

**Bash/Linux/Mac:**
```bash
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
docker rmi pharma-aggregator-client:latest
```

**PowerShell/Windows:**
```powershell
# Stop all containers
docker stop $(docker ps -aq)

# Remove all containers
docker rm $(docker ps -aq)

# Remove the image
docker rmi pharma-aggregator-client:latest

# Or use PowerShell-specific syntax
docker ps -aq | ForEach-Object { docker stop $_ }
docker ps -aq | ForEach-Object { docker rm $_ }
docker rmi pharma-aggregator-client:latest
```

## Next Steps

- See [DOCKER.md](./DOCKER.md) for detailed documentation
- See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for environment variable configuration

