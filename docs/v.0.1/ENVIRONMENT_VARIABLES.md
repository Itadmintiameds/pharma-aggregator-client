# Environment Variables Guide

This document explains how to configure and use environment variables in the pharma-aggregator-client Next.js application.

## Overview

Environment variables allow you to configure your application without hardcoding values. This is especially useful for:
- Backend API URLs
- API keys and secrets
- Feature flags
- Environment-specific settings

## File Structure

- **`.env`**: Your local environment variables (not committed to git)
- **`.env.example`**: Template file showing required variables (committed to git)
- **`.env.local`**: Alternative local file (also ignored by git)
- **`.env.production`**: Production environment variables (for Docker/deployment)

## Setting Up Environment Variables

### Step 1: Create Your `.env` File

If you don't have a `.env` file, copy the example:

```bash
cp .env.example .env
```

### Step 2: Configure Your Backend URL

Open `.env` and set your backend URL:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

Replace `http://localhost:8000` with your actual backend URL.

## Understanding NEXT_PUBLIC_ Prefix

### Client-Side Variables (`NEXT_PUBLIC_`)

Variables prefixed with `NEXT_PUBLIC_` are:
- **Exposed to the browser** - Accessible in client-side React components
- **Embedded at build time** - Included in the JavaScript bundle
- **Public** - Visible to anyone who inspects your code

**Use for:**
- Public API URLs
- Public configuration values
- Non-sensitive settings

**Example:**
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_API_VERSION=v1
```

### Server-Side Only Variables (No Prefix)

Variables without the `NEXT_PUBLIC_` prefix are:
- **Server-side only** - Not exposed to the browser
- **Secure** - Cannot be accessed from client-side code
- **Runtime accessible** - Available in API routes, Server Components, etc.

**Use for:**
- API keys and secrets
- Database connection strings
- Private configuration

**Example:**
```env
BACKEND_URL=http://localhost:8000
DATABASE_URL=postgresql://...
API_SECRET_KEY=your-secret-key
```

## Using Environment Variables in Code

### Client-Side (Browser)

```typescript
// In a React component or client component
'use client';

export default function MyComponent() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  
  const fetchData = async () => {
    const response = await fetch(`${backendUrl}/api/data`);
    // ...
  };
  
  return <div>Backend: {backendUrl}</div>;
}
```

### Server-Side (API Routes)

```typescript
// In app/api/example/route.ts
export async function GET() {
  const backendUrl = process.env.BACKEND_URL; // Server-side only
  // or
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL; // Also works
  
  const response = await fetch(`${backendUrl}/api/data`);
  return Response.json(await response.json());
}
```

### Server Components

```typescript
// In a Server Component
export default async function ServerComponent() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  // or
  const backendUrl = process.env.BACKEND_URL;
  
  const data = await fetch(`${backendUrl}/api/data`).then(r => r.json());
  
  return <div>{/* render data */}</div>;
}
```

## Environment Variable Priority

Next.js loads environment variables in this order (later files override earlier ones):

1. `.env`
2. `.env.local`
3. `.env.development` / `.env.production` / `.env.test` (based on `NODE_ENV`)
4. `.env.development.local` / `.env.production.local` / `.env.test.local`

## Docker Usage

### Development with Docker

When running locally with Docker, you can pass environment variables:

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_BACKEND_URL=http://host.docker.internal:8000 \
  pharma-aggregator-client:latest
```

**Note:** Use `host.docker.internal` to access services running on your host machine from inside Docker.

### Production Docker

For production, use an environment file:

```bash
docker run -p 3000:3000 \
  --env-file .env.production \
  pharma-aggregator-client:latest
```

Or set variables directly:

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_BACKEND_URL=https://api.production.com \
  pharma-aggregator-client:latest
```

## Common Scenarios

### Local Development with Local Backend

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### Local Development with Docker Backend

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

If your backend is in Docker, use the container name or `host.docker.internal`:

```env
NEXT_PUBLIC_BACKEND_URL=http://backend:8000
# or
NEXT_PUBLIC_BACKEND_URL=http://host.docker.internal:8000
```

### Production

```env
NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
```

### Staging

```env
NEXT_PUBLIC_BACKEND_URL=https://api-staging.yourdomain.com
```

## TypeScript Support

For better TypeScript support, create a type definition file:

**`env.d.ts`** (or add to existing type definitions):

```typescript
namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_BACKEND_URL: string;
    BACKEND_URL?: string;
  }
}
```

## Best Practices

1. **Never commit `.env` files** - They contain sensitive information
2. **Use `.env.example`** - Document all required variables
3. **Use `NEXT_PUBLIC_` sparingly** - Only for values that need to be in the browser
4. **Keep secrets server-side** - Never use `NEXT_PUBLIC_` for API keys or secrets
5. **Validate at runtime** - Check that required variables are set
6. **Use different files** - `.env.development`, `.env.production`, etc.

## Troubleshooting

### Variable Not Available in Browser

**Problem:** `NEXT_PUBLIC_` variable not accessible in client-side code

**Solutions:**
- Ensure the variable starts with `NEXT_PUBLIC_`
- Restart the development server after adding new variables
- Rebuild the application if in production

### Variable Not Available in Server Code

**Problem:** Environment variable not found in API routes or Server Components

**Solutions:**
- Check the variable name is correct (case-sensitive)
- Ensure the `.env` file is in the project root
- Restart the development server
- For production, ensure variables are set in the deployment environment

### Docker Can't Access Host Services

**Problem:** Container can't reach backend on `localhost`

**Solutions:**
- Use `host.docker.internal` instead of `localhost` (Windows/Mac)
- Use the host's IP address (Linux)
- Use Docker network if backend is also containerized

## Example Configuration

### `.env.example`
```env
# Backend API URL (accessible in browser)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Backend API URL (server-side only)
BACKEND_URL=http://localhost:8000
```

### `.env` (Local Development)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### `.env.production` (Production)
```env
NEXT_PUBLIC_BACKEND_URL=https://api.production.com
```

## References

- [Next.js Environment Variables Documentation](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)

