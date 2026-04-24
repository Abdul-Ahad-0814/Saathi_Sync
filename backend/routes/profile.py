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

    if not any([name, university]):
        return jsonify({"error": "Provide at least name or university to update"}), 400

    try:
        conn = get_connection()
        cur = conn.cursor()

        if name and university:
            cur.execute(
                "UPDATE Users SET Name = %s, University = %s WHERE UserID = %s",
                (name, university, user_id)
            )
        elif name:
            cur.execute(
                "UPDATE Users SET Name = %s WHERE UserID = %s",
                (name, user_id)
            )
        elif university:
            cur.execute(
                "UPDATE Users SET University = %s WHERE UserID = %s",
                (university, user_id)
            )

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Profile updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500