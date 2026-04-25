from flask import Blueprint, request, jsonify
from utils.db import get_connection

bookmarks_bp = Blueprint('bookmarks', __name__)

# ─── ADD BOOKMARK ───────────────────────────────────────────
@bookmarks_bp.route('/bookmarks', methods=['POST'])
def add_bookmark():
    data = request.json

    user_id = data.get('user_id')
    resource_id = data.get('resource_id')
    saved_topic = data.get('saved_topic')

    if not all([user_id, resource_id]):
        return jsonify({"error": "user_id and resource_id are required"}), 400

    try:
        conn = get_connection()
        cur = conn.cursor()

        # Check if already bookmarked
        cur.execute(
            "SELECT BookmarkID FROM Bookmarks WHERE UserID = %s AND ResourceID = %s",
            (user_id, resource_id)
        )
        if cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Resource already bookmarked"}), 409

        cur.execute(
            "INSERT INTO Bookmarks (UserID, ResourceID, SavedTopic) VALUES (%s, %s, %s) RETURNING BookmarkID",
            (user_id, resource_id, saved_topic)
        )
        bookmark_id = cur.fetchone()[0]

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Bookmark added successfully", "bookmark_id": bookmark_id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── GET USER BOOKMARKS ─────────────────────────────────────
@bookmarks_bp.route('/bookmarks/<int:user_id>', methods=['GET'])
def get_bookmarks(user_id):
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT bm.BookmarkID, r.Title, s.SubjectName, r.Type, r.FilePath, bm.SavedTopic
            FROM Bookmarks bm
            JOIN Resources r ON bm.ResourceID = r.ResourceID
            LEFT JOIN Subjects s ON r.SubjectID = s.SubjectID
            WHERE bm.UserID = %s
        """, (user_id,))

        rows = cur.fetchall()
        cur.close()
        conn.close()

        bookmarks = []
        for row in rows:
            bookmarks.append({
                "bookmark_id": row[0],
                "resource_title": row[1],
                "subject": row[2],
                "type": row[3],
                "file_path": row[4],
                "saved_topic": row[5]
            })

        return jsonify(bookmarks), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── DELETE BOOKMARK ────────────────────────────────────────
@bookmarks_bp.route('/bookmarks/<int:bookmark_id>', methods=['DELETE'])
def delete_bookmark(bookmark_id):
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("DELETE FROM Bookmarks WHERE BookmarkID = %s", (bookmark_id,))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Bookmark deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500