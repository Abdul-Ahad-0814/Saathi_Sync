from flask import Blueprint, request, jsonify
from utils.db import get_connection

partners_bp = Blueprint('partners', __name__)

# ─── FIND STUDY PARTNERS BY SUBJECT ────────────────────────
@partners_bp.route('/partners/<int:user_id>', methods=['GET'])
def find_partners(user_id):
    try:
        conn = get_connection()
        cur = conn.cursor()

        # Find users who share the same subjects as this user
        cur.execute("""
            SELECT DISTINCT u.UserID, u.Name, u.University, s.SubjectName
            FROM Users u
            JOIN UserSubjects us ON u.UserID = us.UserID
            JOIN Subjects s ON us.SubjectID = s.SubjectID
            WHERE us.SubjectID IN (
                SELECT SubjectID FROM UserSubjects WHERE UserID = %s
            )
            AND u.UserID != %s
        """, (user_id, user_id))

        rows = cur.fetchall()
        cur.close()
        conn.close()

        partners = []
        for row in rows:
            partners.append({
                "user_id": row[0],
                "name": row[1],
                "university": row[2],
                "subject": row[3]
            })

        return jsonify(partners), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── ADD SUBJECT TO USER ────────────────────────────────────
@partners_bp.route('/subjects/<int:user_id>', methods=['POST'])
def add_subject(user_id):
    data = request.json
    subject_name = data.get('subject_name')

    if not subject_name:
        return jsonify({"error": "Subject name is required"}), 400

    try:
        conn = get_connection()
        cur = conn.cursor()

        # Check if subject exists, if not create it
        cur.execute("SELECT SubjectID FROM Subjects WHERE SubjectName = %s", (subject_name,))
        subject = cur.fetchone()

        if not subject:
            cur.execute(
                "INSERT INTO Subjects (SubjectName) VALUES (%s) RETURNING SubjectID",
                (subject_name,)
            )
            subject_id = cur.fetchone()[0]
        else:
            subject_id = subject[0]

        # Link subject to user
        cur.execute("""
            INSERT INTO UserSubjects (UserID, SubjectID)
            VALUES (%s, %s)
            ON CONFLICT DO NOTHING
        """, (user_id, subject_id))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Subject added successfully", "subject_id": subject_id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── GET USER'S SUBJECTS ────────────────────────────────────
@partners_bp.route('/subjects/<int:user_id>', methods=['GET'])
def get_subjects(user_id):
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT s.SubjectID, s.SubjectName
            FROM Subjects s
            JOIN UserSubjects us ON s.SubjectID = us.SubjectID
            WHERE us.UserID = %s
        """, (user_id,))

        rows = cur.fetchall()
        cur.close()
        conn.close()

        subjects = [{"subject_id": row[0], "subject_name": row[1]} for row in rows]
        return jsonify(subjects), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500