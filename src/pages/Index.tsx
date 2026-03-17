import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BlueprintForm, { type BlueprintParams } from "@/components/BlueprintForm";
import BlueprintDisplay from "@/components/BlueprintDisplay";
import { Cpu } from "lucide-react";

const Index = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const buildPrompt = (p: BlueprintParams): string => {
    const features: string[] = [];
    features.push(`${p.bedrooms} bedroom${p.bedrooms > 1 ? "s" : ""}`);
    features.push(`${p.bathrooms} bathroom${p.bathrooms > 1 ? "s" : ""}`);
    if (p.hasKitchen) features.push("a kitchen");
    if (p.hasLivingRoom) features.push("a living room");
    if (p.hasBalcony) features.push("a balcony");
    if (p.hasParking) features.push("a parking area");
    if (p.hasGarden) features.push("a garden");

    const unit = p.plotUnit === "sqft" ? "square feet" : "square meters";
    return `Generate a clean, professional architectural 2D floor plan blueprint for a ${p.plotSize} ${unit} house with ${features.join(", ")}. The image should look like a technical blueprint with labeled rooms, dimensions, wall thickness, door openings, and a clean white-on-blue blueprint style. Include room labels and approximate dimensions.`;
  };

  const handleGenerate = async (params: BlueprintParams) => {
    setIsLoading(true);
    const generatedPrompt = buildPrompt(params);
    setPrompt(generatedPrompt);
    setImageUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-blueprint", {
        body: { prompt: generatedPrompt },
      });

      if (error) throw error;
      if (data?.imageUrl) {
        setImageUrl(data.imageUrl);
        toast.success("Blueprint generated successfully!");
      } else {
        throw new Error("No image returned");
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      toast.error(err.message || "Failed to generate blueprint");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Cpu className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-mono text-lg font-bold text-foreground tracking-tight">
              Archiscan-AI
            </h1>
            <p className="font-mono text-xs text-muted-foreground">
              Instant Blueprint Generation
            </p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
          {/* Left panel - Form */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-mono text-sm font-semibold text-primary mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
                CONFIGURATION
              </h2>
              <BlueprintForm onGenerate={handleGenerate} isLoading={isLoading} />
            </div>
          </div>

          {/* Right panel - Blueprint display */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-6 h-full">
              <h2 className="font-mono text-sm font-semibold text-primary mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
                BLUEPRINT OUTPUT
              </h2>
              <BlueprintDisplay imageUrl={imageUrl} prompt={prompt} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
