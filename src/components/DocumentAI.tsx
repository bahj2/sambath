import { useState, useRef, useEffect } from "react";
import { FileText, Upload, Sparkles, Download, Loader2, FileSearch, MessageSquare, ListChecks, Search, BookOpen, TrendingUp, ExternalLink, Globe, X, Zap, Target, BarChart3, PenTool, Eye, Lightbulb, Clock, History, Brain, Layers, Trash2, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
interface DocumentAIProps {
  isPro?: boolean;
}
type MainTab = "research" | "document" | "seo";
interface HistoryItem {
  id: string;
  title: string;
  query: string;
  mode: string;
  tab_type: string;
  result: string;
  citations: string[];
  files_analyzed: string[];
  created_at: string;
}
const researchModes = [{
  id: "research",
  name: "Research",
  icon: BookOpen,
  description: "Deep research with sources"
}, {
  id: "summarize",
  name: "Summarize",
  icon: FileText,
  description: "Concise summary"
}, {
  id: "analyze",
  name: "Analyze",
  icon: TrendingUp,
  description: "Critical analysis with pros/cons"
}, {
  id: "qa",
  name: "Ask AI",
  icon: MessageSquare,
  description: "Free-form Q&A"
}];
const documentModes = [{
  id: "summarize",
  name: "Summarize",
  icon: FileText,
  description: "Get a concise summary"
}, {
  id: "extract",
  name: "Extract Data",
  icon: FileSearch,
  description: "Pull key information"
}, {
  id: "qa",
  name: "Q&A",
  icon: MessageSquare,
  description: "Ask about the doc"
}, {
  id: "action",
  name: "Action Items",
  icon: ListChecks,
  description: "Find tasks & deadlines"
}, {
  id: "compare",
  name: "Compare",
  icon: Layers,
  description: "Compare documents"
}, {
  id: "insights",
  name: "Insights",
  icon: Lightbulb,
  description: "Key conclusions"
}];
const seoModes = [{
  id: "keywords",
  name: "Keyword Research",
  icon: Target,
  description: "High-traffic keywords"
}, {
  id: "content",
  name: "Content Generator",
  icon: PenTool,
  description: "SEO-optimized articles"
}, {
  id: "competitor",
  name: "Competitor Analysis",
  icon: BarChart3,
  description: "Analyze competition"
}, {
  id: "strategy",
  name: "Content Strategy",
  icon: Brain,
  description: "Planning & roadmap"
}, {
  id: "audit",
  name: "SEO Audit",
  icon: Eye,
  description: "Fix SEO issues"
}, {
  id: "visibility",
  name: "AI Visibility",
  icon: Zap,
  description: "GEO-style insights"
}];
const researchDepths = [{
  id: "quick",
  name: "Quick",
  icon: Zap,
  description: "Fast results"
}, {
  id: "deep",
  name: "Deep Research",
  icon: BookOpen,
  description: "Comprehensive analysis"
}];
export function DocumentAI({
  isPro = false
}: DocumentAIProps) {
  const {
    user
  } = useAuth();
  const [activeTab, setActiveTab] = useState<MainTab>("research");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Research state
  const [query, setQuery] = useState("");
  const [selectedResearchMode, setSelectedResearchMode] = useState("research");
  const [researchDepth, setResearchDepth] = useState<"quick" | "deep">("quick");

  // Document state
  const [files, setFiles] = useState<File[]>([]);
  const [selectedDocMode, setSelectedDocMode] = useState("summarize");
  const [docQuestion, setDocQuestion] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // SEO state
  const [seoQuery, setSeoQuery] = useState("");
  const [selectedSeoMode, setSelectedSeoMode] = useState("keywords");
  const [targetUrl, setTargetUrl] = useState("");

  // Shared state
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [citations, setCitations] = useState<string[]>([]);
  const [currentQuery, setCurrentQuery] = useState("");
  const [currentMode, setCurrentMode] = useState("");
  const [currentFilesAnalyzed, setCurrentFilesAnalyzed] = useState<string[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);

  // Load history on mount
  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);
  const loadHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const {
        data,
        error
      } = await supabase.from('research_history').select('*').eq('user_id', user.id).order('created_at', {
        ascending: false
      }).limit(50);
      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };
  const saveToHistory = async (title: string, queryText: string, mode: string, tabType: string, resultText: string, citationsList: string[], filesAnalyzed: string[] = []) => {
    if (!user) return;
    try {
      const {
        error
      } = await supabase.from('research_history').insert({
        user_id: user.id,
        title: title.substring(0, 100),
        query: queryText,
        mode,
        tab_type: tabType,
        result: resultText,
        citations: citationsList,
        files_analyzed: filesAnalyzed
      });
      if (error) throw error;
      loadHistory();
    } catch (error) {
      console.error("Failed to save to history:", error);
    }
  };
  const deleteHistoryItem = async (id: string) => {
    try {
      const {
        error
      } = await supabase.from('research_history').delete().eq('id', id);
      if (error) throw error;
      setHistory(prev => prev.filter(item => item.id !== id));
      toast.success("Deleted from history");
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("Failed to delete");
    }
  };
  const loadHistoryItem = (item: HistoryItem) => {
    setActiveTab(item.tab_type as MainTab);
    setResult(item.result);
    setCitations(item.citations || []);
    setCurrentQuery(item.query);
    setCurrentMode(item.mode);
    setCurrentFilesAnalyzed(item.files_analyzed || []);
    if (item.tab_type === "research") {
      setQuery(item.query);
      setSelectedResearchMode(item.mode);
    } else if (item.tab_type === "seo") {
      if (item.mode === "seo_audit" || item.mode === "seo_competitor") {
        setTargetUrl(item.query);
      } else {
        setSeoQuery(item.query);
      }
      setSelectedSeoMode(item.mode.replace("seo_", ""));
    }
    toast.success("Loaded from history");
    scrollToResults();
  };
  const handleResearch = async () => {
    if (!query.trim()) {
      toast.error("Please enter a search query");
      return;
    }
    setIsProcessing(true);
    setResult(null);
    setCitations([]);
    setCurrentQuery(query);
    setCurrentMode(selectedResearchMode);
    setCurrentFilesAnalyzed([]);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("perplexity-search", {
        body: {
          query: query.trim(),
          mode: selectedResearchMode,
          depth: researchDepth
        }
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setResult(data.content);
      setCitations(data.citations || []);

      // Auto-save to history
      const title = query.trim().substring(0, 50) + (query.length > 50 ? "..." : "");
      await saveToHistory(title, query, selectedResearchMode, "research", data.content, data.citations || []);
      toast.success("Research complete!");
      scrollToResults();
    } catch (error) {
      console.error("Research error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process query");
    } finally {
      setIsProcessing(false);
    }
  };
  const handleDocumentAnalysis = async () => {
    if (files.length === 0) {
      toast.error("Please upload a document");
      return;
    }
    setIsProcessing(true);
    setResult(null);
    setCitations([]);
    const fileNames = files.map(f => f.name);
    setCurrentFilesAnalyzed(fileNames);
    setCurrentMode(selectedDocMode);
    setCurrentQuery(docQuestion || `Analyzing ${fileNames.join(", ")}`);
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });
      formData.append("fileCount", files.length.toString());
      formData.append("mode", selectedDocMode);
      if ((selectedDocMode === "qa" || selectedDocMode === "compare") && docQuestion) {
        formData.append("question", docQuestion);
      }
      const {
        data,
        error
      } = await supabase.functions.invoke("analyze-document", {
        body: formData
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setResult(data.content);
      setCitations(data.citations || []);

      // Auto-save to history
      const title = fileNames[0] + (fileNames.length > 1 ? ` +${fileNames.length - 1} more` : "");
      await saveToHistory(title, docQuestion || selectedDocMode, selectedDocMode, "document", data.content, [], fileNames);
      toast.success("Document analyzed!");
      scrollToResults();
    } catch (error) {
      console.error("Document analysis error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to analyze document");
    } finally {
      setIsProcessing(false);
    }
  };
  const handleSeoAnalysis = async () => {
    const queryToUse = selectedSeoMode === "audit" || selectedSeoMode === "competitor" ? targetUrl : seoQuery;
    if (!queryToUse.trim()) {
      toast.error(selectedSeoMode === "audit" || selectedSeoMode === "competitor" ? "Please enter a URL to analyze" : "Please enter a topic or keyword");
      return;
    }
    setIsProcessing(true);
    setResult(null);
    setCitations([]);
    setCurrentQuery(queryToUse);
    setCurrentMode(`seo_${selectedSeoMode}`);
    setCurrentFilesAnalyzed([]);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("perplexity-search", {
        body: {
          query: queryToUse.trim(),
          mode: `seo_${selectedSeoMode}`,
          depth: "deep"
        }
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setResult(data.content);
      setCitations(data.citations || []);

      // Auto-save to history
      const title = queryToUse.trim().substring(0, 50) + (queryToUse.length > 50 ? "..." : "");
      await saveToHistory(title, queryToUse, `seo_${selectedSeoMode}`, "seo", data.content, data.citations || []);
      toast.success("SEO analysis complete!");
      scrollToResults();
    } catch (error) {
      console.error("SEO analysis error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to analyze");
    } finally {
      setIsProcessing(false);
    }
  };
  const scrollToResults = () => {
    setTimeout(() => {
      resultRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 100);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList) {
      const newFiles = Array.from(fileList);
      newFiles.forEach(f => validateAndAddFile(f));
    }
  };
  const validateAndAddFile = (f: File) => {
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }
    setFiles(prev => [...prev, f]);
    setResult(null);
    setCitations([]);
  };
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const fileList = e.dataTransfer.files;
    if (fileList) {
      Array.from(fileList).forEach(f => validateAndAddFile(f));
    }
  };
  const exportResults = () => {
    if (!result) return;
    let exportContent = `# Analysis Results\n\n## Response\n${result}`;
    if (citations.length > 0) {
      exportContent += `\n\n## Sources\n${citations.map((c, i) => `${i + 1}. ${c}`).join('\n')}`;
    }
    const blob = new Blob([exportContent], {
      type: "text/markdown"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analysis-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Results exported!");
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (activeTab === "research") handleResearch();else if (activeTab === "seo") handleSeoAnalysis();
    }
  };
  const getTabIcon = () => {
    switch (activeTab) {
      case "research":
        return <Globe className="w-8 h-8 text-white" />;
      case "document":
        return <FileText className="w-8 h-8 text-white" />;
      case "seo":
        return <Target className="w-8 h-8 text-white" />;
    }
  };
  const getLoadingText = () => {
    switch (activeTab) {
      case "research":
        return "Searching the web...";
      case "document":
        return "Analyzing document...";
      case "seo":
        return "Running SEO analysis...";
    }
  };
  const getEmptyText = () => {
    switch (activeTab) {
      case "research":
        return "Enter a query to search";
      case "document":
        return "Upload documents to analyze";
      case "seo":
        return "Enter a topic or URL to analyze";
    }
  };
  const getModeLabel = (mode: string) => {
    const allModes = [...researchModes, ...documentModes, ...seoModes.map(m => ({
      ...m,
      id: `seo_${m.id}`
    }))];
    return allModes.find(m => m.id === mode)?.name || mode;
  };
  const getTabLabel = (tabType: string) => {
    switch (tabType) {
      case "research":
        return "Web Research";
      case "document":
        return "Document";
      case "seo":
        return "SEO";
      default:
        return tabType;
    }
  };
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };
  return <div className="h-full w-full flex overflow-hidden">
      {/* History Sidebar */}
      <div className={cn("h-full bg-slate-950/95 backdrop-blur-xl border-r border-slate-700/50 transition-all duration-300 flex-shrink-0 overflow-hidden", showHistory ? "w-80" : "w-0")}>
        {showHistory && <div className="h-full flex flex-col p-4 w-80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-purple-400" />
                History
              </h3>
              <button onClick={() => setShowHistory(false)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {loadingHistory ? <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                </div> : history.length === 0 ? <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No history yet</p>
                  <p className="text-xs text-slate-600 mt-1">Your research will appear here</p>
                </div> : history.map(item => <div key={item.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/30 hover:border-purple-500/30 transition-all group cursor-pointer" onClick={() => loadHistoryItem(item)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                            {getTabLabel(item.tab_type)}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {getModeLabel(item.mode)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">{formatDate(item.created_at)}</p>
                      </div>
                      <button onClick={e => {
                e.stopPropagation();
                deleteHistoryItem(item.id);
              }} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>)}
            </div>
          </div>}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 h-full overflow-y-auto custom-scrollbar relative">
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 -z-10" />
        
        {/* Aurora blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-purple-600/20 to-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -left-20 w-[400px] h-[400px] bg-gradient-to-br from-cyan-600/15 to-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-gradient-to-t from-purple-600/10 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto text-primary">
          {/* Header */}
          <header className="mb-8 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest">AI POWERED</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-primary">
                  Document{" "}
                  <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">AI</span>
                </h1>
                <p className="mt-2 text-lg text-primary">
                  AI-powered research, document analysis & SEO content tools
                </p>
              </div>
              
              {/* History Toggle */}
              {user && <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)} className={cn("rounded-xl border-slate-600 text-slate-300 hover:bg-slate-800 gap-2", showHistory && "bg-slate-800 border-purple-500/50")}>
                  <History className="w-4 h-4" />
                  History
                  {history.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-purple-500/30 text-[10px] text-purple-300">
                      {history.length}
                    </span>}
                </Button>}
            </div>
          </header>

          {/* Main Tab Selector */}
          <div className="mb-8 animate-fade-in">
            <div className="inline-flex p-1.5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-lg">
              <button onClick={() => setActiveTab("research")} className={cn("flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300", activeTab === "research" ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/25" : "text-slate-400 hover:text-white")}>
                <Globe className="w-4 h-4" />
                Web Research
              </button>
              <button onClick={() => setActiveTab("document")} className={cn("flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300", activeTab === "document" ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/25" : "text-slate-400 hover:text-white")}>
                <FileText className="w-4 h-4" />
                PDF Analysis
              </button>
              <button onClick={() => setActiveTab("seo")} className={cn("flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300", activeTab === "seo" ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/25" : "text-slate-400 hover:text-white")}>
                <Target className="w-4 h-4" />
                SEO & Content AI
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6 items-start">
            {/* Left Column - Input */}
            <div className="space-y-5 flex flex-col">
              
              {/* Research Tab */}
              {activeTab === "research" && <>
                  {/* Research Query Card */}
                  <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 shadow-xl animate-fade-in">
                    <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-purple-500/20">
                        <Search className="w-5 h-5 text-purple-400" />
                      </div>
                      Research Query
                    </h3>
                    
                    <textarea value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder="Enter your research question or topic..." className="w-full h-28 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all placeholder:text-slate-500" />
                  </div>

                  {/* Research Depth */}
                  <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 shadow-xl animate-fade-in">
                    <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-cyan-500/20">
                        <Clock className="w-5 h-5 text-cyan-400" />
                      </div>
                      Research Depth
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {researchDepths.map(depth => {
                    const Icon = depth.icon;
                    return <button key={depth.id} onClick={() => setResearchDepth(depth.id as "quick" | "deep")} className={cn("p-4 rounded-xl text-left transition-all duration-200 border", researchDepth === depth.id ? "bg-purple-500/20 border-purple-500/50" : "bg-slate-800/30 border-slate-600/30 hover:bg-purple-500/10")}>
                            <Icon className={cn("w-5 h-5 mb-2", researchDepth === depth.id ? "text-purple-400" : "text-cyan-400")} />
                            <p className="text-sm font-medium text-white">{depth.name}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{depth.description}</p>
                          </button>;
                  })}
                    </div>
                  </div>

                  {/* Research Mode Card */}
                  <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 shadow-xl animate-fade-in">
                    <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-500/20">
                        <Sparkles className="w-5 h-5 text-blue-400" />
                      </div>
                      Research Mode
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {researchModes.map(mode => {
                    const Icon = mode.icon;
                    return <button key={mode.id} onClick={() => setSelectedResearchMode(mode.id)} className={cn("p-4 rounded-xl text-left transition-all duration-200 border", selectedResearchMode === mode.id ? "bg-purple-500/20 border-purple-500/50" : "bg-slate-800/30 border-slate-600/30 hover:bg-purple-500/10")}>
                            <Icon className={cn("w-5 h-5 mb-2", selectedResearchMode === mode.id ? "text-purple-400" : "text-blue-400")} />
                            <p className="text-sm font-medium text-white">{mode.name}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{mode.description}</p>
                          </button>;
                  })}
                    </div>
                  </div>

                  <Button onClick={handleResearch} disabled={!query.trim() || isProcessing} className="w-full h-12 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-lg shadow-purple-500/25 border-0">
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Globe className="w-4 h-4 mr-2" />}
                    {isProcessing ? "Researching..." : "Search with AI"}
                  </Button>
                </>}

              {/* Document Tab */}
              {activeTab === "document" && <>
                  {/* PDF Upload Card */}
                  <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 shadow-xl animate-fade-in" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                    <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-purple-500/20">
                        <Upload className="w-5 h-5 text-purple-400" />
                      </div>
                      Upload Documents
                      <span className="text-xs text-slate-500 ml-auto">Multiple files supported</span>
                    </h3>
                    
                    <div className="relative">
                      <input type="file" accept=".pdf,.txt,.md,.docx" multiple onChange={handleFileSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className={cn("h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-200", isDragging ? "border-purple-500 bg-purple-500/10" : files.length > 0 ? "border-purple-500/50 bg-purple-500/5" : "border-slate-600/50 hover:border-purple-500/50")}>
                        <FileText className="w-8 h-8 text-slate-500 mb-2" />
                        <p className="text-sm font-medium text-white">Drop files here or click to upload</p>
                        <p className="text-xs text-slate-500 mt-0.5">PDF, DOCX, TXT (max 10MB each)</p>
                      </div>
                    </div>

                    {/* Uploaded files list */}
                    {files.length > 0 && <div className="mt-4 space-y-2">
                        {files.map((file, index) => <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-600/30">
                            <FileText className="w-5 h-5 text-purple-400" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{file.name}</p>
                              <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <button onClick={() => removeFile(index)} className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>)}
                      </div>}
                  </div>

                  {/* Document Mode Card */}
                  <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 shadow-xl animate-fade-in">
                    <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-500/20">
                        <Sparkles className="w-5 h-5 text-blue-400" />
                      </div>
                      Analysis Type
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {documentModes.map(mode => {
                    const Icon = mode.icon;
                    return <button key={mode.id} onClick={() => setSelectedDocMode(mode.id)} className={cn("p-4 rounded-xl text-left transition-all duration-200 border", selectedDocMode === mode.id ? "bg-purple-500/20 border-purple-500/50" : "bg-slate-800/30 border-slate-600/30 hover:bg-purple-500/10")}>
                            <Icon className={cn("w-5 h-5 mb-2", selectedDocMode === mode.id ? "text-purple-400" : "text-blue-400")} />
                            <p className="text-sm font-medium text-white">{mode.name}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{mode.description}</p>
                          </button>;
                  })}
                    </div>

                    {(selectedDocMode === "qa" || selectedDocMode === "compare") && <input type="text" value={docQuestion} onChange={e => setDocQuestion(e.target.value)} placeholder={selectedDocMode === "compare" ? "What aspects should I compare?" : "Ask a question about the document..."} className="w-full mt-4 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all placeholder:text-slate-500" />}
                  </div>

                  <Button onClick={handleDocumentAnalysis} disabled={files.length === 0 || isProcessing} className="w-full h-12 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-lg shadow-purple-500/25 border-0">
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    {isProcessing ? "Analyzing..." : "Analyze Documents"}
                  </Button>
                </>}

              {/* SEO Tab */}
              {activeTab === "seo" && <>
                  {/* SEO Mode Card */}
                  <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 shadow-xl animate-fade-in">
                    <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-purple-500/20">
                        <Target className="w-5 h-5 text-purple-400" />
                      </div>
                      SEO Tool
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {seoModes.map(mode => {
                    const Icon = mode.icon;
                    return <button key={mode.id} onClick={() => setSelectedSeoMode(mode.id)} className={cn("p-4 rounded-xl text-left transition-all duration-200 border", selectedSeoMode === mode.id ? "bg-purple-500/20 border-purple-500/50" : "bg-slate-800/30 border-slate-600/30 hover:bg-purple-500/10")}>
                            <Icon className={cn("w-5 h-5 mb-2", selectedSeoMode === mode.id ? "text-purple-400" : "text-cyan-400")} />
                            <p className="text-sm font-medium text-white">{mode.name}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{mode.description}</p>
                          </button>;
                  })}
                    </div>
                  </div>

                  {/* SEO Input Card */}
                  <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 shadow-xl animate-fade-in">
                    <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-cyan-500/20">
                        <Search className="w-5 h-5 text-cyan-400" />
                      </div>
                      {selectedSeoMode === "audit" || selectedSeoMode === "competitor" ? "URL to Analyze" : "Topic or Keyword"}
                    </h3>
                    
                    {selectedSeoMode === "audit" || selectedSeoMode === "competitor" ? <input type="url" value={targetUrl} onChange={e => setTargetUrl(e.target.value)} onKeyDown={handleKeyDown} placeholder="https://example.com" className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all placeholder:text-slate-500" /> : <textarea value={seoQuery} onChange={e => setSeoQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder={selectedSeoMode === "keywords" ? "Enter your niche or topic for keyword research..." : selectedSeoMode === "content" ? "What topic should the article cover?" : selectedSeoMode === "strategy" ? "Describe your business and target audience..." : "Enter your query..."} className="w-full h-28 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all placeholder:text-slate-500" />}
                  </div>

                  <Button onClick={handleSeoAnalysis} disabled={(selectedSeoMode === "audit" || selectedSeoMode === "competitor" ? !targetUrl.trim() : !seoQuery.trim()) || isProcessing} className="w-full h-12 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 shadow-lg shadow-purple-500/25 border-0">
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Target className="w-4 h-4 mr-2" />}
                    {isProcessing ? "Analyzing..." : "Run SEO Analysis"}
                  </Button>
                </>}
            </div>

            {/* Right Column - Results */}
            <div ref={resultRef} className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 shadow-xl min-h-[600px] lg:min-h-[700px] animate-fade-in">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold text-white flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/20">
                    <FileSearch className="w-5 h-5 text-cyan-400" />
                  </div>
                  Results
                </h3>
                {result && <Button variant="outline" size="sm" onClick={exportResults} className="rounded-lg text-xs border-slate-600 text-slate-300 hover:bg-slate-800">
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Export
                  </Button>}
              </div>

              {isProcessing ? <div className="flex items-center justify-center h-80">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg shadow-purple-500/30">
                      {getTabIcon()}
                    </div>
                    <p className="text-sm font-medium text-white">{getLoadingText()}</p>
                    <p className="text-xs text-slate-500 mt-1.5">This may take a moment</p>
                  </div>
                </div> : result ? <div className="space-y-5 animate-fade-in">
                  <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap prose prose-invert prose-sm max-w-none">
                    {result}
                  </div>

                  {citations.length > 0 && <div className="pt-4 border-t border-slate-700/50">
                      <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-purple-400" />
                        Sources ({citations.length})
                      </h4>
                      <div className="space-y-2">
                        {citations.map((citation, index) => <a key={index} href={citation} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/50 border border-slate-600/30 hover:border-purple-500/50 transition-all group">
                            <span className="w-5 h-5 rounded-md bg-purple-500/20 flex items-center justify-center text-[10px] font-bold text-purple-400">
                              {index + 1}
                            </span>
                            <span className="text-xs text-slate-400 truncate flex-1 group-hover:text-white transition-colors">
                              {citation}
                            </span>
                            <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                          </a>)}
                      </div>
                    </div>}
                </div> : <div className="flex items-center justify-center h-80">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-sm font-medium text-white">Ready to analyze</p>
                    <p className="text-xs text-slate-500 mt-1.5">{getEmptyText()}</p>
                  </div>
                </div>}
            </div>
          </div>
        </div>
      </div>
    </div>;
}