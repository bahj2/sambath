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
    const fileCount = parseInt(formData.get("fileCount") as string || "1");
    const mode = formData.get("mode") as string || "summarize";
    const question = formData.get("question") as string || "";
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Extract text from all files
    const fileContents: { name: string; content: string }[] = [];
    
    for (let i = 0; i < fileCount; i++) {
      const file = formData.get(`file${i}`) as File || formData.get("file") as File;
      if (!file) continue;

      console.log("Processing file:", file.name, "Size:", file.size);

      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      let textContent = "";
      
      // Try to extract readable text
      const decoder = new TextDecoder("utf-8", { fatal: false });
      const rawText = decoder.decode(bytes);
      
      // For plain text files
      if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        textContent = rawText;
      } else {
        // Extract text from PDF stream objects
        const streamMatches = rawText.match(/stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g);
        if (streamMatches) {
          for (const match of streamMatches) {
            const content = match.replace(/stream[\r\n]+/, '').replace(/[\r\n]+endstream/, '');
            const readable = content.replace(/[^\x20-\x7E\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
            if (readable.length > 20) {
              textContent += readable + "\n";
            }
          }
        }
        
        // Extract text from BT...ET blocks
        const textMatches = rawText.match(/BT[\s\S]*?ET/g);
        if (textMatches) {
          for (const match of textMatches) {
            const tjMatches = match.match(/\(([^)]+)\)\s*Tj/g);
            if (tjMatches) {
              for (const tj of tjMatches) {
                const text = tj.match(/\(([^)]+)\)/)?.[1] || '';
                if (text.length > 0) {
                  textContent += text + " ";
                }
              }
            }
          }
        }
      }
      
      // Clean up extracted text
      textContent = textContent
        .replace(/[^\x20-\x7E\n]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (textContent.length < 50) {
        console.log("Limited text extraction for:", file.name);
        textContent = `Document: ${file.name}\n(Note: Full text extraction was limited. Analysis based on available content.)`;
      }
      
      // Limit content length
      const maxLength = 6000;
      if (textContent.length > maxLength) {
        textContent = textContent.substring(0, maxLength) + "\n[Content truncated...]";
      }

      fileContents.push({ name: file.name, content: textContent });
    }

    if (fileContents.length === 0) {
      throw new Error("No files provided");
    }

    console.log("Total files processed:", fileContents.length);

    // Build prompt based on mode
    let systemPrompt = "";
    let userPrompt = "";
    
    const combinedContent = fileContents.map((f, i) => 
      `--- Document ${i + 1}: ${f.name} ---\n${f.content}`
    ).join("\n\n");
    
    switch (mode) {
      case "summarize":
        systemPrompt = `You are an expert document analyst. Provide a clear, structured summary.

Format your response with:
**Document Overview**
Brief description of what this document is about.

**Key Points**
• Main point 1
• Main point 2
(etc.)

**Important Details**
Notable specifics, numbers, dates, or facts.

**Summary**
2-3 sentence conclusion.`;
        userPrompt = `Summarize this document:\n\n${combinedContent}`;
        break;
        
      case "extract":
        systemPrompt = `You are a data extraction specialist. Extract and organize all key information.

Format your response with:
**Entities**
• Names, organizations, locations mentioned

**Key Data Points**
| Category | Value |
|----------|-------|
(Tables for structured data)

**Dates & Timelines**
• Important dates and deadlines

**Numbers & Statistics**
• All quantitative information

**References**
• Links, citations, or external references`;
        userPrompt = `Extract key data from this document:\n\n${combinedContent}`;
        break;
        
      case "qa":
        systemPrompt = `You are a helpful document assistant. Answer questions accurately based on the document content. If the information isn't in the document, say so clearly.`;
        userPrompt = `Based on this document:\n\n${combinedContent}\n\n**Question:** ${question || "What are the main points of this document?"}`;
        break;
        
      case "action":
        systemPrompt = `You are a task extraction specialist. Find all actionable items.

Format your response with:
**High Priority Tasks**
☐ Task with deadline (if mentioned)

**Medium Priority Tasks**  
☐ Task description

**Low Priority / Suggestions**
☐ Optional items

**Deadlines Summary**
| Task | Due Date | Owner |
|------|----------|-------|

**Dependencies**
Any tasks that depend on others.`;
        userPrompt = `Find all action items and tasks in this document:\n\n${combinedContent}`;
        break;
        
      case "compare":
        systemPrompt = `You are a document comparison expert. Compare the provided documents.

Format your response with:
**Documents Analyzed**
List of documents being compared.

**Similarities**
• Common points between documents

**Differences**
| Aspect | Document 1 | Document 2 |
|--------|-----------|-----------|

**Contradictions**
Any conflicting information.

**Synthesis**
Overall conclusion combining insights from all documents.`;
        userPrompt = `Compare these documents${question ? ` focusing on: ${question}` : ''}:\n\n${combinedContent}`;
        break;
        
      case "insights":
        systemPrompt = `You are a strategic insights analyst. Provide deep analysis and conclusions.

Format your response with:
**Executive Summary**
3-4 sentence overview.

**Key Insights**
💡 Insight 1 with explanation
💡 Insight 2 with explanation
(etc.)

**Trends & Patterns**
What patterns emerge from the content.

**Implications**
What this means for stakeholders.

**Recommendations**
Actionable suggestions based on the analysis.`;
        userPrompt = `Analyze this document and provide key insights:\n\n${combinedContent}`;
        break;
        
      default:
        systemPrompt = "You are a document analyst. Analyze the document and provide useful insights.";
        userPrompt = `Analyze this document:\n\n${combinedContent}`;
    }

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 4096,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }
      if (response.status === 402) {
        throw new Error("API credits exhausted. Please add credits to continue.");
      }
      
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const data = await response.json();
    
    const result = {
      content: data.choices?.[0]?.message?.content || "No analysis generated",
      citations: [],
      filesAnalyzed: fileContents.map(f => f.name),
      mode,
    };

    console.log("Successfully analyzed", fileContents.length, "document(s)");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Document Analysis Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
