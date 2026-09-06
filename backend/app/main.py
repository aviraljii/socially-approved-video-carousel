from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.interactions import router as interactions_router
from app.routes.videos import router as videos_router


# =========================================================
# APPLICATION
# =========================================================

app = FastAPI(
    title="Socially Approved Video Carousel API",
    description=(
        "Backend API for the Socially Approved "
        "video carousel assessment."
    ),
    version="1.0.0",
)


# =========================================================
# CORS
# =========================================================
#
# Local development:
#   http://localhost:3000
#   http://localhost:3001
#   http://127.0.0.1:3000
#   http://127.0.0.1:3001
#
# Production frontend:
#   https://socially-approved-frontend-5f40.onrender.com
#
# IMPORTANT:
# The production frontend URL must exactly match the
# browser origin being used by the deployed frontend.
#

ALLOWED_ORIGINS = [
    # Local development
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",

    # Render production frontend
    "https://socially-approved-frontend-5f40.onrender.com",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# API ROUTES
# =========================================================

app.include_router(videos_router)
app.include_router(interactions_router)


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get(
    "/",
    tags=["Health"],
)
def root():
    return {
        "status": "ok",
        "service": "Socially Approved Video Carousel API",
    }