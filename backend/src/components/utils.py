from flask import Blueprint, request, jsonify
from flask_jwt_extended.exceptions import JWTExtendedException
from flask_jwt_extended import jwt_required, get_jwt_identity

utils_bp = Blueprint('utils', __name__)

@utils_bp.route('/get_username')
@jwt_required()
def get_username():
    current_user = get_jwt_identity()
    if not current_user:
        raise JWTExtendedException(description='Invalid token', status_code=401)
    return jsonify(current_user), 200