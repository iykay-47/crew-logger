import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_EXPIRY_DAYS = int(os.environ["JWT_EXPIRY_DAYS"])

# Browser origins allowed to call this API. Comma-separated.
#
# Deliberately NOT "*": that reflex default sends
# Access-Control-Allow-Origin to every site on the internet, which is wrong
# the moment this is reachable from anywhere but localhost. Keep it an
# explicit list, configured per environment.
#
# The default covers Expo's web dev server (:8081). It is not needed at all
# if the frontend is served same-origin behind a reverse proxy — see
# ../docs/deployment.md.
CORS_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "CORS_ORIGINS", "http://localhost:8081,http://127.0.0.1:8081"
    ).split(",")
    if origin.strip()
]
