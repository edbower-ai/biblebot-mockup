import express from "express";
import cors from "cors";
import fs from "fs";
import fetch from "node-fetch";
import natural from "natural";

const app = express();
app.use(cors());
app.use(express.json());

// Load topic map
const topicMap = JSON.parse(fs.readFileSync("./topic_map.json", "utf8"));

// Helper: find most relevant topic using keyword overlap
function findBestTopic(userInput, topicMap) {
  const tokenizer = new natural.WordTokenizer();
  const inputTokens = tokenizer.tokenize(userInput.toLowerCase());

  let bestTopic = null;
  let bestScore = 0;

  for (const topic in topicMap) {
    const topicTokens = tokenizer.tokenize(topic.toLowerCase());
    const common = topicTokens.filter((t) => inputTokens.includes(t));
    const score = common.length / Math.max(topicTokens.length, inputTokens.length);

    if (score > bestScore) {
      bestScore = score;
      bestTopic = topic;
    }
  }

  return bestTopic;
}

// Helper: fetch actual Bible verse text
async function getVerseText(reference) {
  try {
    const res = await fetch(
      `https://bible-api.com/${encodeURIComponent(reference)}?translation=kjv`
    );
    const data = await res.json();
    return data.text ? data.text.trim() : reference;
  } catch (err) {
    console.error("Bible API error:", err);
    return reference;
  }
}

// Main chat route
app.post("/ask", async (req, res) => {
  const { message } = req.body;
  if (!message)
    return res.status(400).json({ error: "No message provided." });

  const bestTopic = findBestTopic(message, topicMap);

  if (!bestTopic) {
    return res.json({
      reply:
        "I'm not sure which Bible topic that relates to — could you rephrase it?",
    });
  }

  const verses = topicMap[bestTopic];
  const reference = verses[Math.floor(Math.random() * verses.length)];
  const verseText = await getVerseText(reference);

  return res.json({
    reply: `It sounds like you're asking about **${bestTopic}**.\n\n📖 ${reference}\n\n${verseText}`,
  });
});

app.get("/", (req, res) => {
  res.send("BibleBot backend is running 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server listening on port ${PORT}`));
