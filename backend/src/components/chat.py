from flask import Blueprint, request, jsonify
from cryptography.fernet import Fernet
import psycopg2
from flask_socketio import emit
from flask_jwt_extended.exceptions import JWTExtendedException
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from app import socketio
import json
from datetime import datetime

encryption_key = 'Vp3abwxq2dFV9x7cGgnTzFAErJqjJ8U0yMB1zzooJlU='

cipher = Fernet(encryption_key)

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/encrypt', methods=['POST'])
@jwt_required()
def encrypt():
    plaintext = request.json['message']
    ciphertext = encrypt_message(plaintext)
    return {'ciphertext': ciphertext}

@chat_bp.route('/decrypt', methods=['POST'])
@jwt_required()
def decrypt():
    ciphertext = request.json['ciphertext']
    plaintext = decrypt_message(ciphertext)
    return {'plaintext': plaintext}

def encrypt_message(plaintext):
    ciphertext = cipher.encrypt(plaintext.encode())
    return ciphertext.decode()

def decrypt_message(ciphertext):
    plaintext = cipher.decrypt(ciphertext.encode())
    return plaintext.decode()

@socketio.on('sendMessage')
@jwt_required()
def handle_send_message(data):
    user_id = get_jwt_identity()
    print(data)
    chat_id = data['chat_id']
    encrypted_message = data['message']
    decrypted_message = decrypt_message(encrypted_message)
    message = {
        'username': user_id,
        'content': encrypted_message,
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }

    message_json = json.dumps(message)

    try:
        conn = psycopg2.connect(
                host="localhost",
                database="mydatabase",
                user="postgres",
                password="admin",
                port="5432"
            )

        cur = conn.cursor()

        cur.execute("SELECT chat_id FROM shared_chats WHERE %s = ANY (user_ids) AND chat_id = %s", (user_id, chat_id))
        result = cur.fetchone()
        if not result:
            return

        cur.execute("UPDATE private_chats SET messages = messages || %s::jsonb WHERE chat_id = %s", (message_json, chat_id))
        conn.commit()

        cur.execute("SELECT * FROM private_chats WHERE chat_id = %s", (chat_id,))
        private_chat = cur.fetchall()

        for message in private_chat[0][2]:
            message['content'] = decrypt_message(message['content'])

        # print(private_chat[0][2])
        
        # for _, __, messages in private_chat:
        #     for i, encrypted_message in enumerate(messages):
        #         decrypted_message = decrypt_message(encrypted_message)
        #         messages[i] = decrypted_message

        cur.execute("SELECT chat_id FROM shared_chats WHERE %s = ANY (user_ids)", (user_id,))
        shared_chat_ids = cur.fetchall()
        chat_ids = [row[0] for row in shared_chat_ids]

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get add messages"}), 500

    emit('updateChat', {"chatIds": chat_ids, "privateChat": private_chat, "currentUser": user_id}, broadcast=True)

@socketio.on('remove_chat')
@jwt_required()
def handle_remove_chat(data):
    user_id = get_jwt_identity()
    chat_id = data['data']['chat_id']

    try:
        conn = psycopg2.connect(
                host="localhost",
                database="mydatabase",
                user="postgres",
                password="admin",
                port="5432"
            )

        cur = conn.cursor()
        cur.execute("DELETE FROM shared_chats WHERE chat_id = %s", (chat_id,))
        conn.commit()

        cur.execute("DELETE FROM private_chats WHERE chat_id = %s", (chat_id,))
        conn.commit()

        cur.execute("SELECT chat_id FROM shared_chats WHERE %s = ANY (user_ids)", (user_id,))
        shared_chat_ids = cur.fetchall()
        chat_ids = [row[0] for row in shared_chat_ids]

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to delete chat"}), 500

    # Emit a message to all connected clients with the updated shopping chat
    emit('updateChats', {"chatIds": chat_ids, "currentUser": user_id}, broadcast=True)

@socketio.on('create_chat')
@jwt_required()
def handle_create_chat(data):
    user_id = get_jwt_identity()
    chat_name = data['data']['name']
    messages = data['data']['messages']
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

        cur.execute("INSERT INTO private_chats (chat_name, messages) VALUES (%s, %s) RETURNING chat_id",
                    (chat_name, messages))
        chat_id = cur.fetchone()[0]

        cur.execute("INSERT INTO shared_chats (chat_id, user_ids) VALUES (%s, %s)", (chat_id, usernames))
        conn.commit()

        cur.execute("SELECT chat_id FROM shared_chats WHERE %s = ANY (user_ids)", (user_id,))
        shared_chat_ids = cur.fetchall()
        chat_ids = [row[0] for row in shared_chat_ids]

        cur.execute("SELECT * FROM private_chats WHERE chat_id = ANY (%s)", (chat_ids,))
        private_chats = cur.fetchall()

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to create chat"}), 500

    emit('updateChats', {"chatId": chat_id, "chatIds": chat_ids, "privateChats": private_chats, "currentUser": user_id}, broadcast=True)

@socketio.on('get_shared_chats')
@jwt_required()
def handle_get_shared_chats():
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

        cur.execute("SELECT chat_id FROM shared_chats WHERE %s = ANY (user_ids)", (user_id,))
        shared_chat_ids = cur.fetchall()
        chat_ids = [row[0] for row in shared_chat_ids]

        # Fetch the shopping chats based on the chat IDs from the shopping_chats table
        cur.execute("SELECT * FROM private_chats WHERE chat_id = ANY (%s)", (chat_ids,))
        private_chats = cur.fetchall()

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get shared chats"}), 500

    emit('updateChats', {"chatIds": chat_ids, "privateChats": private_chats, "currentUser": user_id}, broadcast=True)

@socketio.on('get_chat_ids')
@jwt_required()
def get_chat_ids():
    # Return the shopping chat as a JSON array
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
        cursor.execute("SELECT chat_id FROM shared_chats WHERE %s = ANY (user_ids)", (user_id,))
        shared_chat_ids = cursor.fetchall()
        chat_ids = [row[0] for row in shared_chat_ids]

        cursor.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get user ids"}), 500

    emit('chatIds', {"chatIds": chat_ids, "currentUser": user_id}, broadcast=True)

@socketio.on('get_chat_from_ids')
@jwt_required()
def get_chat_from_ids(data):
    # Return the shopping chat as a JSON array
    user_id = get_jwt_identity()
    chat_ids = data['chat_data']['chatIds']

    try:
        conn = psycopg2.connect(
            host="localhost",
            database="mydatabase",
            user="postgres",
            password="admin",
            port="5432"
        )

        cursor = conn.cursor()
        cursor.execute("SELECT * FROM private_chats WHERE chat_id = ANY(%s)", (chat_ids,))
        
        private_chats = cursor.fetchall()

        cursor.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get user ids"}), 500

    emit('chatByIds', {"privateChats": private_chats, "currentUser": user_id}, broadcast=True)

@socketio.on('get_messages_from_chat')
@jwt_required()
def handle_get_messages(data):
    user_id = get_jwt_identity()
    chat_id = data['chat_data']['chat_id']

    try:
        conn = psycopg2.connect(
                host="localhost",
                database="mydatabase",
                user="postgres",
                password="admin",
                port="5432"
            )

        cur = conn.cursor()

        # Check if the user is allowed to add messages to the shared chat
        cur.execute("SELECT chat_id FROM shared_chats WHERE %s = ANY (user_ids) AND chat_id = %s", (user_id, chat_id))
        result = cur.fetchone()
        if not result:
            return

        cur.execute("SELECT * FROM private_chats WHERE chat_id = %s", (chat_id,))
        private_chat = cur.fetchall()

        for message in private_chat[0][2]:
            message['content'] = decrypt_message(message['content'])

        # for _, __, messages in private_chat:
        #     for i, encrypted_message in enumerate(messages):
        #         decrypted_message = decrypt_message(encrypted_message)
        #         messages[i] = decrypted_message

        cur.execute("SELECT chat_id FROM shared_chats WHERE %s = ANY (user_ids)", (user_id,))
        shared_chat_ids = cur.fetchall()
        chat_ids = [row[0] for row in shared_chat_ids]

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get add messages"}), 500

    emit('updateChat', {"chatIds": chat_ids, "privateChat": private_chat, "currentUser": user_id}, broadcast=True)

    