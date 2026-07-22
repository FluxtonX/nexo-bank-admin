"use client";

import { useState, useEffect } from "react";
import { Globe } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  ListItem,
  ComplexListItem,
  makeList,
  makeComplexList,
  TextField,
  ListEditor,
  ComplexListEditor,
  ContentCard,
  updateContentKey,
} from "../shared/FieldComponents";

export function SecurityPanel() {
  const [loading, setLoading] = useState(true);
  const [headerTitle, setHeaderTitle] = useState("Your Security is Our Priority");
  const [headerSub, setHeaderSub] = useState("We employ bank-grade security measures to protect your funds...");
  const [badges, setBadges] = useState<ListItem[]>([]);
  const [archTitle, setArchTitle] = useState("Multi-Layer Security Architecture");
  const [archSub, setArchSub] = useState("Every layer designed to protect your assets");
  const [authTitle, setAuthTitle] = useState("Two-Factor Authentication (2FA)");
  const [authDesc, setAuthDesc] = useState("Add an extra layer of security to your account with mandatory two-factor authentication...");
  const [authBullets, setAuthBullets] = useState<ListItem[]>([]);
  const [compTitle, setCompTitle] = useState("Regulatory Compliance");
  const [compSub, setCompSub] = useState("Fully compliant with Canadian financial regulations");
  const [compCards, setCompCards] = useState<ComplexListItem[]>([]);
  const [ctaTitle, setCtaTitle] = useState("Your Security, Our Promise");
  const [ctaSub, setCtaSub] = useState("Experience the peace of mind that comes with bank-grade security.");
  const [ctaBtn, setCtaBtn] = useState("Open Secure Account");

  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase
          .from("site_content")
          .select("key, value")
          .eq("category", "security");
        if (!error && data) {
          data.forEach((row) => {
            if (row.key === "security.hero.heading") setHeaderTitle(row.value);
            if (row.key === "security.hero.body") setHeaderSub(row.value);
            if (row.key === "security.badges.items") {
              const list = row.value || [];
              setBadges(makeList(list.map((b: any) => b.title)));
            }
            if (row.key === "security.architecture.heading") setArchTitle(row.value);
            if (row.key === "security.architecture.subheading") setArchSub(row.value);
            if (row.key === "security.twofa.heading") setAuthTitle(row.value);
            if (row.key === "security.twofa.body") setAuthDesc(row.value);
            if (row.key === "security.twofa.benefits") setAuthBullets(makeList(row.value || []));
            if (row.key === "security.compliance.heading") setCompTitle(row.value);
            if (row.key === "security.compliance.subheading") setCompSub(row.value);
            if (row.key === "security.compliance.items") {
              const list = row.value || [];
              setCompCards(makeComplexList(list.map((item: any) => ({ title: item.title, description: item.description }))));
            }
            if (row.key === "security.cta.heading") setCtaTitle(row.value);
            if (row.key === "security.cta.body") setCtaSub(row.value);
            if (row.key === "security.cta.btn") setCtaBtn(row.value);
          });
        }
      } catch (err) {
        console.error("Error loading security settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const saveHeader = async () => {
    await updateContentKey("security.hero.heading", headerTitle, "text", "security", "Hero Heading");
    await updateContentKey("security.hero.body", headerSub, "text_multiline", "security", "Hero Description");
  };

  const saveBadges = async () => {
    const icons = ["ShieldCheck", "Lock", "Server", "FileText"];
    const list = badges.map((b, idx) => ({
      icon: icons[idx] || "Shield",
      title: b.value
    }));
    await updateContentKey("security.badges.items", list, "json_array", "security", "Quick Credentials Badges");
  };

  const saveArch = async () => {
    await updateContentKey("security.architecture.heading", archTitle, "text", "security", "Architecture Title");
    await updateContentKey("security.architecture.subheading", archSub, "text", "security", "Architecture Subtitle");
  };

  const saveTwofa = async () => {
    await updateContentKey("security.twofa.heading", authTitle, "text", "security", "2FA Title");
    await updateContentKey("security.twofa.body", authDesc, "text_multiline", "security", "2FA Description");
    await updateContentKey("security.twofa.benefits", authBullets.map(b => b.value), "json_array", "security", "2FA Benefits Checklist");
  };

  const saveCompliance = async () => {
    await updateContentKey("security.compliance.heading", compTitle, "text", "security", "Compliance Title");
    await updateContentKey("security.compliance.subheading", compSub, "text", "security", "Compliance Subtitle");
    
    const icons = ["Shield", "ShieldCheck", "FileText"];
    const list = compCards.map((c, idx) => ({
      icon: icons[idx] || "Shield",
      title: c.title,
      description: c.description
    }));
    await updateContentKey("security.compliance.items", list, "json_complex", "security", "Compliance Pillars");
  };

  const saveCta = async () => {
    await updateContentKey("security.cta.heading", ctaTitle, "text", "security", "Heading");
    await updateContentKey("security.cta.body", ctaSub, "text_multiline", "security", "Subheading");
    await updateContentKey("security.cta.btn", ctaBtn, "text", "security", "Button Label");
  };

  if (loading) return <div className="text-sm text-gray-500 py-4">Loading Security Settings...</div>;

  return (
    <div className="space-y-6">
      <ContentCard title="Header Section" icon={<Globe className="h-4 w-4" />} onSave={saveHeader}>
        <TextField label="Title" value={headerTitle} onChange={setHeaderTitle} />
        <TextField label="Subtitle" value={headerSub} onChange={setHeaderSub} multiline rows={2} />
      </ContentCard>
      <ContentCard title="Four Badges" icon={<Globe className="h-4 w-4" />} onSave={saveBadges}>
        <ListEditor label="Badge Titles" items={badges} onChange={setBadges} />
      </ContentCard>
      <ContentCard title="Architecture Section" icon={<Globe className="h-4 w-4" />} onSave={saveArch}>
        <TextField label="Section Title" value={archTitle} onChange={setArchTitle} />
        <TextField label="Section Subtitle" value={archSub} onChange={setArchSub} />
      </ContentCard>
      <ContentCard title="Two-Factor Auth Section" icon={<Globe className="h-4 w-4" />} onSave={saveTwofa}>
        <TextField label="Section Title" value={authTitle} onChange={setAuthTitle} />
        <TextField label="Description" value={authDesc} onChange={setAuthDesc} multiline rows={2} />
        <ListEditor label="Bullet Points" items={authBullets} onChange={setAuthBullets} />
      </ContentCard>
      <ContentCard title="Regulatory Compliance" icon={<Globe className="h-4 w-4" />} onSave={saveCompliance}>
        <TextField label="Section Title" value={compTitle} onChange={setCompTitle} />
        <TextField label="Section Subtitle" value={compSub} onChange={setCompSub} />
        <ComplexListEditor label="Compliance Cards" items={compCards} onChange={setCompCards} />
      </ContentCard>
      <ContentCard title="CTA Section" icon={<Globe className="h-4 w-4" />} onSave={saveCta}>
        <TextField label="Heading" value={ctaTitle} onChange={setCtaTitle} />
        <TextField label="Subheading" value={ctaSub} onChange={setCtaSub} multiline rows={2} />
        <TextField label="Button Label" value={ctaBtn} onChange={setCtaBtn} />
      </ContentCard>
    </div>
  );
}
