// Replace this with your actual Render backend URL
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

inputEl.addEventListener("input", () => {
  inputEl.style.height = "auto";
  inputEl.style.height = inputEl.scrollHeight + "px";
});

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;
  addMessage("You", text);
  inputEl.value = "";
  inputEl.style.height = "auto";
  statusEl.innerText = "Thinking...";

  try {
    const resp = await fetch(BACKEND_URL + "/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await resp.json();
    addMessage("BibleBot", data.reply || "No response received.");
  } catch (err) {
    console.error(err);
    addMessage("BibleBot", "⚠️ Network error. Check your server URL.");
  } finally {
    statusEl.innerText = "";
  }
}

sendBtn.addEventListener("click", sendMessage);
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
