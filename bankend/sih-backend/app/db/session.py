"""
Database session management and connection setup.
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings

# MongoDB client and database
client: AsyncIOMotorClient = None
db: AsyncIOMotorDatabase = None


async def get_db() -> AsyncIOMotorDatabase:
    """Get MongoDB database connection."""
    return db


async def init_db():
    """Initialize database connection."""
    global client, db
    client = AsyncIOMotorClient(settings.DATABASE_URL)
    db = client.get_database()
    # Verify connection
    await db.command("ping")
    print("[OK] Connected to MongoDB")


async def close_db():
    """Close database connection."""
    global client
    if client:
        client.close()
        print("[OK] Closed MongoDB connection")
