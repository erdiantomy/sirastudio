import { useState, useMemo } from "react";

/* ══════════════════════════════════════════════════════════════
   TOMS · MUSCLE STUDIOS — Gym Operating Model
   Faithful port of the HYROX Master Model (Cilandak · 750 sqm).
   Membership-driven. Every blue cell is live. All Rp in juta (jt).
   Built in strength. United in purpose.
   ══════════════════════════════════════════════════════════════ */

const A0 = {
  // revenue & membership
  arpu: 1.5, pt_yield: 0.25, anc_yield: 0.2,
  founding_members: 80, target_members: 300, ramp_months: 12,
  // capacity
  class_size: 24, classes_per_day: 8, days_per_month: 30, visits_per_member: 12,
  // people (Rp jt/mo)
  amelie_base: 20, edward_base_ops: 15, edward_base_build: 12, headcoach_base: 10,
  coaches_count: 3, coach_base_each: 7, frontdesk_count: 2, frontdesk_each: 6,
  cleaning_cost: 8, growth_lead: 6, pt_coaches_count: 2, pt_coach_each: 5,
  statutory_pct: 0.15, tom_draw: 0,
  // facility
  electricity: 25, water: 5, internet: 3, maintenance: 7, consumables: 5,
  // marketing
  digital_ads: 8, contents: 3, events: 5, partnership: 3,
  // tech / admin
  tech_total: 7, insurance: 7, accounting: 4, legal: 2, buffer: 5,
  payment_fee_pct: 0.01,
  // capex — facility buildout
  demolition: 200, structural: 500, hvac: 430, flooring: 300, mep: 460,
  permits_wf: 600, lighting: 120, locker_shower: 550, painting_acoustic: 150,
  fire_safety: 70, signage: 30, exterior_branding: 60,
  // capex — equipment
  hyrox_zone: 638, sc_zone: 221, conventional_gym: 536, equip_overhead: 140,
  // capex — other
  legal_permit_capex: 250, tech_system_capex: 250,
  // funding
  preopening: 400, wc_months: 6, contingency_pct: 0.12,
  // comp
  amelie_revshare: 0.02, amelie_retention_kicker: 3, amelie_founding_bonus: 25,
  edward_approved_capex: 5800, edward_savings_share: 0.12, edward_profit_kicker: 0.01,
  coach_pt_commission: 0.35, coach_perf_pool: 0.02,
};

const RANGE = {
  arpu: [0.5, 5, 0.05], pt_yield: [0, 2, 0.05], anc_yield: [0, 2, 0.05],
  founding_members: [0, 400, 5], target_members: [50, 600, 5], ramp_months: [3, 24, 1],
  statutory_pct: [0, 0.3, 0.01], payment_fee_pct: [0, 0.05, 0.005],
  wc_months: [0, 12, 1], contingency_pct: [0, 0.3, 0.01],
};

const fmt = (v, d = 1) => v == null || !isFinite(v) ? "∞" :
  v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const cl = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

/* ── editorial monochrome tokens · from the SIRA mark ── */
const BG    = "#ECE8DF";   // bone cream — matches the logo ground
const SURF  = "#F8F6F0";   // paper card
const SURF2 = "#FFFFFF";   // input wells
const INK   = "#1F1D18";   // charcoal ink — body text
const BONE  = "#121110";   // near-black — headers, key numbers ("strong")
const MUT   = "#8A857A";   // warm gray
const LINE  = "#DCD6C8";   // warm hairline
const EMBER = "#B0472F";   // brick-red — losses / "in the red"
const STEEL = "#356B4E";   // forest — gains / "in the black"

const PROGRAMS = ["Calisthenics","Cross-Fit","Rowing","Spinning","HIIT","TRX","Yoga","Pilates","Hyrox"];
const FUND_BASE_B = 7.991872;   // verified baseline funding (B) at default build
const CAP_MIN = 7.99, CAP_MAX = 10.20;
const STREAMS = [
  ["Memberships", "Recurring base — the engine", "membership"],
  ["Personal training", "1:1 coaching yield", "pt"],
  ["HYROX / functional", "Race-format group classes", "anc"],
  ["Yoga / Pilates", "Level-2 studio classes", "anc"],
  ["Recovery", "Sauna · cold plunge · contrast", "anc"],
  ["Fuel Bar", "F&B · protein · kopi", "anc"],
  ["Retail", "Apparel · supplements", "anc"],
  ["Corporate / events", "Team blocks · activations", "anc"],
  ["Community / space", "Lounge · rentals · hosting", "anc"],
];
const ZONES = [
  ["strength", "Strength", "Plate-loaded racks, platforms, free weights — the floor that anchors the membership.", "Level 1"],
  ["functional", "Functional · HYROX", "A regulation sled track and rig. The format Jakarta is searching for and can't yet find.", "Level 1"],
  ["fuelbar", "Fuel Bar", "Protein, cold brew, single-origin kopi — where a workout becomes a habit and a hangout.", "Level 1"],
  ["retail", "Retail", "Apparel and supplements merchandised like a boutique. Margin on every visit.", "Level 1"],
  ["yoga", "Yoga · Pilates", "A light-filled studio upstairs. Mobility, breath, and a second membership tier.", "Level 2"],
  ["recovery", "Recovery", "Sauna, cold plunge, contrast. Discipline · focus · freedom — and a premium add-on.", "Level 2"],
  ["lounge", "Community Lounge", "The room people stay in — events, co-working, belonging. The retention moat.", "Level 2"],
];

export default function App() {
  const [a, setA] = useState(A0);
  const [memberProbe, setMemberProbe] = useState(300);
  const [scale, setScale] = useState({ fac: 1, mkt: 1, tech: 1, adm: 1 });
  const [capital, setCapital] = useState(7.99);
  const [open, setOpen] = useState({ rev: true, capex: false, opex: true, fac: false, mkt: false, comp: false });

  const set = (k, raw) => {
    const v = +raw; if (isNaN(v)) return;
    const r = RANGE[k];
    setA((s) => ({ ...s, [k]: r ? cl(v, r[0], r[1]) : Math.max(0, v) }));
  };
  const toggle = (k) => setOpen((s) => ({ ...s, [k]: !s[k] }));

  const m = useMemo(() => {
    // ── master capital lever: build multiplier scales the entire venture ──
    const bm = capital / FUND_BASE_B;          // 1.000 (lean 7.99B) → 1.277 (premium 10.20B)
    const tgt = a.target_members * bm;          // effective steady-state members
    const fnd = a.founding_members * bm;        // effective founding members

    const payrollBase = a.amelie_base + a.edward_base_ops + a.headcoach_base
      + a.coaches_count * a.coach_base_each + a.frontdesk_count * a.frontdesk_each
      + a.cleaning_cost + a.growth_lead + a.pt_coaches_count * a.pt_coach_each + a.tom_draw;
    const statutory = a.statutory_pct * (payrollBase - a.cleaning_cost);
    const peopleTotal = (payrollBase + statutory) * bm;
    const facilityBase = a.electricity + a.water + a.internet + a.maintenance + a.consumables;
    const marketingBase = a.digital_ads + a.contents + a.events + a.partnership;
    const techBase = a.tech_total;
    const adminBase = a.insurance + a.accounting + a.legal + a.buffer;
    const facilityTotal = facilityBase * scale.fac * bm;
    const marketingTotal = marketingBase * scale.mkt * bm;
    const techTotal = techBase * scale.tech * bm;
    const adminTotal = adminBase * scale.adm * bm;
    const fixedOpex = peopleTotal + facilityTotal + marketingTotal + techTotal + adminTotal;

    const membershipRev = tgt * a.arpu;
    const ptRev = tgt * a.pt_yield;
    const ancRev = tgt * a.anc_yield;
    const totalRev = membershipRev + ptRev + ancRev;
    const revPerMember = tgt > 0 ? totalRev / tgt : 0;

    const payFees = a.payment_fee_pct * totalRev;
    const prebonus = totalRev - payFees - fixedOpex;
    const bAmelieRev = a.amelie_revshare * totalRev;
    const bAmelieKick = (tgt >= tgt * 0.7 ? a.amelie_retention_kicker : 0) * bm;
    const bCoachPT = a.coach_pt_commission * ptRev;
    const bCoachPool = a.coach_perf_pool * membershipRev;
    const bEdward = a.edward_profit_kicker * Math.max(0, prebonus);
    const bonusTotal = bAmelieRev + bAmelieKick + bCoachPT + bCoachPool + bEdward;
    const noi = prebonus - bonusTotal;
    const noiMargin = totalRev > 0 ? noi / totalRev : 0;
    const revOpex = fixedOpex > 0 ? totalRev / fixedOpex : 0;

    const beMemMembership = a.arpu > 0 ? fixedOpex / a.arpu : Infinity;
    const beMemBlended = (a.arpu + a.pt_yield + a.anc_yield) > 0 ? fixedOpex / (a.arpu + a.pt_yield + a.anc_yield) : Infinity;
    const maxMembers = (a.visits_per_member > 0 ? a.class_size * a.classes_per_day * a.days_per_month / a.visits_per_member : 0) * bm;
    const capUtil = maxMembers > 0 ? tgt / maxMembers : 0;

    const facilityBuildout = (a.demolition + a.structural + a.hvac + a.flooring + a.mep
      + a.permits_wf + a.lighting + a.locker_shower + a.painting_acoustic + a.fire_safety + a.signage + a.exterior_branding) * bm;
    const equipment = (a.hyrox_zone + a.sc_zone + a.conventional_gym + a.equip_overhead) * bm;
    const otherSetup = (a.legal_permit_capex + a.tech_system_capex) * bm;
    const totalCapex = facilityBuildout + equipment + otherSetup;

    const workingCapital = a.wc_months * fixedOpex;
    const fundingSub = totalCapex + a.preopening * bm + workingCapital;
    const contingency = a.contingency_pct * fundingSub;
    const totalFunding = fundingSub + contingency;
    const payback = noi > 0 ? totalFunding / noi : Infinity;

    // 24-month ramp
    let cum = 0; let noiPosM = null; let cashPosM = null;
    const ramp = Array.from({ length: 24 }, (_, i) => {
      const mo = i + 1;
      const members = Math.min(tgt, Math.round(fnd + (tgt - fnd) * mo / a.ramp_months));
      const mem = members * a.arpu, pt = members * a.pt_yield, anc = members * a.anc_yield;
      const rev = mem + pt + anc;
      const fees = a.payment_fee_pct * rev;
      const bonus = a.amelie_revshare * rev
        + (members >= tgt * 0.7 ? a.amelie_retention_kicker : 0)
        + a.coach_pt_commission * pt + a.coach_perf_pool * mem
        + a.edward_profit_kicker * Math.max(0, rev - fees - fixedOpex);
      const mNoi = rev - fees - fixedOpex - bonus;
      cum += mNoi;
      if (noiPosM === null && mNoi > 0) noiPosM = mo;
      if (cashPosM === null && cum > 0) cashPosM = mo;
      return { mo, members, rev, mNoi, cum };
    });

    // member sensitivity probe
    const probeRev = memberProbe * (a.arpu + a.pt_yield + a.anc_yield);
    const probePre = probeRev - a.payment_fee_pct * probeRev - fixedOpex;
    const probeBonus = a.amelie_revshare * probeRev
      + (memberProbe >= tgt * 0.7 ? a.amelie_retention_kicker : 0)
      + a.coach_pt_commission * (memberProbe * a.pt_yield)
      + a.coach_perf_pool * (memberProbe * a.arpu)
      + a.edward_profit_kicker * Math.max(0, probePre);
    const probeNoi = probePre - probeBonus;
    const probeRatio = fixedOpex > 0 ? probeRev / fixedOpex : 0;

    return {
      bm, tgt, fnd,
      payrollBase, statutory, peopleTotal, facilityTotal, marketingTotal, adminTotal, techTotal,
      facilityBase, marketingBase, techBase, adminBase, fixedOpex,
      membershipRev, ptRev, ancRev, totalRev, revPerMember,
      payFees, prebonus, bAmelieRev, bAmelieKick, bCoachPT, bCoachPool, bEdward, bonusTotal,
      noi, noiMargin, revOpex, beMemMembership, beMemBlended, maxMembers, capUtil,
      facilityBuildout, equipment, otherSetup, totalCapex, workingCapital, contingency, totalFunding, payback,
      ramp, noiPosM, cashPosM, y2cum: ramp[23].cum, fundingRec: ramp[23].cum / totalFunding,
      probeRev, probeNoi, probeRatio, probeBonus,
    };
  }, [a, memberProbe, scale, capital]);

  const pos = m.noi > 0;
  const maxBar = Math.max(...m.ramp.map(x => x.rev), 1);
  const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  /* ── primitives ── */
  const Slider = ({ k, label, pct, suffix }) => {
    const r = RANGE[k] || [0, a[k] * 2 || 1, 1];
    const disp = pct ? `${fmt(a[k] * 100, 0)}%` : `${fmt(a[k], a[k] % 1 ? 2 : 0)}${suffix || ""}`;
    return (
      <div style={{ marginBottom: 15 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10.5, letterSpacing: ".08em", textTransform: "uppercase", color: MUT, marginBottom: 6 }}>
          <span>{label}</span>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", color: BONE, fontSize: 13 }}>{disp}</span>
        </div>
        <input type="range" min={r[0]} max={r[1]} step={r[2]} value={a[k]} onChange={(e) => set(k, e.target.value)} style={{ width: "100%", accentColor: BONE }} />
      </div>
    );
  };

  const Num = ({ k, label }) => (
    <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", fontSize: 12.5, gap: 8 }}>
      <span style={{ color: MUT }}>{label}</span>
      <input type="number" value={a[k]} step={a[k] % 1 ? 0.5 : 1} onChange={(e) => set(k, e.target.value)}
        style={{ width: 78, background: SURF2, border: `1px solid ${LINE}`, color: INK, padding: "5px 7px", borderRadius: 4, fontSize: 13, fontFamily: "'IBM Plex Mono',monospace", textAlign: "right" }} />
    </label>
  );

  const Card = ({ id, children, pad = 18 }) => (
    <div id={id} style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 8, padding: pad, scrollMarginTop: 168, boxShadow: "0 2px 8px rgba(0,0,0,.4)" }}>{children}</div>
  );
  const H = ({ children, right }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, borderBottom: `1px solid ${LINE}`, paddingBottom: 9, marginBottom: 11 }}>
      <h2 style={{ fontFamily: "'Archivo',sans-serif", fontSize: 13, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: BONE, margin: 0 }}>{children}</h2>
      {right}
    </div>
  );
  const Row = ({ l, v, sub, color, dim, strong }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px dotted ${LINE}`, fontSize: 13, gap: 10 }}>
      <span style={{ color: dim ? MUT : INK, paddingLeft: sub ? 14 : 0, fontWeight: strong ? 600 : 400 }}>{l}</span>
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", color: color || (strong ? BONE : INK), whiteSpace: "nowrap", fontWeight: strong ? 600 : 400 }}>{v}</span>
    </div>
  );
  const Foot = ({ children }) => <div style={{ fontSize: 10.5, color: MUT, marginTop: 8, lineHeight: 1.6 }}>{children}</div>;
  const ScaleRow = ({ gkey, label, base }) => {
    const pct = scale[gkey];
    const val = base * pct;
    const d = val - base;
    const c = pct < 1 ? EMBER : pct > 1 ? STEEL : INK;
    return (
      <div style={{ padding: "9px 0 10px", borderBottom: `1px dotted ${LINE}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13, gap: 10 }}>
          <span style={{ color: INK }}>{label} <span style={{ color: MUT, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11 }}>· {fmt(pct * 100, 0)}%</span></span>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", color: c, whiteSpace: "nowrap" }}>
            Rp {fmt(val, 1)}
            {Math.abs(d) > 0.05 && <span style={{ fontSize: 11, marginLeft: 6 }}>{d > 0 ? "+" : "−"}{fmt(Math.abs(d), 1)}</span>}
          </span>
        </div>
        <input type="range" min={0} max={2} step={0.05} value={pct}
          onChange={(e) => setScale((s) => ({ ...s, [gkey]: +e.target.value }))}
          style={{ width: "100%", accentColor: BONE, marginTop: 7 }} />
      </div>
    );
  };
  const Acc = ({ id, title, sub, children }) => (
    <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 12, marginTop: 12 }}>
      <button onClick={() => toggle(id)} style={{ width: "100%", background: "transparent", border: 0, padding: 0, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", color: INK }}>
        <span style={{ fontFamily: "'Archivo',sans-serif", fontSize: 11.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>{title}</span>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: MUT }}>{sub} <span style={{ color: BONE }}>{open[id] ? "−" : "+"}</span></span>
      </button>
      {open[id] && <div style={{ marginTop: 8 }}>{children}</div>}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: BG, color: INK, fontFamily: "'IBM Plex Sans',sans-serif", position: "relative" }}>
      <style>{`
        body{margin:0;background:${BG}}
        *{-webkit-tap-highlight-color:transparent}
        ::selection{background:${INK};color:${BG}}
        input[type=range]{-webkit-appearance:none;background:#D8D3C6;border-radius:3px;height:5px;cursor:pointer;touch-action:none}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:${BONE};border:3px solid ${BG};box-shadow:0 0 0 1px ${MUT};cursor:grab}
        input[type=range]::-webkit-slider-thumb:active{cursor:grabbing;transform:scale(1.12)}
        input[type=range]::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:${BONE};border:3px solid ${BG};cursor:grab}
        input:focus-visible,button:focus-visible{outline:1px solid ${BONE};outline-offset:2px}
        .grain{position:fixed;inset:0;pointer-events:none;z-index:1;opacity:.035;mix-blend-mode:multiply;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
        @media(max-width:860px){.grid-main{grid-template-columns:1fr !important}}
      `}</style>
      <div className="grain" />

      {/* ── HERO / COVER ── */}
      <div style={{ position: "relative", zIndex: 2, borderBottom: `1px solid ${LINE}` }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "14px 16px 0", display: "flex", justifyContent: "center" }}>
          <img src="/logo.jpg" alt="SIRA Muscle Studios — Strength · Intensity · Recovery · Agility · operated by TOMS"
            style={{ width: "100%", maxWidth: 380, height: "auto", display: "block", mixBlendMode: "multiply" }} />
        </div>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "4px 16px 18px", textAlign: "center" }}>
          <div style={{ fontFamily: "'Archivo',sans-serif", fontSize: 11, fontWeight: 800, letterSpacing: ".26em", textTransform: "uppercase", color: EMBER }}>Investor Pitch · Confidential</div>
          <h1 style={{ fontFamily: "'Archivo',sans-serif", fontSize: 30, fontWeight: 900, letterSpacing: "-.01em", lineHeight: 1.08, color: BONE, margin: "12px 0 0" }}>
            Jakarta's first capital-efficient Muscle Studios compound.
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "#4A4638", maxWidth: 600, margin: "12px auto 0", fontWeight: 400 }}>
            A 750 m² strength-and-recovery destination in Cilandak, South Jakarta. Nine revenue streams under one roof, ~55% operating margin, capital returned in under 25 months — and a live model you can pressure-test yourself, below.
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 14, marginTop: 18, flexWrap: "wrap", justifyContent: "center" }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 26, color: BONE, lineHeight: 1 }}>Rp 7.99–10.20<span style={{ fontSize: 14, color: MUT }}> B</span></div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9.5, color: MUT, letterSpacing: ".06em", marginTop: 2 }}>CAPITAL · LEAN → PREMIUM BUILD</div>
            </div>
            <div style={{ width: 1, height: 30, background: LINE }} />
            <div style={{ fontSize: 12, color: MUT, lineHeight: 1.5, textAlign: "left" }}>
              operated by <span style={{ fontFamily: "'Caveat',cursive", fontSize: 17, color: INK }}>TOMS</span><br />Cilandak · South Jakarta
            </div>
          </div>
        </div>
        {/* programs strip */}
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "9px 16px", display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", borderTop: `1px solid ${LINE}` }}>
          {PROGRAMS.map((p, i) => (
            <span key={p} style={{ fontSize: 9.5, letterSpacing: ".18em", textTransform: "uppercase", color: i % 2 ? MUT : INK }}>{p}</span>
          ))}
        </div>
      </div>

      {/* ── STICKY KPI + NAV ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 5, background: `${BG}f2`, backdropFilter: "blur(10px)", borderBottom: `1px solid ${LINE}` }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "9px 16px 5px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(108px,1fr))", gap: 10 }}>
          {[
            ["Funding req.", `Rp ${fmt(m.totalFunding / 1000, 2)}B`, `CAPEX ${fmt(m.totalCapex, 0)}`, BONE],
            ["NOI / mo", `Rp ${fmt(m.noi, 0)}`, `margin ${fmt(m.noiMargin * 100, 0)}%`, pos ? STEEL : EMBER],
            ["Rev / OPEX", `${fmt(m.revOpex, 2)}×`, "goal 2.0×+", m.revOpex >= 2 ? STEEL : INK],
            ["Payback", isFinite(m.payback) ? `${fmt(m.payback, 0)} mo` : "∞", "steady NOI", pos ? BONE : EMBER],
            ["Break-even", `${fmt(m.beMemMembership, 0)}`, "members · mbr-only", BONE],
          ].map(([l, v, s, c]) => (
            <div key={l}>
              <div style={{ fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", color: MUT }}>{l}</div>
              <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 22, color: c, lineHeight: 1.05, letterSpacing: ".01em" }}>{v}</div>
              <div style={{ fontSize: 9, color: MUT }}>{s}</div>
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 16px 7px", display: "flex", gap: 6, overflowX: "auto" }}>
          {[["opportunity","Opportunity"],["compound","Compound"],["streamsNarr","Streams"],["model","Live Model"],["plS","P&L"],["capexS","CAPEX"],["rampS","Ramp"],["team","Team"],["ask","The Ask"]].map(([id, lbl]) => (
            <button key={id} onClick={() => jump(id)} style={{ background: "transparent", border: `1px solid ${LINE}`, color: MUT, borderRadius: 999, padding: "4px 13px", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" }}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* ── COMPOUND RENDER BAND ── */}
      <div style={{ position: "relative", zIndex: 2, borderBottom: `1px solid ${LINE}` }}>
        <img src="/hero.jpg" alt="SIRA Muscle Studios compound at dusk — Cilandak, South Jakarta" style={{ width: "100%", maxHeight: 420, objectFit: "cover", display: "block" }} />
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "10px 16px", fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, color: MUT, letterSpacing: ".04em" }}>
          The compound · two levels · seven earning zones · Cilandak, South Jakarta — concept render
        </div>
      </div>

      {/* ── NARRATIVE SECTIONS ── */}
      <div style={{ position: "relative", zIndex: 2, maxWidth: 1080, margin: "0 auto", padding: "26px 16px 0", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* THE OPPORTUNITY */}
        <Card id="opportunity">
          <H right={<span style={{ fontSize: 11, color: MUT }}>why now</span>}>The Opportunity</H>
          <p style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 700, fontSize: 22, lineHeight: 1.25, letterSpacing: "-.005em", color: BONE, margin: "2px 0 0" }}>
            Jakarta has gyms and it has boutiques. It does not have a <span style={{ color: EMBER }}>compound</span> — one address where strength, the HYROX format, recovery, food and community compound on each other instead of competing for the same rent.
          </p>
          <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "#4A4638", maxWidth: 720, marginTop: 14 }}>
            HYROX is the fastest-growing fitness format in the world and Jakarta has no purpose-built home for it. Premium wellness spend here is rising fast, but supply is fragmented: a strength gym here, a pilates studio there, a cold plunge somewhere else. SIRA puts the whole ritual under one roof, built lean, so every square metre earns more than once.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 1, background: LINE, marginTop: 20, border: `1px solid ${LINE}` }}>
            {[["9", "revenue streams", "one fixed cost base"], ["~55%", "operating margin", "after performance comp"], ["<25 mo", "capital payback", "at steady state"], ["750 m²", "Cilandak", "two levels, one compound"]].map(([v, k, s]) => (
              <div key={k} style={{ background: SURF2, padding: "16px 14px" }}>
                <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 28, color: INK, lineHeight: 1 }}>{v}</div>
                <div style={{ fontFamily: "'Archivo',sans-serif", fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: INK, marginTop: 7 }}>{k}</div>
                <div style={{ fontSize: 11, color: MUT, marginTop: 2 }}>{s}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* THE COMPOUND — zones */}
        <Card id="compound">
          <H right={<span style={{ fontSize: 11, color: MUT }}>seven zones · two levels</span>}>The Compound</H>
          <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "#4A4638", maxWidth: 720, margin: "2px 0 0" }}>
            The building is the business model. A member arrives for one zone and spends across four. Here is what they walk into.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14, marginTop: 18 }}>
            {ZONES.map((z) => (
              <div key={z[0]} style={{ background: SURF2, border: `1px solid ${LINE}`, overflow: "hidden" }}>
                <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden" }}>
                  <img src={`/zone-${z[0]}.jpg`} alt={z[1]} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <span style={{ position: "absolute", top: 9, left: 9, background: BONE, color: SURF, fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: ".08em", padding: "3px 7px" }}>{z[3]}</span>
                </div>
                <div style={{ padding: "12px 13px 15px" }}>
                  <div style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 800, fontSize: 14, letterSpacing: ".01em", textTransform: "uppercase" }}>{z[1]}</div>
                  <p style={{ fontSize: 12.5, lineHeight: 1.5, color: "#4A4638", marginTop: 5 }}>{z[2]}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* REVENUE STREAMS — narrative */}
        <Card id="streamsNarr">
          <H right={<span style={{ fontSize: 11, color: MUT }}>nine ways, one membership</span>}>Revenue Streams</H>
          <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "#4A4638", maxWidth: 720, margin: "2px 0 0" }}>
            Memberships and personal training carry the model alone — that's the conservative case the break-even is built on. The other seven are the upside the compound was designed to capture.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 1, background: LINE, marginTop: 18, border: `1px solid ${LINE}` }}>
            {STREAMS.map((s, i) => (
              <div key={s[0]} style={{ background: SURF2, padding: "15px 15px 16px", display: "flex", gap: 11 }}>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: EMBER, fontWeight: 600, paddingTop: 1 }}>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <div style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 700, fontSize: 14 }}>{s[0]}</div>
                  <div style={{ fontSize: 11.5, color: MUT, marginTop: 2, lineHeight: 1.4 }}>{s[1]}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* LIVE MODEL intro */}
        <Card id="model">
          <H right={<span style={{ fontSize: 11, color: EMBER }}>interactive · pressure-test it</span>}>The Live Model</H>
          <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "#4A4638", maxWidth: 760, margin: "2px 0 0" }}>
            This isn't a static projection — it's the real operating model, live. Move the <b style={{ color: INK }}>capital lever</b> between Rp 7.99B and 10.20B and the entire venture scales with it: CAPEX, capacity, members, OPEX, funding and the 24-month ramp all recompute simultaneously, while the unit economics hold. Drag any cost group, edit any line, and watch break-even and payback respond. The full control panel and ledgers are below.
          </p>
        </Card>
      </div>

      <div style={{ position: "relative", zIndex: 2, maxWidth: 1080, margin: "0 auto", padding: "6px 16px 20px" }}>
        <div className="grid-main" style={{ display: "grid", gridTemplateColumns: "minmax(300px,340px) 1fr", gap: 20, alignItems: "start" }}>

          {/* ── CONTROL PANEL ── */}
          <Card id="drivers">
            <H right={<button onClick={() => { setA(A0); setMemberProbe(300); setScale({ fac: 1, mkt: 1, tech: 1, adm: 1 }); setCapital(7.99); }} style={{ background: "transparent", border: `1px solid ${LINE}`, color: MUT, borderRadius: 999, padding: "4px 11px", fontSize: 11, cursor: "pointer" }}>Reset</button>}>Control Panel</H>
            <div style={{ fontSize: 10.5, color: MUT, marginBottom: 14, lineHeight: 1.6 }}>Headline drivers below. Expand any group for line-item control — every change recalculates instantly.</div>

            {/* ── MASTER CAPITAL LEVER ── */}
            <div style={{ background: "#21201B", color: "#F4F1EA", borderRadius: 8, padding: "14px 14px 12px", marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <span style={{ fontFamily: "'Archivo',sans-serif", fontSize: 10.5, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "#C9C3B4" }}>Capital deployed</span>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "#9A9484" }}>×{fmt(m.bm, 3)} build</span>
              </div>
              <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 30, letterSpacing: ".01em", lineHeight: 1 }}>Rp {fmt(capital, 2)}<span style={{ fontSize: 16, color: "#C9C3B4" }}> B</span></div>
              <input type="range" min={CAP_MIN} max={CAP_MAX} step={0.01} value={capital} onChange={(e) => setCapital(+e.target.value)} style={{ width: "100%", accentColor: "#F4F1EA", marginTop: 10 }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'IBM Plex Mono',monospace", fontSize: 9.5, color: "#7E786A", marginTop: 3 }}>
                <span>{fmt(CAP_MIN, 2)}B · lean</span><span>premium · {fmt(CAP_MAX, 2)}B</span>
              </div>
              <div style={{ fontSize: 10, color: "#9A9484", marginTop: 9, lineHeight: 1.55 }}>
                One knob scales the whole build — CAPEX, capacity, members, OPEX and funding move together. Unit economics hold; absolute scale grows. <b style={{ color: "#C9C3B4" }}>{fmt(m.tgt, 0)} members</b> at this capital.
              </div>
            </div>

            <Slider k="target_members" label="Target members (per build unit)" />
            <Slider k="founding_members" label="Founding members (pre-open)" />
            <Slider k="ramp_months" label="Ramp to target" suffix=" mo" />
            <Slider k="arpu" label="Membership ARPU" suffix=" jt" />
            <Slider k="pt_yield" label="PT yield / member" suffix=" jt" />
            <Slider k="anc_yield" label="Ancillary yield / member" suffix=" jt" />
            <Slider k="payment_fee_pct" label="Payment processing" pct />
            <Slider k="wc_months" label="Working capital" suffix=" mo OPEX" />
            <Slider k="contingency_pct" label="Contingency reserve" pct />

            <Acc id="opex" title="People & Payroll" sub={`Rp ${fmt(m.peopleTotal, 0)} jt`}>
              <Num k="amelie_base" label="Amelie — GM" />
              <Num k="edward_base_ops" label="Edward — Ops" />
              <Num k="headcoach_base" label="Head Coach" />
              <Num k="coaches_count" label="Coaches (FT) ×" />
              <Num k="coach_base_each" label="  coach each" />
              <Num k="frontdesk_count" label="Front desk ×" />
              <Num k="frontdesk_each" label="  front desk each" />
              <Num k="pt_coaches_count" label="PT coaches ×" />
              <Num k="pt_coach_each" label="  PT coach each" />
              <Num k="cleaning_cost" label="Cleaning" />
              <Num k="growth_lead" label="Growth lead" />
              <Num k="tom_draw" label="Founder draw" />
              <Slider k="statutory_pct" label="Statutory (BPJS)" pct />
            </Acc>

            <Acc id="fac" title="Facility · Mkt · Tech · Admin" sub={`Rp ${fmt(m.facilityTotal + m.marketingTotal + m.techTotal + m.adminTotal, 0)} jt`}>
              <Num k="electricity" label="Electricity" /><Num k="water" label="Water" />
              <Num k="internet" label="Internet" /><Num k="maintenance" label="Maintenance" />
              <Num k="consumables" label="Consumables" />
              <Num k="digital_ads" label="Digital ads" /><Num k="contents" label="Content" />
              <Num k="events" label="Events" /><Num k="partnership" label="Partnerships" />
              <Num k="tech_total" label="Tech (SaaS)" />
              <Num k="insurance" label="Insurance" /><Num k="accounting" label="Accounting" />
              <Num k="legal" label="Legal" /><Num k="buffer" label="Buffer / misc" />
            </Acc>

            <Acc id="capex" title="CAPEX line items" sub={`Rp ${fmt(m.totalCapex, 0)} jt`}>
              <div style={{ fontSize: 10, color: MUT, textTransform: "uppercase", letterSpacing: ".1em", margin: "4px 0 2px" }}>Facility · {fmt(m.facilityBuildout, 0)}</div>
              <Num k="demolition" label="Demolition" /><Num k="structural" label="Structural" />
              <Num k="hvac" label="HVAC" /><Num k="flooring" label="Flooring" />
              <Num k="mep" label="MEP" /><Num k="permits_wf" label="Permits + furniture" />
              <Num k="lighting" label="Lighting" /><Num k="locker_shower" label="Lockers + showers" />
              <Num k="painting_acoustic" label="Paint + acoustic" /><Num k="fire_safety" label="Fire safety" />
              <Num k="signage" label="Signage" /><Num k="exterior_branding" label="Exterior brand" />
              <div style={{ fontSize: 10, color: MUT, textTransform: "uppercase", letterSpacing: ".1em", margin: "8px 0 2px" }}>Equipment · {fmt(m.equipment, 0)}</div>
              <Num k="hyrox_zone" label="Hyrox zone" /><Num k="sc_zone" label="S&C zone" />
              <Num k="conventional_gym" label="Conventional gym" /><Num k="equip_overhead" label="Equip overhead" />
              <div style={{ fontSize: 10, color: MUT, textTransform: "uppercase", letterSpacing: ".1em", margin: "8px 0 2px" }}>Other + funding</div>
              <Num k="legal_permit_capex" label="Legal & permit setup" /><Num k="tech_system_capex" label="Tech & systems setup" />
              <Num k="preopening" label="Pre-opening" />
            </Acc>

            <Acc id="comp" title="Performance Comp" sub={`Rp ${fmt(m.bonusTotal, 0)} jt`}>
              <Slider k="amelie_revshare" label="Amelie rev share" pct />
              <Num k="amelie_retention_kicker" label="Amelie retention kicker" />
              <Num k="amelie_founding_bonus" label="Amelie founding bonus" />
              <Slider k="edward_profit_kicker" label="Edward profit kicker" pct />
              <Num k="edward_approved_capex" label="Edward approved CAPEX" />
              <Slider k="edward_savings_share" label="Edward savings share" pct />
              <Slider k="coach_pt_commission" label="Coach PT commission" pct />
              <Slider k="coach_perf_pool" label="Coach perf pool" pct />
            </Acc>

            <div style={{ marginTop: 14, fontSize: 10.5, color: MUT, lineHeight: 1.6 }}>
              {fmt(m.maxMembers, 0)} member capacity · {fmt(m.capUtil * 100, 0)}% utilised at target.
            </div>
          </Card>

          {/* ── LEDGERS ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* REVENUE */}
            <Card id="revS">
              <H right={<span style={{ fontSize: 11, color: MUT }}>steady state · /mo</span>}>Revenue</H>
              <Row l="Membership revenue" v={`Rp ${fmt(m.membershipRev, 0)}`} sub dim />
              <Row l="PT revenue" v={`Rp ${fmt(m.ptRev, 0)}`} sub dim />
              <Row l="Ancillary (corp/events/merch/cafe)" v={`Rp ${fmt(m.ancRev, 0)}`} sub dim />
              <Row l="Total revenue" v={`Rp ${fmt(m.totalRev, 0)} jt`} strong />
              <Row l="Revenue per member" v={`Rp ${fmt(m.revPerMember, 2)} jt`} dim />
              <Foot>Conservative lens: zero out PT & ancillary and break-even still holds on memberships alone. Everything else is upside.</Foot>
            </Card>

            {/* NINE REVENUE STREAMS */}
            <Card id="streamS">
              <H right={<span style={{ fontSize: 11, color: MUT }}>nine streams · /mo</span>}>Revenue Streams</H>
              {(() => {
                const ancShares = [0, 0, 0.28, 0.18, 0.20, 0.16, 0.10, 0.05, 0.03]; // illustrative split of ancillary
                return STREAMS.map((s, i) => {
                  const val = s[2] === "membership" ? m.membershipRev : s[2] === "pt" ? m.ptRev : m.ancRev * ancShares[i];
                  return (
                    <div key={s[0]} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "6px 0", borderBottom: `1px dotted ${LINE}`, gap: 10 }}>
                      <span style={{ fontSize: 13, color: INK }}>{i + 1}. {s[0]} <span style={{ color: MUT, fontSize: 10.5 }}>· {s[1]}</span></span>
                      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12.5, color: i < 2 ? BONE : INK, whiteSpace: "nowrap" }}>Rp {fmt(val, 1)}</span>
                    </div>
                  );
                });
              })()}
              <Foot>Memberships and PT carry the model alone (the conservative case). The seven lifestyle streams — HYROX, yoga/pilates, recovery, fuel bar, retail, corporate, community — fold into the ancillary line as illustrative shares and represent the compound's real upside.</Foot>
            </Card>
            <Card id="plS">
              <H right={<span style={{ fontSize: 11, color: pos ? STEEL : EMBER }}>{pos ? "in the black" : "in the red"}</span>}>P&L & Break-even</H>
              <Row l="Total revenue" v={`Rp ${fmt(m.totalRev, 0)}`} />
              <Row l="Payment fees" v={`− ${fmt(m.payFees, 1)}`} sub dim />
              <Row l="Fixed OPEX" v={`− ${fmt(m.fixedOpex, 1)}`} sub dim />
              <Row l="Operating profit (pre-bonus)" v={`Rp ${fmt(m.prebonus, 0)}`} strong />
              <Row l="Performance bonuses (variable)" v={`− ${fmt(m.bonusTotal, 1)}`} sub dim />
              <Row l="Net operating income" v={`Rp ${fmt(m.noi, 0)} jt`} color={pos ? STEEL : EMBER} strong />
              <div style={{ display: "flex", gap: 20, padding: "11px 0 12px", flexWrap: "wrap" }}>
                {[
                  ["Break-even (mbr-only)", `${fmt(m.beMemMembership, 0)} mbrs`, "conservative"],
                  ["Break-even (blended)", `${fmt(m.beMemBlended, 0)} mbrs`, "incl. ancillary"],
                  ["NOI margin", `${fmt(m.noiMargin * 100, 0)}%`, "after bonuses"],
                  ["Capacity util", `${fmt(m.capUtil * 100, 0)}%`, `of ${fmt(m.maxMembers, 0)} max`],
                ].map(([l, v, s]) => (
                  <div key={l}>
                    <div style={{ fontSize: 9.5, color: MUT, textTransform: "uppercase", letterSpacing: ".07em" }}>{l}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 15, color: BONE }}>{v}</div>
                    <Foot>{s}</Foot>
                  </div>
                ))}
              </div>
              {/* member probe */}
              <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, letterSpacing: ".08em", textTransform: "uppercase", color: MUT, marginBottom: 6 }}>
                  <span>Member sensitivity</span><span style={{ fontFamily: "'IBM Plex Mono',monospace", color: BONE }}>{memberProbe} mbrs</span>
                </div>
                <input type="range" min={50} max={Math.max(600, Math.round(m.maxMembers))} step={5} value={memberProbe} onChange={(e) => setMemberProbe(+e.target.value)} style={{ width: "100%", accentColor: BONE }} />
                <div style={{ display: "flex", gap: 18, marginTop: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: MUT }}>Revenue <b style={{ color: INK, fontFamily: "'IBM Plex Mono',monospace" }}>Rp {fmt(m.probeRev, 0)}</b></span>
                  <span style={{ fontSize: 12, color: MUT }}>NOI <b style={{ color: m.probeNoi > 0 ? STEEL : EMBER, fontFamily: "'IBM Plex Mono',monospace" }}>Rp {fmt(m.probeNoi, 0)}</b></span>
                  <span style={{ fontSize: 12, color: MUT }}>Rev/OPEX <b style={{ color: m.probeRatio >= 2 ? STEEL : INK, fontFamily: "'IBM Plex Mono',monospace" }}>{fmt(m.probeRatio, 2)}×</b></span>
                </div>
              </div>
            </Card>

            {/* CAPEX & FUNDING */}
            <Card id="capexS">
              <H right={<span style={{ fontSize: 11, color: MUT }}>one-time · Rp jt</span>}>CAPEX & Funding</H>
              <Row l="Facility buildout" v={`Rp ${fmt(m.facilityBuildout, 0)}`} strong />
              <Row l="Equipment (Hyrox + S&C + gym)" v={`Rp ${fmt(m.equipment, 0)}`} strong />
              <Row l="Other setup (legal + tech)" v={`Rp ${fmt(m.otherSetup, 0)}`} strong />
              <Row l="Total CAPEX" v={`Rp ${fmt(m.totalCapex, 0)} jt`} color={BONE} strong />
              <div style={{ height: 6 }} />
              <Row l="Pre-opening expenses" v={`+ ${fmt(a.preopening, 0)}`} sub dim />
              <Row l={`Working capital (${a.wc_months}mo × OPEX)`} v={`+ ${fmt(m.workingCapital, 0)}`} sub dim />
              <Row l={`Contingency (${fmt(a.contingency_pct * 100, 0)}%)`} v={`+ ${fmt(m.contingency, 0)}`} sub dim />
              <Row l="Total funding required" v={`Rp ${fmt(m.totalFunding, 0)} jt`} color={BONE} strong />
              <Row l="" v={`≈ Rp ${fmt(m.totalFunding / 1000, 2)} Billion`} dim />
              <Foot>Working capital floats with live OPEX. Equipment de-duplicated (the ~638 Hyrox double-count in the original is removed), landing funding near the deck's ~8B target.</Foot>
            </Card>

            {/* OPEX */}
            <Card id="opexS">
              <H right={<span style={{ fontSize: 11, color: MUT }}>drag to scale · /mo</span>}>OPEX · Rp {fmt(m.fixedOpex, 0)} jt</H>
              <Row l="People (payroll + statutory)" v={`Rp ${fmt(m.peopleTotal, 1)}`} strong />
              <ScaleRow gkey="fac" label="Facility" base={m.facilityBase * m.bm} />
              <ScaleRow gkey="mkt" label="Marketing" base={m.marketingBase * m.bm} />
              <ScaleRow gkey="tech" label="Technology" base={m.techBase * m.bm} />
              <ScaleRow gkey="adm" label="Admin & insurance" base={m.adminBase * m.bm} />
              <Row l="Total fixed OPEX" v={`Rp ${fmt(m.fixedOpex, 1)} jt`} color={BONE} strong />
              <Foot>Drag any group left to cut it, right to invest — the slider scales every line inside it. People is fixed here (set headcount in the control panel). Funding, NOI, break-even and the ramp all follow instantly.</Foot>
            </Card>

            {/* 24-MONTH RAMP */}
            <Card id="rampS">
              <H right={<span style={{ fontSize: 11, color: m.cashPosM ? STEEL : EMBER }}>{m.cashPosM ? `cash-positive M${m.cashPosM}` : "never recovers — adjust"}</span>}>24-Month Ramp</H>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 120, marginBottom: 4 }}>
                {m.ramp.map((x) => (
                  <div key={x.mo} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                    <div title={`M${x.mo}: ${x.members} mbrs · rev ${fmt(x.rev, 0)} · NOI ${fmt(x.mNoi, 0)}`}
                      style={{ height: `${x.rev / maxBar * 100}%`, background: x.mNoi > 0 ? STEEL : EMBER, borderRadius: "1px 1px 0 0", opacity: x.mo % 12 === 0 ? 1 : 0.7 }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 2, fontSize: 8, color: MUT, marginBottom: 11 }}>
                {m.ramp.map(x => <div key={x.mo} style={{ flex: 1, textAlign: "center" }}>{x.mo % 3 === 0 || x.mo === 1 ? x.mo : ""}</div>)}
              </div>
              <Row l="NOI turns positive" v={m.noiPosM ? `Month ${m.noiPosM}` : "—"} color={m.noiPosM ? STEEL : EMBER} dim />
              <Row l="Cumulative cash positive" v={m.cashPosM ? `Month ${m.cashPosM}` : "—"} color={m.cashPosM ? STEEL : EMBER} dim />
              <Row l="Year-2 (M24) cumulative NOI" v={`Rp ${fmt(m.y2cum, 0)} jt`} color={m.y2cum > 0 ? STEEL : EMBER} strong />
              <Row l="% funding recovered by M24" v={`${fmt(m.fundingRec * 100, 0)}%`} dim />
              <Foot>Members grow linearly founding → target over the ramp window. Months 1–6 buildout are funded separately (pre-opening + working capital).</Foot>
            </Card>

            {/* PERFORMANCE COMP */}
            <Card id="compS">
              <H right={<span style={{ fontSize: 11, color: MUT }}>at target · /mo</span>}>Performance Comp</H>
              <Row l="Amelie — revenue share (2%)" v={`Rp ${fmt(m.bAmelieRev, 1)}`} sub dim />
              <Row l="Amelie — retention kicker" v={`Rp ${fmt(m.bAmelieKick, 1)}`} sub dim />
              <Row l="Coach — PT commission (35% PT)" v={`Rp ${fmt(m.bCoachPT, 1)}`} sub dim />
              <Row l="Coach — performance pool (2% mbr)" v={`Rp ${fmt(m.bCoachPool, 1)}`} sub dim />
              <Row l="Edward — profit kicker (1%)" v={`Rp ${fmt(m.bEdward, 1)}`} sub dim />
              <Row l="Total performance bonuses" v={`Rp ${fmt(m.bonusTotal, 1)} jt`} color={BONE} strong />
              <Foot>Philosophy: base = security · variable = hunger (uncapped, own-lever only) · equity = ownership. Bonuses self-fund from the revenue they create.</Foot>
            </Card>

            <div style={{ fontSize: 10.5, color: MUT, lineHeight: 1.7, padding: "2px 4px" }}>
              <span style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 700, color: INK, letterSpacing: ".06em" }}>MODEL · </span>
              Ported from the HYROX Master Operating Model. Edit any driver — every ledger recomputes. Break-even shown membership-only (conservative); ancillary pulls the real 2× milestone forward. Capacity is a sanity ceiling, not a revenue driver.
            </div>
          </div>
        </div>
      </div>

      {/* ── TEAM / ASK / CLOSE ── */}
      <div style={{ position: "relative", zIndex: 2, maxWidth: 1080, margin: "0 auto", padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 20 }}>
        <Card id="team">
          <H right={<span style={{ fontSize: 11, color: MUT }}>operators, not landlords</span>}>The Team</H>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14, marginTop: 2 }}>
            {[
              ["Amelie Poerwoko", "CEO · Operations", "Runs the floor and the P&L — member experience, retention, and the day-to-day that turns a build into a business.", false],
              ["Edward Triharto", "Design · Buildout", "Owns the compound from drawing to doors-open — the capital discipline that keeps the build lean and on budget.", false],
              ["TOMS", "Operator · Backer", "The venture platform behind SIRA — systems, brand, and capital strategy across a portfolio of sport and lifestyle ventures.", true],
            ].map((p) => (
              <div key={p[0]} style={{ background: SURF2, border: `1px solid ${LINE}`, padding: "18px 17px" }}>
                <div style={{ fontFamily: p[3] ? "'Caveat',cursive" : "'Archivo',sans-serif", fontWeight: p[3] ? 700 : 800, fontSize: p[3] ? 28 : 18, letterSpacing: "-.01em", color: INK }}>{p[0]}</div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, color: EMBER, letterSpacing: ".05em", marginTop: 3, textTransform: "uppercase" }}>{p[1]}</div>
                <p style={{ fontSize: 13, lineHeight: 1.55, color: "#4A4638", marginTop: 11 }}>{p[2]}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card id="ask">
          <H right={<span style={{ fontSize: 11, color: MUT }}>use of funds</span>}>The Ask</H>
          <p style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 800, fontSize: 24, lineHeight: 1.15, letterSpacing: "-.01em", color: BONE, margin: "2px 0 0" }}>
            Raising Rp 7.99–10.20 billion to open the compound.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 1, background: LINE, marginTop: 18, border: `1px solid ${LINE}` }}>
            {[
              ["Facility buildout", "Two-level fit-out — structural, MEP, HVAC, lockers, the lot"],
              ["Equipment", "HYROX zone · strength & conditioning · conventional floor"],
              ["Pre-opening + working capital", "Launch, hiring, and six months of runway built in"],
              ["12% contingency", "Reserve sized into the raise, not hoped for after"],
            ].map((u) => (
              <div key={u[0]} style={{ background: SURF2, padding: "16px 15px" }}>
                <div style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 700, fontSize: 14, color: INK }}>{u[0]}</div>
                <div style={{ fontSize: 12, color: MUT, marginTop: 5, lineHeight: 1.5 }}>{u[1]}</div>
              </div>
            ))}
          </div>
          <Foot>In return: a ~55% operating margin, capital back in under 25 months, and a brand designed to franchise. The first compound proves the model — the model is the asset. Every figure above is live in the model; move the capital lever to see the band.</Foot>
        </Card>

        <div style={{ textAlign: "center", padding: "20px 0 54px" }}>
          <div style={{ fontFamily: "'Anton',sans-serif", fontSize: 30, color: BONE, letterSpacing: ".02em" }}>SIRA</div>
          <div style={{ fontFamily: "'Archivo',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".28em", textTransform: "uppercase", color: MUT, marginTop: 2 }}>Muscle Studios</div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: MUT, letterSpacing: ".1em", marginTop: 12 }}>STRENGTH · INTENSITY · RECOVERY · AGILITY</div>
          <div style={{ fontSize: 12, color: MUT, marginTop: 12 }}>operated by <span style={{ fontFamily: "'Caveat',cursive", fontSize: 17, color: INK }}>TOMS</span> · Cilandak, South Jakarta</div>
        </div>
      </div>
    </div>
  );
}
