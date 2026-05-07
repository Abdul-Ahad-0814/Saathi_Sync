from flask import Blueprint, request, jsonify
from utils.db import get_connection

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/profile/<int:user_id>', methods=['GET'])
def get_profile(user_id):
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT UserID, Name, Email, University, Role, notify_deadlines, notify_sessions, notify_resources FROM Users WHERE UserID = %s",
            (user_id,)
        )
        user = cur.fetchone()
        cur.close()
        conn.close()

        if user:
            return jsonify({
                "user_id": user[0],
                "name": user[1],
                "email": user[2],
                "university": user[3],
                "role": user[4],
                "notify_deadlines": user[5],
                "notify_sessions": user[6],
                "notify_resources": user[7]
            }), 200
        else:
            return jsonify({"error": "User not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_bp.route('/profile/<int:user_id>', methods=['PUT'])
def update_profile(user_id):
    data = request.json

    name = data.get('name')
    university = data.get('university')
    email = data.get('email')
    notify_deadlines = data.get('notify_deadlines')
    notify_sessions = data.get('notify_sessions')
    notify_resources = data.get('notify_resources')

    if not any([name, university, email, notify_deadlines is not None, notify_sessions is not None, notify_resources is not None]):
        return jsonify({"error": "Provide at least one field to update"}), 400

    try:
        conn = get_connection()
        cur = conn.cursor()

        fields = []
        values = []

        if name is not None:
            fields.append("Name = %s")
            values.append(name)
        if university is not None:
            fields.append("University = %s")
            values.append(university)
        if email is not None:
            fields.append("Email = %s")
            values.append(email)
        if notify_deadlines is not None:
            fields.append("notify_deadlines = %s")
            values.append(notify_deadlines)
        if notify_sessions is not None:
            fields.append("notify_sessions = %s")
            values.append(notify_sessions)
        if notify_resources is not None:
            fields.append("notify_resources = %s")
            values.append(notify_resources)

        values.append(user_id)

        cur.execute(
            f"UPDATE Users SET {', '.join(fields)} WHERE UserID = %s",
            tuple(values)
        )

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Profile updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@profile_bp.route('/profile/<int:user_id>/password', methods=['PUT'])
def update_password(user_id):
    data = request.json

    new_password = data.get('new_password')

    if not new_password:
        return jsonify({"error": "new_password is required"}), 400

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "UPDATE Users SET Password = %s WHERE UserID = %s",
            (new_password, user_id)
        )

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Password updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500