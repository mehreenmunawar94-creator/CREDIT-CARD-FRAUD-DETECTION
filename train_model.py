import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import os

print("=" * 50)
print("FraudGuard - Training ML Model")
print("=" * 50)

# Generate synthetic data
np.random.seed(42)
n_samples = 10000

print(f"\n📊 Generating {n_samples} synthetic transactions...")

amount = np.random.exponential(scale=100, size=n_samples).clip(1, 5000)
hour = np.random.randint(0, 24, size=n_samples)
is_international = np.random.choice([0, 1], size=n_samples, p=[0.9, 0.1])
merchant_category = np.random.randint(0, 10, size=n_samples)

X = np.column_stack([amount, hour, is_international, merchant_category])

# Generate fraud labels (1 = fraud, 0 = legitimate)
prob_fraud = (amount > 500) * 0.3 + (hour < 6) * 0.2 + (is_international == 1) * 0.3
prob_fraud = np.clip(prob_fraud + np.random.normal(0, 0.1, n_samples), 0, 1)
y = (prob_fraud > 0.5).astype(int)

fraud_count = y.sum()
legit_count = n_samples - fraud_count
print(f"✅ Legitimate: {legit_count} ({legit_count/n_samples*100:.1f}%)")
print(f"⚠️ Fraudulent: {fraud_count} ({fraud_count/n_samples*100:.1f}%)")

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
print("\n🤖 Training Random Forest model...")
model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    random_state=42,
    n_jobs=-1,
    verbose=0
)
model.fit(X_train, y_train)

# Evaluate
print("\n📈 Model Performance:")
y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred, target_names=['Legitimate', 'Fraudulent']))

# Save model
model_path = 'fraud_model.pkl'
joblib.dump(model, model_path)
print(f"\n✅ Model saved as '{model_path}'")

# Test prediction
test_transaction = np.array([[750, 2, 1, 3]])  # High amount, late night, international
prob = model.predict_proba(test_transaction)[0][1]
print(f"\n🔍 Test prediction (high-risk transaction): {prob*100:.1f}% fraud probability")

print("\n" + "=" * 50)
print("Training complete! Run 'python app.py' to start the server")
print("=" * 50)