"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, Shield, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { CdntLogo } from "@/components/ui/CdntLogo";

const DEMO_CODE = "123456";

export default function TwoFactorPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const validateCode = (val: string): string | null => {
    if (!val.trim()) return "Authentication code is required.";
    if (!/^\d+$/.test(val)) return "Code must contain digits only.";
    if (val.length !== 6) return "Code must be exactly 6 digits.";
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(val);
    setError(null);
    if (touched) {
      setError(validateCode(val));
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    const err = validateCode(code);
    if (err) {
      setError(err);
      triggerShake();
      return;
    }

    setLoading(true);
    setError(null);

    await new Promise((res) => setTimeout(res, 1200));

    const authHash = sessionStorage.getItem("auth_hash");
    let isValid = false;

    if (authHash) {
      try {
        const expectedCode = atob(authHash);
        if (code === expectedCode) {
          isValid = true;
        }
      } catch (err) {
        console.error("Invalid hash");
      }
    }

    if (isValid) {
      // Set a client-side cookie with admin email for RBAC identity
      const authEmail = sessionStorage.getItem("auth_email") || "admin@ndntb.com";
      document.cookie = `admin_auth=${encodeURIComponent(authEmail)}; path=/; max-age=86400; SameSite=Lax`;
      try {
        await fetch("/api/security-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "Admin Login",
            category: "Auth",
            severity: "Info",
            userName: "Administrator",
            userId: "ADM-001",
            details: "Admin logged in successfully after 2FA verification.",
            performedByAdmin: "ADM-001"
          })
        });
      } catch (err) {
        console.error("Failed to log admin login:", err);
      }
      router.push("/dashboard");
    } else {
      setLoading(false);
      setError("Invalid code. Please check your email.");
      triggerShake();
      try {
        await fetch("/api/security-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "Failed Login Attempt",
            category: "Auth",
            severity: "Warning",
            userName: "Administrator",
            userId: "ADM-001",
            details: `Failed 2FA code verification attempt: entered code ${code}`,
            performedByAdmin: null
          })
        });
      } catch (err) {
        console.error("Failed to log admin login failure:", err);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full flex flex-col items-center gap-6"
    >
      {/* Logo + Title */}
      <div className="flex flex-col items-center gap-4 text-center">
        <CdntLogo />
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
            Nexo Bank
          </h1>
          <p className="text-white/60 text-sm mt-1.5 font-normal">
            Secure access for authorized administrators
          </p>
        </div>
      </div>

      {/* Card */}
      <motion.div
        className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
        animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
        transition={{ duration: 0.45 }}
      >
        <div className="p-8">
          <h2 className="text-[22px] font-bold text-gray-900 mb-1">Two-Factor Authentication</h2>
          <p className="text-gray-600 text-sm mb-7">
            Enter the 6-digit code from your authenticator app
          </p>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {/* Auth error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Code field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-code" className="text-sm font-semibold text-gray-800">
                Authentication Code
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600">
                  <KeyRound className="h-4.5 w-4.5" />
                </span>
                <input
                  id="auth-code"
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  maxLength={6}
                  value={code}
                  onChange={handleChange}
                  onBlur={() => {
                    setTouched(true);
                    setError(validateCode(code));
                  }}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-gray-900 text-sm tracking-[0.4em] font-mono placeholder:text-gray-400 placeholder:tracking-[0.4em] outline-none transition-all duration-200
                    ${error && touched
                      ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                      : "border-gray-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    }`}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              id="verify-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 mt-1 disabled:opacity-80 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #1C5AB8 100%)" }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                "Verify & Login"
              )}
            </button>
          </form>

          {/* Back to login */}
          <div className="flex justify-center mt-5">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-emerald-600 transition-colors group"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              Back to login
            </button>
          </div>

          {/* Divider + Demo code */}
          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-center text-xs text-gray-600">
              Demo 2FA code:{" "}
              <button
                type="button"
                onClick={() => setCode(DEMO_CODE)}
                className="text-emerald-600 hover:underline font-mono font-semibold"
              >
                {DEMO_CODE}
              </button>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Secure Admin Access notice */}
      <div
        className="w-full flex items-start gap-3 px-5 py-4 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
      >
        <Shield className="h-5 w-5 text-white/70 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-white">Secure Admin Access</p>
          <p className="text-xs text-white/55 mt-0.5 leading-relaxed">
            All admin sessions are encrypted and logged. Unauthorized access attempts are monitored and reported.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
