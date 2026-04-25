from flask import Blueprint, request, jsonify
from utils.db import get_connection

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/profile/<int:user_id>', methods=['GET'])
def get_profile(user_id):
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT UserID, Name, Email, University, Role FROM Users WHERE UserID = %s",
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
                "role": user[4]
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

    if not any([name, university, email]):
        return jsonify({"error": "Provide at least one field to update"}), 400

    try:
        conn = get_connection()
        cur = conn.cursor()

        fields = []
        values = []

        if name:
            fields.append("Name = %s")
            values.append(name)
        if university:
            fields.append("University = %s")
            values.append(university)
        if email:
            fields.append("Email = %s")
            values.append(email)

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