// Main dashboard app for กวป.

const { useState, useMemo, useEffect } = React;

// ---------- HEADER ----------
function Header({ period, setPeriod }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="logo">
          <svg width="28" height="28" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="13" fill="#2F8F7A" />
            <path d="M14 6 L14 22 M6 14 L22 14" stroke="#FFF" strokeWidth="2.6" strokeLinecap="round"/>
            <circle cx="14" cy="14" r="3.2" fill="#FFF" />
          </svg>
        </div>
        <div className="brand">
          <div className="brand-title">เขตสุขภาพที่ 10 · Health Region 10</div>
          <div className="brand-sub">ระบบติดตามตัวชี้วัดสุขภาพ (DM/HT) · NCD Dashboard</div>
        </div>
      </div>
      <div className="topbar-right">
        <div className="period">
          <button className="chip on">ปี 2569</button>
          <button className="chip" style={{ opacity: .65 }}>vs 2568</button>
          <button className="chip" style={{ opacity: .5 }}>vs 2567</button>
        </div>
        <div className="meta">
          <div className="meta-l">ปีงบประมาณ</div>
          <div className="meta-v">2569</div>
        </div>
        <div className="user">
          <div className="avatar">ผว</div>
          <div className="who">
            <div className="who-n">นพ. ผู้ตรวจราชการ</div>
            <div className="who-r">ประธาน กวป.</div>
          </div>
        </div>
      </div>
    </header>
  );
}

// ---------- SUMMARY STRIP ----------
function Summary({ kpis }) {
  const counts = { g: 0, y: 0, r: 0 };
  kpis.forEach(k => counts[k.status]++);
  const total = kpis.length;
  const ach = ((counts.g / total) * 100).toFixed(0);

  return (
    <section className="summary">
      <div className="sum-headline">
        <div>
          <div className="sum-eyebrow">ภาพรวมผลการดำเนินงาน · ข้อมูล DM/HT</div>
          <h1 className="sum-title">บรรลุเป้าหมาย <span style={{ color: "#1F8A5B" }}>{ach}%</span> ของตัวชี้วัดทั้งหมด</h1>
          <div className="sum-sub">{total} ตัวชี้วัด · 5 จังหวัดในเขตสุขภาพที่ 10</div>
        </div>
        <div className="sum-stack">
          {[
            { k: "g", n: counts.g, l: "บรรลุเป้าหมาย" },
            { k: "y", n: counts.y, l: "เฝ้าระวัง" },
            { k: "r", n: counts.r, l: "ต่ำกว่าเกณฑ์" },
          ].map(s => (
            <div key={s.k} className="sum-cell">
              <div className="sum-cell-top">
                <StatusDot status={s.k} size={9} />
                <span className="sum-cell-l">{s.l}</span>
              </div>
              <div className="sum-cell-n" style={{ color: STATUS_COLORS[s.k].ring }}>{s.n}</div>
              <div className="sum-cell-bar">
                <div style={{ width: `${(s.n/total)*100}%`, background: STATUS_COLORS[s.k].ring }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pillar-strip">
        {PILLARS.map(p => {
          const items = kpis.filter(k => k.pillar === p.id);
          const g = items.filter(k => k.status === "g").length;
          const y = items.filter(k => k.status === "y").length;
          const r = items.filter(k => k.status === "r").length;
          return (
            <div key={p.id} className="pillar-card" style={{ "--accent": p.accent }}>
              <div className="pillar-card-top">
                <span className="pillar-code">{p.code}</span>
                <span className="pillar-name">{p.name}</span>
              </div>
              <div className="pillar-en">{p.en}</div>
              <div className="pillar-stats">
                <div><StatusDot status="g" /> <b>{g}</b></div>
                <div><StatusDot status="y" /> <b>{y}</b></div>
                <div><StatusDot status="r" /> <b>{r}</b></div>
                <div className="pillar-total">{items.length} ตัวชี้วัด</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------- FILTER BAR ----------
function FilterBar({ filter, setFilter, view, setView, sort, setSort, q, setQ, count }) {
  return (
    <div className="filterbar">
      <div className="filter-left">
        <button className={"pchip " + (filter === "all" ? "on" : "")} onClick={() => setFilter("all")}>
          ทั้งหมด <span className="n">{count.all}</span>
        </button>
        {PILLARS.map(p => (
          <button key={p.id}
            className={"pchip " + (filter === p.id ? "on" : "")}
            style={filter === p.id ? { "--accent": p.accent, background: `${p.accent}12`, color: p.accent, borderColor: `${p.accent}55` } : { "--accent": p.accent }}
            onClick={() => setFilter(p.id)}>
            <span className="pchip-dot" style={{ background: p.accent }} />
            {p.code} · {p.name} <span className="n">{count[p.id]}</span>
          </button>
        ))}
      </div>
      <div className="filter-right">
        <div className="search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C746B" strokeWidth="2">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหาตัวชี้วัด..." />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} className="select">
          <option value="status">เรียง: สถานะ</option>
          <option value="code">เรียง: รหัส</option>
          <option value="gap">เรียง: ช่องว่างจากเป้าหมาย</option>
          <option value="value">เรียง: ค่ามากไปน้อย</option>
        </select>
        <div className="vtoggle">
          <button className={view === "grid" ? "on" : ""} onClick={() => setView("grid")} title="Grid">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>
          </button>
          <button className={view === "list" ? "on" : ""} onClick={() => setView("list")} title="List">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="4" width="18" height="3" rx="1"/><rect x="3" y="10.5" width="18" height="3" rx="1"/><rect x="3" y="17" width="18" height="3" rx="1"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- KPI CARD ----------
function KpiCard({ k, onOpen }) {
  const p = PILLARS.find(x => x.id === k.pillar);
  const col = STATUS_COLORS[k.status];
  const gap = (k.target - k.v);
  return (
    <button className="kpi-card" onClick={() => onOpen(k)}>
      <div className="kpi-head">
        <span className="kpi-code">{k.code}</span>
        <span className="kpi-pillar" style={{ color: p.accent, background: `${p.accent}10`, borderColor: `${p.accent}30` }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: p.accent, display: "inline-block" }} />
          {p.code}
        </span>
        {k.isMock && (
          <span style={{ fontSize: 10, fontWeight: 600, color: "#9C948A", background: "#F2EEE8", border: "1px solid #E4DED5", borderRadius: 4, padding: "2px 6px" }}>
            รอข้อมูล
          </span>
        )}
        <span className="kpi-status" style={{ color: col.text, background: col.soft }}>
          <StatusDot status={k.status} />
          {col.label}
        </span>
      </div>
      <div className="kpi-body">
        <div className="kpi-ring">
          <StatusRing value={k.v} status={k.status} size={104} stroke={10} />
        </div>
        <div className="kpi-info">
          <div className="kpi-name">{k.name}</div>
          <div className="kpi-en">{k.en}</div>
        </div>
      </div>
      <div className="kpi-foot">
        <div className="kpi-foot-cell">
          <div className="kfc-l">เป้าหมาย</div>
          <div className="kfc-v">{k.target}<span className="kfc-u">%</span></div>
        </div>
        <div className="kpi-foot-cell">
          <div className="kfc-l">{k.invert ? "เกิน" : "ช่องว่าง"}</div>
          <div className="kfc-v" style={{ color: gap > 0 ? "#C4452B" : "#1F8A5B" }}>
            {gap > 0 ? "−" : "+"}{Math.abs(gap).toFixed(1)}
          </div>
        </div>
        <div className="kpi-foot-cell">
          <div className="kfc-l">แนวโน้ม</div>
          <div className="kfc-spark"><Sparkline data={k.trend} status={k.status} width={88} height={28} /></div>
        </div>
        <div className="kpi-foot-cell tail">
          <Delta trend={k.trend} />
        </div>
      </div>
    </button>
  );
}

// ---------- KPI LIST ROW ----------
function KpiRow({ k, onOpen }) {
  const p = PILLARS.find(x => x.id === k.pillar);
  const col = STATUS_COLORS[k.status];
  const gap = k.target - k.v;
  return (
    <button className="kpi-row" onClick={() => onOpen(k)}>
      <div className="row-status"><StatusDot status={k.status} size={10} /></div>
      <div className="row-code">{k.code}</div>
      <div className="row-pillar" style={{ color: p.accent }}>{p.code}</div>
      <div className="row-name">
        <div className="rn-th">{k.name}</div>
        <div className="rn-en">{k.en}</div>
      </div>
      <div className="row-value" style={{ color: col.text }}>{k.v.toFixed(1)}<span className="ru">%</span></div>
      <div className="row-target">/ {k.target}%</div>
      <div className="row-bar">
        <div className="row-bar-track">
          <div className="row-bar-fill" style={{ width: `${Math.min(100, (k.v/k.target)*100)}%`, background: col.ring }} />
          <div className="row-bar-target" style={{ left: "100%" }} />
        </div>
      </div>
      <div className="row-gap" style={{ color: gap > 0 ? "#C4452B" : "#1F8A5B" }}>
        {gap > 0 ? "−" : "+"}{Math.abs(gap).toFixed(1)}
      </div>
      <div className="row-spark"><Sparkline data={k.trend} status={k.status} width={72} height={22} /></div>
      <div className="row-chev">›</div>
    </button>
  );
}

Object.assign(window, { Header, Summary, FilterBar, KpiCard, KpiRow });
