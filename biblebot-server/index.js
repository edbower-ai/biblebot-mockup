import express from "express";
import fs from "fs";
import nlp from "compromise";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

const topicMap = JSON.parse(fs.readFileSync("./topic_map.json", "utf8"));

const intros = [
  "Let’s see what Scripture says about that.",
  "I’m glad you brought that up — here’s what God’s Word says:",
  "Good thought! The Bible has wisdom for this."
];

const closings = [
  "I hope that helps!",
  "May that bring you peace and understanding.",
  "That’s a great reminder for us all.",
  "Keep trusting in God’s Word!"
];

app.post("/ask", async (req, res) => {
  const userInput = req.body.message.trim().toLowerCase();
  const keywords = nlp(userInput)
    .terms()
    .out("array")
    .map(k => k.toLowerCase());

  let response;

  // Match topic map
  for (const [topic, verses] of Object.entries(topicMap)) {
    const topicWords = topic.split("_");
    if (topicWords.some(word => keywords.includes(word))) {
      const randomVerse = verses[Math.floor(Math.random() * verses.length)];
      const intro = intros[Math.floor(Math.random() * intros.length)];
      const closing = closings[Math.floor(Math.random() * closings.length)];
      response = `${intro} Here’s a verse on ${topic.replace(/_/g, " ")}: ${randomVerse}. ${closing}`;
      return res.json({ response });
    }
  }

  // Check if input is a verse reference
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

  // General search
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

app.get("/", (req, res) => {
  res.send("BibleBot backend is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
