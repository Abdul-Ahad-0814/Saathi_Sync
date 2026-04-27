from flask import Blueprint, request, jsonify
from utils.db import get_connection

partners_bp = Blueprint('partners', __name__)

# ─── FIND STUDY PARTNERS BY SUBJECT ────────────────────────
@partners_bp.route('/partners/<int:user_id>', methods=['GET'])
def find_partners(user_id):
    query = request.args.get('q', '').strip()
    subject = request.args.get('subject', '').strip()
    university = request.args.get('university', '').strip()
    availability_date = request.args.get('availability_date', '').strip()
    availability_time = request.args.get('availability_time', '').strip()

    try:
        conn = get_connection()
        cur = conn.cursor()

        having_clauses = []
        params = [user_id]

        if query:
            having_clauses.append("(u.Name ILIKE %s OR COALESCE(u.University, '') ILIKE %s OR COALESCE(string_agg(DISTINCT s.SubjectName, ', ' ORDER BY s.SubjectName), '') ILIKE %s)")
            params.extend([f'%{query}%', f'%{query}%', f'%{query}%'])

        if subject:
            having_clauses.append("COALESCE(string_agg(DISTINCT s.SubjectName, ', ' ORDER BY s.SubjectName), '') ILIKE %s")
            params.append(f'%{subject}%')

        if university:
            having_clauses.append("COALESCE(u.University, '') ILIKE %s")
            params.append(f'%{university}%')

        having_sql = f"HAVING {' AND '.join(having_clauses)}" if having_clauses else ""

        cur.execute(f"""
            SELECT u.UserID, u.Name, u.University,
                   COALESCE(string_agg(DISTINCT s.SubjectName, ', ' ORDER BY s.SubjectName), '') AS Subjects
            FROM Users u
            LEFT JOIN UserSubjects us ON u.UserID = us.UserID
            LEFT JOIN Subjects s ON us.SubjectID = s.SubjectID
            WHERE u.UserID != %s
            GROUP BY u.UserID, u.Name, u.University
            {having_sql}
            ORDER BY u.Name ASC
        """, params)

        rows = cur.fetchall()
        cur.close()
        conn.close()

        partners = []
        for row in rows:
            partners.append({
                "user_id": row[0],
                "name": row[1],
                "university": row[2],
                "subject": row[3],
                "availability_date": availability_date,
                "availability_time": availability_time
            })

        return jsonify(partners), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@partners_bp.route('/partners/connect', methods=['POST'])
def connect_partner():
    data = request.json
    user_id = data.get('user_id')
    partner_id = data.get('partner_id')

    if not all([user_id, partner_id]):
        return jsonify({"error": "user_id and partner_id are required"}), 400

    if int(user_id) == int(partner_id):
        return jsonify({"error": "Cannot connect with yourself"}), 400

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "INSERT INTO StudyPartners (UserID, PartnerID) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            (user_id, partner_id)
        )
        cur.execute(
            "INSERT INTO StudyPartners (UserID, PartnerID) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            (partner_id, user_id)
        )

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Partner connected successfully"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@partners_bp.route('/partners/<int:user_id>/current', methods=['GET'])
def get_current_partners(user_id):
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT u.UserID, u.Name, u.University,
                   COALESCE(string_agg(DISTINCT s.SubjectName, ', ' ORDER BY s.SubjectName), '') AS Subjects,
                   sp.ConnectedOn
            FROM StudyPartners sp
            JOIN Users u ON sp.PartnerID = u.UserID
            LEFT JOIN UserSubjects us ON u.UserID = us.UserID
            LEFT JOIN Subjects s ON us.SubjectID = s.SubjectID
            WHERE sp.UserID = %s
            GROUP BY u.UserID, u.Name, u.University, sp.ConnectedOn
            ORDER BY u.Name ASC
        """, (user_id,))

        rows = cur.fetchall()
        cur.close()
        conn.close()

        partners = []
        for row in rows:
            partners.append({
                "user_id": row[0],
                "name": row[1],
                "university": row[2],
                "subject": row[3],
                "connected_on": str(row[4]) if row[4] else None
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