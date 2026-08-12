import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_extract_diet_valid_file():
    file_content = b"fake pdf content"
    files = {"file": ("plan_keto.pdf", io.BytesIO(file_content), "application/pdf")}
    response = client.post("/ai/extract-diet", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "allowed_ingredients" in data
    assert "restrictions" in data
    assert "pollo" in data["allowed_ingredients"]
    assert "azúcar" in data["restrictions"]

def test_extract_diet_unsupported_media_type():
    file_content = b"text content"
    files = {"file": ("document.txt", io.BytesIO(file_content), "text/plain")}
    response = client.post("/ai/extract-diet", files=files)
    assert response.status_code == 415

def test_validate_plate_valid_image():
    # Simulando imagen JPEG válida con magic bytes \xff\xd8\xff de más de 1KB
    jpeg_header = b"\xff\xd8\xff" + b"\x00" * 1200
    files = {"file": ("plato_cocinado.jpg", io.BytesIO(jpeg_header), "image/jpeg")}
    data = {"ingredients": '["pollo", "brócoli", "arroz"]'}
    response = client.post("/ai/validate-plate", files=files, data=data)
    assert response.status_code == 200
    res_json = response.json()
    assert "is_valid" in res_json
    assert res_json["is_valid"] is True
