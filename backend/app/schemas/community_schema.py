from pydantic import BaseModel, Field, field_serializer
from typing import Optional, List
from datetime import datetime
import pytz

# ==================== POST SCHEMAS ====================

class PostBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    image_url: Optional[str] = None
    status: Optional[str] = "published"

class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1)
    image_url: Optional[str] = None
    status: Optional[str] = None

class PostAuthor(BaseModel):
    id: int
    name: str
    email: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

class CommentResponse(BaseModel):
    id: int
    content: str
    user_id: int
    post_id: int
    parent_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    user: PostAuthor
    replies: List['CommentResponse'] = []

    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, dt: datetime, _info):
        """Convert to Vietnam timezone (GMT+7)"""
        if dt.tzinfo is None:
            dt = pytz.UTC.localize(dt)
        vietnam_tz = pytz.timezone('Asia/Ho_Chi_Minh')
        return dt.astimezone(vietnam_tz).isoformat()

    class Config:
        from_attributes = True

class PostResponse(BaseModel):
    id: int
    title: str
    content: str
    image_url: Optional[str] = None
    status: str
    user_id: int
    created_at: datetime
    updated_at: datetime
    user: PostAuthor
    comments: List[CommentResponse] = []

    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, dt: datetime, _info):
        """Convert to Vietnam timezone (GMT+7)"""
        if dt.tzinfo is None:
            dt = pytz.UTC.localize(dt)
        vietnam_tz = pytz.timezone('Asia/Ho_Chi_Minh')
        return dt.astimezone(vietnam_tz).isoformat()

    class Config:
        from_attributes = True

class PostListResponse(BaseModel):
    id: int
    title: str
    content: str
    image_url: Optional[str] = None
    status: str
    user_id: int
    created_at: datetime
    updated_at: datetime
    user: PostAuthor
    comment_count: int = 0

    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, dt: datetime, _info):
        """Convert to Vietnam timezone (GMT+7)"""
        if dt.tzinfo is None:
            dt = pytz.UTC.localize(dt)
        vietnam_tz = pytz.timezone('Asia/Ho_Chi_Minh')
        return dt.astimezone(vietnam_tz).isoformat()

    class Config:
        from_attributes = True

# ==================== COMMENT SCHEMAS ====================

class CommentBase(BaseModel):
    content: str = Field(..., min_length=1)
    parent_id: Optional[int] = None

class CommentCreate(CommentBase):
    pass

class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1)

# Update forward references
CommentResponse.model_rebuild()
