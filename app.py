from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_cors import CORS
import joblib
import numpy as np
import os
import json
from datetime import timedelta
import hashlib
import functools

app = Flask(__name__, 
            static_folder='static', 
            template_folder='templates')
app.secret_key = 'fraudguard_secure_key_2026'
app.permanent_session_lifetime = timedelta(days=1)
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
CORS(app, supports_credentials=True)

# File to store registered users
USERS_FILE = 'users.json'

# Initialize users file if it doesn't exist
if not os.path.exists(USERS_FILE):
    with open(USERS_FILE, 'w') as f:
        def hash_password(pwd):
            return hashlib.sha256(pwd.encode()).hexdigest()
        
        default_users = [
            {
                'id': 1,
                'firstName': 'John',
                'lastName': 'Doe',
                'email': 'user@example.com',
                'username': 'user',
                'password': hash_password('user123'),
                'role': 'user',
                'registeredAt': '2026-01-01T00:00:00.000Z'
            },
            {
                'id': 2,
                'firstName': 'Admin',
                'lastName': 'User',
                'email': 'admin@fraudguard.com',
                'username': 'admin',
                'password': hash_password('admin123'),
                'role': 'admin',
                'registeredAt': '2026-01-01T00:00:00.000Z'
            }
        ]
        json.dump(default_users, f, indent=2)
        print("✅ Default users created")

# Load pre-trained model
model = None
if os.path.exists('fraud_model.pkl'):
    model = joblib.load('fraud_model.pkl')
    print("✅ ML Model loaded successfully")
else:
    print("⚠️ No model found. Run train_model.py first")

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def login_required(f):
    """Decorator to check if user is logged in"""
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Decorator to check if user is admin"""
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        if session.get('role') != 'admin':
            # If not admin, redirect to user page
            return redirect(url_for('check_card'))
        return f(*args, **kwargs)
    return decorated_function

# ==================== PAGE ROUTES ====================

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/register')
def register():
    if 'user_id' in session:
        if session.get('role') == 'admin':
            return redirect(url_for('dashboard'))
        else:
            return redirect(url_for('check_card'))
    return render_template('register.html')

@app.route('/login')
def login():
    if 'user_id' in session:
        if session.get('role') == 'admin':
            return redirect(url_for('dashboard'))
        else:
            return redirect(url_for('check_card'))
    return render_template('login.html')

@app.route('/dashboard')
@admin_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/check-card')
@login_required
def check_card():
    return render_template('check-card.html')

@app.route('/transactions')
@admin_required
def transactions():
    return render_template('transactions.html')

@app.route('/analytics')
@admin_required
def analytics():
    return render_template('analytics.html')

@app.route('/models')
@admin_required
def models():
    return render_template('models.html')

@app.route('/alerts')
@admin_required
def alerts():
    return render_template('alerts.html')

@app.route('/user-management')
@admin_required
def user_management():
    return render_template('user-management.html')

@app.route('/more')
@login_required
def more():
    return render_template('more.html')

@app.route('/settings')
@login_required
def settings():
    return render_template('settings.html')

# ==================== API ROUTES ====================

@app.route('/api/register', methods=['POST'])
def api_register():
    try:
        data = request.json
        required = ['firstName', 'lastName', 'email', 'username', 'password']
        for field in required:
            if field not in data or not data[field]:
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        with open(USERS_FILE, 'r') as f:
            users = json.load(f)
        
        for user in users:
            if user['email'].lower() == data['email'].lower():
                return jsonify({'success': False, 'message': 'Email already registered'}), 400
            if user['username'].lower() == data['username'].lower():
                return jsonify({'success': False, 'message': 'Username already taken'}), 400
        
        new_user = {
            'id': len(users) + 1,
            'firstName': data['firstName'].strip(),
            'lastName': data['lastName'].strip(),
            'email': data['email'].lower().strip(),
            'username': data['username'].lower().strip(),
            'password': hash_password(data['password']),
            'phone': data.get('phone', ''),
            'role': 'user',
            'registeredAt': data.get('registeredAt', '')
        }
        
        users.append(new_user)
        
        with open(USERS_FILE, 'w') as f:
            json.dump(users, f, indent=2)
        
        return jsonify({
            'success': True,
            'message': 'Registration successful! Please login.'
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def api_login():
    try:
        data = request.json
        identifier = data.get('identifier', '').lower().strip()
        password = data.get('password', '')
        
        if not identifier or not password:
            return jsonify({'success': False, 'message': 'Identifier and password required'}), 400
        
        with open(USERS_FILE, 'r') as f:
            users = json.load(f)
        
        user = None
        for u in users:
            if u['email'].lower() == identifier or u['username'].lower() == identifier:
                if u['password'] == hash_password(password):
                    user = u
                    break
        
        if user:
            session.permanent = True
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['role'] = user['role']
            session['name'] = f"{user['firstName']} {user['lastName']}"
            session.modified = True
            
            if user['role'] == 'admin':
                redirect_url = url_for('dashboard')
            else:
                redirect_url = url_for('check_card')
            
            return jsonify({
                'success': True,
                'redirect': redirect_url,
                'role': user['role'],
                'user': {
                    'id': user['id'],
                    'name': f"{user['firstName']} {user['lastName']}",
                    'email': user['email'],
                    'role': user['role']
                }
            })
        
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({'success': True, 'redirect': url_for('home')})

@app.route('/api/check-session')
def check_session():
    if 'user_id' in session:
        return jsonify({
            'authenticated': True,
            'user': {
                'id': session['user_id'],
                'name': session.get('name', ''),
                'role': session.get('role', ''),
                'username': session.get('username', '')
            }
        })
    return jsonify({'authenticated': False})

@app.route('/api/user/current')
def get_current_user():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401
    
    return jsonify({
        'id': session['user_id'],
        'name': session.get('name', ''),
        'username': session.get('username', ''),
        'role': session.get('role', '')
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        amount = float(data.get('amount', 0))
        hour = int(data.get('time', '12:00').split(':')[0])
        is_intl = 1 if data.get('transactionType') == 'international' else 0
        
        prob = 0
        if amount > 1000:
            prob += 25
        elif amount > 500:
            prob += 15
        if is_intl:
            prob += 20
        if 0 <= hour < 5:
            prob += 15
        
        fraud_prob = min(round(prob + (hash(str(data)) % 20)), 99)
        
        if fraud_prob >= 70:
            risk_level = 'High'
        elif fraud_prob >= 40:
            risk_level = 'Medium'
        else:
            risk_level = 'Low'
        
        return jsonify({
            'fraud_probability': fraud_prob,
            'risk_level': risk_level
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/contact', methods=['POST'])
def api_contact():
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        subject = data.get('subject')
        message = data.get('message')
        
        print(f"📧 Contact Form Submission:")
        print(f"   From: {name} <{email}>")
        print(f"   Subject: {subject}")
        print(f"   Message: {message}")
        print(f"   Would email to: mehreen1204@gmail.com")
        
        return jsonify({
            'success': True,
            'message': 'Message sent successfully'
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/users', methods=['GET'])
@admin_required
def get_users():
    try:
        with open(USERS_FILE, 'r') as f:
            users = json.load(f)
        
        for user in users:
            if 'password' in user:
                del user['password']
        
        return jsonify(users)
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found_error(error):
    return redirect(url_for('home'))

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# ==================== MAIN ====================

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 FraudGuard Application Starting...")
    print("=" * 60)
    print("✅ Available routes:")
    print("   🌐 Public:")
    print("      - /")
    print("      - /register")
    print("      - /login")
    print("   🔒 User (requires login):")
    print("      - /check-card")
    print("      - /more")
    print("      - /settings")
    print("   👑 Admin (requires admin):")
    print("      - /dashboard")
    print("      - /transactions")
    print("      - /analytics")
    print("      - /models")
    print("      - /alerts")
    print("      - /user-management")
    print("=" * 60)
    print("🌐 Server running at: http://127.0.0.1:5000")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)