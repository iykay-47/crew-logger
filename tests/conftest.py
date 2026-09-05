"""Shared test fixtures.

Tests run against the real dev Postgres (same DATABASE_URL, same 74 historic
records) rather than a separate test database. Isolation comes from wrapping
each test in an outer transaction with a SAVEPOINT
(join_transaction_mode="create_savepoint") so the app's own db.commit() calls
inside services/ don't end the outer transaction — everything a test does is
rolled back at teardown. See README.md "Running tests" for why.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.database import User
from app.services.database import engine, get_db


@pytest.fixture()
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture()
def user(db_session):
    test_user = User(
        username="test_user",
        employee_number="555000",
        password_hash="not-a-real-hash",
    )
    db_session.add(test_user)
    db_session.flush()
    return test_user
