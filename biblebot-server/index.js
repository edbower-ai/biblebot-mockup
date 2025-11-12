import express from "express";
import fs from "fs";
import nlp from "compromise";

const app = express();
app.use(express.json());

const topicMap = JSON.parse(fs.readFileSync("./topic_map.json", "utf8"));

app.post("/ask", (req, res) => {
  const userInput = req.body.message.trim().toLowerCase();
  const doc = nlp(userInput);
  const keywords = doc.nouns().out("array").map(k => k.toLowerCase());

  // Conversational pieces
  const intros = [
    "That’s a great question!",
    "I’m glad you asked that.",
    "Let’s see what the Bible says about that.",
    "Good thought — here’s what Scripture says:"
  ];

  const transitions = [
    "Here’s a verse that speaks to this:",
    "One passage that comes to mind is:",
    "God’s Word says this about it:",
    "You might find this verse encouraging:"
  ];

  const closings = [
    "I hope that helps you reflect today.",
    "That’s a good reminder for us all.",
    "May that verse bring you peace.",
    "Keep seeking God’s Word for more wisdom."
  ];

  let response = "I’m not sure about that. Try asking about topics like faith, love, or forgiveness.";

  // Look for topic match
  for (const [topic, verses] of Object.entries(topicMap)) {
    if (keywords.some(k => topic.includes(k))) {
      const randomVerse = verses[Math.floor(Math.random() * verses.length)];
      const intro = intros[Math.floor(Math.random() * intros.length)];
      const transition = transitions[Math.floor(Math.random() * transitions.length)];
      const closing = closings[Math.floor(Math.random() * closings.length)];

      response = `${intro} ${transition} ${randomVerse}. ${closing}`;
      break;
    }
  }

  res.json({ response });
});

app.get("/", (req, res) => {
  res.send("BibleBot backend is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));


