from flask import Blueprint, request, jsonify
from utils.db import get_connection

deadlines_bp = Blueprint('deadlines', __name__)

# ─── ADD DEADLINE ───────────────────────────────────────────
@deadlines_bp.route('/deadlines', methods=['POST'])
def add_deadline():
    data = request.json

    user_id = data.get('user_id')
    title = data.get('title')
    subject_name = data.get('subject_name')
    due_date = data.get('due_date')
    priority = data.get('priority', 'Medium')

    if not all([user_id, title, due_date]):
        return jsonify({"error": "user_id, title and due_date are required"}), 400

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
            "INSERT INTO Deadlines (UserID, Title, SubjectID, DueDate, Priority) VALUES (%s, %s, %s, %s, %s) RETURNING DeadlineID",
            (user_id, title, subject_id, due_date, priority)
        )
        deadline_id = cur.fetchone()[0]

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Deadline added successfully", "deadline_id": deadline_id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── GET USER DEADLINES ─────────────────────────────────────
@deadlines_bp.route('/deadlines/<int:user_id>', methods=['GET'])
def get_deadlines(user_id):
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT d.DeadlineID, d.Title, s.SubjectName, d.DueDate, d.Priority
            FROM Deadlines d
            LEFT JOIN Subjects s ON d.SubjectID = s.SubjectID
            WHERE d.UserID = %s
            ORDER BY d.DueDate ASC
        """, (user_id,))

        rows = cur.fetchall()
        cur.close()
        conn.close()

        deadlines = []
        for row in rows:
            deadlines.append({
                "deadline_id": row[0],
                "title": row[1],
                "subject": row[2],
                "due_date": str(row[3]),
                "priority": row[4]
            })

        return jsonify(deadlines), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── DELETE DEADLINE ────────────────────────────────────────
@deadlines_bp.route('/deadlines/<int:deadline_id>', methods=['DELETE'])
def delete_deadline(deadline_id):
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("DELETE FROM Deadlines WHERE DeadlineID = %s", (deadline_id,))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Deadline deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500