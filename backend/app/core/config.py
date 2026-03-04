from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_region: str
    aws_s3_bucket: str
    aws_s3_prefix: str = "uploads/"

    openai_api_key: str
    openai_vision_model: str = "gpt-4.1-vision-preview"
    openai_norm_model: str = "gpt-4.1-mini"

    spoonacular_api_key: str | None = None
    auth_secret_key: str = "OieBqhcWEWCvXpm8GzPaCnv7r6dqsqEWRRayMRR5t5Pqg3a9KNgZZcwvFzzZ-DTT"
    access_token_expire_minutes: int = 60 * 24

    class Config:
        env_file = Path(__file__).resolve().parent.parent / ".env"
        case_sensitive = False


settings = Settings()
