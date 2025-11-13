import express from "express";
import cors from "cors";
import fs from "fs";
import nlp from "compromise";
import natural from "natural";

const app = express();
app.use(cors());
app.use(express.json());

const topicMap = JSON.parse(fs.readFileSync("./topic_map.json", "utf8"));
const topics = Object.keys(topicMap);

function findBestTopic(userInput, topicMap) {
  const tokenizer = new natural.WordTokenizer();
  const inputTokens = tokenizer.tokenize(userInput.toLowerCase());

  let bestTopic = null;
  let bestScore = 0;

  for (const topic in topicMap) {
    const topicTokens = tokenizer.tokenize(topic.toLowerCase());

    // Compute overlap ratio
    const common = topicTokens.filter(t => inputTokens.includes(t));
    const score = common.length / Math.max(topicTokens.length, inputTokens.length);

    if (score > bestScore) {
      bestScore = score;
      bestTopic = topic;
    }
  }

  return bestTopic;
}

 post("/ask", (req, res) => {
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
