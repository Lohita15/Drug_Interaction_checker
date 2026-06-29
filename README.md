# 💊 Drug Interaction Checker

An AI-powered web application that helps users identify potential interactions between multiple medications. The application validates drug names, analyzes possible drug-drug interactions using the Hugging Face Inference API (Llama 3.1), and presents interaction risks in a simple, user-friendly interface.

> **Disclaimer:** This project is intended for educational and demonstration purposes only. It is **not** a substitute for professional medical advice.

---

## 🚀 Features

- ✅ Check interactions between **2–5 medications**
- ✅ AI-powered interaction analysis using **Llama 3.1**
- ✅ Validates drug names before analysis
- ✅ Displays:
  - Overall interaction risk
  - Interaction summary
  - Pairwise interaction details
- ✅ Drug history sidebar
- ✅ Export results
- ✅ Print reports
- ✅ Dark/Light theme toggle
- ✅ Upload medication list from a text file
- ✅ Responsive and modern user interface

---

## 🛠️ Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript (ES6)

### Backend
- Node.js
- Express.js

### AI Integration
- Hugging Face Inference API
- Meta Llama 3.1 8B Instruct

### Other Libraries
- dotenv
- cors
- node-fetch

---

## 📂 Project Structure

```
Drug_Interaction_checker/
│
├── app.js              # Frontend logic
├── server.js           # Express backend
├── index.html          # User interface
├── styles.css          # Styling
├── drugs.json          # Valid drug database
├── package.json
└── .env                # Hugging Face API token
```

---

## ⚙️ Installation

### Clone the repository

```bash
git clone https://github.com/yourusername/Drug_Interaction_checker.git
```

### Navigate to the project

```bash
cd Drug_Interaction_checker
```

### Install dependencies

```bash
npm install
```

### Create a `.env` file

```env
HF_TOKEN=your_huggingface_api_key
```

### Start the server

```bash
npm start
```

The application will run locally at:

```
http://localhost:3001
```

---

## 📖 How It Works

1. Enter two or more medicine names.
2. The backend validates each drug against the local database.
3. A structured prompt is sent to the Hugging Face API.
4. Llama 3.1 analyzes potential interactions.
5. The application displays:
   - Overall risk level
   - Summary of interactions
   - Detailed pairwise interaction information

---

## 📸 Screenshots

Add screenshots of:

- Home Page
- Drug Input Form
- Interaction Results
- History Sidebar

Example:

```
screenshots/
├── home.png
├── results.png
└── history.png
```

---

## 🔒 Validation

The application validates:

- Minimum of two medicines
- Maximum of five medicines
- Recognized drug names only
- Proper API responses
- JSON response formatting

---

## 📌 Future Improvements

- Drug dosage consideration
- Severity color coding
- PDF report generation
- Authentication system
- Drug information lookup
- Drug allergy warnings
- Real medical database integration
- Deployment on cloud platforms

---

## ⚠️ Disclaimer

This project is an AI-assisted educational demonstration and should not be used for real medical decision-making. Always consult qualified healthcare professionals before taking or combining medications.

---

## 👩‍💻 Author

**Lohitha Reddy**

Computer Science Engineering Student

Interested in:
- Artificial Intelligence
- Machine Learning
- Web Development
- Healthcare AI

---
