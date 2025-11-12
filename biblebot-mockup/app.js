// >>> REPLACE this with your deployed backend URL after you deploy on Render:
const BACKEND_URL = "https://biblebot-mockup.onrender.com";

const chatEl = document.getElementById("chat");
const inputEl = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const statusEl = document.getElementById("status");

function addMessage(who, text) {
  const div = document.createElement("div");
  div.className = "message " + (who === "You" ? "user" : "bot");
  div.innerText = (who === "You" ? "You: " : "BibleBot: ") + text;
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
}

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;
  addMessage("You", text);
  inputEl.value = "";
  statusEl.innerText = "Fetching Scripture…";
  try {
    const resp = await fetch(BACKEND_URL + "/api/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });
    const data = await resp.json();
    addMessage("BibleBot", data.reply);
  } catch (err) {
    console.error("Network error", err);
    addMessage("BibleBot", "Network error. Is the server URL configured?");
  } finally {
    statusEl.innerText = "";
  }
}

sendBtn.addEventListener("click", sendMessage);
inputEl.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });
