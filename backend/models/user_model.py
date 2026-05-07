# User Model Implementation
# This model should handle user data and operations
# Required methods:
# - create_user(db, name, email, password) - Create a new user
# - get_user_by_email(db, email) - Fetch user by email
# - get_user_by_id(db, user_id) - Fetch user by id
# - update_user() - Update user information
#
# Don't forget to:
# 1. Use proper password hashing
# 2. Add validation for email format
# 3. Handle database errors gracefully

import bcrypt
import re

def is_valid_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_user(db, name, email, password, university=None, role='Student'):
    if not is_valid_email(email):
        raise ValueError("Invalid email format")
    hashed = hash_password(password)
    query = """
        INSERT INTO Users (Name, Email, Password, University, Role)
        VALUES (%s, %s, %s, %s, %s) RETURNING UserID
    """
    db.execute(query, (name, email, hashed, university, role))
    return db.fetchone()[0]

def get_user_by_email(db, email):
    query = "SELECT UserID, Name, Email, Password, University, Role, created_at, updated_at FROM Users WHERE Email = %s"
    db.execute(query, (email,))
    return db.fetchone()

def get_user_by_id(db, user_id):
    query = "SELECT UserID, Name, Email, Password, University, Role, created_at, updated_at FROM Users WHERE UserID = %s"
    db.execute(query, (user_id,))
    return db.fetchone()

def update_user(db, user_id, **args):
    if not args:
        return  # Nothing to update
    fields = []
    values = []
    for key, value in args.items():
        if key == 'password':
            value = hash_password(value)
        fields.append(f"{key} = %s")
        values.append(value)
    values.append(user_id)
    query = f"UPDATE Users SET {', '.join(fields)} WHERE UserID = %s"
    db.execute(query, values)