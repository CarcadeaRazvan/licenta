from flask import Blueprint, request, jsonify
import psycopg2
from flask_socketio import emit
from flask_jwt_extended.exceptions import JWTExtendedException
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from app import socketio

shopping_bp = Blueprint('shopping', __name__)

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

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get add items"}), 500

    emit('updateList', {"listIds": list_ids, "shoppingList": shopping_list, "currentUser": user_id}, broadcast=True)

@socketio.on('add_item_to_list')
@jwt_required()
def handle_add_item(data):
    user_id = get_jwt_identity()
    list_id = data['data']['list_id']
    item = data['data']['item']

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
        cur.execute("SELECT * FROM shopping_lists WHERE list_id = %s", (list_id,))
        shopping_list = cur.fetchone()

        if shopping_list is None:
            return

        del shopping_list[2][index]

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
        cur.execute("SELECT user_ids FROM shared_lists WHERE list_id = %s", (list_id,))
        usernames = cur.fetchall()

        cur.execute("SELECT list_name FROM shopping_lists WHERE list_id = %s", (list_id,))
        list_name = cur.fetchone()

        for username in usernames[0][0]:
            if username != user_id:
                notification = 'Shopping list {} has been deleted'.format(list_name[0])

                cur.execute("""
                    INSERT INTO notifications (username, notification)
                    VALUES (%s, %s) RETURNING *
                """, (username, notification))

        cur.execute("DELETE FROM shared_lists WHERE list_id = %s", (list_id,))

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

    try:
        conn = psycopg2.connect(
                host="localhost",
                database="mydatabase",
                user="postgres",
                password="admin",
                port="5432"
            )

        cur = conn.cursor()

        for username in usernames:
            if username != user_id:
                notification = 'You have been added to the shopping list {}'.format(list_name)

                cur.execute("""
                    INSERT INTO notifications (username, notification)
                    VALUES (%s, %s) RETURNING *
                """, (username, notification))

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

        # Fetch the shopping lists based on the list IDs from the shopping_lists table
        cur.execute("SELECT * FROM shopping_lists WHERE list_id = ANY (%s)", (list_ids,))
        shopping_lists = cur.fetchall()

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to create list"}), 500

    emit('updateLists', {"listId": list_id, "listIds": list_ids, "shoppingLists": shopping_lists, "currentUser": user_id}, broadcast=True)