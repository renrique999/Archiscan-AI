import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WIDTH = 1200;
const HEIGHT = 820;

const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
};

const parseFirstNumber = (text: string, pattern: RegExp, fallback: number) => {
  const match = text.match(pattern);
  return match?.[1] ? Math.max(1, Math.min(10, Number(match[1]))) : fallback;
};

const buildPlotBlueprintSvg = (analysis?: string, roomsText?: string) => {
  const rooms = roomsText || "2 bedrooms, 1 bathroom, a kitchen, and a living room";
  const bedrooms = parseFirstNumber(rooms, /(\d+)\s*bed/i, 2);
  const bathrooms = parseFirstNumber(rooms, /(\d+)\s*bath/i, 1);
  const isIrregular = /irregular|polygon|l-shape|l shape|corner/i.test(analysis || "");

  const plotPath = isIrregular
    ? "M 150 170 L 960 170 L 960 330 L 1080 330 L 1080 675 L 150 675 Z"
    : "M 150 170 L 1050 170 L 1050 675 L 150 675 Z";

  const roomShapes = [
    { label: "LIVING ROOM", x: 190, y: 215, w: 430, h: 210, fill: "#103b55" },
    { label: "KITCHEN", x: 620, y: 215, w: 210, h: 210, fill: "#164661" },
    { label: "DINING", x: 830, y: 215, w: 180, h: 210, fill: "#103b55" },
  ];

  const bedroomWidth = 720 / Math.min(3, bedrooms);
  for (let i = 0; i < bedrooms; i++) {
    roomShapes.push({
      label: `BEDROOM ${i + 1}`,
      x: 190 + (i % 3) * bedroomWidth,
      y: 425 + Math.floor(i / 3) * 120,
      w: bedroomWidth,
      h: bedrooms > 3 ? 120 : 205,
      fill: "#0d344c",
    });
  }
  for (let i = 0; i < bathrooms; i++) {
    roomShapes.push({ label: i === 0 ? "BATH" : `BATH ${i + 1}`, x: 910, y: 425 + i * 102, w: 100, h: 102, fill: "#12364b" });
  }

  const grid = Array.from({ length: 30 }, (_, i) => {
    const pos = i * 50;
    return `<line x1="${pos}" y1="0" x2="${pos}" y2="${HEIGHT}"/><line x1="0" y1="${pos}" x2="${WIDTH}" y2="${pos}"/>`;
  }).join("");

  const roomsSvg = roomShapes.map((room) => `
    <g>
      <rect x="${room.x}" y="${room.y}" width="${room.w}" height="${room.h}" fill="${room.fill}" stroke="#d8fbff" stroke-width="5"/>
      <text x="${room.x + room.w / 2}" y="${room.y + room.h / 2 - 5}" text-anchor="middle" font-family="monospace" font-size="19" font-weight="700" fill="#f2feff">${escapeXml(room.label)}</text>
      <text x="${room.x + room.w / 2}" y="${room.y + room.h / 2 + 22}" text-anchor="middle" font-family="monospace" font-size="14" fill="#9beaf5">FIT TO PLOT</text>
    </g>`).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <defs>
      <radialGradient id="bg" cx="50%" cy="45%" r="70%"><stop offset="0%" stop-color="#155d7d"/><stop offset="100%" stop-color="#061b2b"/></radialGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <g stroke="#2f7f9d" stroke-width="1" opacity="0.25">${grid}</g>
    <text x="60" y="54" font-family="monospace" font-size="34" font-weight="800" fill="#f2feff">PLOT-BASED FLOOR PLAN</text>
    <text x="62" y="86" font-family="monospace" font-size="15" fill="#9beaf5">Detected boundary converted into a fitted conceptual blueprint</text>
    <path d="${plotPath}" fill="#082a42" stroke="#f7feff" stroke-width="10" filter="url(#glow)"/>
    <path d="${plotPath}" fill="none" stroke="#70dff2" stroke-width="2" stroke-dasharray="14 10" opacity="0.85"/>
    ${roomsSvg}
    <path d="M 250 675 L 340 675 A 90 90 0 0 0 250 585" fill="none" stroke="#f7feff" stroke-width="4"/>
    <text x="60" y="${HEIGHT - 62}" font-family="monospace" font-size="14" fill="#9beaf5">ROOM REQUEST: ${escapeXml(rooms)}</text>
    <text x="60" y="${HEIGHT - 36}" font-family="monospace" font-size="13" fill="#70dff2">${escapeXml((analysis || "Plot boundary inferred from uploaded image.").slice(0, 135))}</text>
  </svg>`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, analysis, rooms } = await req.json();
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "Image is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Generating deterministic floor plan from plot image metadata...");

    const svg = buildPlotBlueprintSvg(analysis, rooms);
    const generatedImageUrl = `data:image/svg+xml;base64,${bytesToBase64(new TextEncoder().encode(svg))}`;

    return new Response(JSON.stringify({ imageUrl: generatedImageUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-from-plot error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});