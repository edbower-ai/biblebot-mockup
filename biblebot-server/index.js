import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

// Load topic map
const topicMapPath = path.join(process.cwd(), "topic_map.json");
let TOPIC_MAP = {};
try {
  TOPIC_MAP = JSON.parse(fs.readFileSync(topicMapPath, "utf8"));
} catch (e) {
  console.error("Could not load topic_map.json", e);
}

// Helper: detect verse reference like "John 3:16" or "1 John 4:8"
function looksLikeVerse(text) {
  // matches stuff like "John 3:16", "1 John 4:8", case-insensitive
  return /\b\d?\s*[A-Za-z]+\.?\s+\d+:\d+(-\d+)?\b/.test(text);
}

// Normalize reference for bible-api.com (simple)
function normalizeRef(ref) {
  // bible-api.com handles common formats; just encodeURIComponent
  return encodeURIComponent(ref);
}

// Find a topic keyword in the user text (returns first match)
function findTopic(text) {
  const lowered = text.toLowerCase();
  for (const key of Object.keys(TOPIC_MAP)) {
    if (lowered.includes(key.toLowerCase())) return key;
  }
  return null;
}

// Fetch a verse from bible-api.com by reference
async function fetchVerse(reference) {
  const url = `https://bible-api.com/${normalizeRef(reference)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Bible API response ${res.status}`);
  }
  const data = await res.json();
  // bible-api returns { reference, verses, text, translation_id, translation_name }
  if (data && data.text) {
    return {
      reference: data.reference,
      text: data.text.trim(),
      translation: data.translation_name || data.translation_id || "unknown"
    };
  }
  throw new Error("No verse text returned");
}

app.post("/api/message", async (req, res) => {
  const userMessage = (req.body.message || "").trim();
  if (!userMessage) return res.status(400).json({ reply: "No message provided." });

  try {
    // 1) If it looks like a verse reference -> fetch and return
    if (looksLikeVerse(userMessage)) {
      try {
        const v = await fetchVerse(userMessage);
        return res.json({ reply: `${v.reference}\n\n${v.text}\n\n— ${v.translation}` });
      } catch (err) {
        console.error("Verse fetch error:", err.message);
        return res.json({ reply: "I couldn't fetch that verse. Try a standard reference like: John 3:16" });
      }
    }

    // 2) If not a reference, try topic map matching
    const topic = findTopic(userMessage);
    if (topic) {
      const refs = TOPIC_MAP[topic];
      if (Array.isArray(refs) && refs.length > 0) {
        // fetch first matching reference for speed; you can return multiple later
        try {
          const v = await fetchVerse(refs[0]);
          return res.json({ reply: `Topic: ${topic}\n\n${v.reference}\n\n${v.text}\n\n— ${v.translation}` });
        } catch (err) {
          console.error("Topic verse fetch error:", err.message);
        }
      }
    }

    // 3) No match: tell user how to ask in ways the bot understands
    return res.json({
      reply:
        "I can only answer with Scripture. Try entering a verse reference (example: John 3:16) " +
        "or ask a question using a simple topic word like 'love', 'forgiveness', 'faith', 'prayer'."
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Server error fetching Scripture." });
  }
});

// Render provides PORT env; default to 3000 for local testing
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`BibleBot server listening on port ${PORT}`));

