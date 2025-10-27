#!/usr/bin/env python3
"""
Script to create reactions table and test reaction functionality
"""

from sqlalchemy import create_engine, text
from core.database import get_db, Base, engine
from app.models.reaction import Reaction
from app.models.post import Post
from app.models.users import User

def create_reactions_table():
    """Create reactions table if it doesn't exist"""
    print("Creating reactions table...")
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created successfully!")
        
        # Check if reactions table exists
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='reactions';
            """))
            
            if result.fetchone():
                print("✅ Reactions table exists!")
                
                # Check table structure
                result = conn.execute(text("PRAGMA table_info(reactions);"))
                columns = result.fetchall()
                
                print("📋 Reactions table structure:")
                for col in columns:
                    print(f"  - {col[1]} ({col[2]})")
                    
            else:
                print("❌ Reactions table does not exist!")
                
    except Exception as e:
        print(f"❌ Error: {e}")

def test_reaction_operations():
    """Test basic reaction operations"""
    print("\n🧪 Testing reaction operations...")
    
    try:
        db = next(get_db())
        
        # Check if we have any posts
        posts_count = db.query(Post).count()
        users_count = db.query(User).count()
        reactions_count = db.query(Reaction).count()
        
        print(f"📊 Database stats:")
        print(f"  - Posts: {posts_count}")
        print(f"  - Users: {users_count}")
        print(f"  - Reactions: {reactions_count}")
        
        if posts_count == 0:
            print("⚠️  No posts found. Need to create a post first to test reactions.")
            return
            
        if users_count == 0:
            print("⚠️  No users found. Need to create a user first to test reactions.")
            return
            
        # Get first post and user
        first_post = db.query(Post).first()
        first_user = db.query(User).first()
        
        print(f"🎯 Testing with Post ID: {first_post.id}, User ID: {first_user.id}")
        
        # Check if reaction already exists
        existing_reaction = db.query(Reaction).filter(
            Reaction.post_id == first_post.id,
            Reaction.user_id == first_user.id
        ).first()
        
        if existing_reaction:
            print(f"✅ Found existing reaction: {existing_reaction.type}")
        else:
            print("➕ Creating test reaction...")
            new_reaction = Reaction(
                post_id=first_post.id,
                user_id=first_user.id,
                type="like"
            )
            db.add(new_reaction)
            db.commit()
            print("✅ Test reaction created!")
            
        # Count reactions for the post
        post_reactions = db.query(Reaction).filter(Reaction.post_id == first_post.id).all()
        print(f"📈 Post {first_post.id} has {len(post_reactions)} reactions")
        
        db.close()
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🚀 Setting up reactions functionality...")
    
    create_reactions_table()
    test_reaction_operations()
    
    print("\n✅ Setup complete!")