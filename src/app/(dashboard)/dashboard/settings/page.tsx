"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  DollarSign,
  ShieldAlert,
  Bell,
  Save,
  Loader2,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RequirePermission } from "@/components/layout/RequirePermission";

const BRAND_GRADIENT = "linear-gradient(135deg, #0A3D91 0%, #1650AB 100%)";

export default function AdminSettingsPage() {
  return (
    <RequirePermission permission="edit-settings">
      <AdminSettingsPageContent />
    </RequirePermission>
  );
}

function AdminSettingsPageContent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // General Settings State
  const [platformName, setPlatformName] = useState("Nexo Bank");
  const [supportEmail, setSupportEmail] = useState("support@Nexobank.ca");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Financial Settings State
  const [platformFee, setPlatformFee] = useState("0.50");
  const [maxWithdrawal, setMaxWithdrawal] = useState("50000");
  const [minWithdrawal, setMinWithdrawal] = useState("100");
  const [autoApprove, setAutoApprove] = useState(false);

  // Security Settings State
  const [requireKyc, setRequireKyc] = useState(true);
  const [require2fa, setRequire2fa] = useState(true);

  // Notification Settings State
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          const s = data.settings || {};

          if (s.platformName) setPlatformName(s.platformName);
          if (s.supportEmail) setSupportEmail(s.supportEmail);
          if (s.maintenanceMode) setMaintenanceMode(s.maintenanceMode === "true");
          if (s.platformFee) setPlatformFee(s.platformFee);
          if (s.maxWithdrawal) setMaxWithdrawal(s.maxWithdrawal);
          if (s.minWithdrawal) setMinWithdrawal(s.minWithdrawal);
          if (s.autoApprove) setAutoApprove(s.autoApprove === "true");
          if (s.requireKyc) setRequireKyc(s.requireKyc === "true");
          if (s.require2fa) setRequire2fa(s.require2fa === "true");
          if (s.emailNotifications) setEmailNotifications(s.emailNotifications === "true");
          if (s.smsNotifications) setSmsNotifications(s.smsNotifications === "true");
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Save Settings Function
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (saving) return;

    setSaving(true);

    const payload = {
      platformName,
      supportEmail,
      maintenanceMode: String(maintenanceMode),
      platformFee,
      maxWithdrawal,
      minWithdrawal,
      autoApprove: String(autoApprove),
      requireKyc: String(requireKyc),
      require2fa: String(require2fa),
      emailNotifications: String(emailNotifications),
      smsNotifications: String(smsNotifications),
    };

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to save settings");
      }

      triggerToast("Settings saved successfully!");
    } catch (err) {
      console.error("Error saving settings:", err);
      triggerToast("Error saving settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Toggle Switch Component
  const ToggleSwitch = ({
    checked,
    onChange,
    id
  }: {
    checked: boolean;
    onChange: (val: boolean) => void;
    id: string;
  }) => {
    return (
      <button
        type="button"
        id={id}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus:ring-2 focus:ring-blue-50 focus:ring-offset-1",
          checked ? "bg-[#0A3D91]" : "bg-gray-200"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-lg text-xs font-semibold text-gray-800"
          >
            <span className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-bold text-gray-900 leading-tight">Admin Settings</h1>
          <p className="mt-1 text-sm text-gray-600">Configure platform settings and preferences</p>
        </div>

        <button
          onClick={() => handleSaveSettings()}
          disabled={saving || loading}
          className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shrink-0"
          style={{ background: BRAND_GRADIENT }}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </button>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* 1. General Settings */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="h-10 w-10 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-sm">General Settings</h3>
              <p className="text-[10px] text-gray-600 font-mono mt-0.5 font-bold uppercase">Platform configuration</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-14 bg-gray-50 rounded-xl" />
              <div className="h-14 bg-gray-50 rounded-xl" />
              <div className="h-14 bg-gray-50 rounded-xl" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Platform Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-gray-600 uppercase tracking-wider">Platform Name</label>
                <input
                  type="text"
                  required
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                />
              </div>

              {/* Support Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-gray-600 uppercase tracking-wider">Support Email</label>
                <input
                  type="email"
                  required
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                />
              </div>

              {/* Maintenance Mode */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <p className="text-xs font-extrabold text-gray-800">Maintenance Mode</p>
                  <p className="text-[10px] text-gray-600 mt-0.5 font-semibold">Temporarily disable platform access</p>
                </div>
                <ToggleSwitch
                  id="toggle-maintenance"
                  checked={maintenanceMode}
                  onChange={setMaintenanceMode}
                />
              </div>
            </div>
          )}
        </div>

        {/* 2. Financial Settings */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="h-10 w-10 rounded-xl bg-green-50/70 border border-green-100 flex items-center justify-center text-green-700 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-sm">Financial Settings</h3>
              <p className="text-[10px] text-gray-600 font-mono mt-0.5 font-bold uppercase">Withdrawal limits and fees</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="grid grid-cols-2 gap-4">
                <div className="h-14 bg-gray-50 rounded-xl" />
                <div className="h-14 bg-gray-50 rounded-xl" />
              </div>
              <div className="h-14 bg-gray-50 rounded-xl" />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Platform Fee */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-gray-600 uppercase tracking-wider">Platform Fee (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={platformFee}
                    onChange={(e) => setPlatformFee(e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                  />
                </div>

                {/* Max Withdrawal */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-gray-600 uppercase tracking-wider">Max Withdrawal (CAD)</label>
                  <input
                    type="number"
                    required
                    value={maxWithdrawal}
                    onChange={(e) => setMaxWithdrawal(e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                  />
                </div>
              </div>

              {/* Min Withdrawal */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-gray-600 uppercase tracking-wider">Min Withdrawal (CAD)</label>
                <input
                  type="number"
                  required
                  value={minWithdrawal}
                  onChange={(e) => setMinWithdrawal(e.target.value)}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                />
              </div>

              {/* Auto Approve */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <p className="text-xs font-extrabold text-gray-800">Auto-Approve Withdrawals</p>
                  <p className="text-[10px] text-gray-600 mt-0.5 font-semibold">Under $1,000 CAD</p>
                </div>
                <ToggleSwitch
                  id="toggle-autoapprove"
                  checked={autoApprove}
                  onChange={setAutoApprove}
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. Security Settings */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="h-10 w-10 rounded-xl bg-purple-50/70 border border-purple-100 flex items-center justify-center text-purple-700 shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-sm">Security Settings</h3>
              <p className="text-[10px] text-gray-600 font-mono mt-0.5 font-bold uppercase">Authentication and verification</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-14 bg-gray-50 rounded-xl" />
              <div className="h-14 bg-gray-50 rounded-xl" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Require KYC */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <p className="text-xs font-extrabold text-gray-800">Require KYC Verification</p>
                  <p className="text-[10px] text-gray-600 mt-0.5 font-semibold">Users must complete KYC before trading</p>
                </div>
                <ToggleSwitch
                  id="toggle-requirekyc"
                  checked={requireKyc}
                  onChange={setRequireKyc}
                />
              </div>

              {/* Require 2FA */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <p className="text-xs font-extrabold text-gray-800">Require Two-Factor Authentication</p>
                  <p className="text-[10px] text-gray-600 mt-0.5 font-semibold">Mandatory 2FA for all withdrawals</p>
                </div>
                <ToggleSwitch
                  id="toggle-require2fa"
                  checked={require2fa}
                  onChange={setRequire2fa}
                />
              </div>
            </div>
          )}
        </div>

        {/* 4. Notification Settings */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="h-10 w-10 rounded-xl bg-orange-50/70 border border-orange-100 flex items-center justify-center text-orange-700 shrink-0">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-sm">Notification Settings</h3>
              <p className="text-[10px] text-gray-600 font-mono mt-0.5 font-bold uppercase">Alert preferences</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-14 bg-gray-50 rounded-xl" />
              <div className="h-14 bg-gray-50 rounded-xl" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <p className="text-xs font-extrabold text-gray-800">Email Notifications</p>
                  <p className="text-[10px] text-gray-600 mt-0.5 font-semibold">Send notifications via email</p>
                </div>
                <ToggleSwitch
                  id="toggle-emailnotifications"
                  checked={emailNotifications}
                  onChange={setEmailNotifications}
                />
              </div>

              {/* SMS Notifications */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <p className="text-xs font-extrabold text-gray-800">SMS Notifications</p>
                  <p className="text-[10px] text-gray-600 mt-0.5 font-semibold">Send notifications via SMS</p>
                </div>
                <ToggleSwitch
                  id="toggle-smsnotifications"
                  checked={smsNotifications}
                  onChange={setSmsNotifications}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Save Action */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving || loading}
            className="flex items-center gap-2 px-6 h-11 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shrink-0"
            style={{ background: BRAND_GRADIENT }}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4.5 w-4.5" />
            )}
            Save All Settings
          </button>
        </div>
      </form>
    </div>
  );
}
