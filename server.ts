import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { InferenceClient } from "@huggingface/inference";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  let ai: GoogleGenAI | null = null;
  let hf: InferenceClient | null = null;

  function getAI(): GoogleGenAI {
    if (!ai) {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is required in environment variables.");
      }
      ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return ai;
  }

  function getHF(): InferenceClient {
    if (!hf) {
      if (!process.env.HF_TOKEN) {
        throw new Error("HF_TOKEN is required in environment variables.");
      }
      hf = new InferenceClient(process.env.HF_TOKEN);
    }
    return hf;
  }

  // API Routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history = [] } = req.body;
      const aiClient = getAI();

      const contents = history.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }));
      contents.push({ role: 'user', parts: [{ text: message }] });

      const response = await aiClient.models.generateContent({
        model: "gemini-2.0-flash",
        contents: contents,
      });

      res.json({ response: response.text });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tts", async (req, res) => {
    try {
      const { text } = req.body;
      const hfClient = getHF();

      const audioBlob = await hfClient.textToSpeech({
        provider: "replicate",
        model: "ResembleAI/chatterbox",
        inputs: text,
      });

      const arrayBuffer = await audioBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.set("Content-Type", "audio/wav");
      res.send(buffer);
    } catch (error: any) {
      console.error("TTS error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
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
