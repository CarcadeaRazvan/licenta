from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import psycopg2

app = Flask(__name__)
CORS(app)

app.config['JWT_SECRET_KEY'] = 'secret_key'
jwt = JWTManager(app)

bcrypt = Bcrypt(app)

users = {
    "john": bcrypt.generate_password_hash("password123").decode('utf-8')
}

@app.route('/login', methods=['POST'])
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
    print(username, password)
    if not username or not password:
        return jsonify({"msg": "Username and password required"}), 400

    if username not in users:
        return jsonify({"msg": "Invalid username or password"}), 401

    if not bcrypt.check_password_hash(users.get(username), password):
        return jsonify({"msg": "Invalid username or password"}), 401

    access_token = create_access_token(identity=username)
    print(access_token)
    return jsonify(access_token=access_token), 200

@app.route('/register', methods=['POST'])
def register():
    username = request.json.get('username', None)
    password = request.json.get('password', None)
    print(username, password)
    if not username or not password:
        return jsonify({"msg": "Username and password required"}), 400

    # Hash the password
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    # Insert the user into the database
    try:
        conn = psycopg2.connect(
            host="172.21.0.2",
            database="mydatabase",
            user="postgres",
            password="admin",
            port="5432"
        )

        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (username, hashed_password))
        conn.commit()

        cursor.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to register user"}), 500

    # Return a success message
    return jsonify({"msg": "User registered successfully"}), 201

@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

