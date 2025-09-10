from flask import Flask, request, jsonify, session
from flask_cors import CORS
from transformers import XLMRobertaTokenizer, XLMRobertaForSequenceClassification
import torch
import sqlite3
from datetime import datetime
import re
from flask_mail import Mail, Message
import random
import hashlib
from datetime import timedelta



app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])
 


# Flask-Mail configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'ashwinvenu1809@gmail.com'        # Your Gmail
app.config['MAIL_PASSWORD'] = 'bsftgqihhuaajbon'           # Gmail App Password
app.config['MAIL_DEFAULT_SENDER'] = 'ashwinvenu1809@gmail.com'  # Optional
mail = Mail(app)

# Load model and tokenizer
model_path = 'E:/semester 8/NLP project/BERT/BERT/sentiment-analyzer/fine_tuned_bert'  # Adjust path
tokenizer = XLMRobertaTokenizer.from_pretrained(model_path)
model = XLMRobertaForSequenceClassification.from_pretrained(model_path)
model.eval()

# Move to GPU if available
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

# Label mapping
label_map = {0: "Positive", 1: "Neutral", 2: "Negative"}

# preprocessing function
def preprocess_text(text, map_emoji=False):
    # Normalize whitespace
    text = " ".join(text.split())
    # Replace URLs with placeholder
    text = re.sub(r"http\S+", "URL", text)
    # Replace mentions with placeholder
    text = re.sub(r"@\w+", "USER", text)

    return text


DB_FILE = 'users.db'

# Helper function to connect to DB
def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

# Function to initialize DB and create users table
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            username TEXT UNIQUE,
            password TEXT,
            otp TEXT,
            otp_expiry TEXT
        )
    ''')
    conn.commit()
    conn.close()

# Call this function at startup
init_db()

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def generate_otp():
    return str(random.randint(100000, 999999))


@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    username = data.get('username')
    password = data.get('password')

    if not all([name, email, username, password]):
        return jsonify({'error': 'All fields are required'}), 400

    hashed_password = hash_password(password)

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Ensure email exists and OTP is verified
        cursor.execute("SELECT otp FROM users WHERE email=?", (email,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Email not registered for OTP'}), 400

        # Check if username is already taken
        cursor.execute("SELECT id FROM users WHERE username=?", (username,))
        if cursor.fetchone():
            return jsonify({'error': 'Username already exists'}), 400

        # Update user info and clear OTP
        cursor.execute(
            "UPDATE users SET name=?, username=?, password=?, otp=NULL, otp_expiry=NULL WHERE email=?",
            (name, username, hashed_password, email)
        )
        conn.commit()
    finally:
        conn.close()

    return jsonify({'success': 'User registered successfully'})




app.secret_key = "secret123"

#login
# Make session non-permanent (ends when browser/tab closes)



@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Missing JSON body'}), 400

        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400

        hashed_password = hash_password(password)

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM users WHERE username=? AND password=?",
            (username, hashed_password)
        )
        user = cursor.fetchone()
        conn.close()

        if user:
            # Save user in session (expires when tab/browser closes)
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['email'] = user['email']
            session.permanent = False  # ensure non-persistent session

            return jsonify({
                'success': 'Login successful',
                'id': user['id'],
                'username': user['username'],
                'name': user['name'],
                'email': user['email']
            })
        else:
            return jsonify({'error': 'Invalid username or password'}), 401

    except Exception as e:
        print("Login route error:", e)
        return jsonify({'error': 'Server internal error'}), 500


@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': 'Logged out successfully'})

@app.route('/current-user', methods=['GET'])
def current_user():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, username, email FROM users WHERE id=?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({
        'id': user['id'],
        'name': user['name'],
        'username': user['username'],
        'email': user['email']
    })


# Get user info by ID (including email)
@app.route('/user/<int:user_id>', methods=['GET'])
def get_user(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, username, email FROM users WHERE id=?", (user_id,))
        user = cursor.fetchone()
        conn.close()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Return all user info including email
        return jsonify({
            'id': user['id'],
            'name': user['name'],
            'username': user['username'],
            'email': user['email']
        })

    except Exception as e:
        print("Error fetching user:", e)
        return jsonify({'error': 'Server error fetching user'}), 500


@app.route('/register-send-otp', methods=['POST'])
def register_send_otp():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if email already exists
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    existing_user = cursor.fetchone()

    if existing_user:
        conn.close()
        return jsonify({'error': 'Email is already registered'}), 400

    # Generate OTP
    otp = generate_otp()
    expiry = (datetime.now() + timedelta(minutes=5)).isoformat()

    # Store temporary record with OTP
    cursor.execute("INSERT INTO users (email, otp, otp_expiry) VALUES (?, ?, ?)", (email, otp, expiry))
    conn.commit()
    conn.close()

    # Send OTP via email
    try:
        msg = Message("Your Registration OTP", recipients=[email])
        msg.body = f"Your OTP is: {otp}. Valid for 5 minutes."
        mail.send(msg)
    except Exception as e:
        return jsonify({'error': f'Failed to send OTP: {str(e)}'}), 500

    return jsonify({'success': 'OTP sent to email'})




@app.route('/register-verify-otp', methods=['POST'])
def register_verify_otp():
    data = request.get_json()
    email = data.get('email')
    otp = data.get('otp')

    if not all([email, otp]):
        return jsonify({'error': 'Email and OTP required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT otp, otp_expiry FROM users WHERE email=?", (email,))
    user = cursor.fetchone()
    conn.close()

    if not user or user['otp'] != otp:
        return jsonify({'error': 'Invalid OTP'}), 400

    if datetime.fromisoformat(user['otp_expiry']) < datetime.now():
        return jsonify({'error': 'OTP expired'}), 400

    return jsonify({'success': 'OTP verified'})



# Send OTP for forgot password
@app.route('/send-otp', methods=['POST'])
def send_otp():
    data = request.get_json()
    email = data.get('email')

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email=?", (email,))
    user = cursor.fetchone()

    if not user:
        return jsonify({'error': 'Email not registered'}), 400

    otp = generate_otp()
    expiry = (datetime.now() + timedelta(minutes=5)).isoformat()

    cursor.execute("UPDATE users SET otp=?, otp_expiry=? WHERE email=?", (otp, expiry, email))
    conn.commit()
    conn.close()

    # Send OTP email
    try:
        msg = Message("Your OTP Code", recipients=[email])
        msg.body = f"Your OTP for password reset is: {otp}. It is valid for 5 minutes."
        mail.send(msg)
    except Exception as e:
        return jsonify({'error': f'Failed to send email: {str(e)}'}), 500

    return jsonify({'success': 'OTP sent to email'})

# Verify OTP
@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    email = data.get('email')
    otp = data.get('otp')

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT otp, otp_expiry FROM users WHERE email=?", (email,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        return jsonify({'error': 'Email not registered'}), 400

    if user['otp'] != otp:
        return jsonify({'error': 'Invalid OTP'}), 400

    if datetime.fromisoformat(user['otp_expiry']) < datetime.now():
        return jsonify({'error': 'OTP expired'}), 400

    return jsonify({'success': 'OTP verified'})

# Reset password
@app.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    email = data.get('email')
    new_password = data.get('password')

    hashed_password = hash_password(new_password)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET password=?, otp=NULL, otp_expiry=NULL WHERE email=?", (hashed_password, email))
    conn.commit()
    conn.close()

    return jsonify({'success': 'Password updated successfully'})


# Update user info
# Flask backend (app.py)
@app.route('/user/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Missing JSON body'}), 400

        name = data.get('name')
        username = data.get('username')

        if not name or not username:
            return jsonify({'error': 'Name and username required'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE users SET name = ?, username = ? WHERE id = ?",
            (name, username, user_id)
        )
        conn.commit()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        updated_user = cursor.fetchone()
        conn.close()

        if updated_user:
            return jsonify({
                'id': updated_user['id'],
                'name': updated_user['name'],
                'username': updated_user['username'],
                'email': updated_user['email']
            })
        else:
            return jsonify({'error': 'User not found'}), 404

    except Exception as e:
        print("Update user error:", e)
        return jsonify({'error': 'Server internal error'}), 500



# Sentiment trend over time
@app.route('/dashboard-history', methods=['GET'])
def dashboard_history():
    conn = sqlite3.connect('sentiment_logs.db')
    cursor = conn.cursor()

    # Group by DATE (not full timestamp)
    cursor.execute('''
        SELECT DATE(timestamp),
               SUM(CASE WHEN sentiment = 'Positive' THEN 1 ELSE 0 END) as Positive,
               SUM(CASE WHEN sentiment = 'Neutral' THEN 1 ELSE 0 END) as Neutral,
               SUM(CASE WHEN sentiment = 'Negative' THEN 1 ELSE 0 END) as Negative
        FROM sentiment_logs
        GROUP BY DATE(timestamp)
        ORDER BY DATE(timestamp)
    ''')
    rows = cursor.fetchall()
    conn.close()

    history = []
    for row in rows:
        history.append({
            "date": row[0],
            "Positive": row[1],
            "Neutral": row[2],
            "Negative": row[3]
        })

    return jsonify(history)



# Log predictions to SQLite
def log_prediction(text, label, confidence):
    conn = sqlite3.connect('sentiment_logs.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sentiment_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT,
            sentiment TEXT,
            confidence REAL,
            timestamp TEXT
        )
    ''')
    cursor.execute('''
        INSERT INTO sentiment_logs (text, sentiment, confidence, timestamp)
        VALUES (?, ?, ?, ?)
    ''', (text, label.strip(), confidence, datetime.now().isoformat()))
    conn.commit()
    conn.close()

# recent-predictions
@app.route('/recent-predictions', methods=['GET'])
def recent_predictions():
    conn = sqlite3.connect('sentiment_logs.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT text, sentiment, confidence, timestamp
        FROM sentiment_logs
        ORDER BY id DESC
    ''')
    rows = cursor.fetchall()
    conn.close()

    result = [{
        "text": row[0],
        "sentiment": row[1],
        "confidence": row[2],
        "timestamp": row[3]
    } for row in rows]

    return jsonify(result)

# Predict sentiment
@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    text = data.get('text', '')

    if not text:
        return jsonify({'error': 'No text provided'}), 400

    # Convert input to list for uniform processing
    if isinstance(text, str):
        texts = [text]
    elif isinstance(text, list):
        texts = text
    else:
        return jsonify({'error': 'Invalid input format'}), 400

    # Preprocess all texts (single text or CSV batch)
    texts = [preprocess_text(t) for t in texts]

    # Tokenize
    inputs = tokenizer(texts, return_tensors='pt', padding=True, truncation=True, max_length=128)
    inputs = {k: v.to(device) for k, v in inputs.items()}

    # Model inference
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probs = torch.softmax(logits, dim=1)
        predicted_classes = torch.argmax(probs, dim=1)

    # Prepare results
    results = []
    for i in range(len(texts)):
        label_index = predicted_classes[i].item()
        label = label_map[label_index]
        confidence = probs[i][label_index].item()

        # Optional: log prediction
        log_prediction(texts[i], label, confidence)

        results.append({
            "text": texts[i],
            "label": label,
            "confidence": confidence
        })

    # Return single dict if input was string, list if CSV batch
    return jsonify(results[0] if isinstance(text, str) else results)



# Dashboard sentiment counts
@app.route('/dashboard-data', methods=['GET'])
def dashboard_data():
    conn = sqlite3.connect('sentiment_logs.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT sentiment, COUNT(*) FROM sentiment_logs GROUP BY sentiment
    ''')
    rows = cursor.fetchall()
    conn.close()

    counts = {"Positive": 0, "Neutral": 0, "Negative": 0}
    for sentiment, count in rows:
        counts[sentiment.strip()] = count

    return jsonify(counts)

#  Run the app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3002)
