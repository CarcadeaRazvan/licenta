from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import psycopg2
from flask_jwt_extended.exceptions import JWTExtendedException
from flask_socketio import SocketIO, emit
from datetime import timedelta
import json

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

@app.route('/get_username')
@jwt_required()
def get_username():
    current_user = get_jwt_identity()
    if not current_user:
        raise JWTExtendedException(description='Invalid token', status_code=401)
    return jsonify(current_user), 200

shopping_list = []

def init():
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="mydatabase",
            user="postgres",
            password="admin",
            port="5432"
        )

        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS shared_lists (
                list_id SERIAL PRIMARY KEY,
                user_ids TEXT[]
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS shopping_lists (
                list_id SERIAL PRIMARY KEY,
                list_name TEXT NOT NULL,
                items TEXT[]
            )
        """)
        conn.commit()

        cursor.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to init tables"}), 500

@app.route('/get_user_ids', methods=['GET'])
@jwt_required()
def get_user_ids():
    # Return the shopping list as a JSON array
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

    print(users)
    return jsonify(users)

@socketio.on('get_list_ids')
@jwt_required()
def get_list_ids():
    # Return the shopping list as a JSON array
    user_id = get_jwt_identity()

    try:
        conn = psycopg2.connect(
            host="localhost",
            database="mydatabase",
            user="postgres",
            password="admin",
            port="5432"
        )

        cursor = conn.cursor()
        cursor.execute("SELECT list_id FROM shared_lists WHERE %s = ANY (user_ids)", (user_id,))
        shared_list_ids = cursor.fetchall()
        list_ids = [row[0] for row in shared_list_ids]
        print(list_ids)

        cursor.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get user ids"}), 500

    emit('listIds', {"listIds": list_ids, "currentUser": user_id}, broadcast=True)

@socketio.on('get_list_from_ids')
@jwt_required()
def get_list_from_ids(data):
    # Return the shopping list as a JSON array
    user_id = get_jwt_identity()
    print(data)
    list_ids = data['list_data']['listIds']

    try:
        conn = psycopg2.connect(
            host="localhost",
            database="mydatabase",
            user="postgres",
            password="admin",
            port="5432"
        )

        cursor = conn.cursor()
        cursor.execute("SELECT * FROM shopping_lists WHERE list_id = ANY(%s)", (list_ids,))
        
        shopping_lists = cursor.fetchall()

        cursor.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get user ids"}), 500

    emit('listByIds', {"shoppingLists": shopping_lists, "currentUser": user_id}, broadcast=True)

@socketio.on('get_shared_lists')
@jwt_required()
def handle_get_shared_lists():
    user_id = get_jwt_identity()
    print(user_id)
    try:
        conn = psycopg2.connect(
                host="localhost",
                database="mydatabase",
                user="postgres",
                password="admin",
                port="5432"
            )

        cur = conn.cursor()

        # Fetch the shared lists for the user from the shared_lists table
        cur.execute("SELECT list_id FROM shared_lists WHERE %s = ANY (user_ids)", (user_id,))
        shared_list_ids = cur.fetchall()
        list_ids = [row[0] for row in shared_list_ids]

        # Fetch the shopping lists based on the list IDs from the shopping_lists table
        cur.execute("SELECT * FROM shopping_lists WHERE list_id = ANY (%s)", (list_ids,))
        shopping_lists = cur.fetchall()
        print(shopping_lists)

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get shared lists"}), 500

    emit('updateLists', {"listIds": list_ids, "shoppingLists": shopping_lists, "currentUser": user_id}, broadcast=True)

@socketio.on('get_items_from_list')
@jwt_required()
def handle_get_items(data):
    user_id = get_jwt_identity()
    list_id = data['list_data']['list_id']

    try:
        conn = psycopg2.connect(
                host="localhost",
                database="mydatabase",
                user="postgres",
                password="admin",
                port="5432"
            )

        cur = conn.cursor()

        # Check if the user is allowed to add items to the shared list
        cur.execute("SELECT list_id FROM shared_lists WHERE %s = ANY (user_ids) AND list_id = %s", (user_id, list_id))
        result = cur.fetchone()
        if not result:
            return

        cur.execute("SELECT * FROM shopping_lists WHERE list_id = %s", (list_id,))
        shopping_list = cur.fetchall()

        cur.execute("SELECT list_id FROM shared_lists WHERE %s = ANY (user_ids)", (user_id,))
        shared_list_ids = cur.fetchall()
        list_ids = [row[0] for row in shared_list_ids]

        print(shopping_list)

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get add items"}), 500

    emit('updateList', {"listIds": list_ids, "shoppingList": shopping_list, "currentUser": user_id}, broadcast=True)

@socketio.on('add_item_to_list')
@jwt_required()
def handle_add_item(data):
    # data = request.get_json()
    print(data)

    user_id = get_jwt_identity()
    list_id = data['data']['list_id']
    item = data['data']['item']

    print(item)

    try:
        conn = psycopg2.connect(
                host="localhost",
                database="mydatabase",
                user="postgres",
                password="admin",
                port="5432"
            )

        cur = conn.cursor()

        # Check if the user is allowed to add items to the shared list
        cur.execute("SELECT list_id FROM shared_lists WHERE %s = ANY (user_ids) AND list_id = %s", (user_id, list_id))
        result = cur.fetchone()
        if not result:
            return

        # Add the new item to the list in the shopping_lists table
        cur.execute("UPDATE shopping_lists SET items = items || %s WHERE list_id = %s", ([item], list_id))
        conn.commit()

        cur.execute("SELECT * FROM shopping_lists WHERE list_id = %s", (list_id,))
        shopping_list = cur.fetchall()

        cur.execute("SELECT list_id FROM shared_lists WHERE %s = ANY (user_ids)", (user_id,))
        shared_list_ids = cur.fetchall()
        list_ids = [row[0] for row in shared_list_ids]

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get add items"}), 500

    emit('updateList', {"listIds": list_ids, "shoppingList": shopping_list, "currentUser": user_id}, broadcast=True)


@socketio.on('remove_item_from_list')
@jwt_required()
def handle_remove_item(data):
    user_id = get_jwt_identity()
    list_id = data['data']['list_id']
    index = data['data']['index']

    try:
        conn = psycopg2.connect(
                host="localhost",
                database="mydatabase",
                user="postgres",
                password="admin",
                port="5432"
            )

        cur = conn.cursor()
        # Retrieve the shopping list
        cur.execute("SELECT * FROM shopping_lists WHERE list_id = %s", (list_id,))
        shopping_list = cur.fetchone()

        print(shopping_list[2])

        if shopping_list is None:
            # Shopping list not found, handle the error
            return

        # Remove the item from the shopping list
        del shopping_list[2][index]

        # Update the shopping list in the database
        cur.execute("UPDATE shopping_lists SET items = %s WHERE list_id = %s", (shopping_list[2], list_id))
        conn.commit()

        cur.execute("SELECT * FROM shopping_lists WHERE list_id = %s", (list_id,))
        shopping_list = cur.fetchall()

        cur.execute("SELECT list_id FROM shared_lists WHERE %s = ANY (user_ids)", (user_id,))
        shared_list_ids = cur.fetchall()
        list_ids = [row[0] for row in shared_list_ids]

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get remove items"}), 500

    # Emit a message to all connected clients with the updated shopping list
    emit('updateList', {"listIds": list_ids, "shoppingList": shopping_list, "currentUser": user_id}, broadcast=True)

@socketio.on('remove_list')
@jwt_required()
def handle_remove_list(data):
    user_id = get_jwt_identity()
    list_id = data['data']['list_id']

    try:
        conn = psycopg2.connect(
                host="localhost",
                database="mydatabase",
                user="postgres",
                password="admin",
                port="5432"
            )

        cur = conn.cursor()
        cur.execute("DELETE FROM shared_lists WHERE list_id = %s", (list_id,))
        conn.commit()

        cur.execute("DELETE FROM shopping_lists WHERE list_id = %s", (list_id,))
        conn.commit()

        cur.execute("SELECT list_id FROM shared_lists WHERE %s = ANY (user_ids)", (user_id,))
        shared_list_ids = cur.fetchall()
        list_ids = [row[0] for row in shared_list_ids]

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to delete list"}), 500

    # Emit a message to all connected clients with the updated shopping list
    emit('updateLists', {"listIds": list_ids, "currentUser": user_id}, broadcast=True)

@socketio.on('create_list')
@jwt_required()
def handle_create_list(data):
    user_id = get_jwt_identity()
    list_name = data['data']['name']
    items = data['data']['items']
    participants = data['data']['participants']
    usernames = [user['username'] for user in participants]

    print(list_name, participants)

    try:
        conn = psycopg2.connect(
                host="localhost",
                database="mydatabase",
                user="postgres",
                password="admin",
                port="5432"
            )

        cur = conn.cursor()

        # Insert the list into the shopping_lists table
        cur.execute("INSERT INTO shopping_lists (list_name, items) VALUES (%s, %s) RETURNING list_id",
                    (list_name, items))
        list_id = cur.fetchone()[0]

        # Insert the list ID and user IDs into the shared_lists table
        cur.execute("INSERT INTO shared_lists (list_id, user_ids) VALUES (%s, %s)", (list_id, usernames))
        conn.commit()

        cur.execute("SELECT list_id FROM shared_lists WHERE %s = ANY (user_ids)", (user_id,))
        shared_list_ids = cur.fetchall()
        list_ids = [row[0] for row in shared_list_ids]

        print(list_ids)

        # Fetch the shopping lists based on the list IDs from the shopping_lists table
        cur.execute("SELECT * FROM shopping_lists WHERE list_id = ANY (%s)", (list_ids,))
        shopping_lists = cur.fetchall()

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to create list"}), 500

    emit('updateLists', {"listId": list_id, "listIds": list_ids, "shoppingLists": shopping_lists, "currentUser": user_id}, broadcast=True)

    
init()

if __name__ == '__main__':
    socketio.run(app, debug=False, host='0.0.0.0', port=5000)

