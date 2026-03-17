import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, ScanLine, Cpu, Download, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PlotImageUpload = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [blueprintUrl, setBlueprintUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(1);
  const [hasKitchen, setHasKitchen] = useState(true);
  const [hasLivingRoom, setHasLivingRoom] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Only JPG and PNG formats are supported");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
      setAnalysisResult(null);
      setBlueprintUrl(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!uploadedImage) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-plot-image", {
        body: { imageUrl: uploadedImage },
      });
      if (error) throw error;
      if (data?.analysis) {
        setAnalysisResult(data.analysis);
        toast.success("Plot shape detected successfully!");
      } else {
        throw new Error("No analysis returned");
      }
    } catch (err: any) {
      console.error("Analysis error:", err);
      toast.error(err.message || "Failed to analyze plot image");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!uploadedImage) return;
    setIsGenerating(true);
    setBlueprintUrl(null);
    try {
      const rooms: string[] = [];
      rooms.push(`${bedrooms} bedroom${bedrooms > 1 ? "s" : ""}`);
      rooms.push(`${bathrooms} bathroom${bathrooms > 1 ? "s" : ""}`);
      if (hasKitchen) rooms.push("a kitchen");
      if (hasLivingRoom) rooms.push("a living room");

      const { data, error } = await supabase.functions.invoke("generate-from-plot", {
        body: {
          imageUrl: uploadedImage,
          analysis: analysisResult,
          rooms: rooms.join(", "),
        },
      });
      if (error) throw error;
      if (data?.imageUrl) {
        setBlueprintUrl(data.imageUrl);
        toast.success("Blueprint generated from plot image!");
      } else {
        throw new Error("No image returned");
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      toast.error(err.message || "Failed to generate blueprint");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!blueprintUrl) return;
    const link = document.createElement("a");
    link.href = blueprintUrl;
    link.download = "archiscan-plot-blueprint.png";
    link.click();
  };

  const clearImage = () => {
    setUploadedImage(null);
    setAnalysisResult(null);
    setBlueprintUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Upload section */}
      <div className="space-y-3">
        <Label className="font-mono text-sm text-foreground">Upload Plot Image</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          className="hidden"
        />

        {!uploadedImage ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-40 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer"
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="font-mono text-sm text-muted-foreground">
              Click to upload JPG or PNG
            </span>
          </button>
        ) : (
          <div className="relative rounded-xl border border-border overflow-hidden">
            <img src={uploadedImage} alt="Uploaded plot" className="w-full h-48 object-contain bg-muted/30 p-2" />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 border border-border flex items-center justify-center hover:bg-destructive/20 transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

      {/* Room config */}
      {uploadedImage && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-mono text-xs text-muted-foreground">Bedrooms</Label>
              <Select value={String(bedrooms)} onValueChange={(v) => setBedrooms(Number(v))}>
                <SelectTrigger className="bg-muted border-border font-mono text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-xs text-muted-foreground">Bathrooms</Label>
              <Select value={String(bathrooms)} onValueChange={(v) => setBathrooms(Number(v))}>
                <SelectTrigger className="bg-muted border-border font-mono text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Checkbox id="pk" checked={hasKitchen} onCheckedChange={(c) => setHasKitchen(!!c)} />
              <Label htmlFor="pk" className="font-mono text-xs cursor-pointer">Kitchen</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="pl" checked={hasLivingRoom} onCheckedChange={(c) => setHasLivingRoom(!!c)} />
              <Label htmlFor="pl" className="font-mono text-xs cursor-pointer">Living Room</Label>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {uploadedImage && (
        <div className="flex gap-2">
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || isGenerating}
            variant="outline"
            className="flex-1 font-mono text-sm h-10 border-border"
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Analyzing...
              </span>
            ) : (
              <>
                <ScanLine className="h-4 w-4 mr-1" />
                Detect Plot Shape
              </>
            )}
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || isAnalyzing}
            className="flex-1 font-mono text-sm h-10"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Generating...
              </span>
            ) : (
              <>
                <Cpu className="h-4 w-4 mr-1" />
                Generate Floor Plan
              </>
            )}
          </Button>
        </div>
      )}

      {/* Analysis result */}
      {analysisResult && (
        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <p className="font-mono text-xs text-muted-foreground">
            <span className="text-primary">ANALYSIS:</span> {analysisResult}
          </p>
        </div>
      )}

      {/* Blueprint output */}
      {(isGenerating || blueprintUrl) && (
        <div className="relative min-h-[300px] rounded-xl border border-border bg-muted/30 overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--blueprint-grid)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--blueprint-grid)) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          {isGenerating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-2 border-primary/30 rounded-lg animate-pulse-glow" />
                <div className="absolute inset-2 border border-primary/50 rounded" />
                <div className="absolute inset-0 overflow-hidden rounded-lg">
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />
                </div>
              </div>
              <p className="font-mono text-xs text-muted-foreground">Generating from plot...</p>
            </div>
          )}
          {!isGenerating && blueprintUrl && (
            <img src={blueprintUrl} alt="Generated blueprint" className="w-full h-full object-contain p-4" />
          )}
        </div>
      )}

      {blueprintUrl && !isGenerating && (
        <Button onClick={handleDownload} variant="outline" className="w-full font-mono text-sm border-border">
          <Download className="h-4 w-4 mr-2" />
          Download PNG
        </Button>
      )}
    </div>
  );
};

export default PlotImageUpload;
