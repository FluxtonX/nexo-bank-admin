"use client";

import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { TextField, ContentCard, updateContentKey } from "../shared/FieldComponents";

export function SettingsPanel() {
  const [dailyUnverified, setDailyUnverified] = useState("1,000");
  const [dailyVerified, setDailyVerified] = useState("5,000,000");
  const [monthlyUnverified, setMonthlyUnverified] = useState("10,000");
  const [monthlyVerified, setMonthlyVerified] = useState("50,000,000");

  // Load data from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase
          .from("site_content")
          .select("key, value")
          .eq("category", "settings");
        if (!error && data) {
          data.forEach((row) => {
            switch (row.key) {
              case "settings.daily_unverified":
                setDailyUnverified(row.value);
                break;
              case "settings.daily_verified":
                setDailyVerified(row.value);
                break;
              case "settings.monthly_unverified":
                setMonthlyUnverified(row.value);
                break;
              case "settings.monthly_verified":
                setMonthlyVerified(row.value);
                break;
              default:
                break;
            }
          });
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      }
    }
    loadData();
  }, []);

  // Save handler
  const saveLimits = async () => {
    await updateContentKey("settings.daily_unverified", dailyUnverified, "text", "settings", "Daily Unverified Limit");
    await updateContentKey("settings.daily_verified", dailyVerified, "text", "settings", "Daily Verified Limit");
    await updateContentKey("settings.monthly_unverified", monthlyUnverified, "text", "settings", "Monthly Unverified Limit");
    await updateContentKey("settings.monthly_verified", monthlyVerified, "text", "settings", "Monthly Verified Limit");
  };

  return (
    <div className="space-y-6">
      <ContentCard title="Withdrawal Limits Display" icon={<Settings className="h-4 w-4" />} onSave={saveLimits}>
        <p className="text-[12px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 -mt-1 mb-2">
          Warning: These are display-only values. Actual enforcement must be updated in the backend separately.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Daily limit — Unverified (CAD)" value={dailyUnverified} onChange={setDailyUnverified} placeholder="1,000" helper="Shown to users without KYC." updatedAt="Jun 15, 2026 at 9:00 AM" />
          <TextField label="Daily limit — Verified (CAD)" value={dailyVerified} onChange={setDailyVerified} placeholder="5,000,000" helper="Shown to KYC-verified users." updatedAt="Jun 15, 2026 at 9:00 AM" />
          <TextField label="Monthly limit — Unverified (CAD)" value={monthlyUnverified} onChange={setMonthlyUnverified} placeholder="10,000" updatedAt="Jun 15, 2026 at 9:00 AM" />
          <TextField label="Monthly limit — Verified (CAD)" value={monthlyVerified} onChange={setMonthlyVerified} placeholder="50,000,000" updatedAt="Jun 15, 2026 at 9:00 AM" />
        </div>
      </ContentCard>
    </div>
  );
}
