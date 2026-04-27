import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )
    return conn


def ensure_schema():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        ALTER TABLE Resources
        ADD COLUMN IF NOT EXISTS Visibility VARCHAR(10) DEFAULT 'Private'
    """)
    cur.execute("""
        UPDATE Resources
        SET Visibility = 'Private'
        WHERE Visibility IS NULL
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS StudyPartners (
            UserID INT NOT NULL REFERENCES Users(UserID) ON DELETE CASCADE,
            PartnerID INT NOT NULL REFERENCES Users(UserID) ON DELETE CASCADE,
            ConnectedOn DATE DEFAULT CURRENT_DATE,
            PRIMARY KEY (UserID, PartnerID),
            CHECK (UserID != PartnerID)
        )
    """)

    conn.commit()
    cur.close()
    conn.close()