from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import asyncpg
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

app = FastAPI(title="Groups Microservice", description="Управление музыкальными группами")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database pool
db_pool = None

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

@app.on_event("startup")
async def startup():
    await init_db_pool()

@app.on_event("shutdown")
async def shutdown():
    if db_pool:
        await db_pool.close()

# Models for Groups
class GroupBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    formation_year: int = Field(..., ge=1900, le=datetime.now().year)
    country: str = Field(..., min_length=1, max_length=100)
    rating: int = Field(0, ge=0, le=100)
    description: Optional[str] = Field(None, max_length=1000)

class GroupCreate(GroupBase):
    pass

class GroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    formation_year: Optional[int] = Field(None, ge=1900, le=datetime.now().year)
    country: Optional[str] = Field(None, min_length=1, max_length=100)
    rating: Optional[int] = Field(None, ge=0, le=100)
    description: Optional[str] = Field(None, max_length=1000)

# Models for Members
class MemberBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(..., min_length=1, max_length=50)
    birth_year: Optional[int] = Field(None, ge=1900, le=datetime.now().year)
    country: Optional[str] = Field(None, max_length=100)
    joined_year: Optional[int] = Field(None, ge=1900, le=datetime.now().year)

class MemberCreate(MemberBase):
    group_id: int

class MemberUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    role: Optional[str] = Field(None, min_length=1, max_length=50)
    birth_year: Optional[int] = Field(None, ge=1900, le=datetime.now().year)
    country: Optional[str] = Field(None, max_length=100)
    joined_year: Optional[int] = Field(None, ge=1900, le=datetime.now().year)

# ============ GROUPS ENDPOINTS ============

@app.get("/groups")
async def get_all_groups():
    async with db_pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM groups ORDER BY rating DESC")
        return [dict(row) for row in rows]

@app.get("/groups/{group_id}")
async def get_group(group_id: int):
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM groups WHERE id = $1", group_id)
        if not row:
            raise HTTPException(status_code=404, detail="Group not found")
        return dict(row)

@app.post("/groups", status_code=status.HTTP_201_CREATED)
async def create_group(group: GroupCreate):
    async with db_pool.acquire() as conn:
        try:
            row = await conn.fetchrow(
                """INSERT INTO groups (name, formation_year, country, rating, description) 
                   VALUES ($1, $2, $3, $4, $5) RETURNING *""",
                group.name, group.formation_year, group.country, group.rating, group.description
            )
            return dict(row)
        except asyncpg.UniqueViolationError:
            raise HTTPException(status_code=400, detail="Group with this name already exists")

@app.put("/groups/{group_id}")
async def update_group(group_id: int, group: GroupUpdate):
    async with db_pool.acquire() as conn:
        updates = []
        values = []
        idx = 1
        
        if group.name is not None:
            updates.append(f"name = ${idx}")
            values.append(group.name)
            idx += 1
        if group.formation_year is not None:
            updates.append(f"formation_year = ${idx}")
            values.append(group.formation_year)
            idx += 1
        if group.country is not None:
            updates.append(f"country = ${idx}")
            values.append(group.country)
            idx += 1
        if group.rating is not None:
            updates.append(f"rating = ${idx}")
            values.append(group.rating)
            idx += 1
        if group.description is not None:
            updates.append(f"description = ${idx}")
            values.append(group.description)
            idx += 1
        
        if updates:
            updates.append(f"updated_at = CURRENT_TIMESTAMP")
            query = f"UPDATE groups SET {', '.join(updates)} WHERE id = ${idx} RETURNING *"
            values.append(group_id)
            
            row = await conn.fetchrow(query, *values)
            if not row:
                raise HTTPException(status_code=404, detail="Group not found")
            return dict(row)
        else:
            row = await conn.fetchrow("SELECT * FROM groups WHERE id = $1", group_id)
            if not row:
                raise HTTPException(status_code=404, detail="Group not found")
            return dict(row)

@app.delete("/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(group_id: int):
    async with db_pool.acquire() as conn:
        result = await conn.execute("DELETE FROM groups WHERE id = $1", group_id)
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Group not found")

@app.get("/groups/{group_id}/songs")
async def get_group_songs(group_id: int):
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT s.* FROM songs s 
               WHERE s.group_id = $1 
               ORDER BY s.creation_year DESC""",
            group_id
        )
        return [dict(row) for row in rows]

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
async def add_member(member: MemberCreate):
    async with db_pool.acquire() as conn:
        try:
            row = await conn.fetchrow(
                """INSERT INTO members (group_id, name, role, birth_year, country, joined_year) 
                   VALUES ($1, $2, $3, $4, $5, $6) RETURNING *""",
                member.group_id, member.name, member.role, 
                member.birth_year, member.country, member.joined_year
            )
            return dict(row)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error adding member: {str(e)}")

@app.put("/groups/members/{member_id}")
async def update_member(member_id: int, member: MemberUpdate):
    async with db_pool.acquire() as conn:
        updates = []
        values = []
        idx = 1
        
        if member.name is not None:
            updates.append(f"name = ${idx}")
            values.append(member.name)
            idx += 1
        if member.role is not None:
            updates.append(f"role = ${idx}")
            values.append(member.role)
            idx += 1
        if member.birth_year is not None:
            updates.append(f"birth_year = ${idx}")
            values.append(member.birth_year)
            idx += 1
        if member.country is not None:
            updates.append(f"country = ${idx}")
            values.append(member.country)
            idx += 1
        if member.joined_year is not None:
            updates.append(f"joined_year = ${idx}")
            values.append(member.joined_year)
            idx += 1
        
        if updates:
            query = f"UPDATE members SET {', '.join(updates)} WHERE id = ${idx} RETURNING *"
            values.append(member_id)
            row = await conn.fetchrow(query, *values)
            if not row:
                raise HTTPException(status_code=404, detail="Member not found")
            return dict(row)
        else:
            row = await conn.fetchrow("SELECT * FROM members WHERE id = $1", member_id)
            if not row:
                raise HTTPException(status_code=404, detail="Member not found")
            return dict(row)

@app.delete("/groups/members/{member_id}", status_code=status.HTTP_200_OK)
async def delete_member(member_id: int):
    async with db_pool.acquire() as conn:
        result = await conn.execute("DELETE FROM members WHERE id = $1", member_id)
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Member not found")
        return {"message": "Member deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)