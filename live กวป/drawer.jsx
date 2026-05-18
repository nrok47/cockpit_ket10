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
              <div className="dh-l">ผลรอบก่อน</div>
              <div className="dh-v" style={{ fontWeight: 500, color: "#3F3933" }}>
                {kpi.trend[kpi.trend.length - 2].toFixed(1)}<span className="dh-u">%</span>
              </div>
            </div>
            <div className="dh-stat">
              <div className="dh-l">เปลี่ยนแปลง</div>
              <div className="dh-v"><Delta trend={kpi.trend} /></div>
            </div>
          </div>
        </div>

        <div className="drawer-section">
          <div className="ds-head">
            <h3>แนวโน้มย้อนหลัง 5 รอบ</h3>
            <span className="ds-sub">ข้อมูลรายไตรมาส</span>
          </div>
          <BigTrend trend={kpi.trend} target={kpi.target} status={kpi.status} invert={kpi.invert} />
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
          <button className="btn ghost">ดาวน์โหลด CSV</button>
          <button className="btn primary">เปิดรายงานเต็ม →</button>
        </div>
      </aside>
    </>
  );
}

function BigTrend({ trend, target, status, invert }) {
  const W = 520, H = 180, padL = 40, padR = 12, padT = 16, padB = 28;
  const lo = Math.min(target * 0.6, ...trend) - 5;
  const hi = Math.max(target * 1.1, ...trend) + 5;
  const x = i => padL + (i * (W - padL - padR)) / (trend.length - 1);
  const y = v => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);
  const labels = ["Q2/67","Q3/67","Q4/67","Q1/68","Q2/68"];
  const path = trend.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${path} L${x(trend.length - 1)},${H - padB} L${padL},${H - padB} Z`;
  const col = STATUS_COLORS[status].ring;
  const ticks = [lo, lo + (hi - lo) * 0.5, hi];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="#EFEAE3" strokeDasharray="3 3" />
          <text x={padL - 6} y={y(t) + 3} textAnchor="end" style={{ font: "500 10px 'IBM Plex Sans'", fill: "#9C948A" }}>{t.toFixed(0)}</text>
        </g>
      ))}
      <line x1={padL} x2={W - padR} y1={y(target)} y2={y(target)} stroke="#161310" strokeDasharray="6 4" strokeWidth="1" opacity="0.45" />
      <text x={W - padR - 4} y={y(target) - 6} textAnchor="end" style={{ font: "600 10px 'IBM Plex Sans'", fill: "#161310" }}>เป้า {target}%</text>
      <path d={area} fill={col} opacity="0.12" />
      <path d={path} fill="none" stroke={col} strokeWidth="2" />
      {trend.map((v, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(v)} r="4" fill="#FFF" stroke={col} strokeWidth="2" />
          <text x={x(i)} y={y(v) - 10} textAnchor="middle" style={{ font: "600 10px 'IBM Plex Sans'", fill: "#161310" }}>{v.toFixed(1)}</text>
          <text x={x(i)} y={H - 8} textAnchor="middle" style={{ font: "500 10px 'IBM Plex Sans'", fill: "#7C746B" }}>{labels[i]}</text>
        </g>
      ))}
    </svg>
  );
}

Object.assign(window, { Drawer });
