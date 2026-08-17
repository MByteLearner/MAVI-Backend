"""MAVI - Microservicio de Inteligencia Artificial.

Expone las capacidades de IA del asistente robótico de nutrición:
  - Extracción de reglas dietéticas desde planes médicos (LLM).
  - Validación visual de platos cocinados (Computer Vision).

Ambas capacidades están simuladas de forma determinista. Los puntos de
integración con modelos reales están marcados con TODO-AI.
"""

import json
import os
import urllib.request
import urllib.error
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

app = FastAPI(title="MAVI AI Service", version="1.0.0")

DIET_ALLOWED_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/webp"}
MIN_PLATE_IMAGE_BYTES = 1024  # Una foto real de plato supera 1 KB


# ---------------------------------------------------------------------------
# Modelos Pydantic (contratos de salida)
# ---------------------------------------------------------------------------

class DietExtraction(BaseModel):
    allowed_ingredients: list[str] = Field(default_factory=list)
    restrictions: list[str] = Field(default_factory=list)


class PlateValidation(BaseModel):
    is_valid: bool


class ChatRequest(BaseModel):
    message: str
    user_name: str | None = None


class ChatResponse(BaseModel):
    reply: str


# ---------------------------------------------------------------------------
# Simuladores (puntos de integración con modelos reales)
# ---------------------------------------------------------------------------

def simulate_llm_extraction(filename: str, content: bytes) -> DietExtraction:
    """Simula la lectura del plan médico mediante un LLM (OCR + structured output).

    TODO-AI: reemplazar por la llamada real al LLM con function calling,
    usando `content` (y OCR previo si es imagen) como entrada del prompt.
    """
    name = filename.lower()

    if "keto" in name:
        return DietExtraction(
            allowed_ingredients=["pollo", "huevo", "aguacate", "espinaca", "queso"],
            restrictions=["azúcar", "pan", "arroz", "pasta"],
        )

    if "diab" in name:
        return DietExtraction(
            allowed_ingredients=["avena", "pollo", "brócoli", "pescado", "lentejas"],
            restrictions=["azúcar", "miel", "refresco", "harina refinada"],
        )

    # Plan balanceado por defecto
    _ = content  # el contenido binario alimentará el prompt del LLM real
    return DietExtraction(
        allowed_ingredients=["avena", "pollo", "huevo", "arroz", "brócoli", "plátano"],
        restrictions=["azúcar", "sal"],
    )


def _has_image_magic_bytes(payload: bytes) -> bool:
    is_jpeg = payload.startswith(b"\xff\xd8\xff")
    is_png = payload.startswith(b"\x89PNG\r\n\x1a\n")
    is_webp = payload[:4] == b"RIFF" and payload[8:12] == b"WEBP"
    return is_jpeg or is_png or is_webp


def simulate_vision_validation(
    filename: str,
    payload: bytes,
    recipe_ingredients: list[Any],
) -> bool:
    """Simula el análisis de Computer Vision del plato cocinado.

    TODO-AI: reemplazar por un modelo de visión (o LLM multimodal) que
    compare la imagen contra `recipe_ingredients` y emita el veredicto.
    """
    _ = recipe_ingredients  # entrada del prompt del modelo de visión real
    name = filename.lower()

    is_real_image = _has_image_magic_bytes(payload)
    has_enough_detail = len(payload) >= MIN_PLATE_IMAGE_BYTES
    not_flagged_as_raw = "raw" not in name and "crudo" not in name

    return is_real_image and has_enough_detail and not_flagged_as_raw


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/ai/extract-diet", response_model=DietExtraction)
async def extract_diet(file: UploadFile = File(...)) -> DietExtraction:
    """Recibe el plan médico (PDF/imagen) y devuelve las reglas estructuradas."""
    if file.content_type not in DIET_ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Formato no soportado. Usa PDF, JPEG, PNG o WebP.",
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="El archivo está vacío.")

    return simulate_llm_extraction(file.filename or "", content)


@app.post("/ai/validate-plate", response_model=PlateValidation)
async def validate_plate(
    file: UploadFile = File(...),
    ingredients: str = Form(..., description="JSON array con los ingredientes de la receta"),
) -> PlateValidation:
    """Valida si el plato fotografiado corresponde a los ingredientes de la receta."""
    try:
        recipe_ingredients: Any = json.loads(ingredients)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=422, detail="'ingredients' debe ser un JSON válido."
        ) from exc

    if not isinstance(recipe_ingredients, list):
        raise HTTPException(
            status_code=422, detail="'ingredients' debe ser un arreglo JSON."
        )

    payload = await file.read()
    if not payload:
        raise HTTPException(status_code=400, detail="La imagen está vacía.")

    is_valid = simulate_vision_validation(
        file.filename or "", payload, recipe_ingredients
    )
    return PlateValidation(is_valid=is_valid)


@app.post("/ai/chat", response_model=ChatResponse)
@app.post("/ia/chat", response_model=ChatResponse)
async def chat_ai(payload: ChatRequest) -> ChatResponse:
    """Procesa consultas nutricionales usando Ollama (local) o DeepSeek API (nube)."""
    ollama_url = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
    ollama_model = os.getenv("OLLAMA_MODEL", "llama3.2")
    use_ollama = os.getenv("USE_OLLAMA", "true").lower() in ("true", "1", "yes")

    system_prompt = (
        "Eres MAVI, una asistente inteligente de nutrición y salud. "
        "Responde con tono amable, conciso y profesional a las consultas de salud y nutrición."
    )

    # 1. Intentar Ollama local (si USE_OLLAMA=true o si OLLAMA_BASE_URL está definido)
    if use_ollama or os.getenv("OLLAMA_BASE_URL"):
        try:
            url = f"{ollama_url.rstrip('/')}/api/chat"
            headers = {"Content-Type": "application/json"}
            body = json.dumps({
                "model": ollama_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": payload.message},
                ],
                "stream": False,
            }).encode("utf-8")

            req = urllib.request.Request(url, data=body, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=45) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                reply = res_data.get("message", {}).get("content", "")
                if reply:
                    return ChatResponse(reply=reply)
        except Exception as exc:
            print(f"[Ollama Error]: {exc}")

    # 2. Intentar DeepSeek API Cloud (si DEEPSEEK_API_KEY está configurada)
    deepseek_api_key = os.getenv("DEEPSEEK_API_KEY")
    if deepseek_api_key and deepseek_api_key.strip():
        try:
            url = "https://api.deepseek.com/chat/completions"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {deepseek_api_key.strip()}",
            }
            body = json.dumps({
                "model": "deepseek-chat",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": payload.message},
                ],
                "stream": False,
            }).encode("utf-8")

            req = urllib.request.Request(url, data=body, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=30) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                reply = res_data["choices"][0]["message"]["content"]
                return ChatResponse(reply=reply)
        except Exception as exc:
            print(f"[DeepSeek API Error]: {exc}")

    # 3. Fallback inteligente si no hay servicio configurado
    name = payload.user_name or "Usuario"
    return ChatResponse(
        reply=f"Hola {name}! Recibí tu consulta: '{payload.message}'. Podés usar Ollama localmente (USE_OLLAMA=true) o añadir tu DEEPSEEK_API_KEY."
    )
