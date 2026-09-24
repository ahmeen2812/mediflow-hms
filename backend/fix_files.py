import os

# 1. Correct content for pyproject.toml
toml_content = """[project]
name = "mediflow-backend"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi",
    "uvicorn[standard]",
    "sqlalchemy[asyncio]",
    "asyncpg",
    "pydantic-settings",
    "pydantic[email]",
    "alembic",
    "pwdlib[argon2]",
    "python-jose[cryptography]",
    "python-multipart",
]
"""

# 2. Write the file in clean UTF-8 (No BOM)
with open("pyproject.toml", "wb") as f:
    f.write(toml_content.encode("utf-8"))

print("✅ pyproject.toml has been fixed with correct encoding.")