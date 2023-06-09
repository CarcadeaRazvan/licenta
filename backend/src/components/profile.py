from flask import Blueprint, request, jsonify, request, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_jwt_extended.exceptions import JWTExtendedException
# from app import app
from werkzeug.utils import secure_filename
import psycopg2
import os
from components.utils import establish_connection

profile_bp = Blueprint('profile', __name__)

upload_folder = os.environ.get('UPLOAD_FOLDER')

@profile_bp.route('/', methods=['GET'])
@jwt_required()
def profile():
    current_user = get_jwt_identity()
    if not current_user:
        raise JWTExtendedException(description='Invalid token', status_code=401)
    return jsonify(logged_in_as=current_user), 200

@profile_bp.route('/get_picture', methods=['GET'])
@jwt_required()
def get_photo():
    user_id = get_jwt_identity()

    try:
        conn = establish_connection()

        cur = conn.cursor()

        cur.execute("SELECT profile_picture FROM users WHERE username = %s", (user_id,))
        profile_picture = cur.fetchone()

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to set profile picture"}), 500

    return jsonify({'profile_picture': profile_picture[0], 'user_id': user_id})

@profile_bp.route('/image/<name>')
def display_files(name):
    return send_from_directory(upload_folder, name)

@profile_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_photo():
    if 'file' not in request.files:
        return {'error': 'No file provided'}, 400

    photo = request.files['file']
    if photo.filename == '':
        return {'error': 'No file provided'}, 400

    filename = secure_filename(photo.filename)
    photo.save(os.path.join(upload_folder, filename))

    user_id = get_jwt_identity()

    try:
        conn = establish_connection()

        cur = conn.cursor()

        cur.execute("UPDATE users SET profile_picture = %s WHERE username = %s", (filename, user_id))
        conn.commit()

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to set profile picture"}), 500

    return jsonify({'profile_picture': filename, 'user_id': user_id})