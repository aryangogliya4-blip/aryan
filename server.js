
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors({
  origin: "https://techaryank.blogspot.com"
}));

app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TECH_ARYAN_K Backend is running!",
    status: "online"
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    openai: Boolean(process.env.OPENAI_API_KEY),
    fal: Boolean(process.env.FAL_KEY),
    backend: "online"
  });
});

// AI TEXT GENERATION
app.post("/api/generate", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "OpenAI API key is missing"
      });
    }

    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: "Please enter a prompt"
      });
    }

    if (prompt.length > 12000) {
      return res.status(400).json({
        success: false,
        error: "Prompt is too long"
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-5.5",
          instructions:
            "You are the AI creative assistant for TECH_ARYAN_K. Create detailed, clear, cinematic stories and professional AI image or video prompts. Follow the user's language and requirements. Do not invent that a video or image has been generated; only return text.",
          input: prompt
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", data);
      return res.status(502).json({
        success: false,
        error: "AI service request failed"
      });
    }

    res.json({
      success: true,
      result: data.output_text || ""
    });

  } catch (error) {
    console.error("Generation error:", error);
    res.status(500).json({
      success: false,
      error: "Backend generation failed"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`TECH_ARYAN_K server running on port ${PORT}`);
});
