import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestBody = await req.json();
  const { jobId, soraUrl, userId } = requestBody;

  try {
    if (!jobId || !soraUrl || !userId) {
      throw new Error("Missing required parameters: jobId, soraUrl, userId");
    }

    // Validate Sora URL format
    if (!soraUrl.includes('sora.chatgpt.com') && !soraUrl.includes('sora.com') && !soraUrl.includes('openai.com/sora')) {
      throw new Error("Invalid URL: Must be a Sora video URL (sora.chatgpt.com)");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const kieApiKey = Deno.env.get('KIEAI_API_KEY');

    if (!kieApiKey) {
      throw new Error("KIE AI API key not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Processing Sora URL:", soraUrl);

    // Update job status to processing
    await supabase
      .from('watermark_jobs')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', jobId);

    // Create watermark removal task
    console.log("Creating watermark removal task...");
    const taskResponse = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${kieApiKey}`,
      },
      body: JSON.stringify({
        model: "sora-watermark-remover",
        input: {
          video_url: soraUrl,
        },
      }),
    });

    const taskResult = await taskResponse.json();
    console.log("KIE.AI task response:", JSON.stringify(taskResult));

    if (!taskResponse.ok || taskResult.code !== 200) {
      const errorMsg = taskResult?.msg || taskResult?.message || "Failed to create task";
      const errorCode = taskResult?.code || taskResponse.status;
      
      // Save detailed error to database
      await supabase
        .from('watermark_jobs')
        .update({ 
          status: 'failed',
          error_message: `KIE Error ${errorCode}: ${errorMsg}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      throw new Error(`KIE Error ${errorCode}: ${errorMsg}`);
    }

    const taskId = taskResult.data.taskId;
    console.log("Task created:", taskId);

    // Update job with taskId
    await supabase
      .from('watermark_jobs')
      .update({ 
        task_id: taskId, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', jobId);

    // Poll for completion
    const maxAttempts = 60;
    let attempts = 0;
    let resultUrl: string | null = null;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;

      console.log(`Polling attempt ${attempts}/${maxAttempts}...`);

      const statusResponse = await fetch(`https://api.kie.ai/api/v1/jobs/${taskId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${kieApiKey}`,
        },
      });

      const statusResult = await statusResponse.json();
      console.log("Status check:", JSON.stringify(statusResult));

      if (statusResult.code === 200 && statusResult.data) {
        const status = statusResult.data.status;

        if (status === 'completed' || status === 'success') {
          resultUrl = statusResult.data.output?.video_url || 
                      statusResult.data.output?.url ||
                      statusResult.data.resultUrl ||
                      statusResult.data.output?.videoUrl;
          break;
        } else if (status === 'failed' || status === 'error') {
          const failMsg = statusResult.data.error || statusResult.data.message || "Processing failed";
          const failCode = statusResult.data.errorCode || statusResult.code;
          
          await supabase
            .from('watermark_jobs')
            .update({ 
              status: 'failed',
              error_message: `Task ${failCode}: ${failMsg}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', jobId);

          throw new Error(`Task ${failCode}: ${failMsg}`);
        }
      }
    }

    if (!resultUrl) {
      await supabase
        .from('watermark_jobs')
        .update({ 
          status: 'failed',
          error_message: "Processing timed out after 5 minutes",
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
      throw new Error("Processing timed out after 5 minutes");
    }

    // Update job as completed
    await supabase
      .from('watermark_jobs')
      .update({ 
        status: 'completed',
        result_url: resultUrl,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    console.log("Job completed successfully:", resultUrl);

    return new Response(
      JSON.stringify({
        success: true,
        resultUrl,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: unknown) {
    console.error("Error processing watermark job:", error);
    const errorMessage = error instanceof Error ? error.message : "Processing failed";

    // Update job status to failed if not already updated
    try {
      if (jobId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Check if already marked as failed
        const { data: job } = await supabase
          .from('watermark_jobs')
          .select('status')
          .eq('id', jobId)
          .single();

        if (job?.status !== 'failed') {
          await supabase
            .from('watermark_jobs')
            .update({ 
              status: 'failed',
              error_message: errorMessage,
              updated_at: new Date().toISOString()
            })
            .eq('id', jobId);
        }
      }
    } catch (e) {
      console.error("Failed to update job status:", e);
    }

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
