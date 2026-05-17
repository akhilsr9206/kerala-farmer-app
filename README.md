Created By Adithya Sanker(AM.SC.P2AML25001) & Akhil S R (AM.SC.P2AML25003)
# 🌾 AI-Powered Smart Agriculture Assistant for Kerala Farmers

An intelligent full-stack agriculture platform designed to help Kerala farmers make smarter farming decisions using Artificial Intelligence, Machine Learning, and Generative AI.

This platform provides:
- 🌱 AI-based Crop Planning
- 📈 Yield Prediction
- 🐛 Pest & Disease Detection
- 🤖 RAG-based AI Chatbot
- 💹 Real-time Market Intelligence
- 🌦️ Weather Integration

The system combines Machine Learning, Generative AI, and Retrieval-Augmented Generation (RAG) into a single smart farming ecosystem tailored for Kerala farmers.

---

# 🚀 Features

## 🌾 AI Crop Planning
Provides intelligent crop recommendations based on:
- Soil conditions
- Seasonal patterns
- Weather conditions
- Market trends

---

## 📈 Yield Prediction
Uses XGBoost Machine Learning models trained on agricultural datasets to predict crop yield accurately.

### Performance
- **Accuracy (R² Score):** ~88%

---

## 🐛 Pest & Disease Detection
Analyzes crop images to detect:
- Plant diseases
- Pest infections
- Crop health issues

Provides actionable suggestions to farmers.

---

## 🤖 AI Chatbot (RAG-Based)
An intelligent farming assistant powered by:
- Groq LLM
- LangChain
- FAISS Vector Database

The chatbot answers farmer queries using verified agricultural documents through Retrieval-Augmented Generation (RAG).

---

## 💹 Real-Time Market Intelligence
Fetches live market prices using APIs to help farmers:
- Analyze market trends
- Sell crops at better prices
- Make informed decisions

---

## 🌦️ Weather Integration
Provides real-time weather insights for:
- Crop planning
- Irrigation decisions
- Harvest timing

---

# 🛠️ Tech Stack

## Frontend
- React.js
- Axios
- CSS

## Backend
- FastAPI (Python)

## AI / ML Layer
- XGBoost
- Groq LLM
- LangChain
- FAISS

## Database
- SQLite

---

# 🏗️ System Architecture

The platform consists of:
- React Frontend
- FastAPI Backend
- ML Prediction Engine
- RAG-based Chatbot
- Real-time API Integrations
- SQLite Database

All modules are integrated into a single intelligent farming platform.

---

# 📦 Application Modules

## 1️⃣ User Authentication
- Secure Login/Register
- Farmer Profile Management

## 2️⃣ Dashboard
Displays:
- Weather Updates
- Farm Insights
- Alerts
- Market Information

## 3️⃣ Crop Planner
AI-based crop recommendation system.

## 4️⃣ Yield Predictor
Predicts harvest output using Machine Learning algorithms.

## 5️⃣ Pest Detection
Image-based crop disease identification system.

## 6️⃣ Market Intelligence
Live commodity prices and market trend analysis.

## 7️⃣ AI Chatbot
Conversational assistant for instant farming guidance.

---

# 📊 Results & Performance

## ✅ Achievements
- Successfully developed a full-stack AI agriculture assistant
- Integrated ML, Generative AI, and RAG
- Real-time market and weather integration
- Personalized farming recommendations

## ⚡ Performance Metrics
- Yield Prediction Accuracy: **88%**
- Response Time: **< 2 seconds**
- Stable System Performance
- Smooth and Responsive UI

---

# 📸 Screenshots

## Dashboard
- Weather overview
- Crop distribution
- Farming insights

## AI Chatbot
- Context-aware farming guidance

## Pest Detector
- Disease identification using images

## Market Intelligence
- Live crop price tracking

---

# ⚙️ Installation & Setup

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/ai-smart-agriculture-assistant.git

cd ai-smart-agriculture-assistant
```

---

## 2️⃣ Backend Setup

```bash
cd backend

python -m venv venv
```

### Activate Virtual Environment

#### Windows
```bash
venv\Scripts\activate
```

#### Linux/Mac
```bash
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run Backend Server

```bash
uvicorn main:app --reload
```

---

## 3️⃣ Frontend Setup

```bash
cd frontend

npm install

npm start
```

---

# 🔑 Environment Variables

Create a `.env` file inside the backend directory:

```env
GROQ_API_KEY=your_api_key
WEATHER_API_KEY=your_api_key
MARKET_API_KEY=your_api_key
```

---

# 📂 Project Structure

```bash
AI-Smart-Agriculture-Assistant/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── chatbot/
│   ├── database/
│   ├── main.py
│   └── requirements.txt
│
├── dataset/
├── screenshots/
├── README.md
└── .env
```

---

# 🔮 Future Scope

- 📱 Mobile Application (Android & iOS)
- 🌡️ IoT Sensor Integration
- 💧 Smart Irrigation System
- 🚁 Drone-Based Crop Monitoring
- 🧠 Deep Learning for Disease Detection
- 🛒 Farmer-to-Buyer Marketplace

---

# 🧩 Challenges Faced

## Challenges
- API integration issues
- Model training complexity
- Data availability
- UI responsiveness

## Solutions
- Used fallback APIs
- Optimized ML models
- Improved UI performance
- Added static fallback data

---

# 🤝 Contributors

## 👨‍💻 Akhil S R
AM.SC.P2AML25003

## 👨‍💻 Adithya Sanker
AM.SC.P2AML25001

---

# 📜 License

This project is developed for academic and educational purposes.

---

# 🌟 Conclusion

This project demonstrates how Artificial Intelligence, Machine Learning, and Generative AI can transform agriculture by helping farmers make data-driven decisions related to:
- Planning
- Prediction
- Productivity
- Market Analysis

It acts as a complete smart farming assistant tailored for Kerala’s agricultural ecosystem.

---

# ⭐ Support

If you like this project, give it a ⭐ on GitHub!
