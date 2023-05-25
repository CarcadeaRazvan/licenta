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
# app.config['UPLOAD_FOLDER'] = os.path.join(app.static_folder, 'profiles')
app.config['UPLOAD_FOLDER'] = 'E:/licenta/licenta/backend/profiles'

# photos = UploadSet('photos', IMAGES)
# configure_uploads(app, photos)

init()

from components.shopping import shopping_bp
app.register_blueprint(shopping_bp, url_prefix='/shopping')

from components.profile import profile_bp
app.register_blueprint(profile_bp, url_prefix='/profile')

from components.auth import auth_bp
app.register_blueprint(auth_bp, url_prefix='/auth')

from components.utils import utils_bp
app.register_blueprint(utils_bp, url_prefix='/utils')

if __name__ == '__main__':
    socketio.run(app, debug=False, host='0.0.0.0', port=5000)