from flask import Blueprint, jsonify

library_bp = Blueprint('library', __name__)

@library_bp.route("/books", methods=["GET"])
def get_books():

    # 👉 SQL SELECT
    return jsonify({"books": []})