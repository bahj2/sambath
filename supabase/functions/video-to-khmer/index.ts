import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const KHMER_TRANSLATION_PROMPT = `You are a professional translator specializing in Khmer (Cambodian) language.

Please analyze this video and:
1. Listen to all speech/dialogue in the video
2. Transcribe the speech
3. Translate everything to Khmer (ភាសាខ្មែរ)

Provide the output in this format:
- First, give a brief description of the video content in Khmer
- Then provide the full translation of all spoken content in Khmer script
- Use proper Khmer grammar and natural phrasing
- Include timestamps if possible (e.g., [0:00-0:10])

If there is no speech in the video, describe what is happening visually in Khmer.

Respond ONLY in Khmer script (ភាសាខ្មែរ), not romanized Khmer.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoBase64, fileName } = await req.json();

    if (!videoBase64) {
      return new Response(
        JSON.stringify({ error: "No video provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing video: ${fileName}`);

    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_AI_STUDIO_API_KEY");
    if (!GOOGLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Google AI Studio API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType: "video/mp4", data: videoBase64 } },
              { text: KHMER_TRANSLATION_PROMPT },
            ],
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `Google AI error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const translation = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!translation) {
      return new Response(
        JSON.stringify({ error: "No translation generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Google AI translation successful");
    return new Response(
      JSON.stringify({
        success: true,
        khmerTranslation: translation,
        fileName,
        provider: "Google AI Studio",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in video-to-khmer function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
