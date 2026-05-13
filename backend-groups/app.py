from fastapi import FastAPI, HTTPException, status, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import asyncpg
import os
import jwt
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

app = FastAPI(title="Groups Microservice")

# Настройка CORS - РАСШИРЕННАЯ
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5175", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

db_pool = None
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-2025-music-manager")

async def init_db_pool():
    global db_pool
    db_pool = await asyncpg.create_pool(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
        database=os.getenv("DB_NAME", "music_manager"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres"),
        min_size=1,
        max_size=10
    )
    return db_pool

def decode_token(authorization: str):
    if not authorization:
        return None
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except Exception as e:
        print(f"Token decode error: {e}")
        return None

async def get_current_user(authorization: str = Header(None)):
    user = decode_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user

@app.on_event("startup")
async def startup():
    await init_db_pool()

@app.on_event("shutdown")
async def shutdown():
    if db_pool:
        await db_pool.close()

class GroupBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    formation_year: int = Field(..., ge=1900, le=datetime.now().year)
    country: str = Field(..., min_length=1, max_length=100)
    rating: int = Field(0, ge=0, le=100)
    description: Optional[str] = Field(None, max_length=1000)

class GroupCreate(GroupBase):
    pass

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    formation_year: Optional[int] = None
    country: Optional[str] = None
    rating: Optional[int] = None
    description: Optional[str] = None

class MemberCreate(BaseModel):
    group_id: int
    name: str
    role: str
    birth_year: Optional[int] = None
    country: Optional[str] = None
    joined_year: Optional[int] = None

class MemberUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    birth_year: Optional[int] = None
    country: Optional[str] = None
    joined_year: Optional[int] = None

# ============ GROUPS ENDPOINTS ============

@app.get("/groups")
async def get_all_groups(current_user: dict = Depends(get_current_user)):
    async with db_pool.acquire() as conn:
        if current_user.get("role") == "admin":
            rows = await conn.fetch("SELECT *, created_by FROM groups ORDER BY rating DESC")
        else:
            rows = await conn.fetch(
                "SELECT *, created_by FROM groups WHERE created_by = $1 ORDER BY rating DESC",
                current_user.get("id")
            )
        return [dict(row) for row in rows]

@app.get("/groups/{group_id}")
async def get_group(group_id: int, current_user: dict = Depends(get_current_user)):
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow("SELECT *, created_by FROM groups WHERE id = $1", group_id)
        if not row:
            raise HTTPException(status_code=404, detail="Group not found")
        
        group = dict(row)
        if current_user.get("role") != "admin" and group.get("created_by") != current_user.get("id"):
            raise HTTPException(status_code=403, detail="Access denied")
        return group

@app.post("/groups", status_code=status.HTTP_201_CREATED)
async def create_group(group: GroupCreate, current_user: dict = Depends(get_current_user)):
    async with db_pool.acquire() as conn:
        try:
            row = await conn.fetchrow(
                """INSERT INTO groups (name, formation_year, country, rating, description, created_by) 
                   VALUES ($1, $2, $3, $4, $5, $6) RETURNING *, created_by""",
                group.name, group.formation_year, group.country, group.rating, group.description, current_user.get("id")
            )
            return dict(row)
        except asyncpg.UniqueViolationError:
            raise HTTPException(status_code=400, detail="Group with this name already exists")

@app.put("/groups/{group_id}")
async def update_group(group_id: int, group: GroupUpdate, current_user: dict = Depends(get_current_user)):
    async with db_pool.acquire() as conn:
        existing = await conn.fetchrow("SELECT *, created_by FROM groups WHERE id = $1", group_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Group not found")
        
        if current_user.get("role") != "admin" and existing["created_by"] != current_user.get("id"):
            raise HTTPException(status_code=403, detail="Access denied")
        
        updates = []
        values = []
        idx = 1
        
        if group.name is not None:
            updates.append(f"name = ${idx}"); values.append(group.name); idx += 1
        if group.formation_year is not None:
            updates.append(f"formation_year = ${idx}"); values.append(group.formation_year); idx += 1
        if group.country is not None:
            updates.append(f"country = ${idx}"); values.append(group.country); idx += 1
        if group.rating is not None:
            updates.append(f"rating = ${idx}"); values.append(group.rating); idx += 1
        if group.description is not None:
            updates.append(f"description = ${idx}"); values.append(group.description); idx += 1
        
        if updates:
            updates.append(f"updated_at = CURRENT_TIMESTAMP")
            query = f"UPDATE groups SET {', '.join(updates)} WHERE id = ${idx} RETURNING *, created_by"
            values.append(group_id)
            row = await conn.fetchrow(query, *values)
            return dict(row)
        
        return dict(existing)

@app.delete("/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(group_id: int, current_user: dict = Depends(get_current_user)):
    async with db_pool.acquire() as conn:
        existing = await conn.fetchrow("SELECT *, created_by FROM groups WHERE id = $1", group_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Group not found")
        
        if current_user.get("role") != "admin" and existing["created_by"] != current_user.get("id"):
            raise HTTPException(status_code=403, detail="Access denied")
        
        await conn.execute("DELETE FROM groups WHERE id = $1", group_id)

@app.get("/groups/popular/top")
async def get_most_popular_group():
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT g.*, COUNT(s.id) as song_count, 
               COALESCE(ARRAY_AGG(s.title) FILTER (WHERE s.id IS NOT NULL), ARRAY[]::TEXT[]) as repertoire
               FROM groups g 
               LEFT JOIN songs s ON g.id = s.group_id 
               GROUP BY g.id 
               ORDER BY g.rating DESC, song_count DESC 
               LIMIT 1"""
        )
        if not row:
            raise HTTPException(status_code=404, detail="No groups found")
        result = dict(row)
        result['song_count'] = int(result.get('song_count', 0))
        return result

# ============ MEMBERS ENDPOINTS ============

@app.get("/groups/{group_id}/members")
async def get_group_members(group_id: int):
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM members WHERE group_id = $1 ORDER BY id",
            group_id
        )
        return [dict(row) for row in rows]

@app.post("/groups/members", status_code=status.HTTP_201_CREATED)
async def add_member(member: MemberCreate, current_user: dict = Depends(get_current_user)):
    async with db_pool.acquire() as conn:
        # Проверяем, имеет ли пользователь доступ к группе
        group = await conn.fetchrow("SELECT *, created_by FROM groups WHERE id = $1", member.group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        
        if current_user.get("role") != "admin" and group["created_by"] != current_user.get("id"):
            raise HTTPException(status_code=403, detail="Access denied")
        
        try:
            row = await conn.fetchrow(
                """INSERT INTO members (group_id, name, role, birth_year, country, joined_year) 
                   VALUES ($1, $2, $3, $4, $5, $6) RETURNING *""",
                member.group_id, member.name, member.role,
                member.birth_year, member.country, member.joined_year
            )
            return dict(row)
        except Exception as e:
            print(f"Error adding member: {e}")
            raise HTTPException(status_code=400, detail=f"Error adding member: {str(e)}")

@app.put("/groups/members/{member_id}")
async def update_member(member_id: int, member: MemberUpdate, current_user: dict = Depends(get_current_user)):
    async with db_pool.acquire() as conn:
        existing = await conn.fetchrow("SELECT * FROM members WHERE id = $1", member_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Member not found")
        
        group = await conn.fetchrow("SELECT *, created_by FROM groups WHERE id = $1", existing["group_id"])
        if current_user.get("role") != "admin" and group["created_by"] != current_user.get("id"):
            raise HTTPException(status_code=403, detail="Access denied")
        
        updates = []
        values = []
        idx = 1
        
        if member.name is not None:
            updates.append(f"name = ${idx}"); values.append(member.name); idx += 1
        if member.role is not None:
            updates.append(f"role = ${idx}"); values.append(member.role); idx += 1
        if member.birth_year is not None:
            updates.append(f"birth_year = ${idx}"); values.append(member.birth_year); idx += 1
        if member.country is not None:
            updates.append(f"country = ${idx}"); values.append(member.country); idx += 1
        if member.joined_year is not None:
            updates.append(f"joined_year = ${idx}"); values.append(member.joined_year); idx += 1
        
        if updates:
            query = f"UPDATE members SET {', '.join(updates)} WHERE id = ${idx} RETURNING *"
            values.append(member_id)
            row = await conn.fetchrow(query, *values)
            return dict(row)
        
        return dict(existing)

@app.delete("/groups/members/{member_id}", status_code=status.HTTP_200_OK)
async def delete_member(member_id: int, current_user: dict = Depends(get_current_user)):
    async with db_pool.acquire() as conn:
        member = await conn.fetchrow("SELECT * FROM members WHERE id = $1", member_id)
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
        
        group = await conn.fetchrow("SELECT *, created_by FROM groups WHERE id = $1", member["group_id"])
        if current_user.get("role") != "admin" and group["created_by"] != current_user.get("id"):
            raise HTTPException(status_code=403, detail="Access denied")
        
        await conn.execute("DELETE FROM members WHERE id = $1", member_id)
        return {"message": "Member deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)