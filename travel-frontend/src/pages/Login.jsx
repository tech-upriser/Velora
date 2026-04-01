import VeloraLogo from "../components/VeloraLogo";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider, githubProvider } from "../firebase";
import { signInWithRedirect, getRedirectResult, sendPasswordResetEmail } from "firebase/auth";
import { useEffect } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Login() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const validate = () => {
    const newErrors = {};
    if (!isForgot) {
      if (isSignup && !form.name.trim()) newErrors.name = "Name is required";
      if (!form.email.trim()) newErrors.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Invalid email";
      if (!form.password) newErrors.password = "Password is required";
      else if (form.password.length < 6) newErrors.password = "Min 6 characters";
    } else {
      if (!form.email.trim()) newErrors.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Invalid email";
    }
    return newErrors;
  };

  // Send login security alert via Node.js backend
  const sendLoginAlert = async (email, name) => {
    try {
      await fetch(`${BASE_URL}/send-login-alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
    } catch (err) {
      console.error("Failed to send login alert:", err);
    }
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    setErrors({});
    setSuccessMsg("");
    try {
      if (isForgot) {
        // Try MongoDB users first, fallback to Firebase for Google/GitHub users
        try {
          const res = await fetch(`${BASE_URL}/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: form.email }),
          });
          const data = await res.json();
          if (res.ok) {
            setSuccessMsg("✅ Password reset email sent! Check your inbox.");
          } else {
            await sendPasswordResetEmail(auth, form.email);
            setSuccessMsg("✅ Password reset email sent! Check your inbox.");
          }
        } catch {
          await sendPasswordResetEmail(auth, form.email);
          setSuccessMsg("✅ Password reset email sent! Check your inbox.");
        }
        setLoading(false);
        return;
      }

      if (isSignup) {
        const res = await fetch(`${BASE_URL}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrors({ email: data.error || "Registration failed" });
          setLoading(false);
          return;
        }
        const loginRes = await fetch(`${BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) {
          setErrors({ email: loginData.error || "Login failed after signup" });
          setLoading(false);
          return;
        }
        localStorage.setItem("velora_token", loginData.token);
        localStorage.setItem("velora_user", JSON.stringify({ name: form.name, email: form.email }));
        // Send security alert after signup
        await sendLoginAlert(form.email, form.name);
      } else {
        const res = await fetch(`${BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (data.error === "User not found") {
            setErrors({ email: "No account found with this email." });
          } else if (data.error === "Invalid password") {
            setErrors({ password: "Incorrect password. Please try again." });
          } else {
            setErrors({ email: data.error || "Login failed" });
          }
          setLoading(false);
          return;
        }
        localStorage.setItem("velora_token", data.token);
        const name = data.name || form.email.split("@")[0];
        localStorage.setItem("velora_user", JSON.stringify({ name, email: form.email }));
        // Send security alert on every login
        await sendLoginAlert(form.email, name);
      }
      setLoading(false);
      navigate("/");
    } catch (err) {
      setLoading(false);
      setErrors({ email: "Network error. Is your backend running?" });
    }
  };

  const handleSocialLogin = async (provider, providerName) => {
  setSocialLoading(providerName);
  setErrors({});

  try {
    await signInWithRedirect(auth, provider);
  } catch (error) {
    console.error(`${providerName} Redirect Error:`, error);
    setErrors({
      email: `${providerName} sign-in failed. Please try again.`,
    });
  }

  setSocialLoading("");
};

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  useEffect(() => {
  const handleRedirect = async () => {
    try {
      const result = await getRedirectResult(auth);

      if (result) {
        const user = result.user;

        const userData = {
          name: user.displayName || "Traveler",
          email: user.email,
          photo: user.photoURL,
        };

        localStorage.setItem("velora_user", JSON.stringify(userData));

        // Send login alert
        if (user.email) {
          await sendLoginAlert(user.email, userData.name);
        }

        navigate("/");
      }
    } catch (error) {
      console.error("Redirect login error:", error);
    }
  };

  handleRedirect();
}, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .vl-page {
          min-height: 100vh;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          background: #0a0a0f;
        }

        .vl-left {
          flex: 1;
          position: relative;
          display: none;
          overflow: hidden;
        }
        @media (min-width: 900px) { .vl-left { display: flex; flex-direction: column; justify-content: flex-end; } }

        .vl-bg-img {
          position: absolute;
          inset: 0;
          background: url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200') center/cover no-repeat;
        }
        .vl-bg-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(10,10,15,0.92) 0%, rgba(10,10,15,0.3) 60%, rgba(10,10,15,0.1) 100%);
        }
        .vl-left-content {
          position: relative;
          z-index: 2;
          padding: 48px;
        }
        .vl-left-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 48px;
        }
        .vl-left-logo-icon {
          width: 40px; height: 40px;
          background: #e8622a;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
        }
        .vl-left-logo-name {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 700;
          color: white;
          letter-spacing: 0.5px;
        }
        .vl-left-headline {
          font-family: 'Playfair Display', serif;
          font-size: 42px;
          font-weight: 700;
          color: white;
          line-height: 1.2;
          margin-bottom: 16px;
        }
        .vl-left-headline span { color: #e8622a; }
        .vl-left-sub {
          font-size: 15px;
          color: rgba(255,255,255,0.6);
          line-height: 1.6;
          max-width: 360px;
          margin-bottom: 40px;
        }
        .vl-stats {
          display: flex;
          gap: 32px;
        }
        .vl-stat-num {
          font-family: 'Playfair Display', serif;
          font-size: 26px;
          font-weight: 700;
          color: white;
        }
        .vl-stat-label {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.5px;
          margin-top: 2px;
        }

        .vl-right {
          width: 100%;
          max-width: 520px;
          background: #0e0e16;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 40px;
          overflow-y: auto;
          position: relative;
        }
        @media (min-width: 900px) { .vl-right { border-left: 1px solid rgba(255,255,255,0.06); } }

        .vl-mobile-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 36px;
        }
        @media (min-width: 900px) { .vl-mobile-logo { display: none; } }
        .vl-mobile-logo-icon {
          width: 36px; height: 36px;
          background: #e8622a;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
        }
        .vl-mobile-logo-name {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 700;
          color: white;
        }

        .vl-heading {
          font-family: 'Playfair Display', serif;
          font-size: 30px;
          font-weight: 700;
          color: white;
          margin-bottom: 6px;
        }
        .vl-subheading {
          font-size: 14px;
          color: rgba(255,255,255,0.45);
          margin-bottom: 32px;
        }

        .vl-tabs {
          display: flex;
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 28px;
          border: 1px solid rgba(255,255,255,0.07);
        }
        .vl-tab {
          flex: 1;
          padding: 10px;
          border: none;
          background: transparent;
          border-radius: 9px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          color: rgba(255,255,255,0.4);
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
        }
        .vl-tab.active {
          background: #e8622a;
          color: white;
          box-shadow: 0 4px 16px rgba(232,98,42,0.35);
        }

        .vl-form { display: flex; flex-direction: column; gap: 16px; }
        .vl-input-group { display: flex; flex-direction: column; gap: 6px; }

        .vl-label {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }
        .vl-input {
          padding: 13px 16px;
          border-radius: 10px;
          border: 1.5px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          font-size: 15px;
          color: white;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.2s, background 0.2s;
        }
        .vl-input::placeholder { color: rgba(255,255,255,0.25); }
        .vl-input:focus {
          border-color: #e8622a;
          background: rgba(232,98,42,0.06);
        }
        .vl-input.err { border-color: #ef4444; }
        .vl-error { font-size: 12px; color: #f87171; }

        .vl-success {
          background: rgba(34,197,94,0.1);
          border: 1px solid rgba(34,197,94,0.3);
          border-radius: 10px;
          padding: 12px 16px;
          color: #4ade80;
          font-size: 14px;
        }

        .vl-forgot-row { text-align: right; margin-top: -8px; }
        .vl-forgot {
          font-size: 13px;
          color: #e8622a;
          cursor: pointer;
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
        }
        .vl-forgot:hover { text-decoration: underline; }

        .vl-submit {
          padding: 14px;
          background: #e8622a;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.3px;
          transition: opacity 0.2s, transform 0.1s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(232,98,42,0.4);
          margin-top: 4px;
        }
        .vl-submit:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(232,98,42,0.5);
        }
        .vl-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        .vl-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 4px 0;
        }
        .vl-hr { flex: 1; border: none; border-top: 1px solid rgba(255,255,255,0.08); }
        .vl-or { font-size: 12px; color: rgba(255,255,255,0.3); white-space: nowrap; letter-spacing: 0.5px; }

        .vl-social {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
          border: 1.5px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: white;
        }
        .vl-social:hover:not(:disabled) {
          background: rgba(255,255,255,0.09);
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-1px);
        }
        .vl-social:disabled { opacity: 0.5; cursor: not-allowed; }
        .vl-social.github { background: rgba(255,255,255,0.06); }
        .vl-social.facebook { opacity: 0.4; cursor: not-allowed; }

        .vl-back {
          text-align: center;
          margin-top: 24px;
          font-size: 13px;
          color: rgba(255,255,255,0.35);
          cursor: pointer;
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.2s;
        }
        .vl-back:hover { color: #e8622a; }

        .vl-forgot-header { text-align: center; margin-bottom: 24px; }
        .vl-forgot-title {
          font-family: 'Playfair Display', serif;
          font-size: 26px;
          color: white;
          margin-bottom: 8px;
        }
        .vl-forgot-desc { font-size: 14px; color: rgba(255,255,255,0.45); }

        .vl-back-login {
          text-align: center;
          font-size: 13px;
          color: #e8622a;
          cursor: pointer;
          background: none;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
        }
        .vl-back-login:hover { text-decoration: underline; }
      `}</style>

      <div className="vl-page">

        {/* LEFT DECORATIVE PANEL */}
        <div className="vl-left">
          <div className="vl-bg-img" />
          <div className="vl-bg-overlay" />
          <div className="vl-left-content">
            <div className="vl-left-logo">
              <VeloraLogo size={30} textColor="#fff" />
            </div>
            <h2 className="vl-left-headline">
              Redefining the<br />way you <span>roam</span>
            </h2>
            <p className="vl-left-sub">
              Discover hidden gems, plan seamless trips, and travel smarter with your intelligent companion.
            </p>
            <div className="vl-stats">
              <div>
                <div className="vl-stat-num">180+</div>
                <div className="vl-stat-label">DESTINATIONS</div>
              </div>
              <div>
                <div className="vl-stat-num">50K+</div>
                <div className="vl-stat-label">TRAVELERS</div>
              </div>
              <div>
                <div className="vl-stat-num">4.9★</div>
                <div className="vl-stat-label">RATING</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT FORM PANEL */}
        <div className="vl-right">

          {/* Mobile logo */}
          <div className="vl-mobile-logo">
            <VeloraLogo size={28} textColor="#1a1a1a" />
          </div>

          {!isForgot ? (
            <>
              <h1 className="vl-heading">{isSignup ? "Create account" : "Welcome back"}</h1>
              <p className="vl-subheading">
                {isSignup ? "Start your journey with Velora today" : "Sign in to continue your adventure"}
              </p>
              <div className="vl-tabs">
                <button
                  className={`vl-tab ${!isSignup ? "active" : ""}`}
                  onClick={() => { setIsSignup(false); setErrors({}); setSuccessMsg(""); }}
                >
                  Login
                </button>
                <button
                  className={`vl-tab ${isSignup ? "active" : ""}`}
                  onClick={() => { setIsSignup(true); setErrors({}); setSuccessMsg(""); }}
                >
                  Sign Up
                </button>
              </div>
            </>
          ) : (
            <div className="vl-forgot-header">
              <h1 className="vl-forgot-title">Forgot Password?</h1>
              <p className="vl-forgot-desc">Enter your email and we'll send you a reset link</p>
            </div>
          )}

          {successMsg && <div className="vl-success" style={{ marginBottom: 16 }}>{successMsg}</div>}

          <div className="vl-form">

            {isSignup && !isForgot && (
              <div className="vl-input-group">
                <label className="vl-label">Full Name</label>
                <input
                  name="name"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  className={`vl-input ${errors.name ? "err" : ""}`}
                />
                {errors.name && <span className="vl-error">{errors.name}</span>}
              </div>
            )}

            <div className="vl-input-group">
              <label className="vl-label">Email</label>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                className={`vl-input ${errors.email ? "err" : ""}`}
              />
              {errors.email && <span className="vl-error">{errors.email}</span>}
            </div>

            {!isForgot && (
              <div className="vl-input-group">
                <label className="vl-label">Password</label>
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className={`vl-input ${errors.password ? "err" : ""}`}
                />
                {errors.password && <span className="vl-error">{errors.password}</span>}
              </div>
            )}

            {!isSignup && !isForgot && (
              <div className="vl-forgot-row">
                <button
                  className="vl-forgot"
                  onClick={() => { setIsForgot(true); setErrors({}); setSuccessMsg(""); }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              className="vl-submit"
              onClick={handleSubmit}
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading
                ? isForgot ? "Sending..." : isSignup ? "Creating Account..." : "Signing in..."
                : isForgot ? "Send Reset Email" : isSignup ? "Create Account" : "Sign In"
              }
            </button>

            {isForgot && (
              <button className="vl-back-login" onClick={() => { setIsForgot(false); setErrors({}); setSuccessMsg(""); }}>
                ← Back to Login
              </button>
            )}

            {!isForgot && (
              <>
                <div className="vl-divider">
                  <hr className="vl-hr" />
                  <span className="vl-or">or continue with</span>
                  <hr className="vl-hr" />
                </div>

                <button
                  className="vl-social"
                  onClick={() => handleSocialLogin(googleProvider, "Google")}
                  disabled={!!socialLoading}
                >
                  {socialLoading === "Google" ? "Connecting..." : (
                    <>
                      <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: 20, height: 20 }} />
                      Continue with Google
                    </>
                  )}
                </button>

                <button
                  className="vl-social github"
                  onClick={() => handleSocialLogin(githubProvider, "GitHub")}
                  disabled={!!socialLoading}
                >
                  {socialLoading === "GitHub" ? "Connecting..." : (
                    <>
                      <img src="https://www.svgrepo.com/show/512317/github-142.svg" alt="GitHub" style={{ width: 20, height: 20, filter: "invert(1)" }} />
                      Continue with GitHub
                    </>
                  )}
                </button>

                <button className="vl-social facebook" disabled>
                  <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" style={{ width: 20, height: 20 }} />
                  Continue with Facebook (Soon)
                </button>
              </>
            )}
          </div>

          <button className="vl-back" onClick={() => navigate("/")}>
            ← Back to Home
          </button>
        </div>

      </div>
    </>
  );
}
