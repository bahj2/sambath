import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Language code mapping for ElevenLabs STT (ISO 639-3 codes)
const languageCodeMap: Record<string, string> = {
  en: "eng",
  es: "spa",
  fr: "fra",
  de: "deu",
  it: "ita",
  pt: "por",
  ru: "rus",
  zh: "cmn",
  ja: "jpn",
  ko: "kor",
  ar: "ara",
  hi: "hin",
  th: "tha",
  vi: "vie",
  km: "khm",
  id: "ind",
  ms: "msa",
  nl: "nld",
  pl: "pol",
  tr: "tur",
  uk: "ukr",
  sv: "swe",
  da: "dan",
  no: "nor",
  fi: "fin",
  cs: "ces",
  ro: "ron",
  hu: "hun",
  el: "ell",
  he: "heb",
  bn: "ben",
  ta: "tam",
  te: "tel",
  mr: "mar",
  gu: "guj"
};

// Language names for translation prompts
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
  th: "Thai",
  vi: "Vietnamese",
  km: "Khmer",
  id: "Indonesian",
  ms: "Malay",
  nl: "Dutch",
  pl: "Polish",
  tr: "Turkish",
  uk: "Ukrainian",
  sv: "Swedish",
  da: "Danish",
  no: "Norwegian",
  fi: "Finnish",
  cs: "Czech",
  ro: "Romanian",
  hu: "Hungarian",
  el: "Greek",
  he: "Hebrew",
  bn: "Bengali",
  ta: "Tamil",
  te: "Telugu",
  mr: "Marathi",
  gu: "Gujarati"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const sourceLanguage = formData.get("sourceLanguage") as string || "en";
    const targetLanguage = formData.get("targetLanguage") as string || "es";
    const voiceId = formData.get("voiceId") as string || "EXAVITQu4vr4xnSDxMaL"; // Sarah voice
    
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY not configured");
    }

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    if (!audioFile) {
      throw new Error("Audio file is required");
    }

    console.log(`Speech-to-Speech: ${sourceLanguage} -> ${targetLanguage}`);

    // Step 1: Speech-to-Text using ElevenLabs
    console.log("Step 1: Transcribing audio...");
    const sttFormData = new FormData();
    sttFormData.append("file", audioFile);
    sttFormData.append("model_id", "scribe_v1");
    sttFormData.append("language_code", languageCodeMap[sourceLanguage] || "eng");

    const sttResponse = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: sttFormData,
    });

    if (!sttResponse.ok) {
      const error = await sttResponse.text();
      throw new Error(`STT Error: ${error}`);
    }

    const sttResult = await sttResponse.json();
    const transcribedText = sttResult.text;
    
    if (!transcribedText || transcribedText.trim() === "") {
      throw new Error("No speech detected in the audio");
    }

    console.log("Transcribed text:", transcribedText);

    // Step 2: Translate text using Lovable AI
    console.log("Step 2: Translating text...");
    const sourceLangName = languageNames[sourceLanguage] || sourceLanguage;
    const targetLangName = languageNames[targetLanguage] || targetLanguage;

    const translateResponse = await fetch("https://api.lovable.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a professional translator. Translate the following text from ${sourceLangName} to ${targetLangName}. Only output the translated text, nothing else. Keep the tone and style of the original text.`
          },
          {
            role: "user",
            content: transcribedText
          }
        ],
        max_tokens: 2000,
      }),
    });

    if (!translateResponse.ok) {
      const error = await translateResponse.text();
      throw new Error(`Translation Error: ${error}`);
    }

    const translateResult = await translateResponse.json();
    const translatedText = translateResult.choices?.[0]?.message?.content?.trim();

    if (!translatedText) {
      throw new Error("Translation failed - no output received");
    }

    console.log("Translated text:", translatedText);

    // Step 3: Text-to-Speech using ElevenLabs
    console.log("Step 3: Generating speech...");
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

    const audioBuffer = await ttsResponse.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    console.log("Speech-to-Speech completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        transcribedText,
        translatedText,
        audioBase64: base64Audio,
        sourceLanguage,
        targetLanguage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Speech-to-Speech Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
