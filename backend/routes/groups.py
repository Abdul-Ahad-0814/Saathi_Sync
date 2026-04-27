from flask import Blueprint, request, jsonify
from utils.db import get_connection

groups_bp = Blueprint('groups', __name__)

# ─── CREATE GROUP ───────────────────────────────────────────
@groups_bp.route('/groups', methods=['POST'])
def create_group():
    data = request.json

    group_name = data.get('group_name')
    subject_name = data.get('subject_name')
    created_by = data.get('user_id')

    if not all([group_name, created_by]):
        return jsonify({"error": "Group name and user_id are required"}), 400

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

        # Create the group
        cur.execute(
            "INSERT INTO StudyGroups (GroupName, SubjectID, CreatedBy) VALUES (%s, %s, %s) RETURNING GroupID",
            (group_name, subject_id, created_by)
        )
        group_id = cur.fetchone()[0]

        # Auto add creator as member
        cur.execute(
            "INSERT INTO GroupMembers (GroupID, UserID) VALUES (%s, %s)",
            (group_id, created_by)
        )

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Group created successfully", "group_id": group_id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── GET ALL GROUPS ─────────────────────────────────────────
@groups_bp.route('/groups', methods=['GET'])
def get_groups():
    query = request.args.get('q', '').strip()

    try:
        conn = get_connection()
        cur = conn.cursor()

        params = []
        where_clause = ""
        if query:
            where_clause = "WHERE g.GroupName ILIKE %s OR s.SubjectName ILIKE %s OR u.Name ILIKE %s"
            params = [f'%{query}%', f'%{query}%', f'%{query}%']

        cur.execute(f"""
            SELECT g.GroupID, g.GroupName, s.SubjectName, u.Name as CreatedBy,
                   COUNT(gm.UserID) as MemberCount
            FROM StudyGroups g
            LEFT JOIN Subjects s ON g.SubjectID = s.SubjectID
            LEFT JOIN Users u ON g.CreatedBy = u.UserID
            LEFT JOIN GroupMembers gm ON g.GroupID = gm.GroupID
            {where_clause}
            GROUP BY g.GroupID, g.GroupName, s.SubjectName, u.Name
            ORDER BY g.GroupName ASC
        """, params)

        rows = cur.fetchall()
        cur.close()
        conn.close()

        groups = []
        for row in rows:
            groups.append({
                "group_id": row[0],
                "group_name": row[1],
                "subject": row[2],
                "created_by": row[3],
                "member_count": row[4]
            })

        return jsonify(groups), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@groups_bp.route('/groups/joined/<int:user_id>', methods=['GET'])
def get_joined_groups(user_id):
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT g.GroupID, g.GroupName, s.SubjectName, u.Name as CreatedBy,
                   COUNT(gm_all.UserID) as MemberCount
            FROM GroupMembers gm
            JOIN StudyGroups g ON gm.GroupID = g.GroupID
            LEFT JOIN Subjects s ON g.SubjectID = s.SubjectID
            LEFT JOIN Users u ON g.CreatedBy = u.UserID
            LEFT JOIN GroupMembers gm_all ON g.GroupID = gm_all.GroupID
            WHERE gm.UserID = %s
            GROUP BY g.GroupID, g.GroupName, s.SubjectName, u.Name
            ORDER BY g.GroupName ASC
        """, (user_id,))

        rows = cur.fetchall()
        cur.close()
        conn.close()

        groups = []
        for row in rows:
            groups.append({
                "group_id": row[0],
                "group_name": row[1],
                "subject": row[2],
                "created_by": row[3],
                "member_count": row[4]
            })

        return jsonify(groups), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── JOIN GROUP ─────────────────────────────────────────────
@groups_bp.route('/groups/<int:group_id>/join', methods=['POST'])
def join_group(group_id):
    data = request.json
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    try:
        conn = get_connection()
        cur = conn.cursor()

        # Check if already a member
        cur.execute(
            "SELECT * FROM GroupMembers WHERE GroupID = %s AND UserID = %s",
            (group_id, user_id)
        )
        if cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Already a member of this group"}), 409

        cur.execute(
            "INSERT INTO GroupMembers (GroupID, UserID) VALUES (%s, %s)",
            (group_id, user_id)
        )

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Joined group successfully"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── LEAVE GROUP ────────────────────────────────────────────
@groups_bp.route('/groups/<int:group_id>/leave', methods=['DELETE'])
def leave_group(group_id):
    data = request.json
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "DELETE FROM GroupMembers WHERE GroupID = %s AND UserID = %s",
            (group_id, user_id)
        )

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Left group successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── GET GROUP MEMBERS ──────────────────────────────────────
@groups_bp.route('/groups/<int:group_id>/members', methods=['GET'])
def get_members(group_id):
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT u.UserID, u.Name, u.University, gm.JoinDate
            FROM Users u
            JOIN GroupMembers gm ON u.UserID = gm.UserID
            WHERE gm.GroupID = %s
        """, (group_id,))

        rows = cur.fetchall()
        cur.close()
        conn.close()

        members = []
        for row in rows:
            members.append({
                "user_id": row[0],
                "name": row[1],
                "university": row[2],
                "join_date": str(row[3])
            })

        return jsonify(members), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500