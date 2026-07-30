// Routed through /api/download-image (see src/app/api/download-image/route.ts)
// instead of fetching the image URL directly: product images are served from
// a different origin (the backend/S3), and a direct cross-origin fetch()
// only succeeds if that host sends CORS headers — which it usually doesn't
// in local dev, so the browser fetch fails and this used to silently fall
// back to opening a new tab. The proxy route fetches the image server-side
// (no browser CORS involved) and streams it back same-origin, so the blob
// fetch below always succeeds.
export async function downloadProductImage(url: string, filename: string) {
  try {
    const proxyUrl = `/api/download-image?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error("Failed to fetch image");

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error("Image download failed, opening in new tab instead:", err);
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
