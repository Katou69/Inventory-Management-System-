from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_minutes: int = 60 * 24 * 7
    cors_origins: str = "http://localhost:3000"
    env: str = "development"

    # Cookie settings for httpOnly auth cookies
    cookie_secure: bool = False  # set true in prod (https only)
    cookie_samesite: str = "lax"
    cookie_domain: str | None = None

    # CSRF (double-submit cookie via starlette-csrf). Separate from jwt_secret
    # so rotating one doesn't invalidate the other; falls back to jwt_secret
    # if unset so existing .env files don't need a new var to keep working.
    csrf_secret: str | None = None

    @property
    def csrf_secret_value(self) -> str:
        return self.csrf_secret or self.jwt_secret

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()

if settings.env == "production" and not settings.cookie_secure:
    # cookie_secure=False ships the auth cookies over plain HTTP. That's the
    # right default for local dev (http://localhost), but silently forgetting
    # to flip COOKIE_SECURE=true for a real deployment means every login
    # session is readable by anyone on the same network. Fail loudly instead.
    raise RuntimeError(
        "COOKIE_SECURE must be true when ENV=production — refusing to start "
        "with auth cookies sent over plain HTTP."
    )
