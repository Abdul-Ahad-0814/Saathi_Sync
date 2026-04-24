from flask import Blueprint, request, jsonify
from utils.db import get_connection

library_bp = Blueprint('library', __name__)

# ─── ADD BOOK ───────────────────────────────────────────────
@library_bp.route('/library', methods=['POST'])
def add_book():
    data = request.json

    title = data.get('title')
    author = data.get('author')
    subject_name = data.get('subject_name')
    is_available = data.get('is_available', True)

    if not title:
        return jsonify({"error": "title is required"}), 400

    try:
        conn = get_connection()
        cur = conn.cursor()

        subject_id = None
        if subject_name:
            cur.execute("SELECT SubjectID FROM Subjects WHERE SubjectName = %s", (subject_name,))
            subject = cur.fetchone()
            if subject:
                subject_id = subject[0]

        cur.execute(
            "INSERT INTO Books (Title, Author, SubjectID, IsAvailable) VALUES (%s, %s, %s, %s) RETURNING BookID",
            (title, author, subject_id, is_available)
        )
        book_id = cur.fetchone()[0]

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Book added successfully", "book_id": book_id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── GET ALL BOOKS ──────────────────────────────────────────
@library_bp.route('/library', methods=['GET'])
def get_books():
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT b.BookID, b.Title, b.Author, s.SubjectName, b.IsAvailable
            FROM Books b
            LEFT JOIN Subjects s ON b.SubjectID = s.SubjectID
            ORDER BY b.Title ASC
        """)

        rows = cur.fetchall()
        cur.close()
        conn.close()

        books = []
        for row in rows:
            books.append({
                "book_id": row[0],
                "title": row[1],
                "author": row[2],
                "subject": row[3],
                "is_available": row[4]
            })

        return jsonify(books), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── SEARCH BOOKS ───────────────────────────────────────────
@library_bp.route('/library/search', methods=['GET'])
def search_books():
    query = request.args.get('q', '')

    if not query:
        return jsonify({"error": "Search query is required"}), 400

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT b.BookID, b.Title, b.Author, s.SubjectName, b.IsAvailable
            FROM Books b
            LEFT JOIN Subjects s ON b.SubjectID = s.SubjectID
            WHERE b.Title ILIKE %s OR b.Author ILIKE %s OR s.SubjectName ILIKE %s
            ORDER BY b.Title ASC
        """, (f'%{query}%', f'%{query}%', f'%{query}%'))

        rows = cur.fetchall()
        cur.close()
        conn.close()

        books = []
        for row in rows:
            books.append({
                "book_id": row[0],
                "title": row[1],
                "author": row[2],
                "subject": row[3],
                "is_available": row[4]
            })

        return jsonify(books), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500