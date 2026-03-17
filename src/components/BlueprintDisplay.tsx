import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface Props {
  imageUrl: string | null;
  prompt: string | null;
  isLoading: boolean;
}

const BlueprintDisplay = ({ imageUrl, prompt, isLoading }: Props) => {
  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "archiscan-blueprint.png";
    link.click();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Blueprint viewport */}
      <div className="relative flex-1 min-h-[400px] rounded-xl border border-border bg-muted/30 overflow-hidden">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--blueprint-grid)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--blueprint-grid)) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-2 border-primary/30 rounded-lg animate-pulse-glow" />
              <div className="absolute inset-2 border border-primary/50 rounded" />
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />
              </div>
            </div>
            <p className="font-mono text-sm text-muted-foreground">Generating blueprint...</p>
          </div>
        )}

        {!isLoading && !imageUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
              <span className="font-mono text-2xl text-muted-foreground">⌘</span>
            </div>
            <p className="font-mono text-sm text-muted-foreground text-center max-w-xs">
              Configure your floor plan parameters and click Generate Blueprint
            </p>
          </div>
        )}

        {!isLoading && imageUrl && (
          <img
            src={imageUrl}
            alt="Generated architectural blueprint"
            className="w-full h-full object-contain p-4"
          />
        )}
      </div>

      {/* Prompt display */}
      {prompt && (
        <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border">
          <p className="font-mono text-xs text-muted-foreground">
            <span className="text-primary">PROMPT:</span> {prompt}
          </p>
        </div>
      )}

      {/* Download */}
      {imageUrl && !isLoading && (
        <div className="mt-3 flex gap-2">
          <Button
            onClick={handleDownload}
            variant="outline"
            className="flex-1 font-mono border-border hover:bg-muted"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PNG
          </Button>
        </div>
      )}
    </div>
  );
};

export default BlueprintDisplay;
