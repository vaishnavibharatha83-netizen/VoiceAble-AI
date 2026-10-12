# VoiceAble AI ♿🤖
### Accessible Digital Guidance for Everyone

**VoiceAble AI** is a voice-first, AI-powered assistant designed to make confusing digital tasks easier and more accessible. It guides users through tasks using simple language, step-by-step instructions, voice input, and spoken responses.

Instead of overwhelming users with complicated instructions, VoiceAble AI focuses on helping them take **one manageable step at a time**.

---

## 💡 Problem Statement

Many people struggle with digital platforms because of complex forms, technical terminology, confusing error messages, and inaccessible user experiences.

Traditional help systems often provide lengthy explanations instead of personalized, easy-to-follow guidance.

## ✨ Our Solution

VoiceAble AI acts as a patient digital companion that helps users understand and navigate digital tasks through conversational AI.

It aims to make technology more approachable by combining voice interaction, contextual AI responses, and memory retrieval.

## 🚀 Features

- **🎙️ Voice Input:** Speak your questions using supported browser speech recognition.
- **💬 Conversational AI:** Ask questions and receive guidance through an interactive chat interface.
- **🪜 Step-by-Step Guidance:** Break complicated digital tasks into manageable actions.
- **🔊 Text-to-Speech:** Listen to assistant responses using browser speech synthesis.
- **🧠 AI-Powered Assistance:** Generate responses through the configured Lyzr AI agent.
- **💾 Contextual Memory:** Use Qdrant to store and retrieve relevant information.
- **♿ Accessibility-Focused UI:** A simple, approachable interface with voice and text interaction options.
- **🔒 Privacy Awareness:** Reminds users not to enter passwords, OTPs, or other sensitive information.

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js |
| Development Server | Vite |
| UI Icons | Lucide React |
| Backend | Python, FastAPI |
| AI Agent | Lyzr |
| Vector Database | Qdrant |
| Embeddings | FastEmbed |
| API Communication | HTTP / JSON |
| Voice Input | Web Speech API |
| Spoken Responses | SpeechSynthesis API |
| Deployment | Render (planned/configured as applicable) |

## 🏗️ System Architecture

```text
              USER
                |
                v
       VoiceAble AI Frontend
          (React + Vite)
                |
                | HTTP POST /ask
                v
        FastAPI Backend
                |
          +-----+------+
          |            |
          v            v
       Lyzr AI       Qdrant
     AI Responses   Memory Retrieval
          |            |
          +-----+------+
                |
                v
       Response to Frontend
                |
                v
       Display or Read Aloud
```

## ⚙️ How It Works

1. The user types a question or speaks using the microphone.
2. The frontend sends the question to the FastAPI backend.
3. The backend uses the configured AI agent and relevant memory retrieval.
4. The generated answer is returned to the frontend.
5. The user reads the response or listens to it aloud.

## 📂 Project Structure

```text
VoiceAble-AI/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── .env                 # Local configuration, not committed
│
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── .env                 # Private credentials, not committed
│
├── .gitignore
└── README.md
```

*The structure above represents the main files; your repository may contain additional configuration files.*

## 💻 Run Locally

### Prerequisites

Install the following:

- Python
- Node.js and npm
- Git
- A configured Lyzr AI agent and Qdrant database

### 1. Clone the Repository

```bash
git clone https://github.com/vaishnavibharatha83-netizen/VoiceAble-AI.git
cd VoiceAble-AI
```

### 2. Set Up the Backend

Open a terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create a `backend/.env` file and configure your credentials:

```env
LYZR_API_KEY=your_lyzr_api_key
LYZR_AGENT_ID=your_lyzr_agent_id
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
```

Replace the placeholder values with your actual credentials. Never commit this file to GitHub.

Start the backend:

```powershell
python -m uvicorn app:app --reload --port 8000
```

Backend URL: `http://127.0.0.1:8000`

API documentation: `http://127.0.0.1:8000/docs`

### 3. Set Up the Frontend

Open a second terminal from the project root:

```powershell
cd frontend
npm install
```

Create a `frontend/.env` file containing:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Ensure `frontend/src/App.jsx` uses the configured URL:

```javascript
const API_URL = import.meta.env.VITE_API_URL;
```

Start the frontend:

```powershell
npm run dev
```

Open the local URL printed in the terminal, usually `http://localhost:5173`.

**Important:** Keep both terminals running while testing locally.

## 🌐 Deployment

The application can be deployed using Render.

1. Push the project to GitHub.
2. Deploy the Python backend as a Render Web Service.
3. Configure the backend's environment variables in Render.
4. Deploy the React frontend as a separate Render service.
5. Set `VITE_API_URL` in the frontend service to the deployed backend URL.
6. Configure backend CORS to allow requests from the deployed frontend.
7. Test the deployed website and its AI responses.

The frontend and backend need separate services because they perform different roles. Users access the frontend website without running commands on their own computers.

Deployment status: update this section once both services have been successfully deployed and tested.

## 🔐 Security and Privacy

- Keep API keys and credentials in environment variables.
- Never upload `.env` files containing secrets.
- Do not ask users to provide passwords, OTPs, or sensitive personal information.
- Configure CORS for trusted frontend origins.
- Protect public API endpoints against unauthorized access and abuse.
- Review the data retention and privacy settings of external AI and database services.

## 🔮 Future Enhancements

- Multilingual voice interaction.
- More personalized guidance based on user preferences.
- Improved memory management and conversation continuity.
- Additional accessibility options and assistive workflows.
- Better error handling and user-friendly recovery guidance.
- Secure integration with more digital services.

## 🎯 Vision

Our vision is to make digital experiences less intimidating and more inclusive by helping people interact with technology at their own pace.

**VoiceAble AI — Technology that listens. Guidance that understands.**

---

## 👥 Team

Developed as an AI-powered accessibility project.

Add your team name, team members, and hackathon details here.

## 📄 License

Add a license before distributing the project publicly. If no license has been selected, the repository remains subject to the applicable default copyright rules.
