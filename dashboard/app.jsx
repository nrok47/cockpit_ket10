// Root App for กวป. Dashboard

const APP_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "cozy",
  "accent": "#2F8F7A",
  "showPillarStrip": true,
  "ringStyle": "donut"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(APP_DEFAULTS);
  const [period, setPeriod] = useState("2569"); // ปีปัจจุบัน
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("grid");
  const [sort, setSort] = useState("status");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  
  // Dynamic Data State
  const [kpiList, setKpiList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch data on mount
    fetchHealthData().then(data => {
      setKpiList(data);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", tweaks.accent);
    document.documentElement.dataset.density = tweaks.density;
  }, [tweaks.accent, tweaks.density]);

  // Filtering
  const filtered = useMemo(() => {
    let arr = kpiList.slice();
    if (filter !== "all") arr = arr.filter(k => k.pillar === filter);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      arr = arr.filter(k => k.name.toLowerCase().includes(s) || k.en.toLowerCase().includes(s) || k.code.toLowerCase().includes(s));
    }
    const statusOrder = { r: 0, y: 1, g: 2 };
    arr.sort((a, b) => {
      if (sort === "status") return statusOrder[a.status] - statusOrder[b.status] || (a.target - a.v) - (b.target - b.v);
      if (sort === "code")   return a.code.localeCompare(b.code);
      if (sort === "gap")    return (b.target - b.v) - (a.target - a.v);
      if (sort === "value")  return b.v - a.v;
      return 0;
    });
    return arr;
  }, [filter, q, sort]);

  const count = useMemo(() => {
    const c = { all: kpiList.length };
    PILLARS.forEach(p => c[p.id] = kpiList.filter(k => k.pillar === p.id).length);
    return c;
  }, [kpiList]);

  if (isLoading) {
    return <div style={{ padding: '60px', textAlign: 'center' }}>กำลังโหลดข้อมูลจากระบบ...</div>;
  }

  return (
    <div className="app">
      <Header period={period} setPeriod={setPeriod} />
      <main className="main">
        <Summary kpis={kpiList} />
        <FilterBar filter={filter} setFilter={setFilter} view={view} setView={setView} sort={sort} setSort={setSort} q={q} setQ={setQ} count={count} />

        {view === "grid" ? (
          <div className="kpi-grid">
            {filtered.map(k => <KpiCard key={k.code} k={k} period={period} onOpen={setOpen} />)}
          </div>
        ) : (
          <div className="kpi-list">
            <div className="kpi-list-head">
              <div></div><div>รหัส</div><div>ยุทธ.</div><div>ตัวชี้วัด</div>
              <div>ผล</div><div>เป้า</div><div>ความก้าวหน้า</div><div>ช่องว่าง</div><div>แนวโน้ม</div><div></div>
            </div>
            {filtered.map(k => <KpiRow key={k.code} k={k} period={period} onOpen={setOpen} />)}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="empty">ไม่พบตัวชี้วัดที่ตรงกับเงื่อนไข</div>
        )}

        <footer className="app-foot">
          <div>แหล่งข้อมูล: HDC, รายงานเฉพาะกิจ, ระบบรายงาน Smart Hospital</div>
          <div>สร้างจาก live กวป. monitoring · update รายไตรมาส</div>
        </footer>
      </main>

      {open && <Drawer kpi={open} onClose={() => setOpen(null)} />}

      <TweaksPanel title="Tweaks" defaultOpen={false}>
        <TweakSection title="Layout">
          <TweakRadio label="Density" value={tweaks.density}
            options={[{value:"compact",label:"Compact"},{value:"cozy",label:"Cozy"}]}
            onChange={v => setTweak("density", v)} />
          <TweakToggle label="แสดงแถบยุทธศาสตร์" value={tweaks.showPillarStrip}
            onChange={v => setTweak("showPillarStrip", v)} />
        </TweakSection>
        <TweakSection title="Brand color">
          <TweakColor label="Accent" value={tweaks.accent}
            options={["#2F8F7A","#1F5E8C","#7A4FB3","#B5722B","#0F1F4D"]}
            onChange={v => setTweak("accent", v)} />
        </TweakSection>
        <TweakSection title="Period">
          <TweakSelect label="ไตรมาส" value={period}
            options={[{value:"Q1",label:"ไตรมาส 1"},{value:"Q2",label:"ไตรมาส 2"},{value:"Q3",label:"ไตรมาส 3"},{value:"Q4",label:"ไตรมาส 4"}]}
            onChange={setPeriod} />
        </TweakSection>
      </TweaksPanel>

      <PillarStripVisibility show={tweaks.showPillarStrip} />
    </div>
  );
}

// CSS toggle helper for pillar strip
function PillarStripVisibility({ show }) {
  useEffect(() => {
    document.documentElement.dataset.pillarStrip = show ? "on" : "off";
  }, [show]);
  return null;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
