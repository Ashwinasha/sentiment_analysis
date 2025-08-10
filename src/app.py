from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import XLMRobertaTokenizer, XLMRobertaForSequenceClassification
import torch
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)

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

    # Accept list or single string
    texts = [text] if isinstance(text, str) else text
    if not isinstance(texts, list):
        return jsonify({'error': 'Invalid input format'}), 400

    # Tokenize
    inputs = tokenizer(texts, return_tensors='pt', padding=True, truncation=True, max_length=128)
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probs = torch.softmax(logits, dim=1)
        predicted_classes = torch.argmax(probs, dim=1)

    results = []
    for i in range(len(texts)):
        label_index = predicted_classes[i].item()
        label = label_map[label_index]
        confidence = probs[i][label_index].item()

        log_prediction(texts[i], label, confidence)

        results.append({
            "text": texts[i],
            "label": label,
            "confidence": confidence
        })

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
