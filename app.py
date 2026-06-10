
import os
import uuid
import requests
import jwt
import hmac
import html
import hashlib
import base64
import json
import random
import re
import smtplib
from email.message import EmailMessage
from urllib.parse import urlencode, urlparse

from openai import OpenAI
from io import BytesIO
from flask import send_file
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from functools import wraps
from twilio.rest import Client
from datetime import datetime, timedelta
from dotenv import load_dotenv
from flask import Flask, Response, redirect, request, jsonify, send_from_directory
from flask_cors import CORS, cross_origin
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash

load_dotenv()

app = Flask(__name__)

APP_ENV = os.getenv("APP_ENV", "development")


def normalize_public_url(value, fallback):
    url = (value or fallback or "").strip().rstrip("/")

    if url and not url.startswith(("http://", "https://")):
        url = f"https://{url}"

    return url


def get_payment_return_frontend_url():
    url = normalize_public_url(
        os.getenv("PAYMENT_RETURN_FRONTEND_URL"),
        FRONTEND_URL,
    )
    host = urlparse(url).netloc.lower()

    if host in {"zuri-elegance.netlify.app", "elegance.netlify.app"}:
        return "https://ephemeral-dusk-efaed3.netlify.app"

    return url


FRONTEND_URL = normalize_public_url(
    os.getenv("FRONTEND_URL"),
    "https://ephemeral-dusk-efaed3.netlify.app",
)
BACKEND_URL = normalize_public_url(
    os.getenv("BACKEND_URL"),
    "https://zuri-elegance-api.onrender.com",
)
extra_cors_origins = [
    normalize_public_url(origin, "")
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if normalize_public_url(origin, "")
]
ALLOWED_CORS_ORIGINS = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://ephemeral-dusk-efaed3.netlify.app",
    FRONTEND_URL,
    *extra_cors_origins,
}

CORS(
    app,
    resources={
        r"/*": {
            "origins": list(ALLOWED_CORS_ORIGINS),
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
        }
    },
    supports_credentials=True
)


def is_allowed_cors_origin(origin):
    if not origin:
        return False

    parsed = urlparse(origin)
    host = parsed.netloc.lower()

    return (
        origin in ALLOWED_CORS_ORIGINS
        or host.endswith(".netlify.app")
        or host in {"localhost:5173", "127.0.0.1:5173"}
    )


@app.before_request
def handle_cors_preflight():
    if request.method != "OPTIONS":
        return None

    response = jsonify({"ok": True})
    return response, 200


@app.after_request
def apply_cors_headers(response):
    origin = request.headers.get("Origin")

    if is_allowed_cors_origin(origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response.headers["Vary"] = "Origin"

    return response


DB_USER = os.getenv("DB_USER", "admin")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME", "mysql")

app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:3306/{DB_NAME}"
)

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-change-this")
SECRET_KEY = app.config["SECRET_KEY"]

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_VERIFY_SERVICE_SID = os.getenv("TWILIO_VERIFY_SERVICE_SID")

twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM")


db = SQLAlchemy(app)


UPLOAD_FOLDER = "static/uploads"
ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
MAX_PRODUCT_IMAGE_BYTES = 8 * 1024 * 1024
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

MISSING_PRODUCT_IMAGE_SVG = """<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff8f0"/>
      <stop offset="1" stop-color="#50242a"/>
    </linearGradient>
  </defs>
  <rect width="900" height="900" fill="url(#bg)"/>
  <circle cx="450" cy="350" r="150" fill="rgba(255,255,255,.28)"/>
  <text x="450" y="510" text-anchor="middle" font-family="Georgia,serif" font-size="58" font-weight="700" fill="#fff8f0">Zuri Elegance</text>
  <text x="450" y="570" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" letter-spacing="4" fill="#f3d8aa">PRODUCT IMAGE</text>
</svg>"""


@app.route("/static/uploads/<path:filename>")
def uploaded_product_image(filename):
    file_path = os.path.join(UPLOAD_FOLDER, filename)

    if os.path.isfile(file_path):
        return send_from_directory(UPLOAD_FOLDER, filename)

    return Response(
        MISSING_PRODUCT_IMAGE_SVG,
        mimetype="image/svg+xml",
        headers={"Cache-Control": "no-store"},
    )

def is_allowed_image(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS

def save_product_image(file):
    if not file or file.filename == "":
        return ""

    filename = secure_filename(file.filename)

    if not is_allowed_image(filename):
        raise ValueError("Product images must be PNG, JPG, JPEG or WEBP files")

    file.stream.seek(0, os.SEEK_END)
    size = file.stream.tell()
    file.stream.seek(0)

    if size > MAX_PRODUCT_IMAGE_BYTES:
        raise ValueError("Each product image must be 8MB or smaller")

    unique_name = f"{uuid.uuid4().hex}_{filename}"
    file_path = os.path.join(UPLOAD_FOLDER, unique_name)
    file.save(file_path)

    return f"{BACKEND_URL}/static/uploads/{unique_name}"


def normalize_uploaded_media_url(value):
    if not isinstance(value, str) or "/static/uploads/" not in value:
        return value

    parsed = urlparse(value)
    upload_path = parsed.path if parsed.scheme and parsed.netloc else value

    if "/static/uploads/" not in upload_path:
        return value

    upload_path = upload_path[upload_path.index("/static/uploads/"):]
    return f"{BACKEND_URL.rstrip('/')}{upload_path}"


def normalize_response_media_urls(value):
    if isinstance(value, dict):
        return {
            key: normalize_response_media_urls(item)
            for key, item in value.items()
        }

    if isinstance(value, list):
        return [normalize_response_media_urls(item) for item in value]

    return normalize_uploaded_media_url(value)


@app.after_request
def rewrite_uploaded_media_urls(response):
    if not response.is_json:
        return response

    try:
        payload = response.get_json(silent=True)
        if payload is None:
            return response

        response.set_data(json.dumps(normalize_response_media_urls(payload)))
        response.headers["Content-Type"] = "application/json"
    except Exception as e:
        print("MEDIA URL NORMALIZE ERROR:", e)

    return response
    

PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY")

PAYSTACK_CALLBACK_URL = normalize_public_url(
    os.getenv("PAYSTACK_CALLBACK_URL"),
    f"{FRONTEND_URL}/payment-success",
)

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT") or "587")
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL") or SMTP_USERNAME
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Zuri Elegance")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "false").lower() == "true"
SMTP_TIMEOUT_SECONDS = int(os.getenv("SMTP_TIMEOUT_SECONDS") or "10")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

USE_REAL_AI = (
    os.getenv("USE_REAL_AI", "false")
    .lower() == "true"
)

def parse_positive_int_env(name, default):
    try:
        return max(0, int(os.getenv(name, str(default))))
    except (TypeError, ValueError):
        return default


AI_ASSISTANT_DAILY_LIMIT = parse_positive_int_env("AI_ASSISTANT_DAILY_LIMIT", 30)
AI_ASSISTANT_MONTHLY_LIMIT = parse_positive_int_env("AI_ASSISTANT_MONTHLY_LIMIT", 300)
AI_BEAUTY_DAILY_LIMIT = parse_positive_int_env("AI_BEAUTY_DAILY_LIMIT", 5)
AI_BEAUTY_MONTHLY_LIMIT = parse_positive_int_env("AI_BEAUTY_MONTHLY_LIMIT", 30)

openai_client = (
    OpenAI(api_key=OPENAI_API_KEY)
    if OPENAI_API_KEY
    else None
)


print("OPENAI ENABLED:", USE_REAL_AI)
print("OPENAI KEY FOUND:", "YES" if OPENAI_API_KEY else "NO")
print("ACTUAL DB URI:", app.config.get("SQLALCHEMY_DATABASE_URI"))
print("PAYSTACK SECRET LOADED:", "YES" if PAYSTACK_SECRET_KEY else "NO")
print("FRONTEND URL:", FRONTEND_URL)
print("PAYSTACK CALLBACK URL:", PAYSTACK_CALLBACK_URL)
print("APP ENV:", APP_ENV)
print(
    "SMTP CONFIG:",
    {
        "host": SMTP_HOST,
        "port": SMTP_PORT,
        "username_loaded": "YES" if SMTP_USERNAME else "NO",
        "password_loaded": "YES" if SMTP_PASSWORD else "NO",
        "from": SMTP_FROM_EMAIL,
        "ssl": SMTP_USE_SSL,
        "tls": SMTP_USE_TLS,
    },
)


@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "ok",
        "environment": APP_ENV,
        "timestamp": datetime.utcnow().isoformat(),
    }), 200


class User(db.Model):
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)

    # Auth
    email = db.Column(db.String(200), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

    # Profile Info
    full_name = db.Column(db.String(200), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    city = db.Column(db.String(100), nullable=True)

    # Optional future fields
    address = db.Column(db.String(255), nullable=True)
    is_verified = db.Column(db.Boolean, default=False)
    is_admin = db.Column(db.Boolean, default=False)

    # Meta
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    orders = db.relationship("Order", backref="user", lazy=True)
    cart_items = db.relationship("CartItem", backref="user", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "phone": self.phone,
            "city": self.city,
            "address": self.address,
            "is_verified": self.is_verified,
            "is_admin": self.is_admin,
        }


class EmailVerificationCode(db.Model):
    __tablename__ = "email_verification_code"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    email = db.Column(db.String(200), nullable=False, index=True)
    code_hash = db.Column(db.String(64), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    attempts = db.Column(db.Integer, default=0)
    consumed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="email_verification_codes")


class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=False, default=0)
    category = db.Column(db.String(100), nullable=True)
    subcategory = db.Column(db.String(100), nullable=True)
    brand = db.Column(db.String(120), nullable=True)
    stock = db.Column(db.Integer, nullable=False, default=0)

    promotion_text = db.Column(db.String(200), nullable=True)
    discount_percent = db.Column(db.Float, nullable=True)

    length = db.Column(db.String(50), nullable=True)
    density = db.Column(db.String(50), nullable=True)
    lace_type = db.Column(db.String(80), nullable=True)
    

    image_url = db.Column(db.String(500), nullable=True)
    image_url_2 = db.Column(db.String(500), nullable=True)
    image_url_3 = db.Column(db.String(500), nullable=True)
    image_url_4 = db.Column(db.String(500), nullable=True)
    
    order_items = db.relationship(
    "OrderItem",
    backref="product",
    lazy=True
)

def ensure_product_brand_column():
    ensure_column("product", "brand", "VARCHAR(120)")


def ensure_column(table, column, definition):
    try:
        db.session.execute(db.text(f"ALTER TABLE {table} ADD COLUMN {column} {definition}"))
        db.session.commit()
        print(f"{table}.{column} column added")
    except Exception as e:
        db.session.rollback()
        message = str(e).lower()
        if "duplicate" not in message and "already exists" not in message:
            print(f"{table}.{column} column check:", e)


def parse_optional_date(value):
    value = (value or "").strip()
    if not value:
        return None

    return datetime.strptime(value, "%Y-%m-%d")


with app.app_context():
    ensure_product_brand_column()
    ensure_column("coupons", "expiry_date", "DATETIME")
    ensure_column("coupons", "usage_limit", "INTEGER")
    ensure_column("reviews", "is_approved", "BOOLEAN DEFAULT 0")


class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    total = db.Column(
        db.Float,
        nullable=False,
        default=0
    )

    status = db.Column(
        db.String(50),
        nullable=False,
        default="Pending Payment"
    )

    reference = db.Column(
        db.String(120),
        unique=True,
        nullable=True
    )

    tracking_number = db.Column(
        db.String(120),
        nullable=True
    )

    delivery_status = db.Column(
        db.String(50),
        nullable=False,
        default="Processing"
    )

    delivery_address = db.Column(
        db.String(255),
        nullable=True
    )

    # COUPON FIELDS BELONG HERE
    coupon_code = db.Column(
        db.String(50),
        nullable=True
    )

    discount_amount = db.Column(
        db.Float,
        default=0
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    items = db.relationship(
        "OrderItem",
        backref="order",
        lazy=True,
        cascade="all, delete-orphan"
    )


class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    order_id = db.Column(
        db.Integer,
        db.ForeignKey("order.id"),
        nullable=False
    )

    product_id = db.Column(
        db.Integer,
        db.ForeignKey("product.id"),
        nullable=True
    )

    name = db.Column(
        db.String(200),
        nullable=False
    )

    price = db.Column(
        db.Float,
        nullable=False,
        default=0
    )

    quantity = db.Column(
        db.Integer,
        nullable=False,
        default=1
    )


class CartItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)

    product = db.relationship("Product")

class Coupon(db.Model):
    __tablename__ = "coupons"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    discount_type = db.Column(db.String(20), default="percent")  # percent or fixed
    discount_value = db.Column(db.Float, nullable=False, default=0)
    is_active = db.Column(db.Boolean, default=True)
    expiry_date = db.Column(db.DateTime, nullable=True)
    usage_limit = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "discount_type": self.discount_type,
            "discount_value": self.discount_value,
            "is_active": self.is_active,
            "expiry_date": self.expiry_date.date().isoformat() if self.expiry_date else "",
            "usage_limit": self.usage_limit,
        }


class RewardSettings(db.Model):
    __tablename__ = "reward_settings"

    id = db.Column(db.Integer, primary_key=True)
    is_enabled = db.Column(db.Boolean, default=True)
    points_per_rand = db.Column(db.Float, nullable=False, default=0.1)
    points_per_order = db.Column(db.Integer, nullable=False, default=0)
    reward_threshold = db.Column(db.Integer, nullable=False, default=100)
    voucher_value = db.Column(db.Float, nullable=False, default=10)
    min_order_total = db.Column(db.Float, nullable=False, default=0)
    eligible_statuses = db.Column(db.String(200), nullable=False, default="Paid,Delivered")
    glow_tier_points = db.Column(db.Integer, nullable=False, default=100)
    gold_tier_points = db.Column(db.Integer, nullable=False, default=250)
    diamond_tier_points = db.Column(db.Integer, nullable=False, default=500)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "is_enabled": self.is_enabled,
            "points_per_rand": self.points_per_rand,
            "points_per_order": self.points_per_order,
            "reward_threshold": self.reward_threshold,
            "voucher_value": self.voucher_value,
            "min_order_total": self.min_order_total,
            "eligible_statuses": parse_statuses(self.eligible_statuses),
            "glow_tier_points": self.glow_tier_points,
            "gold_tier_points": self.gold_tier_points,
            "diamond_tier_points": self.diamond_tier_points,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class RewardAdjustment(db.Model):
    __tablename__ = "reward_adjustments"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    points = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.String(255), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", foreign_keys=[user_id], backref="reward_adjustments")
    admin = db.relationship("User", foreign_keys=[created_by])

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "points": self.points,
            "reason": self.reason,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    product_id = db.Column(
        db.Integer,
        db.ForeignKey("product.id"),
        nullable=False
    )

    rating = db.Column(db.Integer, nullable=False, default=5)

    comment = db.Column(db.Text, nullable=True)
    is_approved = db.Column(db.Boolean, default=False)

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    user = db.relationship("User")
    product = db.relationship("Product")


class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)

    type = db.Column(db.String(50), default="general")
    is_read = db.Column(db.Boolean, default=False)

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    user = db.relationship("User", backref="notifications")


class BeautyAnalysis(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    skin_type = db.Column(db.String(100), nullable=True)
    hair_focus = db.Column(db.String(150), nullable=True)
    face_shape = db.Column(db.String(100), nullable=True)
    beauty_goal = db.Column(db.String(255), nullable=True)

    summary = db.Column(db.Text, nullable=True)
    recommended_categories = db.Column(db.Text, nullable=True)
    product_keywords = db.Column(db.Text, nullable=True)
    tips = db.Column(db.Text, nullable=True)

    mode = db.Column(db.String(50), default="mock")

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    user = db.relationship("User", backref="beauty_analyses")


class AIUsage(db.Model):
    __tablename__ = "ai_usage"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=True, index=True)
    ip_hash = db.Column(db.String(64), nullable=True, index=True)
    feature = db.Column(db.String(50), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)


class Wishlist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    product = db.relationship("Product")


with app.app_context():
    db.create_all()


# SERIALIZERS
# -----------------------------
def serialize_product(product):

    reviews = Review.query.filter_by(
        product_id=product.id
    ).all()

    review_count = len(reviews)

    average_rating = 0

    if review_count > 0:
        average_rating = (
            sum(r.rating for r in reviews)
            / review_count
        )

    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "category": product.category,
        "brand": getattr(
            product,
            "brand",
            None
        ),

        "subcategory": getattr(
            product,
            "subcategory",
            None
        ),

        "stock": product.stock,
        "length": product.length,
        "density": product.density,
        "lace_type": product.lace_type,

        "image_url": getattr(
            product,
            "image_url",
            None
        ),

        "image_url_2": getattr(
            product,
            "image_url_2",
            None
        ),

        "image_url_3": getattr(
            product,
            "image_url_3",
            None
        ),

        "image_url_4": getattr(
            product,
            "image_url_4",
            None
        ),

        "promotion_text": getattr(
            product,
            "promotion_text",
            None
        ),

        "discount_percent": getattr(
            product,
            "discount_percent",
            None
        ),

        "promotion_text": getattr(
    product,
    "promotion_text",
    None
     ),

"discount_percent": getattr(
    product,
    "discount_percent",
    None
),

"review_count": review_count,
"average_rating": round(average_rating, 1),

        "review_count": review_count,

        "average_rating": round(
            average_rating,
            1
        ),
    }

def serialize_order(order):
    return {
        "id": order.id,
        "user_id": order.user_id,
        "total": float(order.total or 0),
        "status": order.status,
        "reference": getattr(order, "reference", None),
        "tracking_number": getattr(order, "tracking_number", None),
        "delivery_status": getattr(order, "delivery_status", None),
        "delivery_address": getattr(order, "delivery_address", None),
        "created_at": order.created_at.isoformat()
        if getattr(order, "created_at", None)
        else None,

        "items": [
            {
                "product_id": item.product_id,
                "name": item.name,
                "price": float(item.price or 0),
                "quantity": item.quantity,
                "image_url": (
                    item.product.image_url
                    if getattr(item, "product", None)
                    else ""
                ),
            }
            for item in order.items
        ],
    }


DEFAULT_REWARD_SETTINGS = {
    "is_enabled": True,
    "points_per_rand": 0.1,
    "points_per_order": 0,
    "reward_threshold": 100,
    "voucher_value": 10,
    "min_order_total": 0,
    "eligible_statuses": "Paid,Delivered",
    "glow_tier_points": 100,
    "gold_tier_points": 250,
    "diamond_tier_points": 500,
}


def parse_statuses(value):
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]

    return [
        status.strip()
        for status in str(value or "").split(",")
        if status.strip()
    ]


def get_reward_settings():
    settings = RewardSettings.query.get(1)

    if not settings:
        settings = RewardSettings(id=1, **DEFAULT_REWARD_SETTINGS)
        db.session.add(settings)
        db.session.commit()

    return settings


def reward_tier(points, settings):
    if points >= int(settings.diamond_tier_points or 0):
        return "Diamond"

    if points >= int(settings.gold_tier_points or 0):
        return "Gold"

    if points >= int(settings.glow_tier_points or 0):
        return "Glow"

    return "Starter"


def calculate_order_reward_points(order, settings):
    if not settings.is_enabled:
        return 0

    total = float(order.total or 0)

    if total < float(settings.min_order_total or 0):
        return 0

    return int(
        total * float(settings.points_per_rand or 0)
        + int(settings.points_per_order or 0)
    )


def build_user_rewards(user_id):
    settings = get_reward_settings()
    eligible_statuses = parse_statuses(settings.eligible_statuses)

    eligible_orders = (
        Order.query
        .filter(
            Order.user_id == user_id,
            Order.status.in_(eligible_statuses)
        )
        .order_by(Order.created_at.desc())
        .all()
    )

    lifetime_spend = sum(float(order.total or 0) for order in eligible_orders)
    earned_points = sum(
        calculate_order_reward_points(order, settings)
        for order in eligible_orders
    )
    adjustments = (
        db.session.query(db.func.coalesce(db.func.sum(RewardAdjustment.points), 0))
        .filter(RewardAdjustment.user_id == user_id)
        .scalar()
    )
    adjustment_points = int(adjustments or 0)
    points_balance = max(0, earned_points + adjustment_points)
    threshold = max(1, int(settings.reward_threshold or 1))
    voucher_count = points_balance // threshold
    voucher_value = voucher_count * float(settings.voucher_value or 0)
    remainder = points_balance % threshold
    points_to_next_reward = 0 if points_balance and remainder == 0 else threshold - remainder

    if points_balance == 0:
        points_to_next_reward = threshold

    recent_adjustments = (
        RewardAdjustment.query
        .filter_by(user_id=user_id)
        .order_by(RewardAdjustment.created_at.desc())
        .limit(6)
        .all()
    )

    return {
        "is_enabled": settings.is_enabled,
        "points_balance": points_balance,
        "earned_points": earned_points,
        "adjustment_points": adjustment_points,
        "lifetime_spend": round(lifetime_spend, 2),
        "eligible_orders": len(eligible_orders),
        "tier": reward_tier(points_balance, settings),
        "points_per_rand": settings.points_per_rand,
        "points_per_order": settings.points_per_order,
        "points_to_next_reward": points_to_next_reward,
        "reward_threshold": threshold,
        "voucher_count": voucher_count,
        "voucher_value": voucher_value,
        "voucher_value_each": settings.voucher_value,
        "min_order_total": settings.min_order_total,
        "eligible_statuses": eligible_statuses,
        "history": [
            {
                "order_id": order.id,
                "reference": order.reference,
                "total": float(order.total or 0),
                "points": calculate_order_reward_points(order, settings),
                "status": order.status,
                "created_at": (
                    order.created_at.isoformat()
                    if order.created_at
                    else None
                ),
            }
            for order in eligible_orders[:6]
        ],
        "adjustments": [adjustment.to_dict() for adjustment in recent_adjustments],
    }


def create_notification(user_id, title, message, notification_type="general"):
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type,
        is_read=False
    )

    db.session.add(notification)
    return notification



def create_token(user):
    payload = {
        "user_id": user.id,
        "email": user.email,
        "is_admin": getattr(user, "is_admin", False),
        "exp": datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def create_email_verification_code():
    return f"{random.SystemRandom().randint(0, 999999):06d}"


def hash_email_verification_code(email, code):
    normalized_email = (email or "").strip().lower()
    normalized_code = (code or "").strip()
    return hashlib.sha256(
        f"{SECRET_KEY}:{normalized_email}:{normalized_code}".encode("utf-8")
    ).hexdigest()


def create_email_verification_record(user):
    EmailVerificationCode.query.filter_by(
        user_id=user.id,
        consumed_at=None,
    ).update({"consumed_at": datetime.utcnow()})

    code = create_email_verification_code()
    record = EmailVerificationCode(
        user_id=user.id,
        email=user.email,
        code_hash=hash_email_verification_code(user.email, code),
        expires_at=datetime.utcnow() + timedelta(minutes=15),
    )
    db.session.add(record)
    return code


def send_smtp_email(to_email, subject, text_content, html_content, attachments=None, log_label="EMAIL"):
    if not SMTP_HOST or not SMTP_USERNAME or not SMTP_PASSWORD or not SMTP_FROM_EMAIL:
        print(f"{log_label} SKIPPED: SMTP not configured")
        return False

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
    message["To"] = to_email
    message.set_content(text_content)
    message.add_alternative(html_content, subtype="html")

    for attachment in attachments or []:
        message.add_attachment(
            attachment["content"],
            maintype=attachment.get("maintype", "application"),
            subtype=attachment.get("subtype", "octet-stream"),
            filename=attachment["filename"],
        )

    try:
        if SMTP_USE_SSL:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=SMTP_TIMEOUT_SECONDS) as server:
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(message)
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=SMTP_TIMEOUT_SECONDS) as server:
                if SMTP_USE_TLS:
                    server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(message)
    except Exception as e:
        print(f"{log_label} SMTP ERROR:", repr(e))
        return False

    print(
        f"{log_label} SMTP SENT:",
        {
            "to": to_email,
            "from": SMTP_FROM_EMAIL,
            "host": SMTP_HOST,
            "port": SMTP_PORT,
        },
    )

    return True


def send_verification_email(user, code):
    customer_name = html.escape(user.full_name or "there")
    safe_code = html.escape(code)
    text_content = (
        f"Hi {user.full_name or 'there'},\n\n"
        "Welcome to Zuri Elegance. Use this verification code to activate your account:\n\n"
        f"{code}\n\n"
        "This code expires in 15 minutes. If you did not create this account, you can ignore this email.\n\n"
        "With elegance,\n"
        "Zuri Elegance"
    )
    html_content = f"""
    <div style="font-family:Arial,sans-serif;color:#2b2023;padding:24px;background:#fbf7f1;">
      <div style="max-width:560px;margin:auto;background:#fff;border:1px solid #eadfd6;border-radius:22px;padding:28px;">
        <h1 style="margin:0;color:#50242A;font-family:Georgia,serif;">Zuri Elegance</h1>
        <p style="color:#A38560;font-weight:800;letter-spacing:1px;">EMAIL VERIFICATION</p>
        <p>Hi {customer_name},</p>
        <p>Welcome to Zuri Elegance. Use this verification code to activate your account:</p>
        <div style="margin:24px 0;padding:18px 22px;border-radius:16px;background:#50242A;color:#C4A26A;font-size:32px;font-weight:900;letter-spacing:8px;text-align:center;">
          {safe_code}
        </div>
        <p>This code expires in 15 minutes. If you did not create this account, you can ignore this email.</p>
        <p style="color:#A38560;font-weight:800;">With elegance,<br/>Zuri Elegance</p>
      </div>
    </div>
    """

    return send_smtp_email(
        user.email,
        "Your Zuri Elegance verification code",
        text_content,
        html_content,
        log_label="VERIFICATION",
    )


def get_client_ip():
    forwarded_for = request.headers.get("X-Forwarded-For", "")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    return request.remote_addr or "unknown"


def hash_usage_ip(ip_address):
    return hashlib.sha256(f"{SECRET_KEY}:{ip_address}".encode("utf-8")).hexdigest()


def normalize_usage_user_id(value):
    try:
        user_id = int(value)
        return user_id if user_id > 0 else None
    except (TypeError, ValueError):
        return None


def get_ai_usage_limits(feature):
    if feature == "assistant":
        return AI_ASSISTANT_DAILY_LIMIT, AI_ASSISTANT_MONTHLY_LIMIT

    return AI_BEAUTY_DAILY_LIMIT, AI_BEAUTY_MONTHLY_LIMIT


def check_ai_usage_limit(feature, user_id=None):
    normalized_user_id = normalize_usage_user_id(user_id)
    ip_hash = hash_usage_ip(get_client_ip())
    daily_limit, monthly_limit = get_ai_usage_limits(feature)
    now = datetime.utcnow()
    day_start = now - timedelta(days=1)
    month_start = now - timedelta(days=30)

    query = AIUsage.query.filter_by(feature=feature)
    if normalized_user_id:
        query = query.filter(db.or_(
            AIUsage.user_id == normalized_user_id,
            AIUsage.ip_hash == ip_hash,
        ))
    else:
        query = query.filter(AIUsage.ip_hash == ip_hash)

    daily_count = query.filter(AIUsage.created_at >= day_start).count()
    monthly_count = query.filter(AIUsage.created_at >= month_start).count()

    if daily_limit > 0 and daily_count >= daily_limit:
        return {
            "allowed": False,
            "error": "Daily AI usage limit reached. Please try again tomorrow.",
            "limit_type": "daily",
            "limit": daily_limit,
            "used": daily_count,
        }

    if monthly_limit > 0 and monthly_count >= monthly_limit:
        return {
            "allowed": False,
            "error": "Monthly AI usage limit reached. Please try again later.",
            "limit_type": "monthly",
            "limit": monthly_limit,
            "used": monthly_count,
        }

    return {
        "allowed": True,
        "user_id": normalized_user_id,
        "ip_hash": ip_hash,
        "daily_limit": daily_limit,
        "monthly_limit": monthly_limit,
        "daily_used": daily_count,
        "monthly_used": monthly_count,
    }


def record_ai_usage(feature, usage_check):
    db.session.add(AIUsage(
        user_id=usage_check.get("user_id"),
        ip_hash=usage_check.get("ip_hash"),
        feature=feature,
    ))


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({"error": "Token missing"}), 401

        try:
            token = auth_header.split(" ")[1]
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        except Exception:
            return jsonify({"error": "Invalid or expired token"}), 401

        return f(data, *args, **kwargs)

    return decorated


def admin_required(f):
    @wraps(f)
    def decorated(user_data, *args, **kwargs):
        if not user_data.get("is_admin"):
            return jsonify({"error": "Admin only"}), 403
        return f(user_data, *args, **kwargs)

    return decorated


# -----------------------------
# ADMIN BLOCK
# -----------------------------

VAT_RATE = 0.15


def serialize_user_admin(user):
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "city": user.city,
        "address": user.address,
        "is_verified": user.is_verified,
        "is_admin": user.is_admin,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


def serialize_order_admin(order):
    return {
        "id": order.id,
        "user_id": order.user_id,
        "customer_name": order.user.full_name if order.user else "",
        "customer_email": order.user.email if order.user else "",
        "customer_phone": order.user.phone if order.user else "",
        "total": float(order.total or 0),
        "status": order.status,
        "reference": order.reference,
        "tracking_number": order.tracking_number,
        "delivery_status": order.delivery_status,
        "delivery_address": order.delivery_address,
        "coupon_code": order.coupon_code,
        "discount_amount": float(order.discount_amount or 0),
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "name": item.name,
                "price": float(item.price or 0),
                "quantity": item.quantity,
                "image_url": item.product.image_url if item.product else None,
            }
            for item in order.items
        ],
    }


def serialize_review_admin(review):
    return {
        "id": review.id,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at.isoformat() if review.created_at else None,
        "user_id": review.user_id,
        "customer_name": review.user.full_name if review.user else "",
        "customer_email": review.user.email if review.user else "",
        "product_id": review.product_id,
        "product_name": review.product.name if review.product else "",
        "product_image": review.product.image_url if review.product else "",
        "is_approved": bool(getattr(review, "is_approved", False)),
    }


def serialize_notification_admin(notification):
    return {
        "id": notification.id,
        "user_id": notification.user_id,
        "title": notification.title,
        "message": notification.message,
        "type": notification.type,
        "is_read": notification.is_read,
        "created_at": notification.created_at.isoformat() if notification.created_at else None,
        "customer_name": notification.user.full_name if notification.user else "",
        "customer_email": notification.user.email if notification.user else "",
    }


def build_admin_dashboard_summary():
    paid_orders = Order.query.filter(Order.status.in_(["Paid", "Delivered"])).all()
    total_revenue = sum(float(order.total or 0) for order in paid_orders)
    delivered_orders = Order.query.filter(
        db.or_(Order.delivery_status == "Delivered", Order.status == "Delivered")
    ).count()

    return {
        "total_revenue": total_revenue,
        "total_orders": Order.query.count(),
        "pending_orders": Order.query.filter(
            Order.status.in_(["Pending", "Pending Payment"])
        ).count(),
        "paid_orders": Order.query.filter_by(status="Paid").count(),
        "delivered_orders": delivered_orders,
        "total_products": Product.query.count(),
        "total_brands": db.session.query(db.func.count(db.distinct(Product.brand))).filter(
            Product.brand.isnot(None),
            Product.brand != ""
        ).scalar() or 0,
        "low_stock_products": Product.query.filter(Product.stock <= 5).count(),
        "total_customers": User.query.filter_by(is_admin=False).count(),
        "total_ai_analyses": BeautyAnalysis.query.count(),
    }

def get_coupon_usage(coupon_code):
    if not coupon_code:
        return 0

    return Order.query.filter(
        Order.coupon_code == coupon_code,
        Order.status.in_(["Paid", "Delivered"])
    ).count()


def validate_coupon_for_subtotal(code, subtotal):
    coupon = Coupon.query.filter_by(code=code).first()

    if not coupon:
        return None, "Invalid coupon code", 0

    if not coupon.is_active:
        return None, "Coupon is inactive", 0

    if coupon.expiry_date and coupon.expiry_date.date() < datetime.utcnow().date():
        return None, "Coupon has expired", 0

    if coupon.usage_limit and get_coupon_usage(coupon.code) >= int(coupon.usage_limit):
        return None, "Coupon usage limit reached", 0

    if coupon.discount_type == "percent":
        discount_amount = subtotal * (float(coupon.discount_value) / 100)
    else:
        discount_amount = float(coupon.discount_value)

    return coupon, None, min(discount_amount, subtotal)

def collect_user_interests(user_id):
    interests = []

    wishlist_items = Wishlist.query.filter_by(user_id=user_id).all()
    cart_items = CartItem.query.filter_by(user_id=user_id).all()

    for item in wishlist_items:
        if item.product:
            interests.append((item.product.name or "").lower())
            interests.append((item.product.category or "").lower())
            interests.append((item.product.description or "").lower())

    for item in cart_items:
        if item.product:
            interests.append((item.product.name or "").lower())
            interests.append((item.product.category or "").lower())
            interests.append((item.product.description or "").lower())

    return " ".join(interests)


def recommendation_score(product, interests):
    text = f"""
    {product.name or ""}
    {product.category or ""}
    {getattr(product, "subcategory", "") or ""}
    {product.description or ""}
    """.lower()

    score = 0

    if "wig" in interests and any(word in text for word in ["closure", "frontal", "bonnet", "hair care"]):
        score += 4

    if "closure" in interests and any(word in text for word in ["wig", "lace", "bundle"]):
        score += 4

    if "bundle" in interests and any(word in text for word in ["closure", "frontal", "hair care"]):
        score += 4

    if "beauty" in interests and any(word in text for word in ["skincare", "makeup", "hair care"]):
        score += 3

    if float(getattr(product, "price", 0) or 0) >= 2500:
        score += 1

    return score


def generate_mock_beauty_analysis():
    return {
        "mode": "mock",
        "skin_type": "Combination",
        "hair_focus": "Protective styling",
        "face_shape": "Oval",
        "beauty_goal": "Healthy glow and premium hair finish",

        "summary":
            "Your beauty profile suits soft-glam looks, hydrated skin products, and polished wig or closure styles.",

        "recommended_categories": [
            "Wigs",
            "Closures",
            "Hair Care",
            "Skincare"
        ],

        "product_keywords": [
            "wig",
            "closure",
            "hair care",
            "hydrating",
            "glow"
        ],

        "tips": [
            "Choose lightweight hydrating skincare before makeup.",
            "Use hair care products that protect shine and softness.",
            "Closures and wigs will suit a polished low-maintenance look."
        ]
    }


def get_beauty_recommendations(analysis):

    if not isinstance(analysis, dict):
        return []

    keywords = []

    product_keywords = analysis.get(
        "product_keywords",
        []
    )

    recommended_categories = analysis.get(
        "recommended_categories",
        []
    )

    if isinstance(product_keywords, list):
        keywords.extend(product_keywords)

    if isinstance(recommended_categories, list):
        keywords.extend(recommended_categories)

    hair_focus = str(
        analysis.get("hair_focus", "")
    ).lower()

    skin_type = str(
        analysis.get("skin_type", "")
    ).lower()

    face_shape = str(
        analysis.get("face_shape", "")
    ).lower()

    beauty_goal = str(
        analysis.get("beauty_goal", "")
    ).lower()

    if "braid" in hair_focus:
        keywords.extend([
            "hair oil",
            "hair care",
            "protective",
            "braid spray"
        ])

    if "wig" in hair_focus:
        keywords.extend([
            "wig",
            "closure",
            "frontal"
            "wig",
            "closure",
            "bundle",
            "frontal",
            "hair"

        ])

    if "glow" in beauty_goal:
        keywords.extend([
            "skincare",
            "hydrating",
            "glow"
        ])

    if "round" in face_shape:
        keywords.extend([
            "layered wig",
            "closure"
        ])

    query = Product.query

    products = query.all()

    scored_products = []

    for product in products:

        score = 0

        searchable = " ".join([
            str(product.name or ""),
            str(product.description or ""),
            str(product.category or ""),
            str(product.subcategory or "")
        ]).lower()

        for keyword in keywords:

            if str(keyword).lower() in searchable:
                score += 1

        if score > 0:
            scored_products.append(
                (score, product)
            )

    scored_products.sort(
        key=lambda x: x[0],
        reverse=True
    )

    recommended = [
        serialize_product(item[1])
        for item in scored_products[:6]
    ]

    return recommended


def score_product_for_beauty_profile(product, analysis):
    text = " ".join([
        str(product.name or ""),
        str(product.category or ""),
        str(getattr(product, "subcategory", "") or ""),
        str(product.description or "")
    ]).lower()

    keywords = []

    keywords.extend(analysis.get("product_keywords", []) or [])
    keywords.extend(analysis.get("recommended_categories", []) or [])

    hair_focus = str(analysis.get("hair_focus", "") or "").lower()
    skin_type = str(analysis.get("skin_type", "") or "").lower()
    face_shape = str(analysis.get("face_shape", "") or "").lower()
    beauty_goal = str(analysis.get("beauty_goal", "") or "").lower()

    score = 60

    for keyword in keywords:
        if str(keyword).lower() in text:
            score += 8

    if "wig" in text and ("hair" in hair_focus or "style" in beauty_goal):
        score += 10

    if "closure" in text and ("polished" in beauty_goal or "finish" in beauty_goal):
        score += 10

    if "skincare" in text and ("glow" in beauty_goal or "skin" in skin_type):
        score += 12

    if "hair care" in text and ("protective" in hair_focus or "braid" in hair_focus):
        score += 12

    if "round" in face_shape and ("layer" in text or "closure" in text):
        score += 6

    return max(65, min(score, 99))


def build_ai_match_reason(product, analysis):
    text = " ".join([
        str(product.name or ""),
        str(product.category or ""),
        str(product.description or "")
    ]).lower()

    hair_focus = str(analysis.get("hair_focus", "") or "").lower()
    beauty_goal = str(analysis.get("beauty_goal", "") or "").lower()
    skin_type = str(analysis.get("skin_type", "") or "").lower()

    if "wig" in text:
        return "Recommended because your beauty profile favors polished, premium hair styling."

    if "closure" in text:
        return "Matched for a smooth, natural-looking finish that supports your styling goals."

    if "skincare" in text or "glow" in text:
        return "Selected to support your glow-focused beauty profile and skin care goals."

    if "hair care" in text or "oil" in text:
        return "Chosen to support hair health, shine and protective styling maintenance."

    return "Selected from your latest AI beauty profile and product preferences."


def analyze_beauty_with_openai(image_file):
    try:
        if not openai_client:
            return generate_mock_beauty_analysis()

        image_bytes = image_file.read()
        image_file.seek(0)

        import base64

        encoded_image = base64.b64encode(image_bytes).decode("utf-8")

        response = openai_client.responses.create(
            model="gpt-4.1-mini",
            input=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": """
Analyze this beauty image.

Return ONLY valid JSON.

Required format:
{
  "skin_type": "",
  "hair_focus": "",
  "face_shape": "",
  "beauty_goal": "",
  "summary": "",

  "glow_score": 0,
  "hair_health_score": 0,
  "style_match_score": 0,

  "recommended_categories": [],
  "product_keywords": [],
  "tips": []
}

Glow score, hair health score and style match score
must be realistic percentages between 70 and 100.

Keep the analysis helpful, respectful, and focused on beauty styling and product recommendations.
Do not identify the person.
"""
                        },
                        {
                            "type": "input_image",
                            "image_url": f"data:image/jpeg;base64,{encoded_image}",
                        },
                    ],
                }
            ],
        )

        raw_output = response.output_text

        print("OPENAI RAW RESPONSE:", raw_output)

        parsed = json.loads(raw_output)
        parsed["mode"] = "openai"

        return parsed

    except Exception as e:
        print("OPENAI BEAUTY ERROR:", e)
        return generate_mock_beauty_analysis()


def generate_beauty_scores(analysis):
    skin_type = (
        analysis.get("skin_type", "")
        .lower()
    )

    hair_focus = (
        analysis.get("hair_focus", "")
        .lower()
    )

    beauty_goal = (
        analysis.get("beauty_goal", "")
        .lower()
    )

    glow_score = random.randint(78, 96)
    hair_score = random.randint(75, 95)
    style_score = random.randint(80, 98)

    if "dry" in skin_type:
        glow_score -= 4

    if "protective" in hair_focus:
        hair_score += 3

    if "glow" in beauty_goal:
        style_score += 2

    return {
        "glow_score": max(65, min(glow_score, 99)),
        "hair_health_score": max(65, min(hair_score, 99)),
        "style_match_score": max(65, min(style_score, 99)),
    }


def compact_product_for_assistant(product):
    return {
        "id": product.id,
        "name": product.name,
        "brand": getattr(product, "brand", "") or "",
        "category": product.category or "",
        "subcategory": getattr(product, "subcategory", "") or "",
        "price": float(product.price or 0),
        "stock": int(product.stock or 0),
        "length": getattr(product, "length", "") or "",
        "density": getattr(product, "density", "") or "",
        "lace_type": getattr(product, "lace_type", "") or "",
        "description": (product.description or "")[:220],
    }


def get_assistant_context(user_id=None):
    products = (
        Product.query
        .filter(Product.stock > 0)
        .order_by(Product.id.desc())
        .limit(12)
        .all()
    )

    latest_analysis = None

    if user_id:
        latest_analysis = (
            BeautyAnalysis.query
            .filter_by(user_id=user_id)
            .order_by(BeautyAnalysis.created_at.desc())
            .first()
        )

    profile = None

    if latest_analysis:
        profile = {
            "skin_type": latest_analysis.skin_type,
            "hair_focus": latest_analysis.hair_focus,
            "face_shape": latest_analysis.face_shape,
            "beauty_goal": latest_analysis.beauty_goal,
            "recommended_categories": json.loads(
                latest_analysis.recommended_categories or "[]"
            ),
            "product_keywords": json.loads(
                latest_analysis.product_keywords or "[]"
            ),
        }

    return {
        "products": [compact_product_for_assistant(product) for product in products],
        "beauty_profile": profile,
    }


def build_mock_assistant_reply(message, context):
    message_text = (message or "").lower()
    products = context.get("products", [])
    profile = context.get("beauty_profile") or {}

    matching_products = []

    for product in products:
        product_text = " ".join([
            product.get("name", ""),
            product.get("brand", ""),
            product.get("category", ""),
            product.get("subcategory", ""),
            product.get("description", ""),
        ]).lower()

        if any(word in product_text for word in message_text.split() if len(word) > 3):
            matching_products.append(product)

    if not matching_products:
        matching_products = products[:3]

    if any(word in message_text for word in ["order", "track", "delivery", "shipping"]):
        return (
            "I can help with shopping and delivery questions. For your exact order status, "
            "open Track Order or Orders from the menu. Delivery updates appear there once "
            "your order has been processed."
        )

    if any(word in message_text for word in ["routine", "skin", "glow", "hair", "wig"]):
        profile_note = ""

        if profile:
            profile_note = (
                f" Based on your latest profile, your focus is "
                f"{profile.get('beauty_goal') or 'beauty confidence'}."
            )

        picks = ", ".join(
            f"{product['name']} (R {product['price']:.2f})"
            for product in matching_products[:3]
        )

        return (
            f"For a polished Zuri routine, start with gentle prep, choose products that "
            f"support your hair or skin goal, and finish with one statement item."
            f"{profile_note} Good picks to compare: {picks}."
        )

    if matching_products:
        picks = "\n".join(
            f"- {product['name']} by {product['brand'] or 'Zuri'}: "
            f"R {product['price']:.2f}, {product['stock']} in stock"
            for product in matching_products[:4]
        )

        return f"Here are a few options worth looking at:\n{picks}"

    return (
        "I can help you choose products, compare hair and beauty options, plan a simple "
        "routine, or explain checkout and delivery steps. Tell me what look or product "
        "you are shopping for."
    )


def generate_assistant_reply(messages, context):
    latest_message = messages[-1].get("content", "") if messages else ""

    if not USE_REAL_AI or not openai_client:
        return build_mock_assistant_reply(latest_message, context), "mock"

    try:
        response = openai_client.responses.create(
            model="gpt-4.1-mini",
            input=[
                {
                    "role": "system",
                    "content": (
                        "You are Zuri, a warm luxury beauty shopping assistant for "
                        "Zuri Elegance. Help with product discovery, beauty routines, "
                        "wig and skincare choices, order/delivery guidance, and checkout "
                        "questions. Use only the provided product context for inventory "
                        "claims. Be concise, practical, and friendly. Do not identify "
                        "people or make medical claims."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        "Current store context as JSON:\n"
                        f"{json.dumps(context, default=str)}"
                    ),
                },
                *[
                    {
                        "role": item.get("role", "user"),
                        "content": str(item.get("content", ""))[:1200],
                    }
                    for item in messages[-8:]
                    if item.get("role") in ["user", "assistant"]
                ],
            ],
        )

        return response.output_text.strip(), "openai"

    except Exception as e:
        print("ASSISTANT CHAT ERROR:", e)
        return build_mock_assistant_reply(latest_message, context), "mock"


@app.route("/admin/settings", methods=["GET", "PUT"])
@token_required
@admin_required
def admin_settings(user_data):
    if isinstance(user_data, dict):
        admin_id = user_data.get("id") or user_data.get("user_id") or user_data.get("sub")
    else:
        admin_id = user_data.id

    if not admin_id:
        return jsonify({"error": "Admin ID missing from token"}), 401

    admin = User.query.get(admin_id)

    if not admin:
        return jsonify({"error": "Admin not found"}), 404

    if request.method == "GET":
        return jsonify({
            "id": admin.id,
            "full_name": admin.full_name or "",
            "email": admin.email or "",
            "phone": admin.phone or "",
            "city": admin.city or "",
            "address": admin.address or "",
        }), 200

    data = request.get_json() or {}

    admin.full_name = (data.get("full_name") or "").strip()
    admin.phone = (data.get("phone") or "").strip()
    admin.city = (data.get("city") or "").strip()
    admin.address = (data.get("address") or "").strip()

    new_email = (data.get("email") or "").strip().lower()
    if new_email and new_email != admin.email:
        existing = User.query.filter_by(email=new_email).first()
        if existing:
            return jsonify({"error": "Email already in use"}), 400
        admin.email = new_email

    new_password = data.get("new_password") or ""
    if new_password.strip():
        admin.password = generate_password_hash(new_password)

    db.session.commit()

    return jsonify({
        "message": "Admin settings updated successfully",
        "admin": admin.to_dict()
    }), 200


@app.route("/admin/dashboard", methods=["GET"])

@token_required

@admin_required

def admin_dashboard(user_data):

    try:

        users_count = User.query.count()

        products_count = Product.query.count()

        orders_count = Order.query.count()

        pending_orders = Order.query.filter_by(status="Pending").count()

        pending_deliveries = Order.query.filter(

            Order.delivery_status.in_([

                "Preparing",

                "Out for Delivery",

                "Shipped"

            ])

        ).count()

        low_stock = Product.query.filter(Product.stock <= 5).count()

        paid_orders = Order.query.filter_by(status="Paid").all()

        total_sales = sum(float(order.total or 0) for order in paid_orders)

        VAT_RATE = 0.15

        subtotal_ex_vat = total_sales / (1 + VAT_RATE) if total_sales else 0

        vat_amount = total_sales - subtotal_ex_vat

        recent_orders = (

            Order.query

            .order_by(Order.created_at.desc())

            .limit(6)

            .all()

        )

        sales_chart = []

        today = datetime.utcnow().date()

        for i in range(6, -1, -1):

            day = today - timedelta(days=i)

            day_orders = [

                order for order in paid_orders

                if order.created_at and order.created_at.date() == day

            ]

            revenue = sum(float(order.total or 0) for order in day_orders)

            sales_chart.append({

                "label": day.strftime("%a"),

                "revenue": revenue,

            })

        top_products_query = (

            db.session.query(

                OrderItem.name,

                db.func.sum(OrderItem.quantity).label("sold"),

                db.func.sum(

                    OrderItem.price * OrderItem.quantity

                ).label("revenue")

            )

            .join(Order, OrderItem.order_id == Order.id)

            .group_by(OrderItem.name)

            .order_by(

                db.func.sum(OrderItem.quantity).desc()

            )

            .limit(5)

            .all()

        )

        top_products = [

            {

                "name": row.name,

                "sold": int(row.sold or 0),

                "revenue": float(row.revenue or 0),

            }

            for row in top_products_query

        ]

        return jsonify({

            **build_admin_dashboard_summary(),

            "users_count": users_count,

            "products_count": products_count,

            "orders_count": orders_count,

            "pending_orders": pending_orders,

            "pending_deliveries": pending_deliveries,

            "low_stock": low_stock,

            "total_sales": total_sales,

            "subtotal_ex_vat": subtotal_ex_vat,

            "vat_rate": VAT_RATE,

            "vat_amount": vat_amount,

            "sales_chart": sales_chart,

            "top_products": top_products,

            "recent_orders": [

                serialize_order_admin(order)

                for order in recent_orders

            ],

        }), 200

    except Exception as e:

        print("ADMIN DASHBOARD ERROR:", e)

        return jsonify({

            "error": "Failed to load admin dashboard"

        }), 500


@app.route("/admin/dashboard-summary", methods=["GET"])
@token_required
@admin_required
def admin_dashboard_summary(user_data):
    try:
        summary = build_admin_dashboard_summary()
        summary.update({
            "recent_orders": [
                serialize_order_admin(order)
                for order in Order.query.order_by(Order.created_at.desc()).limit(6).all()
            ],
            "low_stock": [
                serialize_product(product)
                for product in Product.query.filter(Product.stock <= 5).order_by(Product.stock.asc()).limit(8).all()
            ],
        })
        return jsonify(summary), 200
    except Exception as e:
        print("ADMIN SUMMARY ERROR:", e)
        return jsonify({"error": "Failed to load admin summary"}), 500


@app.route("/admin/coupons", methods=["GET", "POST"])
@token_required
@admin_required
def admin_coupons(user_data):
    if request.method == "GET":
        coupons = Coupon.query.order_by(Coupon.created_at.desc()).all()
        rows = []

        for coupon in coupons:
            coupon_data = coupon.to_dict()
            coupon_orders = Order.query.filter_by(coupon_code=coupon.code).all()
            coupon_data.update({
                "usage_count": get_coupon_usage(coupon.code),
                "discount_total": sum(float(order.discount_amount or 0) for order in coupon_orders),
            })
            rows.append(coupon_data)

        return jsonify(rows), 200

    data = request.get_json() or {}

    code = (data.get("code") or "").strip().upper()
    discount_type = (data.get("discount_type") or "percent").strip()
    discount_value = float(data.get("discount_value") or 0)
    expiry_date = parse_optional_date(data.get("expiry_date"))
    usage_limit = int(data.get("usage_limit") or 0) or None

    if not code:
        return jsonify({"error": "Coupon code is required"}), 400

    if discount_type not in ["percent", "fixed"]:
        return jsonify({"error": "Discount type must be percent or fixed"}), 400

    if discount_value <= 0:
        return jsonify({"error": "Discount value must be greater than 0"}), 400

    existing = Coupon.query.filter_by(code=code).first()
    if existing:
        return jsonify({"error": "Coupon already exists"}), 400

    coupon = Coupon(
        code=code,
        discount_type=discount_type,
        discount_value=discount_value,
        is_active=bool(data.get("is_active", True)),
        expiry_date=expiry_date,
        usage_limit=usage_limit,
    )

    db.session.add(coupon)
    db.session.commit()

    return jsonify({
        "message": "Coupon created successfully",
        "coupon": coupon.to_dict()
    }), 201


@app.route("/coupons/validate", methods=["POST"])
def validate_coupon():
    try:
        data = request.get_json()

        code = data.get("code", "").strip().upper()
        subtotal = float(data.get("subtotal") or 0)

        if not code:
            return jsonify({
                "error": "Coupon code required"
            }), 400

        coupon, error, discount_amount = validate_coupon_for_subtotal(code, subtotal)

        if error:
            return jsonify({"error": error}), 400

        return jsonify({
            "success": True,
            "coupon": coupon.code,
            "discount_amount": round(discount_amount, 2)
        }), 200

    except Exception as e:
        print("COUPON VALIDATE ERROR:", e)

        return jsonify({
            "error": "Coupon validation failed"
        }), 500


@app.route("/admin/coupons/<int:coupon_id>/toggle", methods=["PATCH"])
@token_required
@admin_required
def toggle_coupon(user_data, coupon_id):
    coupon = Coupon.query.get(coupon_id)

    if not coupon:
        return jsonify({"error": "Coupon not found"}), 404

    coupon.is_active = not coupon.is_active
    db.session.commit()

    return jsonify({
        "message": "Coupon status updated",
        "coupon": coupon.to_dict()
    }), 200


@app.route("/admin/coupons/<int:coupon_id>", methods=["PATCH"])
@token_required
@admin_required
def admin_update_coupon(user_data, coupon_id):
    coupon = Coupon.query.get(coupon_id)

    if not coupon:
        return jsonify({"error": "Coupon not found"}), 404

    data = request.get_json() or {}

    if "code" in data:
        coupon.code = (data.get("code") or coupon.code).strip().upper()

    if "discount_type" in data:
        discount_type = (data.get("discount_type") or coupon.discount_type).strip()
        if discount_type not in ["percent", "fixed"]:
            return jsonify({"error": "Discount type must be percent or fixed"}), 400
        coupon.discount_type = discount_type

    if "discount_value" in data:
        coupon.discount_value = float(data.get("discount_value") or 0)

    if "expiry_date" in data:
        coupon.expiry_date = parse_optional_date(data.get("expiry_date"))

    if "usage_limit" in data:
        coupon.usage_limit = int(data.get("usage_limit") or 0) or None

    if "active" in data:
        coupon.is_active = bool(data.get("active"))

    if "is_active" in data:
        coupon.is_active = bool(data.get("is_active"))

    db.session.commit()

    return jsonify({
        "message": "Coupon updated",
        "coupon": coupon.to_dict()
    }), 200


@app.route("/admin/coupons/<int:coupon_id>", methods=["DELETE"])
@token_required
@admin_required
def delete_coupon(user_data, coupon_id):
    coupon = Coupon.query.get(coupon_id)

    if not coupon:
        return jsonify({"error": "Coupon not found"}), 404

    db.session.delete(coupon)
    db.session.commit()

    return jsonify({
        "message": "Coupon deleted successfully"
    }), 200


@app.route("/admin/rewards", methods=["GET", "PUT"])
@token_required
@admin_required
def admin_rewards(user_data):
    settings = get_reward_settings()

    if request.method == "GET":
        customers = User.query.filter_by(is_admin=False).order_by(User.created_at.desc()).all()
        customer_rows = []

        for customer in customers:
            rewards = build_user_rewards(customer.id)
            customer_rows.append({
                "id": customer.id,
                "full_name": customer.full_name,
                "email": customer.email,
                "points_balance": rewards["points_balance"],
                "earned_points": rewards["earned_points"],
                "adjustment_points": rewards["adjustment_points"],
                "tier": rewards["tier"],
                "voucher_value": rewards["voucher_value"],
                "eligible_orders": rewards["eligible_orders"],
                "lifetime_spend": rewards["lifetime_spend"],
            })

        return jsonify({
            "settings": settings.to_dict(),
            "customers": customer_rows,
        }), 200

    data = request.get_json() or {}

    settings.is_enabled = bool(data.get("is_enabled", settings.is_enabled))
    settings.points_per_rand = max(0, float(data.get("points_per_rand") or 0))
    settings.points_per_order = max(0, int(data.get("points_per_order") or 0))
    settings.reward_threshold = max(1, int(data.get("reward_threshold") or 1))
    settings.voucher_value = max(0, float(data.get("voucher_value") or 0))
    settings.min_order_total = max(0, float(data.get("min_order_total") or 0))
    settings.glow_tier_points = max(0, int(data.get("glow_tier_points") or 0))
    settings.gold_tier_points = max(0, int(data.get("gold_tier_points") or 0))
    settings.diamond_tier_points = max(0, int(data.get("diamond_tier_points") or 0))

    statuses = parse_statuses(data.get("eligible_statuses"))
    if not statuses:
        return jsonify({"error": "Choose at least one eligible order status"}), 400

    settings.eligible_statuses = ",".join(statuses)
    db.session.commit()

    return jsonify({
        "message": "Reward settings updated",
        "settings": settings.to_dict(),
    }), 200


@app.route("/admin/rewards/adjustments", methods=["POST"])
@token_required
@admin_required
def admin_create_reward_adjustment(user_data):
    data = request.get_json() or {}

    user_id = data.get("user_id")
    points = int(data.get("points") or 0)
    reason = (data.get("reason") or "").strip()

    if not user_id:
        return jsonify({"error": "Customer is required"}), 400

    if points == 0:
        return jsonify({"error": "Points adjustment cannot be zero"}), 400

    if not reason:
        return jsonify({"error": "Reason is required"}), 400

    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Customer not found"}), 404

    adjustment = RewardAdjustment(
        user_id=user.id,
        points=points,
        reason=reason,
        created_by=user_data.get("user_id"),
    )

    db.session.add(adjustment)
    db.session.commit()

    return jsonify({
        "message": "Reward points adjusted",
        "adjustment": adjustment.to_dict(),
        "rewards": build_user_rewards(user.id),
    }), 201


@app.route("/products/<int:product_id>/reviews", methods=["GET"])
def get_product_reviews(product_id):
    reviews = Review.query.filter_by(product_id=product_id, is_approved=True).order_by(Review.created_at.desc()).all()

    return jsonify([
        {
            "id": review.id,
            "user_id": review.user_id,
            "product_id": review.product_id,
            "rating": review.rating,
            "comment": review.comment,
            "customer_name": review.user.full_name if review.user else "Customer",
            "created_at": review.created_at.isoformat() if review.created_at else "",
        }
        for review in reviews
    ]), 200


@app.route("/products/<int:product_id>/reviews", methods=["POST"])
def create_product_review(product_id):
    try:
        data = request.get_json() or {}

        user_id = data.get("user_id")
        rating = int(data.get("rating") or 0)
        comment = (data.get("comment") or "").strip()

        if not user_id:
            return jsonify({"error": "Please login to review"}), 401

        if rating < 1 or rating > 5:
            return jsonify({"error": "Rating must be between 1 and 5"}), 400

        product = Product.query.get(product_id)
        if not product:
            return jsonify({"error": "Product not found"}), 404

        existing = Review.query.filter_by(user_id=user_id, product_id=product_id).first()

        if existing:
            existing.rating = rating
            existing.comment = comment
            existing.is_approved = False
        else:
            review = Review(
                user_id=user_id,
                product_id=product_id,
                rating=rating,
                comment=comment,
                is_approved=False,
            )
            db.session.add(review)

        db.session.commit()

        return jsonify({"message": "Review saved successfully and is waiting for approval"}), 201

    except Exception as e:
        db.session.rollback()
        print("REVIEW ERROR:", e)
        return jsonify({"error": "Failed to save review"}), 500


@app.route("/admin/reviews", methods=["GET"])
@token_required
@admin_required
def admin_get_reviews(user_data):
    try:
        reviews = Review.query.order_by(Review.created_at.desc()).all()
        product_stats = []

        for product in Product.query.all():
            product_reviews = Review.query.filter_by(product_id=product.id, is_approved=True).all()
            review_count = len(product_reviews)
            average_rating = (
                sum(int(review.rating or 0) for review in product_reviews) / review_count
                if review_count
                else 0
            )
            product_stats.append({
                "product_id": product.id,
                "product_name": product.name,
                "average_rating": round(average_rating, 2),
                "review_count": review_count,
            })

        return jsonify({
            "reviews": [serialize_review_admin(review) for review in reviews],
            "product_stats": product_stats,
        }), 200
    except Exception as e:
        print("ADMIN REVIEWS ERROR:", e)
        return jsonify({"error": "Failed to load reviews"}), 500


@app.route("/admin/reviews/<int:review_id>", methods=["DELETE"])
@token_required
@admin_required
def admin_delete_review(user_data, review_id):
    review = Review.query.get(review_id)

    if not review:
        return jsonify({"error": "Review not found"}), 404

    db.session.delete(review)
    db.session.commit()

    return jsonify({"message": "Review deleted"}), 200


@app.route("/admin/reviews/<int:review_id>/approval", methods=["PATCH"])
@token_required
@admin_required
def admin_update_review_approval(user_data, review_id):
    review = Review.query.get(review_id)

    if not review:
        return jsonify({"error": "Review not found"}), 404

    data = request.get_json() or {}
    review.is_approved = bool(data.get("is_approved"))
    db.session.commit()

    return jsonify({
        "message": "Review approval updated",
        "review": serialize_review_admin(review)
    }), 200
    

# -----------------------------
# ADMIN USERS
# -----------------------------
@app.route("/admin/users", methods=["GET"])
@token_required
@admin_required
def admin_get_users(user_data):
    try:
        users = User.query.order_by(User.id.desc()).all()
        return jsonify([serialize_user_admin(user) for user in users]), 200
    except Exception as e:
        print("ADMIN USERS ERROR:", e)
        return jsonify({"error": "Failed to load users"}), 500


@app.route("/admin/customers", methods=["GET"])
@token_required
@admin_required
def admin_get_customers(user_data):
    try:
        users = User.query.filter_by(is_admin=False).order_by(User.created_at.desc()).all()
        return jsonify([serialize_user_admin(user) for user in users]), 200
    except Exception as e:
        print("ADMIN CUSTOMERS ERROR:", e)
        return jsonify({"error": "Failed to load customers"}), 500


@app.route("/admin/users/<int:user_id>", methods=["GET"])
@token_required
@admin_required
def admin_get_single_user(user_data, user_id):
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify(serialize_user_admin(user)), 200


@app.route("/admin/customers/<int:user_id>", methods=["GET"])
@token_required
@admin_required
def admin_get_customer_profile(user_data, user_id):
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Customer not found"}), 404

    analyses = (
        BeautyAnalysis.query
        .filter_by(user_id=user_id)
        .order_by(BeautyAnalysis.created_at.desc())
        .all()
    )
    wishlist = Wishlist.query.filter_by(user_id=user_id).all()
    orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()

    return jsonify({
        "customer": serialize_user_admin(user),
        "orders": [serialize_order_admin(order) for order in orders],
        "wishlist": [
            serialize_product(item.product)
            for item in wishlist
            if item.product
        ],
        "beauty_analyses": [
            {
                "id": analysis.id,
                "skin_type": analysis.skin_type,
                "hair_focus": analysis.hair_focus,
                "face_shape": analysis.face_shape,
                "beauty_goal": analysis.beauty_goal,
                "summary": analysis.summary,
                "recommended_categories": json.loads(analysis.recommended_categories or "[]"),
                "product_keywords": json.loads(analysis.product_keywords or "[]"),
                "tips": json.loads(analysis.tips or "[]"),
                "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
            }
            for analysis in analyses
        ],
    }), 200


@app.route("/admin/users/<int:user_id>", methods=["PUT"])
@token_required
@admin_required
def admin_update_user(user_data, user_id):
    try:
        user = User.query.get(user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.get_json() or {}

        user.full_name = data.get("full_name", user.full_name)
        user.email = data.get("email", user.email)
        user.phone = data.get("phone", user.phone)
        user.city = data.get("city", user.city)
        user.address = data.get("address", user.address)

        if "is_verified" in data:
            user.is_verified = bool(data.get("is_verified"))

        if "is_admin" in data:
            user.is_admin = bool(data.get("is_admin"))

        db.session.commit()

        return jsonify({
            "message": "User updated successfully",
            "user": serialize_user_admin(user),
        }), 200

    except Exception as e:
        db.session.rollback()
        print("ADMIN UPDATE USER ERROR:", e)
        return jsonify({"error": "Failed to update user"}), 500


@app.route("/admin/users/<int:user_id>", methods=["DELETE"])
@token_required
@admin_required
def admin_delete_user(user_data, user_id):
    try:
        user = User.query.get(user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        if user.is_admin:
            return jsonify({"error": "Admin accounts cannot be deleted here"}), 400

        EmailVerificationCode.query.filter_by(user_id=user_id).delete(synchronize_session=False)
        CartItem.query.filter_by(user_id=user_id).delete(synchronize_session=False)
        Wishlist.query.filter_by(user_id=user_id).delete(synchronize_session=False)
        Review.query.filter_by(user_id=user_id).delete(synchronize_session=False)
        Notification.query.filter_by(user_id=user_id).delete(synchronize_session=False)
        BeautyAnalysis.query.filter_by(user_id=user_id).delete(synchronize_session=False)
        AIUsage.query.filter_by(user_id=user_id).delete(synchronize_session=False)
        RewardAdjustment.query.filter_by(user_id=user_id).delete(synchronize_session=False)
        order_ids = [order.id for order in Order.query.filter_by(user_id=user_id).all()]
        if order_ids:
            OrderItem.query.filter(OrderItem.order_id.in_(order_ids)).delete(synchronize_session=False)
        Order.query.filter_by(user_id=user_id).delete(synchronize_session=False)

        db.session.delete(user)
        db.session.commit()

        return jsonify({"message": "Customer deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        print("ADMIN DELETE USER ERROR:", e)
        return jsonify({"error": "Failed to delete customer"}), 500


# -----------------------------
# ADMIN PRODUCTS
# -----------------------------
@app.route("/admin/products", methods=["GET"])
@token_required
@admin_required
def admin_get_products(user_data):
    try:
        products = Product.query.order_by(Product.id.desc()).all()
        return jsonify([serialize_product(product) for product in products]), 200
    except Exception as e:
        print("ADMIN GET PRODUCTS ERROR:", e)
        return jsonify({"error": "Failed to load products"}), 500

@app.route("/admin/products", methods=["POST"])
@token_required
@admin_required
def admin_create_product(user_data):
    try:
        data = request.form  # ✅ important change

        name = (data.get("name") or "").strip()
        brand = (data.get("brand") or "").strip()
        category = (data.get("category") or "").strip()
        price = float(data.get("price") or 0)
        stock = int(data.get("stock") or 0)

        if not name:
            return jsonify({"error": "Product name is required"}), 400

        if not brand:
            return jsonify({"error": "Product brand is required"}), 400

        if not category:
            return jsonify({"error": "Product category is required"}), 400

        if price <= 0:
            return jsonify({"error": "Product price must be greater than 0"}), 400

        if stock < 0:
            return jsonify({"error": "Product stock cannot be negative"}), 400

        # ✅ HANDLE MULTIPLE IMAGES HERE
        files = request.files.getlist("images")

        image_urls = []

        for file in files[:4]:  # limit to 4
            url = save_product_image(file)
            if url:
                image_urls.append(url)

        if not image_urls:
            return jsonify({"error": "At least one product image is required"}), 400

        product = Product(
    name=name,
    description=(data.get("description") or "").strip(),
    price=price,
    category=category,
    subcategory=(data.get("subcategory") or "").strip(),
    brand=brand,
    stock=stock,

    promotion_text=(data.get("promotion_text") or "").strip(),
    discount_percent=float(data.get("discount_percent") or 0),

    length=(data.get("length") or "").strip(),
    density=(data.get("density") or "").strip(),
    lace_type=(data.get("lace_type") or "").strip(),

    image_url=image_urls[0] if len(image_urls) > 0 else "",
    image_url_2=image_urls[1] if len(image_urls) > 1 else "",
    image_url_3=image_urls[2] if len(image_urls) > 2 else "",
    image_url_4=image_urls[3] if len(image_urls) > 3 else "",
)

        db.session.add(product)
        db.session.commit()

        return jsonify({
            "message": "Product created successfully",
            "product": serialize_product(product),
        }), 201

    except ValueError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

    except Exception as e:
        db.session.rollback()
        print("ADMIN CREATE PRODUCT ERROR:", e)
        return jsonify({"error": "Failed to create product"}), 500


@app.route("/admin/products/<int:product_id>", methods=["PUT", "PATCH"])
@token_required
@admin_required
def admin_update_product(user_data, product_id):
    try:
        data = request.get_json(silent=True) if request.is_json else request.form
        product = Product.query.get(product_id)

        if not product:
            return jsonify({"error": "Product not found"}), 404

        images = request.files.getlist("images")

        product.name = (data.get("name", product.name) or "").strip()
        product.description = (data.get("description", product.description) or "").strip()
        product.price = float(data.get("price", product.price) or 0)
        product.category = (data.get("category", product.category) or "").strip()
        product.subcategory = (data.get("subcategory", product.subcategory) or "").strip()
        product.brand = (data.get("brand", product.brand) or "").strip()
        product.stock = int(data.get("stock", product.stock) or 0)

        if not product.name:
            return jsonify({"error": "Product name is required"}), 400

        if not product.brand:
            return jsonify({"error": "Product brand is required"}), 400

        if not product.category:
            return jsonify({"error": "Product category is required"}), 400

        if product.price <= 0:
            return jsonify({"error": "Product price must be greater than 0"}), 400

        if product.stock < 0:
            return jsonify({"error": "Product stock cannot be negative"}), 400
        product.promotion_text = (data.get("promotion_text") or product.promotion_text or "").strip()
        product.discount_percent = float(data.get("discount_percent") or 0) 
        product.length = (data.get("length", product.length) or "").strip()
        product.density = (data.get("density", product.density) or "").strip()
        product.lace_type = (data.get("lace_type", product.lace_type) or "").strip()

        uploaded_urls = []
        for file in images[:4]:
            url = save_product_image(file)
            if url:
                uploaded_urls.append(url)

        if uploaded_urls:
            product.image_url = uploaded_urls[0] if len(uploaded_urls) > 0 else ""
            product.image_url_2 = uploaded_urls[1] if len(uploaded_urls) > 1 else ""
            product.image_url_3 = uploaded_urls[2] if len(uploaded_urls) > 2 else ""
            product.image_url_4 = uploaded_urls[3] if len(uploaded_urls) > 3 else ""
        else:
            product.image_url = (data.get("image_url", product.image_url) or "").strip()
            product.image_url_2 = (data.get("image_url_2", product.image_url_2) or "").strip()
            product.image_url_3 = (data.get("image_url_3", product.image_url_3) or "").strip()
            product.image_url_4 = (data.get("image_url_4", product.image_url_4) or "").strip()
        

        db.session.commit()

        return jsonify({
            "message": "Product updated successfully",
            "product": serialize_product(product),
        }), 200

    except ValueError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

    except Exception as e:
        db.session.rollback()
        print("ADMIN UPDATE PRODUCT ERROR:", e)
        return jsonify({"error": "Failed to update product"}), 500


@app.route("/admin/products/<int:product_id>", methods=["DELETE"])
@token_required
@admin_required
def delete_product(current_user, product_id):
    try:
        product = Product.query.get(product_id)

        if not product:
            return jsonify({"error": "Product not found"}), 404

        db.session.execute(
            db.text("DELETE FROM cart_item WHERE product_id = :id"),
            {"id": product_id}
        )

        db.session.execute(
            db.text("DELETE FROM wishlist WHERE product_id = :id"),
            {"id": product_id}
        )

        db.session.execute(
            db.text("DELETE FROM order_item WHERE product_id = :id"),
            {"id": product_id}
        )

        db.session.execute(
            db.text("DELETE FROM order_items WHERE product_id = :id"),
            {"id": product_id}
        )

        db.session.delete(product)
        db.session.commit()

        return jsonify({"message": "Product deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        print("DELETE PRODUCT ERROR:", str(e))
        return jsonify({"error": str(e)}), 500


# -----------------------------
# ADMIN ORDERS
# -----------------------------
@app.route("/admin/orders", methods=["GET"])
@token_required
@admin_required
def admin_get_orders(user_data):
    try:
        orders = Order.query.order_by(Order.id.desc()).all()
        return jsonify([serialize_order_admin(order) for order in orders]), 200
    except Exception as e:
        print("ADMIN ORDERS ERROR:", e)
        return jsonify({"error": "Failed to load orders"}), 500


@app.route("/admin/orders/<int:order_id>", methods=["GET"])
@token_required
@admin_required
def admin_get_single_order(user_data, order_id):
    order = Order.query.get(order_id)

    if not order:
        return jsonify({"error": "Order not found"}), 404

    return jsonify(serialize_order_admin(order)), 200


@app.route("/admin/orders/<int:order_id>/status", methods=["PUT", "PATCH"])
@token_required
@admin_required
def admin_update_order_status(user_data, order_id):
    try:
        order = Order.query.get(order_id)

        if not order:
            return jsonify({"error": "Order not found"}), 404

        data = request.get_json() or {}
        previous_delivery_status = (order.delivery_status or "").strip().lower()

        status = (data.get("status") or "").strip()
        delivery_status = (data.get("delivery_status") or "").strip()
        tracking_number = (data.get("tracking_number") or "").strip()
        generate_tracking = bool(data.get("generate_tracking"))

        if status:
            order.status = status

        if delivery_status:
            order.delivery_status = delivery_status

        if generate_tracking and not order.tracking_number:
            order.tracking_number = f"ZE-{order.id}-{int(datetime.utcnow().timestamp())}"
        elif tracking_number:
            order.tracking_number = tracking_number

        db.session.commit()

        new_delivery_status = (order.delivery_status or "").strip().lower()
        if delivery_status and new_delivery_status != previous_delivery_status:
            notify_by_delivery_status(order)

        return jsonify({
            "message": "Order updated successfully",
            "order": serialize_order_admin(order),
        }), 200

    except Exception as e:
        db.session.rollback()
        print("ADMIN UPDATE ORDER ERROR:", e)
        return jsonify({"error": "Failed to update order"}), 500


@app.route("/admin/update-delivery/<int:order_id>", methods=["PUT"])
@token_required
@admin_required
def admin_update_delivery(user_data, order_id):
    try:
        order = Order.query.get(order_id)

        if not order:
            return jsonify({"error": "Order not found"}), 404

        data = request.get_json() or {}

        delivery_status = (data.get("delivery_status") or "").strip()
        tracking_number = (data.get("tracking_number") or "").strip()

        if delivery_status:
            order.delivery_status = delivery_status

        if tracking_number:
            order.tracking_number = tracking_number

        db.session.commit()

        notify_by_delivery_status(order)

        return jsonify({
            "message": "Delivery updated successfully",
            "order": serialize_order_admin(order),
        }), 200

    except Exception as e:
        db.session.rollback()
        print("ADMIN DELIVERY UPDATE ERROR:", e)
        return jsonify({"error": "Failed to update delivery"}), 500


# -----------------------------
# ADMIN ANALYTICS
# -----------------------------
@app.route("/admin/analytics", methods=["GET"])
@token_required
@admin_required
def admin_analytics(user_data):
    try:
        now = datetime.utcnow()
        revenue_chart = []

        for i in range(6, -1, -1):
            day_start = datetime(now.year, now.month, now.day) - timedelta(days=i)
            day_end = day_start + timedelta(days=1)

            day_orders = Order.query.filter(
                Order.created_at >= day_start,
                Order.created_at < day_end,
                Order.status == "Paid"
            ).all()

            revenue = sum(float(order.total or 0) for order in day_orders)

            revenue_chart.append({
                "label": day_start.strftime("%a"),
                "revenue": revenue,
            })

        paid_orders = Order.query.filter_by(status="Paid").all()
        total_revenue = sum(float(order.total or 0) for order in paid_orders)

        vat_amount = total_revenue * VAT_RATE / (1 + VAT_RATE)
        subtotal_ex_vat = total_revenue - vat_amount

        return jsonify({
            "total_revenue": total_revenue,
            "subtotal_ex_vat": subtotal_ex_vat,
            "vat_rate": VAT_RATE,
            "vat_amount": vat_amount,
            "total_orders": Order.query.count(),
            "paid_orders": len(paid_orders),
            "pending_orders": Order.query.filter(Order.status != "Paid").count(),
            "total_products": Product.query.count(),
            "total_users": User.query.count(),
            "revenue_chart": revenue_chart,
        }), 200

    except Exception as e:
        print("ADMIN ANALYTICS ERROR:", e)
        return jsonify({"error": "Failed to load analytics"}), 500


@app.route("/admin/beauty-intelligence", methods=["GET"])
@token_required
@admin_required
def admin_beauty_intelligence(user_data):
    try:
        analyses = BeautyAnalysis.query.order_by(BeautyAnalysis.created_at.desc()).all()
        skin_types = {}
        hair_focuses = {}
        beauty_goals = {}
        product_keywords = {}

        for analysis in analyses:
            skin_types[analysis.skin_type or "Unknown"] = skin_types.get(analysis.skin_type or "Unknown", 0) + 1
            hair_focuses[analysis.hair_focus or "Unknown"] = hair_focuses.get(analysis.hair_focus or "Unknown", 0) + 1
            beauty_goals[analysis.beauty_goal or "Unknown"] = beauty_goals.get(analysis.beauty_goal or "Unknown", 0) + 1

            for keyword in json.loads(analysis.product_keywords or "[]"):
                key = str(keyword).strip().lower()
                if key:
                    product_keywords[key] = product_keywords.get(key, 0) + 1

        def top_items(mapping):
            return [
                {"label": key, "count": value}
                for key, value in sorted(mapping.items(), key=lambda item: item[1], reverse=True)[:10]
            ]

        all_product_text = " ".join(
            f"{product.name or ''} {product.category or ''} {product.subcategory or ''}"
            for product in Product.query.all()
        ).lower()

        missing = [
            {"keyword": keyword, "count": count}
            for keyword, count in sorted(product_keywords.items(), key=lambda item: item[1], reverse=True)
            if keyword and keyword not in all_product_text
        ][:10]

        return jsonify({
            "total_analyses": len(analyses),
            "top_skin_types": top_items(skin_types),
            "top_hair_focuses": top_items(hair_focuses),
            "top_beauty_goals": top_items(beauty_goals),
            "product_keyword_trends": top_items(product_keywords),
            "inventory_suggestions": missing,
            "most_requested_missing_products": missing,
        }), 200
    except Exception as e:
        print("ADMIN BEAUTY INTELLIGENCE ERROR:", e)
        return jsonify({"error": "Failed to load beauty intelligence"}), 500


@app.route("/admin/notifications/send", methods=["POST"])
@token_required
@admin_required
def admin_send_notification(user_data):
    try:
        data = request.get_json() or {}
        user_id = data.get("user_id")
        send_all = bool(data.get("send_all"))
        title = (data.get("title") or "").strip()
        message = (data.get("message") or "").strip()
        notification_type = (data.get("type") or "general").strip()

        if not title or not message:
            return jsonify({"error": "Title and message are required"}), 400

        users = User.query.all() if send_all else [User.query.get(user_id)]
        users = [user for user in users if user]

        if not users:
            return jsonify({"error": "No users found"}), 404

        for user in users:
            db.session.add(Notification(
                user_id=user.id,
                title=title,
                message=message,
                type=notification_type,
            ))

        db.session.commit()

        return jsonify({"message": "Notification sent", "sent_count": len(users)}), 201
    except Exception as e:
        db.session.rollback()
        print("ADMIN NOTIFICATION ERROR:", e)
        return jsonify({"error": "Failed to send notification"}), 500


@app.route("/admin/notifications", methods=["GET"])
@token_required
@admin_required
def admin_get_notifications(user_data):
    notifications = Notification.query.order_by(Notification.created_at.desc()).limit(100).all()
    return jsonify([serialize_notification_admin(notification) for notification in notifications]), 200


# -----------------------------
# ADMIN PROFILE
# -----------------------------
@app.route("/admin/profile", methods=["GET"])
@token_required
@admin_required
def admin_get_profile(user_data):
    admin = User.query.get(user_data["user_id"])

    if not admin:
        return jsonify({"error": "Admin not found"}), 404

    return jsonify(serialize_user_admin(admin)), 200


@app.route("/admin/profile", methods=["PUT"])
@token_required
@admin_required
def admin_update_profile(user_data):
    try:
        admin = User.query.get(user_data["user_id"])

        if not admin:
            return jsonify({"error": "Admin not found"}), 404

        data = request.get_json() or {}

        admin.full_name = data.get("full_name", admin.full_name)
        admin.email = data.get("email", admin.email)
        admin.phone = data.get("phone", admin.phone)
        admin.city = data.get("city", admin.city)
        admin.address = data.get("address", admin.address)

        db.session.commit()

        return jsonify({
            "message": "Admin profile updated successfully",
            "admin": serialize_user_admin(admin),
        }), 200

    except Exception as e:
        db.session.rollback()
        print("ADMIN PROFILE UPDATE ERROR:", e)
        return jsonify({"error": "Failed to update admin profile"}), 500


@app.route("/admin/change-password", methods=["PUT"])
@token_required
@admin_required
def admin_change_password(user_data):
    try:
        admin = User.query.get(user_data["user_id"])

        if not admin:
            return jsonify({"error": "Admin not found"}), 404

        data = request.get_json() or {}

        current_password = data.get("current_password") or ""
        new_password = data.get("new_password") or ""

        if not current_password or not new_password:
            return jsonify({"error": "Current and new password are required"}), 400

        if not check_password_hash(admin.password, current_password):
            return jsonify({"error": "Current password is incorrect"}), 401

        admin.password = generate_password_hash(new_password)
        db.session.commit()

        return jsonify({"message": "Password updated successfully"}), 200

    except Exception as e:
        db.session.rollback()
        print("ADMIN CHANGE PASSWORD ERROR:", e)
        return jsonify({"error": "Failed to change password"}), 500



# -----------------------------
# OPTIONAL ADMIN CHECK HELPER
# -----------------------------
def get_admin_from_request():
    user_id = (
        request.headers.get("X-User-Id")
        or request.args.get("user_id")
        or (request.get_json(silent=True) or {}).get("user_id")
    )

    if not user_id:
        return None, jsonify({"error": "Admin user_id is required"}), 401

    admin = User.query.get(user_id)

    if not admin:
        return None, jsonify({"error": "Admin not found"}), 404

    if not getattr(admin, "is_admin", False):
        return None, jsonify({"error": "Unauthorized"}), 403

    return admin, None, None



def send_whatsapp_order_confirmation(to_phone, customer_name, total, order_items):
    item_lines = []

    for item in order_items:
        qty = item.get("quantity", 1)
        name = item.get("name", "Item")
        item_lines.append(f"- {name} x{qty}")

    items_text = "\n".join(item_lines)

    body = (
        f"Hi {customer_name}, your Zuri Elegance order has been received.\n\n"
        f"Items:\n{items_text}\n\n"
        f"Total: R {total:.2f}\n"
        f"Delivery: within 24 hours where available.\n\n"
        f"Thank you for shopping with Zuri Elegance 💜"
    )

    message = twilio_client.messages.create(
        from_=TWILIO_WHATSAPP_FROM,
        to=f"whatsapp:{to_phone}",
        body=body,
    )

    return message.sid


@app.route("/place-order", methods=["POST"])
def place_order():
    try:
        data = request.get_json() or {}

        customer = data.get("customer") or {}
        items = data.get("items") or []
        total = float(data.get("total") or 0)

        name = (customer.get("name") or "").strip()
        phone = (customer.get("phone") or "").strip()
        address = (customer.get("address") or "").strip()
        city = (customer.get("city") or "").strip()
        notes = (customer.get("notes") or "").strip()

        if not name or not phone or not address or not city:
            return jsonify({"error": "Missing required delivery details"}), 400

        if not items:
            return jsonify({"error": "Your cart is empty"}), 400

        whatsapp_sid = None

        try:
            whatsapp_sid = send_whatsapp_order_confirmation(
                to_phone=phone,
                customer_name=name,
                total=total,
                order_items=items,
            )
        except Exception as whatsapp_error:
            print("WHATSAPP SEND ERROR:", repr(whatsapp_error))

        return jsonify({
            "message": "Order placed successfully",
            "whatsapp_sent": bool(whatsapp_sid),
            "whatsapp_sid": whatsapp_sid,
        }), 200

    except Exception as e:
        print("PLACE ORDER ERROR:", repr(e))
        return jsonify({"error": "Failed to place order"}), 500



@app.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}

    full_name = (data.get("full_name") or "").strip()
    phone = (data.get("phone") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not full_name or not email or not password:
        return jsonify({"error": "Full name, email and password are required"}), 400

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return jsonify({"error": "Email already registered"}), 409

    hashed_password = generate_password_hash(password)

    user = User(
        full_name=full_name,
        email=email,
        phone=phone,
        password=hashed_password,
        is_verified=False
    )

    db.session.add(user)
    db.session.flush()
    code = create_email_verification_record(user)
    db.session.commit()

    if not send_verification_email(user, code):
        return jsonify({
            "message": "Registration successful, but verification email could not be sent. Please use Resend Code.",
            "email": email,
            "email_sent": False,
        }), 202

    return jsonify({
        "message": "Registration successful. Verification code sent.",
        "email": email,
        "email_sent": True,
    }), 201


@app.route("/verify-email", methods=["POST"])
def verify_email():
    data = request.get_json() or {}

    email = (data.get("email") or "").strip().lower()
    code = (data.get("code") or "").strip()

    if not email or not code:
        return jsonify({"error": "Email and code are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.is_verified:
        return jsonify({"message": "Email verified successfully"}), 200

    verification = (
        EmailVerificationCode.query
        .filter_by(user_id=user.id, consumed_at=None)
        .order_by(EmailVerificationCode.created_at.desc())
        .first()
    )

    if not verification or verification.expires_at < datetime.utcnow():
        return jsonify({"error": "Verification code expired. Please request a new code."}), 400

    if verification.attempts >= 5:
        return jsonify({"error": "Too many verification attempts. Please request a new code."}), 429

    verification.attempts += 1

    if verification.code_hash != hash_email_verification_code(email, code):
        db.session.commit()
        return jsonify({"error": "Invalid or expired verification code"}), 400

    user.is_verified = True
    verification.consumed_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "message": "Email verified successfully"
    }), 200

 
@app.route("/resend-verification-email", methods=["POST"])
def resend_verification_email():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()

    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.is_verified:
        return jsonify({"message": "Email is already verified"}), 200

    code = create_email_verification_record(user)

    if not send_verification_email(user, code):
        db.session.rollback()
        return jsonify({
            "message": "Could not resend right now. Please use the verification code already sent to your email, or try again shortly.",
            "email_sent": False,
        }), 200

    db.session.commit()

    return jsonify({
        "message": "Verification email sent again",
        "email_sent": True,
    }), 200


def create_password_reset_token(user):
    payload = {
        "user_id": user.id,
        "email": user.email,
        "purpose": "password_reset",
        "exp": datetime.utcnow() + timedelta(minutes=30),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def send_password_reset_email(user, reset_link):
    customer_name = html.escape(user.full_name or "there")
    safe_reset_link = html.escape(reset_link)
    text_content = (
        f"Hi {user.full_name or 'there'},\n\n"
        "We received a request to reset your Zuri Elegance password.\n\n"
        f"Reset your password here: {reset_link}\n\n"
        "This link expires in 30 minutes. If you did not request this, you can ignore this email.\n\n"
        "With elegance,\n"
        "Zuri Elegance"
    )
    html_content = f"""
    <div style="font-family:Arial,sans-serif;color:#2b2023;padding:24px;background:#fbf7f1;">
      <div style="max-width:560px;margin:auto;background:#fff;border:1px solid #eadfd6;border-radius:22px;padding:28px;">
        <h1 style="margin:0;color:#50242A;font-family:Georgia,serif;">Zuri Elegance</h1>
        <p style="color:#A38560;font-weight:800;letter-spacing:1px;">PASSWORD RESET</p>
        <p>Hi {customer_name},</p>
        <p>We received a request to reset your Zuri Elegance password. Use the button below to create a new password.</p>
        <p style="margin:26px 0;">
          <a href="{safe_reset_link}"
             style="background:#50242A;color:#fff;padding:13px 20px;border-radius:12px;text-decoration:none;font-weight:800;">
            Reset Password
          </a>
        </p>
        <p>This link expires in 30 minutes. If you did not request this, you can safely ignore this email.</p>
        <p style="color:#A38560;font-weight:800;">With elegance,<br/>Zuri Elegance</p>
      </div>
    </div>
    """

    return send_smtp_email(
        user.email,
        "Reset your Zuri Elegance password",
        text_content,
        html_content,
        log_label="PASSWORD RESET",
    )


@app.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()

    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = User.query.filter_by(email=email).first()

    if user:
        token = create_password_reset_token(user)
        reset_link = f"{FRONTEND_URL}/reset-password?token={token}"

        try:
            if not send_password_reset_email(user, reset_link):
                return jsonify({"error": "Failed to send password reset email"}), 500
        except Exception as e:
            print("PASSWORD RESET EMAIL ERROR:", e)
            return jsonify({"error": "Failed to send password reset email"}), 500

    return jsonify({
        "message": "If that email exists, password reset instructions have been sent."
    }), 200


@app.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json() or {}
    token = (data.get("token") or "").strip()
    password = data.get("password") or ""

    if not token or not password:
        return jsonify({"error": "Reset token and new password are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Reset link has expired"}), 400
    except Exception:
        return jsonify({"error": "Invalid reset link"}), 400

    if payload.get("purpose") != "password_reset":
        return jsonify({"error": "Invalid reset link"}), 400

    user = User.query.get(payload.get("user_id"))

    if not user or user.email != payload.get("email"):
        return jsonify({"error": "Invalid reset link"}), 400

    user.password = generate_password_hash(password)
    db.session.commit()

    return jsonify({"message": "Password reset successful. You can now sign in."}), 200


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    if not check_password_hash(user.password, password):
        return jsonify({"error": "Invalid email or password"}), 401

    if not user.is_verified:
        return jsonify({"error": "Please verify your email first"}), 403

    token = create_token(user)

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "city": user.city,
            "is_verified": user.is_verified,
            "is_admin": getattr(user, "is_admin", False)
        }
    }), 200



@app.route("/paystack/verify/<reference>", methods=["GET"])
def verify_paystack_payment(reference):
    try:
        if not PAYSTACK_SECRET_KEY:
            return jsonify({"error": "Missing Paystack secret key"}), 500

        order = Order.query.filter_by(reference=reference).first()

        if not order:
            return jsonify({"error": "Order not found"}), 404

        response = requests.get(
            f"https://api.paystack.co/transaction/verify/{reference}",
            headers={
                "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"
            },
            timeout=30
        )

        paystack_data = response.json()

        if not response.ok or not paystack_data.get("status"):
            return jsonify({
                "error": paystack_data.get("message", "Verification failed")
            }), 400

        payment_data = paystack_data.get("data", {})
        payment_status = payment_data.get("status")

        if payment_status == "success":
            already_paid = order.status == "Paid"

            if not already_paid:

                for item in order.items:
                    product = Product.query.get(item.product_id) if item.product_id else None

                    if product:
                        current_stock = int(product.stock or 0)
                        quantity = int(item.quantity or 0)

                        product.stock = max(0, current_stock - quantity)

                        # LOW STOCK ALERT
                        if int(product.stock or 0) <= 3:
                            print(
                                f"LOW STOCK ALERT ⚠️ "
                                f"{product.name}: {product.stock} left"
                            )

                order.status = "Paid"
                order.delivery_status = order.delivery_status or "Processing"

                if not order.tracking_number:
                    order.tracking_number = f"TRK-{str(order.id).zfill(5)}"

                db.session.commit()

                notify_order_confirmed(order)

            return jsonify({
                "message": "Payment verified successfully",
                "order": serialize_order(order)
            }), 200

        return jsonify({"error": "Payment not successful"}), 400

    except Exception as e:
        print("PAYSTACK VERIFY ERROR:", e)
        return jsonify({"error": "Something went wrong"}), 500


# GET CART
@app.route("/cart/<int:user_id>", methods=["GET"])
def get_cart(user_id):
    items = CartItem.query.filter_by(user_id=user_id).all()

    return jsonify([
        {
            "id": item.product.id,
            "cart_item_id": item.id,
            "product_id": item.product.id,
            "name": item.product.name,
            "price": item.product.price,
            "image": item.product.image_url,
            "image_url": item.product.image_url,
            "image_url_2": item.product.image_url_2,
            "image_url_3": item.product.image_url_3,
            "image_url_4": item.product.image_url_4,
            "category": item.product.category,
            "description": item.product.description,
            "quantity": item.quantity
        }
        for item in items
    ])


# ADD TO CART
@app.route("/cart/add", methods=["POST"])
def add_to_cart():
    data = request.json
    product = Product.query.get(data.get("product_id"))
    requested_quantity = int(data.get("quantity", 1) or 1)

    if not product:
        return jsonify({"error": "Product not found"}), 404

    if requested_quantity < 1:
        return jsonify({"error": "Invalid quantity"}), 400

    existing = CartItem.query.filter_by(
        user_id=data["user_id"],
        product_id=data["product_id"]
    ).first()

    next_quantity = requested_quantity + int(existing.quantity or 0) if existing else requested_quantity

    if int(product.stock or 0) < next_quantity:
        return jsonify({"error": f"Only {int(product.stock or 0)} left for {product.name}"}), 400

    if existing:
        existing.quantity = next_quantity
    else:
        item = CartItem(
            user_id=data["user_id"],
            product_id=data["product_id"],
            quantity=requested_quantity
        )
        db.session.add(item)

    db.session.commit()
    return jsonify({"message": "Added to cart"})


# UPDATE CART
@app.route("/cart/update", methods=["PUT"])
def update_cart():
    data = request.json
    item = CartItem.query.get(data["id"])

    if not item:
        return jsonify({"error": "Item not found"}), 404

    quantity = int(data["quantity"] or 1)

    if item.product and int(item.product.stock or 0) < quantity:
        return jsonify({"error": f"Only {int(item.product.stock or 0)} left for {item.product.name}"}), 400

    item.quantity = quantity
    db.session.commit()

    return jsonify({"message": "Updated"})


# REMOVE ITEM
@app.route("/cart/remove/<int:item_id>", methods=["DELETE"])
def remove_cart_item(item_id):
    item = CartItem.query.get(item_id)

    if not item:
        return jsonify({"error": "Not found"}), 404

    db.session.delete(item)
    db.session.commit()

    return jsonify({"message": "Removed"})


@app.route("/cart/remove-product/<int:user_id>/<int:product_id>", methods=["DELETE"])
def remove_cart_product(user_id, product_id):
    item = CartItem.query.filter_by(
        user_id=user_id,
        product_id=product_id
    ).first()

    if not item:
        return jsonify({"error": "Not found"}), 404

    db.session.delete(item)
    db.session.commit()

    return jsonify({"message": "Removed"})


# CLEAR CART AFTER ORDER
def clear_cart(user_id):
    CartItem.query.filter_by(user_id=user_id).delete()
    db.session.commit()

@app.route("/checkout-from-cart", methods=["POST"])
def checkout_from_cart():
    
    print("CHECKOUT FROM CART HIT")

    data = request.get_json() or {}
    print("CHECKOUT DATA:", data)
    
    user_id = data.get("user_id")
    delivery_address = data.get("delivery_address", "")
    frontend_items = data.get("items", [])

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    order_items_source = []

    # 1) Try database cart first
    cart_items = CartItem.query.filter_by(user_id=user_id).all()

    if cart_items:
        for item in cart_items:
            order_items_source.append({
                "product_id": item.product_id,
                "quantity": item.quantity,
            })

    # 2) If DB cart is empty, use frontend/localStorage cart
    elif frontend_items:
        for item in frontend_items:
            product_id = item.get("id") or item.get("product_id")
            quantity = int(item.get("quantity", 1))

            order_items_source.append({
                "product_id": product_id,
                "quantity": quantity,
            })

    else:
        return jsonify({"error": "Cart is empty"}), 400

    total = 0
    validated_items = []

    for item in order_items_source:
        product_id = item.get("product_id")
        quantity = int(item.get("quantity", 1))

        product = Product.query.get(product_id)

        if not product:
            return jsonify({"error": "A product in the cart no longer exists"}), 400

        if quantity < 1:
            return jsonify({"error": "Invalid cart quantity"}), 400

        if int(product.stock or 0) < quantity:
            return jsonify({"error": f"Not enough stock for {product.name}"}), 400

        discount = abs(float(getattr(product, "discount_percent", 0) or 0))
        original_price = float(product.price or 0)
        final_price = original_price * (1 - discount / 100)

        total += final_price * int(quantity)

        validated_items.append({
            "product": product,
            "quantity": quantity,
            "price": final_price,
        })

    delivery_fee = 100
    total += delivery_fee

    order = Order(
        user_id=user_id,
        total=round(total, 2),
        status="Pending Payment",
        reference=f"ZE_{int(datetime.utcnow().timestamp())}_{user_id}",
        delivery_status="Processing",
        delivery_address=delivery_address,
        tracking_number=None,
    )

    db.session.add(order)
    db.session.flush()

    for item in validated_items:
        product = item["product"]
        quantity = item["quantity"]

        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            name=product.name,
            price=round(item["price"], 2),
            quantity=quantity,
        )

        db.session.add(order_item)

    # Clear database cart if it had items
    CartItem.query.filter_by(user_id=user_id).delete()

    db.session.commit()

    return jsonify({
        "message": "Checkout created successfully",
        "order_id": order.id,
        "reference": order.reference,
        "delivery_fee": delivery_fee,
        "total": order.total,
    }), 201


@app.route("/wishlist/<int:user_id>", methods=["GET"])
def get_wishlist(user_id):
    items = Wishlist.query.filter_by(user_id=user_id).all()

    return jsonify([
        serialize_product(item.product)
        for item in items
        if item.product
    ]), 200


@app.route("/wishlist/toggle", methods=["POST"])
def toggle_wishlist():
    data = request.get_json()

    user_id = data.get("user_id")
    product_id = data.get("product_id")

    if not user_id or not product_id:
        return jsonify({"error": "Missing user_id or product_id"}), 400

    existing = Wishlist.query.filter_by(
        user_id=user_id,
        product_id=product_id
    ).first()

    if existing:
        db.session.delete(existing)
        db.session.commit()
        return jsonify({"message": "Removed from wishlist", "liked": False}), 200

    item = Wishlist(user_id=user_id, product_id=product_id)
    db.session.add(item)
    db.session.commit()

    return jsonify({"message": "Added to wishlist", "liked": True}), 201


@app.route("/wishlist/<int:user_id>/<int:product_id>", methods=["DELETE"])
def remove_wishlist_item(user_id, product_id):
    item = Wishlist.query.filter_by(
        user_id=user_id,
        product_id=product_id
    ).first()

    if not item:
        return jsonify({"error": "Wishlist item not found"}), 404

    db.session.delete(item)
    db.session.commit()

    return jsonify({"message": "Removed from wishlist"}), 200


# -----------------------------
# NOTIFICATIONS
# -----------------------------
def build_tracking_link(order):
    return f"{FRONTEND_URL}/tracking?ref={order.reference}"


def normalize_whatsapp_phone(phone):
    if not phone:
        return None

    phone = phone.strip()

    if phone.startswith("00"):
        phone = "+" + phone[2:]

    if phone.startswith("+"):
        digits = re.sub(r"\D", "", phone[1:])
        return f"+{digits}" if digits else None

    digits = re.sub(r"\D", "", phone)

    if not digits:
        return None

    if digits.startswith("0"):
        return "+27" + digits[1:]

    if digits.startswith("27"):
        return f"+{digits}"

    return f"+{digits}"


def is_valid_whatsapp_phone(phone):
    return bool(re.fullmatch(r"\+[1-9]\d{7,14}", phone or ""))

def send_whatsapp_message(to_phone, body):
    try:
        if not to_phone:
            print("WHATSAPP SKIPPED: No phone number")
            return None

        to_phone = normalize_whatsapp_phone(to_phone)

        if not is_valid_whatsapp_phone(to_phone):
            print("WHATSAPP SKIPPED: Invalid international phone number")
            return None

        if not TWILIO_WHATSAPP_FROM:
            print("WHATSAPP SKIPPED: Missing TWILIO_WHATSAPP_FROM")
            return None

        message = twilio_client.messages.create(
            from_=TWILIO_WHATSAPP_FROM,
            to=f"whatsapp:{to_phone}",
            body=body,
        )

        print("WHATSAPP SENT ✅", message.sid)
        return message.sid

    except Exception as e:
        print("WHATSAPP ERROR:", e)
        return None


def draw_invoice_background(canvas, doc):
    width, height = A4

    canvas.saveState()
    canvas.setFillColor(colors.HexColor("#FBF7F1"))
    canvas.rect(0, 0, width, height, fill=1, stroke=0)

    canvas.setFillColor(colors.HexColor("#50242A"))
    canvas.rect(0, height - 92, width, 92, fill=1, stroke=0)

    canvas.setFillColor(colors.HexColor("#A38560"))
    canvas.rect(0, height - 96, width, 4, fill=1, stroke=0)

    canvas.setStrokeColor(colors.HexColor("#E7D8C8"))
    canvas.setLineWidth(1)
    canvas.roundRect(28, 28, width - 56, height - 56, 18, stroke=1, fill=0)

    canvas.setFillColor(colors.HexColor("#EFE3D6"))
    canvas.setFont("Helvetica-Bold", 64)
    canvas.translate(width / 2, height / 2)
    canvas.rotate(34)
    canvas.drawCentredString(0, 0, "ZURI ELEGANCE")
    canvas.restoreState()


def build_invoice_pdf(order, buffer):
    user = User.query.get(order.user_id)

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=46,
        leftMargin=46,
        topMargin=54,
        bottomMargin=46,
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="BrandTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=colors.white,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="GoldLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#A38560"),
        spaceAfter=2,
    ))
    styles.add(ParagraphStyle(
        name="InvoiceHeading",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        alignment=TA_RIGHT,
        textColor=colors.white,
    ))
    styles.add(ParagraphStyle(
        name="SectionTitle",
        parent=styles["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#50242A"),
        spaceBefore=8,
        spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        name="BodySmall",
        parent=styles["Normal"],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#2B2023"),
    ))
    styles.add(ParagraphStyle(
        name="ItemText",
        parent=styles["Normal"],
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#2B2023"),
    ))
    styles.add(ParagraphStyle(
        name="ThankYou",
        parent=styles["Italic"],
        fontSize=11,
        leading=15,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#50242A"),
    ))

    elements = []

    invoice_no = f"INV-{str(order.id).zfill(5)}"
    invoice_date = order.created_at.strftime("%d %B %Y") if order.created_at else "N/A"

    header = Table(
        [
            [
                Paragraph("ZURI ELEGANCE", styles["BrandTitle"]),
                Paragraph("Official Tax Invoice", styles["InvoiceHeading"]),
            ],
            [
                Paragraph("Premium Hair & Beauty", styles["GoldLabel"]),
                Paragraph(invoice_no, styles["InvoiceHeading"]),
            ],
        ],
        colWidths=[270, 230],
    )
    header.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    elements.append(header)
    elements.append(Spacer(1, 34))

    customer_lines = [
        f"<b>Name:</b> {user.full_name if user else 'Customer'}",
        f"<b>Email:</b> {user.email if user else 'N/A'}",
        f"<b>Phone:</b> {user.phone if user else 'N/A'}",
        f"<b>Delivery:</b> {order.delivery_address or 'N/A'}",
    ]
    invoice_lines = [
        f"<b>Order:</b> #{order.id}",
        f"<b>Reference:</b> {order.reference or 'N/A'}",
        f"<b>Date:</b> {invoice_date}",
        f"<b>Status:</b> {order.status or 'N/A'}",
        f"<b>Delivery Status:</b> {order.delivery_status or 'Processing'}",
        f"<b>Tracking:</b> {order.tracking_number or 'Pending'}",
    ]

    details = Table(
        [
            [
                Paragraph("BILL TO", styles["SectionTitle"]),
                Paragraph("INVOICE DETAILS", styles["SectionTitle"]),
            ],
            [
                [Paragraph(line, styles["BodySmall"]) for line in customer_lines],
                [Paragraph(line, styles["BodySmall"]) for line in invoice_lines],
            ],
        ],
        colWidths=[245, 245],
    )
    details.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.white),
        ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#E7D8C8")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#EFE3D6")),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    elements.append(details)
    elements.append(Spacer(1, 18))

    table_data = [["Item", "Qty", "Unit Price", "Total"]]

    for item in order.items:
        item_total = float(item.price or 0) * int(item.quantity or 1)
        table_data.append([
            Paragraph(item.name, styles["ItemText"]),
            str(item.quantity),
            f"R {float(item.price or 0):.2f}",
            f"R {item_total:.2f}",
        ])

    delivery_fee = 100
    total_incl_vat = float(order.total or 0)
    vat = total_incl_vat * 15 / 115
    subtotal_ex_vat = total_incl_vat - vat

    discount_amount = float(getattr(order, "discount_amount", 0) or 0)

    table_data.append(["", "", "Subtotal excl. VAT", f"R {subtotal_ex_vat:.2f}"])
    table_data.append(["", "", "VAT 15%", f"R {vat:.2f}"])
    if discount_amount > 0:
        table_data.append(["", "", "Discount", f"-R {discount_amount:.2f}"])
    table_data.append(["", "", "Delivery Fee", f"R {delivery_fee:.2f}"])
    table_data.append(["", "", "Grand Total", f"R {total_incl_vat:.2f}"])

    table = Table(table_data, colWidths=[245, 55, 95, 95], repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#50242A")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("LINEBELOW", (0, 0), (-1, 0), 1.2, colors.HexColor("#A38560")),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#E7D8C8")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
        ("ALIGN", (0, 0), (0, -1), "LEFT"),
        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FFF9F2")]),
        ("TEXTCOLOR", (0, 1), (-1, -1), colors.HexColor("#2B2023")),
        ("FONTNAME", (2, -5), (-1, -1), "Helvetica-Bold"),
        ("BACKGROUND", (2, -1), (-1, -1), colors.HexColor("#50242A")),
        ("TEXTCOLOR", (2, -1), (-1, -1), colors.white),
        ("FONTSIZE", (2, -1), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))

    elements.append(table)
    elements.append(Spacer(1, 18))

    note = Table(
        [[
            Paragraph(
                "Thank you for shopping with Zuri Elegance.<br/>"
                "This invoice was crafted for your records and reflects your confirmed order details.",
                styles["ThankYou"],
            )
        ]],
        colWidths=[500],
    )
    note.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8F4EE")),
        ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#A38560")),
        ("TOPPADDING", (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
        ("LEFTPADDING", (0, 0), (-1, -1), 16),
        ("RIGHTPADDING", (0, 0), (-1, -1), 16),
    ]))
    elements.append(note)

    doc.build(
        elements,
        onFirstPage=draw_invoice_background,
        onLaterPages=draw_invoice_background,
    )


def generate_invoice_pdf_bytes(order):
    buffer = BytesIO()
    build_invoice_pdf(order, buffer)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def send_order_email(to_email, customer_name, order):
    try:
        status = (order.delivery_status or "Processing").lower()

        if status == "packed":
            subject = f"Your Zuri Elegance order #{order.id} has been packed"
            heading = "Your Order Has Been Packed"
            intro = "Your order has been packed and is being prepared for delivery."
        elif status == "out for delivery":
            subject = f"Your Zuri Elegance order #{order.id} is out for delivery"
            heading = "Your Order Is Out For Delivery"
            intro = "Good news - your order is on its way. Please keep your phone nearby."
        elif status == "delivered":
            subject = f"Your Zuri Elegance order #{order.id} has been delivered"
            heading = "Your Order Has Been Delivered"
            intro = "Your order has been delivered. We hope you love your Zuri Elegance purchase."
        elif status in ["delayed", "delay"]:
            subject = f"Update on your Zuri Elegance order #{order.id}"
            heading = "Delivery Update"
            intro = "Your order is taking a little longer than expected, but we are working to get it to you as soon as possible."
        else:
            subject = f"Zuri Elegance Order Confirmation #{order.id}"
            heading = "Order Confirmed"
            intro = "Your payment was successful and your order is now being processed."

        items_html = "".join([
            f"<li>{html.escape(item.name or 'Product')} x{item.quantity} - R {float(item.price or 0):.2f}</li>"
            for item in order.items
        ])
        items_text = "\n".join([
            f"- {item.name or 'Product'} x{item.quantity} - R {float(item.price or 0):.2f}"
            for item in order.items
        ])

        tracking_link = build_tracking_link(order)
        text_content = f"""
Hi {customer_name or "there"},

{intro}

Order ID: #{order.id}
Reference: {order.reference}
Tracking: {order.tracking_number or "Pending"}
Status: {order.delivery_status or "Processing"}
Total: R {float(order.total or 0):.2f}

Items:
{items_text}

Track your order: {tracking_link}

Thank you for shopping with Zuri Elegance.
"""
        html_content = f"""
        <div style="font-family: Arial, sans-serif; color:#2b2023; padding:20px;">
          <h1 style="color:#50242A;">Zuri Elegance</h1>
          <h2>{html.escape(heading)}</h2>
          <p>Hi {html.escape(customer_name or "there")},</p>
          <p>{html.escape(intro)}</p>
          <p><strong>Order ID:</strong> #{order.id}</p>
          <p><strong>Reference:</strong> {html.escape(order.reference or "")}</p>
          <p><strong>Tracking:</strong> {html.escape(order.tracking_number or "Pending")}</p>
          <p><strong>Status:</strong> {html.escape(order.delivery_status or "Processing")}</p>
          <p><strong>Total:</strong> R {float(order.total or 0):.2f}</p>
          <h3>Items</h3>
          <ul>{items_html}</ul>
          <p>
            <a href="{html.escape(tracking_link)}"
               style="background:#50242A;color:white;padding:12px 18px;border-radius:10px;text-decoration:none;">
              Track Your Order
            </a>
          </p>
          <p style="color:#A38560;font-weight:bold;">Thank you for shopping with Zuri Elegance.</p>
        </div>
        """

        invoice_pdf = generate_invoice_pdf_bytes(order)
        return send_smtp_email(
            to_email,
            subject,
            text_content,
            html_content,
            attachments=[
                {
                    "content": invoice_pdf,
                    "maintype": "application",
                    "subtype": "pdf",
                    "filename": f"zuri-elegance-invoice-{order.id}.pdf",
                }
            ],
            log_label="ORDER EMAIL",
        )

    except Exception as e:
        print("ORDER EMAIL ERROR:", e)
        return None


def notify_order_confirmed(order):
    user = User.query.get(order.user_id)

    if not user:
        print("NOTIFICATION SKIPPED: User not found")
        return

    customer_name = user.full_name or "Customer"

    if user.email:
        send_order_email(user.email, customer_name, order)

    print("USER PHONE FOR WHATSAPP:", user.phone)

    if user.phone:
        body = f"""✨ ZURI ELEGANCE ✨

Order Confirmed 💜

Order: #{order.id}
Reference: {order.reference}
Tracking: {order.tracking_number or "Pending"}
Total: R {float(order.total or 0):.2f}

Delivery target: within 24 hours where available 🚚

Track your order:
{build_tracking_link(order)}

Thank you for shopping with Zuri Elegance 💎"""

        send_whatsapp_message(user.phone, body)


def notify_packed(order):
    user = User.query.get(order.user_id)

    if not user or not user.phone:
        return

    body = f"""📦 ZURI ELEGANCE

Your order has been packed and is being prepared for delivery.

Order: #{order.id}
Tracking: {order.tracking_number or "Pending"}

Track here:
{build_tracking_link(order)}

Thank you for shopping with Zuri Elegance 💜"""

    send_whatsapp_message(user.phone, body)


def notify_out_for_delivery(order):
    user = User.query.get(order.user_id)
    if not user or not user.phone:
        return

    body = f"""🚚 ZURI ELEGANCE DELIVERY

Good news — your order is out for delivery.

Order: #{order.id}
Tracking: {order.tracking_number or "Pending"}

Please keep your phone nearby.

Track here:
{build_tracking_link(order)}"""

    send_whatsapp_message(user.phone, body)


def notify_delivered(order):
    user = User.query.get(order.user_id)
    if not user or not user.phone:
        return

    body = f"""✅ ZURI ELEGANCE

Your order has been delivered.

Order: #{order.id}

Thank you for shopping with us 💜"""

    send_whatsapp_message(user.phone, body)


def notify_delivery_delay(order):
    user = User.query.get(order.user_id)
    if not user or not user.phone:
        return

    body = f"""⏳ ZURI ELEGANCE DELIVERY UPDATE

Your order is taking a little longer than expected.

Order: #{order.id}
Tracking: {order.tracking_number or "Pending"}

Track here:
{build_tracking_link(order)}"""

    send_whatsapp_message(user.phone, body)


def notify_by_delivery_status(order):
    try:
        status = (order.delivery_status or "").lower()
        user = User.query.get(order.user_id)

        if not user:
            print("DELIVERY NOTIFICATION SKIPPED: User not found")
            return

        print("DELIVERY STATUS NOTIFICATION:", status)

        if status in ["packed", "out for delivery", "delivered", "delayed", "delay"]:
            if user.email:
                send_order_email(
                    user.email,
                    user.full_name or "Customer",
                    order
                )
            else:
                print("DELIVERY EMAIL SKIPPED: No customer email")

        if status == "packed":
            notify_packed(order)

        elif status == "out for delivery":
            notify_out_for_delivery(order)

        elif status == "delivered":
            notify_delivered(order)

        elif status in ["delayed", "delay"]:
            notify_delivery_delay(order)

    except Exception as e:
        print("DELIVERY STATUS NOTIFICATION ERROR:", e)


@app.route("/orders/<int:order_id>/invoice", methods=["GET"])
def download_invoice(order_id):
    order = Order.query.get(order_id)

    if not order:
        return jsonify({"error": "Order not found"}), 404

    buffer = BytesIO()
    build_invoice_pdf(order, buffer)
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"zuri-elegance-invoice-{order.id}.pdf",
        mimetype="application/pdf",
    )


@app.route("/admin/low-stock", methods=["GET"])
@token_required
@admin_required
def admin_low_stock(user_data):
    try:
        products = Product.query.filter(Product.stock <= 5).order_by(Product.stock.asc()).all()
        return jsonify([serialize_product(product) for product in products]), 200
    except Exception as e:
        print("LOW STOCK ERROR:", e)
        return jsonify({"error": "Failed to load low stock products"}), 500


@app.route("/admin/brands", methods=["GET"])
@token_required
@admin_required
def admin_get_brands(user_data):
    try:
        return jsonify(build_brand_rows()), 200
    except Exception as e:
        print("ADMIN BRANDS ERROR:", e)
        return jsonify({"error": "Failed to load brands"}), 500


def build_brand_rows():
    rows = []
    brands = (
        db.session.query(Product.brand)
        .filter(Product.brand.isnot(None), Product.brand != "")
        .distinct()
        .order_by(Product.brand.asc())
        .all()
    )

    for (brand_name,) in brands:
        products = Product.query.filter_by(brand=brand_name).all()
        categories = sorted(
            {
                value
                for product in products
                for value in [product.category, product.subcategory]
                if value
            }
        )

        rows.append({
            "name": brand_name,
            "product_count": len(products),
            "image_url": next((product.image_url for product in products if product.image_url), ""),
            "categories": categories,
        })

    return rows


@app.route("/brands", methods=["GET"])
@cross_origin()
def get_brands():
    try:
        return jsonify(build_brand_rows()), 200
    except Exception as e:
        print("BRANDS ERROR:", e)
        return jsonify({"error": "Failed to load brands"}), 500


@app.route("/admin/brands/<path:brand_name>", methods=["PATCH"])
@token_required
@admin_required
def admin_update_brand(user_data, brand_name):
    data = request.get_json() or {}
    new_name = (data.get("name") or "").strip()

    if not new_name:
        return jsonify({"error": "Brand name is required"}), 400

    products = Product.query.filter_by(brand=brand_name).all()

    if not products:
        return jsonify({"error": "Brand not found"}), 404

    for product in products:
        product.brand = new_name

    db.session.commit()

    return jsonify({"message": "Brand updated", "name": new_name}), 200


@app.route("/admin/brands/<path:brand_name>", methods=["DELETE"])
@token_required
@admin_required
def admin_delete_brand(user_data, brand_name):
    products = Product.query.filter_by(brand=brand_name).all()

    if not products:
        return jsonify({"error": "Brand not found"}), 404

    for product in products:
        product.brand = ""

    db.session.commit()

    return jsonify({"message": "Brand removed from products"}), 200


@app.route("/paystack/initialize-order-payment", methods=["POST"])
def initialize_order_payment():
    """Create a pending order and initialize Paystack payment.

    Important: totals are calculated from the database, not trusted from frontend prices.
    """
    try:
        data = request.get_json() or {}
        print("PAYSTACK DATA:", data)

        user_id = data.get("user_id")
        email = (data.get("email") or "").strip().lower()
        delivery_address = (data.get("delivery_address") or "").strip()
        items = data.get("items") or data.get("cart_items") or []

        coupon_code = (data.get("coupon_code") or "").strip().upper()
        discount_amount = 0

        if not user_id or not email:
            return jsonify({"error": "Missing required fields"}), 400

        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        if not items:
            return jsonify({"error": "Cart is empty"}), 400

        if not PAYSTACK_SECRET_KEY:
            return jsonify({"error": "Missing Paystack secret key"}), 500

        items_total = 0
        validated_items = []

        for item in items:
            product_id = item.get("product_id") or item.get("id")
            quantity = int(item.get("quantity", 1) or 1)

            if not product_id:
                return jsonify({"error": "Missing product_id in cart item"}), 400

            if quantity < 1:
                return jsonify({"error": "Invalid cart quantity"}), 400

            product = Product.query.get(product_id)
            if not product:
                return jsonify({"error": "A product in the cart no longer exists"}), 400

            if int(product.stock or 0) < quantity:
                return jsonify({"error": f"Not enough stock for {product.name}"}), 400

            discount = abs(float(getattr(product, "discount_percent", 0) or 0))
            original_price = float(product.price or 0)
            final_price = original_price * (1 - discount / 100)

            items_total += final_price * quantity

            validated_items.append({
                "product": product,
                "quantity": quantity,
                "price": round(final_price, 2),
            })

        delivery_fee = 100
        subtotal_before_coupon = items_total + delivery_fee

        if coupon_code:
            coupon, coupon_error, discount_amount = validate_coupon_for_subtotal(
                coupon_code,
                subtotal_before_coupon
            )

            if coupon_error:
                return jsonify({"error": coupon_error}), 400

        total = max(subtotal_before_coupon - discount_amount, 0)

        reference = f"ZE_{int(datetime.utcnow().timestamp())}_{user_id}"

        order = Order(
            user_id=user_id,
            total=round(total, 2),
            status="Pending Payment",
            reference=reference,
            delivery_status="Processing",
            delivery_address=delivery_address,
            coupon_code=coupon_code or None,
            discount_amount=round(discount_amount, 2),
        )

        db.session.add(order)
        db.session.flush()

        for item in validated_items:
            product = item["product"]

            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                name=product.name,
                quantity=item["quantity"],
                price=item["price"],
            )

            db.session.add(order_item)

        db.session.commit()

        payload = {
            "email": email,
            "amount": int(round(total * 100)),
            "reference": reference,
            "callback_url": f"{BACKEND_URL}/paystack/payment-callback?reference={reference}",
            "metadata": {
                "user_id": user_id,
                "order_id": order.id,
                "coupon_code": coupon_code or None,
                "discount_amount": round(discount_amount, 2),
                "delivery_fee": delivery_fee,
                "items_total": round(items_total, 2),
            },
        }

        response = requests.post(
            "https://api.paystack.co/transaction/initialize",
            json=payload,
            headers={
                "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
                "Content-Type": "application/json",
            },
            timeout=30,
        )

        result = response.json()
        print("PAYSTACK RESPONSE:", result)

        if not response.ok or not result.get("status"):
            return jsonify({
                "error": result.get("message", "Unable to initialize payment")
            }), 400

        return jsonify({
            "authorization_url": result["data"]["authorization_url"],
            "reference": reference,
            "order_id": order.id,
            "delivery_fee": delivery_fee,
            "discount_amount": round(discount_amount, 2),
            "coupon_code": coupon_code or None,
            "total": round(total, 2),
        }), 200

    except Exception as e:
        db.session.rollback()
        print("PAYSTACK INITIALIZE ERROR:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/paystack/payment-callback", methods=["GET"])
def paystack_payment_callback():
    reference = (
        request.args.get("reference")
        or request.args.get("trxref")
        or request.args.get("ref")
        or ""
    ).strip()

    payment_status = "received"

    if reference and PAYSTACK_SECRET_KEY:
        try:
            verify_response = requests.get(
                f"https://api.paystack.co/transaction/verify/{reference}",
                headers={
                    "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
                    "Content-Type": "application/json",
                },
                timeout=20,
            )
            verify_result = verify_response.json()
            payment_status = (
                verify_result.get("data", {}).get("status")
                or payment_status
            )
        except Exception as e:
            print("PAYSTACK CALLBACK VERIFY ERROR:", e)

    query = urlencode({"reference": reference}) if reference else ""
    payment_frontend_url = get_payment_return_frontend_url()
    frontend_success_url = f"{payment_frontend_url}/payment-success"

    if query:
        frontend_success_url = f"{frontend_success_url}?{query}"

    escaped_reference = html.escape(reference or "Unavailable")
    escaped_status = html.escape(payment_status.title())
    escaped_frontend_url = html.escape(frontend_success_url, quote=True)

    return Response(
        f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Payment Received | Zuri Elegance</title>
    <style>
      :root {{
        color-scheme: light;
      }}
      body {{
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 28px;
        box-sizing: border-box;
        font-family: Inter, Arial, sans-serif;
        color: #2b2023;
        background:
          radial-gradient(circle at 18% 8%, rgba(163,133,96,.22), transparent 30%),
          radial-gradient(circle at 86% 12%, rgba(7,51,44,.16), transparent 28%),
          linear-gradient(180deg, #fbf7f1, #f3ece3);
      }}
      main {{
        width: min(620px, 100%);
        border-radius: 30px;
        padding: 34px;
        background: rgba(255,255,255,.96);
        box-shadow: 0 26px 80px rgba(80,36,42,.18);
        border: 1px solid rgba(80,36,42,.10);
        text-align: center;
        box-sizing: border-box;
        position: relative;
        overflow: hidden;
      }}
      main::before {{
        content: "";
        position: absolute;
        inset: 0;
        background:
          linear-gradient(90deg, rgba(80,36,42,.07), transparent 38%),
          radial-gradient(circle at top right, rgba(163,133,96,.18), transparent 36%);
        pointer-events: none;
      }}
      .content {{
        position: relative;
        z-index: 1;
      }}
      .mark {{
        width: 74px;
        height: 74px;
        margin: 0 auto 18px;
        border-radius: 24px;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, #A38560, #f7e7ce);
        color: #2b1114;
        box-shadow: 0 18px 34px rgba(163,133,96,.28);
      }}
      .mark svg {{
        width: 34px;
        height: 34px;
      }}
      .kicker {{
        margin: 0;
        color: #A38560;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 2.2px;
      }}
      h1 {{
        margin: 10px 0 12px;
        color: #50242A;
        font-family: Georgia, serif;
        font-size: clamp(42px, 8vw, 64px);
        line-height: .96;
      }}
      p {{
        margin: 10px auto;
        max-width: 500px;
        line-height: 1.62;
        font-weight: 800;
        color: #4c4144;
      }}
      .ref {{
        margin: 22px 0;
        padding: 15px 16px;
        border-radius: 18px;
        background: #f8f4ee;
        color: #50242A;
        word-break: break-word;
        border: 1px solid rgba(80,36,42,.06);
        font-weight: 900;
      }}
      .ref span {{
        display: block;
        margin-bottom: 5px;
        color: #75686a;
        font-size: 10px;
        letter-spacing: 1.4px;
        text-transform: uppercase;
      }}
      a {{
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 52px;
        margin-top: 16px;
        padding: 0 22px;
        border-radius: 16px;
        background: #50242A;
        color: #fff;
        text-decoration: none;
        font-weight: 900;
        box-shadow: 0 14px 30px rgba(80,36,42,.18);
      }}
      .hint {{
        color: #786c6f;
        font-size: 13px;
      }}
      @media (max-width: 560px) {{
        body {{
          padding: 16px;
          place-items: center;
        }}
        main {{
          padding: 28px 18px;
          border-radius: 26px;
        }}
        .mark {{
          width: 62px;
          height: 62px;
          border-radius: 21px;
        }}
        h1 {{
          font-size: 42px;
        }}
        p {{
          font-size: 15px;
        }}
        a {{
          width: 100%;
          box-sizing: border-box;
        }}
      }}
    </style>
  </head>
  <body>
    <main>
      <div class="content">
        <div class="mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M20 6 9 17l-5-5" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <p class="kicker">ZURI ELEGANCE CHECKOUT</p>
        <h1>Payment {escaped_status}</h1>
        <p>Thank you. Your payment has been received and your order is now being prepared.</p>
        <div class="ref"><span>Payment Reference</span>{escaped_reference}</div>
        <p class="hint">A confirmation email has been sent if the payment was successful.</p>
        <a href="{escaped_frontend_url}">View Order Confirmation</a>
      </div>
    </main>
  </body>
</html>""",
        mimetype="text/html",
    )


@app.route("/paystack/verify-order-payment", methods=["GET"])
def verify_order_payment():
    reference = request.args.get("reference")

    if not reference:
        return jsonify({"error": "Missing reference"}), 400

    if not PAYSTACK_SECRET_KEY:
        return jsonify({"error": "Missing Paystack secret key"}), 500

    headers = {
        "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.get(
            f"https://api.paystack.co/transaction/verify/{reference}",
            headers=headers,
            timeout=30,
        )

        result = response.json()

        if not response.ok or not result.get("status"):
            return jsonify({
                "error": result.get("message", "Payment verification failed")
            }), 400

        payment_data = result.get("data", {})
        payment_status = payment_data.get("status")

        if payment_status != "success":
            order = Order.query.filter_by(reference=reference).first()
            if order and order.status != "Paid":
                order.status = "Payment Failed"
                db.session.commit()

            return jsonify({
                "redirect_url": f"{FRONTEND_URL}/payment-failed?reference={reference}"
            }), 200

        order = Order.query.filter_by(reference=reference).first()

        if not order:
            return jsonify({"error": "Order not found"}), 404

        already_paid = order.status == "Paid"

        if not already_paid:
            for item in order.items:
                product = Product.query.get(item.product_id) if item.product_id else None

                if product:
                    product.stock = max(
                        0,
                        int(product.stock or 0) - int(item.quantity or 0)
                    )

        metadata = payment_data.get("metadata", {})

        coupon_code = metadata.get("coupon_code")
        discount_amount = float(metadata.get("discount_amount") or 0)

        order.status = "Paid"
        order.delivery_status = order.delivery_status or "Processing"

        order.coupon_code = coupon_code
        order.discount_amount = discount_amount

        if not order.tracking_number:
            order.tracking_number = f"TRK-{str(order.id).zfill(5)}"

        if not already_paid:
            create_notification(
                user_id=order.user_id,
                title="Order Confirmed ✨",
                message=f"Your Zuri Elegance order #{order.id} has been confirmed and is now being prepared.",
                notification_type="order",
            )

        db.session.commit()

        if not already_paid:
            notify_order_confirmed(order)

        return jsonify({
            "message": "Payment verified successfully",
            "status": order.status,
            "delivery_status": order.delivery_status,
            "reference": order.reference,
            "tracking_number": order.tracking_number,
            "order_id": order.id,
            "coupon_code": order.coupon_code,
            "discount_amount": order.discount_amount,
            "order": serialize_order(order),
        }), 200

    except Exception as e:
        db.session.rollback()
        print("PAYSTACK VERIFY ORDER ERROR:", e)

        return jsonify({
            "error": "Something went wrong"
        }), 500


@app.route("/start-email-verification", methods=["POST"])
def start_email_verification():
    try:
        data = request.get_json() or {}
        email = (data.get("email") or "").strip().lower()

        if not email:
            return jsonify({"error": "Email is required"}), 400

        verification = twilio_client.verify.v2.services(
            TWILIO_VERIFY_SERVICE_SID
        ).verifications.create(
            to=email,
            channel="email"
        )

        return jsonify({
            "message": "Verification email sent",
            "status": verification.status
        }), 200

    except Exception as e:
        print("START EMAIL VERIFICATION ERROR:", repr(e))
        return jsonify({"error": str(e)}), 500


@app.route("/track-order", methods=["GET"])
def track_order():
    tracking_number = request.args.get("tracking_number")
    reference = request.args.get("reference")

    if not tracking_number and not reference:
        return jsonify({"error": "tracking_number or reference is required"}), 400

    order = None

    if tracking_number:
        order = Order.query.filter_by(tracking_number=tracking_number).first()

    if not order and reference:
        order = Order.query.filter_by(reference=reference).first()

    if not order:
        return jsonify({"error": "Order not found"}), 404

    items = []
    for item in order.items:
        items.append({
            "name": item.name,
            "price": item.price,
            "quantity": item.quantity
        })

    return jsonify({
        "order_id": order.id,
        "reference": order.reference,
        "tracking_number": order.tracking_number,
        "status": order.status,
        "delivery_status": order.delivery_status,
        "delivery_address": order.delivery_address,
        "total": order.total,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "items": items
    }), 200


@app.route("/products", methods=["GET"])
@cross_origin()
def get_products():
    try:
        products = Product.query.all()

        result = []
        for p in products:
            result.append({
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "price": p.price,
                "category": p.category,
                "subcategory": p.subcategory,
                "brand": p.brand,
                "stock": p.stock,

                "promotion_text": p.promotion_text,
                "discount_percent": float(p.discount_percent or 0),

                "length": p.length,
                "density": p.density,
                "lace_type": p.lace_type,

                "image_url": p.image_url,
                "image_url_2": p.image_url_2,
                "image_url_3": p.image_url_3,
                "image_url_4": p.image_url_4,
            })

        return jsonify(result)

    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/orders/<int:user_id>", methods=["GET"])
def get_user_orders(user_id):
    orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()

    result = []

    for o in orders:
        items = []

        for item in o.items:
            product = Product.query.get(item.product_id) if item.product_id else None

            items.append({
                "product_id": item.product_id,
                "name": item.name,
                "price": float(item.price or 0),
                "quantity": item.quantity,
                "image_url": product.image_url if product else "",
            })

        result.append({
            "id": o.id,
            "status": o.status,
            "delivery_status": o.delivery_status,
            "total": float(o.total or 0),
            "created_at": o.created_at.isoformat() if o.created_at else "",
            "tracking_number": o.tracking_number,
            "reference": o.reference,
            "coupon_code": o.coupon_code,
            "discount_amount": float(o.discount_amount or 0),
            "items": items,
        })

    return jsonify(result)


@app.route("/orders/details/<int:order_id>", methods=["GET"])
def get_order_details(order_id):
    order = Order.query.get(order_id)

    if not order:
        return jsonify({"error": "Order not found"}), 404

    items = []

    for item in order.items:
        product = Product.query.get(item.product_id) if item.product_id else None

        items.append({
            "product_id": item.product_id,
            "name": item.name,
            "price": float(item.price or 0),
            "quantity": item.quantity,
            "image_url": product.image_url if product else "",
        })

    return jsonify({
        "id": order.id,
        "reference": order.reference,
        "tracking_number": order.tracking_number,
        "status": order.status,
        "delivery_status": order.delivery_status,
        "total": float(order.total or 0),
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "delivery_address": order.delivery_address,
        "items": items,
    })


@app.route("/profile/<int:user_id>", methods=["GET"])
@token_required
def get_profile(user_data, user_id):
    if int(user_data["user_id"]) != int(user_id) and not user_data.get("is_admin"):
        return jsonify({"error": "Unauthorized"}), 403

    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "id": user.id,
        "full_name": getattr(user, "full_name", "") or "",
        "email": user.email or "",
        "phone": user.phone or "",
        "address": getattr(user, "address", "") or "",
        "city": getattr(user, "city", "") or "",
        "is_admin": getattr(user, "is_admin", False),
    }), 200


@app.route("/profile/<int:user_id>/rewards", methods=["GET"])
@token_required
def get_profile_rewards(user_data, user_id):
    if int(user_data["user_id"]) != int(user_id) and not user_data.get("is_admin"):
        return jsonify({"error": "Unauthorized"}), 403

    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify(build_user_rewards(user_id)), 200


@app.route("/profile/<int:user_id>", methods=["PUT"])
@token_required
def update_profile(user_data, user_id):
    if int(user_data["user_id"]) != int(user_id) and not user_data.get("is_admin"):
        return jsonify({"error": "Unauthorized"}), 403

    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}

    full_name = (data.get("full_name") or "").strip()
    user.email = data.get("email", user.email)
    user.phone = data.get("phone", user.phone)
    user.address = data.get("address", getattr(user, "address", ""))
    user.city = data.get("city", getattr(user, "city", ""))

    if full_name:
        user.full_name = full_name

    db.session.commit()

    return jsonify({"message": "Profile updated successfully"}), 200


@app.route("/profile-session", methods=["GET"])
@token_required
def profile_session(user_data):
    return jsonify({
        "message": "Token is valid",
        "user": user_data
    }), 200



@app.route("/coupons/apply", methods=["POST"])
def apply_coupon():
    data = request.get_json() or {}

    code = (data.get("code") or "").strip().upper()
    subtotal = float(data.get("subtotal") or 0)

    if not code:
        return jsonify({"error": "Coupon code is required"}), 400

    coupon, error, discount = validate_coupon_for_subtotal(code, subtotal)

    if error:
        return jsonify({"error": error}), 400

    new_total = max(subtotal - discount, 0)

    return jsonify({
        "message": "Coupon applied successfully",
        "code": coupon.code,
        "discount": round(discount, 2),
        "new_total": round(new_total, 2),
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
    }), 200


@app.route("/recommendations/<int:user_id>", methods=["GET"])
def get_recommendations(user_id):
    try:
        latest_analysis = (
            BeautyAnalysis.query
            .filter_by(user_id=user_id)
            .order_by(BeautyAnalysis.created_at.desc())
            .first()
        )

        if latest_analysis:
            analysis_data = {
                "skin_type": latest_analysis.skin_type,
                "hair_focus": latest_analysis.hair_focus,
                "face_shape": latest_analysis.face_shape,
                "beauty_goal": latest_analysis.beauty_goal,
                "recommended_categories": json.loads(
                    latest_analysis.recommended_categories or "[]"
                ),
                "product_keywords": json.loads(
                    latest_analysis.product_keywords or "[]"
                ),
            }

            products = get_beauty_recommendations(analysis_data)

            if not products:
                fallback_products = (
                    Product.query
                    .filter(Product.stock > 0)
                    .order_by(Product.id.desc())
                    .limit(8)
                    .all()
                )

                products = [
                    serialize_product(product)
                    for product in fallback_products
                ]

            enhanced_products = []

            for product_data in products:
                product = Product.query.get(product_data["id"])

                if product:
                    product_data["ai_match_score"] = score_product_for_beauty_profile(
                        product,
                        analysis_data
                    )

                    product_data["ai_match_reason"] = build_ai_match_reason(
                        product,
                        analysis_data
                    )

                enhanced_products.append(product_data)

            enhanced_products.sort(
                key=lambda item: item.get("ai_match_score", 0),
                reverse=True
            )

            return jsonify(enhanced_products), 200

        fallback_products = (
            Product.query
            .filter(Product.stock > 0)
            .order_by(Product.id.desc())
            .limit(8)
            .all()
        )

        return jsonify([
            serialize_product(product)
            for product in fallback_products
        ]), 200

    except Exception as e:
        print("GET RECOMMENDATIONS ERROR:", e)

        fallback_products = (
            Product.query
            .filter(Product.stock > 0)
            .order_by(Product.id.desc())
            .limit(8)
            .all()
        )

        return jsonify([
            serialize_product(product)
            for product in fallback_products
        ]), 200


@app.route("/assistant-chat", methods=["POST"])
def assistant_chat():
    try:
        data = request.get_json() or {}
        messages = data.get("messages") or []
        user_id = data.get("user_id")

        if not isinstance(messages, list):
            return jsonify({"error": "Messages must be a list"}), 400

        cleaned_messages = []

        for message in messages[-10:]:
            if not isinstance(message, dict):
                continue

            role = message.get("role")
            content = str(message.get("content", "")).strip()

            if role in ["user", "assistant"] and content:
                cleaned_messages.append({
                    "role": role,
                    "content": content[:1200],
                })

        if not cleaned_messages:
            return jsonify({"error": "Please send a message"}), 400

        usage_check = check_ai_usage_limit("assistant", user_id)
        if not usage_check["allowed"]:
            return jsonify({
                "error": usage_check["error"],
                "limit_type": usage_check["limit_type"],
                "limit": usage_check["limit"],
                "used": usage_check["used"],
            }), 429

        context = get_assistant_context(user_id)
        reply, mode = generate_assistant_reply(cleaned_messages, context)
        record_ai_usage("assistant", usage_check)
        db.session.commit()

        return jsonify({
            "reply": reply,
            "mode": mode,
            "usage": {
                "daily_limit": usage_check["daily_limit"],
                "daily_used": usage_check["daily_used"] + 1,
                "monthly_limit": usage_check["monthly_limit"],
                "monthly_used": usage_check["monthly_used"] + 1,
            },
            "suggested_products": context.get("products", [])[:4],
        }), 200

    except Exception as e:
        db.session.rollback()
        print("ASSISTANT CHAT ROUTE ERROR:", e)
        return jsonify({"error": "Assistant chat failed"}), 500


@app.route("/notifications/<int:user_id>", methods=["GET"])
def get_notifications(user_id):
    notifications = (
        Notification.query
        .filter_by(user_id=user_id)
        .order_by(Notification.created_at.desc())
        .limit(20)
        .all()
    )

    return jsonify([
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notifications
    ]), 200


@app.route("/notifications/<int:user_id>/unread-count", methods=["GET"])
def get_unread_notifications_count(user_id):
    count = Notification.query.filter_by(
        user_id=user_id,
        is_read=False
    ).count()

    return jsonify({"unread_count": count}), 200


@app.route("/notifications/<int:notification_id>/read", methods=["PATCH"])
def mark_notification_read(notification_id):
    notification = Notification.query.get(notification_id)

    if not notification:
        return jsonify({"error": "Notification not found"}), 404

    notification.is_read = True
    db.session.commit()

    return jsonify({"message": "Notification marked as read"}), 200


@app.route("/notifications/<int:user_id>/read-all", methods=["PATCH"])
def mark_all_notifications_read(user_id):
    notifications = Notification.query.filter_by(
        user_id=user_id,
        is_read=False
    ).all()

    for notification in notifications:
        notification.is_read = True

    db.session.commit()

    return jsonify({"message": "All notifications marked as read"}), 200


@app.route("/notifications/test/<int:user_id>", methods=["POST"])
def create_test_notification(user_id):
    notification = Notification(
        user_id=user_id,
        title="Welcome to Zuri Elegance ✨",
        message="Your luxury beauty updates will appear here.",
        type="welcome"
    )

    db.session.add(notification)
    db.session.commit()

    return jsonify({"message": "Test notification created"}), 201


@app.route("/analyze-beauty", methods=["POST"])
def analyze_beauty():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        image = request.files["image"]

        if not image.filename:
            return jsonify({"error": "Invalid image"}), 400

        user_id = request.form.get("user_id")

        if not user_id:
            return jsonify({"error": "Missing user_id"}), 400

        usage_check = check_ai_usage_limit("beauty_analysis", user_id)
        if not usage_check["allowed"]:
            return jsonify({
                "error": usage_check["error"],
                "limit_type": usage_check["limit_type"],
                "limit": usage_check["limit"],
                "used": usage_check["used"],
            }), 429

        if USE_REAL_AI:
            analysis = analyze_beauty_with_openai(image)
        else:
            analysis = generate_mock_beauty_analysis()

        recommendations = get_beauty_recommendations(
            analysis.get("product_keywords", [])
        )

        beauty_analysis = BeautyAnalysis(
            user_id=user_id,

            skin_type=analysis.get("skin_type"),
            hair_focus=analysis.get("hair_focus"),
            face_shape=analysis.get("face_shape"),
            beauty_goal=analysis.get("beauty_goal"),

            summary=analysis.get("summary"),

            recommended_categories=json.dumps(
                analysis.get("recommended_categories", [])
            ),

            product_keywords=json.dumps(
                analysis.get("product_keywords", [])
            ),

            tips=json.dumps(
                analysis.get("tips", [])
            ),

            mode=analysis.get("mode", "mock"),
        )

        db.session.add(beauty_analysis)
        record_ai_usage("beauty_analysis", usage_check)
        db.session.commit()

        analysis["analysis_id"] = beauty_analysis.id
        analysis["recommended_products"] = recommendations
        analysis["usage"] = {
            "daily_limit": usage_check["daily_limit"],
            "daily_used": usage_check["daily_used"] + 1,
            "monthly_limit": usage_check["monthly_limit"],
            "monthly_used": usage_check["monthly_used"] + 1,
        }

        return jsonify(analysis), 200

    except Exception as e:
        db.session.rollback()

        print("BEAUTY ANALYSIS ERROR:", e)

        return jsonify({
            "error": "Beauty analysis failed"
        }), 500


@app.route("/beauty-analyses/<int:user_id>", methods=["GET"])
def get_beauty_analyses(user_id):
    try:
        analyses = (
            BeautyAnalysis.query
            .filter_by(user_id=user_id)
            .order_by(BeautyAnalysis.created_at.desc())
            .all()
        )

        return jsonify([
            {
                "id": analysis.id,
                "skin_type": analysis.skin_type,
                "hair_focus": analysis.hair_focus,
                "face_shape": analysis.face_shape,
                "beauty_goal": analysis.beauty_goal,
                "summary": analysis.summary,
                "recommended_categories": json.loads(analysis.recommended_categories or "[]"),
                "product_keywords": json.loads(analysis.product_keywords or "[]"),
                "tips": json.loads(analysis.tips or "[]"),
                "mode": analysis.mode,
                "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
            }
            for analysis in analyses
        ]), 200

    except Exception as e:
        print("GET BEAUTY ANALYSES ERROR:", e)
        return jsonify({"error": "Failed to load beauty analyses"}), 500


@app.route("/beauty-trends", methods=["GET"])
def beauty_trends():

    analyses = BeautyAnalysis.query.all()

    skin_types = {}
    hair_focuses = {}
    beauty_goals = {}

    for analysis in analyses:

        skin = (
            analysis.skin_type or "Unknown"
        )

        hair = (
            analysis.hair_focus or "Unknown"
        )

        goal = (
            analysis.beauty_goal or "Unknown"
        )

        skin_types[skin] = (
            skin_types.get(skin, 0) + 1
        )

        hair_focuses[hair] = (
            hair_focuses.get(hair, 0) + 1
        )

        beauty_goals[goal] = (
            beauty_goals.get(goal, 0) + 1
        )

    return jsonify({
        "top_skin_types": skin_types,
        "top_hair_focuses": hair_focuses,
        "top_beauty_goals": beauty_goals,
        "total_analyses": len(analyses)
    })


@app.route("/paystack/webhook", methods=["POST"])
def paystack_webhook():
    try:
        signature = request.headers.get("x-paystack-signature")
        payload = request.get_data()

        # 🔒 Verify Paystack signature
        expected_signature = hmac.new(
            PAYSTACK_SECRET_KEY.encode("utf-8"),
            payload,
            hashlib.sha512
        ).hexdigest()

        if signature != expected_signature:
            return "Invalid signature", 401

        
        data = request.get_json()
        event = data.get("event")

        if event == "charge.success":
            payment_data = data.get("data", {})
            reference = payment_data.get("reference")

            order = Order.query.filter_by(reference=reference).first()

            if order and order.status != "Paid":
                order.status = "Paid"

                # 🔥 Reduce stock
                for item in order.items:
                    product = Product.query.get(item.product_id)
                    if product:
                        product.stock = max(0, int(product.stock or 0) - int(item.quantity or 0))

                if not order.tracking_number:
                    order.tracking_number = f"TRK-{str(order.id).zfill(5)}"

                db.session.commit()
                notify_order_confirmed(order)

        return "OK", 200

    except Exception as e:
        print("WEBHOOK ERROR:", e)
        return "Error", 500


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True, 
        use_reloader=False)
