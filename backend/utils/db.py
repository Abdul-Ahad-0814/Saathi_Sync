# import psycopg2
# import os
# from dotenv import load_dotenv

# load_dotenv()

# # def get_connection():
# #     conn = psycopg2.connect(
# #         # host=os.getenv("DB_HOST"),
# #         # port=os.getenv("DB_PORT"),
# #         # dbname=os.getenv("DB_NAME"),
# #         # user=os.getenv("DB_USER"),
# #         # password=os.getenv("DB_PASSWORD")
# #         os.getenv("DATABASE_URL")
# #     )
# #     return conn

# from psycopg2 import pool

# db_pool = pool.SimpleConnectionPool(
#     1, 10,
#     os.getenv("DATABASE_URL")
# )

# def get_connection():
#     return db_pool.getconn()


# def ensure_schema():
#     conn = get_connection()
#     cur = conn.cursor()

#     cur.execute("""
#         ALTER TABLE Users
#         ADD COLUMN IF NOT EXISTS notify_deadlines BOOLEAN DEFAULT TRUE,
#         ADD COLUMN IF NOT EXISTS notify_sessions BOOLEAN DEFAULT TRUE,
#         ADD COLUMN IF NOT EXISTS notify_resources BOOLEAN DEFAULT FALSE
#     """)

#     cur.execute("""
#         CREATE TABLE IF NOT EXISTS StudyPartners (
#             UserID INT NOT NULL REFERENCES Users(UserID) ON DELETE CASCADE,
#             PartnerID INT NOT NULL REFERENCES Users(UserID) ON DELETE CASCADE,
#             ConnectedOn DATE DEFAULT CURRENT_DATE,
#             PRIMARY KEY (UserID, PartnerID),
#             CHECK (UserID != PartnerID)
#         )
#     """)

#     # Add timestamp columns if not exist
#     tables = ['Users', 'StudyGroups', 'Deadlines', 'Resources', 'Bookmarks', 'Books', 'StudySessions']
#     for table in tables:
#         cur.execute(f"""
#             ALTER TABLE {table}
#             ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
#             ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
#         """)

#     cur.execute("""
#         ALTER TABLE Deadlines
#         ADD COLUMN IF NOT EXISTS Status VARCHAR(20) DEFAULT 'Pending'
#     """)

#     # Create AuditLog table
#     cur.execute("""
#         CREATE TABLE IF NOT EXISTS AuditLog (
#             AuditID SERIAL PRIMARY KEY,
#             TableName VARCHAR(50) NOT NULL,
#             Operation VARCHAR(10) NOT NULL,
#             OldData JSONB,
#             NewData JSONB,
#             ChangedBy INT REFERENCES Users(UserID),
#             ChangedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
#         )
#     """)

#     # Create functions and triggers
#     cur.execute("""
#         CREATE OR REPLACE FUNCTION update_updated_at()
#         RETURNS TRIGGER AS $$
#         BEGIN
#             NEW.updated_at = CURRENT_TIMESTAMP;
#             RETURN NEW;
#         END;
#         $$ LANGUAGE plpgsql;
#     """)

#     cur.execute("""
#         CREATE OR REPLACE FUNCTION audit_trigger_function()
#         RETURNS TRIGGER AS $$
#         DECLARE
#             old_row JSONB;
#             new_row JSONB;
#             user_id INT;
#         BEGIN
#             user_id := NULL;
#             IF TG_OP = 'DELETE' THEN
#                 old_row := row_to_json(OLD)::JSONB;
#                 INSERT INTO AuditLog (TableName, Operation, OldData, ChangedBy)
#                 VALUES (TG_TABLE_NAME, TG_OP, old_row, user_id);
#                 RETURN OLD;
#             ELSIF TG_OP = 'UPDATE' THEN
#                 old_row := row_to_json(OLD)::JSONB;
#                 new_row := row_to_json(NEW)::JSONB;
#                 INSERT INTO AuditLog (TableName, Operation, OldData, NewData, ChangedBy)
#                 VALUES (TG_TABLE_NAME, TG_OP, old_row, new_row, user_id);
#                 RETURN NEW;
#             ELSIF TG_OP = 'INSERT' THEN
#                 new_row := row_to_json(NEW)::JSONB;
#                 INSERT INTO AuditLog (TableName, Operation, NewData, ChangedBy)
#                 VALUES (TG_TABLE_NAME, TG_OP, new_row, user_id);
#                 RETURN NEW;
#             END IF;
#             RETURN NULL;
#         END;
#         $$ LANGUAGE plpgsql;
#     """)

#     # Create triggers for updated_at
#     for table in tables:
#         cur.execute(f"""
#             DROP TRIGGER IF EXISTS update_{table.lower()}_updated_at ON {table};
#             CREATE TRIGGER update_{table.lower()}_updated_at
#                 BEFORE UPDATE ON {table}
#                 FOR EACH ROW
#                 EXECUTE FUNCTION update_updated_at();
#         """)

#     # Create audit triggers for main tables
#     audit_tables = ['Users', 'StudyGroups', 'Deadlines', 'Resources']
#     for table in audit_tables:
#         cur.execute(f"""
#             DROP TRIGGER IF EXISTS audit_{table.lower()} ON {table};
#             CREATE TRIGGER audit_{table.lower()}
#                 AFTER INSERT OR UPDATE OR DELETE ON {table}
#                 FOR EACH ROW
#                 EXECUTE FUNCTION audit_trigger_function();
#         """)

#     conn.commit()
#     cur.close()
#     conn.close()

import psycopg2
import os

# Load .env locally only (ignored on Render)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass
# -----------------------------
# DATABASE CONNECTION (FAST + SAFE)
# -----------------------------

_conn = None

def get_connection():
    """
    Reuse a single connection instead of creating a new one every time.
    This removes 1–4 sec delays caused by repeated handshakes.
    """
    global _conn

    if _conn is None or _conn.closed:
        _conn = psycopg2.connect(os.getenv("DATABASE_URL"))

    return _conn


# -----------------------------
# CURSOR HELPER
# -----------------------------

def get_cursor():
    conn = get_connection()
    return conn.cursor()


# -----------------------------
# IMPORTANT NOTE:
# SCHEMA SETUP MOVED OUTSIDE FLASK
# -----------------------------
def ensure_schema():
    """
    Check if Visibility column exists, only add if missing.
    This runs only once - subsequent checks are extremely fast.
    """
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        # FAST CHECK: Query information schema instead of altering
        # This is instant and doesn't lock the table
        cur.execute("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.COLUMNS 
                WHERE TABLE_NAME = 'Resources' AND COLUMN_NAME = 'Visibility'
            )
        """)
        
        column_exists = cur.fetchone()[0]
        
        if not column_exists:
            print("✓ Adding Visibility column to Resources table...")
            cur.execute("""
                ALTER TABLE Resources
                ADD COLUMN Visibility VARCHAR(20) DEFAULT 'Private'
            """)
            conn.commit()
            print("✓ Visibility column added successfully")
        else:
            print("✓ Database schema is up to date")

        cur.close()

    except Exception as e:
        print(f"✗ Warning: Could not check schema: {e}")
        if conn:
            try:
                conn.rollback()
            except:
                pass