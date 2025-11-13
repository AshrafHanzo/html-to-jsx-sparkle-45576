# backend/routes/db_connection.py
# psycopg v3 connection helpers (sync + async) with schema handling.
from __future__ import annotations

import os
from typing import Optional, Dict, Any, List, Union

import psycopg
from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool, ConnectionPool

# ---------- env helper ----------
def _env(name: str, default: str) -> str:
    v = os.getenv(name)
    if v is None or not str(v).strip():
        return default
    return str(v).strip()

# ---------- configuration (override with environment variables) ----------
PG_HOST: str = _env("PGHOST", "103.14.123.44")
PG_PORT: str = _env("PGPORT", "30018")
PG_DB: str = _env("PGDATABASE", "postgres")
PG_USER: str = _env("PGUSER", "dhi_admin")
PG_PASS: str = _env("PGPASSWORD", "dhi@123")
PG_SCHEMA: str = _env("PGSCHEMA", "dhi")
PG_SSLMODE: str = _env("PGSSLMODE", "disable")  # local/docker default

# Use key/value conninfo (avoids URI escaping problems)
DSN: str = (
    f"host={PG_HOST} port={PG_PORT} dbname={PG_DB} "
    f"user={PG_USER} password={PG_PASS} sslmode={PG_SSLMODE} connect_timeout=5"
)

# ---------- pools (lazy) ----------
_async_pool: Optional[AsyncConnectionPool] = None
_sync_pool: Optional[ConnectionPool] = None

def _print_effective_config() -> None:
    print(
        "[DB] "
        f"host={PG_HOST} port={PG_PORT} db={PG_DB} user={PG_USER} "
        f"schema={PG_SCHEMA} sslmode={PG_SSLMODE}"
    )

_print_effective_config()

# ---------- pool getters ----------
def get_async_pool(min_size: int = 1, max_size: int = 10) -> AsyncConnectionPool:
    global _async_pool
    if _async_pool is None:
        _async_pool = AsyncConnectionPool(
            conninfo=DSN,
            min_size=min_size,
            max_size=max_size,
            kwargs={},   # set row_factory per-cursor
            open=False,
        )
    return _async_pool

def get_sync_pool(min_size: int = 1, max_size: int = 10) -> ConnectionPool:
    global _sync_pool
    if _sync_pool is None:
        _sync_pool = ConnectionPool(
            conninfo=DSN,
            min_size=min_size,
            max_size=max_size,
            kwargs={"row_factory": dict_row},
        )
    return _sync_pool

# ---------- helpers ----------
def _schema_sql() -> str:
    safe = PG_SCHEMA
    if not safe.replace("_", "").isalnum():
        raise ValueError(f"Unsafe schema name: {PG_SCHEMA!r}")
    return f"SET search_path TO {safe}, public;"

Params = Optional[Union[Dict[str, Any], tuple, list]]

# ---------- ASYNC ----------
async def async_query(sql: str, params: Params = None, set_schema: bool = True) -> List[Dict[str, Any]]:
    pool = get_async_pool()
    if pool.closed:
        await pool.open()
    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            if set_schema:
                await cur.execute(_schema_sql())
            if params is None:
                await cur.execute(sql)
            else:
                await cur.execute(sql, params)
            rows = await cur.fetchall()
            return rows

async def async_exec(sql: str, params: Params = None, set_schema: bool = True) -> int:
    pool = get_async_pool()
    if pool.closed:
        await pool.open()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            if set_schema:
                await cur.execute(_schema_sql())
            if params is None:
                await cur.execute(sql)
            else:
                await cur.execute(sql, params)
            return cur.rowcount

# ---------- SYNC ----------
def query(sql: str, params: Params = None, set_schema: bool = True) -> List[Dict[str, Any]]:
    pool = get_sync_pool()
    with pool.connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            if set_schema:
                cur.execute(_schema_sql())
            if params is None:
                cur.execute(sql)
            else:
                cur.execute(sql, params)
            return cur.fetchall()

def exec_(sql: str, params: Params = None, set_schema: bool = True) -> int:
    pool = get_sync_pool()
    with pool.connection() as conn:
        with conn.cursor() as cur:
            if set_schema:
                cur.execute(_schema_sql())
            if params is None:
                cur.execute(sql)
            else:
                cur.execute(sql, params)
            conn.commit()
            return cur.rowcount

# ---------- lifecycle ----------
async def open_async_pool() -> None:
    pool = get_async_pool()
    if pool.closed:
        await pool.open()

async def close_async_pool() -> None:
    global _async_pool
    if _async_pool and not _async_pool.closed:
        await _async_pool.close()
    _async_pool = None

def close_sync_pool() -> None:
    global _sync_pool
    if _sync_pool:
        _sync_pool.close()
    _sync_pool = None

# ---------- health ----------
def ping() -> bool:
    try:
        rows = query("SELECT 1 AS ok;", set_schema=False)
        return bool(rows and rows[0].get("ok") == 1)
    except Exception:
        return False
