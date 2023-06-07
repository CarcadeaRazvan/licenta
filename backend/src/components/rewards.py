from flask import Blueprint, request, jsonify
import psycopg2
from flask_socketio import emit
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import socketio
from components.utils import establish_connection

rewards_bp = Blueprint('rewards', __name__)

@socketio.on('get_rewards')
@jwt_required()
def handle_get_rewards():
    user_id = get_jwt_identity()

    try:
        conn = establish_connection()

        cur = conn.cursor()

        cur.execute("SELECT * FROM rewards")
        rewards = cur.fetchall()

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get rewards"}), 500

    emit('getRewards', {"rewards": rewards, "currentUser": user_id}, broadcast=True)

@rewards_bp.route('/get_points', methods=['GET'])
@jwt_required()
def handle_get_points():
    user_id = get_jwt_identity()

    try:
        conn = establish_connection()

        cur = conn.cursor()

        cur.execute("SELECT points FROM users WHERE username = %s", (user_id,))
        points = cur.fetchone()

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get rewards"}), 500

    return jsonify(points=points, currentUser=user_id)

@socketio.on('create_reward')
@jwt_required()
def create_reward(data):
    user_id = get_jwt_identity()

    try:
        conn = establish_connection()

        cur = conn.cursor()

        cur.execute("INSERT INTO rewards (reward_name, reward_description, reward_price) VALUES (%s, %s, %s) RETURNING *",
                (data["data"]["reward_name"], data["data"]["reward_description"], int(data["data"]["reward_price"])))
        
        cur.execute("SELECT * FROM rewards")
        rewards = cur.fetchall()

        conn.commit()

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get user ids"}), 500

    emit('getRewards', {"rewards": rewards, "currentUser": user_id}, broadcast=True)

@rewards_bp.route('/claim_reward', methods=['POST'])
@jwt_required()
def claim_reward():
    user_id = get_jwt_identity()
    reward_id = request.json.get('reward_id')

    try:
        conn = establish_connection()

        cur = conn.cursor()

        cur.execute("""
            SELECT *
            FROM rewards
            WHERE reward_id = %(reward_id)s
        """, {'reward_id': reward_id})

        reward_value = cur.fetchone()

        cur.execute("""
            SELECT *
            FROM users
            WHERE username = %(user_id)s
        """, {'user_id': user_id})

        points = cur.fetchone()

        if points[4] >= reward_value[3]:
            cur.execute("""
                UPDATE users
                SET rewards = rewards || %(reward_value)s
                WHERE username = %(user_id)s
            """, {'reward_value': reward_value[0], 'user_id': user_id})

            cur.execute("""
                UPDATE users
                SET points = points - %(reward_value)s
                WHERE username = %(user_id)s
            """, {'reward_value': reward_value[3], 'user_id': user_id})
            conn.commit()
        else:
            cur.close()
            conn.close()

            return jsonify({"msg": "Insufficient balance"})

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get user ids"}), 500

    return jsonify(claimed=reward_value)

@rewards_bp.route('/get_user_rewards', methods=['GET'])
@jwt_required()
def get_user_rewards():
    user_id = get_jwt_identity()

    try:
        conn = establish_connection()

        cur = conn.cursor()

        cur.execute("""
            SELECT rewards
            FROM users
            WHERE username = %(user_id)s
        """, {'user_id': user_id})

        rewards_ids = cur.fetchone()

        if rewards_ids[0]:

            cur.execute("""
                SELECT *
                FROM rewards
                WHERE reward_id IN %(rewards_ids)s
            """, {'rewards_ids': tuple(rewards_ids[0])})

            rewards = cur.fetchall()
        else:
            rewards = []

    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get user rewards"}), 500
    
    return jsonify(rewards=rewards)