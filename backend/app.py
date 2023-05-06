from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import psycopg2
from flask_jwt_extended.exceptions import JWTExtendedException
from flask_socketio import SocketIO, emit
from datetime import timedelta

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'super-secret'  # Replace with a secure key in production
CORS(app)
jwt = JWTManager(app)
bcrypt = Bcrypt(app)
socketio = SocketIO(app, async_mode='threading')

@jwt.invalid_token_loader
def handle_invalid_token(jwt_payload):
    response = jsonify({'error': 'Invalid token'})
    response.status_code = 401
    return response

@app.errorhandler(JWTExtendedException)
def handle_jwt_error(error):
    response = jsonify({'error': error.description})
    response.status_code = error.status_code
    return response

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

    access_token = create_access_token(identity=username, expires_delta=timedelta(days=1))
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
            host="localhost",
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

@app.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    current_user = get_jwt_identity()
    if not current_user:
        raise JWTExtendedException(description='Invalid token', status_code=401)
    return jsonify(logged_in_as=current_user), 200


shopping_list = []

@app.route('/shopping', methods=['GET'])
@jwt_required()
def get_shopping_list():
    # Return the shopping list as a JSON array
    return jsonify(shopping_list)

@socketio.on('get_items')
@jwt_required()
def handle_get_items():
    # Emit a message to all connected clients with the updated shopping list
    print("get_items")
    emit('updateList', shopping_list, broadcast=True)

@socketio.on('add_item')
@jwt_required()
def handle_add_item(data):
    user_id = get_jwt_identity()
    # Add the new item to the shopping list
    shopping_list.append(data['item'])
    # Emit a message to all connected clients with the updated shopping list
    print("add_item")
    emit('updateList', shopping_list, broadcast=True)

@socketio.on('remove_item')
@jwt_required()
def handle_remove_item(data):
    # Remove the item from the shopping list
    index = data['index']
    del shopping_list[index]
    print("remove_item, " + str(index))
    # Emit a message to all connected clients with the updated shopping list
    emit('updateList', shopping_list, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, debug=False, host='0.0.0.0', port=5000)

