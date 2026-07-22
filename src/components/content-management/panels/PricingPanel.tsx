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

export function PricingPanel() {
  const [loading, setLoading] = useState(true);
  const [headerTitle, setHeaderTitle] = useState("Simple, Transparent Pricing");
  const [headerSub, setHeaderSub] = useState("No hidden fees. No surprises. Just straightforward pricing designed for Canadians.");
  const [incTitle, setIncTitle] = useState("Included With Every Account");
  const [incSub, setIncSub] = useState("Everything you need to manage your crypto, at no extra cost.");
  const [incFeat, setIncFeat] = useState<ListItem[]>([]);
  const [faqTitle, setFaqTitle] = useState("Pricing FAQs");
  const [faqs, setFaqs] = useState<ComplexListItem[]>([]);
  const [ctaTitle, setCtaTitle] = useState("Ready to Get Started?");
  const [ctaSub, setCtaSub] = useState("Open your account today. No hidden fees, no surprises.");
  const [ctaBtn, setCtaBtn] = useState("Create Free Account");

  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase
          .from("site_content")
          .select("key, value")
          .eq("category", "pricing");
        if (!error && data) {
          data.forEach((row) => {
            if (row.key === "pricing.hero.heading") setHeaderTitle(row.value);
            if (row.key === "pricing.hero.body") setHeaderSub(row.value);
            if (row.key === "pricing.features.title") setIncTitle(row.value);
            if (row.key === "pricing.features.subheading") setIncSub(row.value);
            if (row.key === "pricing.features.list") setIncFeat(makeList(row.value || []));
            if (row.key === "pricing.faq.title") setFaqTitle(row.value);
            if (row.key === "pricing.faq.list") {
              const list = row.value || [];
              setFaqs(makeComplexList(list.map((item: any) => ({ title: item.question, description: item.answer }))));
            }
            if (row.key === "pricing.cta.heading") setCtaTitle(row.value);
            if (row.key === "pricing.cta.body") setCtaSub(row.value);
            if (row.key === "pricing.cta.btn") setCtaBtn(row.value);
          });
        }
      } catch (err) {
        console.error("Error loading pricing settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const saveHeader = async () => {
    await updateContentKey("pricing.hero.heading", headerTitle, "text", "pricing", "Hero Heading");
    await updateContentKey("pricing.hero.body", headerSub, "text_multiline", "pricing", "Hero Description");
  };

  const saveFeatures = async () => {
    await updateContentKey("pricing.features.title", incTitle, "text", "pricing", "Account Features Title");
    await updateContentKey("pricing.features.subheading", incSub, "text", "pricing", "Account Features Subtitle");
    await updateContentKey("pricing.features.list", incFeat.map(f => f.value), "json_array", "pricing", "Account Features Checklist");
  };

  const saveFaqs = async () => {
    await updateContentKey("pricing.faq.title", faqTitle, "text", "pricing", "FAQ Section Title");
    const list = faqs.map(f => ({ question: f.title, answer: f.description }));
    await updateContentKey("pricing.faq.list", list, "json_complex", "pricing", "Pricing FAQs List");
  };

  const saveCta = async () => {
    await updateContentKey("pricing.cta.heading", ctaTitle, "text", "pricing", "Heading");
    await updateContentKey("pricing.cta.body", ctaSub, "text_multiline", "pricing", "Subheading");
    await updateContentKey("pricing.cta.btn", ctaBtn, "text", "pricing", "Button Label");
  };

  if (loading) return <div className="text-sm text-gray-500 py-4">Loading Pricing Settings...</div>;

  return (
    <div className="space-y-6">
      <ContentCard title="Header Section" icon={<Globe className="h-4 w-4" />} onSave={saveHeader}>
        <TextField label="Title" value={headerTitle} onChange={setHeaderTitle} />
        <TextField label="Subtitle" value={headerSub} onChange={setHeaderSub} multiline rows={2} />
      </ContentCard>
      <ContentCard title="Included Features" icon={<Globe className="h-4 w-4" />} onSave={saveFeatures}>
        <TextField label="Section Title" value={incTitle} onChange={setIncTitle} />
        <TextField label="Section Subtitle" value={incSub} onChange={setIncSub} />
        <ListEditor label="Feature List" items={incFeat} onChange={setIncFeat} />
      </ContentCard>
      <ContentCard title="FAQs" icon={<Globe className="h-4 w-4" />} onSave={saveFaqs}>
        <TextField label="Section Title" value={faqTitle} onChange={setFaqTitle} />
        <ComplexListEditor label="Q&A List" items={faqs} onChange={setFaqs} />
      </ContentCard>
      <ContentCard title="CTA Section" icon={<Globe className="h-4 w-4" />} onSave={saveCta}>
        <TextField label="Heading" value={ctaTitle} onChange={setCtaTitle} />
        <TextField label="Subheading" value={ctaSub} onChange={setCtaSub} multiline rows={2} />
        <TextField label="Button Label" value={ctaBtn} onChange={setCtaBtn} />
      </ContentCard>
    </div>
  );
}
