// Drill-down drawer + district mini-table

function Drawer({ kpi, onClose }) {
  if (!kpi) return null;
  const p = PILLARS.find(x => x.id === kpi.pillar);
  const col = STATUS_COLORS[kpi.status];
  // Synthesize per-district values around the avg with variance
  const districtData = useMemo(() => {
    const seed = kpi.code.charCodeAt(4) * 13 + kpi.code.charCodeAt(5) * 7;
    return DISTRICTS.slice(0, kpi.regions).map((d, i) => {
      const noise = ((Math.sin(seed + i * 1.7) + 1) / 2) * 30 - 15;
      const v = Math.max(5, Math.min(100, kpi.v + noise));
      const status = kpi.invert
        ? (v <= kpi.target * 1.05 ? "g" : v <= kpi.target * 1.25 ? "y" : "r")
        : (v >= kpi.target * 0.95 ? "g" : v >= kpi.target * 0.75 ? "y" : "r");
      return { name: d, v, status };
    }).sort((a, b) => b.v - a.v);
  }, [kpi.code]);

  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer" key={kpi.code}>
        <div className="drawer-head">
          <div className="drawer-head-top">
            <span className="kpi-code" style={{ background: "#F2EEE8" }}>{kpi.code}</span>
            <span className="kpi-pillar" style={{ color: p.accent, background: `${p.accent}10`, borderColor: `${p.accent}30` }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: p.accent, display: "inline-block" }} />
              {p.code} · {p.name}
            </span>
            <button className="x" onClick={onClose}>✕</button>
          </div>
          <h2 className="drawer-title">{kpi.name}</h2>
          <div className="drawer-en">{kpi.en}</div>
        </div>

        <div className="drawer-hero">
          <div className="dh-ring">
            <StatusRing value={kpi.v} status={kpi.status} size={156} stroke={14} />
          </div>
          <div className="dh-stats">
            <div className="dh-stat">
              <div className="dh-l">ค่าเป้าหมาย</div>
              <div className="dh-v">{kpi.target}<span className="dh-u">%</span></div>
            </div>
            <div className="dh-stat">
              <div className="dh-l">ผลปัจจุบัน</div>
              <div className="dh-v" style={{ color: col.ring }}>{kpi.v.toFixed(1)}<span className="dh-u">%</span></div>
            </div>
            <div className="dh-stat">
              <div className="dh-l">ปี 2568</div>
              <div className="dh-v" style={{ fontWeight: 500, color: "#3F3933" }}>
                {kpi.v68 != null
                  ? <>{kpi.v68.toFixed(1)}<span className="dh-u">%</span></>
                  : <span style={{ fontSize: 14, color: "#9C948A" }}>—</span>}
              </div>
            </div>
            <div className="dh-stat">
              <div className="dh-l">เปลี่ยนแปลง vs 2568</div>
              <div className="dh-v">
                {kpi.v68 != null
                  ? <Delta trend={[kpi.v68, kpi.v69 ?? kpi.v]} />
                  : <span style={{ fontSize: 14, color: "#9C948A" }}>—</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="drawer-section">
          <div className="ds-head">
            <h3>เปรียบเทียบรายปี</h3>
            <span className="ds-sub">ปีงบประมาณ 2567 · 2568 · 2569</span>
          </div>
          <BigTrend trend={kpi.trend} target={kpi.target} status={kpi.status} />
        </div>

        <div className="drawer-section">
          <div className="ds-head">
            <h3>ผลรายอำเภอ</h3>
            <span className="ds-sub">{kpi.regions} อำเภอ · เรียงจากมากไปน้อย</span>
          </div>
          <div className="district-list">
            {districtData.map(d => (
              <div key={d.name} className="district-row">
                <StatusDot status={d.status} size={8} />
                <div className="d-name">อ.{d.name}</div>
                <div className="d-track">
                  <div className="d-fill" style={{ width: `${(d.v / 100) * 100}%`, background: STATUS_COLORS[d.status].ring }} />
                  <div className="d-target" style={{ left: `${kpi.target}%` }} />
                </div>
                <div className="d-val" style={{ color: STATUS_COLORS[d.status].text }}>{d.v.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="drawer-section">
          <div className="ds-head"><h3>ผู้รับผิดชอบ</h3></div>
          <div className="owner-card">
            <div className="oc-avatar">{kpi.owner.slice(0, 2)}</div>
            <div>
              <div className="oc-name">{kpi.owner}</div>
              <div className="oc-sub">หน่วยงานเจ้าภาพตัวชี้วัด · รายงานทุกไตรมาส</div>
            </div>
          </div>
        </div>

        <div className="drawer-section">
          <div className="ds-head"><h3>ข้อเสนอแนะที่ประชุม</h3></div>
          <ul className="notes">
            <li>มอบทีมเลขานุการลงพื้นที่อำเภอที่ผลต่ำกว่าเกณฑ์ภายใน 30 วัน</li>
            <li>ทบทวนแนวทางการบันทึกข้อมูลใน HDC ให้ครบถ้วน</li>
            <li>นำเสนอความก้าวหน้าครั้งต่อไปในการประชุม กวป. รอบหน้า</li>
          </ul>
        </div>

        <div className="drawer-foot">
          <button className="btn ghost" onClick={() => {
            const sheet = kpi.csvUrl?.split("sheet=")[1] ?? "";
            if (!sheet) return;
            const url = `https://docs.google.com/spreadsheets/d/1RlIRo8vZ0fgQOj-vVZ72P9ioUgxIY_WWQw4AfjNV_Pg/gviz/tq?tqx=out:csv&sheet=${sheet}`;
            Object.assign(document.createElement("a"), { href: url, download: `${kpi.code}.csv` }).click();
          }}>ดาวน์โหลด CSV</button>
          <button className="btn primary"
            onClick={() => {
              if (kpi.sourceUrl) window.open(kpi.sourceUrl, "_blank");
              else window.open(`report.html?kpi=${kpi.code}`, "_blank");
            }}>
            เปิดรายงานเต็ม →
          </button>
        </div>
      </aside>
    </>
  );
}

function BigTrend({ trend, target, status }) {
  // trend = [v2567, v2568, v2569]
  const [v67, v68, v69] = trend;
  const col   = STATUS_COLORS[status].ring;
  const W = 520, H = 175, pL = 46, pR = 20, pT = 34, pB = 36;
  const chartW = W - pL - pR, chartH = H - pT - pB;
  const maxV   = Math.max(target * 1.15, v67, v68, v69, 1);
  const yPos   = v => pT + chartH * (1 - v / maxV);
  const bW     = chartW * 0.18;
  const gap    = (chartW - bW * 3) / 4;
  const cx1    = pL + gap + bW / 2;
  const cx2    = pL + gap * 2 + bW * 1.5;
  const cx3    = pL + gap * 3 + bW * 2.5;
  const ticks  = [0, Math.round(maxV * 0.5), Math.round(maxV)];
  const targetY = yPos(target);
  const delta   = v69 - v68;
  const deltaUp = delta >= 0;

  const bar = (cx, v, fill, labelStyle, yr, isMain) => (
    <g key={yr}>
      <rect x={cx - bW / 2} y={yPos(v)} width={bW} height={(v / maxV) * chartH}
        rx="5" fill={fill} opacity={isMain ? 1 : 0.75} />
      <text x={cx} y={yPos(v) - 7} textAnchor="middle"
        style={{ font: `${isMain ? "700" : "600"} 11px 'IBM Plex Sans'`, fill: isMain ? "#161310" : "#475569" }}>
        {v.toFixed(1)}%
      </text>
      <text x={cx} y={H - pB + 16} textAnchor="middle" style={labelStyle}>{yr}</text>
    </g>
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={pL} x2={W - pR} y1={yPos(t)} y2={yPos(t)} stroke="#EFEAE3" strokeDasharray="3 3" />
          <text x={pL - 6} y={yPos(t) + 4} textAnchor="end"
            style={{ font: "500 10px 'IBM Plex Sans'", fill: "#9C948A" }}>{t}</text>
        </g>
      ))}
      <line x1={pL} x2={W - pR} y1={targetY} y2={targetY}
        stroke="#161310" strokeDasharray="5 4" strokeWidth="1.5" opacity="0.45" />
      <text x={W - pR - 4} y={targetY - 5} textAnchor="end"
        style={{ font: "600 10px 'IBM Plex Sans'", fill: "#161310" }}>เป้า {target}%</text>

      {bar(cx1, v67, "#CBD5E1", { font: "500 11px 'IBM Plex Sans'", fill: "#7C746B" }, "ปี 2567", false)}
      {bar(cx2, v68, "#94A3B8", { font: "500 11px 'IBM Plex Sans'", fill: "#475569" }, "ปี 2568", false)}
      {bar(cx3, v69, col,      { font: "700 12px 'IBM Plex Sans'", fill: "#161310" }, "ปี 2569", true)}

      <text x={W / 2} y={pT - 12} textAnchor="middle"
        style={{ font: "600 11.5px 'IBM Plex Sans'", fill: deltaUp ? "#1F8A5B" : "#C4452B" }}>
        {deltaUp ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}% จากปี 2568
      </text>
    </svg>
  );
}

Object.assign(window, { Drawer });
