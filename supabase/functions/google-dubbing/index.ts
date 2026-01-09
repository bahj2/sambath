import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    const elevenlabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!elevenlabsApiKey) {
      throw new Error("ElevenLabs API key not configured");
    }

    if (action === "status") {
      const dubbingId = url.searchParams.get("dubbing_id");
      
      // Check dubbing status with ElevenLabs
      const statusResponse = await fetch(
        `https://api.elevenlabs.io/v1/dubbing/${dubbingId}`,
        {
          headers: {
            "xi-api-key": elevenlabsApiKey,
          },
        }
      );

      if (!statusResponse.ok) {
        throw new Error("Failed to get dubbing status");
      }

      const statusData = await statusResponse.json();
      
      return new Response(
        JSON.stringify({
          dubbing_id: dubbingId,
          status: statusData.status,
          target_languages: statusData.target_languages || [],
          error: statusData.error,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "download") {
      const dubbingId = url.searchParams.get("dubbing_id");
      const languageCode = url.searchParams.get("language_code") || "es";
      
      // Download dubbed audio from ElevenLabs
      const downloadResponse = await fetch(
        `https://api.elevenlabs.io/v1/dubbing/${dubbingId}/audio/${languageCode}`,
        {
          headers: {
            "xi-api-key": elevenlabsApiKey,
          },
        }
      );

      if (!downloadResponse.ok) {
        throw new Error("Failed to download dubbed audio");
      }

      const audioBuffer = await downloadResponse.arrayBuffer();
      const bytes = new Uint8Array(audioBuffer);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
        binary += String.fromCharCode(...chunk);
      }
      const base64Audio = btoa(binary);
      
      return new Response(
        JSON.stringify({
          audio: base64Audio,
          content_type: "audio/mpeg",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle dubbing request
    const formData = await req.formData();
    const videoFile = formData.get("video") as File;
    const sourceLang = formData.get("source_lang") as string || "en";
    const targetLang = formData.get("target_lang") as string || "es";

    if (!videoFile) {
      throw new Error("No video file provided");
    }

    console.log("Processing video dubbing with ElevenLabs...");
    console.log("File:", videoFile.name, "Size:", videoFile.size);
    console.log("Source:", sourceLang, "Target:", targetLang);

    // Prepare form data for ElevenLabs dubbing API
    const elevenlabsFormData = new FormData();
    elevenlabsFormData.append("file", videoFile);
    elevenlabsFormData.append("source_lang", sourceLang);
    elevenlabsFormData.append("target_lang", targetLang);
    elevenlabsFormData.append("watermark", "false");
    elevenlabsFormData.append("num_speakers", "0"); // Auto-detect speakers

    // Start dubbing with ElevenLabs
    const dubbingResponse = await fetch(
      "https://api.elevenlabs.io/v1/dubbing",
      {
        method: "POST",
        headers: {
          "xi-api-key": elevenlabsApiKey,
        },
        body: elevenlabsFormData,
      }
    );

    if (!dubbingResponse.ok) {
      const errorText = await dubbingResponse.text();
      console.error("ElevenLabs dubbing error:", dubbingResponse.status, errorText);
      throw new Error(`ElevenLabs API error: ${errorText}`);
    }

    const dubbingData = await dubbingResponse.json();
    console.log("Dubbing started:", dubbingData);

    return new Response(
      JSON.stringify({
        dubbing_id: dubbingData.dubbing_id,
        status: "dubbing",
        expected_duration_sec: dubbingData.expected_duration_sec,
        message: "Dubbing started. Check status for progress.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in google-dubbing:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
