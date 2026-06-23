"""
middleware/security.py
======================
Security headers middleware for FastAPI/Starlette.

Applies hardened HTTP security headers to every response.
These headers instruct browsers to apply strict security policies.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from config import get_settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Adds the following security headers to every response:
    - X-Content-Type-Options: Prevents MIME-type sniffing
    - X-Frame-Options: Blocks clickjacking via iframe embedding
    - Referrer-Policy: Limits referrer info sent to other sites
    - X-XSS-Protection: Disables legacy XSS auditor (modern browsers use CSP)
    - Permissions-Policy: Disables camera, mic, geolocation, payment APIs
    - Strict-Transport-Security: Forces HTTPS (production only)
    - X-Download-Options: Prevents IE from executing downloads in site context
    - X-Permitted-Cross-Domain-Policies: Blocks Adobe Flash/Acrobat cross-domain access
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        settings = get_settings()

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "0"
        response.headers["X-Download-Options"] = "noopen"
        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), payment=(), "
            "usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
        )

        # HSTS — only in production (browsers cache this for 1 year)
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        return response
