from flask import Blueprint, request, jsonify

sessions_bp = Blueprint('sessions', __name__)

@sessions_bp.route("/add-session", methods=["POST"])
def add_session():

    # 👉 SQL INSERT
    return jsonify({"message": "Session added"})

@sessions_bp.route("/sessions", methods=["GET"])
def get_sessions():

    # 👉 SQL SELECT
    return jsonify({"sessions": []})