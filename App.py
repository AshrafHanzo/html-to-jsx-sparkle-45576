# app.py (root of dhi_finish)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pathlib
import sys
import traceback

BASE_DIR = pathlib.Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.append(str(BACKEND_DIR))

# ---------------- Existing routers ----------------
from backend.routes.route import router as jobs_router
from backend.routes.candidates import (
    router as candidates_router,
    startup_candidates,
    shutdown_candidates,
)

# NEW: auth router
from backend.routes.login_route import router as login_router, startup_auth

# ---------- Applications router (safe import) ----------
applications_router = None
try:
    # Your file name appears to be "Applications.py" (capital A)
    from backend.routes.Applications import router as _applications_router  # type: ignore
    applications_router = _applications_router
except Exception as e_upper:
    # On some systems or repos, the filename might be lowercase
    try:
        from backend.routes.applications import router as _applications_router  # type: ignore
        applications_router = _applications_router
    except Exception as e_lower:
        print(
            "[app] WARNING: Applications router could not be imported. "
            "Jobs/Candidates/Auth will still work.\n"
            f"Upper-case import error: {e_upper}\n"
            f"Lower-case import error: {e_lower}\n"
            f"Traceback:\n{traceback.format_exc()}"
        )

# ---------------- FastAPI app ----------------
app = FastAPI(title="DHI Master API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Lifecycle ----------------
@app.on_event("startup")
async def _startup():
    await startup_candidates()  # existing
    await startup_auth()        # NEW: ensure login table
    print("[app] Startup complete — DB and routers ready.")

@app.on_event("shutdown")
async def _shutdown():
    await shutdown_candidates()
    print("[app] Shutdown complete — DB connections closed.")

# ---------------- Health ----------------
@app.get("/up")
def up():
    return {"ok": True, "service": "DHI Master API"}

# ---------------- Mount routers ----------------
# (no extra prefix — routes already start with /api/…)
app.include_router(jobs_router)
app.include_router(candidates_router)
app.include_router(login_router)  # /api/auth/*

# Register Applications only if import actually worked
if applications_router is not None:
    app.include_router(applications_router)  # /api/applications/*
else:
    print("[app] Applications router NOT registered (see warning above).")
