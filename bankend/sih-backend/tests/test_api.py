"""API smoke tests for the current MongoDB/Motor backend."""

from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app.db import session as session_module
from app.main import app


@pytest.fixture
async def client() -> AsyncIterator[AsyncClient]:
    """Provide an API client backed by an isolated async in-memory database."""
    original_db = session_module.db
    mock_client = AsyncMongoMockClient()
    session_module.db = mock_client["api_test"]

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as api_client:
            yield api_client
    finally:
        session_module.db = original_db


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    response = await client.get("/")

    assert response.status_code == 200
    assert response.json()["version"] == "0.2.0"


@pytest.mark.asyncio
async def test_user_registration_and_login(client: AsyncClient):
    user = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "testpass123",
        "role": "farmer",
    }

    registration = await client.post("/api/v1/auth/register", json=user)
    assert registration.status_code == 200
    assert registration.json()["email"] == user["email"]

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": user["email"], "password": user["password"]},
    )
    assert login.status_code == 200
    assert login.json()["token_type"] == "bearer"
    assert login.json()["access_token"]
