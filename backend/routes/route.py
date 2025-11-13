# backend/routes/route.py
from fastapi import APIRouter, HTTPException, Path, Body, status
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

# Relative import (db_connection.py is in same folder)
from .db_connection import query, exec_, async_query

router = APIRouter(tags=["jobs"])

class StatusPayload(BaseModel):
    status: str

ALLOWED_STATUS = {"Action", "Hold", "Closed"}

def map_job_row(row: Dict[str, Any]) -> Dict[str, Any]:
    salary_min = row.get("salary_min")
    salary_max = row.get("salary_max")
    age_min = row.get("age_min")
    age_max = row.get("age_max")

    age_range: Optional[str] = None
    if age_min is not None and age_max is not None:
        age_range = f"{age_min} - {age_max}"

    salary_range: Optional[str] = None
    if (salary_min is None or salary_max is None) and (salary_min is not None or salary_max is not None):
        if salary_min is not None and salary_max is None:
            salary_range = f"₹ {salary_min}+"
        elif salary_max is not None and salary_min is None:
            salary_range = f"Up to ₹ {salary_max}"

    created_at = row.get("created_at")
    if isinstance(created_at, datetime):
        posted_date = created_at.isoformat()
    else:
        posted_date = created_at if created_at is not None else None

    return {
        "id": str(row.get("id")),
        "title": row.get("job_title"),
        "company": row.get("company"),
        "openings": row.get("openings"),
        "type": row.get("type"),
        "work_mode": row.get("work_mode"),
        "salary_min": salary_min,
        "salary_max": salary_max,
        "salary_range": salary_range,
        "status": row.get("status"),
        "urgency": row.get("urgency"),
        "commission": row.get("commission"),
        "tenure": row.get("tenure"),
        "shift": row.get("shift"),
        "category": row.get("category"),
        "experience": row.get("experience"),
        "age_range": age_range,
        "address": row.get("address"),
        "description": row.get("job_description"),
        "required_skills": row.get("required_skills"),
        "preferred_skills": row.get("preferred_skills"),
        "nice_to_have": row.get("nice_to_have"),
        "languages_required": row.get("languages_required"),
        "seo_keywords": row.get("seo_keywords"),
        "posted_date": posted_date,
    }

@router.get("/", tags=["health"])
def root():
    return {"ok": True, "service": "DHI Jobs Router"}

@router.get("/api/health", tags=["health"])
def health():
    try:
        _ = query("SELECT 1 AS ok;")
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/jobs", response_model=List[Dict[str, Any]])
def list_jobs() -> List[Dict[str, Any]]:
    try:
        rows = query(
            """
            SELECT
                id,
                job_title,
                company,
                openings,
                (type)::text        AS type,
                (work_mode)::text   AS work_mode,
                salary_min,
                salary_max,
                (status)::text      AS status,
                (urgency)::text     AS urgency,
                commission,
                tenure,
                shift,
                category,
                experience,
                age_min,
                age_max,
                address,
                job_description,
                required_skills,
                preferred_skills,
                nice_to_have,
                languages_required,
                seo_keywords,
                created_at
            FROM jobs
            ORDER BY COALESCE(created_at, NOW()) DESC, id DESC;
            """
        )
        return [map_job_row(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"/api/jobs failed: {e}")

@router.post("/api/jobs", status_code=status.HTTP_201_CREATED)
def create_job(data: dict = Body(...)):
    if not data.get("job_title"):
        raise HTTPException(status_code=400, detail="Missing job_title")
    if not data.get("company"):
        raise HTTPException(status_code=400, detail="Missing company")

    try:
        sql = """
        INSERT INTO jobs (
            job_title, company, openings, type, work_mode, salary_min, salary_max,
            status, urgency, commission, tenure, shift, category, experience,
            age_min, age_max, address, job_description, required_skills,
            preferred_skills, nice_to_have, languages_required, seo_keywords
        ) VALUES (
            %(job_title)s, %(company)s, %(openings)s, %(type)s, %(work_mode)s,
            %(salary_min)s, %(salary_max)s, %(status)s, %(urgency)s,
            %(commission)s, %(tenure)s, %(shift)s, %(category)s, %(experience)s,
            %(age_min)s, %(age_max)s, %(address)s, %(job_description)s,
            %(required_skills)s, %(preferred_skills)s, %(nice_to_have)s,
            %(languages_required)s, %(seo_keywords)s
        )
        RETURNING id;
        """
        rows = query(sql, data)
        if not rows:
            raise HTTPException(status_code=500, detail="Insert failed")
        return {"ok": True, "id": str(rows[0]["id"])}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"/api/jobs (POST) failed: {e}")

@router.put("/api/jobs/{job_id}", status_code=status.HTTP_200_OK)
def update_job(job_id: str = Path(..., description="Job ID"), data: dict = Body(...)):
    """
    Update an existing job identified by job_id.
    Expects the same DB-keyed payload as POST (job_title, company, etc).
    """
    try:
        jid = int(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job id")

    if not data.get("job_title"):
        raise HTTPException(status_code=400, detail="Missing job_title")
    if not data.get("company"):
        raise HTTPException(status_code=400, detail="Missing company")

    try:
        sql = """
        UPDATE jobs SET
            job_title = %(job_title)s,
            company = %(company)s,
            openings = %(openings)s,
            type = %(type)s,
            work_mode = %(work_mode)s,
            salary_min = %(salary_min)s,
            salary_max = %(salary_max)s,
            status = %(status)s,
            urgency = %(urgency)s,
            commission = %(commission)s,
            tenure = %(tenure)s,
            shift = %(shift)s,
            category = %(category)s,
            experience = %(experience)s,
            age_min = %(age_min)s,
            age_max = %(age_max)s,
            address = %(address)s,
            job_description = %(job_description)s,
            required_skills = %(required_skills)s,
            preferred_skills = %(preferred_skills)s,
            nice_to_have = %(nice_to_have)s,
            languages_required = %(languages_required)s,
            seo_keywords = %(seo_keywords)s,
            updated_at = NOW()
        WHERE id = %(id)s
        RETURNING id;
        """
        params = dict(data)  # shallow copy
        params["id"] = jid
        rows = query(sql, params)
        if not rows:
            raise HTTPException(status_code=404, detail="Job not found")
        return {"ok": True, "id": str(rows[0]["id"])}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"/api/jobs/{job_id} (PUT) failed: {e}")

@router.patch("/api/jobs/{job_id}/status")
def update_status(
    job_id: str = Path(..., description="Job ID"),
    payload: StatusPayload = None,
):
    if payload is None or not payload.status:
        raise HTTPException(status_code=400, detail="Missing status")
    if payload.status not in ALLOWED_STATUS:
        raise HTTPException(status_code=400, detail="Invalid status")

    try:
        jid = int(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job id")

    try:
        affected = exec_(
            "UPDATE jobs SET status = %(status)s, updated_at = NOW() WHERE id = %(id)s;",
            {"status": payload.status, "id": jid},
        )
        if affected == 0:
            raise HTTPException(status_code=404, detail="Job not found")
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"/api/jobs/{job_id}/status failed: {e}")

@router.delete("/api/jobs/{job_id}")
def delete_job(job_id: str = Path(..., description="Job ID")):
    try:
        jid = int(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job id")

    try:
        affected = exec_("DELETE FROM jobs WHERE id = %(id)s;", {"id": jid})
        if affected == 0:
            raise HTTPException(status_code=404, detail="Job not found")
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"/api/jobs/{job_id} delete failed: {e}")

@router.get("/api/debug/ping-jobs")
def ping_jobs():
    try:
        r = query("SELECT id FROM jobs ORDER BY id DESC LIMIT 1;", None)
        return {"ok": True, "sample": r}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"debug failed: {e}")
