from flask import Blueprint, request, jsonify
import psycopg2
from flask_socketio import emit
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from app import socketio
from components.utils import establish_connection

calendar_bp = Blueprint('calendar', __name__)

@socketio.on('get_user_events')
@jwt_required()
def handle_get_user_events(data):
    user_id = get_jwt_identity()
    selected_date = data['data']['selectedDate']

    try:
        conn = establish_connection()

        cur = conn.cursor()

        cur.execute("SELECT * FROM activities WHERE %s = ANY (user_ids) AND day = %s", (user_id,selected_date))
        activities = cur.fetchall()

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to get user ids"}), 500
    
    emit('getEvents', {"activities": activities, "currentUser": user_id}, broadcast=True)

@calendar_bp.route('/get_user_availabilities', methods=['POST'])
@jwt_required()
def get_user_availabilities():
    user_id = get_jwt_identity()
    selected_date = request.json.get('selectedDate')
    start_time = request.json.get('startTime')
    end_time = request.json.get('endTime')

    try:
        conn = establish_connection()

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
    usernames = [user['username'] for user in participants]

    try:
        conn = establish_connection()

        cur = conn.cursor()

        for username in usernames:
            cur.execute("""
                INSERT INTO availabilities (username, day, start_time, end_time)
                VALUES (%s, %s, %s, %s) RETURNING *
            """, (username, selected_date, start_time, end_time))

            if username != user_id:
                notification = 'You have been added to the activity {} on {}, {} - {}'.format(activity_name, selected_date, start_time, end_time)

                cur.execute("""
                    INSERT INTO notifications (username, notification)
                    VALUES (%s, %s) RETURNING *
                """, (username, notification))

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

@socketio.on('share_event')
@jwt_required()
def handle_share_event(data):
    user_id = get_jwt_identity()
    event_id = data['data']['eventId']
    participants = data['data']['participants']
    selected_date = data['data']['selectedDate']
    start_time = data['data']['startTime']
    end_time = data['data']['endTime']
    usernames = [user['username'] for user in participants]
    activity_name = data['data']['activityName']

    try:
        conn = establish_connection()

        cur = conn.cursor()

        cur.execute("""
            SELECT user_ids
            FROM activities
            WHERE activity_id = %(activity_id)s
        """, {"activity_id": event_id})
        existing_usernames = cur.fetchone()[0]

        updated_usernames = list(set(existing_usernames + usernames))

        for username in usernames:
            cur.execute("""
                INSERT INTO availabilities (username, day, start_time, end_time)
                VALUES (%s, %s, %s, %s) RETURNING *
            """, (username, selected_date, start_time, end_time))

            notification = 'You have been shared the activity {} on {}, {} - {}'.format(activity_name, selected_date, start_time, end_time)

            cur.execute("""
                INSERT INTO notifications (username, notification)
                VALUES (%s, %s) RETURNING *
            """, (username, notification))

        cur.execute("""
            UPDATE activities
            SET user_ids = %(updated_usernames)s
            WHERE activity_id = %(activity_id)s
        """, {"updated_usernames": updated_usernames, "activity_id": event_id})
        conn.commit()

        cur.execute("SELECT * FROM activities WHERE %s = ANY (user_ids) AND day = %s", (user_id,selected_date))
        activities = cur.fetchall()

        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to create list"}), 500

    emit('getUserEvents', {"activities": activities, "currentUser": user_id}, broadcast=True)