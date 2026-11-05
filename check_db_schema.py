import sys
sys.path.append("D:/study/MASAI/project/taskflow/backend")

from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users';"))
    cols = [r[0] for r in res]
    print("public.users columns:", cols)
    
    # Ensure phone, bio, avatar_url are in public.users
    to_add = []
    if "phone" not in cols:
        to_add.append("ADD COLUMN IF NOT EXISTS phone VARCHAR(50)")
    if "bio" not in cols:
        to_add.append("ADD COLUMN IF NOT EXISTS bio TEXT")
    if "avatar_url" not in cols:
        to_add.append("ADD COLUMN IF NOT EXISTS avatar_url TEXT")
    
    if to_add:
        conn.execute(text(f"ALTER TABLE public.users {', '.join(to_add)};"))
        conn.commit()
        print("Added to public.users:", to_add)
    else:
        print("All columns present in public.users.")
