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
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const language = formData.get("language") as string || "en";

    if (!audioFile) {
      throw new Error("No audio file provided");
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("Lovable API key not configured");
    }

    console.log("Processing speech-to-text with Google AI...");
    console.log("File:", audioFile.name, "Size:", audioFile.size, "Type:", audioFile.type);

    // Convert audio to base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    // Determine MIME type
    let mimeType = audioFile.type || "audio/mp3";
    if (!mimeType.startsWith("audio/")) {
      mimeType = "audio/mp3";
    }

    // Use Google Gemini for transcription via Lovable AI gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Transcribe this audio file accurately. Output ONLY the transcription text, nothing else. If there are multiple speakers, identify them as "Speaker 1:", "Speaker 2:", etc. Include timestamps in format [MM:SS] at the start of each speaker's segment if you can detect them. Language hint: ${language}`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Audio}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      if (response.status === 402) {
        throw new Error("Usage limit reached. Please add credits.");
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const transcriptionText = data.choices?.[0]?.message?.content || "";

    console.log("Transcription completed");

    // Parse the transcription to extract speaker segments
    const lines = transcriptionText.split('\n').filter((line: string) => line.trim());
    const words: { text: string; start: number; end: number; speaker?: string }[] = [];
    
    let currentTime = 0;
    for (const line of lines) {
      // Try to extract timestamp and speaker
      const timestampMatch = line.match(/\[(\d+):(\d+)\]/);
      const speakerMatch = line.match(/^(Speaker \d+):/);
      
      let text = line;
      let speaker = "Speaker 1";
      
      if (timestampMatch) {
        currentTime = parseInt(timestampMatch[1]) * 60 + parseInt(timestampMatch[2]);
        text = text.replace(/\[\d+:\d+\]\s*/, '');
      }
      
      if (speakerMatch) {
        speaker = speakerMatch[1];
        text = text.replace(/^Speaker \d+:\s*/, '');
      }
      
      if (text.trim()) {
        words.push({
          text: text.trim(),
          start: currentTime,
          end: currentTime + 5,
          speaker
        });
        currentTime += 5;
      }
    }

    return new Response(
      JSON.stringify({
        text: transcriptionText,
        words: words.length > 0 ? words : undefined,
        language_code: language,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in google-stt:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
