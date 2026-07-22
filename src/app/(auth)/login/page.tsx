"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Shield, AlertCircle, Loader2, UserPlus } from "lucide-react";
import { CdntLogo } from "@/components/ui/CdntLogo";
import { supabase } from "@/lib/supabase";

/* ─── Types ─────────────────────────────────────────────────────── */
interface FormValues {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

const DEMO_EMAIL = "admin@Nexobank.ca";
const DEMO_PASSWORD = "admin123";

/* ─── Validation ─────────────────────────────────────────────────── */
function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.email.trim()) {
    errors.email = "Admin email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  return errors;
}

/* ─── Page ───────────────────────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter();

  const [values, setValues] = useState<FormValues>({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});

  const handleChange = (field: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValues((prev) => ({ ...prev, [field]: val }));
    setAuthError(null);
    // Live validation after first touch
    if (touched[field]) {
      const errs = validate({ ...values, [field]: val });
      setErrors((prev) => ({ ...prev, [field]: errs[field] }));
    }
  };

  const handleBlur = (field: keyof FormValues) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errs = validate(values);
    setErrors((prev) => ({ ...prev, [field]: errs[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setAuthError(null);

    // Simulate network delay
    await new Promise((res) => setTimeout(res, 1200));

    if (values.email === DEMO_EMAIL && values.password === DEMO_PASSWORD) {
      try {
        // --- Static Mode Reversion ---
        const staticCode = "123456";

        // Uncomment below to enable dynamic Brevo emails later:
        /*
        const dynamicCode = Math.floor(100000 + Math.random() * 900000).toString();
        const res = await fetch("/api/send-2fa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: values.email, code: dynamicCode }),
        });
        if (!res.ok) throw new Error("Failed to send 2FA email");
        sessionStorage.setItem("auth_hash", btoa(dynamicCode));
        */

        sessionStorage.setItem("auth_email", values.email);
        sessionStorage.setItem("auth_hash", btoa(staticCode)); // Storing static hash for now
        router.push("/two-factor");
      } catch (err) {
        setLoading(false);
        setAuthError("Failed to send verification code. Please try again.");
      }
    } else {
      // Flow 2 — Real invited admin via Supabase auth
      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });

        if (signInError) {
          setLoading(false);
          setAuthError("Invalid credentials.");
          try {
            await fetch("/api/security-logs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "Failed Login Attempt",
                category: "Auth",
                severity: "Warning",
                userName: "Unknown",
                userId: "N/A",
                details: `Failed Supabase auth for admin login attempt with email: ${values.email}`,
                performedByAdmin: null
              })
            });
          } catch (logErr) {
            console.error("Failed to log admin login failure:", logErr);
          }
          return;
        }

        // Auth succeeded — verify they exist in admin_users and are active
        const { data: adminRow, error: adminCheckErr } = await supabase
          .from("admin_users")
          .select("is_active")
          .eq("email", values.email)
          .single();

        if (adminCheckErr || !adminRow || !adminRow.is_active) {
          // Not an authorized admin — sign them out
          await supabase.auth.signOut();
          setLoading(false);
          setAuthError("Access denied — not an authorized admin.");
          return;
        }

        // Admin verified — set cookie and redirect (skip OTP)
        document.cookie = `admin_auth=${encodeURIComponent(values.email)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        router.push("/dashboard");
      } catch (err) {
        setLoading(false);
        setAuthError("Something went wrong. Please try again.");
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
      <div className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <h2 className="text-[22px] font-bold text-gray-900 mb-1">Admin Login</h2>
          <p className="text-gray-600 text-sm mb-7">Enter your administrator credentials</p>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {/* Auth error banner */}
            <AnimatePresence>
              {authError && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  {authError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-gray-800">
                Admin Email
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@Nexobank.ca"
                  value={values.email}
                  onChange={handleChange("email")}
                  onBlur={handleBlur("email")}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-gray-900 text-sm placeholder:text-gray-500 outline-none transition-all duration-200
                    ${errors.email
                      ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                      : "border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    }`}
                />
              </div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-xs text-red-500 flex items-center gap-1"
                  >
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-gray-800">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600">
                  <Lock className="h-4.5 w-4.5" />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={values.password}
                  onChange={handleChange("password")}
                  onBlur={handleBlur("password")}
                  className={`w-full pl-10 pr-11 py-3 rounded-xl border text-gray-900 text-sm placeholder:text-gray-500 outline-none transition-all duration-200
                    ${errors.password
                      ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                      : "border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-xs text-red-500 flex items-center gap-1"
                  >
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 mt-1 disabled:opacity-80 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #0A3D91 0%, #1650AB 50%, #1C5AB8 100%)" }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                "Continue"
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <p className="text-center text-xs text-gray-600 mt-5">
            Demo credentials:{" "}
            <button
              type="button"
              onClick={() => setValues({ email: DEMO_EMAIL, password: DEMO_PASSWORD })}
              className="text-blue-600 hover:underline font-medium"
            >
              admin@Nexobank.ca / admin123
            </button>
          </p>

          {/* Create Super Admin button */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => router.push("/create-super-admin")}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Create Super Admin
            </button>
          </div>
        </div>
      </div>

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
