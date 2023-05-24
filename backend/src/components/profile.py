from flask import Blueprint, request, jsonify
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from flask_jwt_extended.exceptions import JWTExtendedException

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/', methods=['GET'])
@jwt_required()
def profile():
    current_user = get_jwt_identity()
    if not current_user:
        raise JWTExtendedException(description='Invalid token', status_code=401)
    return jsonify(logged_in_as=current_user), 200