from flask import jsonify
import psycopg2

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
                password TEXT NOT NULL,
                profile_picture TEXT,
                points INTEGER DEFAULT 0,
                rewards INTEGER[]
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS shopping_lists (
                list_id SERIAL PRIMARY KEY,
                list_name TEXT NOT NULL,
                items TEXT[]
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS shared_chats (
                chat_id SERIAL PRIMARY KEY,
                user_ids TEXT[]
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS private_chats (
                chat_id SERIAL PRIMARY KEY,
                chat_name TEXT NOT NULL,
                messages JSONB[]
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chores (
                chore_id SERIAL PRIMARY KEY,
                chore_name TEXT NOT NULL,
                chore_description TEXT,
                chore_reward INTEGER,
                assigned_user TEXT
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS rewards (
                reward_id SERIAL PRIMARY KEY,
                reward_name TEXT NOT NULL,
                reward_description TEXT,
                reward_price INTEGER
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS availabilities (
                availability_id SERIAL PRIMARY KEY,
                username TEXT NOT NULL,
                day TEXT,
                start_time TEXT,
                end_time TEXT
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS activities (
                activity_id SERIAL PRIMARY KEY,
                activity_name TEXT NOT NULL,
                activity_description TEXT,
                day TEXT,
                start_time TEXT,
                end_time TEXT,
                user_ids TEXT[]
            )
        """)
        conn.commit()

        cursor.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to init tables"}), 500