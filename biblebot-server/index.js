import express from "express";
import cors from "cors";
import fs from "fs";
import nlp from "compromise";

const app = express();
app.use(cors());
app.use(express.json());

const topicMap = JSON.parse(fs.readFileSync("./topic_map.json", "utf8"));
const topics = Object.keys(topicMap);

// helper to find best matching topic
function findBestTopic(userInput) {
  let bestMatch = null;
  let highestScore = 0;

  const inputTokens = nlp(userInput).terms().out("array").map(t => t.toLowerCase());

  topics.forEach(topic => {
    const topicTokens = nlp(topic).terms().out("array").map(t => t.toLowerCase());
    const common = topicTokens.filter(t => inputTokens.includes(t));
    const score = common.length / Math.max(topicTokens.length, inputTokens.length);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = topic;
    }
  });

  return bestMatch;
}

app.post("/ask", (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "No message provided." });

  const bestTopic = findBestTopic(message);
  if (!bestTopic) {
    return res.json({
      reply: "I'm not sure which Bible topic that relates to — could you phrase it differently?"
    });
  }

  const verses = topicMap[bestTopic];
  const verse = verses[Math.floor(Math.random() * verses.length)];

  res.json({
    reply: `It sounds like you're asking about **${bestTopic}**. The Bible says in ${verse}.`
  });
});

app.get("/", (req, res) => {
  res.send("BibleBot backend is running 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
