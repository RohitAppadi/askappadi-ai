# ✨ Ask Appadi – Minimal AI Assistant for Smarter Automation

## A weekend coding practice with my dad which included us exploring AI and learning Ollama, led to a fully working context aware AI assistant helping you build smarter using previous data.
APPADI started as a weekend learning project with my father, where we explored AI workflows and Ollama. It grew into a fully working, context-aware AI assistant that helps developers automate technical tasks using previous data and local LLMs.

---

## 🚀 Features

- 🧠 Multi-model support (LLaMA2, Mistral, DeepSeek, etc.)
- 📂 Upload UFT scripts, JSON, or plain text files
- 🔍 Extract business logic from legacy test scripts
- 💻 Generate Selenium Java code with full functionality
- 🧪 Create test cases from prompts or uploaded files
- 🧰 Scaffold frameworks (Selenium, Cucumber)
- 📜 Design API specs from user stories or JSON
- 📥 Download AI-generated output as `.txt`
- 📊 View system status and health check endpoints

---

## 🛠 Tech Stack

- **Backend**: Node.js + Express.js
- **Frontend**: EJS + Bootstrap 5
- **AI Engine**: Ollama (local LLMs)
- **File Handling**: Multer
- **Security**: Helmet-style headers

---

## 📦 Installation

1. git clone https://github.com/RohitAppadi/askappadi-ai
2. cd appadi
3. npm install

---

## Usage

node server.mjs
Then open in local host 8080

# File upload format

you can upload files in UFT- style scripts like 

Browser("App").Page("Login").WebEdit("username").Set "admin"
Browser("App").Page("Login").WebButton("Login").Click

1. APPADI will convert to JSON
2. Extract Business test cases
3. Generate a Selenium JAVA code

---

## Extensibility 

You can easily add new tasks by:
- Updating the task dropdown in index.ejs
- Adding prompt logic in server.mjs → getTaskPrompt()
- Wiring new routes or output formats

---

## Status & Health
- /status → System info and model availability
- /api/health → JSON health check endpoint

---

# 🙌 Credits
Built by my Father Mr. Murali Appadi — a methodical, technically curious builder focused on empowering developers through robust, user-friendly tools. I, Rohit Appadi just was learning in his guidance.
APPADI blends minimal design with powerful automation, making it a joy to build with.

---

