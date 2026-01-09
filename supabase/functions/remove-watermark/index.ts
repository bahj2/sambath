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
    const { fileData, fileType, fileName, soraUrl } = await req.json();

    // Handle Sora URL directly
    if (soraUrl) {
      const APIFY_API_KEY = Deno.env.get("APIFY_API_KEY");
      if (!APIFY_API_KEY) {
        return new Response(
          JSON.stringify({ error: "Apify API key not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Processing Sora URL:", soraUrl);

      const actorResponse = await fetch(
        `https://api.apify.com/v2/acts/yeekal~sora2-watermark-remover/run-sync-get-dataset-items?token=${APIFY_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoUrl: soraUrl }),
        }
      );

      if (!actorResponse.ok) {
        const errorText = await actorResponse.text();
        console.error("Apify error:", actorResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: `Failed to process Sora video: ${actorResponse.status}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const results = await actorResponse.json();
      console.log("Apify results:", JSON.stringify(results));
      
      // Apify returns watermark_free_video field
      const firstResult = results[0];
      console.log("First result:", JSON.stringify(firstResult));
      
      const outputUrl = firstResult?.watermark_free_video || firstResult?.videoUrl || firstResult?.outputUrl || firstResult?.url;
      console.log("Output URL:", outputUrl);

      if (outputUrl) {
        console.log("Returning success with URL:", outputUrl);
        return new Response(
          JSON.stringify({
            success: true,
            resultImage: outputUrl,
            fileName: "sora_clean.mp4",
            isVideo: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Could not retrieve processed video from Apify" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!fileData) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${fileType}: ${fileName}`);

    if (fileType === "video") {
      // Check if this is a Sora video URL
      const isSoraUrl = typeof fileData === "string" && 
        (fileData.includes("sora.chatgpt.com") || fileData.includes("sora.com") || fileData.includes("openai.com/sora"));

      if (isSoraUrl) {
        const APIFY_KEY = Deno.env.get("APIFY_API_KEY");
        if (!APIFY_KEY) {
          return new Response(
            JSON.stringify({ error: "Apify API key not configured" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // Use the Sora2 watermark remover for Sora URLs
        const actorResponse = await fetch(
          `https://api.apify.com/v2/acts/yeekal~sora2-watermark-remover/run-sync-get-dataset-items?token=${APIFY_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              videoUrl: fileData,
            }),
          }
        );

        if (!actorResponse.ok) {
          const errorText = await actorResponse.text();
          console.error("Apify actor error:", actorResponse.status, errorText);
          
          if (actorResponse.status === 401) {
            return new Response(
              JSON.stringify({ error: "Invalid Apify API key" }),
              { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          return new Response(
            JSON.stringify({ error: `Failed to process Sora video: ${actorResponse.status}` }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const results = await actorResponse.json();
        const outputUrl = results[0]?.videoUrl || results[0]?.outputUrl;

        if (outputUrl) {
          return new Response(
            JSON.stringify({
              success: true,
              resultImage: outputUrl,
              fileName: fileName.replace(/\.[^/.]+$/, "_clean.mp4"),
              isVideo: true,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ error: "Could not retrieve processed video" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // For uploaded videos, use KIE.AI API
      const KIEAI_API_KEY = Deno.env.get("KIEAI_API_KEY");
      if (!KIEAI_API_KEY) {
        return new Response(
          JSON.stringify({ error: "KIE.AI API key not configured for video processing" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Processing uploaded video with KIE.AI watermark remover...");

      try {
        // Extract base64 data
        const base64Match = fileData.match(/^data:video\/([^;]+);base64,(.+)$/);
        if (!base64Match) {
          return new Response(
            JSON.stringify({ error: "Invalid video format" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const base64Data = base64Match[2];
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        console.log("Uploading video to KIE.AI, size:", binaryData.length);

        // Create FormData with the video file
        const formData = new FormData();
        const blob = new Blob([binaryData], { type: `video/${base64Match[1]}` });
        formData.append("file", blob, fileName);

        // Call KIE.AI watermark remover API
        const response = await fetch("https://api.kie.ai/api/tools/watermark-remover/v1/process", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${KIEAI_API_KEY}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("KIE.AI error:", response.status, errorText);
          return new Response(
            JSON.stringify({ error: `KIE.AI processing failed: ${response.status}` }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const result = await response.json();
        console.log("KIE.AI response:", JSON.stringify(result));

        // KIE.AI returns a task_id for async processing
        if (result.task_id) {
          // Poll for result
          const taskId = result.task_id;
          let attempts = 0;
          const maxAttempts = 60; // 5 minutes max

          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
            
            const statusResponse = await fetch(`https://api.kie.ai/api/tools/watermark-remover/v1/status/${taskId}`, {
              headers: {
                "Authorization": `Bearer ${KIEAI_API_KEY}`,
              },
            });

            if (!statusResponse.ok) {
              console.error("Status check failed:", statusResponse.status);
              attempts++;
              continue;
            }

            const statusResult = await statusResponse.json();
            console.log("Task status:", statusResult.status);

            if (statusResult.status === "completed" && statusResult.output_url) {
              // Download the result video
              const videoResponse = await fetch(statusResult.output_url);
              const videoBlob = await videoResponse.blob();
              const arrayBuffer = await videoBlob.arrayBuffer();
              const uint8Array = new Uint8Array(arrayBuffer);
              
              let binaryString = "";
              for (let i = 0; i < uint8Array.length; i++) {
                binaryString += String.fromCharCode(uint8Array[i]);
              }
              const resultBase64 = `data:video/mp4;base64,${btoa(binaryString)}`;

              return new Response(
                JSON.stringify({
                  success: true,
                  resultImage: resultBase64,
                  fileName: fileName.replace(/\.[^/.]+$/, "_clean.mp4"),
                  isVideo: true,
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }

            if (statusResult.status === "failed") {
              return new Response(
                JSON.stringify({ error: "Video watermark removal failed" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }

            attempts++;
          }

          return new Response(
            JSON.stringify({ error: "Video processing timed out" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // If direct result is returned
        if (result.output_url) {
          const videoResponse = await fetch(result.output_url);
          const videoBlob = await videoResponse.blob();
          const arrayBuffer = await videoBlob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          
          let binaryString = "";
          for (let i = 0; i < uint8Array.length; i++) {
            binaryString += String.fromCharCode(uint8Array[i]);
          }
          const resultBase64 = `data:video/mp4;base64,${btoa(binaryString)}`;

          return new Response(
            JSON.stringify({
              success: true,
              resultImage: resultBase64,
              fileName: fileName.replace(/\.[^/.]+$/, "_clean.mp4"),
              isVideo: true,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ error: "Unexpected response from KIE.AI" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("Video processing error:", error);
        return new Response(
          JSON.stringify({ error: error instanceof Error ? error.message : "Video processing failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Image processing with Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please restore and enhance this image. Clean up any visual artifacts, overlaid text, watermarks, or graphical elements that obscure the original content. Reconstruct the underlying image to look natural and complete. Focus on image quality restoration and output the enhanced image."
              },
              {
                type: "image_url",
                image_url: {
                  url: fileData
                }
              }
            ]
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a few minutes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `AI processing failed: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("AI response received");

    const resultImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!resultImage) {
      console.error("No image in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "No result image received from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        resultImage,
        fileName,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in remove-watermark function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
