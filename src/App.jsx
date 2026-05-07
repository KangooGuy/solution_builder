import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — matching truvami.com
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  teal:     "#3DCCA0", tealDark: "#2BAE85", tealLight: "#E8FBF5",
  dark:     "#141414", darkCard: "#1E1E1E",
  text:     "#1A1A1A", textMid: "#555555",  textLight: "#888888",
  bg:       "#F7F9FC", white:   "#FFFFFF",  border:    "#E4E8EF",
  danger:   "#E05252", warn:    "#F5A623",
  mono:     "'IBM Plex Mono', monospace",
  sans:     "'Inter', 'Helvetica Neue', sans-serif",
};

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT CATALOG (from official factsheets)
// ─────────────────────────────────────────────────────────────────────────────
const DEVICES = {
  smartLabel: {
    name: "Smart Label", key: "smartLabel",
    tagline: "Battery-free ultra-slim label tracker for high-volume deployment",
    form: "148 × 97.5 × 2 mm, 20 g — flexible sticker",
    power: "Battery-free. LiC capacitor via ambient light (OPV). Without light: 59 days (1/day), 7 days (1/h).",
    positioning: ["GNSS (10 m)", "WiFi (10–20 m)", "LoRaWAN"],
    temp: "0 – 40 °C", rating: "—", rechargeable: false,
    sensors: ["Accelerometer", "Pressure", "Temp / Humidity"],
    gnssAccuracy: "10 m",
    batteryLife: { "1/day": "59 days (no light)", "1/h": "7 days (no light)", autonomous: "Unlimited when lit" },
    bestFor: ["High-volume inventory", "Warehouse tracking", "Indoor assets", "Zero-maintenance deployment", "Document / small item tracking"],
    notFor: ["Harsh outdoor (40 °C max)", "Outdoor-only without solar access"],
  },
  tagS: {
    name: "Tag S", key: "tagS",
    tagline: "Compact safety tracker for tools, workforce and mixed-use fleets",
    form: "Ø 50 × 15 mm, 24 g — disc",
    power: "Rechargeable LiPo 0.32 Ah — USB-C. 9 months (1/day), 2.5 months (1/h), 7.5 days (1/5 min).",
    positioning: ["GNSS (3–5 m)", "WiFi (10–20 m)", "BLE", "LoRaWAN"],
    temp: "0 – 60 °C", rating: "—", rechargeable: true,
    sensors: ["Accelerometer", "Buzzer", "LED", "Fall detection", "Panic button"],
    gnssAccuracy: "3–5 m",
    batteryLife: { "1/day": "9 months", "1/h": "2.5 months", "1/5 min": "7.5 days" },
    bestFor: ["Tools & portable equipment", "Workforce safety", "Multi-site fleets", "Indoor + outdoor"],
    notFor: ["Harsh outdoor without IP rating", "Very long battery without charging"],
  },
  tagL: {
    name: "Tag L", key: "tagL",
    tagline: "Ruggedised tracker for larger assets in demanding environments",
    form: "80 × 54 × 23 mm, 103 g — quick-mount clip",
    power: "Rechargeable LiPo 0.85 Ah — USB-C + wireless. 2 years (1/day), 6 months (1/h), 20 days (1/5 min).",
    positioning: ["GNSS (3–5 m)", "WiFi (10–20 m)", "BLE", "LoRaWAN"],
    temp: "0 – 60 °C", rating: "Durable housing", rechargeable: true,
    sensors: ["Accelerometer"],
    gnssAccuracy: "3–5 m",
    batteryLife: { "1/day": "2 years", "1/h": "6 months", "1/5 min": "20 days" },
    bestFor: ["Heavy machinery & large equipment", "Outdoor & industrial", "Construction", "Long inter-charge periods"],
    notFor: ["Extreme cold (0 °C min)", "IP67 needed (use Tag XL)"],
  },
  tagXL: {
    name: "Tag XL", key: "tagXL",
    tagline: "Ultra-long life IP67 tracker for remote and harsh environments",
    form: "93 × 89 × 37 mm, 178 g — strong magnets",
    power: "2× AA lithium (non-rechargeable). 7.5 years (1/day), 2 years (1/h), 7 months (1/15 min).",
    positioning: ["Passive GNSS (5–50 m)", "WiFi (10–20 m)", "BLE", "LoRaWAN"],
    temp: "−20 – 60 °C", rating: "IP67", rechargeable: false,
    sensors: ["Accelerometer (3-axis)", "Gyroscope (6-axis)", "Optional: Temp / Pressure / Humidity"],
    gnssAccuracy: "5–50 m (passive GNSS)",
    batteryLife: { "1/day": "7.5 years", "1/h": "2 years", "1/15 min": "7 months" },
    bestFor: ["Remote / hard-to-reach assets", "Extreme environments (IP67, −20 °C)", "Minimal maintenance", "Heavy machinery", "2+ year hourly tracking"],
    notFor: ["High GNSS precision (<5 m)", "Small / lightweight assets"],
  },
  nomadXS: {
    name: "Nomad XS", key: "nomadXS",
    tagline: "Award-winning ultra-compact solar-powered sensor hub",
    form: "21 × 27 × 6 mm, 5.8 g — PCB with solar panels",
    power: "Solar LiPo via charging pads. Without solar: 4–6 days (1/h). Continuous when lit.",
    positioning: ["GNSS (uBlox — high precision)", "WiFi (10–20 m)", "BLE", "LoRaWAN"],
    temp: "0 – 60 °C", rating: "Epoxy", rechargeable: true,
    sensors: ["Accelerometer", "Pressure", "Light sensor", "Optional: Gyroscope / Magnetometer"],
    gnssAccuracy: "High precision (uBlox)",
    batteryLife: { "1/h (no solar)": "4–6 days", autonomous: "Continuous when lit" },
    bestFor: ["Very small / high-value assets", "Embedded applications", "Indoor (light available)", "Light & pressure monitoring"],
    notFor: ["Fully outdoor without solar access", "Harsh industrial environments"],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PRICING
// ─────────────────────────────────────────────────────────────────────────────
const HW_PRICE = {
  smartLabel: { single: 140, vol100: 120, vol1000: 90  },
  tagS:       { single: 140, vol100: 120, vol1000: 90  },
  tagL:       { single: 160, vol100: 140, vol1000: 110 },
  tagXL:      { single: 150, vol100: 130, vol1000: 100 },
  nomadXS:    { single: 350, vol100: 280, vol1000: 150 },
};

const PLATFORM = {
  basic:        { name: "Basic",        monthly: 35,  included: 25  },
  professional: { name: "Professional", monthly: 105, included: 100 },
  enterprise:   { name: "Enterprise",   monthly: 520, included: 250 },
};

const LOCATION = {
  light:       { name: "Light",       interval: "every 6 h",    chf: 0.10 },
  balanced:    { name: "Balanced",    interval: "every 1 h",    chf: 0.52 },
  performance: { name: "Performance", interval: "every 15 min", chf: 2.07 },
  max:         { name: "Max",         interval: "every 5 min",  chf: 6.20 },
};

const GW = {
  indoor:  { name: "Multitech Conduit AP (Indoor)",    chf: 650 },
  outdoor: { name: "Multitech Conduit IP67 (Outdoor)", chf: 850 },
};

// Replacement reserve margin by contract length (years)
const REPLACEMENT_MARGIN = { 1: 0.05, 2: 0.10, 3: 0.15, 4: 0.20, 5: 0.25 };

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const hwUnit  = (key, qty) => { const p = HW_PRICE[key]; if (!p) return 0; return qty >= 1000 ? p.vol1000 : qty >= 100 ? p.vol100 : p.single; };
const disc    = (v, pct) => v * (1 - (pct || 0) / 100);
const fmt     = (n, d = 2) => n == null || isNaN(n) ? "—" : `CHF ${Number(n).toLocaleString("de-CH", { minimumFractionDigits: d, maximumFractionDigits: d })}`;

function gwRecommendation(form) {
  const qty   = parseInt(form.assetCount) || 10;
  const ind   = (form.industry || "").toLowerCase();
  const env   = (form.environment || "").toLowerCase();
  const sites = Math.max(1, parseInt(form.numSites) || 1);
  const whs   = Math.max(1, parseInt(form.numWarehouses) || 1);
  const floors= Math.max(1, parseInt(form.numFloors) || 2);
  const outdoor = env.includes("outdoor") || env.includes("harsh") || env.includes("remote");
  const gwType  = outdoor ? "outdoor" : "indoor";

  let gws = [], note = "";
  if (ind.includes("logist") || ind.includes("warehouse")) {
    const gwPerWh = qty > 200 ? 2 : 1;
    gws = [{ type: "indoor", qty: whs * gwPerWh, reason: `${gwPerWh} indoor gateway(s) per warehouse × ${whs} warehouse(s). Covers ~${gwPerWh === 1 ? "10,000" : "20,000"} m² per unit.` }];
    note = "1 indoor Multitech Conduit AP covers approx. 10,000 m² in open warehouse space.";
  } else if (ind.includes("construction")) {
    const extra = qty > 100 ? sites : 0;
    gws = [{ type: "outdoor", qty: sites + extra, reason: `1 outdoor gateway per site × ${sites} site(s)${extra > 0 ? ` + 1 extra per large site (>100 assets)` : ""}. Covers up to 15 km radius outdoors.` }];
    note = "Outdoor Multitech Conduit IP67 — weatherproof, covers vast construction sites via LoRaWAN long range.";
  } else if (ind.includes("manufact")) {
    const gwQty = Math.max(1, Math.ceil(floors / 2));
    gws = [{ type: "indoor", qty: gwQty, reason: `1 indoor gateway per 2 floors (${floors} floors total). Covers ~5,000 m² per gateway.` }];
  } else if (ind.includes("healthcare")) {
    gws = [{ type: "indoor", qty: floors, reason: `1 indoor gateway per floor (${floors} floors). Ensures full in-building coverage.` }];
  } else {
    gws = [{ type: gwType, qty: sites, reason: `1 ${gwType} gateway per site (${sites} site${sites > 1 ? "s" : ""}) — baseline recommendation.` }];
  }

  const total = gws.reduce((s, g) => s + g.qty, 0);
  if (total === 0) gws = [{ type: gwType, qty: 1, reason: "Minimum 1 gateway per deal (Truvami standard)." }];
  return { gateways: gws, note };
}

// ─────────────────────────────────────────────────────────────────────────────
// RULE-BASED ENGINE
// ─────────────────────────────────────────────────────────────────────────────
function ruleOffer(form, discounts) {
  const qty    = parseInt(form.assetCount) || 10;
  const env    = (form.environment || "").toLowerCase();
  const uc     = (form.useCase    || "").toLowerCase();
  const ind    = (form.industry   || "").toLowerCase();
  const locN   = (form.positioningNeeds || "").toLowerCase();
  const hwD    = discounts.hardware || 0;
  const svcD   = discounts.services || 0;

  // Device selection logic
  let hwKey = "tagS";
  let hwReason = "Tag S is the recommended default — compact disc form (Ø 50 mm), full GNSS/BLE/WiFi/LoRa stack, rechargeable USB-C. Ideal for tools and mixed-use fleets.";

  if (env.includes("remote") || (env.includes("outdoor") && env.includes("harsh"))) {
    hwKey = "tagXL";
    hwReason = "Tag XL — IP67 rated, −20 °C operating range, 2-year battery at hourly fixes. Ideal for harsh/remote environments with minimal maintenance access.";
  } else if (env.includes("outdoor") && !env.includes("indoor")) {
    hwKey = qty >= 100 ? "tagL" : "tagXL";
    hwReason = hwKey === "tagL"
      ? "Tag L — 2-year battery (1/day), 3–5 m GNSS, rechargeable. Best for large outdoor fleets with regular charging access."
      : "Tag XL — ultra-long battery, IP67. Best for outdoor-only deployment where charging is infrequent.";
  } else if (env.includes("harsh") || uc.includes("machinery") || uc.includes("heavy")) {
    hwKey = "tagL";
    hwReason = "Tag L — ruggedised housing, 2-year battery at daily fixes, 3–5 m GNSS accuracy. Right balance of durability and precision for industrial equipment.";
  } else if (ind.includes("warehouse") || ind.includes("logist") || (locN.includes("ble") && !uc.includes("outdoor"))) {
    hwKey = "smartLabel";
    hwReason = "Smart Label — battery-free (solar/ambient light), ultra-slim sticker form factor (2 mm). Perfect for high-volume warehouse and inventory tracking where charging thousands of devices is impractical.";
  } else if (uc.includes("safety") || uc.includes("workforce") || uc.includes("worker")) {
    hwKey = "tagS";
    hwReason = "Tag S — only Truvami device with built-in fall detection and panic button. Compact disc form for personal carry or easy tool attachment.";
  } else if (uc.includes("small") || uc.includes("embed") || ind.includes("healthcare")) {
    hwKey = "nomadXS";
    hwReason = "Nomad XS — ultra-compact (21 × 27 × 6 mm, 5.8 g), solar-powered. Ideal for small high-value assets, embedded applications, or healthcare equipment.";
  }

  const platKey = qty > 250 ? "enterprise" : qty > 100 ? "professional" : "basic";
  const plat    = PLATFORM[platKey];

  let locKey = "balanced";
  if (uc.includes("real-time") || uc.includes("security") || uc.includes("safety")) locKey = "performance";
  if (ind.includes("warehouse") || ind.includes("inventory")) locKey = "light";
  if (locN.includes("15 min") || locN.includes("every 15")) locKey = "performance";
  const loc = LOCATION[locKey];

  const gwRec = gwRecommendation(form);

  const unitPrice  = disc(hwUnit(hwKey, qty), hwD);
  const hwTotal    = unitPrice * qty;
  const platM      = disc(plat.monthly, svcD);
  const extraDev   = Math.max(0, qty - plat.included);
  const locM       = disc(extraDev * loc.chf, svcD);
  const gwTotal    = gwRec.gateways.reduce((s, g) => s + g.qty * disc(GW[g.type].chf, hwD), 0);
  const mTotal     = platM + locM;

  const recurringModels = [1, 2, 3, 5].map(years => {
    const margin  = REPLACEMENT_MARGIN[years] || 0.25;
    const months  = years * 12;
    const hwAmort = ((hwTotal + gwTotal) * (1 + margin)) / months;
    return { years, months, hwAmort, monthlyAll: hwAmort + mTotal, repMarginPct: margin * 100 };
  });

  return {
    executiveSummary: `For ${qty} assets in a ${form.environment || "mixed"} environment, we recommend the ${DEVICES[hwKey].name} with the ${plat.name} SaaS plan and ${loc.name} location package — ${DEVICES[hwKey].tagline.toLowerCase()}.`,
    devices: [{ key: hwKey, name: DEVICES[hwKey].name, qty, unitPrice, total: hwTotal, reasoning: hwReason }],
    platformRec: { tier: platKey, reasoning: `${plat.name} at ${fmt(platM)}/month includes ${plat.included} devices${svcD > 0 ? ` (${svcD}% discount applied)` : ""}. ${qty > plat.included ? `${extraDev} extra devices billed via location package.` : "Covers full fleet."}` },
    locationPkg: { key: locKey, locCHF: disc(loc.chf, svcD), reasoning: `${loc.name} (${loc.interval}) at ${fmt(disc(loc.chf, svcD))}/tracker/month${svcD > 0 ? ` (${svcD}% discount applied)` : ""}.` },
    gateways: gwRec.gateways, gatewayNote: gwRec.note,
    upfront:   { hwTotal, gwTotal, total: hwTotal + gwTotal, breakdown: [{ name: DEVICES[hwKey].name, qty, unitPrice, total: hwTotal }] },
    recurring: { platform: platM, location: locM, monthly: mTotal, annual: mTotal * 12 },
    recurringModels, discounts,
    nextSteps: [
      "Schedule a technical discovery call to validate scope and requirements.",
      "Run a LoRaWAN coverage test before finalising gateway count.",
      "Start with a 5–10 device pilot across representative sites.",
      `Review IT integration requirements${form.integrations?.length ? ` (${form.integrations.join(", ")})` : ""}.`,
      "Define SLA expectations and support coverage model.",
    ],
    technicalNotes: `${DEVICES[hwKey].name}: ${DEVICES[hwKey].form}. Temp range: ${DEVICES[hwKey].temp}. GNSS accuracy: ${DEVICES[hwKey].gnssAccuracy}. Connectivity: ${DEVICES[hwKey].positioning.join(" + ")}. ${DEVICES[hwKey].rechargeable ? "Rechargeable." : "Non-rechargeable — budget replacement at end-of-life."} All data hosted in Switzerland/EU. LoRaWAN® AES-128 encrypted.`,
    contractNote: form.contractDuration > 12 ? `Based on ${form.contractDuration}-month contract term.` : null,
    source: "rules",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AI CALL
// ─────────────────────────────────────────────────────────────────────────────
const CATALOG_STR = Object.values(DEVICES).map(d =>
  `${d.name}: ${d.tagline}. Form: ${d.form}. Power: ${d.power}. Positioning: ${d.positioning.join(", ")}. Temp: ${d.temp}. Best for: ${d.bestFor.join("; ")}.`
).join("\n");

async function aiOffer(form, cfg, discounts) {
  const { endpoint, apiKey, deployment } = cfg;
  if (!endpoint || !apiKey) throw new Error("AI endpoint not configured.");
  const hwD = discounts.hardware || 0, svcD = discounts.services || 0;
  const system = `You are a senior Truvami IoT sales engineer. Analyse requirements and return ONLY valid JSON (no markdown).
CATALOG:\n${CATALOG_STR}
PRICING: smartLabel/tagS 140/120/90, tagL 160/140/110, tagXL 150/130/100, nomadXS 350/280/150 (CHF, 1/100+/1000+). Platform: Basic 35/mo (25dev), Pro 105/mo (100dev), Enterprise 520/mo (250dev). Location/tracker/mo: light 0.10, balanced 0.52, performance 2.07, max 6.20. Gateway indoor 650, outdoor 850. HW discount ${hwD}%, SVC discount ${svcD}%.
JSON schema: {"executiveSummary":"","devices":[{"key":"","name":"","qty":0,"unitPrice":0,"total":0,"reasoning":""}],"platformRec":{"tier":"","reasoning":""},"locationPkg":{"key":"","locCHF":0,"reasoning":""},"gateways":[{"type":"indoor|outdoor","qty":0,"reason":""}],"gatewayNote":"","upfront":{"hwTotal":0,"gwTotal":0,"total":0,"breakdown":[{"name":"","qty":0,"unitPrice":0,"total":0}]},"recurring":{"platform":0,"location":0,"monthly":0,"annual":0},"nextSteps":[""],"technicalNotes":"","contractNote":null}`;
  const user = Object.entries({ Customer: `${form.customerName} at ${form.companyName}`, Industry: form.industry, "Use case": form.useCase, Assets: `${form.assetTypes} × ${form.assetCount}`, Environment: form.environment, Positioning: form.positioningNeeds, Sites: form.numSites, Warehouses: form.numWarehouses, Floors: form.numFloors, LoRaWAN: form.hasLoraWAN, Platform: form.platformPreference, Integrations: form.integrations?.join(", "), Contract: `${form.contractDuration} months`, Context: form.additionalContext }).map(([k, v]) => `${k}: ${v}`).join("\n");
  const isAz = endpoint.includes("azure.com") || endpoint.includes("openai.azure");
  const url  = isAz ? `${endpoint.replace(/\/$/, "")}/openai/deployments/${deployment || "gpt-4o"}/chat/completions?api-version=2024-02-15-preview` : `${endpoint.replace(/\/$/, "")}/chat/completions`;
  const res  = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...(isAz ? { "api-key": apiKey } : { Authorization: `Bearer ${apiKey}` }) }, body: JSON.stringify({ ...(isAz ? {} : { model: deployment || "gpt-4o" }), messages: [{ role: "system", content: system }, { role: "user", content: user }], max_tokens: 2500, temperature: 0.2 }) });
  if (!res.ok) throw new Error(`AI API ${res.status}: ${res.statusText}`);
  const data = await res.json();
  const parsed = JSON.parse((data.choices?.[0]?.message?.content || "").replace(/```json|```/g, "").trim());
  const hw = parsed.upfront?.hwTotal || 0, gw = parsed.upfront?.gwTotal || 0, mT = parsed.recurring?.monthly || 0;
  parsed.recurringModels = [1, 2, 3, 5].map(years => { const m = REPLACEMENT_MARGIN[years] || 0.25, mo = years * 12, hw2 = ((hw + gw) * (1 + m)) / mo; return { years, months: mo, hwAmort: hw2, monthlyAll: hw2 + mT, repMarginPct: m * 100 }; });
  parsed.discounts = discounts; parsed.source = "ai";
  return parsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
const INPUT_S = { width: "100%", background: T.white, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", color: T.text, fontFamily: T.sans, fontSize: 14, outline: "none", transition: "border-color 0.15s" };
const SELECT_S = { ...INPUT_S, cursor: "pointer", appearance: "none" };

const FL = ({ children }) => <div style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 12, color: T.textMid, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{children}</div>;
const FH = ({ children }) => <div style={{ fontSize: 12, color: T.textLight, marginBottom: 6 }}>{children}</div>;
const Field = ({ label, hint, children }) => <div style={{ marginBottom: 20 }}><FL>{label}</FL>{hint && <FH>{hint}</FH>}{children}</div>;
const Sec = ({ children }) => <div style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 13, color: T.teal, letterSpacing: 1, textTransform: "uppercase", marginTop: 32, marginBottom: 16, paddingBottom: 10, borderBottom: `2px solid ${T.tealLight}` }}>{children}</div>;
const Card = ({ children, style, hi }) => <div style={{ background: T.white, borderRadius: 14, padding: 24, border: hi ? `2px solid ${T.teal}` : `1px solid ${T.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", ...style }}>{children}</div>;
const CL = ({ children, c }) => <div style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 11, color: c || T.teal, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>{children}</div>;
const Pill = ({ label, active, onClick }) => <button onClick={onClick} style={{ padding: "6px 14px", borderRadius: 20, fontFamily: T.sans, fontSize: 13, cursor: "pointer", border: `1.5px solid ${active ? T.teal : T.border}`, background: active ? T.tealLight : T.white, color: active ? T.teal : T.textMid, fontWeight: active ? 600 : 400 }}>{label}</button>;
const TBtn = ({ onClick, children, small }) => <button onClick={onClick} style={{ background: T.teal, border: "none", borderRadius: 25, padding: small ? "8px 20px" : "13px 32px", color: T.dark, fontFamily: T.sans, fontWeight: 700, fontSize: small ? 13 : 15, cursor: "pointer" }}>{children}</button>;
const GBtn = ({ onClick, children }) => <button onClick={onClick} style={{ background: "transparent", border: `1.5px solid ${T.border}`, borderRadius: 25, padding: "10px 24px", color: T.textMid, fontFamily: T.sans, fontSize: 14, cursor: "pointer" }}>{children}</button>;

// ─────────────────────────────────────────────────────────────────────────────
// FORM
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
        <Field label="Contact Name"><input style={INPUT_S} value={form.customerName} onChange={set("customerName")} placeholder="e.g. Anna Müller" /></Field>
        <Field label="Company"><input style={INPUT_S} value={form.companyName} onChange={set("companyName")} placeholder="e.g. Bau AG" /></Field>
      </div>
      <Field label="Industry">
        <select style={SELECT_S} value={form.industry} onChange={set("industry")}>
          <option value="">Select…</option>
          {["Construction","Intralogistics / Warehousing","Manufacturing","Healthcare","Security / Asset Protection","Transportation & Fleet","Oil & Gas / Mining","Other"].map(o => <option key={o}>{o}</option>)}
        </select>
      </Field>
      <Sec>Assets & Use Case</Sec>
      <Field label="Use Case / Problem Statement" hint="What problem are they solving?">
        <textarea style={{ ...INPUT_S, minHeight: 90, resize: "vertical" }} value={form.useCase} onChange={set("useCase")} placeholder="e.g. Track construction tools and heavy equipment across job sites, prevent theft and loss." />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
        <Field label="Asset Types"><input style={INPUT_S} value={form.assetTypes} onChange={set("assetTypes")} placeholder="e.g. Power tools, scaffolding, forklifts" /></Field>
        <Field label="Number of Assets"><input style={INPUT_S} type="number" min="1" value={form.assetCount} onChange={set("assetCount")} placeholder="e.g. 250" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
        <Field label="Environment">
          <select style={SELECT_S} value={form.environment} onChange={set("environment")}>
            <option value="">Select…</option>
            {["Indoor only","Outdoor only","Mixed indoor & outdoor","Harsh / Industrial outdoor","Remote / Low connectivity"].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Positioning Needs">
          <select style={SELECT_S} value={form.positioningNeeds} onChange={set("positioningNeeds")}>
            <option value="">Select…</option>
            {["Room-level BLE (indoor)","Building-level WiFi","Outdoor GPS (3–5 m)","Wide-area LoRa (coarse)","Mixed — all technologies"].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
      </div>
      <Sec>Sites & Infrastructure</Sec>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 24px" }}>
        <Field label="Number of Sites"><input style={INPUT_S} type="number" min="1" value={form.numSites} onChange={set("numSites")} /></Field>
        {(ind.includes("logist") || ind.includes("warehouse")) && <Field label="Warehouses"><input style={INPUT_S} type="number" min="0" value={form.numWarehouses} onChange={set("numWarehouses")} /></Field>}
        {(ind.includes("manufact") || ind.includes("healthcare")) && <Field label="Floors per Building"><input style={INPUT_S} type="number" min="1" value={form.numFloors} onChange={set("numFloors")} /></Field>}
        <Field label="LoRaWAN Coverage?">
          <select style={SELECT_S} value={form.hasLoraWAN} onChange={set("hasLoraWAN")}>
            <option value="">Unknown / TBD</option>
            <option value="yes">Yes — already covered</option>
            <option value="partial">Partial — some sites</option>
            <option value="no">No — needs gateways</option>
          </select>
        </Field>
      </div>
      <Field label="Platform Preference">
        <select style={SELECT_S} value={form.platformPreference} onChange={set("platformPreference")}>
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
          <select style={SELECT_S} value={form.contractDuration} onChange={set("contractDuration")}>
            {["12","24","36","48","60"].map(d => <option key={d} value={d}>{d} months ({d / 12} year{d > 12 ? "s" : ""})</option>)}
          </select>
        </Field>
      </div>
      <Field label="Additional Context" hint="Budget, timeline, special requirements">
        <textarea style={{ ...INPUT_S, minHeight: 80, resize: "vertical" }} value={form.additionalContext} onChange={set("additionalContext")} placeholder="e.g. Tight budget, prefer low upfront. Already using SAP ERP." />
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 18, color: T.text }}>{dev.name}</span>
          <span style={{ fontFamily: T.sans, fontSize: 13, color: T.textLight }}>× {dev.qty} units</span>
          {d?.rating && d.rating !== "—" && <span style={{ padding: "2px 8px", background: T.tealLight, color: T.teal, borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{d.rating}</span>}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
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
            {Object.entries(d.batteryLife).map(([k, v]) => (
              <div key={k}><span style={{ fontFamily: T.mono, fontSize: 12, color: T.teal }}>{k}:</span> <span style={{ fontFamily: T.sans, fontSize: 12, color: T.textMid }}>{v}</span></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GatewaySection({ gateways, note, discounts }) {
  const hwD = discounts?.hardware || 0;
  const total = gateways.reduce((s, g) => s + g.qty * disc(GW[g.type].chf, hwD), 0);
  return (
    <Card>
      <CL>LoRaWAN Coverage — Gateway Deployment</CL>
      {gateways.map((g, i) => {
        const gwInfo = GW[g.type], up = disc(gwInfo.chf, hwD);
        return (
          <div key={i} style={{ padding: 14, background: T.bg, borderRadius: 10, border: `1px solid ${T.border}`, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div><span style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 14, color: T.text }}>{gwInfo.name}</span><span style={{ marginLeft: 12, fontFamily: T.sans, fontSize: 13, color: T.textLight }}>× {g.qty}</span></div>
              <div style={{ textAlign: "right" }}><div style={{ fontFamily: T.mono, fontSize: 13, color: T.teal, fontWeight: 600 }}>{fmt(up)}/unit</div><div style={{ fontFamily: T.mono, fontSize: 11, color: T.textLight }}>{fmt(up * g.qty)} total</div></div>
            </div>
            <p style={{ fontFamily: T.sans, fontSize: 13, color: T.textMid, margin: 0 }}>{g.reason}</p>
          </div>
        );
      })}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${T.border}`, paddingTop: 14, marginTop: 4 }}>
        <span style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 14, color: T.text }}>Gateway Total{hwD > 0 ? ` (incl. ${hwD}% discount)` : ""}</span>
        <span style={{ fontFamily: T.mono, fontSize: 16, color: T.teal, fontWeight: 700 }}>{fmt(total)}</span>
      </div>
      {note && <div style={{ marginTop: 12, padding: "10px 14px", background: T.tealLight, borderRadius: 8, fontFamily: T.sans, fontSize: 12, color: T.teal }}>ℹ {note}</div>}
      <div style={{ marginTop: 10, padding: "10px 14px", background: "#FFF8EC", borderRadius: 8, fontFamily: T.sans, fontSize: 12, color: T.warn }}>
        ⚠ At least 1 Multitech gateway is mandatory per deal. Final count depends on on-site coverage test. Shown quantities are indicative recommendations.
      </div>
    </Card>
  );
}

function PricingTable({ result }) {
  const [mode, setMode] = useState("capex");
  const [yrs, setYrs]   = useState(3);
  const plat = PLATFORM[result.platformRec?.tier];
  const loc  = LOCATION[result.locationPkg?.key];
  const rm   = result.recurringModels?.find(r => r.years === yrs);

  return (
    <Card hi>
      <CL>Pricing Summary</CL>
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
                <span>{b.name} × {b.qty}</span><span style={{ fontFamily: T.mono }}>{fmt(b.total)}</span>
              </div>
            ))}
            {(result.upfront?.gwTotal > 0) && (
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: T.sans, fontSize: 13, color: T.textMid, marginBottom: 8 }}>
                <span>Gateways</span><span style={{ fontFamily: T.mono }}>{fmt(result.upfront.gwTotal)}</span>
              </div>
            )}
            {result.discounts?.hardware > 0 && <div style={{ fontSize: 11, color: T.teal, marginBottom: 8 }}>✓ {result.discounts.hardware}% hardware discount</div>}
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
            {result.discounts?.services > 0 && <div style={{ fontSize: 11, color: T.teal, marginBottom: 8 }}>✓ {result.discounts.services}% services discount</div>}
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
                  <div style={{ fontFamily: T.sans, fontSize: 12, color: T.textLight, marginBottom: 4 }}>Platform + Location</div>
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
          <div style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 13, color: T.text, marginBottom: 12 }}>Compare by contract term</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {result.recurringModels?.map(r => (
              <div key={r.years} onClick={() => setYrs(r.years)} style={{ textAlign: "center", padding: 16, borderRadius: 12, border: `1.5px solid ${yrs === r.years ? T.teal : T.border}`, background: yrs === r.years ? T.tealLight : T.white, cursor: "pointer", transition: "all 0.15s" }}>
                <div style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 8 }}>{r.years} Year{r.years > 1 ? "s" : ""}</div>
                <div style={{ fontFamily: T.mono, fontSize: 16, color: T.teal, fontWeight: 700 }}>{fmt(r.monthlyAll)}</div>
                <div style={{ fontFamily: T.sans, fontSize: 11, color: T.textLight, marginTop: 6 }}>+{r.repMarginPct}% reserve</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: "12px 16px", background: T.tealLight, borderRadius: 10, fontFamily: T.sans, fontSize: 12, color: T.teal, lineHeight: 1.6 }}>
            ℹ The replacement reserve covers device loss, damage and end-of-life replacement over the contract term. 1Y = 5%, 2Y = 10%, 3Y = 15%, 5Y = 25%. Hardware, gateways, platform and location packages are all included in the monthly fee.
          </div>
        </div>
      )}
    </Card>
  );
}

function OfferResult({ result, onReset }) {
  if (!result) return null;
  const plat = PLATFORM[result.platformRec?.tier], loc = LOCATION[result.locationPkg?.key];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {result.source === "rules" && <div style={{ padding: "10px 18px", background: "#FFF8EC", border: `1px solid ${T.warn}40`, borderRadius: 10, fontFamily: T.sans, fontSize: 13, color: T.warn }}>⚙ Rule engine — connect an AI endpoint for deeper analysis</div>}

      <Card><CL>Executive Summary</CL><p style={{ fontFamily: T.sans, fontSize: 15, color: T.textMid, lineHeight: 1.75, margin: 0 }}>{result.executiveSummary}</p></Card>

      <Card>
        <CL>Recommended Hardware</CL>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{result.devices?.map((d, i) => <DeviceCard key={i} dev={d} />)}</div>
      </Card>

      {result.gateways?.length > 0 && <GatewaySection gateways={result.gateways} note={result.gatewayNote} discounts={result.discounts} />}

      {result.platformRec && plat && (
        <Card>
          <CL>SaaS Platform</CL>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div><span style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 17, color: T.text }}>{plat.name} Plan</span><span style={{ fontFamily: T.sans, fontSize: 13, color: T.textLight, marginLeft: 12 }}>incl. {plat.included} devices</span></div>
            <span style={{ fontFamily: T.mono, fontSize: 15, color: T.teal, fontWeight: 700 }}>{fmt(result.recurring?.platform)}/month</span>
          </div>
          <p style={{ fontFamily: T.sans, fontSize: 13, color: T.textMid, margin: 0, lineHeight: 1.65 }}>{result.platformRec.reasoning}</p>
        </Card>
      )}

      {result.locationPkg && loc && (
        <Card>
          <CL>Location Package (per tracker)</CL>
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
            <CL>Next Steps</CL>
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
            <CL>Technical Notes</CL>
            <div style={{ fontFamily: T.sans, fontSize: 13, color: T.textMid, lineHeight: 1.7 }}>{result.technicalNotes}</div>
          </Card>
        )}
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <TBtn onClick={() => window.print()}>Export PDF</TBtn>
        <GBtn onClick={onReset}>← New Offer</GBtn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODALS
// ─────────────────────────────────────────────────────────────────────────────
function PricingModal({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: T.white, borderRadius: 20, padding: 36, width: 780, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div style={{ fontFamily: T.sans, fontWeight: 800, fontSize: 22, color: T.text }}>Pricing Reference</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: T.textLight }}>✕</button>
        </div>
        {/* Hardware */}
        <div style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 11, color: T.teal, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>Hardware (CHF, one-time per device)</div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 28, fontFamily: T.sans, fontSize: 13 }}>
          <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>{["Product","Form","Temp","IP","1 device","100+","1'000+"].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: ["1 device","100+","1'000+"].includes(h) ? "right" : "left", color: T.textMid, fontWeight: 600 }}>{h}</th>)}</tr></thead>
          <tbody>
            {Object.entries(HW_PRICE).map(([k, p]) => { const d = DEVICES[k]; return (
              <tr key={k} style={{ borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: "10px 10px", color: T.text, fontWeight: 600 }}>{d?.name}</td>
                <td style={{ padding: "10px 10px", color: T.textMid, fontSize: 12 }}>{d?.form?.split(",")[0]}</td>
                <td style={{ padding: "10px 10px", color: T.textMid, fontSize: 12 }}>{d?.temp}</td>
                <td style={{ padding: "10px 10px", color: T.textMid, fontSize: 12 }}>{d?.rating}</td>
                <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: T.mono, color: T.text }}>{p.single}</td>
                <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: T.mono, color: T.text }}>{p.vol100}</td>
                <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: T.mono, color: T.text }}>{p.vol1000}</td>
              </tr>
            );})}
          </tbody>
        </table>
        {/* Platform */}
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
        {/* Location */}
        <div style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 11, color: T.teal, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>Location Packages (CHF/tracker/month)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
          {Object.values(LOCATION).map(p => (
            <div key={p.name} style={{ background: T.bg, borderRadius: 10, padding: 16, border: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 14, color: T.text }}>{p.name}</div><div style={{ fontFamily: T.sans, fontSize: 12, color: T.textLight }}>{p.interval}</div></div>
              <div style={{ fontFamily: T.mono, fontSize: 20, color: T.teal, fontWeight: 700 }}>CHF {p.chf}</div>
            </div>
          ))}
        </div>
        {/* Gateways */}
        <div style={{ fontFamily: T.sans, fontWeight: 700, fontSize: 11, color: T.teal, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>LoRaWAN Gateways (CHF, one-time)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {Object.values(GW).map(g => (
            <div key={g.name} style={{ background: T.bg, borderRadius: 10, padding: 16, border: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontFamily: T.sans, fontSize: 13, color: T.text, fontWeight: 600 }}>{g.name}</div>
              <div style={{ fontFamily: T.mono, fontSize: 20, color: T.teal, fontWeight: 700 }}>CHF {g.chf}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AIConfigModal({ cfg, setCfg, onClose }) {
  const [local, setLocal] = useState(cfg);
  const set = k => e => setLocal(c => ({ ...c, [k]: e.target.value }));
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: T.white, borderRadius: 20, padding: 36, width: 540, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: T.sans, fontWeight: 800, fontSize: 20, color: T.text }}>AI Endpoint (Optional)</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: T.textLight }}>✕</button>
        </div>
        <div style={{ padding: "12px 16px", background: T.bg, borderRadius: 10, fontFamily: T.sans, fontSize: 13, color: T.textMid, marginBottom: 22, lineHeight: 1.6 }}>
          Connect a <strong>Teams Copilot (Azure OpenAI)</strong> or any OpenAI-compatible API for AI-powered recommendations. Leave empty to use the built-in rule engine.
        </div>
        <Field label="Endpoint URL" hint="Azure: https://YOUR.openai.azure.com  |  OpenAI: https://api.openai.com/v1">
          <input style={INPUT_S} value={local.endpoint} onChange={set("endpoint")} placeholder="https://your-resource.openai.azure.com" />
        </Field>
        <Field label="API Key / Bearer Token">
          <input style={{ ...INPUT_S, fontFamily: T.mono }} type="password" value={local.apiKey} onChange={set("apiKey")} placeholder="sk-… or Azure API key" />
        </Field>
        <Field label="Deployment / Model" hint="Azure deployment name or OpenAI model (e.g. gpt-4o)">
          <input style={INPUT_S} value={local.deployment} onChange={set("deployment")} placeholder="gpt-4o" />
        </Field>
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <TBtn onClick={() => { setCfg(local); onClose(); }}>Save</TBtn>
          <GBtn onClick={() => { setCfg({ endpoint: "", apiKey: "", deployment: "gpt-4o" }); onClose(); }}>Clear (use rules)</GBtn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function TruvamiSalesTool() {
  const [view,        setView]        = useState("form");
  const [showPricing, setShowPricing] = useState(false);
  const [showAICfg,   setShowAICfg]   = useState(false);
  const [aiCfg,       setAiCfg]       = useState({ endpoint: "", apiKey: "", deployment: "gpt-4o" });
  const [form,        setForm]        = useState(DEFAULT_FORM);
  const [discounts,   setDiscounts]   = useState({ hardware: 0, services: 0 });
  const [result,      setResult]      = useState(null);
  const [error,       setError]       = useState(null);
  const hasAI = !!(aiCfg.endpoint && aiCfg.apiKey);

  const handleSubmit = async () => {
    setView("loading"); setError(null);
    try {
      let r;
      if (hasAI) {
        try { r = await aiOffer(form, aiCfg, discounts); }
        catch (e) { console.warn("AI fallback:", e); r = ruleOffer(form, discounts); r.technicalNotes += ` [AI error: ${e.message}]`; }
      } else {
        r = ruleOffer(form, discounts);
      }
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

      {/* NAV */}
      <div className="no-print" style={{ background: T.dark, padding: "0 32px", display: "flex", justifyContent: "space-between", alignItems: "center", height: 64, position: "sticky", top: 0, zIndex: 200 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontFamily: T.sans, fontWeight: 800, fontSize: 22, color: T.teal }}>truvami</span>
          <span style={{ width: 1, height: 20, background: "#333", display: "inline-block" }} />
          <span style={{ fontFamily: T.sans, fontWeight: 400, fontSize: 12, color: "#777", letterSpacing: 2, textTransform: "uppercase" }}>Solution Builder</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setShowPricing(true)} style={{ background: "transparent", border: "1px solid #333", borderRadius: 20, padding: "7px 16px", color: "#aaa", fontFamily: T.sans, fontSize: 12, cursor: "pointer" }}>Pricing Ref</button>
          <button onClick={() => setShowAICfg(true)} style={{ background: "transparent", border: `1px solid ${hasAI ? T.teal + "60" : "#333"}`, borderRadius: 20, padding: "7px 16px", color: hasAI ? T.teal : "#aaa", fontFamily: T.sans, fontSize: 12, cursor: "pointer" }}>{hasAI ? "✓ AI Connected" : "⚙ Connect AI"}</button>
        </div>
      </div>

      <div style={{ maxWidth: 940, margin: "0 auto", padding: "36px 24px 80px" }}>
        {view === "form" && (
          <>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontFamily: T.sans, fontWeight: 800, fontSize: 34, color: T.text, lineHeight: 1.2, marginBottom: 8 }}>Generate Solution Offer</div>
              <div style={{ fontFamily: T.sans, fontSize: 16, color: T.textMid }}>Fill in customer requirements — {hasAI ? "AI will generate the recommendation." : "the rule engine will produce a structured offer."}</div>
              {error && <div style={{ marginTop: 16, padding: 14, background: "#FFF0F0", border: "1px solid #FFD0D0", borderRadius: 10, fontFamily: T.sans, fontSize: 13, color: T.danger }}>✕ {error}</div>}
            </div>

            {/* Discount panel */}
            <Card style={{ marginBottom: 24 }}>
              <CL c={T.textMid}>Commercial Adjustments</CL>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
                <Field label="Hardware Discount %" hint="Applied to devices & gateways">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input style={{ ...INPUT_S, width: 90 }} type="number" min="0" max="50" value={discounts.hardware} onChange={e => setDiscounts(d => ({ ...d, hardware: Math.max(0, Math.min(50, +e.target.value)) }))} />
                    <span style={{ fontFamily: T.sans, fontSize: 14, color: T.textMid }}>%</span>
                  </div>
                </Field>
                <Field label="Services Discount %" hint="Applied to platform & location fees">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input style={{ ...INPUT_S, width: 90 }} type="number" min="0" max="50" value={discounts.services} onChange={e => setDiscounts(d => ({ ...d, services: Math.max(0, Math.min(50, +e.target.value)) }))} />
                    <span style={{ fontFamily: T.sans, fontSize: 14, color: T.textMid }}>%</span>
                  </div>
                </Field>
              </div>
              {(discounts.hardware > 0 || discounts.services > 0) && (
                <div style={{ padding: "8px 14px", background: T.tealLight, borderRadius: 8, fontFamily: T.sans, fontSize: 12, color: T.teal }}>
                  ✓ Discounts will be reflected in the generated offer
                </div>
              )}
            </Card>

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
              <div style={{ fontFamily: T.sans, fontSize: 15, color: T.textMid, marginTop: 8 }}>
                {form.companyName ? `Prepared for ${form.companyName}${form.customerName ? ` — ${form.customerName}` : ""}` : "Generated recommendation"}
                {(result.discounts?.hardware > 0 || result.discounts?.services > 0) && (
                  <span style={{ marginLeft: 12, padding: "3px 10px", background: T.tealLight, color: T.teal, borderRadius: 10, fontSize: 12, fontWeight: 600 }}>
                    {[result.discounts.hardware > 0 && `${result.discounts.hardware}% HW`, result.discounts.services > 0 && `${result.discounts.services}% SVC`].filter(Boolean).join(" / ")} discount
                  </span>
                )}
              </div>
            </div>
            <OfferResult result={result} onReset={() => { setView("form"); setResult(null); }} />
          </>
        )}
      </div>

      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
      {showAICfg   && <AIConfigModal cfg={aiCfg} setCfg={setAiCfg} onClose={() => setShowAICfg(false)} />}
    </>
  );
}
