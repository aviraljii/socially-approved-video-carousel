from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.interactions import router as interactions_router
from app.routes.videos import router as videos_router


app = FastAPI(
    title="Socially Approved Video Carousel API",
    description="Backend API for the Socially Approved video carousel assessment.",
    version="1.0.0",
)

# Frontend origins allowed to access the API.
# Local development + Render production frontend.
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://socially-approved-frontend.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes.
app.include_router(videos_router)
app.include_router(interactions_router)


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "ok",
        "service": "Socially Approved Video Carousel API",
    }