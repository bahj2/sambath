import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl } = await req.json();

    // Validate videoUrl is provided
    if (!videoUrl) {
      throw new Error("Video URL is required");
    }

    // Validate it's a valid URL
    try {
      new URL(videoUrl);
    } catch {
      throw new Error("Invalid video URL format");
    }

    const kieApiKey = Deno.env.get('KIEAI_API_KEY');
    if (!kieApiKey) {
      throw new Error("KIE AI API key not configured");
    }

    console.log("Creating watermark removal job for URL:", videoUrl);

    // Call KIE AI Create Task API
    const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${kieApiKey}`,
      },
      body: JSON.stringify({
        model: "sora-watermark-remover",
        input: {
          video_url: videoUrl,
        },
      }),
    });

    const result = await response.json();
    console.log("KIE AI response:", JSON.stringify(result));

    if (!response.ok || result.code !== 200) {
      throw new Error(result?.message || "Failed to create watermark removal job");
    }

    return new Response(
      JSON.stringify({
        success: true,
        taskId: result.data.taskId,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: unknown) {
    console.error("Error creating watermark removal job:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create watermark removal job";
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
