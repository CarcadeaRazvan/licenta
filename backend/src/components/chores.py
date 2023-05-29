from flask import Blueprint, request, jsonify
import psycopg2
from flask_socketio import emit
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from app import socketio

chores_bp = Blueprint('chores', __name__)

@chores_bp.route('/get_user_chores', methods=['GET'])
@jwt_required()
def get_user_chores():
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

        cur.execute("SELECT * FROM chores WHERE assigned_user = %s", (user_id,))
        chores = cur.fetchall()

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get user ids"}), 500

    return jsonify(chores=chores, currentUser=user_id)

@chores_bp.route('/complete_chore', methods=['POST'])
@jwt_required()
def complete_chore():
    user_id = get_jwt_identity()
    chore_id = request.json.get('chore_id')

    print(chore_id)

    try:
        conn = psycopg2.connect(
                host="localhost",
                database="mydatabase",
                user="postgres",
                password="admin",
                port="5432"
            )

        cur = conn.cursor()

        cur.execute("DELETE FROM chores WHERE chore_id = %s", (chore_id,))
        conn.commit()

        cur.execute("SELECT * FROM chores WHERE assigned_user = %s", (user_id,))
        chores = cur.fetchall()

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get user ids"}), 500

    return jsonify(chores=chores, currentUser=user_id)

@socketio.on('get_chores')
@jwt_required()
def handle_get_chores():
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

        # Fetch the shopping lists based on the list IDs from the shopping_lists table
        cur.execute("SELECT * FROM chores WHERE assigned_user IS NULL")
        chores = cur.fetchall()

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get shared lists"}), 500

    # return jsonify(chores=chores, currentUser=user_id)

    emit('getChores', {"chores": chores, "currentUser": user_id}, broadcast=True)

@socketio.on('create_chore')
@jwt_required()
def create_chore(data):
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
        cur.execute("INSERT INTO chores (chore_name, chore_description, chore_reward) VALUES (%s, %s, %s) RETURNING *",
                (data["data"]["chore_name"], data["data"]["chore_description"], int(data["data"]["chore_reward"])))
        
        cur.execute("SELECT * FROM chores WHERE assigned_user IS NULL")
        chores = cur.fetchall()

        conn.commit()

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get user ids"}), 500

    emit('getChores', {"chores": chores, "currentUser": user_id}, broadcast=True)

@socketio.on('assign_chore')
@jwt_required()
def assign_chore(data):
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
        cur.execute("UPDATE chores SET assigned_user = %s WHERE chore_id = %s", (user_id, data["data"]["chore_id"]))
        conn.commit()

        cur.execute("SELECT * FROM chores WHERE assigned_user IS NULL")
        chores = cur.fetchall()

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get user ids"}), 500

    emit('getChores', {"chores": chores, "currentUser": user_id}, broadcast=True)