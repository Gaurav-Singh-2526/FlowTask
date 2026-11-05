"""
main.py — FastAPI application entry point.

Responsibilities:
  1. Create DB tables on startup.
  2. Register a custom logging middleware that records HTTP method, path,
     and processing time in milliseconds for every request.
  3. Configure CORS to accept requests from the frontend dev server
     (http://localhost:5500 and http://127.0.0.1:5500) with an explicit
     list of allowed methods and headers.
  4. Mount all routers: users, projects, tasks, stats.

Run with:
    uvicorn main:app --reload --port 8000
"""

import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from config import ALLOWED_ORIGINS
from database import create_tables
from routers import messages, projects, quick_add, stats, tasks, users

# ---------------------------------------------------------------------------
# Standard library logger — outputs to the console by default.
# Replace the handler / formatter to write to a log file if needed.
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("app")


# ===========================================================================
# Custom logging middleware
# ===========================================================================

class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Runs on **every** request.  Logs:
      - HTTP method  (GET, POST, …)
      - Request path (/tasks/, /users/3, …)
      - Processing time in milliseconds
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        start = time.perf_counter()
        response: Response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000

        logger.info(
            "%s %s  →  %d  (%.2f ms)",
            request.method,
            request.url.path,
            response.status_code,
            elapsed_ms,
        )
        return response


# ===========================================================================
# Application factory
# ===========================================================================

app = FastAPI(
    title="Task Manager API",
    description=(
        "REST backend with Users, Projects, and Tasks. "
        "Includes per-project task statistics computed via SQL aggregation."
    ),
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# 1. Custom logging middleware
#    (added before CORS so every request — including preflight — is logged)
# ---------------------------------------------------------------------------

app.add_middleware(LoggingMiddleware)

# ---------------------------------------------------------------------------
# 2. CORS middleware
#    Origins: the two common VS Code Live Server / browser addresses used
#             by the companion frontend.
#    Methods: explicitly listed (not the framework default "*").
#    Headers: explicitly listed (not the framework default "*").
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set(ALLOWED_ORIGINS + [
        "https://taskflowaiassistance.netlify.app",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:5501",
        "http://127.0.0.1:5501",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:3000",
    ])),
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# 3. Startup event — create DB tables
# ---------------------------------------------------------------------------

@app.on_event("startup")
def on_startup() -> None:
    """Create all tables that do not yet exist in the SQLite database."""
    create_tables()
    logger.info("Database tables ensured / created.")


# ---------------------------------------------------------------------------
# 4. Routers
# ---------------------------------------------------------------------------

app.include_router(users.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(messages.router)
app.include_router(quick_add.router)
app.include_router(stats.router)


# ---------------------------------------------------------------------------
# 5. Health-check root endpoint (Supports both GET and HEAD for Render)
# ---------------------------------------------------------------------------

@app.api_route("/", methods=["GET", "HEAD"], tags=["health"])
def health_check():
    """Quick liveness check — returns 200 with a status message for GET and HEAD."""
    return {"status": "ok", "message": "Task Manager API is running."}

@app.api_route("/health", methods=["GET", "HEAD"], tags=["health"])
def health():
    """Explicit /health endpoint for cloud providers like Render."""
    return {"status": "healthy"}

if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port)
