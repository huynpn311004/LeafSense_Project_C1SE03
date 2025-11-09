from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, or_
from typing import List, Optional
from datetime import datetime
import pytz

from core.database import get_db
from core.security import get_current_user
from app.models.users import User
from app.models.post import Post, Comment
from app.models.reaction import Reaction
from app.schemas.community_schema import (
    PostCreate, PostUpdate, PostResponse, PostListResponse,
    CommentCreate, CommentUpdate, CommentResponse
)
# Import Firebase service
from app.services.firebase_service import upload_file_to_firebase

router = APIRouter(prefix="/api/community", tags=["Community"])

# ==================== POST ENDPOINTS ====================

@router.get("/posts", response_model=dict)
def get_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Lấy danh sách bài viết với phân trang và filter - Chỉ hiển thị bài viết đã được duyệt"""
    query = db.query(Post)
    
    # Chỉ hiển thị bài viết đã được admin duyệt cho người dùng thường
    if status:
        query = query.filter(Post.status == status)
    else:
        query = query.filter(Post.status == "published")  # Chỉ hiển thị bài viết đã duyệt
    
    # Filter by user_id
    if user_id:
        query = query.filter(Post.user_id == user_id)
    
    # Search in title and content
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Post.title.ilike(search_pattern),
                Post.content.ilike(search_pattern)
            )
        )
    
    # Count total
    total = query.count()
    
    # Get posts with pagination
    posts = query.order_by(desc(Post.created_at)).offset(skip).limit(limit).all()
    
    # Add comment count to each post
    posts_with_count = []
    for post in posts:
        comment_count = db.query(func.count(Comment.id)).filter(Comment.post_id == post.id).scalar()
        post_dict = PostListResponse.from_orm(post).dict()
        post_dict['comment_count'] = comment_count
        posts_with_count.append(post_dict)
    
    return {
        "posts": posts_with_count,
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": total > (skip + len(posts))
    }

@router.get("/posts/{post_id}")
def get_post(
    post_id: int, 
    db: Session = Depends(get_db)
):
    """Lấy chi tiết bài viết kèm comments"""
    
    try:
        post = db.query(Post)\
            .options(joinedload(Post.user))\
            .filter(Post.id == post_id)\
            .first()
        
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Get comments manually - sorted by newest first
        comments = db.query(Comment)\
            .options(joinedload(Comment.user))\
            .filter(Comment.post_id == post_id, Comment.parent_id == None)\
            .order_by(Comment.created_at.desc())\
            .all()
        
        # Convert to Vietnam timezone
        vietnam_tz = pytz.timezone('Asia/Ho_Chi_Minh')
        
        def format_datetime(dt):
            if dt.tzinfo is None:
                dt = pytz.UTC.localize(dt)
            return dt.astimezone(vietnam_tz).isoformat()
        
        # Build response manually
        return {
            "id": post.id,
            "title": post.title,
            "content": post.content,
            "image_url": post.image_url,
            "status": post.status,
            "user_id": post.user_id,
            "created_at": format_datetime(post.created_at),
            "updated_at": format_datetime(post.updated_at),
            "user": {
                "id": post.user.id,
                "name": post.user.name,
                "email": post.user.email,
                "avatar_url": post.user.avatar_url
            },
            "comments": [
                {
                    "id": c.id,
                    "content": c.content,
                    "user_id": c.user_id,
                    "post_id": c.post_id,
                    "parent_id": c.parent_id,
                    "created_at": format_datetime(c.created_at),
                    "updated_at": format_datetime(c.updated_at),
                    "user": {
                        "id": c.user.id,
                        "name": c.user.name,
                        "email": c.user.email,
                        "avatar_url": c.user.avatar_url
                    },
                    "replies": []
                }
                for c in comments
            ]
        }
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error loading post: {str(e)}")

@router.post("/posts", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    title: str = Form(...),
    content: str = Form(...),
    image: UploadFile = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Tạo bài viết mới (có thể kèm ảnh) - Bài viết sẽ chờ admin duyệt"""
    image_url = None
    
    # Upload image nếu có
    if image:
        try:
            # Validate image type
            if not image.content_type or not image.content_type.startswith('image/'):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File must be an image"
                )
            
            # Try upload to Firebase first
            try:
                image_url = await upload_file_to_firebase(
                    file=image,
                    folder="posts",
                    filename_prefix=f"post_{current_user.id}_"
                )
                print(f"✓ Image uploaded to Firebase: {image_url}")
            except Exception as firebase_error:
                print(f"⚠ Firebase upload failed: {firebase_error}")
                # Fallback to local storage
                import uuid
                import shutil
                from pathlib import Path
                
                # Create uploads directory
                upload_dir = Path("uploads/posts")
                upload_dir.mkdir(parents=True, exist_ok=True)
                
                # Generate unique filename
                file_extension = image.filename.split('.')[-1] if image.filename and '.' in image.filename else 'jpg'
                filename = f"post_{current_user.id}_{uuid.uuid4()}.{file_extension}"
                file_path = upload_dir / filename
                
                # Save file
                with open(file_path, "wb") as buffer:
                    await image.seek(0)  # Reset file pointer
                    shutil.copyfileobj(image.file, buffer)
                
                # Return local URL
                image_url = f"/uploads/posts/{filename}"
                print(f"✓ Image saved locally: {image_url}")
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload image: {str(e)}"
            )
    
    # Create post với status pending (chờ admin duyệt)
    new_post = Post(
        title=title,
        content=content,
        image_url=image_url,
        status="pending",  # Bài viết sẽ chờ admin duyệt
        user_id=current_user.id
    )
    
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    return new_post

@router.put("/posts/{post_id}")
async def update_post(
    post_id: int,
    title: Optional[str] = Form(None),
    content: Optional[str] = Form(None),
    status_value: Optional[str] = Form(None),
    image: UploadFile = File(None),
    remove_image: bool = Form(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cập nhật bài viết (chỉ author hoặc admin)"""
    
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check permission
    if post.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this post"
        )
    
    # Update fields
    if title:
        post.title = title
    if content:
        post.content = content
    if status_value:
        post.status = status_value
    
    # Handle image
    if remove_image:
        post.image_url = None
    elif image:
        try:
            if not image.content_type or not image.content_type.startswith('image/'):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File must be an image"
                )
            
            # Try upload to Firebase first
            try:
                image_url = await upload_file_to_firebase(
                    file=image,
                    folder="posts",
                    filename_prefix=f"post_{current_user.id}_"
                )
                print(f"✓ Image uploaded to Firebase: {image_url}")
            except Exception as firebase_error:
                print(f"⚠ Firebase upload failed: {firebase_error}")
                # Fallback to local storage
                import uuid
                import shutil
                from pathlib import Path
                
                # Create uploads directory
                upload_dir = Path("uploads/posts")
                upload_dir.mkdir(parents=True, exist_ok=True)
                
                # Generate unique filename
                file_extension = image.filename.split('.')[-1] if image.filename and '.' in image.filename else 'jpg'
                filename = f"post_{current_user.id}_{uuid.uuid4()}.{file_extension}"
                file_path = upload_dir / filename
                
                # Save file
                with open(file_path, "wb") as buffer:
                    await image.seek(0)  # Reset file pointer
                    shutil.copyfileobj(image.file, buffer)
                
                # Return local URL
                image_url = f"/uploads/posts/{filename}"
                print(f"✓ Image saved locally: {image_url}")
                
            post.image_url = image_url
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload image: {str(e)}"
            )
    
    post.updated_at = datetime.utcnow()
    db.commit()
    
    # Reload with relationships
    updated_post = db.query(Post)\
        .options(joinedload(Post.user))\
        .filter(Post.id == post_id)\
        .first()
    
    # Format datetime
    vietnam_tz = pytz.timezone('Asia/Ho_Chi_Minh')
    def format_datetime(dt):
        if dt.tzinfo is None:
            dt = pytz.UTC.localize(dt)
        return dt.astimezone(vietnam_tz).isoformat()
    
    return {
        "id": updated_post.id,
        "title": updated_post.title,
        "content": updated_post.content,
        "image_url": updated_post.image_url,
        "status": updated_post.status,
        "user_id": updated_post.user_id,
        "created_at": format_datetime(updated_post.created_at),
        "updated_at": format_datetime(updated_post.updated_at),
        "user": {
            "id": updated_post.user.id,
            "name": updated_post.user.name,
            "email": updated_post.user.email,
            "avatar_url": updated_post.user.avatar_url
        },
        "comments": []
    }

@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Xóa bài viết (chỉ author hoặc admin)"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check permission
    if post.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this post"
        )
    
    db.delete(post)
    db.commit()
    
    return None

# ==================== COMMENT ENDPOINTS ====================

@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
def get_post_comments(
    post_id: int,
    db: Session = Depends(get_db)
):
    """Lấy tất cả comments của một bài viết (bao gồm nested replies)"""
    # Check if post exists
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Get only top-level comments (parent_id is None)
    comments = db.query(Comment)\
        .options(joinedload(Comment.user))\
        .filter(
            Comment.post_id == post_id,
            Comment.parent_id == None
        ).order_by(Comment.created_at).all()
    
    # Convert to Vietnam timezone và format response
    vietnam_tz = pytz.timezone('Asia/Ho_Chi_Minh')
    
    def format_datetime(dt):
        if dt.tzinfo is None:
            dt = pytz.UTC.localize(dt)
        return dt.astimezone(vietnam_tz).isoformat()
    
    # Build response với replies = []
    result = []
    for comment in comments:
        result.append({
            "id": comment.id,
            "content": comment.content,
            "user_id": comment.user_id,
            "post_id": comment.post_id,
            "parent_id": comment.parent_id,
            "created_at": format_datetime(comment.created_at),
            "updated_at": format_datetime(comment.updated_at),
            "user": {
                "id": comment.user.id,
                "name": comment.user.name,
                "email": comment.user.email,
                "avatar_url": comment.user.avatar_url
            },
            "replies": []  # Luôn trả về empty list
        })
    
    return result

@router.post("/posts/{post_id}/comments", status_code=status.HTTP_201_CREATED)
def create_comment(
    post_id: int,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Tạo comment mới cho bài viết"""
    
    # Check if post exists
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # If parent_id is provided, check if parent comment exists
    if comment_data.parent_id:
        parent_comment = db.query(Comment).filter(
            Comment.id == comment_data.parent_id,
            Comment.post_id == post_id
        ).first()
        if not parent_comment:
            raise HTTPException(status_code=404, detail="Parent comment not found")
    
    # Create comment
    new_comment = Comment(
        content=comment_data.content,
        post_id=post_id,
        user_id=current_user.id,
        parent_id=comment_data.parent_id
    )
    
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    # Reload with user relationship
    comment_with_user = db.query(Comment)\
        .options(joinedload(Comment.user))\
        .filter(Comment.id == new_comment.id)\
        .first()
    
    # Convert to Vietnam timezone
    vietnam_tz = pytz.timezone('Asia/Ho_Chi_Minh')
    
    def format_datetime(dt):
        if dt.tzinfo is None:
            dt = pytz.UTC.localize(dt)
        return dt.astimezone(vietnam_tz).isoformat()
    
    # Return formatted response với replies = []
    return {
        "id": comment_with_user.id,
        "content": comment_with_user.content,
        "user_id": comment_with_user.user_id,
        "post_id": comment_with_user.post_id,
        "parent_id": comment_with_user.parent_id,
        "created_at": format_datetime(comment_with_user.created_at),
        "updated_at": format_datetime(comment_with_user.updated_at),
        "user": {
            "id": comment_with_user.user.id,
            "name": comment_with_user.user.name,
            "email": comment_with_user.user.email,
            "avatar_url": comment_with_user.user.avatar_url
        },
        "replies": []  # Luôn trả về empty list
    }

@router.put("/comments/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: int,
    comment_data: CommentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cập nhật comment (chỉ author hoặc admin)"""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check permission
    if comment.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this comment"
        )
    
    comment.content = comment_data.content
    comment.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(comment)
    
    return comment

@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Xóa comment (chỉ author hoặc admin)"""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check permission
    if comment.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this comment"
        )
    
    db.delete(comment)
    db.commit()
    
    return None

# ==================== USER'S POSTS ====================

@router.get("/my-posts", response_model=dict)
def get_my_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lấy tất cả bài viết của user hiện tại (bao gồm cả pending, published, rejected)"""
    query = db.query(Post).filter(Post.user_id == current_user.id)
    
    total = query.count()
    posts = query.order_by(desc(Post.created_at)).offset(skip).limit(limit).all()
    
    # Add comment count và status description
    posts_with_count = []
    for post in posts:
        comment_count = db.query(func.count(Comment.id)).filter(Comment.post_id == post.id).scalar()
        post_dict = PostListResponse.from_orm(post).dict()
        post_dict['comment_count'] = comment_count
        
        # Thêm mô tả trạng thái
        status_description = {
            "pending": "Chờ admin duyệt",
            "published": "Đã đăng",
            "rejected": "Bị từ chối",
            "draft": "Bản nháp",
            "archived": "Đã lưu trữ"
        }
        post_dict['status_description'] = status_description.get(post.status, "Không xác định")
        
        posts_with_count.append(post_dict)
    
    return {
        "posts": posts_with_count,
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": total > (skip + len(posts))
    }

# ==================== REACTION ENDPOINTS ====================

@router.post("/posts/{post_id}/reactions", status_code=status.HTTP_201_CREATED)
def toggle_reaction(
    post_id: int,
    reaction_type: str = Query(default="like"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle reaction (like/unlike) on a post"""
    
    # Check if post exists
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if user already reacted
    existing_reaction = db.query(Reaction).filter(
        Reaction.post_id == post_id,
        Reaction.user_id == current_user.id
    ).first()
    
    if existing_reaction:
        # Remove reaction (unlike)
        db.delete(existing_reaction)
        db.commit()
        return {"message": "Reaction removed", "liked": False}
    else:
        # Add reaction (like)
        new_reaction = Reaction(
            post_id=post_id,
            user_id=current_user.id,
            type=reaction_type
        )
        db.add(new_reaction)
        db.commit()
        return {"message": "Reaction added", "liked": True}

@router.get("/posts/{post_id}/reactions")
def get_post_reactions(
    post_id: int,
    db: Session = Depends(get_db)
):
    """Get reaction statistics for a post"""
    
    # Check if post exists
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Count reactions by type
    reaction_counts = db.query(
        Reaction.type,
        func.count(Reaction.id).label('count')
    ).filter(Reaction.post_id == post_id).group_by(Reaction.type).all()
    
    # Convert to dict
    reactions = {reaction.type: reaction.count for reaction in reaction_counts}
    
    # Get total count
    total_reactions = sum(reactions.values())
    
    return {
        "post_id": post_id,
        "reactions": reactions,
        "total_reactions": total_reactions
    }

@router.get("/posts/{post_id}/reactions/me")
def get_my_reaction(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if current user has reacted to this post"""
    
    reaction = db.query(Reaction).filter(
        Reaction.post_id == post_id,
        Reaction.user_id == current_user.id
    ).first()
    
    if reaction:
        return {
            "post_id": post_id,
            "user_id": current_user.id,
            "reaction_type": reaction.type,
            "liked": True
        }
    else:
        return {
            "post_id": post_id,
            "user_id": current_user.id,
            "reaction_type": None,
            "liked": False
        }

# ==================== DEBUG ENDPOINT ====================

@router.get("/debug/auth")
def debug_auth(current_user: User = Depends(get_current_user)):
    """Debug endpoint to check authentication"""
    return {
        "authenticated": True,
        "user_id": current_user.id,
        "user_name": current_user.name,
        "user_email": current_user.email,
        "user_role": current_user.role
    }

@router.get("/debug/reactions")
def debug_reactions(db: Session = Depends(get_db)):
    """Debug endpoint to check all reactions"""
    reactions = db.query(Reaction).all()
    
    result = []
    for reaction in reactions:
        result.append({
            "id": reaction.id,
            "post_id": reaction.post_id,
            "user_id": reaction.user_id,
            "type": reaction.type,
            "created_at": reaction.created_at.isoformat() if reaction.created_at else None
        })
    
    return {
        "total_reactions": len(reactions),
        "reactions": result
    }

@router.post("/debug/create-test-post")
def create_test_post(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a test post for debugging"""
    test_post = Post(
        title="Test Post for Like Feature",
        content="This is a test post to test the like functionality. You can use this post to test reactions.",
        user_id=current_user.id,
        status="published"
    )
    
    db.add(test_post)
    db.commit()
    db.refresh(test_post)
    
    return {
        "message": "Test post created successfully",
        "post_id": test_post.id,
        "post_title": test_post.title
    }
