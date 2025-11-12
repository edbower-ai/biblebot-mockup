import express from "express";
import fs from "fs";
import nlp from "compromise";
import cors from "cors";

const app = express();
app.use(express.json());

// Enable CORS for frontend requests
app.use(cors({ origin: "*" }));

// Load your topic map
const topicMap = JSON.parse(fs.readFileSync("./topic_map.json", "utf8"));

// Intros and closings for responses
const intros = [
  "That’s a great question!",
  "Let’s see what Scripture says about that.",
  "I’m glad you asked — here’s what God’s Word says:",
  "Good question! The Bible has wisdom for this."
];

const closings = [
  "I hope that encourages you today.",
  "May that bring you peace and understanding.",
  "That’s a great reminder for us all.",
  "Keep trusting in God’s Word!"
];

// POST /ask endpoint
app.post("/ask", async (req, res) => {
  const userInput = req.body.message.trim().toLowerCase();

  // Extract all terms, not just nouns
  const keywords = nlp(userInput)
    .terms()
    .out("array")
    .map(k => k.toLowerCase());

  let response;

  // 1️⃣ Match a topic from topic_map
  for (const [topic, verses] of Object.entries(topicMap)) {
    const topicWords = topic.split("_"); // handle multi-word topics

    if (topicWords.some(word => keywords.includes(word))) {
      const randomVerse = verses[Math.floor(Math.random() * verses.length)];
      const intro = intros[Math.floor(Math.random() * intros.length)];
      const closing = closings[Math.floor(Math.random() * closings.length)];

      response = `${intro} Here’s a verse on ${topic.replace(/_/g, " ")}: ${randomVerse}. ${closing}`;
      return res.json({ response });
    }
  }

  // 2️⃣ Check if input is a verse reference
  const versePattern = /([1-3]?\s?[A-Za-z]+\s?\d{1,3}:\d{1,3}(-\d{1,3})?)/;
  const match = userInput.match(versePattern);

  if (match) {
    const verseQuery = encodeURIComponent(match[0]);
    try {
      const resp = await fetch(`https://bible-api.com/${verseQuery}`);
      const data = await resp.json();
      if (data.text) {
        return res.json({
          response: `${data.reference}: ${data.text.trim()} (${data.translation_name})`
        });
      }
    } catch (err) {
      response = "Sorry, I couldn’t reach the Bible API just now.";
      return res.json({ response });
    }
  }

  // 3️⃣ General Bible API search
  try {
    const query = encodeURIComponent(userInput);
    const resp = await fetch(`https://bible-api.com/${query}`);
    const data = await resp.json();
    if (data.text) {
      response = `${data.reference}: ${data.text.trim()} (${data.translation_name})`;
    } else {
      response = "I couldn’t find that topic. Try asking about love, faith, or hope.";
    }
  } catch (err) {
    response = "There was a problem connecting to the Bible API.";
  }

  res.json({ response });
});

// Health check
app.get("/", (req, res) => {
  res.send("BibleBot backend is running with Bible API support!");
});

// Use Render port or fallback to 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
