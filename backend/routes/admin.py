from flask import Blueprint, jsonify

admin_bp = Blueprint('admin', __name__)

@admin_bp.route("/admin/users", methods=["GET"])
def get_users():

    # 👉 SQL SELECT
    return jsonify({"users": []})

@admin_bp.route("/admin/resources", methods=["GET"])
def get_resources():

    # 👉 SQL SELECT
    return jsonify({"resources": []})