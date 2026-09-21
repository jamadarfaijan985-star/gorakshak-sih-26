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
    """Initialize database connection with fallback for cloud deployment."""
    global client, db
    try:
        client = AsyncIOMotorClient(settings.DATABASE_URL, serverSelectionTimeoutMS=5000)
        db = client.get_database()
        # Verify connection
        await db.command("ping")
        print("[OK] Connected to MongoDB")
    except Exception as e:
        print(f"[WARNING] MongoDB connection to '{settings.DATABASE_URL}' failed: {e}")
        print("[FALLBACK] Initializing in-memory database using mongomock_motor...")
        try:
            from mongomock_motor import AsyncMongoMockClient
            client = AsyncMongoMockClient()
            db = client["bovine_mastitis"]
            print("[OK] In-memory mock MongoDB initialized successfully")
        except Exception as mock_err:
            print(f"[ERROR] Mock DB initialization failed: {mock_err}")


async def close_db():
    """Close database connection."""
    global client
    if client:
        client.close()
        print("[OK] Closed MongoDB connection")
