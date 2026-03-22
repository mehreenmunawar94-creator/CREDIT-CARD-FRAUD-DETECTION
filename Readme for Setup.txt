Download and Extraxt File to  "DESKTOP"
Files structure Must Be:
Mehreen/
├── app.py
├── train_model.py
├── requirements.txt
├── fraud_model.pkl          (generated after step 3)
├── templates/
│   ├── home.html
│   ├── login.html
│   ├── index.html
│   ├── transactions.html
│   ├── analytics.html
│   ├── models.html
│   ├── alerts.html
│   ├── user-management.html
│   ├── more.html
│   ├── settings.html
│   └── check-card.html
└── static/
    ├── css/
    │   ├── main.css
    │   └── components.css
    └── js/
        ├── auth.js
        ├── main.js
        ├── mockData.js
        ├── dashboard.js
        ├── transactions.js
        └── notifications.js
       OPEN CMD
Type.....

cd "C:\Users\dell\OneDrive\Desktop\CREDIT CARD FRAUD DETECTION"

pip install -r requirements.txt

python train_model.py

python app.py


 * Running on http://127.0.0.1:5000     	
Thats all the server is running on local host................
