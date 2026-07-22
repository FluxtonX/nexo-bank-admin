"use client";

import { useState, useEffect } from "react";
import { Megaphone, ToggleLeft, ToggleRight, Info, Link, LayoutDashboard, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  FieldLabel,
  TextField,
  SaveRow,
  ContentCard,
  updateContentKey,
  BRAND_GRADIENT,
} from "../shared/FieldComponents";

const BANNER_COLORS = [
  { id: "blue",   bg: "#1650AB" },
  { id: "amber",  bg: "#D97706" },
  { id: "green",  bg: "#059669" },
  { id: "red",    bg: "#DC2626" },
  { id: "purple", bg: "#7C3AED" },
  { id: "dark",   bg: "#111827" },
];

export function GlobalPanel() {
  const [bannerEnabled, setBannerEnabled] = useState(false);
  const [bannerText, setBannerText] = useState("Welcome to NorthUnion — your trusted digital asset platform.");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerColor, setBannerColor] = useState("blue");
  const [bannerSaved, setBannerSaved] = useState(false);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [headerTagline, setHeaderTagline] = useState("Here's what's happening with your portfolio today");
  const [loading, setLoading] = useState(true);

  // Load from Supabase on mount
  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase
          .from("site_content")
          .select("key, value")
          .eq("category", "global");
        if (!error && data) {
          data.forEach((row) => {
            if (row.key === "global.banner.enabled") setBannerEnabled(row.value);
            if (row.key === "global.banner.text") setBannerText(row.value);
            if (row.key === "global.banner.url") setBannerUrl(row.value);
            if (row.key === "global.banner.color") setBannerColor(row.value);
            if (row.key === "global.header_tagline") setHeaderTagline(row.value);
          });
        }
      } catch (err) {
        console.error("Error fetching global content:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const saveBanner = async () => {
    await updateContentKey("global.banner.enabled", bannerEnabled, "boolean", "global", "Banner Enabled");
    await updateContentKey("global.banner.text", bannerText, "text", "global", "Banner Message");
    await updateContentKey("global.banner.url", bannerUrl, "text", "global", "Link URL");
    await updateContentKey("global.banner.color", bannerColor, "text", "global", "Color Theme");
  };

  const saveTagline = async () => {
    await updateContentKey("global.header_tagline", headerTagline, "text", "global", "Header Tagline");
  };

  const selectedBg = BANNER_COLORS.find((c) => c.id === bannerColor)?.bg ?? "#1650AB";

  if (loading) {
    return <div className="text-sm text-gray-500 py-4">Loading Settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Announcement Banner Card */}
      <div className="rounded-xl border-2 border-blue-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between" style={{ background: BRAND_GRADIENT }}>
          <div className="flex items-center gap-2.5">
            <Megaphone className="h-[18px] w-[18px] text-white" />
            <h3 className="text-[14px] font-bold text-white">Announcement Banner</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-white/80 font-medium">{bannerEnabled ? "Live" : "Hidden"}</span>
            <button onClick={() => setBannerEnabled((v) => !v)} className="text-white cursor-pointer">
              {bannerEnabled
                ? <ToggleRight className="h-7 w-7 text-emerald-300" />
                : <ToggleLeft className="h-7 w-7 text-white/50" />}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="px-5 pt-4">
          <FieldLabel>Live Preview</FieldLabel>
          <div
            className="rounded-lg px-4 py-3 text-sm font-semibold flex items-center gap-2"
            style={{ backgroundColor: selectedBg, color: "white" }}
          >
            <Info className="h-4 w-4 shrink-0 opacity-80" />
            <span className="flex-1 truncate">{bannerText || "Banner text will appear here..."}</span>
            {bannerUrl && <span className="underline opacity-80 text-xs shrink-0">Learn more →</span>}
          </div>
          {!bannerEnabled && (
            <p className="text-[11px] text-amber-600 mt-1.5 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Banner is hidden — toggle ON to show it to users.
            </p>
          )}
        </div>

        <div className="px-5 py-5 space-y-5">
          <TextField
            label="Banner Message"
            value={bannerText}
            onChange={setBannerText}
            placeholder="Enter announcement text..."
          />

          <div>
            <FieldLabel>Link URL (optional)</FieldLabel>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://northunion.ca/announcement"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Color Theme</FieldLabel>
            <div className="flex flex-wrap gap-2 mt-1">
              {BANNER_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setBannerColor(c.id)}
                  title={c.id}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 cursor-pointer transition-transform hover:scale-110",
                    bannerColor === c.id ? "border-gray-900 scale-110 shadow-md" : "border-transparent"
                  )}
                  style={{ backgroundColor: c.bg }}
                />
              ))}
            </div>
          </div>

          <SaveRow
            onSave={async () => {
              try {
                setBannerSaving(true);
                await saveBanner();
                setBannerSaved(true);
                setTimeout(() => setBannerSaved(false), 2000);
              } catch (err) {
                console.error("Save failed:", err);
              } finally {
                setBannerSaving(false);
              }
            }}
            saved={bannerSaved}
            loading={bannerSaving}
          />
        </div>
      </div>

      <ContentCard title="Header Tagline" icon={<LayoutDashboard className="h-4 w-4" />} onSave={saveTagline}>
        <TextField
          label="Text shown in the dashboard top header bar"
          value={headerTagline}
          onChange={setHeaderTagline}
        />
      </ContentCard>

    </div>
  );
}
