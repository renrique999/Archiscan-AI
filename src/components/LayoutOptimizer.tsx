import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Cpu, Download, Ruler, BedDouble, Bath, ChefHat, Sofa, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LayoutOption {
  imageUrl: string;
  description: string;
}

const LayoutOptimizer = () => {
  const [plotSize, setPlotSize] = useState(1200);
  const [plotUnit, setPlotUnit] = useState<"sqft" | "sqm">("sqft");
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);
  const [hasKitchen, setHasKitchen] = useState(true);
  const [hasLivingRoom, setHasLivingRoom] = useState(true);
  const [hasDining, setHasDining] = useState(true);
  const [layouts, setLayouts] = useState<LayoutOption[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setLayouts([]);
    setSelectedIndex(null);
    setProgress(0);

    const rooms: string[] = [];
    rooms.push(`${bedrooms} bedroom${bedrooms > 1 ? "s" : ""}`);
    rooms.push(`${bathrooms} bathroom${bathrooms > 1 ? "s" : ""}`);
    if (hasKitchen) rooms.push("a kitchen");
    if (hasLivingRoom) rooms.push("a living room");
    if (hasDining) rooms.push("a dining area");

    const unit = plotUnit === "sqft" ? "square feet" : "square meters";
    const baseInfo = `${plotSize} ${unit} house with ${rooms.join(", ")}`;

    const layoutStyles = [
      {
        style: "compact and space-efficient",
        desc: "Compact Layout — Optimized for maximum space efficiency with minimal corridors.",
      },
      {
        style: "open-plan with flowing spaces",
        desc: "Open Plan Layout — Spacious feel with connected living, dining and kitchen areas.",
      },
      {
        style: "traditional with separated rooms and clear hallways",
        desc: "Traditional Layout — Clearly defined rooms with hallways for privacy.",
      },
    ];

    const results: LayoutOption[] = [];

    for (let i = 0; i < 3; i++) {
      setProgress(i + 1);
      try {
        const { data, error } = await supabase.functions.invoke("generate-blueprint", {
          body: {
            prompt: `Generate a clean, professional architectural 2D floor plan blueprint for a ${baseInfo}. The layout should be ${layoutStyles[i].style}. Follow architectural heuristics: living room near entrance, kitchen near dining, bedrooms in quieter zones, bathrooms near bedrooms. Include labeled rooms, dimensions, wall thickness, door openings. Use a technical blueprint style with white lines on blue background.`,
          },
        });
        if (error) throw error;
        if (data?.imageUrl) {
          results.push({ imageUrl: data.imageUrl, description: layoutStyles[i].desc });
          setLayouts([...results]);
        }
      } catch (err: any) {
        console.error(`Layout ${i + 1} error:`, err);
        toast.error(`Failed to generate layout option ${i + 1}`);
      }
    }

    if (results.length === 0) {
      toast.error("Failed to generate any layouts");
    } else {
      toast.success(`Generated ${results.length} layout option${results.length > 1 ? "s" : ""}!`);
    }
    setIsGenerating(false);
  };

  const handleDownload = (index: number) => {
    const layout = layouts[index];
    if (!layout) return;
    const link = document.createElement("a");
    link.href = layout.imageUrl;
    link.download = `archiscan-layout-${index + 1}.png`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-2 font-mono text-sm text-foreground">
            <Ruler className="h-4 w-4 text-primary" />
            Plot Size
          </Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={plotSize}
              onChange={(e) => setPlotSize(Number(e.target.value))}
              className="bg-muted border-border font-mono text-sm"
              min={200}
              max={10000}
            />
            <Select value={plotUnit} onValueChange={(v) => setPlotUnit(v as "sqft" | "sqm")}>
              <SelectTrigger className="w-24 bg-muted border-border font-mono text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sqft">sq ft</SelectItem>
                <SelectItem value="sqm">sq m</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 font-mono text-xs text-foreground">
              <BedDouble className="h-3.5 w-3.5 text-primary" />
              Bedrooms
            </Label>
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
            <Label className="flex items-center gap-2 font-mono text-xs text-foreground">
              <Bath className="h-3.5 w-3.5 text-primary" />
              Bathrooms
            </Label>
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

        <div className="flex flex-wrap gap-3">
          {[
            { id: "ok", label: "Kitchen", icon: ChefHat, checked: hasKitchen, set: setHasKitchen },
            { id: "ol", label: "Living Room", icon: Sofa, checked: hasLivingRoom, set: setHasLivingRoom },
            { id: "od", label: "Dining", icon: Sofa, checked: hasDining, set: setHasDining },
          ].map(({ id, label, checked, set }) => (
            <div key={id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
              <Checkbox id={id} checked={checked} onCheckedChange={(c) => set(!!c)} />
              <Label htmlFor={id} className="font-mono text-xs cursor-pointer">{label}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full font-mono text-sm h-11"
      >
        {isGenerating ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Generating Layout {progress}/3...
          </span>
        ) : (
          <>
            <Cpu className="h-4 w-4 mr-2" />
            Generate 3 Optimized Layouts
          </>
        )}
      </Button>

      {/* Loading placeholders */}
      {isGenerating && layouts.length < 3 && (
        <div className="space-y-3">
          {Array.from({ length: 3 - layouts.length }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg border border-border bg-muted/20 flex items-center justify-center">
              <span className="font-mono text-xs text-muted-foreground animate-pulse">
                {i === 0 && layouts.length < 3 ? `Generating layout ${layouts.length + 1}...` : "Waiting..."}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Layout results */}
      {layouts.length > 0 && (
        <div className="space-y-4">
          <Label className="font-mono text-sm text-primary">LAYOUT OPTIONS</Label>
          {layouts.map((layout, i) => (
            <div
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${
                selectedIndex === i
                  ? "border-primary shadow-[0_0_15px_hsl(var(--blueprint-glow)/0.3)]"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
                <span className="font-mono text-xs text-foreground flex items-center gap-2">
                  {selectedIndex === i && <Check className="h-3.5 w-3.5 text-primary" />}
                  Option {i + 1}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); handleDownload(i); }}
                  className="h-7 px-2 font-mono text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  PNG
                </Button>
              </div>
              <p className="px-4 py-2 font-mono text-xs text-muted-foreground bg-muted/20">
                {layout.description}
              </p>
              <div className="relative min-h-[250px] bg-muted/10">
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage:
                      "linear-gradient(hsl(var(--blueprint-grid)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--blueprint-grid)) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                  }}
                />
                <img
                  src={layout.imageUrl}
                  alt={`Layout option ${i + 1}`}
                  className="w-full h-full object-contain p-4 relative z-10"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LayoutOptimizer;
