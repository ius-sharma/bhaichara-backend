const Groq = require("groq-sdk");
const User = require("../models/User");

const GROQ_MODEL = "llama3-8b-8192";
const GROQ_FALLBACK_MODEL =
  process.env.GROQ_FALLBACK_MODEL || "llama-3.1-8b-instant";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MOOD_KEYWORDS = {
  sad: ["sad", "lonely", "depressed"],
  stressed: ["stress", "exam", "pressure"],
  normal: ["hello", "hi"],
  positive: ["thanks", "good"],
};

const containsKeyword = (text, keywords) =>
  keywords.some((keyword) => {
    const keywordPattern = new RegExp(`\\b${keyword}\\b`, "i");
    return keywordPattern.test(text);
  });

const detectMood = (message) => {
  const normalizedMessage = String(message || "").toLowerCase();

  if (containsKeyword(normalizedMessage, MOOD_KEYWORDS.sad)) {
    return "sad";
  }

  if (containsKeyword(normalizedMessage, MOOD_KEYWORDS.stressed)) {
    return "stressed";
  }

  if (containsKeyword(normalizedMessage, MOOD_KEYWORDS.positive)) {
    return "positive";
  }

  if (containsKeyword(normalizedMessage, MOOD_KEYWORDS.normal)) {
    return "normal";
  }

  return "normal";
};

const DETAIL_REQUEST_PATTERNS = [
  /\bexplain\b/i,
  /\btell me more\b/i,
  /\bhow does it work\b/i,
];

const wantsDetailedExplanation = (message) =>
  DETAIL_REQUEST_PATTERNS.some((pattern) =>
    pattern.test(String(message || "")),
  );

const chatWithAI = async (req, res) => {
  const { message, history, userId } = req.body;

  if (!message || !String(message).trim()) {
    return res.status(400).json({ message: "Message is required." });
  }

  const userMessage = String(message).trim();
  const detectedMood = detectMood(userMessage);
  const allowDetailedReply = wantsDetailedExplanation(userMessage);

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ message: "GROQ_API_KEY is not configured." });
  }

  try {
    let aiName = "Jarvish";
    let userName = "the user";
    const resolvedUserId = req.user?.id || req.user?._id || userId;

    if (resolvedUserId) {
      const currentUser =
        await User.findById(resolvedUserId).select("aiName name");
      if (currentUser?.aiName) {
        aiName = currentUser.aiName;
      }

      if (currentUser?.name) {
        userName = currentUser.name;
      }
    } else if (req.user?.name) {
      userName = req.user.name;
    }

    const systemMessage = {
      role: "system",
      content: `You are ${aiName}, the personal AI companion of ${userName}.\n\nCurrent user mood: ${detectedMood}\nUser asked for detailed explanation: ${allowDetailedReply ? "yes" : "no"}\n\nRules:\n- Speak warmly and like a supportive friend.\n- If mood is sad -> respond empathetically.\n- If mood is stressed -> give calming advice.\n- If mood is normal -> friendly short reply.\n- Default reply length: 1-2 sentences.\n- Only give a long explanation if the user explicitly asks (examples: \"explain\", \"tell me more\", \"how does it work\").`,
    };

    const normalizedHistory = Array.isArray(history)
      ? history
          .filter(
            (item) =>
              item &&
              (item.role === "user" || item.role === "assistant") &&
              typeof item.content === "string" &&
              item.content.trim(),
          )
          .map((item) => ({
            role: item.role,
            content: item.content.trim(),
          }))
      : [];

    const messages = [
      systemMessage,
      ...normalizedHistory,
      { role: "user", content: userMessage },
    ];

    let completion;

    try {
      completion = await groq.chat.completions.create({
        messages,
        model: GROQ_MODEL,
      });
    } catch (error) {
      const errorMessage = String(error?.message || "");
      const isModelDeprecated = /decommissioned|no longer supported/i.test(
        errorMessage,
      );

      if (!isModelDeprecated) {
        throw error;
      }

      completion = await groq.chat.completions.create({
        messages,
        model: GROQ_FALLBACK_MODEL,
      });
    }

    const aiReply = completion?.choices?.[0]?.message?.content?.trim();

    if (!aiReply) {
      return res.status(502).json({
        message: "Groq API returned an empty response.",
      });
    }

    return res.status(200).json({ reply: aiReply });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to process AI request.",
      error: error.message,
    });
  }
};

module.exports = {
  chatWithAI,
};
