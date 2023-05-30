from flask import Blueprint, request, jsonify
import psycopg2
from flask_socketio import emit
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from app import socketio

calendar_bp = Blueprint('calendar', __name__)

@calendar_bp.route('/get_user_events', methods=['POST'])
@jwt_required()
def get_user_events():
    user_id = get_jwt_identity()
    selected_date = request.json.get('selectedDate')

    try:
        conn = psycopg2.connect(
                host="localhost",
                database="mydatabase",
                user="postgres",
                password="admin",
                port="5432"
            )

        cur = conn.cursor()

        cur.execute("SELECT * FROM activities WHERE %s = ANY (user_ids) AND day = %s", (user_id,selected_date,))
        events = cur.fetchall()

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get user ids"}), 500
    
    return jsonify(events=events, currentUser=user_id)

@calendar_bp.route('/get_user_availabilities', methods=['POST'])
@jwt_required()
def get_user_availabilities():
    user_id = get_jwt_identity()
    selected_date = request.json.get('selectedDate')
    start_time = request.json.get('startTime')
    end_time = request.json.get('endTime')

    try:
        conn = psycopg2.connect(
                host="localhost",
                database="mydatabase",
                user="postgres",
                password="admin",
                port="5432"
            )

        cur = conn.cursor()

        cur.execute("""
            SELECT DISTINCT u.username
            FROM users AS u
            LEFT JOIN (
                SELECT username
                FROM availabilities
                WHERE day = %(selected_date)s
                    AND (
                        (start_time <= %(start_time)s AND end_time >= %(end_time)s) OR
                        (start_time >= %(start_time)s AND start_time < %(end_time)s)
                    )
            ) AS a ON u.username = a.username
            WHERE a.username IS NULL
        """, {
            "selected_date": selected_date,
            "start_time": start_time,
            "end_time": end_time
        })
        availabilities = [item for item in cur.fetchall()]
        print(availabilities)

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get user ids"}), 500
    
    return jsonify(availabilities=availabilities, currentUser=user_id)

@calendar_bp.route('/add_activity', methods=['POST'])
@jwt_required()
def add_activity():
    user_id = get_jwt_identity()
    selected_date = request.json.get('selectedDate')
    start_time = request.json.get('startTime')
    end_time = request.json.get('endTime')
    activity_name = request.json.get('activityName')
    activity_description = request.json.get('activityDescription')
    participants = request.json.get('participants')
    print(participants)
    usernames = [user['username'] for user in participants]
    # activity_name = data['data']['name']
    # activity_description = data['data']['items']
    # participants = data['data']['participants']
    # usernames = [user['username'] for user in participants]

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
            cur.execute("""
                INSERT INTO availabilities (username, day, start_time, end_time)
                VALUES (%s, %s, %s, %s) RETURNING *
            """, (username, selected_date, start_time, end_time))

        cur.execute("""
            INSERT INTO activities (activity_name, activity_description, day, start_time, end_time, user_ids)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING *
        """, (activity_name, activity_description, selected_date, start_time, end_time, usernames))
        conn.commit()

        cur.execute("SELECT * FROM activities WHERE %s = ANY (user_ids) AND day = %s", (user_id,selected_date,))
        activities = cur.fetchall()

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to create activity"}), 500
    
    return jsonify(activities=activities, currentUser=user_id)