import { NextRequest, NextResponse } from "next/server";

// Proxies image downloads server-side. The browser's fetch() in
// downloadImage.ts is same-origin against this route, so it always gets a
// readable blob back — the actual cross-origin request to the backend/S3
// happens here, on the server, where the browser's CORS restrictions don't
// apply. Without this, downloads only work when the image host happens to
// send CORS headers (which it usually doesn't in local dev), and silently
// fall back to opening the image in a new tab instead.
export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get("url");
  const filename = request.nextUrl.searchParams.get("filename") || "image.jpg";

  if (!imageUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    return NextResponse.json({ error: "Invalid url parameter" }, { status: 400 });
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return NextResponse.json({ error: "Invalid url protocol" }, { status: 400 });
  }

  try {
    const upstream = await fetch(parsedUrl.toString());
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: upstream.status || 502 },
      );
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";

    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
      },
    });
  } catch (err) {
    console.error("Image download proxy failed:", err);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }
}
