# backend/tests/conftest.py
import io, pytest
from fastapi.testclient import TestClient
import app.main as main

@pytest.fixture(autouse=True)
def stub_s3(monkeypatch):
    monkeypatch.setattr(main.s3_client, "presigned_put", lambda k, c, expires=900: f"https://s3.fake/{k}")
    monkeypatch.setattr(main.s3_client, "presigned_get", lambda k, expires=300: f"https://s3.fake/{k}")
    monkeypatch.setattr(main.s3_client, "upload_fileobj", lambda f, k, c: None)

@pytest.fixture(autouse=True)
def stub_openai(monkeypatch):
    # avoid live OpenAI calls
    from app.services import vision_service, normalization_service
    monkeypatch.setattr(vision_service, "extract_labels_from_image", lambda key: ["steak", "tortilla", "onion"])
    monkeypatch.setattr(normalization_service, "normalize_labels", lambda labels: [l.lower() for l in labels if l != "plate"])

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
