from pydantic import BaseModel, EmailStr
import uuid

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role_name: str

    class Config:
        from_attributes = True