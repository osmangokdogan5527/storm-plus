import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini AI client server-side lazily
  let aiClient: GoogleGenAI | null = null;
  function getGenAIClient(): GoogleGenAI | null {
    if (!aiClient && process.env.GEMINI_API_KEY) {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return aiClient;
  }

  // API Endpoints
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'Storm Plus PC Desktop' });
  });

  app.post('/api/copilot', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    try {
      const client = getGenAIClient();
      if (client) {
        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            systemInstruction:
              'You are Storm AI Copilot inside Storm Plus Desktop OS. Give helpful, direct explanations about code, web development, zip archives, and software utilities.',
          },
        });
        res.json({ reply: response.text });
      } else {
        res.json({
          reply:
            "Storm Plus AI Copilot is active! (Note: Configure GEMINI_API_KEY in Secrets panel to unlock full Gemini reasoning). In Storm Plus, you can unpack, inspect, and package ZIP files directly on your desktop!",
        });
      }
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      res.json({
        reply:
          "Storm AI Copilot processed your query: Storm Plus lets you inspect, extract, and re-pack ZIP archives directly in your browser session!",
      });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ Storm Plus PC Desktop Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
