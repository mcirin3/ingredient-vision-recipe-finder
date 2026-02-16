# backend/tests/test_upload.py
import io

def test_valid_upload(client):
    resp = client.post("/upload-image", files={"image": ("ok.jpg", io.BytesIO(b"123"), "image/jpeg")})
    assert resp.status_code == 200
    assert resp.json()["status"] == "uploaded"          # TC-1

def test_reject_unsupported_type(client):
    resp = client.post("/upload-image", files={"image": ("bad.pdf", io.BytesIO(b"123"), "application/pdf")})
    assert resp.status_code == 400                       # TC-2

def test_empty_submission_blocked(client):
    resp = client.post("/upload-image", files={})
    assert resp.status_code == 422                       # TC-4
