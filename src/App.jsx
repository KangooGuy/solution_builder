const { useState } = require('react');

const PRODUCT_CATALOG = `TRUVAMI PRODUCT CATALOG
=======================
HARDWARE: Smart Label, Tag S, Tag L, Tag XL
PLATFORM: Dashboard (SaaS), Data Forwarding (API), On-Premise
CONNECTIVITY: LoRaWAN (170+ countries, AES-128)`;

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

function App() {
  const [view, setView] = useState('form');
  const [showConfig, setShowConfig] = useState(false);
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  const [form, setForm] = useState({
    customerName: '', companyName: '', industry: '', useCase: '',
    assetTypes: '', assetCount: '', environment: '', positioningNeeds: '',
    hasLoraWAN: '', platformPreference: '', integrations: [],
    contractDuration: '12', additionalContext: ''
  });

  return (
    <div style={{ minHeight: '100vh', background: '#0A0B09', color: '#E8EDE5', fontFamily: 'IBM Plex Sans' }}>
      <div style={{ borderBottom: '1px solid #1C201A', padding: '16px 32px', position: 'sticky', top: 0, background: '#0A0B09', zIndex: 100 }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: '#E8EDE5' }}>
          truvami
          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 400, fontSize: 11, color: '#7A8278', marginLeft: 10, letterSpacing: 2 }}>SALES TOOL</span>
        </div>
      </div>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '36px 24px 80px' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 34, color: '#E8EDE5', marginBottom: 8 }}>Generate Solution Offer</h1>
        <p style={{ fontSize: 15, color: '#7A8278' }}>Fill in the customer's requirements — AI will prescribe the right Truvami solution with pricing.</p>
      </div>
    </div>
  );
}

export default App;
