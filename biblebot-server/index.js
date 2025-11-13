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

function findBestTopic(userInput, topics) {
  let bestMatch = null;
  let highestScore = 0;

  const inputTokens = nlp(userInput).terms().out('array').map(t => t.toLowerCase());

  topics.forEach(topic => {
    const topicTokens = nlp(topic.text).terms().out('array').map(t => t.toLowerCase());
    const common = topicTokens.filter(t => inputTokens.includes(t));
    const score = common.length / Math.max(topicTokens.length, inputTokens.length);

    if (score > highestScore) {
      highestScore = score;
      bestMatch = topic;
    }
  });

  return bestMatch;
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

