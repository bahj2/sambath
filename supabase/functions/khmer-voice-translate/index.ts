import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Base64 encode helper for Deno
function base64Encode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Language names for translation
const languageNames: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  zh: "Chinese (Mandarin)",
  ja: "Japanese",
  ko: "Korean",
  ar: "Arabic",
  hi: "Hindi",
  vi: "Vietnamese",
  id: "Indonesian",
  nl: "Dutch",
  pl: "Polish",
  tr: "Turkish",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const mode = formData.get("mode") as string || "khmer-to-other"; // "khmer-to-other" or "other-to-khmer"
    const sourceLanguage = formData.get("sourceLanguage") as string || "en";
    const targetLanguage = formData.get("targetLanguage") as string || "en";
    const voiceId = formData.get("voiceId") as string || "EXAVITQu4vr4xnSDxMaL";
    
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_AI_STUDIO_API_KEY");
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_AI_STUDIO_API_KEY not configured");
    }

    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY not configured");
    }

    if (!audioFile) {
      throw new Error("Audio file is required");
    }

    const isKhmerToOther = mode === "khmer-to-other";
    console.log(`Khmer Voice Translate: ${isKhmerToOther ? 'Khmer -> ' + targetLanguage : sourceLanguage + ' -> Khmer'}`);

    // Convert audio to base64
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBase64 = base64Encode(audioBuffer);

    // Determine MIME type
    let mimeType = "audio/webm";
    if (audioFile.name?.endsWith(".mp3")) mimeType = "audio/mp3";
    else if (audioFile.name?.endsWith(".wav")) mimeType = "audio/wav";
    else if (audioFile.name?.endsWith(".ogg")) mimeType = "audio/ogg";

    let sourceText = "";
    let translatedText = "";

    if (isKhmerToOther) {
      // KHMER -> OTHER LANGUAGE
      const targetLangName = languageNames[targetLanguage] || targetLanguage;
      
      console.log("Transcribing Khmer speech and translating to", targetLangName);
      
      const googleResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are a Khmer language expert and translator. Listen to this Khmer audio and:
1. First, transcribe the Khmer speech exactly as spoken (in Khmer script)
2. Then translate the Khmer text to ${targetLangName}

Format your response EXACTLY like this (use these exact labels):
SOURCE: [the Khmer transcription here]
TRANSLATION: [the ${targetLangName} translation here]

If there is no speech or the audio is unclear, respond with:
SOURCE: [No speech detected]
TRANSLATION: [No speech detected]`
                  },
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: audioBase64
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 2000,
            }
          }),
        }
      );

      if (!googleResponse.ok) {
        const error = await googleResponse.text();
        console.error("Google AI error:", error);
        throw new Error(`Google AI Error: ${error}`);
      }

      const googleResult = await googleResponse.json();
      const aiResponse = googleResult.candidates?.[0]?.content?.parts?.[0]?.text || "";
      console.log("AI Response:", aiResponse);

      const sourceMatch = aiResponse.match(/SOURCE:\s*(.+?)(?=\nTRANSLATION:|$)/s);
      const translationMatch = aiResponse.match(/TRANSLATION:\s*(.+?)$/s);

      if (sourceMatch) sourceText = sourceMatch[1].trim();
      if (translationMatch) translatedText = translationMatch[1].trim();

      if (!sourceText && !translatedText) {
        sourceText = aiResponse;
        translatedText = aiResponse;
      }

      if (sourceText.includes("[No speech detected]")) {
        throw new Error("No Khmer speech detected in the audio");
      }
    } else {
      // OTHER LANGUAGE -> KHMER
      const sourceLangName = languageNames[sourceLanguage] || sourceLanguage;
      
      console.log("Transcribing", sourceLangName, "speech and translating to Khmer");
      
      const googleResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are a multilingual translator specializing in Khmer. Listen to this ${sourceLangName} audio and:
1. First, transcribe the ${sourceLangName} speech exactly as spoken
2. Then translate the text to Khmer (Cambodian language using Khmer script)

Format your response EXACTLY like this (use these exact labels):
SOURCE: [the ${sourceLangName} transcription here]
TRANSLATION: [the Khmer translation here in Khmer script ខ្មែរ]

If there is no speech or the audio is unclear, respond with:
SOURCE: [No speech detected]
TRANSLATION: [No speech detected]`
                  },
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: audioBase64
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 2000,
            }
          }),
        }
      );

      if (!googleResponse.ok) {
        const error = await googleResponse.text();
        console.error("Google AI error:", error);
        throw new Error(`Google AI Error: ${error}`);
      }

      const googleResult = await googleResponse.json();
      const aiResponse = googleResult.candidates?.[0]?.content?.parts?.[0]?.text || "";
      console.log("AI Response:", aiResponse);

      const sourceMatch = aiResponse.match(/SOURCE:\s*(.+?)(?=\nTRANSLATION:|$)/s);
      const translationMatch = aiResponse.match(/TRANSLATION:\s*(.+?)$/s);

      if (sourceMatch) sourceText = sourceMatch[1].trim();
      if (translationMatch) translatedText = translationMatch[1].trim();

      if (!sourceText && !translatedText) {
        sourceText = aiResponse;
        translatedText = aiResponse;
      }

      if (sourceText.includes("[No speech detected]")) {
        throw new Error("No speech detected in the audio");
      }
    }

    console.log("Source text:", sourceText);
    console.log("Translated text:", translatedText);

    // Generate TTS - ElevenLabs supports Khmer via multilingual v2
    console.log("Generating speech output...");
    
    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: translatedText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true,
            speed: 1.0,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const error = await ttsResponse.text();
      throw new Error(`TTS Error: ${error}`);
    }

    const ttsBuffer = await ttsResponse.arrayBuffer();
    const ttsBase64 = base64Encode(ttsBuffer);

    console.log("Khmer Voice Translation completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        sourceText,
        translatedText,
        audioBase64: ttsBase64,
        mode,
        sourceLanguage: isKhmerToOther ? "km" : sourceLanguage,
        targetLanguage: isKhmerToOther ? targetLanguage : "km",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Khmer Voice Translate Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
