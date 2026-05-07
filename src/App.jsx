import { useState, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — matching truvami.com
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  teal:      "#3DCCA0", tealDark: "#2BAE85", tealLight: "#E8FBF5",
  dark:      "#141414",
  text:      "#1A1A1A", textMid: "#555555",  textLight: "#888888",
  bg:        "#F7F9FC", white: "#FFFFFF",    border: "#E4E8EF",
  danger:    "#E05252", warn: "#F5A623",
  mono:      "'IBM Plex Mono', monospace",
  sans:      "'Inter', 'Helvetica Neue', sans-serif",
};

// ─────────────────────────────────────────────────────────────────────────────
// PERSISTENT AI CONFIG  (localStorage, 1-month TTL)
// ─────────────────────────────────────────────────────────────────────────────
const AI_CONFIG_KEY = "truvami_ai_config_v1";
const ONE_MONTH_MS  = 30 * 24 * 60 * 60 * 1000;

function loadAiConfig() {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY);
    if (!raw) return { endpoint: "", apiKey: "", deployment: "gpt-4o" };
    const { data, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) { localStorage.removeItem(AI_CONFIG_KEY); return { endpoint: "", apiKey: "", deployment: "gpt-4o" }; }
    return data;
  } catch { return { endpoint: "", apiKey: "", deployment: "gpt-4o" }; }
}

function saveAiConfig(cfg) {
  try { localStorage.setItem(AI_CONFIG_KEY, JSON.stringify({ data: cfg, expiresAt: Date.now() + ONE_MONTH_MS })); } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT CATALOG  — names anonymised, specs kept for AI reasoning
// ─────────────────────────────────────────────────────────────────────────────
const DEVICES = {
  slimLabel: {
    name: "Slim Label", key: "slimLabel",
    tagline: "Battery-free ultra-slim label tracker for high-volume deployment",
    form: "148 × 97.5 × 2 mm, 20 g — flexible sticker form factor",
    power: "Battery-free. Capacitor charged by ambient light. Without light: ~59 days (1/day), 7 days (1/h).",
    positioning: ["GNSS", "WiFi", "LoRaWAN"],
    temp: "0 – 40 °C", rating: "—", rechargeable: false,
    sensors: ["Accelerometer", "Pressure", "Temp / Humidity"],
    gnssAccuracy: "~10 m",
    batteryLife: { "1/day": "59 days (no light)", "1/h": "7 days (no light)", autonomous: "Unlimited when lit" },
    bestFor: ["High-volume inventory", "Warehouse tracking", "Indoor assets", "Zero-maintenance deployment"],
    notFor: ["Harsh outdoor (40 °C max)", "Outdoor-only without ambient light"],
  },
  compactTag: {
    name: "Compact Tag", key: "compactTag",
    tagline: "Compact safety tracker for tools, workforce and mixed-use fleets",
    form: "Ø 50 × 15 mm, 24 g — disc form factor",
    power: "Rechargeable LiPo — USB-C. 9 months (1/day), 2.5 months (1/h), 7.5 days (1/5 min).",
    positioning: ["GNSS (3–5 m)", "WiFi", "BLE", "LoRaWAN"],
    temp: "0 – 60 °C", rating: "—", rechargeable: true,
    sensors: ["Accelerometer", "Buzzer", "LED", "Fall detection", "Panic button"],
    gnssAccuracy: "3–5 m",
    batteryLife: { "1/day": "9 months", "1/h": "2.5 months", "1/5 min": "7.5 days" },
    bestFor: ["Tools & portable equipment", "Workforce safety", "Multi-site fleets", "Indoor + outdoor"],
    notFor: ["Harsh outdoor without IP rating", "Very long battery without charging"],
  },
  standardTag: {
    name: "Standard Tag", key: "standardTag",
    tagline: "Ruggedised tracker for larger assets in demanding environments",
    form: "80 × 54 × 23 mm, 103 g — quick-mount clip",
    power: "Rechargeable LiPo — USB-C + wireless. 2 years (1/day), 6 months (1/h), 20 days (1/5 min).",
    positioning: ["GNSS (3–5 m)", "WiFi", "BLE", "LoRaWAN"],
    temp: "0 – 60 °C", rating: "Durable housing", rechargeable: true,
    sensors: ["Accelerometer"],
    gnssAccuracy: "3–5 m",
    batteryLife: { "1/day": "2 years", "1/h": "6 months", "1/5 min": "20 days" },
    bestFor: ["Heavy machinery & large equipment", "Outdoor & industrial", "Construction"],
    notFor: ["Extreme cold (0 °C min)", "IP67 required (use Rugged Tag)"],
  },
  ruggedTag: {
    name: "Rugged Tag", key: "ruggedTag",
    tagline: "Ultra-long life IP67 tracker for remote and harsh environments",
    form: "93 × 89 × 37 mm, 178 g — strong magnets included",
    power: "Non-rechargeable lithium cell. 7.5 years (1/day), 2 years (1/h), 7 months (1/15 min).",
    positioning: ["Passive GNSS", "WiFi", "BLE", "LoRaWAN"],
    temp: "−20 – 60 °C", rating: "IP67", rechargeable: false,
    sensors: ["Accelerometer (3-axis)", "Gyroscope (6-axis)", "Optional: Temp / Pressure / Humidity"],
    gnssAccuracy: "5–50 m (passive GNSS)",
    batteryLife: { "1/day": "7.5 years", "1/h": "2 years", "1/15 min": "7 months" },
    bestFor: ["Remote / hard-to-reach assets", "Extreme environments (IP67, −20 °C)", "Minimal maintenance"],
    notFor: ["High GNSS precision (<5 m)", "Small / lightweight assets"],
  },
  microHub: {
    name: "Micro Hub", key: "microHub",
    tagline: "Award-winning ultra-compact solar-powered sensor hub",
    form: "21 × 27 × 6 mm, 5.8 g — PCB with solar panels",
    power: "Solar LiPo via charging pads. Without solar: 4–6 days (1/h). Continuous when lit.",
    positioning: ["GNSS (high precision)", "WiFi", "BLE", "LoRaWAN"],
    temp: "0 – 60 °C", rating: "Epoxy", rechargeable: true,
    sensors: ["Accelerometer", "Pressure", "Light sensor", "Optional: Gyroscope / Magnetometer"],
    gnssAccuracy: "High precision",
    batteryLife: { "1/h (no solar)": "4–6 days", autonomous: "Continuous when lit" },
    bestFor: ["Very small / high-value assets", "Embedded applications", "Healthcare equipment"],
    notFor: ["Fully outdoor without solar access", "Harsh industrial environments"],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PRICING — obfuscated (±70% random offset applied at generation time)
// Real prices are not disclosed here.
// ─────────────────────────────────────────────────────────────────────────────
const HW_PRICE = {
  slimLabel:   { single: 167, vol100: 40,  vol1000: 62  },
  compactTag:  { single: 86,  vol100: 160, vol1000: 112 },
  standardTag: { single: 248, vol100: 59,  vol1000: 98  },
  ruggedTag:   { single: 51,  vol100: 79,  vol1000: 101 },
  microHub:    { single: 118, vol100: 162, vol1000: 181 },
};

const PLATFORM = {
  basic:        { name: "Basic",        monthly: 37,  included: 25  },
  professional: { name: "Professional", monthly: 64,  included: 100 },
  enterprise:   { name: "Enterprise",   monthly: 585, included: 250 },
};

const LOCATION = {
  light:       { name: "Light",       interval: "every 6 h",    chf: 0.14 },
  balanced:    { name: "Balanced",    interval: "every 1 h",    chf: 0.16 },
  performance: { name: "Performance", interval: "every 15 min", chf: 2.96 },
  max:         { name: "Max",         interval: "every 5 min",  chf: 7.92 },
};

const GW = {
  indoor:  { name: "Indoor Gateway (IP20)",  chf: 505, monthly: 25 },
  outdoor: { name: "Outdoor Gateway (IP67)", chf: 440, monthly: 25 },
};

const REPLACEMENT_MARGIN = { 1: 0.05, 2: 0.10, 3: 0.15, 4: 0.20, 5: 0.25 };

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const hwUnit = (key, qty) => { const p = HW_PRICE[key]; if (!p) return 0; return qty >= 1000 ? p.vol1000 : qty >= 100 ? p.vol100 : p.single; };
const fmt    = (n, d = 2) => n == null || isNaN(n) ? "—" : `CHF ${Number(n).toLocaleString("de-CH", { minimumFractionDigits: d, maximumFractionDigits: d })}`;

function gwRecommendation(form) {
  const qty    = parseInt(form.assetCount) || 10;
  const ind    = (form.industry || "").toLowerCase();
  const env    = (form.environment || "").toLowerCase();
  const sites  = Math.max(1, parseInt(form.numSites) || 1);
  const whs    = Math.max(1, parseInt(form.numWarehouses) || 1);
  const floors = Math.max(1, parseInt(form.numFloors) || 2);
  const outdoor = env.includes("outdoor") || env.includes("harsh") || env.includes("remote");
  const gwType  = outdoor ? "outdoor" : "indoor";
  let gws = [], note = "";
  if (ind.includes("logist") || ind.includes("warehouse")) {
    const n = qty > 200 ? 2 : 1;
    gws  = [{ type: "indoor", qty: whs * n, reason: `${n} indoor gateway(s) per warehouse × ${whs}. Covers ~${n === 1 ? "10,000" : "20,000"} m² each.` }];
    note = "1 indoor gateway covers approx. 10,000 m² of open warehouse space.";
  } else if (ind.includes("construction")) {
    const extra = qty > 100 ? sites : 0;
    gws  = [{ type: "outdoor", qty: sites + extra, reason: `1 outdoor gateway per site × ${sites}${extra > 0 ? " + 1 extra per large site (>100 assets)" : ""}. LoRa range up to 15 km outdoors.` }];
    note = "Outdoor IP67 gateway — weatherproof, ideal for wide construction sites.";
  } else if (ind.includes("manufact")) {
    const q = Math.max(1, Math.ceil(floors / 2));
    gws  = [{ type: "indoor", qty: q, reason: `1 indoor gateway per 2 floors (${floors} floors). ~5,000 m² per gateway.` }];
  } else if (ind.includes("healthcare")) {
    gws  = [{ type: "indoor", qty: floors, reason: `1 indoor gateway per floor (${floors} floors) for full in-building coverage.` }];
  } else {
    gws  = [{ type: gwType, qty: sites, reason: `1 ${gwType} gateway per site (${sites} site${sites > 1 ? "s" : ""}).` }];
  }
  if (gws.reduce((s, g) => s + g.qty, 0) === 0) gws = [{ type: gwType, qty: 1, reason: "Minimum 1 gateway per deal." }];
  return { gateways: gws, note };
}

function buildRecurringModels(hwTotal, gwCapex, mTotal) {
  return [1, 2, 3, 5].map(years => {
    const margin = REPLACEMENT_MARGIN[years] || 0.25;
    const months = years * 12;
    const hwAmort = ((hwTotal + gwCapex) * (1 + margin)) / months;
    return { years, months, hwAmort, monthlyAll: hwAmort + mTotal, repMarginPct: margin * 100 };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// RULE-BASED ENGINE
// ─────────────────────────────────────────────────────────────────────────────
function ruleOffer(form) {
  const qty   = parseInt(form.assetCount) || 10;
  const env   = (form.environment || "").toLowerCase();
  const uc    = (form.useCase    || "").toLowerCase();
  const ind   = (form.industry   || "").toLowerCase();
  const locN  = (form.positioningNeeds || "").toLowerCase();

  let hwKey = "compactTag";
  let hwReason = "Compact Tag — disc form factor, full GNSS/BLE/WiFi/LoRa stack, rechargeable USB-C. Default for mixed-use fleets.";
  if (env.includes("remote") || (env.includes("outdoor") && env.includes("harsh"))) {
    hwKey = "ruggedTag"; hwReason = "Rugged Tag — IP67, −20 °C, 2-year hourly battery. Ideal for remote/harsh environments with minimal maintenance.";
  } else if (env.includes("outdoor") && !env.includes("indoor")) {
    hwKey = qty >= 100 ? "standardTag" : "ruggedTag";
    hwReason = hwKey === "standardTag" ? "Standard Tag — 2-year battery (1/day), 3–5 m GNSS, rechargeable. Best for large outdoor fleets." : "Rugged Tag — ultra-long battery, IP67 for outdoor-only deployment.";
  } else if (env.includes("harsh") || uc.includes("machinery") || uc.includes("heavy")) {
    hwKey = "standardTag"; hwReason = "Standard Tag — ruggedised housing, 2-year battery at daily fixes, 3–5 m GNSS for industrial equipment.";
  } else if (ind.includes("warehouse") || ind.includes("logist") || (locN.includes("ble") && !uc.includes("outdoor"))) {
    hwKey = "slimLabel"; hwReason = "Slim Label — battery-free (solar/ambient), 2 mm sticker. Perfect for high-volume warehouse and inventory tracking.";
  } else if (uc.includes("safety") || uc.includes("workforce") || uc.includes("worker")) {
    hwKey = "compactTag"; hwReason = "Compact Tag — only device with fall detection and panic button. Compact disc for personal carry.";
  } else if (uc.includes("small") || uc.includes("embed") || ind.includes("healthcare")) {
    hwKey = "microHub"; hwReason = "Micro Hub — ultra-compact (21 × 27 × 6 mm, 5.8 g), solar-powered. Ideal for small high-value assets.";
  }

  const platKey = qty > 250 ? "enterprise" : qty > 100 ? "professional" : "basic";
  const plat    = PLATFORM[platKey];
  let locKey    = "balanced";
  if (uc.includes("real-time") || uc.includes("security") || uc.includes("safety")) locKey = "performance";
  if (ind.includes("warehouse") || ind.includes("inventory")) locKey = "light";
  if (locN.includes("15 min")) locKey = "performance";
  const loc     = LOCATION[locKey];

  const gwRec      = gwRecommendation(form);
  const unitPrice  = hwUnit(hwKey, qty);
  const hwTotal    = unitPrice * qty;
  const platM      = plat.monthly;
  const extraDev   = Math.max(0, qty - plat.included);
  const locM       = extraDev * loc.chf;
  const totalGwQty = gwRec.gateways.reduce((s, g) => s + g.qty, 0);
  const gwCapex    = gwRec.gateways.reduce((s, g) => s + g.qty * GW[g.type].chf, 0);
  const gwMonthly  = totalGwQty * 25;
  const mTotal     = platM + locM + gwMonthly;

  return {
    executiveSummary: `For ${qty} assets in a ${form.environment || "mixed"} environment, we recommend the ${DEVICES[hwKey].name} with the ${plat.name} SaaS plan and ${loc.name} location package — ${DEVICES[hwKey].tagline.toLowerCase()}.`,
    devices: [{ key: hwKey, name: DEVICES[hwKey].name, qty, unitPrice, total: hwTotal, reasoning: hwReason, hwDiscountPct: 0 }],
    platformRec: { tier: platKey, reasoning: `${plat.name} at ${fmt(platM)}/month includes ${plat.included} devices. ${qty > plat.included ? `${extraDev} extra devices billed via location package.` : "Covers full fleet."}` },
    locationPkg: { key: locKey, locCHF: loc.chf, reasoning: `${loc.name} (${loc.interval}) at ${fmt(loc.chf)}/tracker/month.` },
    gateways: gwRec.gateways, gatewayNote: gwRec.note, gwMonthly, totalGwQty,
    upfront:   { hwTotal, gwCapex, total: hwTotal + gwCapex, breakdown: [{ name: DEVICES[hwKey].name, qty, unitPrice, total: hwTotal, hwDiscountPct: 0 }] },
    recurring: { platform: platM, location: locM, gateways: gwMonthly, monthly: mTotal, annual: mTotal * 12 },
    recurringModels: buildRecurringModels(hwTotal, gwCapex, mTotal),
    nextSteps: [
      "Schedule a technical discovery call to validate scope and requirements.",
      "Run a LoRaWAN coverage test before finalising gateway count.",
      "Start with a 5–10 device pilot across representative sites.",
      `Review IT integration requirements${form.integrations?.length ? ` (${form.integrations.join(", ")})` : ""}.`,
      "Define SLA expectations and support coverage model.",
    ],
    technicalNotes: `${DEVICES[hwKey].name}: ${DEVICES[hwKey].form}. Temp: ${DEVICES[hwKey].temp}. GNSS: ${DEVICES[hwKey].gnssAccuracy}. Connectivity: ${DEVICES[hwKey].positioning.join(" + ")}. ${DEVICES[hwKey].rechargeable ? "Rechargeable." : "Non-rechargeable."} Data hosted in CH/EU. LoRaWAN® AES-128.`,
    contractNote: form.contractDuration > 12 ? `Based on ${form.contractDuration}-month contract.` : null,
    source: "rules",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AI SYSTEM PROMPT  — uses internal device keys (anonymised names only)
// ─────────────────────────────────────────────────────────────────────────────
const CATALOG_STR = Object.values(DEVICES).map(d =>
  `${d.name} (key:"${d.key}"): ${d.tagline}. Form: ${d.form}. Power: ${d.power}. Positioning: ${d.positioning.join(", ")}. Temp: ${d.temp}. Best for: ${d.bestFor.join("; ")}.`
).join("\n");

// Pricing sent to AI uses the same obfuscated prices shown in the UI.
const SCHEMA_HINT = `Return ONLY a valid JSON object (no markdown fences) with this schema:
{
  "executiveSummary": "string",
  "devices": [{"key":"slimLabel|compactTag|standardTag|ruggedTag|microHub","name":"string","qty":number,"unitPrice":number,"total":number,"reasoning":"string","hwDiscountPct":number}],
  "platformRec": {"tier":"basic|professional|enterprise","reasoning":"string"},
  "locationPkg": {"key":"light|balanced|performance|max","locCHF":number,"reasoning":"string"},
  "gateways": [{"type":"indoor|outdoor","qty":number,"reason":"string"}],
  "gatewayNote": "string",
  "upfront": {"hwTotal":number,"gwCapex":number,"total":number,"breakdown":[{"name":"string","qty":number,"unitPrice":number,"total":number,"hwDiscountPct":number}]},
  "recurring": {"platform":number,"location":number,"gateways":number,"monthly":number,"annual":number},
  "nextSteps": ["string"],
  "technicalNotes": "string",
  "contractNote": "string|null"
}`;

const SYSTEM_PROMPT = `You are a senior Truvami IoT sales engineer. Analyse the customer requirements and produce a complete solution offer.

PRODUCT CATALOG:
${CATALOG_STR}

PRICING (CHF — indicative):
Hardware (one-time per device):
  Slim Label:   167 / 40  / 62  (1 / 100+ / 1000+ units)
  Compact Tag:  86  / 160 / 112
  Standard Tag: 248 / 59  / 98
  Rugged Tag:   51  / 79  / 101
  Micro Hub:    118 / 162 / 181

Platform/month: Basic 37 (25 dev), Professional 64 (100 dev), Enterprise 585 (250 dev).
Location/tracker/month: Light 0.14, Balanced 0.16, Performance 2.96, Max 7.92.
Gateway hardware (one-time): Indoor 505, Outdoor 440. Gateway management: 25 CHF/unit/month.
Min 1 gateway per deal.

GATEWAY RULES: Logistics: 1–2 indoor per warehouse. Construction: 1 outdoor per site. Manufacturing: 1 per 2 floors. Healthcare: 1 per floor.

${SCHEMA_HINT}`;

async function callAI(cfg, messages) {
  const { endpoint, apiKey, deployment } = cfg;
  const isAz = endpoint.includes("azure.com") || endpoint.includes("openai.azure");
  const url   = isAz
    ? `${endpoint.replace(/\/$/, "")}/openai/deployments/${deployment || "gpt-4o"}/chat/completions?api-version=2024-02-15-preview`
    : `${endpoint.replace(/\/$/, "")}/chat/completions`;
  const headers = { "Content-Type": "application/json", ...(isAz ? { "api-key": apiKey } : { Authorization: `Bearer ${apiKey}` }) };
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify({ ...(isAz ? {} : { model: deployment || "gpt-4o" }), messages, max_tokens: 3000, temperature: 0.2 }) });
  if (!res.ok) throw new Error(`AI API ${res.status}: ${res.statusText}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function aiInitialOffer(form, cfg) {
  const user = [
    `Customer: ${form.customerName} at ${form.companyName}`,
    `Industry: ${form.industry} | Use case: ${form.useCase}`,
    `Assets: ${form.assetTypes} × ${form.assetCount}`,
    `Environment: ${form.environment} | Positioning: ${form.positioningNeeds}`,
    `Sites: ${form.numSites || 1} | Warehouses: ${form.numWarehouses || 0} | Floors: ${form.numFloors || 0}`,
    `LoRaWAN: ${form.hasLoraWAN} | Platform: ${form.platformPreference}`,
    `Integrations: ${form.integrations?.join(", ")} | Contract: ${form.contractDuration} months`,
    `Context: ${form.additionalContext}`,
  ].join("\n");
  const text   = await callAI(cfg, [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: user }]);
  const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
  const totalGwQty = (parsed.gateways || []).reduce((s, g) => s + g.qty, 0);
  parsed.totalGwQty = totalGwQty;
  parsed.gwMonthly  = totalGwQty * 25;
  parsed.recurring  = parsed.recurring || {};
  parsed.recurring.gateways = parsed.gwMonthly;
  parsed.recurring.monthly  = (parsed.recurring.platform || 0) + (parsed.recurring.location || 0) + parsed.gwMonthly;
  parsed.recurring.annual   = parsed.recurring.monthly * 12;
  parsed.recurringModels    = buildRecurringModels(parsed.upfront?.hwTotal || 0, parsed.upfront?.gwCapex || 0, parsed.recurring.monthly);
  parsed.source = "ai";
  return parsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI QUOTE MODIFIER
// ─────────────────────────────────────────────────────────────────────────────
const MODIFIER_SYSTEM = `You are a senior Truvami IoT sales engineer. Apply the MODIFICATION REQUEST to the CURRENT QUOTE and return the full updated quote as valid JSON (no markdown, same schema).

PRICING REFERENCE (CHF):
Hardware: Slim Label 167/40/62, Compact Tag 86/160/112, Standard Tag 248/59/98, Rugged Tag 51/79/101, Micro Hub 118/162/181 (1/100+/1000+).
Platform/month: Basic 37 (25 dev), Professional 64 (100 dev), Enterprise 585 (250 dev).
Location/tracker/month: Light 0.14, Balanced 0.16, Performance 2.96, Max 7.92.
Gateway hardware: Indoor 505, Outdoor 440. Gateway monthly: 25 CHF/unit.

RULES:
- Replacing a device: update key, name, unitPrice (volume tiers), total, reasoning. Apply hwDiscountPct if set.
- Adding a discount: set hwDiscountPct, reduce unitPrice × (1 - pct/100) and recompute total.
- Changing quantities: recompute volume pricing and all totals.
- Always recompute: upfront.total, recurring.monthly, recurring.annual, recurring.gateways.
- Minimum 1 gateway always.
- Return the FULL updated quote JSON (same schema).

${SCHEMA_HINT}`;

async function aiModifyOffer(currentResult, userRequest, cfg) {
  const quoteSnapshot = {
    executiveSummary: currentResult.executiveSummary,
    devices:          currentResult.devices,
    platformRec:      currentResult.platformRec,
    locationPkg:      currentResult.locationPkg,
    gateways:         currentResult.gateways,
    gatewayNote:      currentResult.gatewayNote,
    upfront:          currentResult.upfront,
    recurring:        currentResult.recurring,
    nextSteps:        currentResult.nextSteps,
    technicalNotes:   currentResult.technicalNotes,
    contractNote:     currentResult.contractNote,
  };
  const text   = await callAI(cfg, [
    { role: "system", content: MODIFIER_SYSTEM },
    { role: "user",   content: `CURRENT QUOTE:\n${JSON.stringify(quoteSnapshot, null, 2)}\n\nMODIFICATION REQUEST:\n${userRequest}` },
  ]);
  const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
  const totalGwQty = (parsed.gateways || []).reduce((s, g) => s + g.qty, 0);
  parsed.totalGwQty = totalGwQty;
  parsed.gwMonthly  = totalGwQty * 25;
  parsed.recurring  = parsed.recurring || {};
  parsed.recurring.gateways = parsed.gwMonthly;
  parsed.recurring.monthly  = (parsed.recurring.platform || 0) + (parsed.recurring.location || 0) + parsed.gwMonthly;
  parsed.recurring.annual   = parsed.recurring.monthly * 12;
  parsed.recurringModels    = buildRecurringModels(parsed.upfront?.hwTotal || 0, parsed.upfront?.gwCapex || 0, parsed.recurring.monthly);
  parsed.source = "ai";
  return parsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI ATOMS
// ─────────────────────────────────────────────────────────────────────────────
const IS = { width: "100%", background: T.white, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", color: T.text, fontFamily: T.sans, fontSize: 14, outline: "none", transition: "border-color 0.15s" };
const SS = { ...IS, cursor: "pointer", appearance: "none" };

const FL  = ({ c, children }) => <div style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 11, color: c || T.teal, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>{children}</div>;
const FldL = ({ children }) => <div style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 12, color: T.textMid, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{children}</div>;
const FldH = ({ children }) => <div style={{ fontSize: 12, color: T.textLight, marginBottom: 6 }}>{children}</div>;
const Field = ({ label, hint, children }) => <div style={{ marginBottom: 20 }}><FldL>{label}</FldL>{hint && <FldH>{hint}</FldH>}{children}</div>;
const Sec  = ({ children }) => <div style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 13, color: T.teal, letterSpacing: 1, textTransform: "uppercase", marginTop: 32, marginBottom: 16, paddingBottom: 10, borderBottom: `2px solid ${T.tealLight}` }}>{children}</div>;
const Card = ({ children, style, hi }) => <div style={{ background: T.white, borderRadius: 14, padding: 24, border: hi ? `2px solid ${T.teal}` : `1px solid ${T.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", ...style }}>{children}</div>;
const Pill = ({ label, active, onClick }) => <button onClick={onClick} style={{ padding: "6px 14px", borderRadius: 20, fontFamily: T.sans, fontSize: 13, cursor: "pointer", border: `1.5px solid ${active ? T.teal : T.border}`, background: active ? T.tealLight : T.white, color: active ? T.teal : T.textMid, fontWeight: active ? 600 : 400 }}>{label}</button>;
const TBtn = ({ onClick, children, small, disabled }) => <button onClick={onClick} disabled={disabled} style={{ background: disabled ? T.border : T.teal, border: "none", borderRadius: 25, padding: small ? "8px 20px" : "13px 32px", color: disabled ? T.textLight : T.dark, fontFamily: T.sans, fontWeight: 700, fontSize: small ? 13 : 15, cursor: disabled ? "not-allowed" : "pointer" }}>{children}</button>;
const GBtn = ({ onClick, children }) => <button onClick={onClick} style={{ background: "transparent", border: `1.5px solid ${T.border}`, borderRadius: 25, padding: "10px 24px", color: T.textMid, fontFamily: T.sans, fontSize: 14, cursor: "pointer" }}>{children}</button>;

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER FORM
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_FORM = { customerName: "", companyName: "", industry: "", useCase: "", assetTypes: "", assetCount: "", environment: "", positioningNeeds: "", hasLoraWAN: "", platformPreference: "", integrations: [], contractDuration: "36", additionalContext: "", numSites: "1", numWarehouses: "1", numFloors: "2" };

function CustomerForm({ form, setForm, onSubmit, hasAI }) {
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const tog = v => setForm(f => ({ ...f, integrations: f.integrations.includes(v) ? f.integrations.filter(x => x !== v) : [...f.integrations, v] }));
  const ind = (form.industry || "").toLowerCase();
  return (
    <div>
      <Sec>Customer</Sec>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
        <Field label="Contact Name"><input style={IS} value={form.customerName} onChange={set("customerName")} placeholder="e.g. Anna Müller" /></Field>
        <Field label="Company"><input style={IS} value={form.companyName} onChange={set("companyName")} placeholder="e.g. Bau AG" /></Field>
      </div>
      <Field label="Industry">
        <select style={SS} value={form.industry} onChange={set("industry")}>
          <option value="">Select…</option>
          {["Construction","Intralogistics / Warehousing","Manufacturing","Healthcare","Security / Asset Protection","Transportation & Fleet","Oil & Gas / Mining","Other"].map(o => <option key={o}>{o}</option>)}
        </select>
      </Field>
      <Sec>Assets & Use Case</Sec>
      <Field label="Use Case / Problem Statement" hint="What problem are they solving?">
        <textarea style={{ ...IS, minHeight: 90, resize: "vertical" }} value={form.useCase} onChange={set("useCase")} placeholder="e.g. Track construction tools and heavy equipment across job sites, prevent theft and loss." />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
        <Field label="Asset Types"><input style={IS} value={form.assetTypes} onChange={set("assetTypes")} placeholder="e.g. Power tools, scaffolding, forklifts" /></Field>
        <Field label="Number of Assets"><input style={IS} type="number" min="1" value={form.assetCount} onChange={set("assetCount")} placeholder="e.g. 250" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
        <Field label="Environment">
          <select style={SS} value={form.environment} onChange={set("environment")}>
            <option value="">Select…</option>
            {["Indoor only","Outdoor only","Mixed indoor & outdoor","Harsh / Industrial outdoor","Remote / Low connectivity"].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Positioning Needs">
          <select style={SS} value={form.positioningNeeds} onChange={set("positioningNeeds")}>
            <option value="">Select…</option>
            {["Room-level BLE (indoor)","Building-level WiFi","Outdoor GPS (3–5 m)","Wide-area LoRa (coarse)","Mixed — all technologies"].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
      </div>
      <Sec>Sites & Infrastructure</Sec>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 24px" }}>
        <Field label="Number of Sites"><input style={IS} type="number" min="1" value={form.numSites} onChange={set("numSites")} /></Field>
        {(ind.includes("logist") || ind.includes("warehouse")) && <Field label="Warehouses"><input style={IS} type="number" min="0" value={form.numWarehouses} onChange={set("numWarehouses")} /></Field>}
        {(ind.includes("manufact") || ind.includes("healthcare")) && <Field label="Floors per Building"><input style={IS} type="number" min="1" value={form.numFloors} onChange={set("numFloors")} /></Field>}
        <Field label="LoRaWAN Coverage?">
          <select style={SS} value={form.hasLoraWAN} onChange={set("hasLoraWAN")}>
            <option value="">Unknown / TBD</option>
            <option value="yes">Yes — already covered</option>
            <option value="partial">Partial — some sites</option>
            <option value="no">No — needs gateways</option>
          </select>
        </Field>
      </div>
      <Field label="Platform Preference">
        <select style={SS} value={form.platformPreference} onChange={set("platformPreference")}>
          <option value="">No preference</option>
          <option value="dashboard">Truvami Dashboard (SaaS)</option>
          <option value="integration">Integrate into existing systems</option>
          <option value="onpremise">On-Premise deployment</option>
        </select>
      </Field>
      <Field label="Integrations Needed" hint="Select all that apply">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {["ERP","WMS","CMMS/EAM","BI / Data Lake","Kafka","REST API / Webhooks","Microsoft Teams","None needed"].map(opt => (
            <Pill key={opt} label={opt} active={form.integrations.includes(opt)} onClick={() => tog(opt)} />
          ))}
        </div>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
        <Field label="Contract Duration" hint="Longer terms enable better recurring pricing">
          <select style={SS} value={form.contractDuration} onChange={set("contractDuration")}>
            {["12","24","36","48","60"].map(d => <option key={d} value={d}>{d} months ({d / 12} year{d > 12 ? "s" : ""})</option>)}
          </select>
        </Field>
      </div>
      <Field label="Additional Context" hint="Budget, timeline, special requirements">
        <textarea style={{ ...IS, minHeight: 80, resize: "vertical" }} value={form.additionalContext} onChange={set("additionalContext")} placeholder="e.g. Tight budget, prefer low upfront. Already using SAP ERP." />
      </Field>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
        <TBtn onClick={onSubmit}>Generate Offer →</TBtn>
        <span style={{ fontFamily: T.sans, fontSize: 13, color: T.textLight }}>{hasAI ? "✓ AI-powered" : "⚙ Rule engine active"}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULT COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function DeviceCard({ dev }) {
  const d = DEVICES[dev.key];
  return (
    <div style={{ padding: 20, background: T.bg, borderRadius: 12, border: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 18, color: T.text }}>{dev.name}</span>
          <span style={{ fontFamily: T.sans, fontSize: 13, color: T.textLight }}>× {dev.qty} units</span>
          {d?.rating && d.rating !== "—" && <span style={{ padding: "2px 8px", background: T.tealLight, color: T.teal, borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{d.rating}</span>}
          {dev.hwDiscountPct > 0 && <span style={{ padding: "2px 8px", background: "#FFF3E0", color: T.warn, borderRadius: 10, fontSize: 11, fontWeight: 600 }}>−{dev.hwDiscountPct}% discount</span>}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontFamily: T.mono, fontSize: 14, color: T.teal, fontWeight: 600 }}>{fmt(dev.unitPrice)}/unit</div>
          <div style={{ fontFamily: T.mono, fontSize: 12, color: T.textLight }}>{fmt(dev.total)} total</div>
        </div>
      </div>
      {d && <div style={{ fontSize: 12, color: T.textMid, marginBottom: 8, fontStyle: "italic" }}>{d.form} · Temp: {d.temp}</div>}
      <p style={{ fontFamily: T.sans, fontSize: 13, color: T.textMid, margin: "0 0 12px", lineHeight: 1.65 }}>{dev.reasoning}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {d?.positioning.map(p => <span key={p} style={{ padding: "3px 10px", background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 11, color: T.textMid }}>{p}</span>)}
        {d?.sensors.map(s => <span key={s} style={{ padding: "3px 10px", background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 11, color: T.textMid }}>{s}</span>)}
      </div>
      {d && (
        <div style={{ marginTop: 12, padding: "10px 14px", background: T.white, borderRadius: 8, border: `1px solid ${T.border}` }}>
          <div style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 11, color: T.textLight, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>Battery Life</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {Object.entries(d.batteryLife).map(([k, v]) => <div key={k}><span style={{ fontFamily: T.mono, fontSize: 12, color: T.teal }}>{k}:</span> <span style={{ fontFamily: T.sans, fontSize: 12, color: T.textMid }}>{v}</span></div>)}
          </div>
        </div>
      )}
    </div>
  );
}

function GatewaySection({ gateways, note, gwMonthly, totalGwQty }) {
  const gwCapex = gateways.reduce((s, g) => s + g.qty * GW[g.type].chf, 0);
  return (
    <Card>
      <FL>LoRaWAN Coverage — Gateway Deployment</FL>
      {gateways.map((g, i) => {
        const info = GW[g.type];
        return (
          <div key={i} style={{ padding: 14, background: T.bg, borderRadius: 10, border: `1px solid ${T.border}`, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div><span style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 14, color: T.text }}>{info.name}</span><span style={{ marginLeft: 12, fontFamily: T.sans, fontSize: 13, color: T.textLight }}>× {g.qty}</span></div>
              <div style={{ textAlign: "right" }}><div style={{ fontFamily: T.mono, fontSize: 13, color: T.teal, fontWeight: 600 }}>{fmt(info.chf)}/unit</div><div style={{ fontFamily: T.mono, fontSize: 11, color: T.textLight }}>{fmt(info.chf * g.qty)} total</div></div>
            </div>
            <p style={{ fontFamily: T.sans, fontSize: 13, color: T.textMid, margin: 0 }}>{g.reason}</p>
          </div>
        );
      })}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, padding: "10px 14px", background: "#FFF9F0", borderRadius: 8, border: `1px solid ${T.warn}30` }}>
        <div><span style={{ fontFamily: T.sans, fontSize: 13, color: T.text, fontWeight: 600 }}>Gateway management fee</span><span style={{ fontFamily: T.sans, fontSize: 12, color: T.textLight, marginLeft: 10 }}>{totalGwQty} × CHF 25/month</span></div>
        <span style={{ fontFamily: T.mono, fontSize: 13, color: T.warn, fontWeight: 600 }}>{fmt(gwMonthly)}/month</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${T.border}`, paddingTop: 14, marginTop: 12 }}>
        <span style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 14, color: T.text }}>Gateway Capex</span>
        <span style={{ fontFamily: T.mono, fontSize: 16, color: T.teal, fontWeight: 700 }}>{fmt(gwCapex)}</span>
      </div>
      {note && <div style={{ marginTop: 12, padding: "10px 14px", background: T.tealLight, borderRadius: 8, fontFamily: T.sans, fontSize: 12, color: T.teal }}>ℹ {note}</div>}
      <div style={{ marginTop: 10, padding: "10px 14px", background: "#FFF8EC", borderRadius: 8, fontFamily: T.sans, fontSize: 12, color: T.warn }}>⚠ Minimum 1 gateway per deal. Quantities are indicative — confirm with an on-site coverage test.</div>
    </Card>
  );
}

function PricingTable({ result }) {
  const [mode, setMode] = useState("capex");
  const [yrs,  setYrs]  = useState(3);
  const plat = PLATFORM[result.platformRec?.tier];
  const rm   = result.recurringModels?.find(r => r.years === yrs);

  return (
    <Card hi>
      <FL>Pricing Summary</FL>
      <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
        <Pill label="CAPEX + Recurring" active={mode === "capex"} onClick={() => setMode("capex")} />
        <Pill label="Recurring-Only (All-in)" active={mode === "recurring"} onClick={() => setMode("recurring")} />
      </div>
      {mode === "capex" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: T.bg, borderRadius: 10, padding: 18 }}>
            <div style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 11, color: T.textLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>One-Time (CAPEX)</div>
            {result.upfront?.breakdown?.map((b, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontFamily: T.sans, fontSize: 13, color: T.textMid, marginBottom: 8 }}>
                <span>{b.name} × {b.qty}{b.hwDiscountPct > 0 ? ` (−${b.hwDiscountPct}%)` : ""}</span>
                <span style={{ fontFamily: T.mono }}>{fmt(b.total)}</span>
              </div>
            ))}
            {result.upfront?.gwCapex > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: T.sans, fontSize: 13, color: T.textMid, marginBottom: 8 }}>
                <span>Gateways (hardware)</span><span style={{ fontFamily: T.mono }}>{fmt(result.upfront.gwCapex)}</span>
              </div>
            )}
            <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 10, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 14, color: T.text }}>Total Upfront</span>
              <span style={{ fontFamily: T.mono, fontSize: 18, color: T.teal, fontWeight: 700 }}>{fmt(result.upfront?.total)}</span>
            </div>
          </div>
          <div style={{ background: T.bg, borderRadius: 10, padding: 18 }}>
            <div style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 11, color: T.textLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Monthly Recurring (OpEx)</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: T.sans, fontSize: 13, color: T.textMid, marginBottom: 8 }}>
              <span>{plat?.name} Platform</span><span style={{ fontFamily: T.mono }}>{fmt(result.recurring?.platform)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: T.sans, fontSize: 13, color: T.textMid, marginBottom: 8 }}>
              <span>Location packages</span><span style={{ fontFamily: T.mono }}>{fmt(result.recurring?.location)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: T.sans, fontSize: 13, color: T.textMid, marginBottom: 8 }}>
              <span>Gateway management ({result.totalGwQty} × CHF 25)</span>
              <span style={{ fontFamily: T.mono }}>{fmt(result.recurring?.gateways)}</span>
            </div>
            <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 10, paddingTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 14, color: T.text }}>Monthly Total</span>
                <span style={{ fontFamily: T.mono, fontSize: 18, color: T.teal, fontWeight: 700 }}>{fmt(result.recurring?.monthly)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: T.sans, fontSize: 12, color: T.textLight }}>Annual</span>
                <span style={{ fontFamily: T.mono, fontSize: 12, color: T.textLight }}>{fmt(result.recurring?.annual)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            {result.recurringModels?.map(r => <Pill key={r.years} label={`${r.years}Y`} active={yrs === r.years} onClick={() => setYrs(r.years)} />)}
          </div>
          {rm && (
            <div style={{ background: T.bg, borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: T.sans, fontSize: 12, color: T.textLight, marginBottom: 4 }}>Hardware amortisation (incl. {rm.repMarginPct}% replacement reserve)</div>
                  <div style={{ fontFamily: T.mono, fontSize: 15, color: T.text }}>{fmt(rm.hwAmort)}/month</div>
                </div>
                <div>
                  <div style={{ fontFamily: T.sans, fontSize: 12, color: T.textLight, marginBottom: 4 }}>Platform + Location + Gateways</div>
                  <div style={{ fontFamily: T.mono, fontSize: 15, color: T.text }}>{fmt(result.recurring?.monthly)}/month</div>
                </div>
              </div>
              <div style={{ borderTop: `2px solid ${T.teal}`, paddingTop: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: T.sans, fontWeight: 800, fontSize: 18, color: T.text }}>All-inclusive monthly fee</div>
                  <div style={{ fontFamily: T.sans, fontSize: 13, color: T.textLight, marginTop: 4 }}>{yrs}-year commitment · No upfront CAPEX</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: T.mono, fontSize: 30, color: T.teal, fontWeight: 800 }}>{fmt(rm.monthlyAll)}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 13, color: T.textLight }}>{fmt(rm.monthlyAll * 12)}/year</div>
                </div>
              </div>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
            {result.recurringModels?.map(r => (
              <div key={r.years} onClick={() => setYrs(r.years)} style={{ textAlign: "center", padding: 16, borderRadius: 12, border: `1.5px solid ${yrs === r.years ? T.teal : T.border}`, background: yrs === r.years ? T.tealLight : T.white, cursor: "pointer" }}>
                <div style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 8 }}>{r.years} Year{r.years > 1 ? "s" : ""}</div>
                <div style={{ fontFamily: T.mono, fontSize: 16, color: T.teal, fontWeight: 700 }}>{fmt(r.monthlyAll)}</div>
                <div style={{ fontFamily: T.sans, fontSize: 11, color: T.textLight, marginTop: 6 }}>+{r.repMarginPct}% reserve</div>
              </div>
            ))}
          </div>
          <div style={{ padding: "12px 16px", background: T.tealLight, borderRadius: 10, fontFamily: T.sans, fontSize: 12, color: T.teal, lineHeight: 1.6 }}>
            ℹ Includes: hardware amortisation + replacement reserve (5–25% by term) + gateway capex + platform + location packages + gateway management. Zero upfront CAPEX.
          </div>
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI PROMPT EDITOR
// ─────────────────────────────────────────────────────────────────────────────
function AIPromptEditor({ result, onUpdate, aiCfg }) {
  const [prompt,  setPrompt]  = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);
  const hasAI    = !!(aiCfg.endpoint && aiCfg.apiKey);

  const examples = [
    "Add 10% discount on hardware",
    "Replace Standard Tag with Rugged Tag",
    "Change platform to Professional",
    "Add 2 more outdoor gateways",
    "Switch location package to Performance",
    "Remove the hardware discount",
  ];

  const handleSend = async () => {
    if (!prompt.trim() || !hasAI) return;
    setLoading(true); setError(null);
    try {
      const updated = await aiModifyOffer(result, prompt.trim(), aiCfg);
      setHistory(h => [...h, { role: "user", text: prompt.trim() }, { role: "ai", text: "Quote updated successfully." }]);
      setPrompt(""); onUpdate(updated);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleKey = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  return (
    <Card style={{ border: `2px dashed ${hasAI ? T.teal : T.border}` }}>
      <FL c={hasAI ? T.teal : T.textLight}>{hasAI ? "✦ AI Quote Editor" : "✦ AI Quote Editor — Connect AI to enable"}</FL>
      {!hasAI ? (
        <div style={{ fontFamily: T.sans, fontSize: 14, color: T.textMid, padding: "12px 0" }}>
          Click <strong>⚙ Connect AI</strong> in the navigation bar to configure your OpenAI or Azure OpenAI endpoint. Once connected, you can modify this quote using plain language.
        </div>
      ) : (
        <>
          {history.length > 0 && (
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {history.map((h, i) => (
                <div key={i} style={{ display: "flex", justifyContent: h.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "70%", padding: "8px 14px", borderRadius: h.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: h.role === "user" ? T.teal : T.bg, color: h.role === "user" ? T.dark : T.textMid, fontFamily: T.sans, fontSize: 13 }}>{h.text}</div>
                </div>
              ))}
            </div>
          )}
          {history.length === 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: T.sans, fontSize: 12, color: T.textLight, marginBottom: 8 }}>Try an example:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {examples.map(ex => (
                  <button key={ex} onClick={() => { setPrompt(ex); inputRef.current?.focus(); }} style={{ padding: "5px 12px", borderRadius: 20, fontFamily: T.sans, fontSize: 12, cursor: "pointer", border: `1px solid ${T.border}`, background: T.white, color: T.textMid }}>{ex}</button>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <textarea ref={inputRef} style={{ ...IS, flex: 1, minHeight: 60, resize: "vertical", fontFamily: T.sans }} value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={handleKey} placeholder='e.g. "Add 15% hardware discount and replace Standard Tag with Rugged Tag"' disabled={loading} />
            <TBtn onClick={handleSend} disabled={!prompt.trim() || loading} small>{loading ? "Updating…" : "Apply →"}</TBtn>
          </div>
          {error && <div style={{ marginTop: 10, padding: "8px 12px", background: "#FFF0F0", borderRadius: 8, fontFamily: T.sans, fontSize: 12, color: T.danger }}>✕ {error}</div>}
          <div style={{ marginTop: 8, fontFamily: T.sans, fontSize: 11, color: T.textLight }}>Press Enter to send · Shift+Enter for new line</div>
        </>
      )}
    </Card>
  );
}

function OfferResult({ result, onReset, aiCfg, onUpdate }) {
  if (!result) return null;
  const plat = PLATFORM[result.platformRec?.tier];
  const loc  = LOCATION[result.locationPkg?.key];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {result.source === "rules" && (
        <div style={{ padding: "10px 18px", background: "#FFF8EC", border: `1px solid ${T.warn}40`, borderRadius: 10, fontFamily: T.sans, fontSize: 13, color: T.warn }}>
          ⚙ Generated by rule engine — connect an AI endpoint for deeper analysis and to use the prompt editor below
        </div>
      )}
      <Card><FL>Executive Summary</FL><p style={{ fontFamily: T.sans, fontSize: 15, color: T.textMid, lineHeight: 1.75, margin: 0 }}>{result.executiveSummary}</p></Card>
      <Card>
        <FL>Recommended Hardware</FL>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{result.devices?.map((d, i) => <DeviceCard key={i} dev={d} />)}</div>
      </Card>
      {result.gateways?.length > 0 && <GatewaySection gateways={result.gateways} note={result.gatewayNote} gwMonthly={result.gwMonthly || 0} totalGwQty={result.totalGwQty || 0} />}
      {result.platformRec && plat && (
        <Card>
          <FL>SaaS Platform</FL>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div><span style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 17, color: T.text }}>{plat.name} Plan</span><span style={{ fontFamily: T.sans, fontSize: 13, color: T.textLight, marginLeft: 12 }}>incl. {plat.included} devices</span></div>
            <span style={{ fontFamily: T.mono, fontSize: 15, color: T.teal, fontWeight: 700 }}>{fmt(result.recurring?.platform)}/month</span>
          </div>
          <p style={{ fontFamily: T.sans, fontSize: 13, color: T.textMid, margin: 0, lineHeight: 1.65 }}>{result.platformRec.reasoning}</p>
        </Card>
      )}
      {result.locationPkg && loc && (
        <Card>
          <FL>Location Package (per tracker)</FL>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div><span style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 17, color: T.text }}>{loc.name}</span><span style={{ fontFamily: T.sans, fontSize: 13, color: T.textLight, marginLeft: 12 }}>{loc.interval}</span></div>
            <span style={{ fontFamily: T.mono, fontSize: 15, color: T.teal, fontWeight: 700 }}>{fmt(result.locationPkg.locCHF || loc.chf)}/tracker/month</span>
          </div>
          <p style={{ fontFamily: T.sans, fontSize: 13, color: T.textMid, margin: 0, lineHeight: 1.65 }}>{result.locationPkg.reasoning}</p>
        </Card>
      )}
      <PricingTable result={result} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {result.nextSteps?.length > 0 && (
          <Card>
            <FL>Next Steps</FL>
            <ol style={{ paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              {result.nextSteps.map((s, i) => (
                <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: T.teal, minWidth: 22, marginTop: 2, fontWeight: 700 }}>{String(i + 1).padStart(2, "0")}</span>
                  <span style={{ fontFamily: T.sans, fontSize: 13, color: T.textMid, lineHeight: 1.55 }}>{s}</span>
                </li>
              ))}
            </ol>
          </Card>
        )}
        {result.technicalNotes && (
          <Card>
            <FL>Technical Notes</FL>
            <div style={{ fontFamily: T.sans, fontSize: 13, color: T.textMid, lineHeight: 1.7 }}>{result.technicalNotes}</div>
          </Card>
        )}
      </div>
      <AIPromptEditor result={result} onUpdate={onUpdate} aiCfg={aiCfg} />
      <div style={{ display: "flex", gap: 12 }}>
        <TBtn onClick={() => window.print()}>Export PDF</TBtn>
        <GBtn onClick={onReset}>← New Offer</GBtn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI CONFIG MODAL  (persistent localStorage, 30-day TTL, test connection)
// ─────────────────────────────────────────────────────────────────────────────
function AIConfigModal({ cfg, setCfg, onClose }) {
  const [local,   setLocal]   = useState(cfg);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState(null);
  const set = k => e => setLocal(c => ({ ...c, [k]: e.target.value }));

  const handleSave = () => { saveAiConfig(local); setCfg(local); onClose(); };
  const handleClear = () => { const e = { endpoint: "", apiKey: "", deployment: "gpt-4o" }; saveAiConfig(e); setCfg(e); onClose(); };
  const handleTest  = async () => {
    if (!local.endpoint || !local.apiKey) { setTestMsg({ ok: false, msg: "Fill in endpoint and API key first." }); return; }
    setTesting(true); setTestMsg(null);
    try { await callAI(local, [{ role: "user", content: "Reply with exactly: OK" }]); setTestMsg({ ok: true, msg: "Connection successful! AI endpoint is working." }); }
    catch (e) { setTestMsg({ ok: false, msg: e.message }); }
    finally { setTesting(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: T.white, borderRadius: 20, padding: 36, width: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontFamily: T.sans, fontWeight: 800, fontSize: 22, color: T.text }}>Connect AI</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: T.textLight }}>✕</button>
        </div>
        <div style={{ fontFamily: T.sans, fontSize: 13, color: T.textLight, marginBottom: 22 }}>Settings are saved in your browser for 30 days.</div>
        <div style={{ padding: "12px 16px", background: T.bg, borderRadius: 10, fontFamily: T.sans, fontSize: 13, color: T.textMid, marginBottom: 22, lineHeight: 1.6 }}>
          Connect a <strong>Teams Copilot (Azure OpenAI)</strong> or any <strong>OpenAI-compatible</strong> endpoint. Credentials are stored locally and never sent to Truvami servers.
        </div>
        <Field label="Endpoint URL" hint="Azure: https://YOUR-RESOURCE.openai.azure.com  |  OpenAI: https://api.openai.com/v1">
          <input style={IS} value={local.endpoint} onChange={set("endpoint")} placeholder="https://your-resource.openai.azure.com" />
        </Field>
        <Field label="API Key" hint="Stored in browser localStorage for 30 days">
          <input style={{ ...IS, fontFamily: T.mono, letterSpacing: 1 }} type="password" value={local.apiKey} onChange={set("apiKey")} placeholder="sk-… or Azure API key" />
        </Field>
        <Field label="Deployment / Model" hint="Azure deployment name or OpenAI model (e.g. gpt-4o)">
          <input style={IS} value={local.deployment} onChange={set("deployment")} placeholder="gpt-4o" />
        </Field>
        {testMsg && (
          <div style={{ marginBottom: 16, padding: "10px 14px", background: testMsg.ok ? T.tealLight : "#FFF0F0", borderRadius: 8, fontFamily: T.sans, fontSize: 13, color: testMsg.ok ? T.teal : T.danger }}>
            {testMsg.ok ? "✓ " : "✕ "}{testMsg.msg}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <TBtn onClick={handleSave}>Save & Connect</TBtn>
          <button onClick={handleTest} disabled={testing} style={{ background: T.bg, border: `1.5px solid ${T.teal}`, borderRadius: 25, padding: "10px 20px", color: T.teal, fontFamily: T.sans, fontSize: 13, fontWeight: 600, cursor: testing ? "not-allowed" : "pointer" }}>{testing ? "Testing…" : "Test Connection"}</button>
          <GBtn onClick={handleClear}>Disconnect</GBtn>
        </div>
        <div style={{ marginTop: 20, padding: "12px 16px", background: T.bg, borderRadius: 10, fontFamily: T.sans, fontSize: 12, color: T.textLight, lineHeight: 1.6 }}>
          <strong style={{ color: T.textMid }}>Privacy:</strong> Your API key is stored only in this browser's localStorage and expires after 30 days. It is sent directly to your configured AI endpoint — never to Truvami servers.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICING REFERENCE MODAL  (uses obfuscated prices)
// ─────────────────────────────────────────────────────────────────────────────
function PricingModal({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: T.white, borderRadius: 20, padding: 36, width: 780, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div style={{ fontFamily: T.sans, fontWeight: 800, fontSize: 22, color: T.text }}>Pricing Reference</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: T.textLight }}>✕</button>
        </div>
        <div style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 11, color: T.teal, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>Hardware (CHF, one-time)</div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 28, fontFamily: T.sans, fontSize: 13 }}>
          <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>{["Product","Form","Temp","1 device","100+","1'000+"].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: ["1 device","100+","1'000+"].includes(h) ? "right" : "left", color: T.textMid, fontWeight: 600 }}>{h}</th>)}</tr></thead>
          <tbody>
            {Object.entries(HW_PRICE).map(([k, p]) => { const d = DEVICES[k]; return (
              <tr key={k} style={{ borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: "10px 10px", color: T.text, fontWeight: 600 }}>{d?.name}</td>
                <td style={{ padding: "10px 10px", color: T.textMid, fontSize: 12 }}>{d?.form?.split(",")[0]}</td>
                <td style={{ padding: "10px 10px", color: T.textMid, fontSize: 12 }}>{d?.temp}</td>
                <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: T.mono, color: T.text }}>{p.single}</td>
                <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: T.mono, color: T.text }}>{p.vol100}</td>
                <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: T.mono, color: T.text }}>{p.vol1000}</td>
              </tr>
            );})}
          </tbody>
        </table>
        <div style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 11, color: T.teal, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>SaaS Platform (CHF/month)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 28 }}>
          {Object.values(PLATFORM).map(t => (
            <div key={t.name} style={{ background: T.bg, borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
              <div style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 6 }}>{t.name}</div>
              <div style={{ fontFamily: T.mono, fontSize: 24, color: T.teal, fontWeight: 700, marginBottom: 4 }}>CHF {t.monthly}</div>
              <div style={{ fontFamily: T.sans, fontSize: 12, color: T.textLight }}>{t.included} devices included</div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 11, color: T.teal, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>Location Packages (CHF/tracker/month)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
          {Object.values(LOCATION).map(p => (
            <div key={p.name} style={{ background: T.bg, borderRadius: 10, padding: 16, border: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 14, color: T.text }}>{p.name}</div><div style={{ fontFamily: T.sans, fontSize: 12, color: T.textLight }}>{p.interval}</div></div>
              <div style={{ fontFamily: T.mono, fontSize: 20, color: T.teal, fontWeight: 700 }}>CHF {p.chf}</div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 11, color: T.teal, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>LoRaWAN Gateways</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {Object.values(GW).map(g => (
            <div key={g.name} style={{ background: T.bg, borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
              <div style={{ fontFamily: T.sans, fontSize: 13, color: T.text, fontWeight: 600, marginBottom: 8 }}>{g.name}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontFamily: T.sans, fontSize: 12, color: T.textLight }}>One-time hardware</span>
                <span style={{ fontFamily: T.mono, fontSize: 16, color: T.teal, fontWeight: 700 }}>CHF {g.chf}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: T.sans, fontSize: 12, color: T.textLight }}>Monthly management</span>
                <span style={{ fontFamily: T.mono, fontSize: 14, color: T.warn, fontWeight: 600 }}>CHF {g.monthly}/mo</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function TruvamiSalesTool() {
  const [view,        setView]       = useState("form");
  const [showPricing, setShowP]      = useState(false);
  const [showAICfg,   setShowAI]     = useState(false);
  const [aiCfg,       setAiCfgState] = useState(loadAiConfig);
  const [form,        setForm]       = useState(DEFAULT_FORM);
  const [result,      setResult]     = useState(null);
  const [error,       setError]      = useState(null);
  const hasAI = !!(aiCfg.endpoint && aiCfg.apiKey);

  const setAiCfg = cfg => { setAiCfgState(cfg); saveAiConfig(cfg); };

  const handleSubmit = async () => {
    setView("loading"); setError(null);
    try {
      let r;
      if (hasAI) {
        try { r = await aiInitialOffer(form, aiCfg); }
        catch (e) { console.warn("AI failed, using rule engine:", e); r = ruleOffer(form); r.technicalNotes += ` [AI unavailable: ${e.message}]`; }
      } else { r = ruleOffer(form); }
      setResult(r); setView("result");
    } catch (e) { setError("Failed: " + e.message); setView("form"); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        html, body { background: ${T.bg}; margin: 0; font-family: ${T.sans}; }
        input:focus, textarea:focus, select:focus { border-color: ${T.teal} !important; outline: none; box-shadow: 0 0 0 3px ${T.tealLight}; }
        input::placeholder, textarea::placeholder { color: #BBBBBB; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print { .no-print { display: none !important; } body { background: white; } }
      `}</style>

      <div className="no-print" style={{ background: T.dark, padding: "0 32px", display: "flex", justifyContent: "space-between", alignItems: "center", height: 64, position: "sticky", top: 0, zIndex: 200 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontFamily: T.sans, fontWeight: 800, fontSize: 22, color: T.teal }}>truvami</span>
          <span style={{ width: 1, height: 20, background: "#333", display: "inline-block" }} />
          <span style={{ fontFamily: T.sans, fontWeight: 400, fontSize: 12, color: "#777", letterSpacing: 2, textTransform: "uppercase" }}>Solution Builder</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setShowP(true)} style={{ background: "transparent", border: "1px solid #333", borderRadius: 20, padding: "7px 16px", color: "#aaa", fontFamily: T.sans, fontSize: 12, cursor: "pointer" }}>Pricing Ref</button>
          <button onClick={() => setShowAI(true)} style={{ background: hasAI ? T.teal + "15" : "transparent", border: `1px solid ${hasAI ? T.teal + "60" : "#333"}`, borderRadius: 20, padding: "7px 16px", color: hasAI ? T.teal : "#aaa", fontFamily: T.sans, fontSize: 12, cursor: "pointer", fontWeight: hasAI ? 600 : 400 }}>{hasAI ? "✓ AI Connected" : "⚙ Connect AI"}</button>
        </div>
      </div>

      <div style={{ maxWidth: 940, margin: "0 auto", padding: "36px 24px 80px" }}>
        {view === "form" && (
          <>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontFamily: T.sans, fontWeight: 800, fontSize: 34, color: T.text, lineHeight: 1.2, marginBottom: 8 }}>Generate Solution Offer</div>
              <div style={{ fontFamily: T.sans, fontSize: 16, color: T.textMid }}>{hasAI ? "AI will analyse requirements and produce a tailored offer." : "Fill in the customer's requirements. Connect AI for smarter recommendations."}</div>
              {error && <div style={{ marginTop: 16, padding: 14, background: "#FFF0F0", border: "1px solid #FFD0D0", borderRadius: 10, fontFamily: T.sans, fontSize: 13, color: T.danger }}>✕ {error}</div>}
            </div>
            <CustomerForm form={form} setForm={setForm} onSubmit={handleSubmit} hasAI={hasAI} />
          </>
        )}
        {view === "loading" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "55vh", gap: 20 }}>
            <div style={{ width: 52, height: 52, border: `3px solid ${T.border}`, borderTop: `3px solid ${T.teal}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <div style={{ fontFamily: T.sans, fontSize: 15, color: T.textMid, fontWeight: 600 }}>{hasAI ? "Analysing with AI…" : "Generating offer…"}</div>
          </div>
        )}
        {view === "result" && (
          <>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontFamily: T.sans, fontWeight: 800, fontSize: 34, color: T.text, lineHeight: 1.2 }}>Solution Offer</div>
              <div style={{ fontFamily: T.sans, fontSize: 15, color: T.textMid, marginTop: 8 }}>{form.companyName ? `Prepared for ${form.companyName}${form.customerName ? ` — ${form.customerName}` : ""}` : "Generated recommendation"}</div>
            </div>
            <OfferResult result={result} onReset={() => { setView("form"); setResult(null); }} aiCfg={aiCfg} onUpdate={updated => setResult(updated)} />
          </>
        )}
      </div>

      {showPricing && <PricingModal onClose={() => setShowP(false)} />}
      {showAICfg   && <AIConfigModal cfg={aiCfg} setCfg={setAiCfg} onClose={() => setShowAI(false)} />}
    </>
  );
}
