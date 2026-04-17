from flask import Blueprint, request, jsonify

bookmarks_bp = Blueprint('bookmarks', __name__)

@bookmarks_bp.route("/bookmark", methods=["POST"])
def bookmark():

    # 👉 SQL INSERT
    return jsonify({"message": "Saved"})

@bookmarks_bp.route("/bookmarks", methods=["GET"])
def get_bookmarks():

    # 👉 SQL SELECT
    return jsonify({"bookmarks": []})