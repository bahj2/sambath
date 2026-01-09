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
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY not configured");
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Check dubbing status
    if (action === "status") {
      const dubbingId = url.searchParams.get("dubbing_id");
      
      if (!dubbingId) {
        throw new Error("dubbing_id is required");
      }

      const statusResponse = await fetch(
        `https://api.elevenlabs.io/v1/dubbing/${dubbingId}`,
        {
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
          },
        }
      );

      if (!statusResponse.ok) {
        const error = await statusResponse.text();
        throw new Error(`Failed to get dubbing status: ${error}`);
      }

      const statusData = await statusResponse.json();
      return new Response(JSON.stringify(statusData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get dubbed audio
    if (action === "download") {
      const dubbingId = url.searchParams.get("dubbing_id");
      const languageCode = url.searchParams.get("language_code");

      if (!dubbingId || !languageCode) {
        throw new Error("dubbing_id and language_code are required");
      }

      const downloadResponse = await fetch(
        `https://api.elevenlabs.io/v1/dubbing/${dubbingId}/audio/${languageCode}`,
        {
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
          },
        }
      );

      if (!downloadResponse.ok) {
        const error = await downloadResponse.text();
        throw new Error(`Failed to download dubbed audio: ${error}`);
      }

      const audioBuffer = await downloadResponse.arrayBuffer();
      
      return new Response(audioBuffer, {
        headers: {
          ...corsHeaders,
          "Content-Type": "audio/mpeg",
          "Content-Disposition": `attachment; filename="dubbed_${languageCode}.mp3"`,
        },
      });
    }

    // Create new dubbing job
    const formData = await req.formData();
    const videoFile = formData.get("video") as File;
    const sourceLang = formData.get("source_lang") as string || "en";
    const targetLang = formData.get("target_lang") as string || "km";
    const projectName = formData.get("name") as string || "Lovable Dubbing Project";

    if (!videoFile) {
      throw new Error("Video file is required");
    }

    console.log(`Starting dubbing: ${sourceLang} -> ${targetLang}`);

    // Create dubbing request
    const apiFormData = new FormData();
    apiFormData.append("file", videoFile);
    apiFormData.append("source_lang", sourceLang);
    apiFormData.append("target_lang", targetLang);
    apiFormData.append("name", projectName);
    apiFormData.append("watermark", "false");

    const response = await fetch("https://api.elevenlabs.io/v1/dubbing", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: apiFormData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("ElevenLabs dubbing error:", error);
      throw new Error(`ElevenLabs API error: ${error}`);
    }

    const result = await response.json();
    console.log("Dubbing job created:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Dubbing Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
