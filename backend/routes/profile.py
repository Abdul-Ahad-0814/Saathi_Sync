from flask import Blueprint, request, jsonify

profile_bp = Blueprint('profile', __name__)

@profile_bp.route("/profile", methods=["PUT"])
def update_profile():

    # 👉 SQL UPDATE
    return jsonify({"message": "Profile updated"})