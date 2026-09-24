import asyncio
from app.core.database import engine, Base
from app.modules.auth.models import User, Role

async def init_models():
    async with engine.begin() as conn:
        # This will create all tables (User, Role, etc.) in your PostgreSQL
        print("Creating tables in PostgreSQL...")
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tables created successfully!")

if __name__ == "__main__":
    asyncio.run(init_models())cls