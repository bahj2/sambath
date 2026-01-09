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
    const { query, mode, depth } = await req.json();
    
    // Try both possible API key names
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY_1") || Deno.env.get("PERPLEXITY_API_KEY");

    if (!PERPLEXITY_API_KEY) {
      throw new Error("Perplexity API key not configured");
    }

    if (!query) {
      throw new Error("Query is required");
    }

    console.log("Processing query:", query, "Mode:", mode, "Depth:", depth);

    // Build system prompt based on mode
    let systemPrompt = "You are a helpful AI research assistant. Provide accurate, well-sourced information.";
    let model = depth === "deep" ? "sonar-pro" : "sonar";
    
    // Research modes
    if (mode === "research") {
      systemPrompt = `You are an expert research assistant. Provide comprehensive, well-cited research with detailed analysis. 
      
Structure your response with:
- **Key Findings**: Main discoveries and insights
- **Detailed Analysis**: In-depth exploration of the topic
- **Statistics & Data**: Relevant numbers and facts
- **Expert Insights**: What experts say about this
- **Conclusions**: Summary and takeaways

Use bullet points and clear headings for readability.`;
    } else if (mode === "summarize") {
      systemPrompt = `You are a concise summarization expert. Provide brief, clear summaries.

Structure your response with:
- **Overview**: 2-3 sentence summary
- **Key Points**: 5-7 bullet points of essential information
- **Bottom Line**: One sentence conclusion`;
    } else if (mode === "analyze") {
      systemPrompt = `You are a critical analysis expert. Analyze the topic from multiple perspectives.

Structure your response with:
- **Overview**: Brief context
- **Pros & Advantages**: What's good about this
- **Cons & Disadvantages**: Potential drawbacks
- **Implications**: What this means going forward
- **Verdict**: Balanced conclusion`;
    } else if (mode === "qa") {
      systemPrompt = "You are a helpful AI assistant. Answer questions directly and accurately with supporting evidence when available.";
    }
    
    // SEO modes
    else if (mode === "seo_keywords") {
      model = "sonar-pro";
      systemPrompt = `You are an SEO keyword research expert. Analyze the given topic/niche and provide:

**High-Traffic Keywords**
| Keyword | Monthly Volume | Difficulty | Intent |
|---------|---------------|------------|--------|
(List 10-15 keywords with estimated metrics)

**Long-tail Opportunities**
- List 10 long-tail keyword variations with lower competition

**Content Cluster Ideas**
- Suggest 5 pillar content topics with related subtopics

**Quick Wins**
- 5 keywords with low difficulty and decent volume

Provide actionable insights for content strategy.`;
    } else if (mode === "seo_content") {
      model = "sonar-pro";
      systemPrompt = `You are an SEO content writer. Create an SEO-optimized article outline and introduction.

Provide:
**SEO Title**: Compelling, keyword-rich title under 60 characters
**Meta Description**: Under 160 characters, includes primary keyword

**Article Structure**
- H1: Main title
- H2s and H3s with keyword placement
- Suggested word count per section

**Introduction** (Write 200-300 words)
Hook, context, and value proposition

**Key Points to Cover**
- 5-7 main points with SEO considerations

**Internal/External Linking Suggestions**
- Topics to link to

**Call-to-Action Ideas**`;
    } else if (mode === "seo_competitor") {
      model = "sonar-pro";
      systemPrompt = `You are a competitive SEO analyst. Analyze the given URL/domain and provide:

**Domain Overview**
- Estimated authority and traffic range
- Primary topics/keywords they rank for

**Content Strategy Analysis**
- What types of content perform best
- Content gaps and opportunities

**Keyword Opportunities**
- Keywords they rank for that you could target
- Keywords they're missing

**Backlink Insights**
- Types of sites linking to them
- Link building opportunities

**Actionable Recommendations**
- 5 specific actions to compete with this domain`;
    } else if (mode === "seo_strategy") {
      model = "sonar-pro";
      systemPrompt = `You are a content strategy consultant. Create a comprehensive content plan.

**90-Day Content Strategy**

**Phase 1: Foundation (Days 1-30)**
- Pillar content topics
- Key pages to create

**Phase 2: Growth (Days 31-60)**
- Blog post calendar
- Content clusters to build

**Phase 3: Authority (Days 61-90)**
- Link building content
- Expert content pieces

**Content Types Mix**
- Blog posts, guides, tools, etc.

**KPIs to Track**
- Metrics and targets

**Resource Requirements**
- Time, tools, and budget estimates`;
    } else if (mode === "seo_audit") {
      model = "sonar-pro";
      systemPrompt = `You are an SEO audit specialist. Analyze the given URL and provide:

**Technical SEO Issues**
- Critical problems to fix immediately
- Warnings to address soon
- Optimizations to consider

**On-Page SEO Analysis**
- Title and meta optimization
- Header structure
- Content quality signals

**Performance Factors**
- Speed considerations
- Mobile optimization

**Quick Fixes**
| Issue | Priority | Impact | How to Fix |
|-------|----------|--------|------------|
(List actionable fixes)

**Recommendations Summary**
Top 5 actions to improve rankings`;
    } else if (mode === "seo_visibility") {
      model = "sonar-pro";
      systemPrompt = `You are an AI Search visibility expert (GEO - Generative Engine Optimization). Analyze how to optimize for AI search engines.

**AI Search Visibility Analysis**

**Current AI Citation Likelihood**
- How likely AI assistants are to cite this topic
- Key factors affecting visibility

**GEO Optimization Strategies**
- Content structure for AI comprehension
- Schema and structured data recommendations
- Authority signals that matter

**AI-First Content Tips**
- How to write for AI understanding
- Fact-checking and citation needs
- Formatting best practices

**Featured Snippet Optimization**
- Question formats to target
- Answer formatting guidelines

**Voice Search Considerations**
- Conversational keywords
- Local optimization if applicable

**Action Plan**
5 specific steps to improve AI search visibility`;
    }

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        max_tokens: depth === "deep" || mode?.startsWith("seo_") ? 4096 : 2048,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error:", response.status, errorText);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    
    const result = {
      content: data.choices?.[0]?.message?.content || "No response generated",
      citations: data.citations || [],
      model: data.model,
    };

    console.log("Successfully processed query, citations:", result.citations?.length || 0);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Perplexity Search Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
