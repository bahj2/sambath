import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

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

If there is no speech in the video, describe what is happening visually in Khmer.

Respond ONLY in Khmer script (ភាសាខ្មែរ), not romanized Khmer.`;

async function processWithGoogleAI(videoBase64: string, apiKey: string): Promise<{ success: boolean; translation?: string; error?: string }> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
        return { success: false, error: "RATE_LIMITED" };
      }
      return { success: false, error: `Google AI: ${response.status}` };
    }

    const data = await response.json();
    const translation = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return { success: true, translation };
  } catch (error) {
    console.error("Google AI exception:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_AI_STUDIO_API_KEY");
    if (!GOOGLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get pending items from queue (oldest first)
    const { data: pendingItems, error: fetchError } = await supabase
      .from("video_queue")
      .select("*")
      .eq("status", "pending")
      .lt("retry_count", 3)
      .order("created_at", { ascending: true })
      .limit(5);

    if (fetchError) {
      console.error("Error fetching queue:", fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!pendingItems || pendingItems.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending items in queue", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${pendingItems.length} queued videos`);
    let processed = 0;
    let rateLimited = false;

    for (const item of pendingItems) {
      if (rateLimited) break;

      // Mark as processing
      await supabase
        .from("video_queue")
        .update({ status: "processing" })
        .eq("id", item.id);

      console.log(`Processing queue item: ${item.id} (${item.file_name})`);

      const result = await processWithGoogleAI(item.video_data, GOOGLE_API_KEY);

      if (result.success && result.translation) {
        // Success - update with translation
        await supabase
          .from("video_queue")
          .update({
            status: "completed",
            khmer_translation: result.translation,
            processed_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        processed++;
        console.log(`Successfully processed: ${item.id}`);
      } else if (result.error === "RATE_LIMITED") {
        // Rate limited - put back in queue for later
        await supabase
          .from("video_queue")
          .update({
            status: "pending",
            retry_count: item.retry_count + 1,
            error_message: "Rate limited - will retry automatically",
          })
          .eq("id", item.id);

        rateLimited = true;
        console.log(`Rate limited, stopping processing. Item ${item.id} will retry.`);
      } else {
        // Other error
        const newRetryCount = item.retry_count + 1;
        await supabase
          .from("video_queue")
          .update({
            status: newRetryCount >= item.max_retries ? "failed" : "pending",
            retry_count: newRetryCount,
            error_message: result.error,
          })
          .eq("id", item.id);

        console.log(`Error processing ${item.id}: ${result.error}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${processed} videos`,
        processed,
        rateLimited,
        remaining: pendingItems.length - processed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Queue processor error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
