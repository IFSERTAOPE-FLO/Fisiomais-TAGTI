from flask import Blueprint, jsonify, request, url_for
from app.models import Clientes, Enderecos, Colaboradores, db, PlanosTratamento, HistoricoSessao

from werkzeug.security import generate_password_hash
from datetime import datetime
import secrets
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from werkzeug.utils import secure_filename

planos_de_tratamento = Blueprint('planos_de_tratamento', __name__)