import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// -------------------- LOAD DRUG LIST (lowercased) --------------------
let allowedDrugs = [];
try {
  allowedDrugs = JSON.parse(fs.readFileSync("drugs.json", "utf8"))
    .map(d => String(d).toLowerCase());
} catch (err) {
  console.error("Failed to load drugs.json:", err.message);
  // keep allowedDrugs empty so validation will reject everything until fixed
}

// ----- STATIC FRONTEND SETUP -----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static frontend files (index.html, app.js, styles.css, drugs.json, etc.)
app.use(express.static(__dirname));

// HuggingFace API (router chat completions)
const HF_API_URL = "https://router.huggingface.co/v1/chat/completions";
const HF_MODEL = "meta-llama/Llama-3.1-8B-Instruct:fireworks-ai";

// ----- BACKEND API -----
app.post("/api/check", async (req, res) => {
  try {
    const { drugs } = req.body;

    // 1) Basic format checks first
    if (!Array.isArray(drugs)) {
      return res.status(400).json({ error: "Drugs must be sent as an array." });
    }
    if (drugs.length < 2) {
      return res.status(400).json({ error: "Provide at least two drug names." });
    }

    // 2) Validate names (case-insensitive)
    const invalid = drugs.filter(d => {
      if (!d || typeof d !== "string") return true;
      return !allowedDrugs.includes(d.toLowerCase());
    });

    if (invalid.length > 0) {
      return res.status(400).json({
        error: "Invalid drug name(s).",
        invalid_items: invalid,
        message: "Please enter only valid, recognized drug names."
      });
    }

    // 3) Require HF token in .env (server-side only)
    const token = process.env.HF_TOKEN || process.env.HF_API_KEY || process.env.HF;
    if (!token) {
      return res.status(500).json({ error: "Missing HF_TOKEN in .env (server requires this)" });
    }

    // 4) Build prompt (send validated drug names)
    const prompt = `
You are a medical safety assistant. User is taking:
${drugs.map((d, i) => `${i + 1}. ${d}`).join("\n")}

Return STRICT JSON ONLY:
{
  "overall_risk": "low" | "moderate" | "high",
  "summary": "",
  "interactions": [
    { "drug1": "", "drug2": "", "risk": "", "description": "" }
  ]
}
No markdown.
`;

    const body = {
      model: HF_MODEL,
      messages: [
        { role: "system", content: "Return JSON only." },
        { role: "user", content: prompt }
      ],
      max_tokens: 400,
      temperature: 0.1
    };

    // 5) Send request to HF router (with Authorization header)
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
    });

    // Check HF HTTP status
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return res.status(502).json({
        error: "HuggingFace API error",
        status: response.status,
        details: text || "No response body"
      });
    }

    const data = await response.json().catch(() => null);

    const raw = data?.choices?.[0]?.message?.content || "";
    // Clean codefence wrappers if any
    const cleaned = String(raw).replace(/```json/i, "").replace(/```/g, "").trim();

    let json;
    try {
      json = JSON.parse(cleaned);
    } catch (parseErr) {
      // Return the raw model output for debugging instead of crashing
      return res.status(500).json({
        error: "Invalid JSON returned from HuggingFace",
        raw
      });
    }

    return res.json(json);

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      error: "Server error",
      details: err.message
    });
  }
});

// ----- FALLBACK: serve index.html for root and unknown routes -----
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Optionally keep this to serve index for other client-side routes:
// app.use((req, res) => res.sendFile(path.join(__dirname, "index.html")));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server + Frontend running at http://localhost:${PORT}`);
});
