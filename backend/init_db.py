import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def init_db():
    conn = psycopg2.connect(
        # host=os.getenv("DB_HOST"),
        # port=os.getenv("DB_PORT"),
        # dbname=os.getenv("DB_NAME"),
        # user=os.getenv("DB_USER"),
        # password=os.getenv("DB_PASSWORD")
        os.getenv("DATABASE_URL")
    )
    cur = conn.cursor()

    # Create Users table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS Users (
            UserID SERIAL PRIMARY KEY,
            Name VARCHAR(100) NOT NULL,
            Email VARCHAR(100) UNIQUE NOT NULL,
            Password VARCHAR(255) NOT NULL,
            University VARCHAR(150),
            availability_date DATE,
            availability_time TIME,
            notify_deadlines BOOLEAN DEFAULT FALSE,
            notify_sessions BOOLEAN DEFAULT FALSE,
            notify_resources BOOLEAN DEFAULT FALSE,
            Role VARCHAR(10) CHECK (Role IN ('Student', 'Admin')) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Ensure schema stays compatible with existing databases
    cur.execute("ALTER TABLE Users ADD COLUMN IF NOT EXISTS availability_date DATE")
    cur.execute("ALTER TABLE Users ADD COLUMN IF NOT EXISTS availability_time TIME")
    cur.execute("ALTER TABLE Users ADD COLUMN IF NOT EXISTS notify_deadlines BOOLEAN DEFAULT FALSE")
    cur.execute("ALTER TABLE Users ADD COLUMN IF NOT EXISTS notify_sessions BOOLEAN DEFAULT FALSE")
    cur.execute("ALTER TABLE Users ADD COLUMN IF NOT EXISTS notify_resources BOOLEAN DEFAULT FALSE")

    # Add other tables as needed
    # For now, just Users

    conn.commit()
    cur.close()
    conn.close()
    print("Database initialized.")

if __name__ == "__main__":
    init_db()