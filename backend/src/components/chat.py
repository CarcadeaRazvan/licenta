from flask import Blueprint, request, jsonify
from cryptography.fernet import Fernet
import psycopg2
from flask_socketio import emit
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import socketio
import json
from datetime import datetime
import re
from components.utils import establish_connection

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
    chat_id = data['chat_id']
    encrypted_message = data['message']

    try:
        conn = establish_connection()

        cur = conn.cursor()

        cur.execute("SELECT profile_picture FROM users WHERE username = %s", (user_id,))
        profile_picture = cur.fetchone()

        message = {
            'username': user_id,
            'content': encrypted_message,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'profilePhoto': profile_picture
        }

        message_json = json.dumps(message)

        cur.execute("SELECT chat_id FROM shared_chats WHERE %s = ANY (user_ids) AND chat_id = %s", (user_id, chat_id))
        result = cur.fetchone()
        if not result:
            return

        cur.execute("UPDATE private_chats SET messages = messages || %s::jsonb WHERE chat_id = %s", (message_json, chat_id))
        conn.commit()

        cur.execute("SELECT * FROM private_chats WHERE chat_id = %s", (chat_id,))
        private_chat = cur.fetchall()

        cur.execute("SELECT username FROM users")
        existing_usernames = cur.fetchall()

        for message in private_chat[0][2]:
            message['content'] = decrypt_message(message['content'])

        mentioned_usernames = re.findall(r'@(\w+)', private_chat[0][2][-1]['content'])

        if len(mentioned_usernames) > 0:
            for username in mentioned_usernames:
                if (username,) in existing_usernames:
                    if username != user_id:
                        notification = 'You have been mentioned in a chat - {}'.format(private_chat[0][1])

                        cur.execute("""
                                    INSERT INTO notifications (username, notification)
                                    VALUES (%s, %s) RETURNING *
                                """, (username, notification))
                        conn.commit()

        cur.execute("SELECT chat_id FROM shared_chats WHERE %s = ANY (user_ids)", (user_id,))
        shared_chat_ids = cur.fetchall()
        chat_ids = [row[0] for row in shared_chat_ids]

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get add messages"}), 500

    emit('updateChat', {"chatIds": chat_ids, "privateChat": private_chat, "currentUser": user_id}, broadcast=True)

@chat_bp.route('/get_users_from_chat', methods=['POST'])
@jwt_required()
def get_users_from_chat():
    chat_id = request.json.get('chat_id')

    try:
        conn = establish_connection()

        cursor = conn.cursor()

        cursor.execute("SELECT id, username FROM users")
        rows = cursor.fetchall()
        users = [{'id': row[0], 'username': row[1]} for row in rows]

        cursor.execute("SELECT user_ids FROM shared_chats WHERE chat_id = %s", (chat_id,))
        usernames = cursor.fetchone()

        filteredUsers = [user for user in users if user['username'] in usernames[0]]

        cursor.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get user ids"}), 500

    return jsonify(filteredUsers)

@socketio.on('remove_chat')
@jwt_required()
def handle_remove_chat(data):
    user_id = get_jwt_identity()
    chat_id = data['data']['chat_id']

    try:
        conn = establish_connection()

        cur = conn.cursor()
        cur.execute("DELETE FROM shared_chats WHERE chat_id = %s", (chat_id,))

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
        conn = establish_connection()

        cur = conn.cursor()

        cur.execute("INSERT INTO private_chats (chat_name, messages) VALUES (%s, %s) RETURNING chat_id",
                    (chat_name, messages))
        chat_id = cur.fetchone()[0]

        for username in usernames:
            if user_id != username:
                notification = 'You have been added to the chat {}'.format(chat_name)

                cur.execute("""
                        INSERT INTO notifications (username, notification)
                        VALUES (%s, %s) RETURNING *
                    """, (username, notification))

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
        conn = establish_connection()

        cur = conn.cursor()

        cur.execute("SELECT chat_id FROM shared_chats WHERE %s = ANY (user_ids)", (user_id,))
        shared_chat_ids = cur.fetchall()
        chat_ids = [row[0] for row in shared_chat_ids]

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
    user_id = get_jwt_identity()

    try:
        conn = establish_connection()

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
    user_id = get_jwt_identity()
    chat_ids = data['chat_data']['chatIds']

    try:
        conn = establish_connection()

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
        conn = establish_connection()

        cur = conn.cursor()

        cur.execute("SELECT chat_id FROM shared_chats WHERE %s = ANY (user_ids) AND chat_id = %s", (user_id, chat_id))
        result = cur.fetchone()
        if not result:
            return

        cur.execute("SELECT * FROM private_chats WHERE chat_id = %s", (chat_id,))
        private_chat = cur.fetchall()

        for message in private_chat[0][2]:
            message['content'] = decrypt_message(message['content'])

        cur.execute("SELECT chat_id FROM shared_chats WHERE %s = ANY (user_ids)", (user_id,))
        shared_chat_ids = cur.fetchall()
        chat_ids = [row[0] for row in shared_chat_ids]

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get add messages"}), 500

    emit('updateChat', {"chatIds": chat_ids, "privateChat": private_chat, "currentUser": user_id}, broadcast=True)

@chat_bp.route('/get_chat_name', methods=['POST'])
@jwt_required()
def get_chat_name():
    chat_id = request.json.get('chat_id')

    try:
        conn = establish_connection()

        cursor = conn.cursor()

        cursor.execute("SELECT chat_name FROM private_chats WHERE chat_id = %s", (chat_id,))
        chat_name = cursor.fetchone()

        cursor.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get user ids"}), 500

    return jsonify(chat_name)