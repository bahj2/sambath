import { useState, useEffect, useRef } from "react";
import { Link2, Download, Loader2, Video, Sparkles, X, Eraser, RefreshCw, Clock, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface WatermarkRemoverProps {
  isPro: boolean;
}

interface WatermarkJob {
  id: string;
  file_name: string;
  status: string;
  result_url: string | null;
  error_message: string | null;
  created_at: string;
}

export function WatermarkRemover({ isPro }: WatermarkRemoverProps) {
  const { user } = useAuth();
  const [soraUrl, setSoraUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentJob, setCurrentJob] = useState<WatermarkJob | null>(null);
  const [jobs, setJobs] = useState<WatermarkJob[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch existing jobs on mount
  useEffect(() => {
    if (user) {
      fetchJobs();
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [user]);

  // Poll for job updates when there's a processing job
  useEffect(() => {
    if (currentJob?.status === 'processing' && !isPolling) {
      setIsPolling(true);
      pollingRef.current = setInterval(async () => {
        const { data } = await supabase
          .from('watermark_jobs')
          .select('*')
          .eq('id', currentJob.id)
          .single();
        
        if (data) {
          setCurrentJob(data as WatermarkJob);
          if (data.status === 'completed' || data.status === 'failed') {
            setIsPolling(false);
            setIsProcessing(false);
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
            }
            fetchJobs();
            if (data.status === 'completed') {
              toast.success("Watermark removed successfully!");
            } else {
              toast.error(data.error_message || "Processing failed");
            }
          }
        }
      }, 3000);
    }
    return () => {
      if (pollingRef.current && !isPolling) {
        clearInterval(pollingRef.current);
      }
    };
  }, [currentJob?.id, currentJob?.status, isPolling]);

  const fetchJobs = async () => {
    const { data } = await supabase
      .from('watermark_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) {
      setJobs(data as WatermarkJob[]);
    }
  };

  const isValidSoraUrl = (url: string): boolean => {
    return url.includes('sora.chatgpt.com') || url.includes('sora.com') || url.includes('openai.com/sora');
  };

  const processUrl = async () => {
    if (!soraUrl.trim() || !user) {
      toast.error("Please enter a Sora URL");
      return;
    }

    if (!isValidSoraUrl(soraUrl)) {
      toast.error("Please enter a valid Sora URL (sora.chatgpt.com)");
      return;
    }

    setIsProcessing(true);
    setProgress(10);

    try {
      // Create job record
      const { data: jobData, error: jobError } = await supabase
        .from('watermark_jobs')
        .insert({
          user_id: user.id,
          file_name: `Sora Video - ${new Date().toLocaleTimeString()}`,
          file_path: soraUrl,
          status: 'pending',
        })
        .select()
        .single();

      if (jobError || !jobData) {
        throw new Error("Failed to create job record");
      }

      setProgress(30);
      setCurrentJob(jobData as WatermarkJob);

      // Call edge function
      toast.info("Starting watermark removal...");

      const { data, error } = await supabase.functions.invoke("process-watermark-job", {
        body: {
          jobId: jobData.id,
          soraUrl: soraUrl,
          userId: user.id,
        },
      });

      setProgress(100);

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success && data?.resultUrl) {
        setCurrentJob(prev => prev ? { ...prev, status: 'completed', result_url: data.resultUrl } : null);
        toast.success("Watermark removed successfully!");
        fetchJobs();
        setSoraUrl("");
      } else if (data?.error) {
        throw new Error(data.error);
      }

    } catch (error) {
      console.error("Error processing URL:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to process video";
      toast.error(errorMsg);
      setCurrentJob(prev => prev ? { ...prev, status: 'failed', error_message: errorMsg } : null);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearInput = () => {
    setSoraUrl("");
    setCurrentJob(null);
    setProgress(0);
  };

  const downloadResult = (url: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `cleaned_${fileName}.mp4`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download started!");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case 'processing':
        return (
          <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-full">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-blue-50/50 p-6 lg:p-10 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Eraser className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-700 mb-2">Login Required</h2>
            <p className="text-sm text-slate-500">Please log in to use the watermark remover.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-blue-50/50 p-6 lg:p-10 overflow-y-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
              <Eraser className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Sora Watermark Remover</h1>
              <p className="text-sm text-slate-500">Remove watermarks from OpenAI Sora videos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-semibold rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI Powered
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full flex items-center gap-1">
              <Video className="w-3 h-3" />
              Sora Only
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="border-slate-200/80 shadow-sm animate-slide-up" style={{ animationDelay: "50ms" }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Link2 className="w-5 h-5 text-slate-600" />
                Paste Sora URL
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type="url"
                    placeholder="https://sora.chatgpt.com/p/..."
                    value={soraUrl}
                    onChange={(e) => setSoraUrl(e.target.value)}
                    disabled={isProcessing}
                    className="pr-10"
                  />
                  {soraUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={clearInput}
                      disabled={isProcessing}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Only Sora video URLs (sora.chatgpt.com) are supported
                </p>
              </div>

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <div className="flex gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-700">
                    <p className="font-medium mb-1">How to get your Sora URL:</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-blue-600">
                      <li>Go to sora.chatgpt.com</li>
                      <li>Open your generated video</li>
                      <li>Copy the share URL from your browser</li>
                    </ol>
                  </div>
                </div>
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Processing...</span>
                    <span className="text-rose-600 font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              <Button
                className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
                onClick={processUrl}
                disabled={!soraUrl.trim() || isProcessing || !isValidSoraUrl(soraUrl)}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Eraser className="w-4 h-4 mr-2" />
                    Remove Watermark
                  </>
                )}
              </Button>

              {soraUrl && !isValidSoraUrl(soraUrl) && (
                <p className="text-xs text-amber-600 text-center">
                  ⚠️ URL must be from sora.chatgpt.com
                </p>
              )}
            </CardContent>
          </Card>

          {/* Result Section */}
          <Card className="border-slate-200/80 shadow-sm animate-slide-up" style={{ animationDelay: "100ms" }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose-600" />
                Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentJob?.status === 'completed' && currentJob.result_url ? (
                <div className="space-y-4">
                  <video
                    src={currentJob.result_url}
                    className="w-full rounded-xl max-h-64"
                    controls
                  />
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
                      onClick={() => downloadResult(currentJob.result_url!, currentJob.file_name)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      onClick={clearInput}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : currentJob?.status === 'processing' ? (
                <div className="border-2 border-dashed border-blue-200 rounded-xl p-10 text-center bg-blue-50/50">
                  <Loader2 className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
                  <p className="text-blue-600 font-medium">Processing your video...</p>
                  <p className="text-xs text-blue-400 mt-1">This may take a few minutes</p>
                </div>
              ) : currentJob?.status === 'failed' ? (
                <div className="border-2 border-dashed border-red-200 rounded-xl p-6 text-center bg-red-50/50">
                  <AlertCircle className="w-10 h-10 text-red-300 mx-auto mb-3" />
                  <p className="text-red-600 font-medium mb-2">Processing failed</p>
                  <p className="text-xs text-red-500 bg-red-100 rounded p-2 font-mono break-all">
                    {currentJob.error_message || "Unknown error"}
                  </p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={clearInput}>
                    Try Again
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center">
                  <Eraser className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 text-sm">
                    Clean video will appear here after processing
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Jobs */}
        {jobs.length > 0 && (
          <Card className="mt-6 border-slate-200/80 shadow-sm animate-slide-up" style={{ animationDelay: "150ms" }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-600" />
                Recent Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {jobs.slice(0, 5).map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Video className="w-8 h-8 text-slate-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-700 truncate">{job.file_name}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(job.created_at).toLocaleDateString()} {new Date(job.created_at).toLocaleTimeString()}
                        </p>
                        {job.status === 'failed' && job.error_message && (
                          <p className="text-xs text-red-500 truncate mt-0.5" title={job.error_message}>
                            {job.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStatusBadge(job.status)}
                      {job.status === 'completed' && job.result_url && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadResult(job.result_url!, job.file_name)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {[
            { title: "Sora Videos Only", desc: "Works exclusively with OpenAI Sora content" },
            { title: "AI Powered", desc: "Advanced AI removes watermarks cleanly" },
            { title: "Quick Processing", desc: "Results ready in minutes" },
          ].map((feature, index) => (
            <div
              key={feature.title}
              className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm animate-slide-up"
              style={{ animationDelay: `${200 + index * 50}ms` }}
            >
              <h3 className="font-semibold text-slate-700 text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-slate-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
