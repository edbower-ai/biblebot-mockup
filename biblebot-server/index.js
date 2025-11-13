import express from "express";
import cors from "cors";
import fs from "fs";
import nlp from "compromise";

const app = express();
app.use(cors());
app.use(express.json());

// Load topic map
const topicMap = JSON.parse(fs.readFileSync("./topic_map.json", "utf8"));

// Helper to measure rough similarity between two words
function wordSimilarity(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  if (a === b) return 1;
  const minLen = Math.min(a.length, b.length);
  let matches = 0;
  for (let i = 0; i < minLen; i++) {
    if (a[i] === b[i]) matches++;
  }
  return matches / Math.max(a.length, b.length);
}

// Find best-matching topic from the topic map
function findBestTopic(userInput) {
  const doc = nlp(userInput.toLowerCase());
  const inputWords = doc.terms().out("array").filter(w => w.length > 2);

  let bestTopic = null;
  let bestScore = 0;

  for (const [topic, verses] of Object.entries(topicMap)) {
    const topicWords = topic.toLowerCase().split(/\s+/);

    // Compute overlap or similarity between input words and topic words
    let score = 0;
    for (const word of inputWords) {
      for (const tWord of topicWords) {
        const sim = wordSimilarity(word, tWord);
        if (sim > 0.6) score += sim;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestTopic = topic;
    }
  }

  return bestTopic;
}

// API route
app.post("/ask", async (req, res) => {
  const { message } = req.body;
  if (!message)
    return res.status(400).json({ error: "No message provided." });

  const bestTopic = findBestTopic(message);

  if (!bestTopic) {
    return res.json({
      reply:
        "I'm not sure which Bible topic that relates to — could you phrase it a bit differently?",
    });
  }

  const verses = topicMap[bestTopic];
  const verse =
    verses[Math.floor(Math.random() * verses.length)];

  return res.json({
    reply: `It sounds like you're asking about **${bestTopic}**. The Bible says in ${verse}.`,
  });
});

app.get("/", (req, res) => {
  res.send("BibleBot backend is running 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

