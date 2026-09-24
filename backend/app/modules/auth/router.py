from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.modules.auth.models import User
from app.modules.auth.schemas import LoginRequest, Token, UserResponse
from pwdlib import PasswordHash
from datetime import datetime, timedelta
from jose import jwt

router = APIRouter(prefix="/auth", tags=["Authentication"])
password_hash = PasswordHash.recommended()

# Secret keys for the token (Keep these secret in production!)
SECRET_KEY = "mediflow_secret_key_123"
ALGORITHM = "HS256"

@router.post("/login", response_model=Token)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    # 1. Find user by email
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    
    # 2. Check if user exists and password is correct
    if not user or not password_hash.verify(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # 3. Create JWT Token
    access_token_expires = timedelta(minutes=60)
    to_encode = {"sub": user.email, "exp": datetime.utcnow() + access_token_expires}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return {"access_token": encoded_jwt, "token_type": "bearer"}