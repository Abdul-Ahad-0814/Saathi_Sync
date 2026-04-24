from flask import Blueprint, request, jsonify
from utils.db import get_connection

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.json

    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    university = data.get('university')
    role = data.get('role', 'Student')

    if not all([name, email, password]):
        return jsonify({"error": "Name, email and password are required"}), 400

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("SELECT UserID FROM Users WHERE Email = %s", (email,))
        if cur.fetchone():
            return jsonify({"error": "Email already registered"}), 409

        cur.execute(
            "INSERT INTO Users (Name, Email, Password, University, Role) VALUES (%s, %s, %s, %s, %s) RETURNING UserID",
            (name, email, password, university, role)
        )
        user_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "User created successfully", "user_id": user_id, "name": name}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json

    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return jsonify({"error": "Email and password are required"}), 400

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT UserID, Name, Role FROM Users WHERE Email = %s AND Password = %s",
            (email, password)
        )
        user = cur.fetchone()
        cur.close()
        conn.close()

        if user:
            return jsonify({
                "message": "Login successful",
                "user_id": user[0],
                "name": user[1],
                "role": user[2]
            }), 200
        else:
            return jsonify({"error": "Invalid email or password"}), 401

    except Exception as e:
        return jsonify({"error": str(e)}), 500