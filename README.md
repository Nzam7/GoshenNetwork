# ✝️ Goshen Network

> **Church Community Service Directory & Automated WhatsApp Concierge Assistant**

Goshen Network is a community-driven digital service hub designed to keep economic resources and business circulating within local church congregations. Operating directly inside WhatsApp, it functions as a digital front desk ("yellow pages") where members can easily find and connect with trusted service providers (plumbers, graphic designers, mechanics, accountants, etc.) from within their own church family.

---

## ✨ Features & Capabilities

- 🤖 **WhatsApp Concierge Bot**: Operates directly inside WhatsApp so congregation members require no new application downloads or account creations.
- 🔍 **Interactive Menu & Search**: Interactive category selection and keyword lookup (e.g., *"Reply 1 for Home Repairs, 2 for Professional Services"*).
- 📲 **Frictionless Connection**: Instantly generates direct `https://wa.me/` deep-links dropping users into a private WhatsApp chat with the selected business owner.
- 📂 **Multi-Source Directory Engine**: Indexes service providers from structured JSON data stores or CSV spreadsheets.
- 💻 **CLI & Web API Interfaces**: Provides an interactive terminal simulator (`npm run cli`) for rapid testing and Express REST endpoints (`npm start`).
- 🧪 **Comprehensive Test Suite**: Automated unit and integration testing via Jest and Supertest.

---

## 🛠️ Architecture & Tech Stack

- **Language**: TypeScript (`^4.9.5`)
- **Runtime & Server**: Node.js, Express (`^4.19.2`), CORS, Dotenv
- **Data Parser**: `csv-parse` for internal spreadsheets & CSV directory files
- **Testing**: Jest (`^29.7.0`), `ts-jest`, Supertest
- **Repository**: [https://github.com/Nzam7/GoshenNetwork.git](https://github.com/Nzam7/GoshenNetwork.git)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- npm / yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/Nzam7/GoshenNetwork.git
cd GoshenNetwork

# Install dependencies
npm install
```

### Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
PORT=3000
NODE_ENV=development
DATA_SOURCE=json
```

---

## 🏃 Running the Application

### Interactive CLI Simulator (Local Bot Simulator)
Test the WhatsApp concierge flow directly in your terminal:
```bash
npm run cli
```

### Development Mode
```bash
npm run dev
```

### Production Build & Server
```bash
npm run build
npm start
```

### Running Automated Tests
```bash
npm test
```

---

## 📜 License

This project is licensed under the MIT License.
