from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    backend_url: str = "http://localhost:3001"
    internal_secret: str = "dev-internal-secret"
    host: str = "0.0.0.0"
    port: int = 3002
    log_level: str = "info"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
