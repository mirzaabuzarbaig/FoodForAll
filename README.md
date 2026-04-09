# 🏪 Smart Ration Shop (FoodForAll)

A digital ration shop management system that streamlines the distribution of food items to beneficiaries using smart technology.

## 🚀 Features

- 📋 Beneficiary management
- 🛒 Ration issuance tracking
- 🔐 Admin panel with role-based access
- 📊 Dashboard with real-time stats
- 🤖 ML-powered services for smart predictions

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js (Express)
- **ML Service**: Python (Flask)
- **Database**: MySQL

## ⚙️ Setup & Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mirzaabuzarbaig/FoodForAll.git
   cd FoodForAll
   ```

2. **Install Node dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

4. **Install Python dependencies**
   ```bash
   pip install -r ml/requirements.txt
   ```

5. **Start the application**
   ```bash
   start.bat
   # or manually:
   node server.js
   ```

## 📁 Project Structure

```
smart-ration-shop/
├── public/          # Frontend HTML pages
├── ml/              # Python ML service
├── server.js        # Node.js backend
├── ml_services.py   # Flask ML API
├── .env.example     # Environment variable template
└── vercel.json      # Deployment config
```

## 🌐 Deployment

Configured for deployment on **Vercel** via `vercel.json`.

## 📄 License

MIT License
