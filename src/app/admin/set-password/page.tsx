"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, Shield, AlertCircle, Loader2, Check } from "lucide-react";
import { CdntLogo } from "@/components/ui/CdntLogo";
import { supabase } from "@/lib/supabase";

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Setup token is missing. Please click the link in your email again.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // 1. Verify OTP using the token hash
      const { data: verifyData, error: verifyErr } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: "recovery",
      });

      if (verifyErr || !verifyData.user) {
        throw new Error(verifyErr?.message || "Invalid or expired invitation token.");
      }

      // 2. Set the permanent password
      const { error: updateErr } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateErr) {
        throw new Error(updateErr.message || "Failed to update password.");
      }

      // 3. Mark invite as accepted in the admin_users table
      const acceptRes = await fetch("/api/admin-users/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: verifyData.user.id }),
      });

      if (!acceptRes.ok) {
        const acceptData = await acceptRes.json();
        console.error("Failed to update status in admin_users:", acceptData.error);
      }

      setSuccess(true);

      // 4. Set auth cookie with admin email for RBAC identity and redirect
      const adminEmail = verifyData.user.email || "";
      document.cookie = `admin_auth=${encodeURIComponent(adminEmail)}; path=/; max-age=86400; SameSite=Lax`;

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
      <div className="p-8">
        <h2 className="text-[22px] font-bold text-gray-900 mb-1">Set Up Your Password</h2>
        <p className="text-gray-600 text-sm mb-7">Create a password for your administrator account</p>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-6 text-center"
          >
            <div className="h-12 w-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600 mb-4 animate-bounce">
              <Check className="h-6 w-6 stroke-[2.5]" />
            </div>
            <h3 className="font-extrabold text-gray-900 text-base">Account Activated!</h3>
            <p className="text-xs text-gray-600 mt-1.5 leading-relaxed font-semibold">
              Password set successfully. Redirecting you to the dashboard...
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {/* Error banner */}
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

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-gray-800">
                New Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600">
                  <Lock className="h-4.5 w-4.5" />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-800">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600">
                  <Lock className="h-4.5 w-4.5" />
                </span>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !token}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 mt-1 disabled:opacity-80 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #0A3D91 0%, #1650AB 50%, #1C5AB8 100%)" }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Password…
                </>
              ) : (
                "Set Password & Login"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-slate-900" style={{ background: "radial-gradient(circle at top, #1E293B 0%, #0F172A 100%)" }}>
      <div className="w-full max-w-[440px] flex flex-col gap-6">
        {/* Logo + Title */}
        <div className="flex flex-col items-center gap-4 text-center">
          <CdntLogo />
          <div>
            <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
              Nexo Bank
            </h1>
            <p className="text-white/60 text-sm mt-1.5 font-normal">
              Administrator Setup Account Activation
            </p>
          </div>
        </div>

        {/* Form Wrap in Suspense */}
        <Suspense
          fallback={
            <div className="w-full bg-white rounded-2xl p-8 shadow-2xl flex items-center justify-center h-[300px]">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
          }
        >
          <SetPasswordForm />
        </Suspense>

        {/* Secure Admin Access notice */}
        <div
          className="w-full flex items-start gap-3 px-5 py-4 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <Shield className="h-5 w-5 text-white/70 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">Secure Admin Setup</p>
            <p className="text-xs text-white/55 mt-0.5 leading-relaxed">
              All activation sessions are encrypted. Unauthorized password setup attempts are logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
