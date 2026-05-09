from flask import Blueprint, request, jsonify
from utils.db import get_connection

deadlines_bp = Blueprint('deadlines', __name__)


def _normalize_status(status):
    if not status:
        return 'Pending'
    return status.strip().title()


def _normalize_priority(priority):
    if not priority:
        return 'Medium'
    return priority.strip().title()

# ─── ADD DEADLINE ───────────────────────────────────────────
@deadlines_bp.route('/deadlines', methods=['POST'])
def add_deadline():
    data = request.json

    user_id = data.get('user_id')
    title = data.get('title')
    subject_name = data.get('subject_name')
    due_date = data.get('due_date')
    priority = _normalize_priority(data.get('priority'))
    status = _normalize_status(data.get('status'))

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
            "INSERT INTO Deadlines (UserID, Title, SubjectID, DueDate, Priority, Status) VALUES (%s, %s, %s, %s, %s, %s) RETURNING DeadlineID",
            (user_id, title, subject_id, due_date, priority, status)
        )
        deadline_id = cur.fetchone()[0]

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Deadline added successfully", "deadline_id": deadline_id}), 201

    except Exception as e:
        try:
            conn.rollback()
        except:
            pass
        return jsonify({"error": str(e)}), 500


# ─── UPDATE DEADLINE ────────────────────────────────────────
@deadlines_bp.route('/deadlines/<int:deadline_id>', methods=['PUT', 'PATCH'])
def update_deadline(deadline_id):
    data = request.json or {}

    title = data.get('title')
    subject_name = data.get('subject_name')
    due_date = data.get('due_date')
    priority = data.get('priority')
    status = data.get('status')

    if not any([title, subject_name, due_date, priority, status]):
        return jsonify({"error": "At least one field must be provided to update the deadline"}), 400

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("SELECT DeadlineID FROM Deadlines WHERE DeadlineID = %s", (deadline_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Deadline not found"}), 404

        updates = []
        params = []

        if title is not None:
            updates.append("Title = %s")
            params.append(title.strip())

        if due_date is not None:
            updates.append("DueDate = %s")
            params.append(due_date)

        if priority is not None:
            updates.append("Priority = %s")
            params.append(_normalize_priority(priority))

        if status is not None:
            updates.append("Status = %s")
            params.append(_normalize_status(status))

        if subject_name is not None:
            subject_id = None
            cleaned_subject_name = subject_name.strip()
            if cleaned_subject_name:
                cur.execute("SELECT SubjectID FROM Subjects WHERE SubjectName = %s", (cleaned_subject_name,))
                subject = cur.fetchone()
                if subject:
                    subject_id = subject[0]
            updates.append("SubjectID = %s")
            params.append(subject_id)

        params.append(deadline_id)
        cur.execute(f"UPDATE Deadlines SET {', '.join(updates)} WHERE DeadlineID = %s", params)

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Deadline updated successfully"}), 200

    except Exception as e:
        try:
            conn.rollback()
        except:
            pass
        return jsonify({"error": str(e)}), 500


# ─── GET USER DEADLINES ─────────────────────────────────────
@deadlines_bp.route('/deadlines/<int:user_id>', methods=['GET'])
def get_deadlines(user_id):
    priority_filter = request.args.get('priority')
    status_filter = request.args.get('status')

    try:
        conn = get_connection()
        cur = conn.cursor()

        query = """
            SELECT d.DeadlineID, d.Title, s.SubjectName, d.DueDate, d.Priority, d.Status
            FROM Deadlines d
            LEFT JOIN Subjects s ON d.SubjectID = s.SubjectID
            WHERE d.UserID = %s
        """
        params = [user_id]

        if priority_filter and priority_filter != 'All Priorities':
            query += " AND d.Priority = %s"
            params.append(priority_filter)

        if status_filter and status_filter != 'All Statuses':
            query += " AND d.Status = %s"
            params.append(status_filter)

        query += " ORDER BY d.DueDate ASC"

        cur.execute(query, params)

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
                "priority": row[4],
                "status": row[5]
            })

        return jsonify(deadlines), 200

    except Exception as e:
        try:
            conn.rollback()
        except:
            pass
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
        try:
            conn.rollback()
        except:
            pass
        return jsonify({"error": str(e)}), 500