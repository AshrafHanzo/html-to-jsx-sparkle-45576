# backend/routes/candidates.py
from __future__ import annotations

import json
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime, date

from fastapi import (
    APIRouter,
    HTTPException,
    status,
    UploadFile,
    File,
    Form,
    Query,
)
from pydantic import BaseModel, Field, EmailStr, validator
from starlette.responses import StreamingResponse

# DB helpers (relative import)
# db_connection.py must export: async_query, async_exec, get_async_pool, close_async_pool
from .db_connection import async_query, async_exec, get_async_pool, close_async_pool


router = APIRouter(tags=["candidates"])

# -----------------------
# Helpers to open pool (small wrapper)
# -----------------------
async def open_async_pool() -> None:
    """
    Ensure the async pool exists and is opened. db_connection.get_async_pool()
    returns an AsyncConnectionPool object with .open() coroutine.
    """
    pool = get_async_pool()
    if getattr(pool, "closed", False):  # type: ignore[attr-defined]
        await pool.open()

# -----------------------
# Pydantic models (v1 style)
# -----------------------
class CandidateIn(BaseModel):
    job_position: Optional[str] = None
    company: Optional[str] = None
    full_name: Optional[str] = None
    fathers_name: Optional[str] = None
    email_address: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None

    aadhaar_number: Optional[str] = None
    street_address: Optional[str] = None
    area_locality: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None

    select_languages: List[str] = Field(default_factory=list)
    educational_qualification: Optional[str] = None
    work_experience: Optional[int] = 0
    additional_months: Optional[int] = 0

    technical_professional_skills: Optional[str] = None
    preferred_industries_categories: Optional[str] = None
    preferred_employment_types: List[str] = Field(default_factory=list)
    preferred_work_types: Optional[str] = None

    source: Optional[str] = None
    status: Optional[str] = "Applied"
    notes: Optional[str] = None

    @validator("work_experience", pre=True)
    def _exp_nonneg(cls, v):
        if v is None or v == "":
            return 0
        try:
            iv = int(v)
        except Exception:
            raise ValueError("work_experience must be an integer")
        if iv < 0:
            raise ValueError("work_experience must be >= 0")
        return iv

    @validator("additional_months", pre=True)
    def _months_range(cls, v):
        if v is None or v == "":
            return 0
        try:
            iv = int(v)
        except Exception:
            raise ValueError("additional_months must be an integer 0..11")
        if not 0 <= iv <= 11:
            raise ValueError("additional_months must be 0..11")
        return iv

    @validator("select_languages", pre=True)
    def _norm_languages(cls, v):
        if v is None:
            return []
        if isinstance(v, (list, tuple)):
            return [str(x).strip() for x in v if str(x).strip()]
        if isinstance(v, str):
            return [x.strip() for x in v.split(",") if x.strip()]
        return []

    @validator("preferred_employment_types", pre=True)
    def _norm_pref_employment(cls, v):
        if v is None:
            return []
        if isinstance(v, (list, tuple)):
            return [str(x).strip() for x in v if str(x).strip()]
        if isinstance(v, str):
            return [x.strip() for x in v.split(",") if x.strip()]
        return []

class CandidateOut(BaseModel):
    id: int
    full_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

# -----------------------
# Allowed DB cols & helpers
# -----------------------
ALLOWED_DB_COLS: Tuple[str, ...] = (
    "job_position",
    "company",
    "full_name",
    "fathers_name",
    "email_address",
    "phone_number",
    "date_of_birth",
    "gender",
    "aadhaar_number",
    "street_address",
    "area_locality",
    "city",
    "pincode",
    "select_languages",
    "educational_qualification",
    "work_experience",
    "additional_months",
    "technical_professional_skills",
    "preferred_industries_categories",
    "preferred_employment_types",
    "preferred_work_types",
    "source",
    "status",
    "notes",
)

ALIASES: Dict[str, str] = {
    "name": "full_name",
    "email": "email_address",
    "phone": "phone_number",
    "father_name": "fathers_name",
    "dob": "date_of_birth",
    "position": "job_position",
}

_ENUM_ALLOWED = {"Applied", "Screening", "Interview", "Selected", "Rejected", "Joined"}

def _map_status_to_enum(v: Optional[str]) -> str:
    if not v:
        return "Applied"
    s = str(v).strip().lower()
    if s in {"new", "created"}:
        return "Applied"
    if s in {"contacted", "screened", "screening"}:
        return "Screening"
    if s in {"interview", "interviewed", "interviewing"}:
        return "Interview"
    if s in {"selected", "offer", "offered"}:
        return "Selected"
    if s in {"rejected", "declined"}:
        return "Rejected"
    if s in {"joined", "hired"}:
        return "Joined"
    cap = s.capitalize()
    return cap if cap in _ENUM_ALLOWED else "Applied"

def _as_list(v: Any) -> List[str]:
    if v is None:
        return []
    if isinstance(v, (list, tuple)):
        return [str(x).strip() for x in v if str(x).strip()]
    if isinstance(v, str):
        return [x.strip() for x in v.split(",") if x.strip()]
    return []

def _parse_data_json(data_json: str) -> Dict[str, Any]:
    try:
        raw = json.loads(data_json or "{}")
        if not isinstance(raw, dict):
            raise ValueError("data must be a JSON object")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON in 'data' form field")

    normalized: Dict[str, Any] = {}
    for k, v in raw.items():
        dbk = ALIASES.get(k, k)
        normalized[dbk] = v

    # normalize lists
    if "select_languages" in normalized:
        normalized["select_languages"] = _as_list(normalized.get("select_languages"))
    if "preferred_employment_types" in normalized:
        normalized["preferred_employment_types"] = _as_list(normalized.get("preferred_employment_types"))

    # if UI sent work_types array, use first as preferred_work_types when missing
    if "work_types" in raw and not normalized.get("preferred_work_types"):
        wl = _as_list(raw.get("work_types"))
        normalized["preferred_work_types"] = wl[0] if wl else None

    ui_status = raw.get("status") or normalized.get("status")
    normalized["status"] = _map_status_to_enum(ui_status)

    return normalized

def _pick_params_for_write(d: Dict[str, Any]) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for k in ALLOWED_DB_COLS:
        if k in d:
            out[k] = d[k]
    # normalize types expected by DB
    if "select_languages" in out:
        out["select_languages"] = _as_list(out.get("select_languages"))
    if "preferred_employment_types" in out:
        out["preferred_employment_types"] = _as_list(out.get("preferred_employment_types"))
    pwt = out.get("preferred_work_types")
    if isinstance(pwt, (list, tuple)):
        out["preferred_work_types"] = (pwt[0] if pwt else None)
    out["status"] = _map_status_to_enum(d.get("status"))
    return out

# -----------------------
# Lifecycle / migration helpers
# -----------------------
async def _ensure_optional_columns_and_resume() -> None:
    """
    Add optional columns (source, notes, company) and inline resume columns if they don't exist.
    Idempotent; safe to run on startup.
    """
    try:
        await async_exec(
            """
            ALTER TABLE candidates
              ADD COLUMN IF NOT EXISTS source TEXT,
              ADD COLUMN IF NOT EXISTS notes  TEXT,
              ADD COLUMN IF NOT EXISTS company TEXT,
              ADD COLUMN IF NOT EXISTS resume_data BYTEA,
              ADD COLUMN IF NOT EXISTS resume_filename TEXT,
              ADD COLUMN IF NOT EXISTS resume_mime_type TEXT,
              ADD COLUMN IF NOT EXISTS resume_size_bytes INT,
              ADD COLUMN IF NOT EXISTS resume_url TEXT;
            """,
            {},
        )
    except Exception as e:
        print(f"[candidates] ensure optional columns failed: {e}")

async def startup_candidates() -> None:
    try:
        await open_async_pool()
        # quick ping - use public/default connection (don't set schema here)
        await async_query("SELECT 1 AS ok;", params=None, set_schema=False)
        await _ensure_optional_columns_and_resume()
        print("[candidates] DB ping OK & optional columns ensured")
    except Exception as e:
        print(f"[candidates] startup DB error: {e}")
        # re-raise so uvicorn startup fails if you want it to fail hard:
        # raise

async def shutdown_candidates() -> None:
    try:
        await close_async_pool()
        print("[candidates] async pool closed")
    except Exception as e:
        print(f"[candidates] shutdown error: {e}")

# -----------------------
# Read columns (full)
# -----------------------
COLS_READ_FULL = """
    id,
    job_position,
    company,
    full_name,
    fathers_name,
    email_address AS email,
    phone_number  AS phone,
    date_of_birth,
    gender::text AS gender,
    aadhaar_number,

    street_address,
    area_locality,
    city,
    pincode,

    select_languages,
    educational_qualification,
    work_experience,
    additional_months,

    technical_professional_skills,
    preferred_industries_categories,
    preferred_employment_types,
    preferred_work_types::text AS preferred_work_types,

    source,
    status::text AS status,
    notes,
    created_at
"""

# -----------------------
# Utility: column exists
# -----------------------
async def _column_exists(table: str, column: str) -> bool:
    """
    Check whether a column exists on the given table in the *current schema*.
    Works without raising on installations where the column is missing.
    """
    try:
        rows = await async_query(
            """
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = %(t)s
              AND column_name = %(c)s
            LIMIT 1;
            """,
            {"t": table, "c": column},
            # don't force schema here; information_schema is global
            set_schema=False,
        )
        return bool(rows)
    except Exception as e:
        # If information_schema is restricted for some reason, fail closed (no column)
        print(f"[candidates] _column_exists error: {e}")
        return False

# -----------------------
# Options endpoint for Applications page
# -----------------------
@router.get("/api/candidates/options")
async def candidate_options() -> List[Dict[str, Any]]:
    """
    Minimal option set for dropdowns:
      - id
      - full_name
      - job_position
      - company (NULL if column doesn't exist)
    """
    try:
        has_company = await _column_exists("candidates", "company")

        if has_company:
            rows = await async_query(
                """
                SELECT id, full_name, job_position, company
                FROM candidates
                ORDER BY full_name ASC NULLS LAST
                LIMIT 5000;
                """
            )
        else:
            rows = await async_query(
                """
                SELECT id, full_name, job_position, NULL::text AS company
                FROM candidates
                ORDER BY full_name ASC NULLS LAST
                LIMIT 5000;
                """
            )

        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"/api/candidates/options failed: {e}")

# -----------------------
# Routes
# -----------------------
@router.get("/api/candidates", response_model=dict)
async def list_candidates(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=1000),
) -> Dict[str, Any]:
    try:
        offset = (page - 1) * page_size
        total_rows = await async_query("SELECT COUNT(*) AS n FROM candidates;")
        total = int(total_rows[0]["n"]) if total_rows else 0

        rows = await async_query(
            f"""
            SELECT
                {COLS_READ_FULL},
                CASE WHEN resume_data IS NOT NULL THEN id::text ELSE NULL END AS resume_url
            FROM candidates
            ORDER BY COALESCE(created_at, NOW()) DESC, id DESC
            LIMIT %(limit)s OFFSET %(offset)s;
            """,
            {"limit": page_size, "offset": offset},
        )

        return {
            "items": rows,
            "page": page,
            "page_size": page_size,
            "total": total,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"/api/candidates failed: {e}")

@router.get("/api/candidates/{candidate_id}", response_model=CandidateOut)
async def get_candidate(candidate_id: int):
    try:
        rows = await async_query(
            f"""
            SELECT
                id, full_name, email_address AS email, phone_number AS phone,
                source, status::text AS status, notes, created_at
            FROM candidates
            WHERE id = %(id)s
            LIMIT 1;
            """,
            {"id": candidate_id},
        )
        if not rows:
            raise HTTPException(status_code=404, detail="Candidate not found")
        return rows[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"/api/candidates/{{id}} failed: {e}")

@router.patch("/api/candidates/{candidate_id}")
async def update_candidate(candidate_id: int, payload: CandidateIn):
    try:
        params_in = payload.dict()
        params = _pick_params_for_write(params_in)
        if not params:
            return {"ok": True}
        params["id"] = candidate_id

        set_parts = [f"{col}=%({col})s" for col in params.keys() if col != "id"]
        if set_parts:
            set_sql = ", ".join(set_parts) + ", updated_at=NOW()"
            affected = await async_exec(
                f"UPDATE candidates SET {set_sql} WHERE id = %(id)s;",
                params,
            )
            if affected == 0:
                raise HTTPException(status_code=404, detail="Candidate not found")
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"/api/candidates/{candidate_id} update failed: {e}")

@router.patch("/api/candidates/{candidate_id}/status")
async def update_candidate_status(candidate_id: int, payload: Dict[str, str]):
    try:
        new_status_enum = _map_status_to_enum((payload or {}).get("status"))
        affected = await async_exec(
            "UPDATE candidates SET status = %(status)s, updated_at = NOW() WHERE id = %(id)s;",
            {"status": new_status_enum, "id": candidate_id},
        )
        if affected == 0:
            raise HTTPException(status_code=404, detail="Candidate not found")
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"/api/candidates/{candidate_id}/status failed: {e}")

@router.delete("/api/candidates/{candidate_id}")
async def delete_candidate(candidate_id: int):
    try:
        affected = await async_exec("DELETE FROM candidates WHERE id = %(id)s;", {"id": candidate_id})
        if affected == 0:
            raise HTTPException(status_code=404, detail="Candidate not found")
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"/api/candidates/{candidate_id} delete failed: {e}")

# -----------------------
# Multipart / resume inline
# -----------------------
async def _upsert_resume_inline(candidate_id: int, file: UploadFile) -> None:
    fname = (file.filename or "resume").strip()
    ctype = (file.content_type or "application/octet-stream").strip().lower()
    if ctype not in (
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/octet-stream",
    ):
        ctype = "application/octet-stream"

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file upload")

    await async_exec(
        """
        UPDATE candidates
        SET
            resume_data        = %(bytes)s,
            resume_filename    = %(fn)s,
            resume_mime_type   = %(ct)s,
            resume_size_bytes  = %(size)s,
            resume_url         = NULL,
            updated_at         = NOW()
        WHERE id = %(id)s;
        """,
        {"id": candidate_id, "fn": fname, "ct": ctype, "bytes": data, "size": len(data)},
    )

@router.post("/api/candidates", status_code=status.HTTP_201_CREATED)
async def create_candidate_multipart(
    data: str = Form(..., description="JSON string of candidate payload"),
    resume: Optional[UploadFile] = File(None),
):
    try:
        parsed = _parse_data_json(data)
        # required fields check — keep strict to match your frontend validation
        required_keys = [
            "job_position",
            "full_name",
            "fathers_name",
            "email_address",
            "phone_number",
            "date_of_birth",
            "gender",
            "preferred_work_types",
        ]
        missing = [k for k in required_keys if not parsed.get(k)]
        if missing:
            raise HTTPException(status_code=400, detail=f"Missing required fields: {', '.join(missing)}")

        params = _pick_params_for_write(parsed)
        cols = ", ".join(params.keys())
        vals = ", ".join(f"%({k})s" for k in params.keys())
        rows = await async_query(
            f"INSERT INTO candidates ({cols}) VALUES ({vals}) RETURNING id;",
            params,
        )
        if not rows:
            raise HTTPException(status_code=500, detail="Insert failed")
        cid = int(rows[0]["id"])

        if resume is not None:
            await _upsert_resume_inline(cid, resume)

        return {"ok": True, "id": cid}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"/api/candidates (multipart POST) failed: {e}")

@router.put("/api/candidates/{candidate_id}", status_code=status.HTTP_200_OK)
async def update_candidate_multipart(
    candidate_id: int,
    data: str = Form(..., description="JSON string of candidate payload"),
    resume: Optional[UploadFile] = File(None),
):
    try:
        parsed = _parse_data_json(data)
        params = _pick_params_for_write(parsed)
        params["id"] = candidate_id

        if params:
            set_parts = [f"{col}=%({col})s" for col in params.keys() if col != "id"]
            set_sql = ", ".join(set_parts) + ", updated_at=NOW()"
            affected = await async_exec(
                f"UPDATE candidates SET {set_sql} WHERE id=%(id)s;",
                params,
            )
            if affected == 0:
                raise HTTPException(status_code=404, detail="Candidate not found")

        if resume is not None:
            await _upsert_resume_inline(candidate_id, resume)

        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"/api/candidates/{candidate_id} (multipart PUT) failed: {e}")

@router.get("/api/candidates/resume/{candidate_id}")
async def download_resume(candidate_id: int):
    try:
        rows = await async_query(
            """
            SELECT resume_filename, resume_mime_type, resume_data
            FROM candidates
            WHERE id = %(id)s
            LIMIT 1;
            """,
            {"id": candidate_id},
        )
        if not rows:
            raise HTTPException(status_code=404, detail="Candidate not found")

        r = rows[0]
        filename = r.get("resume_filename") or f"resume-{candidate_id}.pdf"
        content_type = r.get("resume_mime_type") or "application/octet-stream"
        file_bytes = r.get("resume_data")
        if file_bytes is None:
            raise HTTPException(status_code=404, detail="Resume not found")

        data = bytes(file_bytes)
        return StreamingResponse(
            iter([data]),
            media_type=content_type,
            headers={"Content-Disposition": f'inline; filename="{filename}"'},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"/api/candidates/resume/{candidate_id} failed: {e}")
