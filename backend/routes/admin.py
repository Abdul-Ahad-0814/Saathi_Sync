from flask import Blueprint, request, jsonify
from utils.db import get_connection

admin_bp = Blueprint('admin', __name__)

# ─── GET ALL USERS ──────────────────────────────────────────
@admin_bp.route('/admin/users', methods=['GET'])
def get_all_users():
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT UserID, Name, Email, University, Role FROM Users ORDER BY UserID ASC"
        )

        rows = cur.fetchall()
        cur.close()
        conn.close()

        users = []
        for row in rows:
            users.append({
                "user_id": row[0],
                "name": row[1],
                "email": row[2],
                "university": row[3],
                "role": row[4]
            })

        return jsonify(users), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── DELETE USER ────────────────────────────────────────────
@admin_bp.route('/admin/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("DELETE FROM Users WHERE UserID = %s", (user_id,))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "User deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── GET ALL RESOURCES ──────────────────────────────────────
@admin_bp.route('/admin/resources', methods=['GET'])
def get_all_resources():
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT r.ResourceID, r.Title, s.SubjectName, r.Type, u.Name as UploadedBy
            FROM Resources r
            LEFT JOIN Subjects s ON r.SubjectID = s.SubjectID
            LEFT JOIN Users u ON r.UploadedBy = u.UserID
            ORDER BY r.ResourceID ASC
        """)

        rows = cur.fetchall()
        cur.close()
        conn.close()

        resources = []
        for row in rows:
            resources.append({
                "resource_id": row[0],
                "title": row[1],
                "subject": row[2],
                "type": row[3],
                "uploaded_by": row[4]
            })

        return jsonify(resources), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── DELETE RESOURCE ────────────────────────────────────────
@admin_bp.route('/admin/resources/<int:resource_id>', methods=['DELETE'])
def delete_resource(resource_id):
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("DELETE FROM Resources WHERE ResourceID = %s", (resource_id,))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Resource deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── GET SYSTEM STATS ───────────────────────────────────────
@admin_bp.route('/admin/stats', methods=['GET'])
def get_stats():
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("SELECT COUNT(*) FROM Users")
        total_users = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM StudyGroups")
        total_groups = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM Resources")
        total_resources = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM StudySessions")
        total_sessions = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM Books")
        total_books = cur.fetchone()[0]

        cur.close()
        conn.close()

        return jsonify({
            "total_users": total_users,
            "total_groups": total_groups,
            "total_resources": total_resources,
            "total_sessions": total_sessions,
            "total_books": total_books
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500