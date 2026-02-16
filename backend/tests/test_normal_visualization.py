# backend/tests/test_vision_normalization.py
def test_analyze_returns_normalized(client):
    resp = client.post("/analyze", json={"s3_key": "foo"})
    body = resp.json()
    assert resp.status_code == 200
    assert body["ingredients_raw"]
    assert body["ingredients_normalized"] == ["steak", "tortilla", "onion"]  # TC-5/6/9-11
