import { useState } from "react";

// ── Pricing (from Truvami price list Feb 2026) ─────────────────────────────
const HW = {
  tagS:    { name: "Tag S",     single: 140, vol100: 120, vol1000: 90  },
  tagL:    { name: "Tag L",     single: 160, vol100: 140, vol1000: 110 },
  tagXL:   { name: "Tag XL",   single: 150, vol100: 130, vol1000: 100 },
  nomadXS: { name: "Nomad XS", single: 350, vol100: 280, vol1000: 150 },
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

function hwPrice(key, qty) {
  const p = HW[key]; if (!p) return 0;
  if (qty >= 1000) return p.vol1000;
  if (qty >= 100)  return p.vol100;
  return p.single;
}

// ── Product knowledge (for AI prompt) ─────────────────────────────────────
const CATALOG = `TRUVAMI PRODUCT CATALOG
=======================
HARDWARE:
- Nomad XS: ultra-compact, GNSS/BLE/WiFi/LoRa, rechargeable. High-value small assets.
- Tag S: compact, GNSS/BLE/WiFi/LoRa, rechargeable. Tools, totes, multi-site fleets.
- Tag L: ruggedised, GNSS/BLE/WiFi/LoRa, rechargeable. Heavy machinery, harsh environments.
- Tag XL: heavy-duty, ultra-long battery, GNSS/BLE/WiFi/LoRa. Remote assets, minimal maintenance.

PLATFORM (SaaS per month):
- Basic 35 CHF – 25 devices included
- Professional 105 CHF – 100 devices included
- Enterprise 520 CHF – 250 devices included
Extra devices: billed via Location Package per tracker/month.

LOCATION PACKAGES (per tracker/month):
- Light 0.10 CHF (every 6 h)
- Balanced 0.52 CHF (every 1 h)
- Performance 2.07 CHF (every 15 min)
- Max 6.20 CHF (every 5 min)

HARDWARE PRICING (CHF, one-time):
- Nomad XS: 350 / 280 (100+) / 150 (1000+)
- Tag S:     140 / 120 (100+) / 90  (1000+)
- Tag L:     160 / 140 (100+) / 110 (1000+)
- Tag XL:    150 / 130 (100+) / 100 (1000+)

CONNECTIVITY: LoRaWAN® – 170+ countries, AES-128, up to 15 km.`;

// ── Rule-based fallback (no AI needed) ────────────────────────────────────
function ruleOffer(form) {
  const qty = parseInt(form.assetCount) || 10;
  const env = (form.environment || "").toLowerCase();
  const uc  = (form.useCase     || "").toLowerCase();

  let hwKey = "tagS";
  let hwReason = "Tag S covers mixed environments with a full GNSS/BLE/WiFi/LoRa stack in a compact form.";
  if (env.includes("outdoor") || env.includes("harsh") || uc.includes("machinery") || uc.includes("heavy")) {
    hwKey = qty >= 50 ? "tagL" : "tagXL";
    hwReason = `${HW[hwKey].name} is suited for outdoor/harsh use – ruggedised build and full positioning stack.`;
  } else if (uc.includes("remote") || uc.includes("minimal maintenance")) {
    hwKey = "tagXL";
    hwReason = "Tag XL's ultra-long battery minimises maintenance visits for remote or hard-to-reach assets.";
  }

  let platKey = qty > 250 ? "enterprise" : qty > 100 ? "professional" : "basic";
  const plat  = PLATFORM[platKey];

  let locKey = "balanced";
  if (uc.includes("real-time") || uc.includes("security")) locKey = "performance";
  if (uc.includes("inventory")  || uc.includes("warehouse"))  locKey = "light";
  const loc = LOCATION[locKey];

  const unitPrice    = hwPrice(hwKey, qty);
  const hwTotal      = unitPrice * qty;
  const extraDevices = Math.max(0, qty - plat.included);
  const locMonthly   = extraDevices * loc.chf;
  const mTotal       = plat.monthly + locMonthly;

  return {
    executiveSummary: `For ${qty} assets in a ${form.environment || "mixed"} environment we recommend a ${HW[hwKey].name} fleet on the ${plat.name} SaaS tier, giving the right balance of coverage, battery life, and platform features for "${form.useCase || "your use case"}".`,
    recommendedDevices: [{ model: HW[hwKey].name, modelKey: hwKey, quantity: qty, reasoning: hwReason }],
    platformRec: { tier: platKey, reasoning: `${plat.name} (${plat.monthly} CHF/mo) includes ${plat.included} devices — ${qty <= plat.included ? "covers your full fleet." : `${extraDevices} extra devices billed at location-package rates.`}` },
    locationPkg: { key: locKey, ratePerDevice: loc.chf, reasoning: `${loc.name} (${loc.interval}) at ${loc.chf} CHF/tracker/mo suits your tracking cadence.` },
    upfront:   { hwTotal, breakdown: [{ model: HW[hwKey].name, qty, unit: unitPrice, total: hwTotal }] },
    recurring: { platform: plat.monthly, location: locMonthly, monthly: mTotal, annual: mTotal * 12 },
    nextSteps: [
      "Schedule a technical discovery call to validate requirements.",
      "Confirm LoRaWAN coverage at your sites (or plan gateway deployment).",
      "Run a pilot with 5–10 devices before full rollout.",
      "Review IT integration requirements.",
    ],
    technicalNotes: "LoRaWAN® network required (170+ countries, AES-128). Data hosted in Switzerland/EU. Recommendation generated by built-in rule engine — connect an AI endpoint for richer analysis.",
    contractNote: null,
    source: "rules",
  };
}

// ── Teams Copilot / Azure OpenAI call (optional) ──────────────────────────
async function aiOffer(form, cfg) {
  const { endpoint, apiKey, deployment } = cfg;
  if (!endpoint || !apiKey) throw new Error("AI endpoint not configured.");

  const system = `You are a senior Truvami sales engineer. Analyse the customer requirements below and respond ONLY with a valid JSON object — no markdown fences, no commentary.

${CATALOG}

JSON schema:
{
  "executiveSummary": "string",
  "recommendedDevices": [{"model":"string","modelKey":"tagS|tagL|tagXL|nomadXS","quantity":number,"reasoning":"string"}],
  "platformRec": {"tier":"basic|professional|enterprise","reasoning":"string"},
  "locationPkg": {"key":"light|balanced|performance|max","ratePerDevice":number,"reasoning":"string"},
  "upfront": {"hwTotal":number,"breakdown":[{"model":"string","qty":number,"unit":number,"total":number}]},
  "recurring": {"platform":number,"location":number,"monthly":number,"annual":number},
  "nextSteps": ["string"],
  "technicalNotes": "string",
  "contractNote": "string|null"
}`;

  const user = [
    `Customer: ${form.customerName} at ${form.companyName}`,
    `Industry: ${form.industry}`,
    `Use case: ${form.useCase}`,
    `Asset types: ${form.assetTypes}`,
    `Asset count: ${form.assetCount}`,
    `Environment: ${form.environment}`,
    `Positioning needs: ${form.positioningNeeds}`,
    `LoRaWAN coverage: ${form.hasLoraWAN}`,
    `Platform preference: ${form.platformPreference}`,
    `Integrations: ${form.integrations.join(", ")}`,
    `Contract: ${form.contractDuration} months`,
    `Context: ${form.additionalContext}`,
  ].join("\n");

  // Azure OpenAI and standard OpenAI-compatible endpoints both use the same
  // chat/completions format; Azure adds the deployment in the URL path.
  const isAzure = endpoint.includes("azure.com") || endpoint.includes("openai.azure");
  const url = isAzure
    ? `${endpoint.replace(/\/$/, "")}/openai/deployments/${deployment || "gpt-4o"}/chat/completions?api-version=2024-02-15-preview`
    : `${endpoint.replace(/\/$/, "")}/chat/completions`;

  const headers = {
    "Content-Type": "application/json",
    ...(isAzure ? { "api-key": apiKey } : { Authorization: `Bearer ${apiKey}` }),
  };

  const res = await fetch(url, {
    method: "POST", headers,
    body: JSON.stringify({
      ...(isAzure ? {} : { model: deployment || "gpt-4o" }),
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      max_tokens: 2000, temperature: 0.2,
    }),
  });

  if (!res.ok) throw new Error(`AI API ${res.status}: ${res.statusText}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
  parsed.source = "ai";
  return parsed;
}

// ── Style helpers ──────────────────────────────────────────────────────────
const INPUT = {
  width: "100%", background: "#0E110D", border: "1px solid #2C3029",
  borderRadius: 8, padding: "10px 14px", color: "#E8EDE5",
  fontFamily: "IBM Plex Sans, sans-serif", fontSize: 14, outline: "none",
};
const SELECT = { ...INPUT, cursor: "pointer", appearance: "none" };
const fmt = (n) => n == null ? "—" : `CHF ${Number(n).toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Label({ children }) {
  return <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, letterSpacing: 2, color: "#7A8278", textTransform: "uppercase", marginBottom: 6 }}>{children}</div>;
}
function Hint({ children }) {
  return <div style={{ fontSize: 12, color: "#4A4F48", fontFamily: "IBM Plex Sans, sans-serif", marginBottom: 6 }}>{children}</div>;
}
function Field({ label, hint, children }) {
  return <div style={{ marginBottom: 20 }}><Label>{label}</Label>{hint && <Hint>{hint}</Hint>}{children}</div>;
}
function Section({ children }) {
  return <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 12, color: "#A8FF3E", letterSpacing: 3, textTransform: "uppercase", marginTop: 28, marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid #1C201A" }}>{children}</div>;
}
function Card({ children, style }) {
  return <div style={{ background: "#0E110D", borderRadius: 12, padding: 20, border: "1px solid #2C3029", ...style }}>{children}</div>;
}
function CardTitle({ children }) {
  return <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 11, color: "#A8FF3E", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>{children}</div>;
}

// ── Form ───────────────────────────────────────────────────────────────────
const DEFAULT_FORM = {
  customerName: "", companyName: "", industry: "", useCase: "",
  assetTypes: "", assetCount: "", environment: "", positioningNeeds: "",
  hasLoraWAN: "", platformPreference: "", integrations: [],
  contractDuration: "12", additionalContext: "",
};

function CustomerForm({ form, setForm, onSubmit, hasAI }) {
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const toggle = (v) => setForm(f => ({
    ...f,
    integrations: f.integrations.includes(v) ? f.integrations.filter(x => x !== v) : [...f.integrations, v],
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Section>Customer Information</Section>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
        <Field label="Contact Name">
          <input style={INPUT} value={form.customerName} onChange={set("customerName")} placeholder="e.g. Anna Müller" />
        </Field>
        <Field label="Company">
          <input style={INPUT} value={form.companyName} onChange={set("companyName")} placeholder="e.g. Bau AG" />
        </Field>
      </div>
      <Field label="Industry">
        <select style={SELECT} value={form.industry} onChange={set("industry")}>
          <option value="">Select…</option>
          {["Construction","Intralogistics / Warehousing","Manufacturing","Healthcare","Security / Asset Protection","Transportation & Fleet","Oil & Gas / Mining","Other"].map(o => <option key={o}>{o}</option>)}
        </select>
      </Field>

      <Section>Assets & Use Case</Section>
      <Field label="Use Case" hint="What problem are they solving?">
        <textarea style={{ ...INPUT, minHeight: 80, resize: "vertical" }} value={form.useCase} onChange={set("useCase")} placeholder="e.g. Track construction tools across job sites, prevent loss…" />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
        <Field label="Asset Types">
          <input style={INPUT} value={form.assetTypes} onChange={set("assetTypes")} placeholder="e.g. Power tools, forklifts" />
        </Field>
        <Field label="Number of Assets">
          <input style={INPUT} type="number" min="1" value={form.assetCount} onChange={set("assetCount")} placeholder="e.g. 250" />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
        <Field label="Environment">
          <select style={SELECT} value={form.environment} onChange={set("environment")}>
            <option value="">Select…</option>
            {["Indoor only","Outdoor only","Mixed indoor & outdoor","Harsh / Industrial outdoor","Remote / Low connectivity"].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Positioning Needs">
          <select style={SELECT} value={form.positioningNeeds} onChange={set("positioningNeeds")}>
            <option value="">Select…</option>
            {["Room-level (BLE indoor)","Building-level (WiFi)","Outdoor GPS precision","Long-range wide area (LoRa)","Mixed – all of the above"].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
      </div>

      <Section>Infrastructure & Platform</Section>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
        <Field label="LoRaWAN coverage?" hint="Does the customer already have a network?">
          <select style={SELECT} value={form.hasLoraWAN} onChange={set("hasLoraWAN")}>
            <option value="">Unknown / TBD</option>
            <option value="yes">Yes – already has LoRaWAN</option>
            <option value="partial">Partial – some sites covered</option>
            <option value="no">No – needs gateways</option>
          </select>
        </Field>
        <Field label="Platform Preference">
          <select style={SELECT} value={form.platformPreference} onChange={set("platformPreference")}>
            <option value="">No preference</option>
            <option value="dashboard">Truvami Dashboard (SaaS)</option>
            <option value="integration">Integrate into existing systems</option>
            <option value="onpremise">On-Premise deployment</option>
          </select>
        </Field>
      </div>
      <Field label="Integrations Needed" hint="Select all that apply">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {["ERP","WMS","CMMS/EAM","BI / Data Lake","Kafka","REST API / Webhooks","None needed"].map(opt => {
            const on = form.integrations.includes(opt);
            return <button key={opt} onClick={() => toggle(opt)} style={{ padding: "6px 14px", borderRadius: 6, fontFamily: "IBM Plex Mono, monospace", fontSize: 12, cursor: "pointer", border: on ? "1px solid #A8FF3E" : "1px solid #2C3029", background: on ? "#0F1E06" : "#0E110D", color: on ? "#A8FF3E" : "#7A8278" }}>{opt}</button>;
          })}
        </div>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
        <Field label="Contract Duration (months)">
          <select style={SELECT} value={form.contractDuration} onChange={set("contractDuration")}>
            {["12","24","36","48","60"].map(d => <option key={d}>{d}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Additional Context" hint="Budget, timeline, special requirements">
        <textarea style={{ ...INPUT, minHeight: 80, resize: "vertical" }} value={form.additionalContext} onChange={set("additionalContext")} placeholder="e.g. Budget tight, already using SAP ERP." />
      </Field>

      <button onClick={onSubmit} style={{ marginTop: 12, background: "#A8FF3E", border: "none", borderRadius: 10, padding: "14px 32px", color: "#0A0B09", fontFamily: "IBM Plex Mono, monospace", fontSize: 14, fontWeight: 600, cursor: "pointer", letterSpacing: 1, alignSelf: "flex-start" }}>
        Generate Offer →
      </button>
      {!hasAI && (
        <div style={{ marginTop: 10, fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#7A8278" }}>
          ⚙ Rule engine active — connect an AI endpoint for richer analysis
        </div>
      )}
    </div>
  );
}

// ── Offer result ───────────────────────────────────────────────────────────
function OfferResult({ result, onReset }) {
  if (!result) return null;
  const plat = PLATFORM[result.platformRec?.tier];
  const loc  = LOCATION[result.locationPkg?.key];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {result.source === "rules" && (
        <div style={{ padding: "10px 16px", background: "#1A1500", border: "1px solid #FFB02040", borderRadius: 8, fontFamily: "IBM Plex Mono, monospace", fontSize: 12, color: "#FFB020" }}>
          ⚙ Generated by built-in rule engine — connect an AI endpoint for AI-powered analysis
        </div>
      )}

      {/* Summary */}
      <Card>
        <CardTitle>Executive Summary</CardTitle>
        <p style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: 15, color: "#C8CEC5", lineHeight: 1.7, margin: 0 }}>{result.executiveSummary}</p>
      </Card>

      {/* Hardware */}
      <Card>
        <CardTitle>Recommended Hardware</CardTitle>
        {result.recommendedDevices?.map((d, i) => (
          <div key={i} style={{ padding: 14, background: "#0A0B09", borderRadius: 8, border: "1px solid #2C3029", marginBottom: i < result.recommendedDevices.length - 1 ? 12 : 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 16, color: "#E8EDE5" }}>{d.model}</span>
                <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, color: "#7A8278", marginLeft: 12 }}>× {d.quantity} units</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: "#A8FF3E" }}>{fmt(hwPrice(d.modelKey, d.quantity))} /unit</div>
                <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#4A4F48" }}>{fmt(hwPrice(d.modelKey, d.quantity) * d.quantity)} total</div>
              </div>
            </div>
            <p style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: 13, color: "#7A8278", margin: 0, lineHeight: 1.6 }}>{d.reasoning}</p>
          </div>
        ))}
      </Card>

      {/* Platform */}
      {result.platformRec && plat && (
        <Card>
          <CardTitle>Platform</CardTitle>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div>
              <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 16, color: "#E8EDE5" }}>{plat.name} Plan</span>
              <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, color: "#7A8278", marginLeft: 12 }}>incl. {plat.included} devices</span>
            </div>
            <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 14, color: "#A8FF3E" }}>{fmt(plat.monthly)}/month</span>
          </div>
          <p style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: 13, color: "#7A8278", margin: 0, lineHeight: 1.6 }}>{result.platformRec.reasoning}</p>
        </Card>
      )}

      {/* Location package */}
      {result.locationPkg && loc && (
        <Card>
          <CardTitle>Location Package (per tracker)</CardTitle>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div>
              <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 16, color: "#E8EDE5" }}>{loc.name}</span>
              <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, color: "#7A8278", marginLeft: 12 }}>{loc.interval}</span>
            </div>
            <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 14, color: "#A8FF3E" }}>{fmt(loc.chf)}/tracker/month</span>
          </div>
          <p style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: 13, color: "#7A8278", margin: 0, lineHeight: 1.6 }}>{result.locationPkg.reasoning}</p>
        </Card>
      )}

      {/* Pricing summary */}
      <Card style={{ border: "1px solid #A8FF3E30" }}>
        <CardTitle>Pricing Summary</CardTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Upfront */}
          <div style={{ background: "#0A0B09", borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#7A8278", letterSpacing: 1, marginBottom: 10 }}>ONE-TIME</div>
            {result.upfront?.breakdown?.map((b, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontFamily: "IBM Plex Sans, sans-serif", fontSize: 13, color: "#9AA098", marginBottom: 6 }}>
                <span>{b.model} × {b.qty}</span><span>{fmt(b.total)}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #2C3029", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: "#E8EDE5", fontWeight: 600 }}>Hardware Total</span>
              <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 15, color: "#A8FF3E", fontWeight: 600 }}>{fmt(result.upfront?.hwTotal)}</span>
            </div>
          </div>
          {/* Recurring */}
          <div style={{ background: "#0A0B09", borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#7A8278", letterSpacing: 1, marginBottom: 10 }}>MONTHLY RECURRING</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "IBM Plex Sans, sans-serif", fontSize: 13, color: "#9AA098", marginBottom: 6 }}>
              <span>Platform</span><span>{fmt(result.recurring?.platform)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "IBM Plex Sans, sans-serif", fontSize: 13, color: "#9AA098", marginBottom: 6 }}>
              <span>Location packages</span><span>{fmt(result.recurring?.location)}</span>
            </div>
            <div style={{ borderTop: "1px solid #2C3029", marginTop: 8, paddingTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: "#E8EDE5", fontWeight: 600 }}>Monthly Total</span>
                <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 15, color: "#A8FF3E", fontWeight: 600 }}>{fmt(result.recurring?.monthly)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#4A4F48" }}>Annual</span>
                <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, color: "#7A8278" }}>{fmt(result.recurring?.annual)}</span>
              </div>
            </div>
          </div>
        </div>
        {result.contractNote && (
          <div style={{ marginTop: 12, padding: 10, background: "#0A0B09", borderRadius: 8, fontFamily: "IBM Plex Sans, sans-serif", fontSize: 12, color: "#7A8278", borderLeft: "2px solid #2C3029" }}>{result.contractNote}</div>
        )}
      </Card>

      {/* Next steps + tech notes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {result.nextSteps?.length > 0 && (
          <Card>
            <CardTitle>Next Steps</CardTitle>
            <ol style={{ paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {result.nextSteps.map((s, i) => (
                <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#A8FF3E", minWidth: 20, marginTop: 1 }}>{String(i + 1).padStart(2, "0")}</span>
                  <span style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: 13, color: "#9AA098", lineHeight: 1.5 }}>{s}</span>
                </li>
              ))}
            </ol>
          </Card>
        )}
        {result.technicalNotes && (
          <Card>
            <CardTitle>Technical Notes</CardTitle>
            <div style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: 13, color: "#7A8278", lineHeight: 1.7 }}>{result.technicalNotes}</div>
          </Card>
        )}
      </div>

      <button onClick={onReset} style={{ background: "transparent", border: "1px solid #2C3029", borderRadius: 8, padding: "12px 24px", color: "#7A8278", fontFamily: "IBM Plex Mono, monospace", fontSize: 13, cursor: "pointer", letterSpacing: 1 }}>
        ← New Offer
      </button>
    </div>
  );
}

// ── Pricing reference modal ────────────────────────────────────────────────
function PricingModal({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000090", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#0E110D", borderRadius: 16, padding: 32, width: 680, border: "1px solid #2C3029", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 18, color: "#E8EDE5" }}>Pricing Reference</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#7A8278", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#A8FF3E", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Hardware (CHF, one-time)</div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24, fontFamily: "IBM Plex Sans, sans-serif", fontSize: 13 }}>
          <thead><tr style={{ borderBottom: "1px solid #2C3029" }}>
            {["Product","1 device","100+","1\'000+"].map(h => <th key={h} style={{ padding: "6px 12px", textAlign: h === "Product" ? "left" : "right", color: "#7A8278", fontWeight: 600 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {Object.values(HW).map(p => (
              <tr key={p.name} style={{ borderBottom: "1px solid #1C201A" }}>
                <td style={{ padding: "8px 12px", color: "#E8EDE5" }}>{p.name}</td>
                <td style={{ padding: "8px 12px", color: "#9AA098", textAlign: "right" }}>{p.single}</td>
                <td style={{ padding: "8px 12px", color: "#9AA098", textAlign: "right" }}>{p.vol100}</td>
                <td style={{ padding: "8px 12px", color: "#9AA098", textAlign: "right" }}>{p.vol1000}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#A8FF3E", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>SaaS Platform (CHF/month)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
          {Object.values(PLATFORM).map(t => (
            <div key={t.name} style={{ background: "#0A0B09", borderRadius: 8, padding: 14, border: "1px solid #2C3029" }}>
              <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 14, color: "#E8EDE5", marginBottom: 4 }}>{t.name}</div>
              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 18, color: "#A8FF3E", marginBottom: 4 }}>CHF {t.monthly}</div>
              <div style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: 12, color: "#7A8278" }}>{t.included} devices incl.</div>
            </div>
          ))}
        </div>

        <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#A8FF3E", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Location Packages (CHF/tracker/month)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {Object.values(LOCATION).map(p => (
            <div key={p.name} style={{ background: "#0A0B09", borderRadius: 8, padding: 14, border: "1px solid #2C3029", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 14, color: "#E8EDE5" }}>{p.name}</div>
                <div style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: 12, color: "#7A8278" }}>{p.interval}</div>
              </div>
              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 16, color: "#A8FF3E" }}>CHF {p.chf}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── AI Config modal ────────────────────────────────────────────────────────
function AIConfigModal({ cfg, setCfg, onClose }) {
  const [local, setLocal] = useState(cfg);
  const set = (k) => (e) => setLocal(c => ({ ...c, [k]: e.target.value }));
  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000090", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#0E110D", borderRadius: 16, padding: 32, width: 520, border: "1px solid #2C3029" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 18, color: "#E8EDE5" }}>AI Endpoint (optional)</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#7A8278", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: 13, color: "#7A8278", marginBottom: 20, lineHeight: 1.6, padding: "10px 14px", background: "#0A0B09", borderRadius: 8, border: "1px solid #1C201A" }}>
          Connect a <strong style={{ color: "#E8EDE5" }}>Teams Copilot (Azure OpenAI)</strong> or any OpenAI-compatible endpoint.<br />
          Leave empty to use the built-in rule engine instead.
        </div>
        <Field label="Endpoint URL" hint="Azure: https://YOUR-RESOURCE.openai.azure.com  |  OpenAI: https://api.openai.com/v1">
          <input style={INPUT} value={local.endpoint} onChange={set("endpoint")} placeholder="https://your-resource.openai.azure.com" />
        </Field>
        <Field label="API Key / Bearer Token">
          <input style={{ ...INPUT, fontFamily: "IBM Plex Mono, monospace", letterSpacing: 1 }} type="password" value={local.apiKey} onChange={set("apiKey")} placeholder="sk-… or Azure API key" />
        </Field>
        <Field label="Deployment / Model" hint="Azure deployment name (e.g. gpt-4o) or OpenAI model name">
          <input style={INPUT} value={local.deployment} onChange={set("deployment")} placeholder="gpt-4o" />
        </Field>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button onClick={() => { setCfg(local); onClose(); }} style={{ background: "#A8FF3E", border: "none", borderRadius: 8, padding: "10px 24px", color: "#0A0B09", fontFamily: "IBM Plex Mono, monospace", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Save</button>
          <button onClick={() => { setCfg({ endpoint: "", apiKey: "", deployment: "gpt-4o" }); onClose(); }} style={{ background: "transparent", border: "1px solid #2C3029", borderRadius: 8, padding: "10px 24px", color: "#7A8278", fontFamily: "IBM Plex Mono, monospace", fontSize: 13, cursor: "pointer" }}>Clear (use rules)</button>
        </div>
      </div>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────
export default function TruvamiSalesTool() {
  const [view,         setView]         = useState("form");
  const [showPricing,  setShowPricing]  = useState(false);
  const [showAICfg,    setShowAICfg]    = useState(false);
  const [aiCfg,        setAiCfg]        = useState({ endpoint: "", apiKey: "", deployment: "gpt-4o" });
  const [form,         setForm]         = useState(DEFAULT_FORM);
  const [result,       setResult]       = useState(null);
  const [error,        setError]        = useState(null);

  const hasAI = !!(aiCfg.endpoint && aiCfg.apiKey);

  const handleSubmit = async () => {
    setView("loading"); setError(null);
    try {
      let r;
      if (hasAI) {
        try { r = await aiOffer(form, aiCfg); }
        catch (e) {
          console.warn("AI call failed, falling back to rule engine:", e);
          r = ruleOffer(form);
          r.technicalNotes = (r.technicalNotes || "") + ` [AI error: ${e.message} — used rule engine as fallback]`;
        }
      } else {
        r = ruleOffer(form);
      }
      setResult(r); setView("result");
    } catch (e) {
      setError("Failed to generate offer: " + e.message); setView("form");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { background: #0A0B09; margin: 0; }
        input:focus, textarea:focus, select:focus { border-color: #A8FF3E !important; outline: none; }
        input::placeholder, textarea::placeholder { color: #4A4F48; }
        select option { background: #131510; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0A0B09; }
        ::-webkit-scrollbar-thumb { background: #2C3029; border-radius: 3px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#0A0B09", color: "#E8EDE5" }}>
        {/* Nav */}
        <div style={{ borderBottom: "1px solid #1C201A", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#0A0B09", zIndex: 100 }}>
          <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 18, color: "#E8EDE5", letterSpacing: -0.5 }}>
            truvami
            <span style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 400, fontSize: 11, color: "#7A8278", marginLeft: 10, letterSpacing: 2, textTransform: "uppercase" }}>Sales Tool</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={() => setShowPricing(true)} style={{ background: "#0E110D", border: "1px solid #2C3029", borderRadius: 8, padding: "7px 14px", color: "#7A8278", fontFamily: "IBM Plex Mono, monospace", fontSize: 12, cursor: "pointer" }}>
              Pricing Ref
            </button>
            <button onClick={() => setShowAICfg(true)} style={{ background: "#1C201A", border: `1px solid ${hasAI ? "#A8FF3E40" : "#2C3029"}`, borderRadius: 8, padding: "7px 14px", color: hasAI ? "#A8FF3E" : "#7A8278", fontFamily: "IBM Plex Mono, monospace", fontSize: 12, cursor: "pointer" }}>
              {hasAI ? "✓ AI Connected" : "⚙ Connect AI"}
            </button>
          </div>
        </div>

        {/* Main */}
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px 64px" }}>
          {view === "form" && (
            <>
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 32, color: "#E8EDE5", lineHeight: 1.2 }}>Generate Solution Offer</div>
                <div style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: 15, color: "#7A8278", marginTop: 8 }}>
                  Fill in the customer's requirements — {hasAI ? "AI will generate the recommendation." : "the rule engine will generate the recommendation."}
                </div>
                {error && <div style={{ marginTop: 16, padding: 14, background: "#2E0A0A", border: "1px solid #FF4A4A40", borderRadius: 8, fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: "#FF6B6B" }}>✕ {error}</div>}
              </div>
              <CustomerForm form={form} setForm={setForm} onSubmit={handleSubmit} hasAI={hasAI} />
            </>
          )}

          {view === "loading" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 20 }}>
              <div style={{ width: 48, height: 48, border: "2px solid #2C3029", borderTop: "2px solid #A8FF3E", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: "#7A8278", letterSpacing: 2 }}>
                {hasAI ? "ANALYSING WITH AI…" : "GENERATING OFFER…"}
              </div>
            </div>
          )}

          {view === "result" && (
            <>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 32, color: "#E8EDE5", lineHeight: 1.2 }}>Solution Offer</div>
                <div style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: 15, color: "#7A8278", marginTop: 8 }}>
                  {form.companyName ? `For ${form.companyName}${form.customerName ? ` — ${form.customerName}` : ""}` : "AI-generated recommendation."}
                </div>
              </div>
              <OfferResult result={result} onReset={() => { setView("form"); setResult(null); }} />
            </>
          )}
        </div>
      </div>

      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
      {showAICfg   && <AIConfigModal cfg={aiCfg} setCfg={setAiCfg} onClose={() => setShowAICfg(false)} />}
    </>
  );
}
