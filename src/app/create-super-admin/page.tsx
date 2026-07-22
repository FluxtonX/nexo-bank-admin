"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, User, Shield, ArrowLeft, Loader2, CheckCircle, AlertCircle, UserPlus } from "lucide-react";
import { CdntLogo } from "@/components/ui/CdntLogo";

interface FormValues {
  email: string;
  fullName: string;
}

interface FormErrors {
  email?: string;
  fullName?: string;
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!values.fullName.trim()) {
    errors.fullName = "Full name is required.";
  } else if (values.fullName.trim().length < 2) {
    errors.fullName = "Full name must be at least 2 characters.";
  }

  return errors;
}

export default function CreateSuperAdminPage() {
  const router = useRouter();

  const [values, setValues] = useState<FormValues>({ email: "", fullName: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValues((prev) => ({ ...prev, [field]: val }));
    setSubmitError(null);
    const errs = validate({ ...values, [field]: val });
    setErrors((prev) => ({ ...prev, [field]: errs[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setSubmitError(null);

    try {
      // First, get the super admin role ID
      const rolesRes = await fetch("/api/roles", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!rolesRes.ok) {
        throw new Error("Failed to fetch roles");
      }

      const rolesData = await rolesRes.json();
      const superAdminRole = rolesData.roles?.find((r: any) => r.code === "super_admin");

      if (!superAdminRole) {
        throw new Error("Super admin role not found. Please create it first in the database.");
      }

      // Create the super admin
      const createRes = await fetch("/api/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          fullName: values.fullName,
          roleId: superAdminRole.id,
        }),
      });

      if (!createRes.ok) {
        const errorData = await createRes.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to create super admin");
      }

      const createData = await createRes.json();

      if (createData.warning) {
        console.warn("Admin created with warning:", createData.warning);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      console.error("Create super admin error:", err);
      setSubmitError(err instanceof Error ? err.message : "Failed to create super admin. Please try again.");
    } finally {
      setLoading(false);
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
            Create Super Administrator
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </button>

          <h2 className="text-[22px] font-bold text-gray-900 mb-1">Create Super Admin</h2>
          <p className="text-gray-600 text-sm mb-7">
            This will create a super administrator with full access to all features. An invite email will be sent to set their password.
          </p>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <CheckCircle className="h-16 w-16 text-emerald-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Super Admin Created!</h3>
              <p className="text-gray-600 text-sm text-center mb-4">
                An invite email has been sent to <strong>{values.email}</strong>. They can set their password using the link in the email.
              </p>
              <p className="text-xs text-gray-500">Redirecting to login...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              {/* Submit error banner */}
              {submitError && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  {submitError}
                </div>
              )}

              {/* Full name field */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fullName" className="text-sm font-semibold text-gray-800">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600">
                    <User className="h-4.5 w-4.5" />
                  </span>
                  <input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="John Doe"
                    value={values.fullName}
                    onChange={handleChange("fullName")}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-gray-900 text-sm placeholder:text-gray-500 outline-none transition-all duration-200
                      ${errors.fullName
                        ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                        : "border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Email field */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-semibold text-gray-800">
                  Email Address
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
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-gray-900 text-sm placeholder:text-gray-500 outline-none transition-all duration-200
                      ${errors.email
                        ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                        : "border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Warning notice */}
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                <Shield className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Super Admin Access</p>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    This user will have full access to all admin features including user management, content management, and system settings.
                  </p>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 mt-1 disabled:opacity-80 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #0A3D91 0%, #1650AB 50%, #1C5AB8 100%)" }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Super Admin…
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Create Super Admin
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Production notice */}
      <div
        className="w-full flex items-start gap-3 px-5 py-4 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
      >
        <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-white">Production Deployment</p>
          <p className="text-xs text-white/55 mt-0.5 leading-relaxed">
            Before going to production, remove the demo account (admin@Nexobank.ca) from the login page and disable demo credentials in the code.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
