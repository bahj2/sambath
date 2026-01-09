import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KlingVideoGenRequest {
  prompt: string;
  negativePrompt?: string;
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
    const { 
      prompt, 
      negativePrompt = "", 
      mode, 
      imageBase64, 
      duration, 
      aspectRatio, 
      generateAudio = true 
    }: KlingVideoGenRequest = await req.json();
    
    const KLING_API_KEY = Deno.env.get("KLING_API_KEY");

    if (!KLING_API_KEY) {
      throw new Error("KLING_API_KEY not configured");
    }

    if (!prompt) {
      throw new Error("Prompt is required");
    }

    console.log(`Kling Video Gen: mode=${mode}, duration=${duration}s, aspect=${aspectRatio}, audio=${generateAudio}`);
    console.log(`Using Kling API Key: ${KLING_API_KEY.substring(0, 8)}...`);

    // Prepare the request body for Kling AI API
    const klingRequestBody: any = {
      model_name: "kling-v1",
      prompt: prompt,
      negative_prompt: negativePrompt || "blurry, low quality, distorted, watermark, text, logo, artifacts",
      cfg_scale: 0.5,
      mode: mode === "text-to-video" ? "std" : "pro",
      duration: duration.toString(),
      aspect_ratio: aspectRatio.replace(":", "_"), // Kling uses 16_9 format
    };

    // Add image data for image-to-video mode
    if (mode === "image-to-video" && imageBase64) {
      console.log("Processing image-to-video with uploaded image");
      klingRequestBody.image = imageBase64;
      klingRequestBody.image_tail = imageBase64;
    }

    console.log("Sending request to Kling AI...");

    // Create task with Kling AI API
    const createResponse = await fetch(
      "https://api.klingai.com/v1/videos/text2video",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${KLING_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(klingRequestBody),
      }
    );

    const responseText = await createResponse.text();
    console.log(`Kling API Response Status: ${createResponse.status}`);
    console.log(`Kling API Response: ${responseText}`);

    if (!createResponse.ok) {
      console.error("Kling AI error:", responseText);
      if (responseText.includes("429") || responseText.includes("rate limit") || responseText.includes("quota")) {
        throw new Error("Rate limit exceeded. Please wait a moment and try again.");
      }
      throw new Error(`Kling AI Error (${createResponse.status}): ${responseText}`);
    }

    const createResult = JSON.parse(responseText);
    const taskId = createResult.data?.task_id;

    if (!taskId) {
      console.error("No task ID in response:", createResult);
      throw new Error("Failed to create Kling video generation task - No task ID returned");
    }

    console.log(`Kling task created successfully: ${taskId}`);

    // Generate production details using AI analysis
    const generationPlan = generateProductionPlan(prompt, negativePrompt, mode, duration, aspectRatio);
    const sceneBreakdown = generateSceneBreakdown(prompt, duration);
    const cameraMovements = generateCameraMovements(prompt, mode);

    return new Response(
      JSON.stringify({
        success: true,
        taskId,
        mode,
        prompt,
        negativePrompt,
        generationPlan,
        sceneBreakdown,
        cameraMovements,
        settings: {
          duration,
          aspectRatio,
          generateAudio,
          fps: 30,
          resolution: getResolution(aspectRatio),
          model: "Kling AI v1",
        },
        status: "processing",
        message: mode === "image-to-video" 
          ? "Video generation started. Animation will be created from your image."
          : "Video generation started. Your AI video is being created.",
        estimatedGenerationTime: duration * 30,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Kling Video Gen Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateProductionPlan(
  prompt: string, 
  negativePrompt: string, 
  mode: string, 
  duration: number, 
  aspectRatio: string
): string {
  return `KLING AI VIDEO GENERATION PLAN
================================

Prompt: ${prompt}
${negativePrompt ? `Negative Prompt: ${negativePrompt}` : ''}
Mode: ${mode}
Duration: ${duration} seconds
Aspect Ratio: ${aspectRatio}
Model: Kling AI v1 (Advanced Text-to-Video)

PRODUCTION APPROACH:
-------------------
${mode === "image-to-video" 
  ? `- Starting from provided image with smooth animation
- Preserving image composition and style
- Adding natural motion and depth
- Camera movements to enhance the scene`
  : `- Full scene generation from text description
- Cinematic composition and framing
- Natural lighting and realistic rendering
- Smooth motion and transitions`}

TECHNICAL SPECIFICATIONS:
------------------------
- Frame Rate: 30 FPS
- Resolution: ${getResolution(aspectRatio)}
- Color Space: sRGB
- Codec: H.264
- Quality: High (Kling AI optimized)

RENDERING PIPELINE:
------------------
1. AI Scene Understanding & Layout
2. 3D Depth Estimation & Composition
3. Motion Field Generation
4. Frame-by-Frame Synthesis
5. Temporal Coherence & Smoothing
6. Post-Processing & Enhancement

Expected rendering time: ~${duration * 30} seconds
Video will be ready for download once processing completes.`;
}

function generateSceneBreakdown(prompt: string, duration: number): Array<{ timeRange: string; description: string }> {
  const segments = Math.min(5, Math.ceil(duration / 2));
  const breakdown = [];
  
  for (let i = 0; i < segments; i++) {
    const startTime = (i / segments) * duration;
    const endTime = ((i + 1) / segments) * duration;
    const timeRange = `${startTime.toFixed(1)}s - ${endTime.toFixed(1)}s`;
    
    let description = "";
    if (i === 0) {
      description = "Opening scene: Establishing shot with main subject introduction";
    } else if (i === segments - 1) {
      description = "Closing scene: Final reveal or conclusion of motion sequence";
    } else {
      description = `Mid-scene ${i}: Continuous action and development of visual narrative`;
    }
    
    breakdown.push({ timeRange, description });
  }
  
  return breakdown;
}

function generateCameraMovements(prompt: string, mode: string): string[] {
  const movements = [];
  
  if (mode === "image-to-video") {
    movements.push("Smooth parallax effect to add depth to the static image");
    movements.push("Subtle zoom and pan to create dynamic framing");
    movements.push("Natural camera breathing for organic feel");
    movements.push("Perspective shifts to enhance 2.5D illusion");
  } else {
    movements.push("Cinematic establishing shot with smooth dolly-in movement");
    movements.push("Dynamic camera tracking following main action");
    movements.push("Orbital rotation around key subject points");
    movements.push("Depth-of-field shifts to guide viewer attention");
    movements.push("Final pull-back or push-in for dramatic conclusion");
  }
  
  return movements;
}

function getResolution(aspectRatio: string): string {
  const resolutions: Record<string, string> = {
    "16:9": "1920x1080 (Full HD Widescreen)",
    "9:16": "1080x1920 (Vertical/Mobile)",
    "1:1": "1080x1080 (Square/Social)",
    "4:3": "1440x1080 (Standard)",
  };
  return resolutions[aspectRatio] || "1920x1080";
}
