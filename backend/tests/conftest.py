# backend/tests/conftest.py
import os, sys
from pathlib import Path
import io, pytest
from fastapi.testclient import TestClient

# Ensure the backend/app module is on sys.path when tests are run from repo root or backend/.
ROOT = Path(__file__).resolve().parents[1]  # backend/
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Provide dummy env vars so Settings() in app.core.config loads without real secrets.
ENV_DEFAULTS = {
    "aws_access_key_id": "test",
    "aws_secret_access_key": "test",
    "aws_region": "us-east-1",
    "aws_s3_bucket": "test-bucket",
    "openai_api_key": "test",
}
for k, v in ENV_DEFAULTS.items():
    os.environ.setdefault(k, v)

import app.main as main

@pytest.fixture(autouse=True)
def stub_s3(monkeypatch):
    monkeypatch.setattr(main.s3_client, "presigned_put", lambda k, c, expires=900: f"https://s3.fake/{k}")
    monkeypatch.setattr(main.s3_client, "presigned_get", lambda k, expires=300: f"https://s3.fake/{k}")
    monkeypatch.setattr(main.s3_client, "upload_fileobj", lambda f, k, c: None)

@pytest.fixture(autouse=True)
def stub_openai(monkeypatch):
    """Stub vision + normalization to avoid real OpenAI calls."""
    from app.services import vision_service, normalization_service
    from app.api import vision as vision_api

    fake_labels = lambda key: ["steak", "tortilla", "onion"]
    fake_norm = lambda labels: [l.lower() for l in labels if l != "plate"]

    monkeypatch.setattr(vision_service, "extract_labels_from_image", fake_labels)
    monkeypatch.setattr(normalization_service, "normalize_labels", fake_norm)
    # Also patch the symbols imported into the FastAPI route module
    monkeypatch.setattr(vision_api, "extract_labels_from_image", fake_labels)
    monkeypatch.setattr(vision_api, "normalize_labels", fake_norm)

@pytest.fixture(autouse=True)
def stub_spoonacular(monkeypatch):
    from app.services import spoonacular_service as s
    monkeypatch.setattr(s, "fetch_candidates", lambda ings, limit=15: [
        {"id": 1, "title": "Steak Tacos", "image": "img", "usedIngredients":[{"name":"steak"}], "missedIngredients":[{"name":"cilantro"}], "summary": "steak taco"}
    ])
    monkeypatch.setattr(s, "fetch_recipe_details", lambda rid: {"id": rid, "title": "Stub", "instructions": "mix", "image": None})
    return

@pytest.fixture
def client():
    return TestClient(main.app)
