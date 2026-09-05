from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.routes import entries, participation, reports

app = FastAPI(title="Crew Logger API")

# Browser clients are a different origin from the API (Expo's web dev server
# runs on :8081, this on :8000), so without this every fetch from the app is
# blocked by the browser. Origins come from config — see app/config.py for
# why this is not "*".
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(entries.router)
app.include_router(participation.router)
app.include_router(reports.router)
