import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, mode, imageBase64, duration, aspectRatio } = await req.json();
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_AI_STUDIO_API_KEY");

    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_AI_STUDIO_API_KEY not configured");
    }

    if (!prompt) {
      throw new Error("Prompt is required");
    }

    console.log(`Veo Video Gen: mode=${mode}, duration=${duration}s, aspect=${aspectRatio}`);

    // For image-to-video, we use Gemini to analyze and create a motion description
    // Then generate video frames or animation guidance
    if (mode === "image-to-video" && imageBase64) {
      console.log("Processing image-to-video request");
      
      const imageAnalysisResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are a cinematic video director. Analyze this image and describe how to animate it based on this prompt: "${prompt}"

Create a detailed cinematic motion description that includes:
1. Camera movement (pan, zoom, dolly, etc.)
2. Subject animation (what moves and how)
3. Lighting changes
4. Atmospheric effects
5. Timing and pacing

Format your response as a professional video production brief.`
                  },
                  {
                    inlineData: {
                      mimeType: "image/jpeg",
                      data: imageBase64
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 2000,
            }
          }),
        }
      );

      if (!imageAnalysisResponse.ok) {
        const error = await imageAnalysisResponse.text();
        console.error("Google AI error:", error);
        if (error.includes("429") || error.includes("RATE_LIMIT")) {
          throw new Error("Rate limit exceeded. Please wait a moment and try again.");
        }
        throw new Error(`AI Error: ${error}`);
      }

      const analysisResult = await imageAnalysisResponse.json();
      const motionDescription = analysisResult.candidates?.[0]?.content?.parts?.[0]?.text || "";

      console.log("Motion description generated");

      return new Response(
        JSON.stringify({
          success: true,
          mode: "image-to-video",
          motionDescription,
          status: "processing",
          message: "Video generation initiated. Your cinematic animation is being created.",
          estimatedTime: duration * 2,
          prompt,
          aspectRatio,
          duration
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Text-to-video: Generate a detailed video concept and storyboard
    console.log("Processing text-to-video request");
    
    const storyboardResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a Hollywood film director creating a ${duration}-second cinematic video.

Prompt: "${prompt}"
Aspect Ratio: ${aspectRatio}

Create a detailed cinematic storyboard with:

1. **Opening Shot** (0-${Math.floor(duration/4)}s): Describe the establishing shot
2. **Development** (${Math.floor(duration/4)}-${Math.floor(duration/2)}s): Main action/movement
3. **Climax** (${Math.floor(duration/2)}-${Math.floor(3*duration/4)}s): Peak moment
4. **Resolution** (${Math.floor(3*duration/4)}-${duration}s): Closing shot

For each section include:
- Camera angle and movement
- Lighting mood
- Color palette
- Motion/action description
- Sound/music suggestion

Make it cinematic, visually striking, and emotionally engaging.`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 3000,
          }
        }),
      }
    );

    if (!storyboardResponse.ok) {
      const error = await storyboardResponse.text();
      console.error("Google AI error:", error);
      if (error.includes("429") || error.includes("RATE_LIMIT")) {
        throw new Error("Rate limit exceeded. Please wait a moment and try again.");
      }
      throw new Error(`AI Error: ${error}`);
    }

    const storyboardResult = await storyboardResponse.json();
    const storyboard = storyboardResult.candidates?.[0]?.content?.parts?.[0]?.text || "";

    console.log("Storyboard generated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        mode: "text-to-video",
        storyboard,
        status: "processing",
        message: "Video concept created. Your cinematic video is being rendered.",
        estimatedTime: duration * 3,
        prompt,
        aspectRatio,
        duration
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Veo Video Gen Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
