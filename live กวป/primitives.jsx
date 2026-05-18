// Reusable UI: status ring, sparkline, chip, etc.

const STATUS_COLORS = {
  g: { ring: "#1F8A5B", soft: "#E5F3EC", text: "#0E5C3C", label: "บรรลุ" },
  y: { ring: "#C58A1A", soft: "#FCF1DC", text: "#7A540B", label: "เฝ้าระวัง" },
  r: { ring: "#C4452B", soft: "#FAE3DD", text: "#7A2417", label: "ต่ำกว่าเกณฑ์" },
};

function StatusRing({ value, status, size = 96, stroke = 9, showValue = true }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * c;
  const col = STATUS_COLORS[status];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#EFEAE3" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={col.ring} strokeWidth={stroke}
        strokeDasharray={`${dash} ${c - dash}`}
        strokeDashoffset={c/4}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dasharray .6s cubic-bezier(.2,.7,.2,1)" }}
      />
      {showValue && (
        <g>
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
                style={{ font: `600 ${size*0.28}px "IBM Plex Sans", system-ui`, fill: "#161310" }}>
            {pct.toFixed(1)}
          </text>
          <text x="50%" y={size/2 + size*0.22} textAnchor="middle"
                style={{ font: `500 ${size*0.10}px "IBM Plex Sans", system-ui`, fill: "#7C746B", letterSpacing: ".05em" }}>
            %
          </text>
        </g>
      )}
    </svg>
  );
}

function Sparkline({ data, status, width = 120, height = 32 }) {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const span = Math.max(max - min, 0.5);
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => [i * stepX, height - ((v - min) / span) * (height - 6) - 3]);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${path} L${width},${height} L0,${height} Z`;
  const col = STATUS_COLORS[status].ring;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      <path d={area} fill={col} opacity="0.10" />
      <path d={path} fill="none" stroke={col} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        i === points.length - 1 ? <circle key={i} cx={p[0]} cy={p[1]} r="2.4" fill={col} /> : null
      ))}
    </svg>
  );
}

function StatusDot({ status, size = 8 }) {
  return <span style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", background: STATUS_COLORS[status].ring }} />;
}

function PillarTag({ pillar, mono = false }) {
  const p = PILLARS.find(x => x.id === pillar);
  if (!p) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 8px", borderRadius: 4,
      background: mono ? "#F2EEE8" : `${p.accent}15`,
      color: mono ? "#3F3933" : p.accent,
      fontSize: 11, fontWeight: 600, letterSpacing: ".02em",
      border: `1px solid ${mono ? "#E4DED5" : p.accent + "30"}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.accent }} />
      {p.code} · {p.name}
    </span>
  );
}

function Delta({ trend }) {
  if (!trend || trend.length < 2) return null;
  const last = trend[trend.length - 1], prev = trend[trend.length - 2];
  const d = last - prev;
  const up = d >= 0;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: 12, fontWeight: 600, color: up ? "#1F8A5B" : "#C4452B",
      fontVariantNumeric: "tabular-nums",
    }}>
      <span style={{ fontSize: 10 }}>{up ? "▲" : "▼"}</span>
      {Math.abs(d).toFixed(1)}
    </span>
  );
}

Object.assign(window, { StatusRing, Sparkline, StatusDot, PillarTag, Delta, STATUS_COLORS });
