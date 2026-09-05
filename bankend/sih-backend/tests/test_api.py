"""
Sample pytest tests for API endpoints.

To run:
    pytest tests/ -v
    pytest tests/ --cov=app
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.base import Base
from app.db.session import get_session
from app.models.models import Farm, User, Animal
from app.core.security import get_password_hash
import uuid


# Test database setup
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
async def test_db_session():
    """Create a test database session."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async_session_local = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session_local() as session:
        yield session
    
    await engine.dispose()


@pytest.fixture
async def client(test_db_session):
    """Create a test client."""
    async def override_get_session():
        yield test_db_session
    
    app.dependency_overrides[get_session] = override_get_session
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_health_check(client):
    """Test health check endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_create_farm(client, test_db_session):
    """Test farm creation."""
    response = await client.post(
        "/api/v1/farms",
        json={
            "name": "Test Farm",
            "code": "TEST001",
            "location_text": "Test Location",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Farm"
    assert data["code"] == "TEST001"


@pytest.mark.asyncio
async def test_list_farms(client, test_db_session):
    """Test listing farms."""
    # Create a farm first
    farm = Farm(
        id=uuid.uuid4(),
        name="Test Farm",
        code="TEST001",
    )
    test_db_session.add(farm)
    await test_db_session.commit()
    
    response = await client.get("/api/v1/farms")
    assert response.status_code == 200
    data = response.json()
    assert data["meta"]["total"] >= 1


@pytest.mark.asyncio
async def test_create_animal(client, test_db_session):
    """Test animal creation."""
    # Create farm first
    farm = Farm(
        id=uuid.uuid4(),
        name="Test Farm",
        code="TEST001",
    )
    test_db_session.add(farm)
    await test_db_session.commit()
    
    # Create animal
    response = await client.post(
        "/api/v1/animals",
        json={
            "farm_id": str(farm.id),
            "tag_id": "TEST_COW_001",
            "species": "cow",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["tag_id"] == "TEST_COW_001"
    assert data["species"] == "cow"


@pytest.mark.asyncio
async def test_user_registration(client):
    """Test user registration."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "testpass123",
            "role": "farmer",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["role"] == "farmer"


@pytest.mark.asyncio
async def test_user_login(client, test_db_session):
    """Test user login."""
    # Create user
    user = User(
        id=uuid.uuid4(),
        name="Test User",
        email="test@example.com",
        password_hash=get_password_hash("testpass123"),
        role="farmer",
    )
    test_db_session.add(user)
    await test_db_session.commit()
    
    # Login
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "testpass123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


# Add more tests as needed
