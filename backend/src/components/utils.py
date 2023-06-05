from flask import Blueprint, request, jsonify
from flask_jwt_extended.exceptions import JWTExtendedException
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2

utils_bp = Blueprint('utils', __name__)

@utils_bp.route('/get_username')
@jwt_required()
def get_username():
    current_user = get_jwt_identity()
    if not current_user:
        raise JWTExtendedException(description='Invalid token', status_code=401)
    return jsonify(current_user), 200

@utils_bp.route('/get_user_ids', methods=['GET'])
@jwt_required()
def get_user_ids():
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="mydatabase",
            user="postgres",
            password="admin",
            port="5432"
        )

        cursor = conn.cursor()
        cursor.execute("SELECT id, username FROM users")
        rows = cursor.fetchall()
        users = [{'id': row[0], 'username': row[1]} for row in rows]

        cursor.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get user ids"}), 500

    return jsonify(users)

def establish_connection():
    conn = psycopg2.connect(
                host="localhost",
                database="mydatabase",
                user="postgres",
                password="admin",
                port="5432"
            )
    
    return conn