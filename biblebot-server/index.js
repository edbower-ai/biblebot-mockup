import express from "express";
import fs from "fs";
import nlp from "compromise";
import cors from "cors"; // ✅ import CORS

const app = express();
app.use(express.json());

// ✅ Allow requests from any origin (or replace "*" with your frontend URL)
app.use(cors({ origin: "*" }));

const topicMap = JSON.parse(fs.readFileSync("./topic_map.json", "utf8"));

app.post("/ask", async (req, res) => {
  const userInput = req.body.message.trim().toLowerCase();
  const doc = nlp(userInput);
  const keywords = doc.nouns().out("array").map(k => k.toLowerCase());

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

  let response;

  for (const [topic, verses] of Object.entries(topicMap)) {
    if (keywords.some(k => topic.includes(k))) {
      const randomVerse = verses[Math.floor(Math.random() * verses.length)];
      const intro = intros[Math.floor(Math.random() * intros.length)];
      const closing = closings[Math.floor(Math.random() * closings.length)];

      response = `${intro} Here’s a verse on ${topic}: ${randomVerse}. ${closing}`;
      return res.json({ response });
    }
  }

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
    } catch {
      response = "Sorry, I couldn’t reach the Bible API just now.";
      return res.json({ response });
    }
  }

  try {
    const query = encodeURIComponent(userInput);
    const resp = await fetch(`https://bible-api.com/${query}`);
    const data = await resp.json();

    if (data.text) {
      response = `${data.reference}: ${data.text.trim()} (${data.translation_name})`;
    } else {
      response = "I couldn’t find that topic. Try asking about love, faith, or hope.";
    }
  } catch {
    response = "There was a problem connecting to the Bible API.";
  }

  res.json({ response });
});

app.get("/", (req, res) => {
  res.send("BibleBot backend is running with Bible API support!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

