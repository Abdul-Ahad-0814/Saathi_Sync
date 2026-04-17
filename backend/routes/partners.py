from flask import Blueprint, request, jsonify

partners_bp = Blueprint('partners', __name__)

@partners_bp.route("/find-partner", methods=["POST"])
def find_partner():
    data = request.json

    # 👉 SQL HERE
    return jsonify({"partners": []})