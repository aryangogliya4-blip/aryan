
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors({ origin: "https://techaryank.blogspot.com" }));
app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => {
  res.json({ success: true, status: "online" });
});

app.get("/api/status", (req, res) => {
  res.json({
    openai: Boolean(process.env.OPENAI_API_KEY),
    fal: Boolean(process.env.FAL_KEY),
    turnstile: Boolean(process.env.TURNSTILE_SECRET_KEY),
    backend: "online"
  });
});

// AI TEXT GENERATION
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OpenAI key missing" });
    }

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Please enter a prompt" });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5.5",
        instructions: "You are the TECH_ARYAN_K creative assistant. Create detailed cinematic prompts and stories. Return text only.",
        input: prompt
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);
      return res.status(502).json({ error: "AI text generation failed" });
    }

    res.json({ success: true, result: data.output_text || "" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Text generation failed" });
  }
});

// AI IMAGE GENERATION
app.post("/generate", async (req, res) => {
  try {
    const { prompt, aspectRatio, turnstileToken } = req.body;

    if (!process.env.FAL_KEY || !process.env.TURNSTILE_SECRET_KEY) {
      return res.status(500).json({ error: "Image service keys are missing" });
    }

    if (!prompt || typeof prompt !== "string" || prompt.length > 2048) {
      return res.status(400).json({ error: "Invalid image prompt" });
    }

    if (!turnstileToken || turnstileToken.length > 2048) {
      return res.status(403).json({ error: "Please complete verification" });
    }

    const verifyResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: turnstileToken
        })
      }
    );

    const verification = await verifyResponse.json();

    if (!verification.success || verification.hostname !== "techaryank.blogspot.com") {
      return res.status(403).json({ error: "Verification failed. Please try again." });
    }

    const ratioMap = {
      "1:1": "square_hd",
      "square": "square_hd",
      "4:5": "portrait_4_3",
      "3:4": "portrait_4_3",
      "9:16": "portrait_16_9",
      "16:9": "landscape_16_9",
      "4:3": "landscape_4_3"
    };

    const imageResponse = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        "Authorization": `Key ${process.env.FAL_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        image_size: ratioMap[aspectRatio] || "square_hd",
        num_images: 1,
        output_format: "jpeg"
      })
    });

    const imageData = await imageResponse.json();

    if (!imageResponse.ok || !imageData.images?.[0]?.url) {
      console.error("FAL error:", imageData);
      return res.status(502).json({ error: "Image generation failed" });
    }

    const downloaded = await fetch(imageData.images[0].url);

    if (!downloaded.ok) {
      return res.status(502).json({ error: "Could not download generated image" });
    }

    const buffer = Buffer.from(await downloaded.arrayBuffer());

    res.json({
      success: true,
      image: buffer.toString("base64"),
      mimeType: downloaded.headers.get("content-type") || "image/jpeg"
    });

  } catch (error) {
    console.error("Image generation error:", error);
    res.status(500).json({ error: "Image generation failed. Please try again." });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`TECH_ARYAN_K server running on port ${PORT}`);
});
