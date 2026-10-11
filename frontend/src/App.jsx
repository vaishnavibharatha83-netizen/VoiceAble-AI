import { useEffect, useRef, useState } from "react";
import {
  Accessibility,
  ArrowRight,
  AudioLines,
  Check,
  CircleHelp,
  Clock3,
  Ear,
  Lightbulb,
  LoaderCircle,
  MessageCircle,
  Mic,
  Send,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

const suggestions = [
  "Help me complete a college application.",
  "Explain how to fill out an online form.",
  "Help me understand an error message.",
  "Guide me through creating a strong password.",
];

function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I'm VoiceAble AI. I can guide you through digital tasks one step at a time. What would you like help with today?",
    },
  ]);
  const [memories, setMemories] = useState([]);
  const [activity, setActivity] = useState([
    "Assistant ready to help",
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  async function sendMessage(text = question) {
    const cleaned = text.trim();

    if (!cleaned || loading) return;

    setQuestion("");
    setError("");
    setLoading(true);

    setMessages((current) => [
      ...current,
      { role: "user", text: cleaned },
    ]);

    setActivity((current) => [
      `You asked: ${cleaned}`,
      ...current,
    ].slice(0, 5));

    try {
      const response = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: "demo-user",
          question: cleaned,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "The assistant could not process your request.",
        );
      }

      if (!data.answer) {
        throw new Error("The assistant returned an empty answer.");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", text: data.answer },
      ]);

      const recalled = Array.isArray(data.context)
        ? data.context
        : [];

      setMemories(recalled);

      setActivity((current) => [
        "AI response received successfully",
        ...current,
      ].slice(0, 5));
    } catch (err) {
      const message = err.message || "Something went wrong.";
      setError(
        message.includes("fetch")
          ? "Cannot reach the backend. Check that FastAPI is running at http://127.0.0.1:8000."
          : message,
      );

      setActivity((current) => [
        "Request failed — check the connection",
        ...current,
      ].slice(0, 5));
    } finally {
      setLoading(false);
    }
  }

  function toggleMicrophone() {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Voice input is not supported in this browser. Try a recent version of Chrome or Edge, or type your question.",
      );
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    setError("");

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
    };

    recognition.onerror = (event) => {
      setError(`Microphone issue: ${event.error}. You can type instead.`);
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }

  function readAloud(text) {
    if (!("speechSynthesis" in window)) {
      setError("Text-to-speech is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.9;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }

  return (
    <main className="app">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="VoiceAble AI home">
          <span className="brand-icon">
            <Accessibility size={25} />
          </span>
          <span>VoiceAble <b>AI</b></span>
        </a>

        <span className="track">
          ACCESSIBILITY & ADAPTIVE ASSISTANTS
        </span>

        <span className="connection-badge">
          <span className="status-dot" />
          AI assistant
        </span>
      </header>

      <section className="hero" id="home">
        <span className="eyebrow">
          <Sparkles size={15} /> DIGITAL TASKS, MADE EASIER
        </span>

        <h1>
          Technology that <span>listens.</span>
          <br />
          Guidance that understands.
        </h1>

        <p>
          Your patient, accessible companion for confusing digital
          tasks. Ask a question and take the next step with confidence.
        </p>
      </section>

      <section className="dashboard">
        <div className="main-column">
          <section className="panel assistant-panel">
            <div className="panel-title">
              <div className="heading-with-icon">
                <span className="small-icon">
                  <MessageCircle size={20} />
                </span>
                <div>
                  <h2>Your assistant</h2>
                  <p className="muted">One question at a time</p>
                </div>
              </div>

              <span className="live-badge">
                <span className="status-dot" />
                Ready
              </span>
            </div>

            <div className="voice-area">
              <div className={`mic-orbit ${listening ? "listening" : ""}`}>
                <button
                  className="mic-button"
                  type="button"
                  onClick={toggleMicrophone}
                  aria-label={listening ? "Stop listening" : "Start voice input"}
                  aria-pressed={listening}
                >
                  {listening ? <AudioLines size={30} /> : <Mic size={30} />}
                </button>
              </div>

              <h3>{listening ? "I'm listening…" : "Talk or type to begin"}</h3>

              <p>
                {listening
                  ? "Speak clearly. Your recognized words will appear below."
                  : "Choose your preferred way to communicate."}
              </p>

              <div className="voice-note">
                <Ear size={16} />
                <span>Voice input depends on browser support and permission.</span>
              </div>
            </div>

            <div className="section-heading">
              <Lightbulb size={20} />
              <div>
                <h2>Try asking</h2>
                <p>Choose an example to get started.</p>
              </div>
            </div>

            <div className="suggestions">
              {suggestions.map((item) => (
                <button
                  className="suggestion"
                  key={item}
                  type="button"
                  disabled={loading}
                  onClick={() => sendMessage(item)}
                >
                  <span>{item}</span>
                  <ArrowRight size={17} />
                </button>
              ))}
            </div>

            <div className="section-heading conversation-heading">
              <MessageCircle size={20} />
              <div>
                <h2>Conversation</h2>
                <p>Your current session</p>
              </div>
            </div>

            <div className="messages" aria-live="polite">
              {messages.map((message, index) => (
                <article
                  className={`message ${message.role}`}
                  key={`${message.role}-${index}`}
                >
                  <div className="message-label">
                    {message.role === "assistant" ? (
                      <><Sparkles size={15} /> VoiceAble AI</>
                    ) : (
                      <>You</>
                    )}
                  </div>

                  <p>{message.text}</p>

                  {message.role === "assistant" && (
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => readAloud(message.text)}
                    >
                      <Volume2 size={16} /> Read this answer aloud
                    </button>
                  )}
                </article>
              ))}

              {loading && (
                <div className="loading-message">
                  <LoaderCircle className="spin" size={19} />
                  Preparing your guidance…
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {error && (
              <div className="error-message" role="alert">
                <CircleHelp size={19} />
                <span>{error}</span>
                <button
                  type="button"
                  aria-label="Dismiss error"
                  onClick={() => setError("")}
                >
                  ×
                </button>
              </div>
            )}

            <form
              className="composer"
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
            >
              <label className="sr-only" htmlFor="question">
                Type your question
              </label>

              <input
                id="question"
                type="text"
                placeholder="Type your question here…"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                disabled={loading}
              />

              <button
                className="send"
                type="submit"
                disabled={loading || !question.trim()}
              >
                {loading ? (
                  <LoaderCircle className="spin" size={18} />
                ) : (
                  <Send size={18} />
                )}
                <span>Send</span>
              </button>
            </form>

            <p className="input-hint">
              <ShieldCheck size={14} />
              Avoid entering passwords, OTPs, or sensitive personal details.
            </p>
          </section>
        </div>

        <aside className="side-column">
          <section className="panel">
            <div className="section-heading">
              <Lightbulb size={21} />
              <div>
                <h2>Step-by-step guidance</h2>
                <p>Simple instructions, at your pace</p>
              </div>
            </div>

            <div className="step">
              <span>1</span>
              <p>Tell the assistant what you want to do.</p>
            </div>
            <div className="step">
              <span>2</span>
              <p>Get a clear answer with a manageable next step.</p>
            </div>
            <div className="step">
              <span>3</span>
              <p>Ask follow-up questions whenever you need help.</p>
            </div>
          </section>

          <section className="panel">
            <div className="section-heading">
              <Clock3 size={21} />
              <div>
                <h2>Recent activity</h2>
                <p>Actions in this session</p>
              </div>
            </div>

            <div className="activity-list">
              {activity.map((item, index) => (
                <div className="activity-item" key={`${item}-${index}`}>
                  <Check size={16} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="section-heading">
              <Sparkles size={21} />
              <div>
                <h2>Relevant memories</h2>
                <p>Retrieved from Qdrant for this user</p>
              </div>
            </div>

            {memories.length > 0 ? (
              <div className="memory-list">
                {memories.map((memory, index) => (
                  <div className="memory" key={`${memory}-${index}`}>
                    {memory}
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty">
                No relevant memories were retrieved for this question yet.
                As you connect and store conversations, relevant memories
                can appear here.
              </p>
            )}
          </section>

          <section className="privacy-note">
            <ShieldCheck size={22} />
            <div>
              <h3>Your comfort matters</h3>
              <p>
                VoiceAble AI aims to use simple language, respect your
                choices, and guide you without rushing.
              </p>
            </div>
          </section>

          {speaking && (
            <button
              className="secondary stop-speaking"
              type="button"
              onClick={stopSpeaking}
            >
              <VolumeX size={17} /> Stop reading aloud
            </button>
          )}
        </aside>
      </section>

      <footer>
        VoiceAble AI · Accessible digital guidance for everyone
      </footer>
    </main>
  );
}

export default App;