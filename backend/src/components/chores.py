from flask import Blueprint, request, jsonify
import psycopg2
from flask_socketio import emit
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import socketio
from components.utils import establish_connection

chores_bp = Blueprint('chores', __name__)

@chores_bp.route('/get_user_chores', methods=['GET'])
@jwt_required()
def get_user_chores():
    user_id = get_jwt_identity()

    try:
        conn = establish_connection()

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

    try:
        conn = establish_connection()

        cur = conn.cursor()

        cur.execute("""
            SELECT chore_reward
            FROM chores
            WHERE chore_id = %(chore_id)s
        """, {'chore_id': chore_id})

        chore_reward = cur.fetchone()[0]

        cur.execute("""
            UPDATE users
            SET points = points + %(chore_reward)s
            WHERE username = %(assigned_user)s
        """, {'chore_reward': chore_reward, 'assigned_user': user_id})

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
        conn = establish_connection()

        cur = conn.cursor()

        cur.execute("SELECT * FROM chores WHERE assigned_user IS NULL")
        chores = cur.fetchall()

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get shared lists"}), 500

    emit('getChores', {"chores": chores, "currentUser": user_id}, broadcast=True)

@socketio.on('create_chore')
@jwt_required()
def create_chore(data):
    user_id = get_jwt_identity()

    try:
        conn = establish_connection()

        cur = conn.cursor()

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
        conn = establish_connection()

        cur = conn.cursor()

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