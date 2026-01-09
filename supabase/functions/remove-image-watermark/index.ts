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
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      throw new Error("No image provided");
    }

    const apiKey = Deno.env.get("GOOGLE_AI_STUDIO_API_KEY");
    if (!apiKey) {
      throw new Error("Google AI Studio API key not configured");
    }

    console.log("Processing image watermark removal with Google AI Studio...");

    // Extract base64 data from data URL
    const base64Match = imageBase64.match(/^data:image\/\w+;base64,(.+)$/);
    const base64Data = base64Match ? base64Match[1] : imageBase64;
    const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";

    // Use Google AI Studio directly with Gemini model
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Remove all watermarks, logos, text overlays, and any visible branding from this image. Generate a clean version of the image without any watermarks while preserving the original content, colors, composition, and quality. Output only the cleaned image."
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"]
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google AI Studio API error:", response.status, errorText);
      
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("API response received successfully");

    // Extract the generated image from the response
    const candidates = data.candidates;
    if (!candidates || candidates.length === 0) {
      console.error("No candidates in response:", JSON.stringify(data));
      throw new Error("No response from AI model");
    }

    const parts = candidates[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData) {
          const resultImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          console.log("Successfully processed image - watermark removed");
          return new Response(
            JSON.stringify({ success: true, image: resultImage }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // If no image was returned, check for text response
    const textContent = parts?.find((p: any) => p.text)?.text;
    console.log("No image in response. Content:", textContent);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: textContent || "The AI could not process this image. Please try with a different image.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in remove-image-watermark:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
