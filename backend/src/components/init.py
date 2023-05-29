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
                profile_picture TEXT
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
        conn.commit()

        cursor.close()
        conn.close()
    except psycopg2.Error as e:
        print(e)
        return jsonify({"msg": "Failed to init tables"}), 500