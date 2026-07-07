import type { Request, Response, NextFunction } from "express";

// All security headers are set on every response, regardless of route.
// They tell browsers how to handle this content and prevent a range of
// common client-side attacks (XSS, clickjacking, MIME sniffing, etc.).
export function securityHeaders() {
  return (_req: Request, res: Response, next: NextFunction) => {

    // Prevents browsers from MIME-sniffing a response away from the declared Content-Type.
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Stops this site from being embedded in iframes (clickjacking protection).
    res.setHeader("X-Frame-Options", "DENY");

    // Sends the full origin in same-origin requests, only the origin in cross-origin ones.
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // Disables the legacy browser XSS filter — modern CSP is the real defence.
    res.setHeader("X-XSS-Protection", "0");

    // Prevents Adobe Flash / Acrobat from loading cross-domain content.
    res.setHeader("X-Permitted-Cross-Domain-Policies", "none");

    // Stops IE from executing downloaded files in the context of the site.
    res.setHeader("X-Download-Options", "noopen");

    // Locks down hardware access — camera, mic, location, payment are all off.
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=()"
    );

    // Content-Security-Policy: the most important header.
    // This tells browsers exactly which sources are trusted for scripts, styles, images, etc.
    // Adjust these directives if you add new CDNs or external services.
    const csp = [
      // Only load documents from the same origin
      "default-src 'self'",
      // Scripts: same origin + inline scripts (needed by Vite/React)
      "script-src 'self' 'unsafe-inline'",
      // Styles: same origin + inline styles (used by Tailwind/emotion)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts from Google Fonts CDN
      "font-src 'self' https://fonts.gstatic.com",
      // Images: same origin + Substack CDN + data URIs (for inline SVGs)
      "img-src 'self' data: https://*.substack.com https://substackcdn.com https://*.substackcdn.com",
      // API / fetch targets: same origin + Supabase
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      // No objects, embeds, or applets
      "object-src 'none'",
      // Base tag restricted to same origin
      "base-uri 'self'",
      // All form submissions must target same origin
      "form-action 'self'",
    ].join("; ");

    res.setHeader("Content-Security-Policy", csp);

    // Prevents this window from gaining access to cross-origin opener windows (e.g. popup attacks).
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");

    // Enforce HTTPS in production — browsers will refuse to connect over HTTP for 1 year.
    if (process.env.NODE_ENV === "production") {
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload"
      );
    }

    next();
  };
}
