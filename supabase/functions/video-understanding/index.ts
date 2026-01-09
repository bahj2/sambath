import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const videoFile = formData.get('video') as File;
    const prompt = formData.get('prompt') as string || 'Analyze this video and describe what you see in detail.';

    if (!videoFile) {
      return new Response(
        JSON.stringify({ error: 'No video file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GOOGLE_AI_STUDIO_API_KEY = Deno.env.get('GOOGLE_AI_STUDIO_API_KEY');
    if (!GOOGLE_AI_STUDIO_API_KEY) {
      console.error('GOOGLE_AI_STUDIO_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check file size - limit to 10MB for edge function memory
    if (videoFile.size > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Video file must be less than 10MB' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mimeType = videoFile.type || 'video/mp4';
    const numBytes = videoFile.size;

    console.log(`Processing video: ${videoFile.name}, size: ${numBytes}, type: ${mimeType}`);

    // Step 1: Start resumable upload to Google File API
    const startUploadResponse = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GOOGLE_AI_STUDIO_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'X-Goog-Upload-Protocol': 'resumable',
          'X-Goog-Upload-Command': 'start',
          'X-Goog-Upload-Header-Content-Length': numBytes.toString(),
          'X-Goog-Upload-Header-Content-Type': mimeType,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: { display_name: videoFile.name }
        })
      }
    );

    if (!startUploadResponse.ok) {
      const errorText = await startUploadResponse.text();
      console.error('Failed to start upload:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to start video upload' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const uploadUrl = startUploadResponse.headers.get('X-Goog-Upload-URL');
    if (!uploadUrl) {
      console.error('No upload URL received');
      return new Response(
        JSON.stringify({ error: 'Failed to get upload URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Got upload URL, uploading video...');

    // Step 2: Upload the video bytes
    const videoBytes = await videoFile.arrayBuffer();
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Length': numBytes.toString(),
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize',
      },
      body: videoBytes
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Failed to upload video:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to upload video' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fileInfo = await uploadResponse.json();
    const fileUri = fileInfo.file?.uri;
    const fileName = fileInfo.file?.name;

    if (!fileUri) {
      console.error('No file URI received:', fileInfo);
      return new Response(
        JSON.stringify({ error: 'Failed to get file URI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Video uploaded, waiting for processing...', fileName);

    // Step 3: Wait for file to be processed (poll for ACTIVE state)
    let fileState = 'PROCESSING';
    let attempts = 0;
    const maxAttempts = 30; // Wait up to 30 seconds

    while (fileState === 'PROCESSING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const checkResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${GOOGLE_AI_STUDIO_API_KEY}`
      );
      
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        fileState = checkData.state;
        console.log(`File state: ${fileState} (attempt ${attempts + 1})`);
      }
      attempts++;
    }

    if (fileState !== 'ACTIVE') {
      console.error('File processing failed or timed out:', fileState);
      return new Response(
        JSON.stringify({ error: 'Video processing timed out. Please try a shorter video.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('File ready, generating content...');

    // Step 4: Generate content using the uploaded file
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_STUDIO_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { file_data: { mime_type: mimeType, file_uri: fileUri } },
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);
      
      if (geminiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to analyze video' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    console.log('Analysis complete');

    const analysis = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No analysis generated';

    // Step 5: Clean up - delete the uploaded file
    try {
      await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${GOOGLE_AI_STUDIO_API_KEY}`,
        { method: 'DELETE' }
      );
      console.log('Cleaned up uploaded file');
    } catch (e) {
      console.log('Failed to clean up file:', e);
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        fileName: videoFile.name,
        fileSize: videoFile.size
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Video understanding error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
