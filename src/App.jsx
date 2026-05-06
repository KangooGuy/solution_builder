import { useState } from "react";

// ── Product knowledge embedded in the system prompt ────────────────────────
const PRODUCT_CATALOG = `
TRUVAMI PRODUCT CATALOG
=======================

HARDWARE DEVICES:

1. Smart Label (Beta Series)
   - Form factor: Flat, ultra-thin label — discreet placement on any surface
   - Battery: Battery-free (organic/energy harvesting — no charging needed)
   - Positioning: BLE, LoRa
   - Best for: Small assets, inventory, high-volume rollouts
   - Key advantages: Minimal form factor, simple mass deployment, cost-effective at scale
   - Use cases: Manufacturing parts, healthcare items, retail inventory, documents, tools/bins
   - Environment: Indoor-optimized
   - NOT ideal for: Outdoor-only use, precise GPS tracking, harsh environments

2. Tag S (Safety Tracker)
   - Form factor: Compact, easy to attach/remove
   - Battery: Rechargeable
   - Positioning: GNSS, BLE, WiFi, LoRa (full stack)
   - Best for: Tools, cases, totes, frequently moved/high-churn equipment
   - Key advantages: Balance of size and full-stack positioning, easy redeploy, great for multi-site
   - Use cases: Construction tools, intralogistics totes, shared equipment fleets
   - Environment: Indoor & outdoor

3. Tag L (Ruggedized)
   - Form factor: Medium-large, ruggedized build, quick-mount
   - Battery: Rechargeable
   - Positioning: GNSS, BLE, WiFi, LoRa (full stack)
   - Best for: Larger assets, harsh environments, lower-maintenance deployments
   - Key advantages: More endurance, wider area coverage, reliable in tough conditions, less frequent recharging
   - Use cases: Heavy machinery, outdoor equipment, containers, cross-site assets, construction
   - Environment: Outdoor, harsh indoor, demanding sites

4. Tag XL (Long Battery Life)
   - Form factor: Largest, heavy-duty
   - Battery: Ultra-long life (organic power — minimal maintenance)
   - Positioning: GNSS, BLE, WiFi, LoRa (full stack)
   - Best for: Machinery, remote assets, critical high-value equipment
   - Key advantages: Maximum battery life, minimum service intervals, maximum durability
   - Use cases: Heavy machinery, remote site assets, high-value equipment, demanding environments
   - Environment: Outdoor, remote, demanding — anywhere service access is difficult

POSITIONING TECHNOLOGIES:
- GNSS: Excellent outdoor accuracy, global coverage (GPS/GLONASS/Galileo/BeiDou)
- BLE: Room-level accuracy, ideal for indoor proximity detection, minimal power
- WiFi: Building-level accuracy, indoor/urban positioning via AP triangulation
- LoRa: Long-range, medium accuracy — up to 15km, ideal for wide area / remote

CONNECTIVITY:
- All devices use LoRaWAN® (170+ countries, AES-128 encryption, up to 15km range)
- Ultra-low power — battery life ranges from months (rechargeable) to years (organic)
- Customer must have LoRaWAN network coverage or deploy Truvami-compatible gateways

PLATFORM OPTIONS:
1. Truvami Dashboard (SaaS)
   - Full hosted platform: live tracking map, historical data, geofences, alerts, grouping
   - Webhooks, REST API, and data export built in
   - Best for: Teams wanting a ready-to-use interface with no integration effort
   - Swiss data hosting, TLS, Zero Trust, 30-day backups

2. Data Forwarding
   - Push tracker data into the customer's existing systems
   - Supports REST API, webhooks, Kafka streaming
   - Integrates with: ERP, WMS, CMMS/EAM, BI Tools, Data Lakes
   - Best for: Companies with existing software infrastructure to integrate into

3. On-Premise
   - Full Truvami stack deployed on customer's own infrastructure
   - Maximum data sovereignty and control
   - Best for: Enterprises with strict data residency or security requirements

SECURITY: TLS in transit, AES-128 on LoRaWAN, Zero Trust architecture, Swiss data hosting, 30-day backup retention, On-Prem available.

TYPICAL USE CASE VERTICALS:
- Construction: Tag L/XL on large equipment + Tag S on tools, Dashboard, outdoor GNSS priority
- Intralogistics: Tag S or Smart Label on totes/bins/carts, Dashboard or ERP integration, indoor BLE/WiFi priority
- Security: Tag XL or Tag L on high-value assets, Dashboard with geofence alerts
- Manufacturing: Smart Label or Tag S on parts/tools, WMS/ERP integration via Data Forwarding
- Healthcare: Smart Label on equipment/supplies, indoor BLE, Dashboard or CMMS integration
`;

const DEFAULT_PRICING = {
  smartLabel:  { unitPrice: 0, monthlyPerDevice: 0 },
  tagS:        { unitPrice: 0, monthlyPerDevice: 0 },
  tagL:        { unitPrice: 0, monthlyPerDevice: 0 },
  tagXL:       { unitPrice: 0, monthlyPerDevice: 0 },
  platform: {
    dashboard:      { monthlyBase: 0, monthlyPerDevice: 0 },
    dataForwarding: { monthlyBase: 0, monthlyPerDevice: 0 },
    onPremise:      { setupFee: 0, monthlyBase: 0 },
  },
  onboardingFeeBase: 0,
  lorawanGateway: 0,
  currency: "CHF",
};

const DEFAULT_FORM = {
  customerName: "", companyName: "", industry: "", useCase: "",
  assetTypes: "", assetCount: "", environment: "", positioningNeeds: "",
  hasLoraWAN: "", platformPreference: "", integrations: [],
  contractDuration: "12", additionalContext: "",
};

// ── Prompt builder ─────────────────────────────────────────────────────────
function buildSystemPrompt(p) {
  const c = p.currency;
  const priceOrTbd = (v) => v > 0 ? `${v} ${c}` : "TBD (not configured)";
  return `You are a senior technical sales engineer at Truvami, a Swiss IoT asset tracking company. Your task is to analyze a customer's requirements and produce a precise technical solution recommendation with a detailed pricing offer.

${PRODUCT_CATALOG}

CURRENT PRICING CONFIGURATION (${c}):
Hardware unit prices (one-time, per device):
  Smart Label: ${priceOrTbd(p.smartLabel.unitPrice)}
  Tag S:       ${priceOrTbd(p.tagS.unitPrice)}
  Tag L:       ${priceOrTbd(p.tagL.unitPrice)}
  Tag XL:      ${priceOrTbd(p.tagXL.unitPrice)}

Monthly recurring per device (connectivity + data processing):
  Smart Label: ${priceOrTbd(p.smartLabel.monthlyPerDevice)}/device/month
  Tag S:       ${priceOrTbd(p.tagS.monthlyPerDevice)}/device/month
  Tag L:       ${priceOrTbd(p.tagL.monthlyPerDevice)}/device/month
  Tag XL:      ${priceOrTbd(p.tagXL.monthlyPerDevice)}/device/month

Platform fees (monthly):
  Dashboard:       ${priceOrTbd(p.platform.dashboard.monthlyBase)}/month base + ${priceOrTbd(p.platform.dashboard.monthlyPerDevice)}/device/month
  Data Forwarding: ${priceOrTbd(p.platform.dataForwarding.monthlyBase)}/month base + ${priceOrTbd(p.platform.dataForwarding.monthlyPerDevice)}/device/month
  On-Premise:      ${priceOrTbd(p.platform.onPremise.setupFee)} one-time setup + ${priceOrTbd(p.platform.onPremise.monthlyBase)}/month

One-time fees:
  Onboarding & deployment support: ${priceOrTbd(p.onboardingFeeBase)} (base, may scale with volume)
  LoRaWAN gateway (if needed): ${priceOrTbd(p.lorawanGateway)} per gateway

RULES:
- Recommend the most technically appropriate solution — not the most expensive
- If a mixed device fleet makes sense (e.g. Tag S for tools + Tag L for equipment), recommend it
- If any price is 0/TBD, still compute the structure and note "TBD" for those line items
- Compute all totals based on the configured prices
- For onboarding, scale the base fee by volume: base for <50 assets, base×1.5 for 50-200, base×2 for 200+
- Be specific in reasoning — reference the customer's actual asset types and environment

Respond ONLY with a valid JSON object. No markdown fences, no preamble, no explanation outside JSON.

JSON schema:
{
  "executiveSummary": "string — 2-3 sentence pitch tailored to this customer",
  "recommendedDevices": [
    {"model": "Tag L", "modelKey": "tagL", "quantity": 50, "reasoning": "string"}
  ],
  "platformTier": "dashboard|dataForwarding|onPremise",
  "platformTierLabel": "string",
  "platformReasoning": "string",
  "positioningTech": ["GNSS", "BLE"],
  "needsLorawanInfrastructure": false,
  "gatewaysRequired": 0,
  "connectivityNote": "string",
  "upfront": {
    "lineItems": [{"label": "string", "amount": 0, "isTbd": false}],
    "total": 0,
    "hasTbd": false
  },
  "recurring": {
    "lineItems": [{"label": "string", "amount": 0, "isTbd": false}],
    "total": 0,
    "annualTotal": 0,
    "hasTbd": false
  },
  "contractNote": "string",
  "nextSteps": ["string", "string", "string"],
  "technicalNotes": "string"
}`;
}

// ── API call ───────────────────────────────────────────────────────────────
async function callClaude(form, pricing) {
  const integStr = form.integrations.length ? form.integrations.join(", ") : "None specified";
  const userMessage = `CUSTOMER REQUIREMENTS:
Contact: ${form.customerName || "Not specified"} | Company: ${form.companyName || "Not specified"}
Industry: ${form.industry || "Not specified"}
Use Case: ${form.useCase || "Not specified"}
Asset Types to Track: ${form.assetTypes || "Not specified"}
Number of Assets: ${form.assetCount || "Not specified"}
Operating Environment: ${form.environment || "Not specified"}
Positioning Accuracy Needs: ${form.positioningNeeds || "Not specified"}
Existing LoRaWAN Coverage: ${form.hasLoraWAN || "Unknown"}
Platform Preference: ${form.platformPreference || "No preference"}
System Integration Requirements: ${integStr}
Contract Duration: ${form.contractDuration} months
Additional Context: ${form.additionalContext || "None"}

Generate the solution recommendation and pricing offer as JSON.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: buildSystemPrompt(pricing),
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  const data = await res.json();
  const text = data.content?.find(b => b.type === "text")?.text || "{}";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n, currency = "CHF") =>
  n > 0
    ? new Intl.NumberFormat("de-CH", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
    : "—";

const DEVICE_COLORS = {
  smartLabel: { bg: "#E8F5E9", accent: "#2E7D32", label: "Smart Label" },
  tagS:       { bg: "#E3F2FD", accent: "#1565C0", label: "Tag S" },
  tagL:       { bg: "#FFF3E0", accent: "#E65100", label: "Tag L" },
  tagXL:      { bg: "#F3E5F5", accent: "#6A1B9A", label: "Tag XL" },
};

// ── Sub-components ─────────────────────────────────────────────────────────

function ConfigPanel({ pricing, setPricing, onClose }) {
  const [local, setLocal] = useState(pricing);
  const set = (path, val) => {
    const parts = path.split(".");
    setLocal(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
      cur[parts[parts.length - 1]] = val === "" ? 0 : Number(val);
      return next;
    });
  };

  const Field = ({ label, path, hint }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontFamily: "IBM Plex Mono, monospace", color: "#7A8278", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      {hint && <div style={{ fontSize: 11, color: "#9AA098", marginBottom: 4 }}>{hint}</div>}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="number" min="0" step="1"
          value={local[path.split(".")[0]][path.split(".")[1]] !== undefined ? local[path.split(".")[0]][path.split(".")[1]] : (() => { let c = local; path.split(".").forEach(k => c = c[k]); return c; })()}
          onChange={e => set(path, e.target.value)}
          style={{ width: "100%", background: "#1C201A", border: "1px solid #2C3029", borderRadius: 6, padding: "8px 12px", color: "#E8EDE5", fontFamily: "IBM Plex Mono, monospace", fontSize: 14 }}
        />
        <span style={{ color: "#7A8278", fontSize: 12, whiteSpace: "nowrap", fontFamily: "IBM Plex Mono, monospace" }}>{local.currency}</span>
      </div>
    </div>
  );

  // Simpler approach to nested state
  const setNested = (obj, path, value) => {
    const parts = path.split(".");
    const next = JSON.parse(JSON.stringify(obj));
    let cur = next;
    for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
    cur[parts[parts.length - 1]] = value === "" ? 0 : Number(value);
    return next;
  };

  const InputField = ({ label, value, onChange, hint }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, fontFamily: "IBM Plex Mono, monospace", color: "#7A8278", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</label>
      {hint && <div style={{ fontSize: 11, color: "#9AA098", marginBottom: 4 }}>{hint}</div>}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="number" min="0" step="1" value={value}
          onChange={e => onChange(e.target.value)}
          style={{ flex: 1, background: "#1C201A", border: "1px solid #2C3029", borderRadius: 6, padding: "8px 12px", color: "#E8EDE5", fontFamily: "IBM Plex Mono, monospace", fontSize: 14, outline: "none" }}
        />
        <span style={{ color: "#7A8278", fontSize: 12, fontFamily: "IBM Plex Mono, monospace" }}>{local.currency}</span>
      </div>
    </div>
  );

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontFamily: "IBM Plex Mono, monospace", color: "#A8FF3E", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #2C3029" }}>{title}</div>
      {children}
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", justifyContent: "flex-end" }}>
      <div style={{ width: 420, background: "#131510", height: "100%", overflowY: "auto", padding: 32, borderLeft: "1px solid #2C3029" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 700, color: "#E8EDE5" }}>Pricing Configuration</div>
            <div style={{ fontSize: 12, color: "#7A8278", marginTop: 4 }}>Internal use only — set your actual prices</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#7A8278", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, fontFamily: "IBM Plex Mono, monospace", color: "#7A8278", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>Currency</label>
          <select value={local.currency} onChange={e => setLocal(p => ({ ...p, currency: e.target.value }))}
            style={{ width: "100%", background: "#1C201A", border: "1px solid #2C3029", borderRadius: 6, padding: "8px 12px", color: "#E8EDE5", fontFamily: "IBM Plex Mono, monospace", fontSize: 14 }}>
            <option value="CHF">CHF</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>

        {[
          { key: "smartLabel", label: "Smart Label" },
          { key: "tagS", label: "Tag S" },
          { key: "tagL", label: "Tag L" },
          { key: "tagXL", label: "Tag XL" },
        ].map(({ key, label }) => (
          <Section key={key} title={label}>
            <InputField label="Unit Price (one-time)" value={local[key].unitPrice} onChange={v => setLocal(p => setNested(p, `${key}.unitPrice`, v))} />
            <InputField label="Monthly / Device" hint="connectivity + data processing" value={local[key].monthlyPerDevice} onChange={v => setLocal(p => setNested(p, `${key}.monthlyPerDevice`, v))} />
          </Section>
        ))}

        <Section title="Platform — Dashboard (SaaS)">
          <InputField label="Monthly Base Fee" value={local.platform.dashboard.monthlyBase} onChange={v => setLocal(p => setNested(p, "platform.dashboard.monthlyBase", v))} />
          <InputField label="Per Device / Month" value={local.platform.dashboard.monthlyPerDevice} onChange={v => setLocal(p => setNested(p, "platform.dashboard.monthlyPerDevice", v))} />
        </Section>

        <Section title="Platform — Data Forwarding">
          <InputField label="Monthly Base Fee" value={local.platform.dataForwarding.monthlyBase} onChange={v => setLocal(p => setNested(p, "platform.dataForwarding.monthlyBase", v))} />
          <InputField label="Per Device / Month" value={local.platform.dataForwarding.monthlyPerDevice} onChange={v => setLocal(p => setNested(p, "platform.dataForwarding.monthlyPerDevice", v))} />
        </Section>

        <Section title="Platform — On-Premise">
          <InputField label="Setup Fee (one-time)" value={local.platform.onPremise.setupFee} onChange={v => setLocal(p => setNested(p, "platform.onPremise.setupFee", v))} />
          <InputField label="Monthly Base Fee" value={local.platform.onPremise.monthlyBase} onChange={v => setLocal(p => setNested(p, "platform.onPremise.monthlyBase", v))} />
        </Section>

        <Section title="Additional Fees">
          <InputField label="Onboarding Base Fee" hint="scales automatically with volume" value={local.onboardingFeeBase} onChange={v => setLocal(p => ({ ...p, onboardingFeeBase: v === "" ? 0 : Number(v) }))} />
          <InputField label="LoRaWAN Gateway (per unit)" hint="if customer needs infrastructure" value={local.lorawanGateway} onChange={v => setLocal(p => ({ ...p, lorawanGateway: v === "" ? 0 : Number(v) }))} />
        </Section>

        <button
          onClick={() => { setPricing(local); onClose(); }}
          style={{ width: "100%", background: "#A8FF3E", color: "#0A0B09", border: "none", borderRadius: 8, padding: "14px 24px", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer", letterSpacing: 0.5 }}>
          Save Configuration
        </button>
      </div>
    </div>
  );
}

function CustomerForm({ form, setForm, onSubmit, loading }) {
  const isPricingConfigured = true; // always allow generating

  const updateField = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const toggleIntegration = (val) => setForm(p => ({
    ...p,
    integrations: p.integrations.includes(val)
      ? p.integrations.filter(i => i !== val)
      : [...p.integrations, val],
  }));

  const Label = ({ children }) => (
    <label style={{ fontSize: 11, fontFamily: "IBM Plex Mono, monospace", color: "#7A8278", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>{children}</label>
  );

  const inputStyle = {
    width: "100%", background: "#131510", border: "1px solid #2C3029", borderRadius: 8,
    padding: "10px 14px", color: "#E8EDE5", fontFamily: "IBM Plex Sans, sans-serif",
    fontSize: 14, outline: "none", transition: "border-color 0.2s",
  };

  const selectStyle = { ...inputStyle };

  const Chip = ({ label, value, selected, onClick }) => (
    <button onClick={onClick} style={{
      padding: "6px 14px", borderRadius: 20, border: `1px solid ${selected ? "#A8FF3E" : "#2C3029"}`,
      background: selected ? "#A8FF3E18" : "transparent", color: selected ? "#A8FF3E" : "#7A8278",
      fontSize: 12, fontFamily: "IBM Plex Mono, monospace", cursor: "pointer", transition: "all 0.15s",
    }}>{label}</button>
  );

  const environments = ["Indoor", "Outdoor", "Mixed (indoor + outdoor)"];
  const positioning = ["Room-level (indoor precise)", "Building-level (indoor general)", "Outdoor precise (GPS)", "Long-range outdoor / remote"];
  const integrations = ["ERP", "WMS", "CMMS / EAM", "BI Tools / Data Lake", "Custom API", "None needed"];
  const platforms = ["Truvami Dashboard (hosted)", "Data Forwarding / API integration", "On-Premise", "Not sure yet"];
  const lorawan = ["Yes, already deployed", "No, we'd need it", "Partially covered", "Unknown"];
  const industries = ["Construction", "Intralogistics / Warehousing", "Manufacturing", "Healthcare", "Security", "Retail", "Agriculture", "Other"];

  const Row = ({ children }) => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>{children}</div>
  );

  const Field = ({ label, children, span }) => (
    <div style={span ? {} : {}}>
      <Label>{label}</Label>
      {children}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Customer Info */}
      <div style={{ background: "#0E110D", borderRadius: 12, padding: 24, border: "1px solid #2C3029" }}>
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 14, color: "#A8FF3E", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>01 — Customer</div>
        <Row>
          <Field label="Contact Name">
            <input style={inputStyle} value={form.customerName} onChange={e => updateField("customerName", e.target.value)} placeholder="Jane Smith" />
          </Field>
          <Field label="Company">
            <input style={inputStyle} value={form.companyName} onChange={e => updateField("companyName", e.target.value)} placeholder="Acme AG" />
          </Field>
        </Row>
        <div style={{ marginTop: 16 }}>
          <Label>Industry</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {industries.map(i => (
              <Chip key={i} label={i} selected={form.industry === i} onClick={() => updateField("industry", form.industry === i ? "" : i)} />
            ))}
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div style={{ background: "#0E110D", borderRadius: 12, padding: 24, border: "1px solid #2C3029" }}>
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 14, color: "#A8FF3E", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>02 — Asset Requirements</div>
        <div style={{ marginBottom: 16 }}>
          <Label>Use Case Description</Label>
          <input style={inputStyle} value={form.useCase} onChange={e => updateField("useCase", e.target.value)} placeholder="e.g. Track shared tools across 3 construction sites to reduce losses" />
        </div>
        <Row>
          <Field label="Asset Types">
            <input style={inputStyle} value={form.assetTypes} onChange={e => updateField("assetTypes", e.target.value)} placeholder="e.g. power tools, scaffolding, vehicles" />
          </Field>
          <Field label="Number of Assets">
            <input style={inputStyle} type="number" min="1" value={form.assetCount} onChange={e => updateField("assetCount", e.target.value)} placeholder="e.g. 200" />
          </Field>
        </Row>
        <div style={{ marginTop: 16 }}>
          <Label>Operating Environment</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {environments.map(e => (
              <Chip key={e} label={e} selected={form.environment === e} onClick={() => updateField("environment", form.environment === e ? "" : e)} />
            ))}
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <Label>Positioning Accuracy Needs</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {positioning.map(p => (
              <Chip key={p} label={p} selected={form.positioningNeeds === p} onClick={() => updateField("positioningNeeds", form.positioningNeeds === p ? "" : p)} />
            ))}
          </div>
        </div>
      </div>

      {/* Technical */}
      <div style={{ background: "#0E110D", borderRadius: 12, padding: 24, border: "1px solid #2C3029" }}>
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 14, color: "#A8FF3E", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>03 — Technical Context</div>
        <div style={{ marginBottom: 16 }}>
          <Label>Existing LoRaWAN Network?</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {lorawan.map(l => (
              <Chip key={l} label={l} selected={form.hasLoraWAN === l} onClick={() => updateField("hasLoraWAN", form.hasLoraWAN === l ? "" : l)} />
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Label>Platform Preference</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {platforms.map(p => (
              <Chip key={p} label={p} selected={form.platformPreference === p} onClick={() => updateField("platformPreference", form.platformPreference === p ? "" : p)} />
            ))}
          </div>
        </div>
        <div>
          <Label>Integration Requirements (select all that apply)</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {integrations.map(i => (
              <Chip key={i} label={i} selected={form.integrations.includes(i)} onClick={() => toggleIntegration(i)} />
            ))}
          </div>
        </div>
      </div>

      {/* Deal */}
      <div style={{ background: "#0E110D", borderRadius: 12, padding: 24, border: "1px solid #2C3029" }}>
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 14, color: "#A8FF3E", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>04 — Deal Context</div>
        <div style={{ marginBottom: 16 }}>
          <Label>Contract Duration</Label>
          <select style={selectStyle} value={form.contractDuration} onChange={e => updateField("contractDuration", e.target.value)}>
            <option value="12">12 months</option>
            <option value="24">24 months</option>
            <option value="36">36 months</option>
            <option value="custom">Custom / TBD</option>
          </select>
        </div>
        <div>
          <Label>Additional Context (pain points, budget signals, competitors, timeline...)</Label>
          <textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} value={form.additionalContext} onChange={e => updateField("additionalContext", e.target.value)} placeholder="Share any other details that might help tailor the recommendation..." />
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={loading}
        style={{
          width: "100%", background: loading ? "#4A4F48" : "#A8FF3E", color: "#0A0B09",
          border: "none", borderRadius: 10, padding: "16px 24px",
          fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 16, cursor: loading ? "not-allowed" : "pointer",
          letterSpacing: 1, textTransform: "uppercase", transition: "all 0.2s",
        }}>
        {loading ? "Generating Offer..." : "→ Generate Solution & Offer"}
      </button>
    </div>
  );
}

function OfferResult({ result, form, pricing, onReset }) {
  if (!result) return null;
  const cur = pricing.currency;
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const tagColors = { smartLabel: "#2E7D32", tagS: "#1565C0", tagL: "#E65100", tagXL: "#6A1B9A" };
  const tagBg = { smartLabel: "#1A2E1A", tagS: "#0F1E2E", tagL: "#2E1A0A", tagXL: "#1E0A2E" };

  const platIcon = { dashboard: "◈", dataForwarding: "⇌", onPremise: "▣" };
  const techIcon = { GNSS: "🛰", BLE: "📶", WiFi: "🔵", LoRa: "📡" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0E200A 0%, #0A1A06 100%)", borderRadius: 14, padding: 28, border: "1px solid #2C3029", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, #A8FF3E22, transparent)", pointerEvents: "none" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#A8FF3E", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Truvami Solution Offer</div>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 24, color: "#E8EDE5" }}>{form.companyName || "Customer"}</div>
            {form.customerName && <div style={{ color: "#7A8278", fontSize: 13, marginTop: 2 }}>Attn: {form.customerName}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#7A8278" }}>Generated</div>
            <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: "#E8EDE5" }}>{today}</div>
            {form.contractDuration !== "custom" && (
              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#7A8278", marginTop: 4 }}>{form.contractDuration}-month term</div>
            )}
          </div>
        </div>
        <div style={{ marginTop: 20, padding: 16, background: "#0A140806", borderRadius: 8, borderLeft: "3px solid #A8FF3E" }}>
          <p style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: 14, color: "#C8CEC5", lineHeight: 1.7 }}>{result.executiveSummary}</p>
        </div>
      </div>

      {/* Recommended Devices */}
      <div style={{ background: "#0E110D", borderRadius: 12, padding: 24, border: "1px solid #2C3029" }}>
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 13, color: "#A8FF3E", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Recommended Hardware</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {result.recommendedDevices?.map((device, i) => (
            <div key={i} style={{ background: tagBg[device.modelKey] || "#1A1E18", borderRadius: 10, padding: 16, border: `1px solid ${tagColors[device.modelKey] || "#2C3029"}40` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 16, color: "#E8EDE5" }}>{device.model}</div>
                <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: tagColors[device.modelKey] || "#A8FF3E", background: `${tagColors[device.modelKey] || "#A8FF3E"}18`, padding: "4px 12px", borderRadius: 20 }}>
                  × {device.quantity} units
                </div>
              </div>
              <div style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: 13, color: "#9AA098", lineHeight: 1.6 }}>{device.reasoning}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform + Positioning */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#0E110D", borderRadius: 12, padding: 20, border: "1px solid #2C3029" }}>
          <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 12, color: "#A8FF3E", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Platform</div>
          <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 16, color: "#E8EDE5", marginBottom: 6 }}>
            {platIcon[result.platformTier] || "◈"} {result.platformTierLabel}
          </div>
          <div style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: 12, color: "#7A8278", lineHeight: 1.6 }}>{result.platformReasoning}</div>
        </div>
        <div style={{ background: "#0E110D", borderRadius: 12, padding: 20, border: "1px solid #2C3029" }}>
          <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 12, color: "#A8FF3E", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Positioning Tech</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {result.positioningTech?.map(t => (
              <span key={t} style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, color: "#E8EDE5", background: "#1C201A", padding: "4px 10px", borderRadius: 6, border: "1px solid #2C3029" }}>
                {techIcon[t] || "◦"} {t}
              </span>
            ))}
          </div>
          {result.connectivityNote && <div style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: 12, color: "#7A8278", lineHeight: 1.6 }}>{result.connectivityNote}</div>}
          {result.needsLorawanInfrastructure && (
            <div style={{ marginTop: 8, padding: "6px 10px", background: "#2E1A0A", borderRadius: 6, fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#FF8C42" }}>
              ⚠ LoRaWAN gateways required: {result.gatewaysRequired || "TBD"}
            </div>
          )}
        </div>
      </div>

      {/* Pricing */}
      <div style={{ background: "#0E110D", borderRadius: 12, padding: 24, border: "1px solid #2C3029" }}>
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 13, color: "#A8FF3E", letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Pricing Offer</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Upfront */}
          <div>
            <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#7A8278", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>One-Time Investment</div>
            {result.upfront?.lineItems?.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1C201A" }}>
                <span style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: 13, color: "#9AA098" }}>{item.label}</span>
                <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: item.isTbd ? "#FF8C42" : "#E8EDE5" }}>{item.isTbd ? "TBD" : fmt(item.amount, cur)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, padding: "12px 16px", background: "#1C201A", borderRadius: 8 }}>
              <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 14, color: "#E8EDE5" }}>Total Upfront</span>
              <span style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 600, fontSize: 16, color: result.upfront?.hasTbd ? "#FF8C42" : "#A8FF3E" }}>
                {result.upfront?.hasTbd ? "TBD" : fmt(result.upfront?.total || 0, cur)}
              </span>
            </div>
          </div>
          {/* Recurring */}
          <div>
            <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#7A8278", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Recurring (Monthly)</div>
            {result.recurring?.lineItems?.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1C201A" }}>
                <span style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: 13, color: "#9AA098" }}>{item.label}</span>
                <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: item.isTbd ? "#FF8C42" : "#E8EDE5" }}>{item.isTbd ? "TBD" : fmt(item.amount, cur)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, padding: "12px 16px", background: "#1C201A", borderRadius: 8 }}>
              <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 14, color: "#E8EDE5" }}>Monthly Total</span>
              <span style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 600, fontSize: 16, color: result.recurring?.hasTbd ? "#FF8C42" : "#A8FF3E" }}>
                {result.recurring?.hasTbd ? "TBD" : fmt(result.recurring?.total || 0, cur)}/mo
              </span>
            </div>
            {result.recurring?.annualTotal > 0 && (
              <div style={{ textAlign: "right", marginTop: 6, fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#7A8278" }}>
                {fmt(result.recurring.annualTotal, cur)} / year
              </div>
            )}
          </div>
        </div>
        {result.contractNote && (
          <div style={{ marginTop: 16, padding: 12, background: "#131510", borderRadius: 8, fontFamily: "IBM Plex Sans, sans-serif", fontSize: 12, color: "#7A8278", borderLeft: "2px solid #2C3029" }}>
            {result.contractNote}
          </div>
        )}
      </div>

      {/* Next Steps + Technical Notes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {result.nextSteps?.length > 0 && (
          <div style={{ background: "#0E110D", borderRadius: 12, padding: 20, border: "1px solid #2C3029" }}>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 12, color: "#A8FF3E", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Next Steps</div>
            <ol style={{ paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {result.nextSteps.map((step, i) => (
                <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#A8FF3E", minWidth: 20, marginTop: 1 }}>{String(i + 1).padStart(2, "0")}</span>
                  <span style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: 13, color: "#9AA098", lineHeight: 1.5 }}>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        {result.technicalNotes && (
          <div style={{ background: "#0E110D", borderRadius: 12, padding: 20, border: "1px solid #2C3029" }}>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 12, color: "#A8FF3E", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Technical Notes</div>
            <div style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: 13, color: "#7A8278", lineHeight: 1.7 }}>{result.technicalNotes}</div>
          </div>
        )}
      </div>

      <button onClick={onReset} style={{
        background: "transparent", border: "1px solid #2C3029", borderRadius: 8, padding: "12px 24px",
        color: "#7A8278", fontFamily: "IBM Plex Mono, monospace", fontSize: 13, cursor: "pointer", letterSpacing: 1,
      }}>← New Offer</button>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────
export default function TruvamiSalesTool() {
  const [view, setView] = useState("form");
  const [showConfig, setShowConfig] = useState(false);
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const isPricingSet = Object.values(pricing).some(v => typeof v === "number" && v > 0) ||
    Object.values(pricing.platform).some(tier => Object.values(tier).some(v => v > 0));

  const handleSubmit = async () => {
    setView("loading");
    setError(null);
    try {
      const r = await callClaude(form, pricing);
      setResult(r);
      setView("result");
    } catch (e) {
      setError("Failed to generate offer. Please check your connection and try again.");
      setView("form");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { background: #0A0B09; margin: 0; }
        input:focus, textarea:focus, select:focus { border-color: #A8FF3E !important; }
        input::placeholder, textarea::placeholder { color: #4A4F48; }
        select option { background: #131510; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0A0B09; }
        ::-webkit-scrollbar-thumb { background: #2C3029; border-radius: 3px; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#0A0B09", color: "#E8EDE5" }}>
        {/* Nav */}
        <div style={{ borderBottom: "1px solid #1C201A", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#0A0B09", zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 18, color: "#E8EDE5", letterSpacing: -0.5 }}>
              truvami
              <span style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 400, fontSize: 11, color: "#7A8278", marginLeft: 10, letterSpacing: 2, textTransform: "uppercase" }}>Sales Tool</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {!isPricingSet && (
              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "#FF8C42", padding: "4px 10px", borderRadius: 6, background: "#2E1A0A", border: "1px solid #FF8C4230" }}>
                ⚠ Pricing not configured
              </div>
            )}
            <button
              onClick={() => setShowConfig(true)}
              style={{ background: "#1C201A", border: "1px solid #2C3029", borderRadius: 8, padding: "8px 16px", color: "#E8EDE5", fontFamily: "IBM Plex Mono, monospace", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              ⚙ Configure Pricing
            </button>
          </div>
        </div>

        {/* Main */}
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px 64px" }}>
          {view === "form" && (
            <>
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 32, color: "#E8EDE5", lineHeight: 1.2 }}>
                  Generate Solution Offer
                </div>
                <div style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: 15, color: "#7A8278", marginTop: 8 }}>
                  Fill in the customer's requirements and let AI prescribe the right Truvami solution with pricing.
                </div>
                {error && (
                  <div style={{ marginTop: 16, padding: 14, background: "#2E0A0A", border: "1px solid #FF4A4A40", borderRadius: 8, fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: "#FF6B6B" }}>
                    ✕ {error}
                  </div>
                )}
              </div>
              <CustomerForm form={form} setForm={setForm} onSubmit={handleSubmit} loading={false} />
            </>
          )}

          {view === "loading" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 20 }}>
              <div style={{ width: 48, height: 48, border: "2px solid #2C3029", borderTop: "2px solid #A8FF3E", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13, color: "#7A8278", letterSpacing: 2 }}>ANALYZING REQUIREMENTS...</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {view === "result" && (
            <>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 32, color: "#E8EDE5", lineHeight: 1.2 }}>Solution Offer</div>
                <div style={{ fontFamily: "IBM Plex Sans, sans-serif", fontSize: 15, color: "#7A8278", marginTop: 8 }}>AI-generated recommendation based on customer requirements.</div>
              </div>
              <OfferResult result={result} form={form} pricing={pricing} onReset={() => { setView("form"); setResult(null); }} />
            </>
          )}
        </div>
      </div>

      {showConfig && <ConfigPanel pricing={pricing} setPricing={setPricing} onClose={() => setShowConfig(false)} />}
    </>
  );
}
