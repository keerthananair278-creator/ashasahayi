"""ASHA-Sahayi API.   Run from the project root:   uvicorn backend.main:app --reload"""
from __future__ import annotations

import base64
import hashlib
import hmac
import logging
import os
import secrets
import time
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")  # must run before ai_service reads env vars

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Request, UploadFile  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.responses import HTMLResponse, JSONResponse  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402

from . import ai_service, database, models, rule_engine, schemas  # noqa: E402
from . import db_core as db  # noqa: E402

log = logging.getLogger("asha.api")
SECRET = os.getenv("APP_SECRET") or "dev-only-secret"
if SECRET in ("dev-only-secret", "change-me-to-a-long-random-string"):
    log.warning("APP_SECRET is the default - set a long random value in backend/.env")
TOKEN_TTL = 8 * 3600
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"


@asynccontextmanager
async def lifespan(app: FastAPI):
    database.init_db()
    yield


app = FastAPI(title="ASHA-Sahayi API", version="1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",")],
    allow_methods=["*"], allow_headers=["*"],
)


# ---------------- error mapping ----------------
@app.exception_handler(db.ValidationError)
async def _validation(_: Request, e: db.ValidationError):
    return JSONResponse({"detail": str(e)}, status_code=422)


@app.exception_handler(db.DuplicateError)
async def _duplicate(_: Request, e: db.DuplicateError):
    return JSONResponse({"detail": str(e)}, status_code=409)


@app.exception_handler(db.NotFoundError)
async def _notfound(_: Request, e: db.NotFoundError):
    return JSONResponse({"detail": str(e)}, status_code=404)


# ---------------- auth (signed, expiring tokens; no extra dependencies) ----------------
def _sign(payload: str) -> str:
    return hmac.new(SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()


def make_token(role: str, house_no: str = "") -> str:
    payload = f"{role}|{house_no}|{int(time.time()) + TOKEN_TTL}"
    return base64.urlsafe_b64encode(f"{payload}|{_sign(payload)}".encode()).decode()


def parse_token(token: str) -> dict | None:
    try:
        payload, sig = base64.urlsafe_b64decode(token.encode()).decode().rsplit("|", 1)
        if not hmac.compare_digest(sig, _sign(payload)):
            return None
        role, house_no, exp = payload.split("|")
        return {"role": role, "house_no": house_no} if int(exp) >= time.time() else None
    except Exception:
        return None


def current_user(authorization: str | None = Header(default=None)) -> dict:
    user = parse_token(authorization[7:]) if authorization and authorization.startswith("Bearer ") else None
    if not user:
        raise HTTPException(401, "Login required")
    return user


def asha_only(user: dict = Depends(current_user)) -> dict:
    if user["role"] != "asha":
        raise HTTPException(403, "ASHA worker access only")
    return user


def house_access(house_no: str, user: dict = Depends(current_user)) -> dict:
    if user["role"] == "asha" or user["house_no"] == house_no:
        return user
    raise HTTPException(403, "You can only view your own household")


# ---------------- routes ----------------
@app.get("/api/health")
def health():
    return {"status": "ok", "groq": bool(os.getenv("GROQ_API_KEY")), "sarvam": bool(os.getenv("SARVAM_API_KEY"))}


@app.post("/api/auth/citizen", response_model=schemas.TokenOut)
def citizen_login(body: schemas.CitizenLogin, conn=Depends(database.get_conn)):
    row = conn.execute("SELECT password_hash FROM households WHERE house_no=? AND is_deleted=0",
                       (body.house_no,)).fetchone()
    if not row or not models.verify_password(body.password, row["password_hash"]):
        raise HTTPException(401, "Invalid House Number or Password")  # same message for both cases
    return {"token": make_token("citizen", body.house_no), "role": "citizen", "house_no": body.house_no}


@app.post("/api/auth/asha", response_model=schemas.TokenOut)
def asha_login(body: schemas.AshaLogin):
    pin = os.getenv("ASHA_PIN", "")
    if pin and not hmac.compare_digest(body.pin or "", pin):
        raise HTTPException(401, "Invalid PIN")
    return {"token": make_token("asha"), "role": "asha"}


@app.get("/api/houses")
def list_houses(q: str | None = None, conn=Depends(database.get_conn), _=Depends(asha_only)):
    return models.list_houses(conn, q)


@app.get("/api/houses/{house_no}")
def get_house(house_no: str, conn=Depends(database.get_conn), _=Depends(house_access)):
    return models.get_house(conn, house_no)


@app.post("/api/houses", status_code=201)
def create_house(body: schemas.HouseIn, conn=Depends(database.get_conn), _=Depends(asha_only)):
    if not body.password:
        raise db.ValidationError("password (min 4 characters) is required for a new household")
    return models.create_house(conn, body.model_dump(), "asha")


@app.put("/api/houses/{house_no}")
def update_house(house_no: str, body: schemas.HouseIn, conn=Depends(database.get_conn), _=Depends(asha_only)):
    return models.update_house(conn, house_no, body.model_dump(), "asha")


@app.post("/api/houses/{house_no}/task")
def set_task(house_no: str, body: schemas.TaskIn, conn=Depends(database.get_conn),
             user: dict = Depends(house_access)):
    return models.set_task_completed(conn, house_no, body.completed, user["role"])


@app.post("/api/members/{member_id}/vaccines")
def give_vaccine(member_id: str, body: schemas.VaccineIn, conn=Depends(database.get_conn),
                 user: dict = Depends(asha_only)):
    return models.record_vaccine_given(conn, member_id, body.code, body.given_date, user["role"])


@app.get("/api/houses/{house_no}/summary")
def house_summary(house_no: str, lang: str = "en", conn=Depends(database.get_conn), _=Depends(house_access)):
    hid = models.get_house_id(conn, house_no)
    rule_engine.run_rules_for_household(conn, hid)  # refresh flags (children age every day)
    result = ai_service.summarize_household(conn, hid)
    en = result["summary"].get("summary_en")
    if lang == "hi" and not result["is_fallback"] and isinstance(en, str):
        try:
            result["summary"]["summary_hi"] = ai_service.sarvam_translate(en, "en", "hi")
        except Exception as e:
            log.warning("Hindi translation failed: %s", ai_service.redact_pii(str(e)))
    return result


@app.post("/api/ai/ask")
def ai_ask(body: schemas.AskIn, conn=Depends(database.get_conn), _=Depends(asha_only)):
    return ai_service.ask_handbook(conn, body.question)


@app.post("/api/ai/questions")
def ai_questions(body: schemas.QuestionsIn, conn=Depends(database.get_conn), _=Depends(asha_only)):
    return ai_service.generate_questions(conn, body.topic)


@app.post("/api/aadhaar/scan")
async def aadhaar_scan(file: UploadFile = File(...), _=Depends(asha_only)):
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(415, "Upload a JPEG, PNG or WebP photo")
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(413, "Image too large (max 5 MB)")
    try:
        return ai_service.scan_id_card(data, file.content_type)  # image is never stored
    except Exception as e:
        log.error("ID scan failed: %s", ai_service.redact_pii(str(e)))
        raise HTTPException(502, "Could not read the card. Please enter the details manually.")


@app.post("/api/voice/transcribe")
async def voice_transcribe(file: UploadFile = File(...), lang: str = Form("ml"), _=Depends(asha_only)):
    data = await file.read()
    if not data or len(data) > 10 * 1024 * 1024:
        raise HTTPException(413, "Audio missing or too large (max 10 MB)")
    try:
        text = ai_service.sarvam_transcribe(data, file.filename or "note.webm",
                                            file.content_type or "audio/webm", lang)
    except Exception as e:
        log.error("Transcription failed: %s", ai_service.redact_pii(str(e)))
        raise HTTPException(502, "Voice transcription failed. Please type the note.")
    return {"text": text}


# ---------------- frontend (served untouched; scripts are injected on the fly) ----------------
INJECT = '<script src="/i18n.js"></script>\n<script src="/api-patch.js"></script>\n'


def inject_scripts(html: str) -> str:
    """Add the API + language scripts at serve time, so your index.html file is never edited."""
    if "api-patch.js" in html:
        return html
    idx = html.lower().rfind("</body>")
    return html[:idx] + INJECT + html[idx:] if idx != -1 else html + INJECT


@app.get("/", include_in_schema=False)
@app.get("/index.html", include_in_schema=False)
def index():
    page = FRONTEND_DIR / "index.html"
    if not page.exists():
        raise HTTPException(404, "Put your frontend file at frontend/index.html")
    return HTMLResponse(inject_scripts(page.read_text(encoding="utf-8")))


# i18n.js / api-patch.js (and any other assets) are served from the same origin: no CORS needed.
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=FRONTEND_DIR), name="frontend")
