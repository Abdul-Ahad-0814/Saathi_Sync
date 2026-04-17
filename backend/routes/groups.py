from flask import Blueprint, request, jsonify

groups_bp = Blueprint('groups', __name__)

@groups_bp.route("/create-group", methods=["POST"])
def create_group():
    data = request.json
    name = data.get('name')
    description = data.get('description')
    created_by = data.get('created_by')

    # TODO: Implement group creation
    # 1. Validate input (name and created_by required)
    # 2. Insert group into database
    # 3. Return group_id and success message
    
    return jsonify({"message": "Group created successfully", "group_id": 1})

@groups_bp.route("/groups", methods=["GET"])
def get_groups():
    
    # TODO: Implement fetch all groups
    # 1. Query all groups from database
    # 2. Return list of groups with id, name, description, created_by, created_at
    
    return jsonify([])