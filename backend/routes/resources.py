from flask import Blueprint, request, jsonify

resources_bp = Blueprint('resources', __name__)

@resources_bp.route("/upload-resource", methods=["POST"])
def upload_resource():
    data = request.json
    title = data.get('title')
    description = data.get('description')
    file_path = data.get('file_path', '')
    uploaded_by = data.get('uploaded_by')

    # TODO: Implement upload resource
    # 1. Validate input (title, uploaded_by required)
    # 2. Handle file upload or URL storage
    # 3. Insert resource into database
    # 4. Return resource_id and success message
    
    return jsonify({"message": "Resource uploaded successfully", "resource_id": 1})

@resources_bp.route("/resources", methods=["GET"])
def get_resources():
    
    # TODO: Implement fetch all resources
    # 1. Query all resources from database
    # 2. Return list of resources with id, title, description, file_path, uploaded_by, created_at
    
    return jsonify({"resources": []})