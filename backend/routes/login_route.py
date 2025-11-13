# backend/routes/login_route.py
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Dict, Any
import bcrypt

from .db_connection import async_query, async_exec, open_async_pool

# Prefix keeps paths exactly /api/auth/*
router = APIRouter(prefix="/api/auth", tags=["auth"])


# ===== Pydantic payloads =====
class SignupPayload(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=6, max_length=256)


class LoginPayload(BaseModel):
    username: str
    password: str


# ===== Startup: ensure table =====
async def startup_auth() -> None:
    """Ensure the dhi.login_users table exists at startup."""
    await open_async_pool()
    await async_exec(
        """
        CREATE SCHEMA IF NOT EXISTS dhi;

        CREATE TABLE IF NOT EXISTS dhi.login_users (
            id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            last_login TIMESTAMPTZ
        );
        """,
        {},
        set_schema=False,
    )
    print("[auth] login_users table ensured")


# ===== Helpers =====
def _normalize_username(username: str) -> str:
    return username.strip().lower()


def _hash_password(password: str) -> str:
    """Hash using bcrypt safely (72-byte limit)"""
    if not isinstance(password, str):
        raise ValueError("Password must be a string")
    pw_bytes = password.strip().encode("utf-8")
    if len(pw_bytes) > 72:
        pw_bytes = pw_bytes[:72]
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(pw_bytes, salt)
    return hashed.decode("utf-8")


def _verify_password(password: str, hashed: str) -> bool:
    try:
        pw_bytes = password.strip().encode("utf-8")
        if len(pw_bytes) > 72:
            pw_bytes = pw_bytes[:72]
        return bcrypt.checkpw(pw_bytes, hashed.encode("utf-8"))
    except Exception:
        return False


# ===== Routes =====
@router.post("/signup")
async def signup(payload: SignupPayload):
    try:
        uname = _normalize_username(payload.username)
        if not uname:
            raise HTTPException(status_code=400, detail="Username required")

        # Check duplicate
        exists = await async_query(
            "SELECT id FROM dhi.login_users WHERE username = %(u)s LIMIT 1;",
            {"u": uname},
        )
        if exists:
            raise HTTPException(status_code=400, detail="Username already exists")

        pw_hash = _hash_password(payload.password)

        await async_exec(
            "INSERT INTO dhi.login_users (username, password_hash) VALUES (%(u)s, %(h)s);",
            {"u": uname, "h": pw_hash},
        )

        return {"ok": True, "message": f"Account created successfully for '{uname}'", "username": uname}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Signup failed: {e}")


@router.post("/login")
async def login(payload: LoginPayload):
    try:
        uname = _normalize_username(payload.username)
        rows = await async_query(
            """
            SELECT id, username, password_hash
            FROM dhi.login_users
            WHERE username = %(u)s
            LIMIT 1;
            """,
            {"u": uname},
        )
        if not rows:
            raise HTTPException(status_code=401, detail="Invalid username or password")

        user = rows[0]
        if not _verify_password(payload.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid username or password")

        await async_exec(
            "UPDATE dhi.login_users SET last_login = NOW() WHERE id = %(id)s;",
            {"id": user["id"]},
        )

        return {"ok": True, "message": "Login successful", "username": user["username"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {e}")


@router.get("/check")
async def check_health() -> Dict[str, Any]:
    rows = await async_query(
        "SELECT COUNT(*) AS n FROM dhi.login_users;",
        params=None,
        set_schema=False,
    )
    total = rows[0]["n"] if rows else 0
    return {"ok": True, "total_users": total, "timestamp": datetime.utcnow().isoformat()}
