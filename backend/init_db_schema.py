"""
One-time database schema initialization script.
Run this ONCE when setting up the project:
    python init_db_schema.py

After running, you can comment out ensure_schema() in app.py for faster startup.
"""

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def initialize_schema():
    """Create all missing columns - run only once"""
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()

        print("Initializing database schema...")

        # Add Visibility column to Resources if it doesn't exist
        cur.execute("""
            ALTER TABLE Resources
            ADD COLUMN IF NOT EXISTS Visibility VARCHAR(20) DEFAULT 'Private'
        """)
        print("✓ Visibility column added to Resources")

        # Add other schema updates here as needed in the future
        
        conn.commit()
        cur.close()
        conn.close()
        
        print("\n✓ Database schema initialization complete!")
        print("You can now comment out ensure_schema() in app.py for faster startup.")

    except Exception as e:
        print(f"✗ Error during schema initialization: {e}")
        if conn:
            try:
                conn.rollback()
            except:
                pass

if __name__ == "__main__":
    initialize_schema()
