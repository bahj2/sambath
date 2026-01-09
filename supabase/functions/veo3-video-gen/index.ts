import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VideoGenRequest {
  prompt: string;
  mode: "text-to-video" | "image-to-video";
  imageBase64?: string;
  duration: number;
  aspectRatio: string;
  generateAudio?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, mode, imageBase64, duration, aspectRatio, generateAudio = true }: VideoGenRequest = await req.json();
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_AI_STUDIO_API_KEY");

    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_AI_STUDIO_API_KEY not configured");
    }

    if (!prompt) {
      throw new Error("Prompt is required");
    }

    console.log(`Veo3 Video Gen: mode=${mode}, duration=${duration}s, aspect=${aspectRatio}, audio=${generateAudio}`);

    // Use Gemini 2.0 Flash for advanced video production planning
    const systemPrompt = mode === "image-to-video" 
      ? `You are an expert AI video director specializing in image-to-video animation using Veo 3 technology. 
         Analyze the provided image and create a detailed animation production brief based on the user's motion prompt.
         
         Your output should include:
         1. **Scene Analysis**: What's in the image, key elements, depth layers
         2. **Motion Plan**: Detailed frame-by-frame motion description
         3. **Camera Work**: Virtual camera movements (dolly, pan, zoom, rotate)
         4. **Timing Breakdown**: Precise timing for ${duration} seconds at 24fps
         5. **Audio Suggestions**: ${generateAudio ? "Sound effects and music recommendations" : "Silent video guidance"}
         6. **Technical Specs**: ${aspectRatio} aspect ratio, recommended render settings
         
         Be specific with motion vectors, easing functions, and keyframe positions.`
      : `You are an expert AI video director using Veo 3 technology to create stunning videos from text descriptions.
         
         Create a comprehensive video production plan for a ${duration}-second video in ${aspectRatio} aspect ratio.
         
         Your output must include:
         1. **Visual Concept**: Overall artistic direction and style
         2. **Storyboard**: Shot-by-shot breakdown with timestamps
         3. **Scene Descriptions**: Detailed visual descriptions for each segment
         4. **Camera Directions**: Specific camera movements and angles
         5. **Lighting & Color**: Color grading, lighting mood, atmosphere
         6. **Motion Elements**: Subject movements, particle effects, transitions
         7. **Audio Design**: ${generateAudio ? "Music genre, sound effects, ambient audio" : "Silent video"}
         8. **Technical Specs**: Resolution recommendations, render quality
         
         Make it cinematic, visually striking, and production-ready.`;

    const requestBody: any = {
      contents: [
        {
          parts: [
            { text: systemPrompt },
            { text: `\n\nUser Prompt: "${prompt}"` }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 4000,
      }
    };

    // Add image for image-to-video mode
    if (mode === "image-to-video" && imageBase64) {
      console.log("Processing image-to-video with uploaded image");
      requestBody.contents[0].parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64
        }
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google AI error:", errorText);
      if (errorText.includes("429") || errorText.includes("RATE_LIMIT") || errorText.includes("quota")) {
        throw new Error("Rate limit exceeded. Please wait a moment and try again.");
      }
      throw new Error(`AI Error: ${errorText}`);
    }

    const result = await response.json();
    const productionPlan = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!productionPlan) {
      throw new Error("Failed to generate production plan");
    }

    console.log("Veo3 production plan generated successfully");

    // Generate frame keypoints for animation preview
    const keyframes = generateKeyframes(duration);

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        productionPlan,
        keyframes,
        settings: {
          duration,
          aspectRatio,
          generateAudio,
          fps: 24,
          resolution: aspectRatio === "9:16" ? "1080x1920" : "1920x1080",
        },
        status: "ready",
        message: mode === "image-to-video" 
          ? "Animation production plan created. Ready for Veo 3 rendering."
          : "Video production plan created. Ready for Veo 3 rendering.",
        estimatedRenderTime: Math.ceil(duration * 1.5),
        prompt,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Veo3 Video Gen Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateKeyframes(duration: number): Array<{ time: number; description: string }> {
  const fps = 24;
  const totalFrames = duration * fps;
  const keyframeCount = Math.min(8, Math.ceil(duration / 2));
  const keyframes = [];
  
  for (let i = 0; i < keyframeCount; i++) {
    const time = (i / (keyframeCount - 1)) * duration;
    const frame = Math.round(time * fps);
    keyframes.push({
      time: parseFloat(time.toFixed(2)),
      description: `Keyframe ${i + 1} (Frame ${frame}/${totalFrames})`,
    });
  }
  
  return keyframes;
}
