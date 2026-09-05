from fastapi import FastAPI

from app.routes import entries, participation

app = FastAPI(title="Crew Logger API")

app.include_router(entries.router)
app.include_router(participation.router)
