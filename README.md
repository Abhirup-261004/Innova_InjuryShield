<div align="center">

# 🛡️ InjuryShield

### AI-Driven Adaptive Workout Planning & Injury Risk Prediction System

[![Live Demo](https://img.shields.io/badge/🚀%20Live-Demo-green?style=for-the-badge)](https://injuryshield.vercel.app)
[![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue?style=for-the-badge&logo=mongodb)](#-tech-stack)
[![Status](https://img.shields.io/badge/Project-Active-success?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](#-license)

**Stop tracking injuries. Start preventing them.**

[🌐 Live Demo](https://injuryshield.vercel.app) · [🐛 Report Bug](https://github.com/Abhirup-261004/Innova_InjuryShield/issues) · [✨ Request Feature](https://github.com/Abhirup-261004/Innova_InjuryShield/issues)

</div>

---

## 📌 Overview

**InjuryShield** is an intelligent fitness management platform built to **prevent musculoskeletal injuries** caused by improper workload progression and inadequate recovery monitoring.

Unlike conventional fitness trackers that merely log activity, InjuryShield applies **sports science principles** and adaptive algorithms to proactively detect injury risk and dynamically adjust workout intensity — transforming fitness tracking from passive monitoring to **proactive injury prevention and performance optimization**.

---

## 🧠 Core Concept: ACWR Model

The system is built on the scientifically validated **Acute-Chronic Workload Ratio (ACWR)** model:

```
Acute Load  →  7-day cumulative training load
Chronic Load  →  28-day rolling average
ACWR Ratio  →  Detects unsafe workload spikes
```

Combined with real-time recovery indicators:

| Indicator | Description |
|-----------|-------------|
| 😴 Sleep Duration | Hours of sleep logged |
| 😓 Fatigue Level | Subjective energy rating |
| 💪 Muscle Soreness | Soreness rating per muscle group |
| 🧠 Stress Rating | Mental stress self-assessment |
| 📍 Pain Reports | Localized pain mapping |

These inputs generate a **Composite Injury Risk Score (0–100)**:

| Score | Risk Level | Action |
|-------|------------|--------|
| 0 – 33 | 🟢 **Low** | Proceed with planned training |
| 34 – 66 | 🟡 **Moderate** | Reduce intensity, monitor closely |
| 67 – 100 | 🔴 **High** | Deload or rest recommended |

---

## 🔥 Key Features

### 🛡️ Injury Risk Prediction
- ACWR-based workload spike detection
- Recovery-adjusted composite risk scoring
- Overtraining detection and alerts

### ⚙️ Adaptive Workout Engine
- Automatic deload phase scheduling
- Recovery session recommendations
- Progressive overload when athlete is ready
- Intelligent weekly periodization

### 🏋️ Workout & Performance Tracking
- Real-time session logging
- Estimated 1RM (one-rep max) calculation
- Strength progression analytics
- Training plateau detection

### 🔄 Smart Exercise Substitution
- Replaces high-risk exercises when pain is reported
- Maintains balanced muscle group engagement

### 📊 Interactive Analytics Dashboard
- Weekly workload trend charts
- Muscle group heatmaps
- Strength progression graphs
- Risk score visualization panels

### 🎯 Additional Modules
- Goal-based workout templates
- Calendar-based scheduling
- Gamified milestone system
- Wearable device integration (roadmap)

---

## 🏗️ Architecture

```
User Input (Workout Session + Daily Recovery Check-in)
           ↓
  Load Calculation (Acute Load + Chronic Load)
           ↓
       ACWR Computation
           ↓
  Composite Injury Risk Score (0–100)
           ↓
     Adaptive Workout Engine
           ↓
Updated Training Plan + Dashboard Visualization
```

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React.js |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB |
| **Architecture** | MERN Stack |
| **Deployment** | Vercel |

---

## 🚀 Getting Started

### Prerequisites

- Node.js `v16+`
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone the Repository

```bash
git clone https://github.com/Abhirup-261004/Innova_InjuryShield.git
cd Innova_InjuryShield
```

### 2. Install Dependencies

```bash
# Install client dependencies
cd injuryshield-client
npm install

# Install server dependencies
cd ../injuryshield-server
npm install
```

### 3. Configure Environment Variables

Create a `.env` file inside the `injuryshield-server` folder:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_secret_key
```

### 4. Run the Application

```bash
# Start the backend server
cd injuryshield-server
npm start

# In a new terminal, start the frontend
cd injuryshield-client
npm start
```

The app will be available at `http://localhost:3000`.

---

## 🎯 Target Users

| User Type | Use Case |
|-----------|----------|
| 🏃 Fitness Enthusiasts | Personal injury prevention and smarter training |
| 🏅 Recreational Athletes | Competitive preparation without overtraining |
| 🏫 Sports Academies | Team-wide monitoring and load management |
| 🏋️ Institutional Programs | Structured, data-driven training frameworks |

---

## 📈 Roadmap

- [x] ACWR-based injury risk scoring
- [x] Adaptive workout plan generation
- [x] Smart exercise substitution
- [x] Analytics dashboard
- [ ] Wearable device integration (Fitbit, Garmin, Apple Watch)
- [ ] Coach dashboard for athlete monitoring
- [ ] Machine learning injury prediction model
- [ ] Mobile app (iOS & Android)
- [ ] Multi-language support



<div align="center">

If InjuryShield helped you or you find it interesting, please consider giving it a ⭐ on GitHub — it means a lot!

**[⭐ Star this repo](https://github.com/Abhirup-261004/Innova_InjuryShield)**

</div>
