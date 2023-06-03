from flask import Flask
import psycopg2
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from flask_jwt_extended import JWTManager
from components.init import init
from werkzeug.utils import secure_filename
from werkzeug.datastructures import FileStorage
import os

app = Flask(__name__, static_folder='../backend/profiles')
app.config['JWT_SECRET_KEY'] = 'super-secret'
CORS(app)
jwt = JWTManager(app)
bcrypt = Bcrypt(app)
socketio = SocketIO(app, async_mode='threading')
app.config['UPLOAD_FOLDER'] = 'E:/licenta/backend/profiles'

init()

from components.shopping import shopping_bp
app.register_blueprint(shopping_bp, url_prefix='/shopping')

from components.profile import profile_bp
app.register_blueprint(profile_bp, url_prefix='/profile')

from components.auth import auth_bp
app.register_blueprint(auth_bp, url_prefix='/auth')

from components.utils import utils_bp
app.register_blueprint(utils_bp, url_prefix='/utils')

from components.chat import chat_bp
app.register_blueprint(chat_bp, url_prefix='/chat')

from components.chores import chores_bp
app.register_blueprint(chores_bp, url_prefix='/chores')

from components.calendar import calendar_bp
app.register_blueprint(calendar_bp, url_prefix='/calendar')

from components.rewards import rewards_bp
app.register_blueprint(rewards_bp, url_prefix='/rewards')

if __name__ == '__main__':
    socketio.run(app, debug=False, host='0.0.0.0', port=5000)