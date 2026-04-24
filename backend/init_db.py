import sqlite3

def init_db():
    conn = sqlite3.connect('saathisync.db')
    cur = conn.cursor()

    # Create Users table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS Users (
            UserID INTEGER PRIMARY KEY AUTOINCREMENT,
            Name TEXT NOT NULL,
            Email TEXT UNIQUE NOT NULL,
            Password TEXT NOT NULL,
            University TEXT,
            Role TEXT DEFAULT 'Student'
        )
    ''')

    # Add other tables as needed
    # For now, just Users

    conn.commit()
    cur.close()
    conn.close()
    print("Database initialized.")

if __name__ == "__main__":
    init_db()