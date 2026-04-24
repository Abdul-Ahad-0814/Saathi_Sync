from flask import Blueprint, request, jsonify
from utils.db import get_connection

resources_bp = Blueprint('resources', __name__)

# ─── ADD RESOURCE ───────────────────────────────────────────
@resources_bp.route('/resources', methods=['POST'])
def add_resource():
    data = request.json

    title = data.get('title')
    subject_name = data.get('subject_name')
    resource_type = data.get('type')
    uploaded_by = data.get('user_id')
    file_path = data.get('file_path')

    if not all([title, uploaded_by]):
        return jsonify({"error": "title and user_id are required"}), 400

    try:
        conn = get_connection()
        cur = conn.cursor()

        # Get subject ID if provided
        subject_id = None
        if subject_name:
            cur.execute("SELECT SubjectID FROM Subjects WHERE SubjectName = %s", (subject_name,))
            subject = cur.fetchone()
            if subject:
                subject_id = subject[0]

        cur.execute(
            "INSERT INTO Resources (Title, SubjectID, Type, UploadedBy, FilePath) VALUES (%s, %s, %s, %s, %s) RETURNING ResourceID",
            (title, subject_id, resource_type, uploaded_by, file_path)
        )
        resource_id = cur.fetchone()[0]

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Resource added successfully", "resource_id": resource_id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── GET ALL RESOURCES ──────────────────────────────────────
@resources_bp.route('/resources', methods=['GET'])
def get_resources():
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT r.ResourceID, r.Title, s.SubjectName, r.Type, u.Name as UploadedBy, r.FilePath
            FROM Resources r
            LEFT JOIN Subjects s ON r.SubjectID = s.SubjectID
            LEFT JOIN Users u ON r.UploadedBy = u.UserID
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
                "uploaded_by": row[4],
                "file_path": row[5]
            })

        return jsonify(resources), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── GET RESOURCES BY SUBJECT ───────────────────────────────
@resources_bp.route('/resources/subject/<int:subject_id>', methods=['GET'])
def get_resources_by_subject(subject_id):
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT r.ResourceID, r.Title, s.SubjectName, r.Type, u.Name as UploadedBy, r.FilePath
            FROM Resources r
            LEFT JOIN Subjects s ON r.SubjectID = s.SubjectID
            LEFT JOIN Users u ON r.UploadedBy = u.UserID
            WHERE r.SubjectID = %s
        """, (subject_id,))

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
                "uploaded_by": row[4],
                "file_path": row[5]
            })

        return jsonify(resources), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── DELETE RESOURCE ────────────────────────────────────────
@resources_bp.route('/resources/<int:resource_id>', methods=['DELETE'])
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