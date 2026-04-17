from flask import Blueprint, request, jsonify

auth_bp = Blueprint('auth', __name__)

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    # TODO: Implement user signup
    # 1. Validate email (check if user already exists)
    # 2. Hash the password using werkzeug.security.generate_password_hash
    # 3. Insert user into database
    # 4. Return user_id and success message
    # 5. Handle errors and return appropriate status codes
    
    return jsonify({"message": "User created successfully", "user_id": 1, "name": name})

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    # TODO: Implement user login
    # 1. Fetch user from database by email
    # 2. Verify password using werkzeug.security.check_password_hash
    # 3. Return user_id, name and success message on valid credentials
    # 4. Return error on invalid credentials (401 Unauthorized)
    # BONUS: Implement JWT token generation for better security
    
    return jsonify({"message": "Login successful", "user_id": 1, "name": email.split("@")[0]})