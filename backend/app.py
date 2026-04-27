from flask import Flask
from flask_cors import CORS

from routes.auth import auth_bp
from routes.partners import partners_bp
from routes.groups import groups_bp
from routes.deadlines import deadlines_bp
from routes.resources import resources_bp
from routes.library import library_bp
from routes.bookmarks import bookmarks_bp
from routes.sessions import sessions_bp
from routes.profile import profile_bp
from routes.admin import admin_bp
from utils.db import ensure_schema

app = Flask(__name__)
CORS(app)

# Register Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(partners_bp)
app.register_blueprint(groups_bp)
app.register_blueprint(deadlines_bp)
app.register_blueprint(resources_bp)
app.register_blueprint(library_bp)
app.register_blueprint(bookmarks_bp)
app.register_blueprint(sessions_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(admin_bp)

ensure_schema()

if __name__ == "__main__":
    app.run(debug=True, port=5001)