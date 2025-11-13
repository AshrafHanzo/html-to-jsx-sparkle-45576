# backend/routes/Applications.py
from __future__ import annotations

from typing import Any, Dict, List, Optional, Union
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

# Same helpers as candidates.py
from .db_connection import async_query, async_exec

router = APIRouter(tags=["applications"])

# ---------- Allowed values ----------
_ALLOWED_STATUS = {
    "Applied",
    "Interview Scheduled",
    "Qualified",
    "Rejected",
    "Offer",
    "Joined",
}

# ---------- Fuzzy thresholds (tweakable) ----------
# Candidate name fuzzy threshold (0..1). Lower = more permissive.
_CANDIDATE_SIM_THRESHOLD = 0.45

# Job average (title+company) fuzzy threshold (0..1).
_JOB_AVG_SIM_THRESHOLD = 0.50

# ---------- Models ----------
class ApplicationIn(BaseModel):
    # prefer IDs; names kept for backward compatibility / UI convenience
    candidate_id: Optional[int] = None
    candidate_name: Optional[str] = None

    job_id: Optional[int] = None
    job_title: Optional[str] = None
    company: Optional[str] = None

    status: str = Field(..., description="Applied | Interview Scheduled | Qualified | Rejected | Offer | Joined")
    sourced_by: Optional[str] = None
    sourced_from: Optional[str] = None
    assigned_to: Optional[str] = None

    applied_on: Optional[str] = None   # YYYY-MM-DD
    interview: Optional[str] = None    # ISO timestamp
    comments: Optional[str] = None

    def normalized(self) -> Dict[str, Any]:
        data = self.dict(exclude_unset=True)
        st = data.get("status")
        if st is not None and st not in _ALLOWED_STATUS:
            raise HTTPException(status_code=400, detail=f"Invalid status '{st}'")
        return data


class ApplicationOut(BaseModel):
    id: int
    candidate_id: Optional[int] = None
    candidate_name: Optional[str] = None
    job_id: Optional[int] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    status: str
    sourced_by: Optional[str] = None
    sourced_from: Optional[str] = None
    assigned_to: Optional[str] = None
    applied_on: Optional[str] = None
    interview: Optional[str] = None
    comments: Optional[str] = None


# ---------- Helpers ----------
async def _ensure_trgm_extension() -> None:
    """
    Try to create the pg_trgm extension if it doesn't exist.
    Non-fatal: if it fails (no permissions), fuzzy queries will be skipped.
    """
    try:
        await async_exec("CREATE EXTENSION IF NOT EXISTS pg_trgm;", params=None, set_schema=False)
    except Exception:
        # silent fallback — some hosted DBs restrict extension creation
        pass


async def _resolve_candidate_id(candidate_id: Optional[int], candidate_name: Optional[str]) -> Optional[int]:
    # 1) prefer explicit numeric id
    if candidate_id is not None:
        return candidate_id

    if not candidate_name:
        return None

    # 3) exact match
    rows = await async_query(
        """
        SELECT id
        FROM dhi.candidates
        WHERE full_name = %(name)s
        LIMIT 1;
        """,
        {"name": candidate_name},
        set_schema=False,
    )
    if rows:
        try:
            return int(rows[0]["id"])
        except Exception:
            return None

    # 4) fuzzy match fallback using pg_trgm
    await _ensure_trgm_extension()

    try:
        sim_rows = await async_query(
            """
            SELECT id, similarity(lower(full_name), lower(%(name)s)) AS sim
            FROM dhi.candidates
            ORDER BY sim DESC
            LIMIT 1;
            """,
            {"name": candidate_name},
            set_schema=False,
        )
        if sim_rows:
            try:
                sim_val = float(sim_rows[0].get("sim") or 0.0)
            except Exception:
                sim_val = 0.0
            if sim_val >= _CANDIDATE_SIM_THRESHOLD:
                try:
                    return int(sim_rows[0]["id"])
                except Exception:
                    return None
    except Exception:
        # If pg_trgm not available or query fails, ignore and return None
        return None

    return None


async def _resolve_job_id(job_id: Optional[int], job_title: Optional[str], company: Optional[str]) -> Optional[int]:
    if job_id is not None:
        return job_id

    if not job_title or not company:
        return None

    rows = await async_query(
        """
        SELECT id
        FROM dhi.jobs
        WHERE job_title = %(job_title)s AND company = %(company)s
        LIMIT 1;
        """,
        {"job_title": job_title, "company": company},
        set_schema=False,
    )
    if rows:
        try:
            return int(rows[0]["id"])
        except Exception:
            return None

    await _ensure_trgm_extension()

    try:
        sim_rows = await async_query(
            """
            SELECT id,
              similarity(lower(job_title), lower(%(job_title)s)) AS title_sim,
              similarity(lower(company), lower(%(company)s)) AS company_sim
            FROM dhi.jobs
            ORDER BY (similarity(lower(job_title), lower(%(job_title)s)) + similarity(lower(company), lower(%(company)s))) DESC
            LIMIT 1;
            """,
            {"job_title": job_title, "company": company},
            set_schema=False,
        )
        if sim_rows:
            try:
                title_sim = float(sim_rows[0].get("title_sim") or 0.0)
            except Exception:
                title_sim = 0.0
            try:
                company_sim = float(sim_rows[0].get("company_sim") or 0.0)
            except Exception:
                company_sim = 0.0
            avg_sim = (title_sim + company_sim) / 2.0
            if avg_sim >= _JOB_AVG_SIM_THRESHOLD:
                try:
                    return int(sim_rows[0]["id"])
                except Exception:
                    return None
    except Exception:
        return None

    return None


def _non_null_fields(payload: Dict[str, Any], allowed: List[str]) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for k in allowed:
        if k in payload and payload[k] is not None:
            out[k] = payload[k]
    return out


# ---------- Option endpoint (build dropdowns for UI) ----------
@router.get("/api/applications/candidate-options")
async def candidate_options() -> Dict[str, List[Dict[str, Union[int, str]]]]:
    """
    Returns two lists:
      - candidates: { id, full_name }
      - jobs: { id, job_title, company }
    Frontend can use these to populate dropdowns for candidate and job selects.
    """
    try:
        candidates = await async_query(
            """
            SELECT id, COALESCE(full_name, '') AS full_name
            FROM dhi.candidates
            WHERE COALESCE(full_name, '') <> ''
            ORDER BY full_name ASC
            LIMIT 5000;
            """,
            params=None,
            set_schema=False,
        )

        jobs = await async_query(
            """
            SELECT id, COALESCE(job_title, '') AS job_title, COALESCE(company, '') AS company
            FROM dhi.jobs
            WHERE COALESCE(job_title, '') <> '' AND COALESCE(company, '') <> ''
            ORDER BY job_title ASC
            LIMIT 5000;
            """,
            params=None,
            set_schema=False,
        )

        return {"candidates": candidates, "jobs": jobs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"/api/applications/candidate-options failed: {e}")


# ---------- Backwards-compatible alias route ----------
# Some frontends call /api/candidates/options — provide the same data there.
@router.get("/api/candidates/options")
async def candidate_options_alias() -> Dict[str, List[Dict[str, Union[int, str]]]]:
    """
    Alias endpoint for older frontends expecting /api/candidates/options.
    Returns the same shape as /api/applications/candidate-options.
    """
    # Reuse the same implementation to keep behavior identical
    return await candidate_options()


# ---------- CRUD (use applications_view for joined fields) ----------
@router.get("/api/applications", response_model=List[ApplicationOut])
async def list_applications() -> List[ApplicationOut]:
    try:
        rows = await async_query(
            """
            SELECT
              id,
              candidate_id,
              candidate_name,
              job_id,
              job_title,
              company,
              status,
              sourced_by,
              sourced_from,
              assigned_to,
              to_char(applied_on, 'YYYY-MM-DD')  AS applied_on,
              to_char(interview,  'YYYY-MM-DD"T"HH24:MI:SSOF') AS interview,
              comments
            FROM dhi.applications_view
            ORDER BY applied_on DESC NULLS LAST, id DESC
            LIMIT 1000;
            """,
            params=None,
            set_schema=False,
        )
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"/api/applications failed: {e}")


@router.get("/api/applications/{app_id}", response_model=ApplicationOut)
async def get_application(app_id: int) -> ApplicationOut:
    try:
        rows = await async_query(
            """
            SELECT
              id,
              candidate_id,
              candidate_name,
              job_id,
              job_title,
              company,
              status,
              sourced_by,
              sourced_from,
              assigned_to,
              to_char(applied_on, 'YYYY-MM-DD') AS applied_on,
              to_char(interview,  'YYYY-MM-DD"T"HH24:MI:SSOF') AS interview,
              comments
            FROM dhi.applications_view
            WHERE id = %(id)s
            LIMIT 1;
            """,
            {"id": app_id},
            set_schema=False,
        )
        if not rows:
            raise HTTPException(status_code=404, detail="not found")
        return rows[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"/api/applications/{app_id} failed: {e}")


@router.post("/api/applications", response_model=ApplicationOut, status_code=201)
async def create_application(payload: ApplicationIn) -> ApplicationOut:
    try:
        data = payload.normalized()

        # Resolve candidate_id and job_id (accept either IDs or names/titles)
        cid = await _resolve_candidate_id(data.get("candidate_id"), data.get("candidate_name"))
        jid = await _resolve_job_id(data.get("job_id"), data.get("job_title"), data.get("company"))

        # Validation: require candidate and job (either by id or resolvable by text)
        if cid is None:
            raise HTTPException(status_code=400, detail="candidate_id or candidate_name (existing) is required")
        if jid is None:
            raise HTTPException(status_code=400, detail="job_id or (job_title and company) is required")
        if "status" not in data:
            raise HTTPException(status_code=400, detail="status is required")

        # Insert minimal canonical fields into applications table
        insert_sql = """
            INSERT INTO dhi.applications
              (candidate_id, job_id, status, sourced_by, sourced_from, assigned_to, applied_on, interview, comments)
            VALUES
              (%(candidate_id)s, %(job_id)s, %(status)s, %(sourced_by)s, %(sourced_from)s, %(assigned_to)s, %(applied_on)s, %(interview)s, %(comments)s)
            RETURNING id;
        """
        params = {
            "candidate_id": cid,
            "job_id": jid,
            "status": data["status"],
            "sourced_by": data.get("sourced_by"),
            "sourced_from": data.get("sourced_from"),
            "assigned_to": data.get("assigned_to"),
            "applied_on": data.get("applied_on"),
            "interview": data.get("interview"),
            "comments": data.get("comments"),
        }

        inserted = await async_query(insert_sql, params, set_schema=False)
        if not inserted:
            raise HTTPException(status_code=500, detail="Insert failed")

        new_id = int(inserted[0]["id"])

        # Return the joined row from the view
        rows = await async_query(
            """
            SELECT
              id,
              candidate_id,
              candidate_name,
              job_id,
              job_title,
              company,
              status,
              sourced_by,
              sourced_from,
              assigned_to,
              to_char(applied_on, 'YYYY-MM-DD')  AS applied_on,
              to_char(interview,  'YYYY-MM-DD"T"HH24:MI:SSOF') AS interview,
              comments
            FROM dhi.applications_view
            WHERE id = %(id)s
            LIMIT 1;
            """,
            {"id": new_id},
            set_schema=False,
        )
        if not rows:
            raise HTTPException(status_code=500, detail="Failed to fetch created application")
        return rows[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"/api/applications POST failed: {e}")


@router.put("/api/applications/{app_id}", response_model=ApplicationOut)
async def update_application(app_id: int, payload: ApplicationIn) -> ApplicationOut:
    try:
        allowed = [
            "candidate_id", "candidate_name", "job_id", "job_title", "company",
            "status", "sourced_by", "sourced_from", "assigned_to",
            "applied_on", "interview", "comments",
        ]
        incoming = _non_null_fields(payload.normalized(), allowed)

        if "candidate_id" not in incoming and "candidate_name" in incoming:
            resolved = await _resolve_candidate_id(None, incoming.get("candidate_name"))
            if resolved is not None:
                incoming["candidate_id"] = resolved

        if "job_id" not in incoming and ("job_title" in incoming or "company" in incoming):
            resolved_job = await _resolve_job_id(None, incoming.get("job_title"), incoming.get("company"))
            if resolved_job is not None:
                incoming["job_id"] = resolved_job

        if not incoming:
            rows = await async_query(
                """
                SELECT
                  id, candidate_id, candidate_name, job_id, job_title, company,
                  status, sourced_by, sourced_from, assigned_to,
                  to_char(applied_on, 'YYYY-MM-DD') AS applied_on,
                  to_char(interview,  'YYYY-MM-DD"T"HH24:MI:SSOF') AS interview,
                  comments
                FROM dhi.applications_view
                WHERE id = %(id)s
                LIMIT 1;
                """,
                {"id": app_id},
                set_schema=False,
            )
            if not rows:
                raise HTTPException(status_code=404, detail="not found")
            return rows[0]

        if "status" in incoming and incoming["status"] not in _ALLOWED_STATUS:
            raise HTTPException(status_code=400, detail=f"Invalid status '{incoming['status']}'")

        set_parts = []
        params: Dict[str, Any] = {}
        for col, val in incoming.items():
            if col in {"candidate_id", "job_id", "status", "sourced_by", "sourced_from", "assigned_to", "applied_on", "interview", "comments"}:
                set_parts.append(f"{col} = %({col})s")
                params[col] = val
        if not set_parts:
            rows = await async_query(
                "SELECT * FROM dhi.applications_view WHERE id = %(id)s LIMIT 1;",
                {"id": app_id},
                set_schema=False,
            )
            if not rows:
                raise HTTPException(status_code=404, detail="not found")
            return rows[0]

        params["id"] = app_id
        set_sql = ", ".join(set_parts)

        updated = await async_query(
            f"""
            UPDATE dhi.applications
            SET {set_sql}
            WHERE id = %(id)s
            RETURNING id;
            """,
            params,
            set_schema=False,
        )
        if not updated:
            raise HTTPException(status_code=404, detail="not found")

        rows = await async_query(
            """
            SELECT
              id, candidate_id, candidate_name, job_id, job_title, company,
              status, sourced_by, sourced_from, assigned_to,
              to_char(applied_on, 'YYYY-MM-DD') AS applied_on,
              to_char(interview,  'YYYY-MM-DD"T"HH24:MI:SSOF') AS interview,
              comments
            FROM dhi.applications_view
            WHERE id = %(id)s
            LIMIT 1;
            """,
            {"id": app_id},
            set_schema=False,
        )
        if not rows:
            raise HTTPException(status_code=500, detail="Failed to fetch updated application")
        return rows[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"/api/applications/{app_id} PUT failed: {e}")


@router.delete("/api/applications/{app_id}", status_code=204)
async def delete_application(app_id: int) -> None:
    try:
        affected = await async_exec(
            "DELETE FROM dhi.applications WHERE id = %(id)s;",
            {"id": app_id},
            set_schema=False,
        )
        if affected == 0:
            raise HTTPException(status_code=404, detail="not found")
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"/api/applications/{app_id} DELETE failed: {e}")
