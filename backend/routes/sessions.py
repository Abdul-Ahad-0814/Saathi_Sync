from flask import Blueprint, request, jsonify
from utils.db import get_connection

sessions_bp = Blueprint('sessions', __name__)

# ─── ADD STUDY SESSION ──────────────────────────────────────
@sessions_bp.route('/sessions', methods=['POST'])
def add_session():
    data = request.json

    user_id = data.get('user_id')
    subject_name = data.get('subject_name')
    duration = data.get('duration')
    topic_covered = data.get('topic_covered')
    date = data.get('date')

    if not all([user_id, duration]):
        return jsonify({"error": "user_id and duration are required"}), 400

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
            """INSERT INTO StudySessions (UserID, SubjectID, DurationMinutes, TopicCovered, SessionDate)
            VALUES (%s, %s, %s, %s, %s) RETURNING SessionID""",
            (user_id, subject_id, duration, topic_covered, date)
        )
        session_id = cur.fetchone()[0]

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Study session added successfully", "session_id": session_id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── GET USER SESSIONS ──────────────────────────────────────
@sessions_bp.route('/sessions/<int:user_id>', methods=['GET'])
def get_sessions(user_id):
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT ss.SessionID, s.SubjectName, ss.DurationMinutes, ss.TopicCovered, ss.SessionDate
            FROM StudySessions ss
            LEFT JOIN Subjects s ON ss.SubjectID = s.SubjectID
            WHERE ss.UserID = %s
            ORDER BY ss.SessionDate DESC
        """, (user_id,))

        rows = cur.fetchall()
        cur.close()
        conn.close()

        sessions = []
        for row in rows:
            sessions.append({
                "session_id": row[0],
                "subject": row[1],
                "duration_minutes": row[2],
                "topic_covered": row[3],
                "date": str(row[4])
            })

        return jsonify(sessions), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── GET USER STUDY STATS ───────────────────────────────────
@sessions_bp.route('/sessions/<int:user_id>/stats', methods=['GET'])
def get_stats(user_id):
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT s.SubjectName, COUNT(ss.SessionID) as TotalSessions,
            SUM(ss.DurationMinutes) as TotalMinutes
            FROM StudySessions ss
            LEFT JOIN Subjects s ON ss.SubjectID = s.SubjectID
            WHERE ss.UserID = %s
            GROUP BY s.SubjectName
        """, (user_id,))

        rows = cur.fetchall()
        cur.close()
        conn.close()

        stats = []
        for row in rows:
            stats.append({
                "subject": row[0],
                "total_sessions": row[1],
                "total_minutes": row[2]
            })

        return jsonify(stats), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── DELETE SESSION ─────────────────────────────────────────
@sessions_bp.route('/sessions/<int:session_id>', methods=['DELETE'])
def delete_session(session_id):
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("DELETE FROM StudySessions WHERE SessionID = %s", (session_id,))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Session deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500