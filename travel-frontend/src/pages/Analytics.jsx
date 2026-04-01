import VeloraLogo from "../components/VeloraLogo";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function Analytics() {
  const navigate = useNavigate();

  const [user, setUser]           = useState(null);
  const [dropOpen, setDropOpen]   = useState(false);
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const name  = localStorage.getItem("velora_name");
    const token = localStorage.getItem("token");
    if (name || token) setUser({ name: name || "Traveler" });
    const unsub = auth.onAuthStateChanged(u => {
      if (u) setUser({ name: u.displayName || u.email || "Traveler" });
    });
    return unsub;
  }, []);

  // ── Fetch analytics ───────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    fetch(`${BASE_URL}/analytics/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleSignOut = async () => {
    try { await signOut(auth); } catch {}
    localStorage.removeItem("token");
    localStorage.removeItem("velora_name");
    navigate("/login");
  };

  // ── CSS bar chart helpers ─────────────────────────────────────────────────
  const maxCityCount = data?.topCities?.length
    ? Math.max(...data.topCities.map(c => c.count))
    : 1;
  const maxMonthly = data?.monthly?.length
    ? Math.max(...data.monthly.map(m => m.trips))
    : 1;

  // Sort monthly ascending for chart display
  const monthlyAsc = data?.monthly
    ? [...data.monthly].sort((a,b) => {
        if (a._id.year !== b._id.year) return a._id.year - b._id.year;
        return a._id.month - b._id.month;
      }).slice(-6)
    : [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        :root {
          --accent:#E8341A; --accent-hover:#c9270e; --gold:#F5A623;
          --white:#FFFFFF; --bg:#0D0D0D; --surface:#161616; --surface2:#1e1e1e;
          --border:rgba(255,255,255,0.08); --border-hover:rgba(255,255,255,0.18);
          --text-muted:rgba(255,255,255,0.45); --text-sub:rgba(255,255,255,0.65);
          --nav-h:68px;
        }
        html,body { margin:0;padding:0;width:100%;min-height:100vh;
          overflow-x:hidden;background:var(--bg);font-family:'Sora',sans-serif;color:var(--white); }
        ::-webkit-scrollbar{width:6px}
        ::-webkit-scrollbar-track{background:var(--bg)}
        ::-webkit-scrollbar-thumb{background:#333;border-radius:3px}

        /* NAV */
        .an-nav {
          position:fixed;top:0;left:0;right:0;height:var(--nav-h);
          display:flex;align-items:center;justify-content:space-between;
          padding:0 5%;z-index:1000;
          background:rgba(10,10,10,0.92);backdrop-filter:blur(20px);
          border-bottom:1px solid var(--border);
        }
        .an-nav-logo { display:flex;align-items:center;gap:9px;cursor:pointer; }
        .an-nav-logo-icon {
          width:34px;height:34px;
          background:linear-gradient(135deg,var(--accent),var(--gold));
          border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:17px;
        }
        .an-nav-logo-text { font-size:22px;font-weight:800;letter-spacing:-0.5px; }
        .an-nav-links {
          position:absolute;left:50%;transform:translateX(-50%);
          display:flex;align-items:center;gap:30px;
        }
        .an-nav-link {
          color:var(--text-sub);text-decoration:none;
          font-size:14px;font-weight:500;position:relative;transition:color 0.2s;cursor:pointer;
        }
        .an-nav-link::after {
          content:'';position:absolute;bottom:-3px;left:0;
          width:0;height:1.5px;background:var(--gold);transition:width 0.25s;
        }
        .an-nav-link:hover,.an-nav-link.active { color:#fff; }
        .an-nav-link:hover::after,.an-nav-link.active::after { width:100%; }
        .an-nav-actions { display:flex;align-items:center;gap:12px; }

        .an-avatar-wrap { position:relative; }
        .an-avatar-trigger {
          display:flex;align-items:center;gap:9px;cursor:pointer;
          padding:5px 14px 5px 5px;border-radius:50px;
          border:1.5px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);
          backdrop-filter:blur(6px);transition:background 0.2s;
        }
        .an-avatar-trigger:hover { background:rgba(255,255,255,0.11); }
        .an-avatar-circle {
          width:28px;height:28px;border-radius:50%;
          background:linear-gradient(135deg,var(--accent),var(--gold));
          display:flex;align-items:center;justify-content:center;
          font-size:12px;font-weight:700;color:#fff;border:1.5px solid var(--gold);
        }
        .an-avatar-name { color:#fff;font-size:13.5px;font-weight:600; }
        .an-dropdown {
          position:absolute;top:calc(100% + 10px);right:0;
          background:#1a1a1a;border:1px solid rgba(255,255,255,0.1);
          border-radius:14px;padding:8px;min-width:170px;
          box-shadow:0 20px 50px rgba(0,0,0,0.55);
          animation:dropIn 0.18s ease;z-index:999;
        }
        @keyframes dropIn { from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)} }
        .an-drop-item {
          display:flex;align-items:center;gap:9px;width:100%;padding:10px 14px;
          border:none;background:none;color:rgba(255,255,255,0.82);
          font-family:'Sora',sans-serif;font-size:13.5px;font-weight:500;
          cursor:pointer;border-radius:8px;transition:background 0.18s;text-align:left;
        }
        .an-drop-item:hover{background:rgba(255,255,255,0.08);color:#fff}
        .an-drop-item.danger{color:#ff5a5a}
        .an-drop-item.danger:hover{background:rgba(255,90,90,0.1)}
        .an-drop-divider{height:1px;background:rgba(255,255,255,0.07);margin:6px 0}

        /* PAGE */
        .an-page { padding-top:var(--nav-h);min-height:100vh; }
        .an-inner { max-width:1000px;margin:0 auto;padding:40px 5%; }

        .an-header { margin-bottom:32px; }
        .an-header-title { font-size:28px;font-weight:800;margin-bottom:6px; }
        .an-header-sub { font-size:14.5px;color:var(--text-sub); }

        /* STAT CARDS */
        .an-stats { display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:28px; }
        @media(max-width:600px){.an-stats{grid-template-columns:1fr;}}
        .an-stat {
          background:var(--surface);border:1px solid var(--border);border-radius:18px;
          padding:24px;position:relative;overflow:hidden;
        }
        .an-stat-bg { position:absolute;right:-12px;bottom:-12px;font-size:72px;opacity:0.07;pointer-events:none; }
        .an-stat-label { font-size:12px;font-weight:600;color:var(--text-muted);
          letter-spacing:0.5px;text-transform:uppercase;margin-bottom:10px; }
        .an-stat-value { font-size:38px;font-weight:900;letter-spacing:-1px;margin-bottom:4px; }
        .an-stat-value.accent { color:var(--accent); }
        .an-stat-value.gold   { color:var(--gold); }
        .an-stat-value.green  { color:#4ade80; }
        .an-stat-sub { font-size:12.5px;color:var(--text-muted); }

        /* CARDS */
        .an-grid { display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px; }
        @media(max-width:680px){.an-grid{grid-template-columns:1fr;}}
        .an-card {
          background:var(--surface);border:1px solid var(--border);border-radius:20px;overflow:hidden;
        }
        .an-card-head {
          padding:20px 24px 16px;border-bottom:1px solid var(--border);
          display:flex;align-items:center;justify-content:space-between;
        }
        .an-card-title { display:flex;align-items:center;gap:10px;font-size:15px;font-weight:700; }
        .an-card-icon {
          width:32px;height:32px;border-radius:9px;
          background:rgba(232,52,26,0.15);
          display:flex;align-items:center;justify-content:center;font-size:15px;
        }
        .an-card-body { padding:20px 24px; }

        /* BAR CHART */
        .an-bar-row { display:flex;align-items:center;gap:12px;margin-bottom:14px; }
        .an-bar-row:last-child { margin-bottom:0; }
        .an-bar-label { font-size:13px;font-weight:600;width:100px;flex-shrink:0;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .an-bar-track {
          flex:1;height:10px;border-radius:5px;background:rgba(255,255,255,0.07);
          overflow:hidden;
        }
        .an-bar-fill {
          height:100%;border-radius:5px;
          background:linear-gradient(90deg,var(--accent),var(--gold));
          transition:width 0.8s ease;
        }
        .an-bar-count {
          font-size:13px;font-weight:700;color:var(--gold);
          width:24px;text-align:right;flex-shrink:0;
        }

        /* MONTH CHART */
        .an-month-chart {
          display:flex;align-items:flex-end;gap:8px;height:120px;margin-top:8px;
        }
        .an-month-col { flex:1;display:flex;flex-direction:column;align-items:center;gap:4px; }
        .an-month-bar-wrap {
          flex:1;width:100%;display:flex;align-items:flex-end;
          background:rgba(255,255,255,0.04);border-radius:6px 6px 0 0;
        }
        .an-month-bar {
          width:100%;border-radius:6px 6px 0 0;
          background:linear-gradient(180deg,var(--accent),rgba(232,52,26,0.5));
          transition:height 0.8s ease;min-height:4px;
        }
        .an-month-label { font-size:11px;color:var(--text-muted);font-weight:600; }
        .an-month-val { font-size:11px;color:var(--gold);font-weight:700; }

        /* EMPTY */
        .an-empty { text-align:center;padding:40px 20px; }
        .an-empty-icon { font-size:48px;margin-bottom:12px;opacity:0.5; }
        .an-empty-text { font-size:14px;color:var(--text-muted);line-height:1.6; }
        .an-cta {
          display:inline-flex;align-items:center;gap:8px;margin-top:16px;
          padding:11px 22px;border-radius:50px;border:none;
          background:var(--accent);color:#fff;font-family:'Sora',sans-serif;
          font-size:13.5px;font-weight:700;cursor:pointer;transition:background 0.2s;
        }
        .an-cta:hover { background:var(--accent-hover); }

        /* SPINNER */
        .an-spinner-wrap { display:flex;align-items:center;justify-content:center;min-height:60vh; }
        .an-spinner {
          width:36px;height:36px;border:3px solid rgba(255,255,255,0.1);
          border-top-color:var(--accent);border-radius:50%;animation:spin 0.8s linear infinite;
        }
        @keyframes spin{to{transform:rotate(360deg)}}

        /* Full width card */
        .an-card-full { margin-bottom:20px; }
      `}</style>

      {/* NAV */}
      <nav className="an-nav">
        <div className="an-nav-logo" onClick={() => navigate("/")}>
          <VeloraLogo size={30} textColor="#fff" />
        </div>
        <div className="an-nav-links">
          <span className="an-nav-link" onClick={() => navigate("/")}>Home</span>
          <span className="an-nav-link" onClick={() => navigate("/trips")}>Trips</span>
          <span className="an-nav-link" onClick={() => navigate("/emergency")}>Emergency</span>
          <span className="an-nav-link active">Analytics</span>
        </div>
        <div className="an-nav-actions">
          {user ? (
            <div className="an-avatar-wrap">
              <div className="an-avatar-trigger" onClick={() => setDropOpen(o => !o)}>
                <div className="an-avatar-circle">{user.name?.[0]?.toUpperCase() || "U"}</div>
                <span className="an-avatar-name">{user.name}</span>
              </div>
              {dropOpen && (
                <div className="an-dropdown">
                  <button className="an-drop-item" onClick={() => { navigate("/profile"); setDropOpen(false); }}>👤 Profile</button>
                  <button className="an-drop-item" onClick={() => { navigate("/trips"); setDropOpen(false); }}>🗺️ My Trips</button>
                  <div className="an-drop-divider" />
                  <button className="an-drop-item danger" onClick={handleSignOut}>↩ Sign Out</button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => navigate("/login")} style={{
              padding:"9px 20px",borderRadius:"50px",border:"1.5px solid rgba(255,255,255,0.35)",
              background:"rgba(255,255,255,0.07)",color:"#fff",fontFamily:"'Sora',sans-serif",
              fontSize:"13.5px",fontWeight:600,cursor:"pointer",
            }}>Sign In</button>
          )}
        </div>
      </nav>

      <div className="an-page">
        <div className="an-inner">

          {loading && (
            <div className="an-spinner-wrap"><div className="an-spinner" /></div>
          )}

          {error && (
            <div style={{ background:"rgba(232,52,26,0.12)",border:"1px solid rgba(232,52,26,0.3)",
              borderRadius:14,padding:"16px 20px",color:"#ff8070",fontSize:14, marginTop:40 }}>
              ⚠️ {error}
            </div>
          )}

          {!loading && !error && data && (
            <>
              <div className="an-header">
                <div className="an-header-title">📊 Your Travel Analytics</div>
                <div className="an-header-sub">A snapshot of your adventures with Velora</div>
              </div>

              {/* STAT CARDS */}
              <div className="an-stats">
                <div className="an-stat">
                  <div className="an-stat-bg">✈️</div>
                  <div className="an-stat-label">Total Trips</div>
                  <div className="an-stat-value accent">{data.summary?.totalTrips ?? 0}</div>
                  <div className="an-stat-sub">trips planned</div>
                </div>
                <div className="an-stat">
                  <div className="an-stat-bg">📍</div>
                  <div className="an-stat-label">Distance Covered</div>
                  <div className="an-stat-value gold">
                    {((data.summary?.totalDistanceKm) || 0).toFixed(1)}
                  </div>
                  <div className="an-stat-sub">kilometres total</div>
                </div>
                <div className="an-stat">
                  <div className="an-stat-bg">🏙️</div>
                  <div className="an-stat-label">Cities Explored</div>
                  <div className="an-stat-value green">{data.topCities?.length ?? 0}</div>
                  <div className="an-stat-sub">unique cities</div>
                </div>
              </div>

              {/* No data state */}
              {data.summary?.totalTrips === 0 && (
                <div className="an-card an-card-full">
                  <div className="an-card-body">
                    <div className="an-empty">
                      <div className="an-empty-icon">🗺️</div>
                      <div className="an-empty-text">
                        No trips yet! Plan your first adventure and your analytics will appear here.
                      </div>
                      <button className="an-cta" onClick={() => navigate("/trips")}>
                        ✈️ Plan a Trip
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {data.summary?.totalTrips > 0 && (
                <>
                  <div className="an-grid">
                    {/* TOP CITIES */}
                    <div className="an-card">
                      <div className="an-card-head">
                        <div className="an-card-title">
                          <div className="an-card-icon">🏙️</div>
                          Top Cities
                        </div>
                      </div>
                      <div className="an-card-body">
                        {data.topCities?.length ? (
                          data.topCities.map((c, i) => (
                            <div key={c.city} className="an-bar-row">
                              <div className="an-bar-label">
                                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`} {c.city}
                              </div>
                              <div className="an-bar-track">
                                <div
                                  className="an-bar-fill"
                                  style={{ width: `${(c.count / maxCityCount) * 100}%` }}
                                />
                              </div>
                              <div className="an-bar-count">{c.count}</div>
                            </div>
                          ))
                        ) : (
                          <div className="an-empty"><div className="an-empty-text">No city data yet</div></div>
                        )}
                      </div>
                    </div>

                    {/* MONTHLY ACTIVITY */}
                    <div className="an-card">
                      <div className="an-card-head">
                        <div className="an-card-title">
                          <div className="an-card-icon">📅</div>
                          Monthly Activity
                        </div>
                        <span style={{ fontSize:11.5,color:"var(--text-muted)",fontWeight:600 }}>
                          Last 6 months
                        </span>
                      </div>
                      <div className="an-card-body">
                        {monthlyAsc.length ? (
                          <div className="an-month-chart">
                            {monthlyAsc.map((m, i) => (
                              <div key={i} className="an-month-col">
                                <div className="an-month-val">{m.trips}</div>
                                <div className="an-month-bar-wrap">
                                  <div
                                    className="an-month-bar"
                                    style={{ height: `${(m.trips / maxMonthly) * 100}%` }}
                                  />
                                </div>
                                <div className="an-month-label">
                                  {MONTH_NAMES[(m._id.month - 1)]}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="an-empty"><div className="an-empty-text">No monthly data yet</div></div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* TRIP MILESTONES */}
                  <div className="an-card an-card-full">
                    <div className="an-card-head">
                      <div className="an-card-title">
                        <div className="an-card-icon">🏆</div>
                        Travel Milestones
                      </div>
                    </div>
                    <div className="an-card-body">
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:12 }}>
                        {[
                          { icon:"🌱", label:"First Trip",        unlocked: data.summary?.totalTrips >= 1,  desc:"Completed your first trip" },
                          { icon:"✈️", label:"Frequent Flier",    unlocked: data.summary?.totalTrips >= 5,  desc:"5 trips planned" },
                          { icon:"🗺️", label:"Explorer",          unlocked: data.summary?.totalTrips >= 10, desc:"10 trips completed" },
                          { icon:"🏙️", label:"City Hopper",       unlocked: data.topCities?.length >= 3,    desc:"Visited 3+ cities" },
                          { icon:"🚀", label:"Globetrotter",      unlocked: data.topCities?.length >= 5,    desc:"Explored 5+ cities" },
                          { icon:"📏", label:"100 km Club",       unlocked: (data.summary?.totalDistanceKm || 0) >= 100, desc:"100 km covered" },
                        ].map(m => (
                          <div key={m.label} style={{
                            background: m.unlocked ? "rgba(74,222,128,0.08)" : "var(--surface2)",
                            border:`1px solid ${m.unlocked ? "rgba(74,222,128,0.25)" : "var(--border)"}`,
                            borderRadius:14, padding:"14px 16px",
                            opacity: m.unlocked ? 1 : 0.45,
                          }}>
                            <div style={{ fontSize:24, marginBottom:8 }}>{m.icon}</div>
                            <div style={{ fontSize:13, fontWeight:700, marginBottom:4,
                              color: m.unlocked ? "#4ade80" : "#fff" }}>
                              {m.label}
                            </div>
                            <div style={{ fontSize:12, color:"var(--text-muted)" }}>{m.desc}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
