from flask import Blueprint, request, jsonify
import psycopg2
from flask_jwt_extended import create_access_token
from flask_bcrypt import generate_password_hash, check_password_hash
from datetime import timedelta
import json

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    conn = psycopg2.connect(
        host="localhost",
        database="mydatabase",
        user="postgres",
        password="admin"
    )

    # execute a SELECT query on the "users" table
    cur = conn.cursor()
    cur.execute("SELECT username, password FROM users;")

    # fetch the data and store it in a dictionary
    users = {}
    for row in cur.fetchall():
        username, password_hash = row
        users[username] = password_hash

    # close the cursor and connection
    cur.close()
    conn.close()

    username = request.json.get('username', None)
    password = request.json.get('password', None)

    if not username or not password:
        return jsonify({"msg": "Username and password required"}), 400

    if username not in users:
        return jsonify({"msg": "Invalid username or password"}), 401

    if not check_password_hash(users.get(username), password):
        return jsonify({"msg": "Invalid username or password"}), 401

    access_token = create_access_token(identity=username, expires_delta=timedelta(days=1))
    print(access_token)
    return jsonify(access_token=access_token), 200

@auth_bp.route('/register', methods=['POST'])
def register():
    username = request.json.get('username', None)
    password = request.json.get('password', None)
    if not username or not password:
        return jsonify({"msg": "Username and password required"}), 400

    hashed_password = generate_password_hash(password).decode('utf-8')

    try:
        conn = psycopg2.connect(
            host="localhost",
            database="mydatabase",
            user="postgres",
            password="admin",
            port="5432"
        )

        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (username, password, profile_picture) VALUES (%s, %s, %s)", (username, hashed_password, "default.jpg"))
        conn.commit()

        cursor.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to register user"}), 500

    # Return a success message
    return jsonify({"msg": "User registered successfully"}), 201