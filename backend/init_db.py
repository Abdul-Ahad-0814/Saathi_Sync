# TODO: Database Initialization Script
# This script should set up your database schema on first run
#
# Steps to implement:
# 1. Create database (if not exists)
# 2. Create tables with proper schema:
#    - users table (id, name, email, password_hash, created_at)
#    - groups table (id, name, description, created_by, created_at)
#    - deadlines table (id, title, date, user_id, created_at)
#    - resources table (id, title, description, file_path, uploaded_by, created_at)
#    - Add other tables as needed (bookmarks, sessions, etc.)
# 3. Add foreign key relationships
# 4. Create indexes for frequently queried columns
# 5. Add seed data (optional)
#
# Run this script once before starting the app:
# python init_db.py