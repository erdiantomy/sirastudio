import { useState, useMemo, useEffect, useRef } from "react";

/* ══════════════════════════════════════════════════════════════
   SIRA MUSCLE STUDIOS · Investor Pitch
   A walk through the compound. Lifestyle on warm stone;
   numbers on cold blueprint. One capital lever moves both.
   ══════════════════════════════════════════════════════════════ */

/* ── tokens · travertine + dusk-brass + blueprint ── */
const STONE = "#E6DFD0";   // warm limestone ground
const PAPER = "#F0EBDE";   // lighter stone panel
const INK   = "#221E17";   // charcoal ink
const MUT   = "#8B8268";   // warm taupe
const BRASS = "#B5854A";   // dusk interior glow — the one accent
const ESP   = "#15110D";   // blueprint / espresso panel
const BONE  = "#F3EFE4";   // text on espresso
const LINE  = "#D2C9B4";   // warm hairline
const HAIR  = "rgba(243,239,228,0.16)"; // blueprint hairline

const FUND_BASE_B = 7.991872;
const CAP_MIN = 7.99, CAP_MAX = 10.20;

const fmt = (v, d = 0) => v == null || !isFinite(v) ? "∞" :
  v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

/* base assumptions — identical to the operating model */
const BASE = {
  arpu: 1.5, pt: 0.25, anc: 0.2, founding: 80, target: 300, ramp: 12,
  classSize: 24, perDay: 8, days: 30, visits: 12,
  people: 116.1, fac: 45, mkt: 19, tech: 7, adm: 18,
  feePct: 0.01, capexBase: 5505, preopen: 400, wcMonths: 6, contPct: 0.12,
  amelieRev: 0.02, kicker: 3, coachPT: 0.35, coachPool: 0.02, edward: 0.01,
};

function model(capitalB) {
  const bm = capitalB / FUND_BASE_B;
  const tgt = BASE.target * bm, fnd = BASE.founding * bm;
  const opex = (BASE.people + BASE.fac + BASE.mkt + BASE.tech + BASE.adm) * bm;
  const mem = tgt * BASE.arpu, pt = tgt * BASE.pt, anc = tgt * BASE.anc;
  const rev = mem + pt + anc;
  const fees = BASE.feePct * rev, pre = rev - fees - opex;
  const bonus = BASE.amelieRev * rev + BASE.kicker * bm + BASE.coachPT * pt + BASE.coachPool * mem + BASE.edward * Math.max(0, pre);
  const noi = pre - bonus;
  const margin = rev > 0 ? noi / rev : 0;
  const capex = BASE.capexBase * bm;
  const wc = BASE.wcMonths * opex;
  const funding = (capex + BASE.preopen * bm + wc) * (1 + BASE.contPct);
  const payback = noi > 0 ? funding / noi : Infinity;
  const beMembers = opex / BASE.arpu;
  const maxMembers = BASE.classSize * BASE.perDay * BASE.days / BASE.visits * bm;
  // 24-mo ramp → cash-positive month
  let cum = 0, cashM = null, noiM = null;
  for (let mo = 1; mo <= 24; mo++) {
    const members = Math.min(tgt, Math.round(fnd + (tgt - fnd) * mo / BASE.ramp));
    const r = members * (BASE.arpu + BASE.pt + BASE.anc);
    const f = BASE.feePct * r;
    const b = BASE.amelieRev * r + (members >= tgt * 0.7 ? BASE.kicker : 0) + BASE.coachPT * members * BASE.pt + BASE.coachPool * members * BASE.arpu + BASE.edward * Math.max(0, r - f - opex);
    const mn = r - f - opex - b;
    cum += mn;
    if (noiM === null && mn > 0) noiM = mo;
    if (cashM === null && cum > 0) cashM = mo;
  }
  return { bm, tgt, rev, noi, margin, funding, payback, beMembers, maxMembers, capex, opex, mem, pt, anc, cashM, noiM };
}

/* scroll-reveal hook */
function useReveal() {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.16 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return [ref, seen];
}
const Reveal = ({ children, d = 0, style }) => {
  const [ref, seen] = useReveal();
  return <div ref={ref} style={{ opacity: seen ? 1 : 0, transform: seen ? "none" : "translateY(22px)", transition: `opacity .7s ease ${d}s, transform .7s cubic-bezier(.2,.7,.2,1) ${d}s`, ...style }}>{children}</div>;
};

const ZONES = [
  ["strength", "Strength", "Plate-loaded racks, platforms, free weights. The floor that anchors the membership.", "Level 1"],
  ["functional", "Functional · HYROX", "A regulation sled track and rig. The format Jakarta is searching for and can't yet find.", "Level 1"],
  ["fuelbar", "Fuel Bar", "Protein, cold brew, single-origin kopi. Where a workout becomes a habit and a hangout.", "Level 1"],
  ["retail", "Retail", "Apparel and supplements, merchandised like a boutique. Margin on every visit.", "Level 1"],
  ["yoga", "Yoga · Pilates", "A light-filled studio upstairs. Mobility, breath, and a second membership tier.", "Level 2"],
  ["recovery", "Recovery", "Sauna, cold plunge, contrast. Discipline · focus · freedom — and a premium add-on.", "Level 2"],
  ["lounge", "Community Lounge", "The room people stay in. Events, co-working, belonging — the retention moat.", "Level 2"],
];

const STREAMS = [
  ["Memberships", "Recurring base — the engine"],
  ["Personal training", "1:1 coaching, high yield"],
  ["HYROX / functional", "Race-format group classes"],
  ["Yoga / Pilates", "Level-2 studio tier"],
  ["Recovery", "Sauna · cold plunge · contrast"],
  ["Fuel Bar", "F&B · protein · kopi"],
  ["Retail", "Apparel · supplements"],
  ["Corporate / events", "Team blocks · activations"],
  ["Community / space", "Lounge · rentals · hosting"],
];

export default function App() {
  const [capital, setCapital] = useState(7.99);
  const m = useMemo(() => model(capital), [capital]);

  const Eyebrow = ({ children, dark }) => (
    <div style={{ fontFamily: "'Archivo',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".28em", textTransform: "uppercase", color: dark ? BRASS : MUT, marginBottom: 16 }}>{children}</div>
  );
  const Plate = ({ k, v, sub }) => (
    <div style={{ border: `1px solid ${HAIR}`, padding: "16px 16px 14px", position: "relative" }}>
      <div style={{ position: "absolute", top: 6, right: 8, fontFamily: "'IBM Plex Mono',monospace", fontSize: 8.5, color: "rgba(243,239,228,0.3)" }}>┐</div>
      <div style={{ fontFamily: "'Archivo',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(243,239,228,0.5)" }}>{k}</div>
      <div style={{ fontFamily: "'Archivo',sans-serif", fontSize: 30, fontWeight: 800, color: BONE, lineHeight: 1.05, marginTop: 4 }}>{v}</div>
      {sub && <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, color: BRASS, marginTop: 3 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ background: STONE, color: INK, fontFamily: "'IBM Plex Sans',sans-serif", overflowX: "hidden" }}>
      <style>{`
        *{margin:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        body{background:${STONE}}
        ::selection{background:${INK};color:${STONE}}
        input[type=range]{-webkit-appearance:none;background:rgba(243,239,228,.18);border-radius:3px;height:4px;cursor:pointer;touch-action:none}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:26px;height:26px;border-radius:50%;background:${BRASS};border:3px solid ${ESP};box-shadow:0 0 0 1px ${BRASS};cursor:grab}
        input[type=range]::-webkit-slider-thumb:active{cursor:grabbing;transform:scale(1.12)}
        input[type=range]::-moz-range-thumb{width:26px;height:26px;border-radius:50%;background:${BRASS};border:3px solid ${ESP};cursor:grab}
        a{color:inherit}
        .wrap{max-width:1080px;margin:0 auto;padding:0 22px}
        .sec{padding:84px 0}
        @media(max-width:760px){.sec{padding:58px 0} .h1{font-size:40px !important} .lede{font-size:18px !important}}
      `}</style>

      {/* ── HERO ── */}
      <header style={{ position: "relative", minHeight: "92vh", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <img src="/hero.jpg" alt="SIRA Muscle Studios compound at dusk" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(21,17,13,.34) 0%, rgba(21,17,13,0) 30%, rgba(21,17,13,.5) 72%, rgba(21,17,13,.92) 100%)` }} />
        <div className="wrap" style={{ position: "relative", paddingBottom: 54, paddingTop: 24 }}>
          <div style={{ fontFamily: "'Archivo',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".3em", textTransform: "uppercase", color: BRASS, marginBottom: 18 }}>SIRA Muscle Studios · Investor Pitch</div>
          <h1 className="h1" style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 900, fontSize: 58, lineHeight: 0.98, letterSpacing: "-.01em", color: BONE, maxWidth: 820 }}>
            Jakarta's first capital-efficient Muscle Studios compound.
          </h1>
          <p className="lede" style={{ fontSize: 20, lineHeight: 1.5, color: "rgba(243,239,228,.86)", maxWidth: 620, marginTop: 22, fontWeight: 300 }}>
            A 750 m² strength-and-recovery destination in Cilandak, South Jakarta. Nine revenue streams under one roof. ~55% operating margin. Capital returned in under 25 months.
          </p>
          <div style={{ display: "flex", gap: 26, marginTop: 30, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "'Archivo',sans-serif", fontSize: 34, fontWeight: 800, color: BONE, lineHeight: 1 }}>Rp 7.99–10.20<span style={{ fontSize: 18, color: BRASS }}> B</span></div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, color: "rgba(243,239,228,.6)", letterSpacing: ".08em", marginTop: 4 }}>CAPITAL · LEAN → PREMIUM BUILD</div>
            </div>
            <div style={{ width: 1, height: 38, background: HAIR }} />
            <div style={{ fontSize: 13, color: "rgba(243,239,228,.7)", lineHeight: 1.5, maxWidth: 260 }}>
              Strength · Intensity · Recovery · Agility<br />
              <span style={{ color: "rgba(243,239,228,.5)" }}>operated by </span><span style={{ fontFamily: "'Caveat',cursive", fontSize: 19, color: BONE }}>TOMS</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── THESIS ── */}
      <section className="sec" style={{ background: STONE }}>
        <div className="wrap">
          <Reveal>
            <Eyebrow>The thesis</Eyebrow>
            <p style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 700, fontSize: 30, lineHeight: 1.22, letterSpacing: "-.005em", maxWidth: 880 }}>
              Jakarta has gyms and it has boutiques. It does not have a <em style={{ fontStyle: "normal", color: BRASS }}>compound</em> — one address where strength, the HYROX format, recovery, food, and community compound on each other instead of competing for the same rent.
            </p>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "#4A4436", maxWidth: 680, marginTop: 22, fontWeight: 300 }}>
              SIRA is built lean on purpose. The same square metre that sells a membership also sells a protein shake, a recovery session, a t-shirt, and a corporate block. Every stream shares one roof, one team, and one fixed cost base — which is why the unit economics hold whether we deploy 7.99 or 10.20 billion.
            </p>
          </Reveal>
          <Reveal d={0.1} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 1, background: LINE, marginTop: 46, border: `1px solid ${LINE}` }}>
            {[["9", "revenue streams", "one fixed cost base"], ["~55%", "operating margin", "after performance comp"], ["<25 mo", "capital payback", "at steady state"], ["750 m²", "Cilandak", "two levels, one compound"]].map(([v, k, s]) => (
              <div key={k} style={{ background: PAPER, padding: "22px 18px" }}>
                <div style={{ fontFamily: "'Archivo',sans-serif", fontSize: 32, fontWeight: 800, color: INK, lineHeight: 1 }}>{v}</div>
                <div style={{ fontFamily: "'Archivo',sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: INK, marginTop: 8 }}>{k}</div>
                <div style={{ fontSize: 12, color: MUT, marginTop: 3 }}>{s}</div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── THE COMPOUND ── */}
      <section className="sec" style={{ background: PAPER, borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}>
        <div className="wrap">
          <Reveal>
            <Eyebrow>Walk the compound</Eyebrow>
            <h2 style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 800, fontSize: 38, letterSpacing: "-.01em", lineHeight: 1.05, maxWidth: 720 }}>
              Seven zones. Two levels. Each one earns.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "#4A4436", maxWidth: 640, marginTop: 16, fontWeight: 300 }}>
              The building is the business model. A member arrives for one zone and spends across four. Here is what they walk into.
            </p>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(248px,1fr))", gap: 18, marginTop: 40 }}>
            {ZONES.map((z, i) => (
              <Reveal key={z[0]} d={(i % 3) * 0.07}>
                <div style={{ background: STONE, border: `1px solid ${LINE}`, overflow: "hidden", height: "100%" }}>
                  <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden" }}>
                    <img src={`/zone-${z[0]}.jpg`} alt={z[1]} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <span style={{ position: "absolute", top: 10, left: 10, background: ESP, color: BONE, fontFamily: "'IBM Plex Mono',monospace", fontSize: 9.5, letterSpacing: ".1em", padding: "3px 8px" }}>{z[3]}</span>
                  </div>
                  <div style={{ padding: "15px 16px 18px" }}>
                    <div style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 800, fontSize: 17, letterSpacing: ".01em", textTransform: "uppercase" }}>{z[1]}</div>
                    <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "#4A4436", marginTop: 6, fontWeight: 300 }}>{z[2]}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── NINE REVENUE STREAMS ── */}
      <section className="sec" style={{ background: STONE }}>
        <div className="wrap">
          <Reveal>
            <Eyebrow>How it earns</Eyebrow>
            <h2 style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 800, fontSize: 38, letterSpacing: "-.01em", lineHeight: 1.05, maxWidth: 760 }}>
              Nine ways to monetise one membership.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "#4A4436", maxWidth: 640, marginTop: 16, fontWeight: 300 }}>
              Memberships and personal training carry the model alone — that's the conservative case the break-even is built on. The other seven are the upside the compound was designed to capture.
            </p>
          </Reveal>
          <Reveal d={0.08} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 1, background: LINE, marginTop: 40, border: `1px solid ${LINE}` }}>
            {STREAMS.map((s, i) => (
              <div key={s[0]} style={{ background: PAPER, padding: "18px 18px 20px", display: "flex", gap: 12 }}>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: BRASS, fontWeight: 600, paddingTop: 2 }}>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <div style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 700, fontSize: 15 }}>{s[0]}</div>
                  <div style={{ fontSize: 12.5, color: MUT, marginTop: 3, lineHeight: 1.45 }}>{s[1]}</div>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── THE NUMBERS (blueprint, interactive) ── */}
      <section className="sec" style={{ background: ESP, color: BONE }}>
        <div className="wrap">
          <Reveal>
            <Eyebrow dark>The numbers</Eyebrow>
            <h2 style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 800, fontSize: 38, letterSpacing: "-.01em", lineHeight: 1.05, color: BONE, maxWidth: 760 }}>
              Move the capital. Watch everything follow.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(243,239,228,.7)", maxWidth: 620, marginTop: 16, fontWeight: 300 }}>
              One lever scales the whole build — facility, equipment, capacity, members, operating cost and funding all move together. The unit economics don't budge; only the scale does.
            </p>
          </Reveal>

          <Reveal d={0.08} style={{ marginTop: 40, border: `1px solid ${HAIR}`, padding: "26px 22px 24px", position: "relative" }}>
            <div style={{ position: "absolute", top: 8, left: 10, fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "rgba(243,239,228,.32)", letterSpacing: ".1em" }}>CAPITAL PLAN · LIVE</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10 }}>
              <div style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 900, fontSize: 52, lineHeight: 0.9 }}>Rp {fmt(capital, 2)}<span style={{ fontSize: 22, color: BRASS }}> B</span></div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: BRASS }}>build ×{fmt(m.bm, 3)}</div>
            </div>
            <input type="range" min={CAP_MIN} max={CAP_MAX} step={0.01} value={capital} onChange={(e) => setCapital(+e.target.value)} style={{ width: "100%", marginTop: 18 }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "rgba(243,239,228,.5)", marginTop: 6 }}>
              <span>Rp {fmt(CAP_MIN, 2)}B · lean</span><span>premium · Rp {fmt(CAP_MAX, 2)}B</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(146px,1fr))", gap: 1, background: HAIR, marginTop: 24, border: `1px solid ${HAIR}` }}>
              <Plate k="Funding required" v={`Rp ${fmt(m.funding / 1000, 2)}B`} sub="= capital deployed" />
              <Plate k="Members at scale" v={fmt(m.tgt)} sub={`of ${fmt(m.maxMembers)} capacity`} />
              <Plate k="Revenue / mo" v={`Rp ${fmt(m.rev)}`} sub="jt, steady state" />
              <Plate k="NOI / mo" v={`Rp ${fmt(m.noi)}`} sub={`${fmt(m.margin * 100)}% margin`} />
              <Plate k="Payback" v={`${fmt(m.payback)} mo`} sub="constant across band" />
              <Plate k="Cash-positive" v={m.cashM ? `M${m.cashM}` : "—"} sub="cumulative" />
            </div>
            <div style={{ fontSize: 12.5, color: "rgba(243,239,228,.62)", marginTop: 18, lineHeight: 1.6, maxWidth: 760 }}>
              At <b style={{ color: BONE }}>Rp 7.99B</b> SIRA runs lean — ~300 members, breakeven at {fmt(m.beMembers)} on memberships alone. At <b style={{ color: BONE }}>Rp 10.20B</b> it's the full compound in the render — ~383 members, the same ~55% margin, the same sub-25-month payback. <span style={{ color: BRASS }}>Capital chooses the scale; the model proves it scales.</span>
            </div>
          </Reveal>

          <Reveal d={0.12} style={{ marginTop: 18, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "rgba(243,239,228,.45)", lineHeight: 1.7 }}>
            Conservative by construction — break-even is computed on memberships only, with PT and the seven lifestyle streams as upside. Full interactive operating model at <a href="https://siragym.vercel.app" style={{ color: BRASS, textDecoration: "none" }}>siragym.vercel.app →</a>
          </Reveal>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section className="sec" style={{ background: STONE }}>
        <div className="wrap">
          <Reveal><Eyebrow>Who builds it</Eyebrow>
            <h2 style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 800, fontSize: 38, letterSpacing: "-.01em", lineHeight: 1.05 }}>Operators, not landlords.</h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 18, marginTop: 36 }}>
            {[
              ["Amelie Poerwoko", "CEO · Operations", "Runs the floor and the P&L — member experience, retention, and the day-to-day that turns a build into a business."],
              ["Edward Triharto", "Design · Buildout", "Owns the compound from drawing to doors-open — the capital discipline that keeps the build lean and on-budget."],
              ["TOMS", "Operator · Backer", "The venture platform behind SIRA — systems, brand, and capital strategy across a portfolio of sport and lifestyle ventures."],
            ].map((p, i) => (
              <Reveal key={p[0]} d={i * 0.07}>
                <div style={{ background: PAPER, border: `1px solid ${LINE}`, padding: "24px 22px", height: "100%" }}>
                  <div style={{ fontFamily: p[0] === "TOMS" ? "'Caveat',cursive" : "'Archivo',sans-serif", fontWeight: p[0] === "TOMS" ? 700 : 800, fontSize: p[0] === "TOMS" ? 30 : 20, letterSpacing: "-.01em" }}>{p[0]}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: BRASS, letterSpacing: ".06em", marginTop: 4, textTransform: "uppercase" }}>{p[1]}</div>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: "#4A4436", marginTop: 14, fontWeight: 300 }}>{p[2]}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE ASK ── */}
      <section className="sec" style={{ background: ESP, color: BONE }}>
        <div className="wrap">
          <Reveal><Eyebrow dark>The ask</Eyebrow>
            <h2 style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 900, fontSize: 46, letterSpacing: "-.01em", lineHeight: 1.0, color: BONE, maxWidth: 780 }}>
              Raising Rp 7.99–10.20 billion to open the compound.
            </h2>
          </Reveal>
          <Reveal d={0.08} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 1, background: HAIR, marginTop: 38, border: `1px solid ${HAIR}` }}>
            {[
              ["Facility buildout", "Two-level fit-out — structural, MEP, HVAC, lockers, the lot"],
              ["Equipment", "HYROX zone · strength & conditioning · conventional floor"],
              ["Pre-opening + working capital", "Launch, hiring, and six months of runway built in"],
              ["12% contingency", "Reserve sized into the raise, not hoped for after"],
            ].map((u) => (
              <div key={u[0]} style={{ background: "rgba(243,239,228,.03)", padding: "20px 18px" }}>
                <div style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 700, fontSize: 15, color: BONE }}>{u[0]}</div>
                <div style={{ fontSize: 12.5, color: "rgba(243,239,228,.6)", marginTop: 6, lineHeight: 1.5 }}>{u[1]}</div>
              </div>
            ))}
          </Reveal>
          <Reveal d={0.14} style={{ marginTop: 30, fontSize: 17, lineHeight: 1.7, color: "rgba(243,239,228,.82)", maxWidth: 680, fontWeight: 300 }}>
            In return: a ~55% operating margin, capital back in under 25 months, and a brand designed to franchise. The first compound proves the model. The model is the asset.
          </Reveal>
        </div>
      </section>

      {/* ── CLOSE ── */}
      <footer style={{ background: STONE, padding: "70px 22px 56px", textAlign: "center", borderTop: `1px solid ${LINE}` }}>
        <div style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 900, fontSize: 30, letterSpacing: ".02em" }}>SIRA</div>
        <div style={{ fontFamily: "'Archivo',sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: ".26em", textTransform: "uppercase", color: MUT, marginTop: 4 }}>Muscle Studios</div>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: MUT, letterSpacing: ".1em", marginTop: 16 }}>STRENGTH · INTENSITY · RECOVERY · AGILITY</div>
        <div style={{ fontSize: 12.5, color: MUT, marginTop: 18 }}>operated by <span style={{ fontFamily: "'Caveat',cursive", fontSize: 18, color: INK }}>TOMS</span> · Cilandak, South Jakarta</div>
        <div style={{ fontSize: 12, color: MUT, marginTop: 14 }}>The numbers, live → <a href="https://siragym.vercel.app" style={{ color: BRASS, textDecoration: "none" }}>siragym.vercel.app</a></div>
      </footer>
    </div>
  );
}
