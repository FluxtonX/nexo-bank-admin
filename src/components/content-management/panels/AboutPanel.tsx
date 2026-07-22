"use client";

import { useState, useEffect } from "react";
import { Globe } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  ListItem,
  makeList,
  TextField,
  ListEditor,
  ContentCard,
  updateContentKey,
} from "../shared/FieldComponents";

export function AboutPanel() {
  const [loading, setLoading] = useState(true);
  const [headerTitle, setHeaderTitle] = useState("About Nexo Bank");
  const [headerSub, setHeaderSub] = useState("We're building the future of banking in Canada...");
  const [missionText, setMissionText] = useState("To democratize access to cryptocurrency...");
  const [visionText, setVisionText] = useState("To become Canada's most trusted digital banking...");
  const [whyTitle, setWhyTitle] = useState("Why Choose Nexo Bank");
  const [whySub, setWhySub] = useState("Built with trust, security, and simplicity at the core");
  const [secBullets, setSecBullets] = useState<ListItem[]>([]);
  const [custBullets, setCustBullets] = useState<ListItem[]>([]);
  const [compBullets, setCompBullets] = useState<ListItem[]>([]);
  const [stats, setStats] = useState<ListItem[]>([]);
  const [ctaTitle, setCtaTitle] = useState("Ready to Get Started?");
  const [ctaSub, setCtaSub] = useState("Join thousands of Canadians who trust Nexo Bank...");
  const [ctaBtn, setCtaBtn] = useState("Open Your Account Today");

  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase
          .from("site_content")
          .select("key, value")
          .eq("category", "about");
        if (!error && data) {
          data.forEach((row) => {
            if (row.key === "about.hero.heading") setHeaderTitle(row.value);
            if (row.key === "about.hero.body") setHeaderSub(row.value);
            if (row.key === "about.mission.body") setMissionText(row.value);
            if (row.key === "about.vision.body") setVisionText(row.value);
            if (row.key === "about.why.heading") setWhyTitle(row.value);
            if (row.key === "about.why.subheading") setWhySub(row.value);
            if (row.key === "about.why.features") {
              const features = row.value || [];
              if (features[0]) setSecBullets(makeList(features[0].items || []));
              if (features[1]) setCustBullets(makeList(features[1].items || []));
              if (features[2]) setCompBullets(makeList(features[2].items || []));
            }
            if (row.key === "about.stats.items") {
              const items = row.value || [];
              setStats(makeList(items.map((i: any) => `${i.value} / ${i.label}`)));
            }
            if (row.key === "about.cta.heading") setCtaTitle(row.value);
            if (row.key === "about.cta.body") setCtaSub(row.value);
            if (row.key === "about.cta.btn") setCtaBtn(row.value);
          });
        }
      } catch (err) {
        console.error("Error loading about settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const saveHeader = async () => {
    await updateContentKey("about.hero.heading", headerTitle, "text", "about", "Hero Heading");
    await updateContentKey("about.hero.body", headerSub, "text_multiline", "about", "Hero Description");
  };

  const saveMissionVision = async () => {
    await updateContentKey("about.mission.body", missionText, "text_multiline", "about", "Mission Statement");
    await updateContentKey("about.vision.body", visionText, "text_multiline", "about", "Vision Statement");
  };

  const saveWhy = async () => {
    await updateContentKey("about.why.heading", whyTitle, "text", "about", "Section Title");
    await updateContentKey("about.why.subheading", whySub, "text", "about", "Section Subtitle");

    const features = [
      { icon: "Shield", title: "Bank-Grade Security", items: secBullets.map(b => b.value) },
      { icon: "Users", title: "Customer First", items: custBullets.map(b => b.value) },
      { icon: "Award", title: "Fully Compliant", items: compBullets.map(b => b.value) }
    ];
    await updateContentKey("about.why.features", features, "json_complex", "about", "Feature Cards");
  };

  const saveStats = async () => {
    const items = stats.map(s => {
      const parts = s.value.split(" / ");
      return {
        value: parts[0]?.trim() || "",
        label: parts[1]?.trim() || ""
      };
    });
    await updateContentKey("about.stats.items", items, "json_array", "about", "Stats Items");
  };

  const saveCta = async () => {
    await updateContentKey("about.cta.heading", ctaTitle, "text", "about", "Heading");
    await updateContentKey("about.cta.body", ctaSub, "text_multiline", "about", "Subheading");
    await updateContentKey("about.cta.btn", ctaBtn, "text", "about", "Button Label");
  };

  if (loading) return <div className="text-sm text-gray-500 py-4">Loading About Settings...</div>;

  return (
    <div className="space-y-6">
      <ContentCard title="Header Section" icon={<Globe className="h-4 w-4" />} onSave={saveHeader}>
        <TextField label="Title" value={headerTitle} onChange={setHeaderTitle} />
        <TextField label="Subtitle" value={headerSub} onChange={setHeaderSub} multiline rows={2} />
      </ContentCard>
      <ContentCard title="Mission & Vision" icon={<Globe className="h-4 w-4" />} onSave={saveMissionVision}>
        <TextField label="Mission Statement" value={missionText} onChange={setMissionText} multiline rows={3} />
        <TextField label="Vision Statement" value={visionText} onChange={setVisionText} multiline rows={3} />
      </ContentCard>
      <ContentCard title="Why Choose Us" icon={<Globe className="h-4 w-4" />} onSave={saveWhy}>
        <TextField label="Section Title" value={whyTitle} onChange={setWhyTitle} />
        <TextField label="Section Subtitle" value={whySub} onChange={setWhySub} />
        <ListEditor label="Security Bullets" items={secBullets} onChange={setSecBullets} />
        <ListEditor label="Customer First Bullets" items={custBullets} onChange={setCustBullets} />
        <ListEditor label="Compliance Bullets" items={compBullets} onChange={setCompBullets} />
      </ContentCard>
      <ContentCard title="Stats Section" icon={<Globe className="h-4 w-4" />} onSave={saveStats}>
        <ListEditor label="Stats (Format: Value / Label)" items={stats} onChange={setStats} />
      </ContentCard>
      <ContentCard title="CTA Section" icon={<Globe className="h-4 w-4" />} onSave={saveCta}>
        <TextField label="Heading" value={ctaTitle} onChange={setCtaTitle} />
        <TextField label="Subheading" value={ctaSub} onChange={setCtaSub} multiline rows={2} />
        <TextField label="Button Label" value={ctaBtn} onChange={setCtaBtn} />
      </ContentCard>
    </div>
  );
}
