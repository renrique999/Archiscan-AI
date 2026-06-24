import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type BlueprintRequest = {
  prompt?: string;
  layoutStyle?: "standard" | "compact" | "open" | "traditional";
};

const BLUEPRINT_WIDTH = 1200;
const BLUEPRINT_HEIGHT = 820;
const PLAN_X = 110;
const PLAN_Y = 120;
const PLAN_W = 980;
const PLAN_H = 570;

const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");

const parseFirstNumber = (text: string, patterns: RegExp[], fallback: number) => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return Math.max(1, Math.min(20_000, Number(match[1])));
  }
  return fallback;
};

const parseRooms = (prompt: string) => {
  const text = prompt.toLowerCase();
  return {
    plotSize: parseFirstNumber(text, [/(\d+)\s*(?:square\s*)?(?:feet|foot|ft|sq\s*ft|sqft)/i, /(\d+)\s*(?:square\s*)?(?:meters|metres|m|sqm|sq\s*m)/i], 1200),
    bedrooms: parseFirstNumber(text, [/(\d+)\s*bed/i], 2),
    bathrooms: parseFirstNumber(text, [/(\d+)\s*bath/i], 2),
    hasKitchen: /kitchen/i.test(prompt),
    hasLiving: /living/i.test(prompt),
    hasDining: /dining/i.test(prompt),
    hasParking: /parking|garage|car/i.test(prompt),
    hasGarden: /garden|yard|lawn/i.test(prompt),
    hasBalcony: /balcony|terrace/i.test(prompt),
  };
};

const roomLabel = (label: string, width: number, depth: number) => `${label}\n${Math.round(width)}' × ${Math.round(depth)}'`;

const getLayoutTemplate = (style: BlueprintRequest["layoutStyle"], rooms: ReturnType<typeof parseRooms>) => {
  const bedrooms = Math.max(1, Math.min(5, rooms.bedrooms));
  const bathrooms = Math.max(1, Math.min(4, rooms.bathrooms));

  if (style === "open") {
    const privateRoomW = PLAN_W * 0.24;
    const privateRoomH = PLAN_H / Math.max(2, bedrooms);
    const serviceH = PLAN_H * 0.28;
    const roomsList = [
      { label: "OPEN LIVING / DINING", x: PLAN_X, y: PLAN_Y, w: PLAN_W - privateRoomW, h: PLAN_H - serviceH, fill: "living" },
      { label: "KITCHEN", x: PLAN_X, y: PLAN_Y + PLAN_H - serviceH, w: (PLAN_W - privateRoomW) * 0.55, h: serviceH, fill: "service" },
      { label: "UTILITY", x: PLAN_X + (PLAN_W - privateRoomW) * 0.55, y: PLAN_Y + PLAN_H - serviceH, w: (PLAN_W - privateRoomW) * 0.45, h: serviceH, fill: "service" },
    ];
    for (let i = 0; i < bedrooms; i++) {
      roomsList.push({ label: `BEDROOM ${i + 1}`, x: PLAN_X + PLAN_W - privateRoomW, y: PLAN_Y + i * privateRoomH, w: privateRoomW, h: privateRoomH, fill: "private" });
    }
    for (let i = 0; i < bathrooms; i++) {
      roomsList.push({ label: i === 0 ? "BATH" : `BATH ${i + 1}`, x: PLAN_X + PLAN_W - privateRoomW, y: PLAN_Y + PLAN_H - (i + 1) * 88, w: privateRoomW, h: 88, fill: "bath" });
    }
    return roomsList;
  }

  if (style === "traditional") {
    const leftW = PLAN_W * 0.36;
    const hallW = PLAN_W * 0.14;
    const rightW = PLAN_W - leftW - hallW;
    const bedH = PLAN_H / bedrooms;
    const serviceH = PLAN_H / Math.max(2, bathrooms + 1);
    const roomsList = [
      { label: "LIVING ROOM", x: PLAN_X, y: PLAN_Y, w: leftW, h: PLAN_H * 0.5, fill: "living" },
      { label: "DINING", x: PLAN_X, y: PLAN_Y + PLAN_H * 0.5, w: leftW, h: PLAN_H * 0.22, fill: "living" },
      { label: "KITCHEN", x: PLAN_X, y: PLAN_Y + PLAN_H * 0.72, w: leftW, h: PLAN_H * 0.28, fill: "service" },
      { label: "HALLWAY", x: PLAN_X + leftW, y: PLAN_Y, w: hallW, h: PLAN_H, fill: "hall" },
    ];
    for (let i = 0; i < bedrooms; i++) {
      roomsList.push({ label: `BEDROOM ${i + 1}`, x: PLAN_X + leftW + hallW, y: PLAN_Y + i * bedH, w: rightW, h: bedH, fill: "private" });
    }
    for (let i = 0; i < bathrooms; i++) {
      roomsList.push({ label: i === 0 ? "BATH" : `BATH ${i + 1}`, x: PLAN_X + leftW, y: PLAN_Y + i * serviceH, w: hallW, h: serviceH, fill: "bath" });
    }
    return roomsList;
  }

  const compact = style === "compact";
  const livingH = compact ? PLAN_H * 0.34 : PLAN_H * 0.38;
  const kitchenW = PLAN_W * 0.34;
  const bottomH = PLAN_H - livingH;
  const bedColW = PLAN_W / Math.min(3, Math.max(2, bedrooms));
  const roomsList = [
    { label: rooms.hasLiving ? "LIVING ROOM" : "FAMILY AREA", x: PLAN_X, y: PLAN_Y, w: PLAN_W - kitchenW, h: livingH, fill: "living" },
    { label: rooms.hasKitchen ? "KITCHEN" : "SERVICE", x: PLAN_X + PLAN_W - kitchenW, y: PLAN_Y, w: kitchenW, h: livingH * 0.58, fill: "service" },
    { label: rooms.hasDining ? "DINING" : "ENTRY", x: PLAN_X + PLAN_W - kitchenW, y: PLAN_Y + livingH * 0.58, w: kitchenW, h: livingH * 0.42, fill: "living" },
  ];

  for (let i = 0; i < bedrooms; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const rows = Math.ceil(bedrooms / 3);
    roomsList.push({
      label: `BEDROOM ${i + 1}`,
      x: PLAN_X + col * bedColW,
      y: PLAN_Y + livingH + row * (bottomH / rows),
      w: bedColW,
      h: bottomH / rows,
      fill: "private",
    });
  }

  const bathW = PLAN_W * 0.18;
  for (let i = 0; i < bathrooms; i++) {
    roomsList.push({
      label: i === 0 ? "BATH" : `BATH ${i + 1}`,
      x: PLAN_X + PLAN_W - bathW,
      y: PLAN_Y + livingH + i * Math.min(110, bottomH / bathrooms),
      w: bathW,
      h: Math.min(110, bottomH / bathrooms),
      fill: "bath",
    });
  }

  if (rooms.hasParking) roomsList.push({ label: "PARKING", x: PLAN_X, y: PLAN_Y - 88, w: 250, h: 72, fill: "outdoor" });
  if (rooms.hasGarden) roomsList.push({ label: "GARDEN", x: PLAN_X + PLAN_W - 260, y: PLAN_Y - 88, w: 260, h: 72, fill: "outdoor" });
  if (rooms.hasBalcony) roomsList.push({ label: "BALCONY", x: PLAN_X + PLAN_W - 280, y: PLAN_Y + PLAN_H + 16, w: 280, h: 54, fill: "outdoor" });

  return roomsList;
};

const fillByType: Record<string, string> = {
  living: "#103b55",
  private: "#0d344c",
  service: "#164661",
  bath: "#12364b",
  hall: "#092b40",
  outdoor: "#0c3f35",
};

const buildBlueprintSvg = (prompt: string, style: BlueprintRequest["layoutStyle"] = "standard") => {
  const rooms = parseRooms(prompt);
  const layoutRooms = getLayoutTemplate(style, rooms);
  const plotLabel = `${rooms.plotSize.toLocaleString()} sq ft concept plan`;
  const styleLabel = style === "compact" ? "COMPACT OPTION" : style === "open" ? "OPEN PLAN OPTION" : style === "traditional" ? "TRADITIONAL OPTION" : "AI GENERATED CONCEPT";

  const roomSvg = layoutRooms
    .map((room) => {
      const widthFt = (room.w / PLAN_W) * Math.sqrt(rooms.plotSize * 1.35);
      const depthFt = (room.h / PLAN_H) * Math.sqrt(rooms.plotSize / 1.35);
      const lines = roomLabel(room.label, widthFt, depthFt).split("\n");
      return `
        <g>
          <rect x="${room.x}" y="${room.y}" width="${room.w}" height="${room.h}" fill="${fillByType[room.fill] ?? fillByType.private}" stroke="#d8fbff" stroke-width="5"/>
          <rect x="${room.x + 10}" y="${room.y + 10}" width="${Math.max(0, room.w - 20)}" height="${Math.max(0, room.h - 20)}" fill="none" stroke="#70dff2" stroke-width="1.4" stroke-dasharray="10 8" opacity="0.8"/>
          <text x="${room.x + room.w / 2}" y="${room.y + room.h / 2 - 8}" text-anchor="middle" font-family="monospace" font-size="${room.w < 150 ? 16 : 21}" font-weight="700" fill="#f2feff">${escapeXml(lines[0])}</text>
          <text x="${room.x + room.w / 2}" y="${room.y + room.h / 2 + 18}" text-anchor="middle" font-family="monospace" font-size="15" fill="#9beaf5">${escapeXml(lines[1])}</text>
        </g>`;
    })
    .join("");

  const doorSvg = [
    `<path d="M ${PLAN_X + 85} ${PLAN_Y + PLAN_H} L ${PLAN_X + 175} ${PLAN_Y + PLAN_H} A 90 90 0 0 0 ${PLAN_X + 85} ${PLAN_Y + PLAN_H - 90}" fill="none" stroke="#f7feff" stroke-width="4"/>`,
    `<line x1="${PLAN_X + 85}" y1="${PLAN_Y + PLAN_H}" x2="${PLAN_X + 85}" y2="${PLAN_Y + PLAN_H - 52}" stroke="#061b2b" stroke-width="8"/>`,
    `<path d="M ${PLAN_X + PLAN_W - 120} ${PLAN_Y + 4} A 70 70 0 0 1 ${PLAN_X + PLAN_W - 50} ${PLAN_Y + 74}" fill="none" stroke="#f7feff" stroke-width="4"/>`,
  ].join("");

  const gridLines = Array.from({ length: 30 }, (_, i) => {
    const x = i * 50;
    const y = i * 50;
    return `<line x1="${x}" y1="0" x2="${x}" y2="${BLUEPRINT_HEIGHT}"/><line x1="0" y1="${y}" x2="${BLUEPRINT_WIDTH}" y2="${y}"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${BLUEPRINT_WIDTH}" height="${BLUEPRINT_HEIGHT}" viewBox="0 0 ${BLUEPRINT_WIDTH} ${BLUEPRINT_HEIGHT}">
    <defs>
      <radialGradient id="glow" cx="50%" cy="45%" r="70%">
        <stop offset="0%" stop-color="#155d7d"/>
        <stop offset="100%" stop-color="#061b2b"/>
      </radialGradient>
      <filter id="softGlow"><feGaussianBlur stdDeviation="2.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#glow)"/>
    <g stroke="#2f7f9d" stroke-width="1" opacity="0.25">${gridLines}</g>
    <text x="60" y="54" font-family="monospace" font-size="34" font-weight="800" fill="#f2feff">ARCHISCAN-AI FLOOR PLAN</text>
    <text x="62" y="86" font-family="monospace" font-size="16" fill="#9beaf5">${escapeXml(styleLabel)} • ${escapeXml(plotLabel)}</text>
    <rect x="${PLAN_X}" y="${PLAN_Y}" width="${PLAN_W}" height="${PLAN_H}" fill="none" stroke="#f7feff" stroke-width="10" filter="url(#softGlow)"/>
    ${roomSvg}
    ${doorSvg}
    <g stroke="#d8fbff" stroke-width="3" fill="none" opacity="0.92">
      <line x1="${PLAN_X}" y1="${PLAN_Y + PLAN_H + 42}" x2="${PLAN_X + PLAN_W}" y2="${PLAN_Y + PLAN_H + 42}"/>
      <line x1="${PLAN_X}" y1="${PLAN_Y + PLAN_H + 30}" x2="${PLAN_X}" y2="${PLAN_Y + PLAN_H + 54}"/>
      <line x1="${PLAN_X + PLAN_W}" y1="${PLAN_Y + PLAN_H + 30}" x2="${PLAN_X + PLAN_W}" y2="${PLAN_Y + PLAN_H + 54}"/>
      <line x1="${PLAN_X - 42}" y1="${PLAN_Y}" x2="${PLAN_X - 42}" y2="${PLAN_Y + PLAN_H}"/>
      <line x1="${PLAN_X - 54}" y1="${PLAN_Y}" x2="${PLAN_X - 30}" y2="${PLAN_Y}"/>
      <line x1="${PLAN_X - 54}" y1="${PLAN_Y + PLAN_H}" x2="${PLAN_X - 30}" y2="${PLAN_Y + PLAN_H}"/>
    </g>
    <text x="${PLAN_X + PLAN_W / 2}" y="${PLAN_Y + PLAN_H + 76}" text-anchor="middle" font-family="monospace" font-size="16" fill="#9beaf5">FRONTAGE / MAIN DIMENSION</text>
    <text x="${PLAN_X - 76}" y="${PLAN_Y + PLAN_H / 2}" text-anchor="middle" transform="rotate(-90 ${PLAN_X - 76} ${PLAN_Y + PLAN_H / 2})" font-family="monospace" font-size="16" fill="#9beaf5">DEPTH</text>
    <text x="60" y="${BLUEPRINT_HEIGHT - 38}" font-family="monospace" font-size="13" fill="#70dff2">Conceptual college-demo blueprint generated instantly without paid AI image credits. Verify dimensions with a licensed architect before construction.</text>
  </svg>`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, layoutStyle = "standard" } = (await req.json()) as BlueprintRequest;
    if (!prompt?.trim()) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Generating deterministic blueprint SVG with prompt:", prompt.substring(0, 100) + "...");

    const svg = buildBlueprintSvg(prompt, layoutStyle);
    const imageUrl = `data:image/svg+xml;base64,${btoa(svg)}`;

    return new Response(JSON.stringify({ imageUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-blueprint error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});