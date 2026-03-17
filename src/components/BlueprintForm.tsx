import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ruler, BedDouble, Bath, ChefHat, Sofa } from "lucide-react";

export interface BlueprintParams {
  plotSize: number;
  plotUnit: "sqft" | "sqm";
  bedrooms: number;
  bathrooms: number;
  hasKitchen: boolean;
  hasLivingRoom: boolean;
  hasBalcony: boolean;
  hasParking: boolean;
  hasGarden: boolean;
}

interface Props {
  onGenerate: (params: BlueprintParams) => void;
  isLoading: boolean;
}

const BlueprintForm = ({ onGenerate, isLoading }: Props) => {
  const [params, setParams] = useState<BlueprintParams>({
    plotSize: 1200,
    plotUnit: "sqft",
    bedrooms: 2,
    bathrooms: 2,
    hasKitchen: true,
    hasLivingRoom: true,
    hasBalcony: false,
    hasParking: false,
    hasGarden: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(params);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Plot Size */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-foreground font-mono text-sm">
          <Ruler className="h-4 w-4 text-primary" />
          Plot Size
        </Label>
        <div className="flex gap-2">
          <Input
            type="number"
            value={params.plotSize}
            onChange={(e) => setParams({ ...params, plotSize: Number(e.target.value) })}
            className="bg-muted border-border font-mono text-foreground"
            min={200}
            max={10000}
          />
          <Select
            value={params.plotUnit}
            onValueChange={(v) => setParams({ ...params, plotUnit: v as "sqft" | "sqm" })}
          >
            <SelectTrigger className="w-24 bg-muted border-border font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sqft">sq ft</SelectItem>
              <SelectItem value="sqm">sq m</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Rooms */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-foreground font-mono text-sm">
            <BedDouble className="h-4 w-4 text-primary" />
            Bedrooms
          </Label>
          <Select
            value={String(params.bedrooms)}
            onValueChange={(v) => setParams({ ...params, bedrooms: Number(v) })}
          >
            <SelectTrigger className="bg-muted border-border font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-foreground font-mono text-sm">
            <Bath className="h-4 w-4 text-primary" />
            Bathrooms
          </Label>
          <Select
            value={String(params.bathrooms)}
            onValueChange={(v) => setParams({ ...params, bathrooms: Number(v) })}
          >
            <SelectTrigger className="bg-muted border-border font-mono">
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

      {/* Required rooms */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
          <Checkbox
            id="kitchen"
            checked={params.hasKitchen}
            onCheckedChange={(c) => setParams({ ...params, hasKitchen: !!c })}
          />
          <Label htmlFor="kitchen" className="flex items-center gap-2 font-mono text-sm cursor-pointer">
            <ChefHat className="h-4 w-4 text-primary" />
            Kitchen
          </Label>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
          <Checkbox
            id="living"
            checked={params.hasLivingRoom}
            onCheckedChange={(c) => setParams({ ...params, hasLivingRoom: !!c })}
          />
          <Label htmlFor="living" className="flex items-center gap-2 font-mono text-sm cursor-pointer">
            <Sofa className="h-4 w-4 text-primary" />
            Living Room
          </Label>
        </div>
      </div>

      {/* Optional features */}
      <div className="space-y-2">
        <Label className="font-mono text-sm text-muted-foreground">Optional Features</Label>
        <div className="flex flex-wrap gap-3">
          {[
            { key: "hasBalcony" as const, label: "Balcony" },
            { key: "hasParking" as const, label: "Parking" },
            { key: "hasGarden" as const, label: "Garden" },
          ].map(({ key, label }) => (
            <div
              key={key}
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2"
            >
              <Checkbox
                id={key}
                checked={params[key]}
                onCheckedChange={(c) => setParams({ ...params, [key]: !!c })}
              />
              <Label htmlFor={key} className="font-mono text-sm cursor-pointer">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary text-primary-foreground font-mono text-base h-12 hover:shadow-[0_0_20px_hsl(var(--blueprint-glow)/0.4)] transition-shadow"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Generating Blueprint...
          </span>
        ) : (
          "Generate Blueprint"
        )}
      </Button>
    </form>
  );
};

export default BlueprintForm;
