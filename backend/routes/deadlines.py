from flask import Blueprint, request, jsonify

deadlines_bp = Blueprint('deadlines', __name__)

@deadlines_bp.route("/add-deadline", methods=["POST"])
def add_deadline():
    data = request.json
    title = data.get('title')
    date = data.get('date')
    user_id = data.get('user_id')

    # TODO: Implement add deadline
    # 1. Validate input (title, date, user_id required)
    # 2. Insert deadline into database
    # 3. Return deadline_id and success message
    
    return jsonify({"message": "Deadline added successfully", "deadline_id": 1})

@deadlines_bp.route("/get-deadlines", methods=["GET"])
def get_deadlines():
    user_id = request.args.get('user_id')

    # TODO: Implement fetch deadlines for user
    # 1. Validate user_id parameter
    # 2. Query deadlines from database for this user (ordered by date)
    # 3. Return list of deadlines
    
    return jsonify({"deadlines": []})

@deadlines_bp.route("/delete-deadline/<int:id>", methods=["DELETE"])
def delete_deadline(id):
    user_id = request.args.get('user_id')

    # TODO: Implement delete deadline
    # 1. Validate user_id and deadline id
    # 2. Delete deadline from database (only if owned by user)
    # 3. Return success message
    
    return jsonify({"message": "Deadline deleted"})