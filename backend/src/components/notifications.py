from flask import Blueprint, request, jsonify
import psycopg2
from flask_socketio import emit
from flask_jwt_extended.exceptions import JWTExtendedException
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from app import socketio

notifications_bp = Blueprint('notifications', __name__)

@socketio.on('get_notifications')
@jwt_required()
def handle_get_notifications():
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

        cur.execute("SELECT * FROM notifications WHERE username = %s", (user_id,))
        notifications = cur.fetchall()

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to delete chat"}), 500

    # Emit a message to all connected clients with the updated shopping chat
    emit('getNotifications', {"notifications": notifications, "currentUser": user_id}, broadcast=True)


@socketio.on('clear_notifications')
@jwt_required()
def handle_clear_notifications():
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

        cur.execute("DELETE FROM notifications WHERE username = %s", (user_id,))
        conn.commit()

        cur.execute("SELECT * FROM notifications WHERE username = %s", (user_id,))
        notifications = cur.fetchall()

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to delete chat"}), 500

    emit('getNotifications', {"notifications": notifications, "currentUser": user_id}, broadcast=True)