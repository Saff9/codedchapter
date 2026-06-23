"""
config.py
=========
Central configuration via Pydantic Settings.
All values are read from environment variables (or a .env file).

To switch from Substack to your own database:
    Set USE_SUBSTACK=false in your .env file.
    The app will then call the database service for all post operations.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings — loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Server ──────────────────────────────────────────────────────────────
    port: int = 8000
    host: str = "0.0.0.0"
    debug: bool = False
    environment: str = "production"  # "development" | "production"

    # ── Database ─────────────────────────────────────────────────────────────
    # Supabase pooler connection string (port 6543 for serverless).
    # Example: postgresql+asyncpg://user:pass@host:6543/db?ssl=require
    database_url: str = ""

    # ── Supabase Auth ─────────────────────────────────────────────────────────
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_jwt_secret: str = ""  # Found in Supabase Dashboard → Settings → API → JWT Secret

    # ── Admin ──────────────────────────────────────────────────────────────────
    admin_email: str = ""  # Only this email can create/edit/delete posts

    # ── Substack Integration ──────────────────────────────────────────────────
    # Set USE_SUBSTACK=false when you are ready to use your own database.
    # While true, all post reads go to Substack RSS.
    use_substack: bool = True
    substack_feed_url: str = "https://codedchapter.substack.com/feed"
    substack_cache_ttl_seconds: int = 300  # 5 minutes

    # ── CORS ───────────────────────────────────────────────────────────────────
    frontend_url: str = "https://codedchapter.vercel.app"

    # ── Rate Limiting ──────────────────────────────────────────────────────────
    rate_limit_public: str = "100/minute"   # Public read endpoints
    rate_limit_auth: str = "30/minute"      # Authenticated write endpoints
    rate_limit_strict: str = "10/minute"    # Sensitive endpoints (login, signup)

    @property
    def cors_origins(self) -> list[str]:
        """Return list of allowed CORS origins."""
        origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://codedchapter.vercel.app",
        ]
        if self.frontend_url and self.frontend_url not in origins:
            origins.append(self.frontend_url)
        return origins

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def is_development(self) -> bool:
        return self.environment == "development"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Return cached settings instance.
    Use dependency injection in FastAPI: Depends(get_settings)
    """
    return Settings()
