import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

app.use(express.json());

// API: Support Chat
app.post("/api/chat", async (req, res) => {
  const { messages, userId } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
  }

  try {
    const startTime = Date.now();
    const model = (genAI as any).getGenerativeModel({ model: "gemini-1.5-flash" });

    // 1. Input Moderation
    const lastMessage = messages[messages.length - 1].content;
    const safetyModel = (genAI as any).getGenerativeModel({ model: "gemini-1.5-flash" });
    const safetyCheck = await safetyModel.generateContent(`Analyze the following customer support query for harmful intent, toxicity, or abuse. Respond with ONLY a JSON object: { "isSafe": boolean, "reasons": string[], "toxicityScore": number (0-1) }. Query: "${lastMessage}"`);
    const safetyResult = JSON.parse(safetyCheck.response.text().replace(/```json|```/g, "").trim());

    if (!safetyResult.isSafe) {
       // Log unsafe query (pseudo-log for now, client will store in Firestore)
       return res.status(403).json({ 
         error: "Safety Alert: This query contains potentially harmful content.",
         safetyResult 
       });
    }

    // 2. Generate Response
    const chat = model.startChat({
      history: messages.slice(0, -1).map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    const result = await chat.sendMessage(lastMessage);
    const responseText = result.response.text();
    const endTime = Date.now();
    const latency = endTime - startTime;

    // 3. Output Moderation
    // (In a real app, we might also check the AI's output for safety or hallucinations)

    res.json({ 
      content: responseText, 
      latency,
      safetyResult
    });

  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to generate response", details: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
