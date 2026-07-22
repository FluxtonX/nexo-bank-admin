"use client";

import { useState, useEffect } from "react";
import { Globe } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  ListItem,
  ComplexListItem,
  makeList,
  makeComplexList,
  FieldLabel,
  TextField,
  ListEditor,
  ComplexListEditor,
  ContentCard,
  updateContentKey,
} from "../shared/FieldComponents";

export function LandingPanel() {
  const [loading, setLoading] = useState(true);

  // Hero
  const [trustBadge, setTrustBadge] = useState("FINTRAC registered · CDIC-style insured deposits");
  const [heroHeadline, setHeroHeadline] = useState("Banking Meets\nCrypto\nIntelligence");
  const [heroBody, setHeroBody] = useState("A regulated Nexo Bank with a built-in crypto engine. Move money, save smarter, and invest in digital assets — all from one elegant, insured account.");
  const [heroBtn1, setHeroBtn1] = useState("Open Account");
  const [heroBtn2, setHeroBtn2] = useState("Explore Platform");
  const [heroStats, setHeroStats] = useState<ListItem[]>([]);

  // Features
  const [featHeading, setFeatHeading] = useState("Everything a modern Canadian needs from a bank.");
  const [featSub, setFeatSub] = useState("We've rebuilt banking from the ground up to support both your traditional financial needs and your digital asset investments.");
  const [featBtn, setFeatBtn] = useState("Explore all features");
  const [feat8Title, setFeat8Title] = useState("And much more");
  const [feat8Desc, setFeat8Desc] = useState("Discover the full power of CDNT.");
  const [feat8Btn, setFeat8Btn] = useState("Get Started");
  const [featList, setFeatList] = useState<ComplexListItem[]>([]);

  // Digital Assets
  const [assetsOverline, setAssetsOverline] = useState("Digital Banking");
  const [assetsHeading, setAssetsHeading] = useState("Digital assets, held to a higher standard.");

  // Onboarding
  const [onboardOverline, setOnboardOverline] = useState("Getting Started");
  const [onboardHeading, setOnboardHeading] = useState("From signup to first trade in minutes.");
  const [onboardList, setOnboardList] = useState<ComplexListItem[]>([]);

  // App Preview
  const [appOverline, setAppOverline] = useState("Your Pocket Branch");
  const [appHeading, setAppHeading] = useState("Your entire financial life, in your pocket.");
  const [appBody, setAppBody] = useState("Send money, manage cards, track investments and oversee your crypto portfolio — all from one beautifully designed interface.");
  const [appBenefits, setAppBenefits] = useState<ListItem[]>([]);

  // CTA
  const [ctaOverline, setCtaOverline] = useState("Your Financial Future");
  const [ctaHeading, setCtaHeading] = useState("Your Financial Future, Unified.");
  const [ctaBody, setCtaBody] = useState("Join 2M+ Canadians saving, banking and investing — with the confidence of regulation and the speed of crypto.");
  const [ctaBtn1, setCtaBtn1] = useState("Open Account");
  const [ctaBtn2, setCtaBtn2] = useState("Talk to our Team");

  // Footer
  const [footerTagline, setFooterTagline] = useState("A modern Nexo Bank uniting traditional finance with regulated digital assets.");
  const [footerReg, setFooterReg] = useState("Nexo Bank is a federally regulated Canadian financial institution. FINTRAC #M24-0042001.");
  const [footerCopy, setFooterCopy] = useState("© 2026 Nexo Bank, Inc. All rights reserved.");
  const [footerLinks, setFooterLinks] = useState<ComplexListItem[]>([]);

  // Load from Supabase on mount
  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase
          .from("site_content")
          .select("key, value")
          .eq("category", "landing");

        if (!error && data) {
          data.forEach((row) => {
            // Hero
            if (row.key === "landing.hero.trust_badge") setTrustBadge(row.value);
            if (row.key === "landing.hero.headline") setHeroHeadline(row.value);
            if (row.key === "landing.hero.body") setHeroBody(row.value);
            if (row.key === "landing.hero.btn1") setHeroBtn1(row.value);
            if (row.key === "landing.hero.btn2") setHeroBtn2(row.value);
            if (row.key === "landing.hero.stats") setHeroStats(makeList(row.value || []));

            // Features
            if (row.key === "landing.features.heading") setFeatHeading(row.value);
            if (row.key === "landing.features.sub") setFeatSub(row.value);
            if (row.key === "landing.features.btn") setFeatBtn(row.value);
            if (row.key === "landing.features.cta_card_title") setFeat8Title(row.value);
            if (row.key === "landing.features.cta_card_desc") setFeat8Desc(row.value);
            if (row.key === "landing.features.cta_card_btn") setFeat8Btn(row.value);
            if (row.key === "landing.features.list") setFeatList(makeComplexList(row.value || []));

            // Assets
            if (row.key === "landing.assets.overline") setAssetsOverline(row.value);
            if (row.key === "landing.assets.heading") setAssetsHeading(row.value);

            // Onboarding
            if (row.key === "landing.onboarding.overline") setOnboardOverline(row.value);
            if (row.key === "landing.onboarding.heading") setOnboardHeading(row.value);
            if (row.key === "landing.onboarding.steps") setOnboardList(makeComplexList(row.value || []));

            // App Preview
            if (row.key === "landing.app.overline") setAppOverline(row.value);
            if (row.key === "landing.app.heading") setAppHeading(row.value);
            if (row.key === "landing.app.body") setAppBody(row.value);
            if (row.key === "landing.app.benefits") setAppBenefits(makeList(row.value || []));

            // CTA
            if (row.key === "landing.cta.overline") setCtaOverline(row.value);
            if (row.key === "landing.cta.heading") setCtaHeading(row.value);
            if (row.key === "landing.cta.body") setCtaBody(row.value);
            if (row.key === "landing.cta.btn1") setCtaBtn1(row.value);
            if (row.key === "landing.cta.btn2") setCtaBtn2(row.value);

            // Footer
            if (row.key === "landing.footer.tagline") setFooterTagline(row.value);
            if (row.key === "landing.footer.regulatory") setFooterReg(row.value);
            if (row.key === "landing.footer.copyright") setFooterCopy(row.value);
            if (row.key === "landing.footer.links") setFooterLinks(makeComplexList(row.value || []));
          });
        }
      } catch (err) {
        console.error("Error loading landing settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Save triggers
  const saveHero = async () => {
    await updateContentKey("landing.hero.trust_badge", trustBadge, "text", "landing", "Trust Badge Text");
    await updateContentKey("landing.hero.headline", heroHeadline, "text_multiline", "landing", "Main Headline");
    await updateContentKey("landing.hero.body", heroBody, "text_multiline", "landing", "Hero Body Copy");
    await updateContentKey("landing.hero.btn1", heroBtn1, "text", "landing", "Primary Button");
    await updateContentKey("landing.hero.btn2", heroBtn2, "text", "landing", "Secondary Button");
    await updateContentKey("landing.hero.stats", heroStats.map(s => s.value), "json_array", "landing", "Hero Stats");
  };

  const saveFeatures = async () => {
    await updateContentKey("landing.features.heading", featHeading, "text", "landing", "Section Heading");
    await updateContentKey("landing.features.sub", featSub, "text_multiline", "landing", "Section Subheading");
    await updateContentKey("landing.features.btn", featBtn, "text", "landing", "CTA Button Label");
    await updateContentKey("landing.features.list", featList.map(i => ({ title: i.title, description: i.description })), "json_complex", "landing", "Feature Cards");
    await updateContentKey("landing.features.cta_card_title", feat8Title, "text", "landing", "8th CTA Card Title");
    await updateContentKey("landing.features.cta_card_desc", feat8Desc, "text", "landing", "8th CTA Card Desc");
    await updateContentKey("landing.features.cta_card_btn", feat8Btn, "text", "landing", "8th CTA Card Button");
  };

  const saveAssets = async () => {
    await updateContentKey("landing.assets.overline", assetsOverline, "text", "landing", "Overline Text");
    await updateContentKey("landing.assets.heading", assetsHeading, "text", "landing", "Section Heading");
  };

  const saveOnboarding = async () => {
    await updateContentKey("landing.onboarding.overline", onboardOverline, "text", "landing", "Overline Text");
    await updateContentKey("landing.onboarding.heading", onboardHeading, "text", "landing", "Section Heading");
    await updateContentKey("landing.onboarding.steps", onboardList.map(i => ({ title: i.title, description: i.description })), "json_complex", "landing", "Steps");
  };

  const saveApp = async () => {
    await updateContentKey("landing.app.overline", appOverline, "text", "landing", "Overline Text");
    await updateContentKey("landing.app.heading", appHeading, "text", "landing", "Section Heading");
    await updateContentKey("landing.app.body", appBody, "text_multiline", "landing", "Section Body");
    await updateContentKey("landing.app.benefits", appBenefits.map(b => b.value), "json_array", "landing", "Benefits List");
  };

  const saveCta = async () => {
    await updateContentKey("landing.cta.overline", ctaOverline, "text", "landing", "Overline Text");
    await updateContentKey("landing.cta.heading", ctaHeading, "text", "landing", "Section Heading");
    await updateContentKey("landing.cta.body", ctaBody, "text_multiline", "landing", "Section Body");
    await updateContentKey("landing.cta.btn1", ctaBtn1, "text", "landing", "Primary CTA Button");
    await updateContentKey("landing.cta.btn2", ctaBtn2, "text", "landing", "Secondary CTA Button");
  };

  const saveFooter = async () => {
    await updateContentKey("landing.footer.tagline", footerTagline, "text_multiline", "landing", "Tagline");
    await updateContentKey("landing.footer.regulatory", footerReg, "text_multiline", "landing", "Regulatory Text");
    await updateContentKey("landing.footer.copyright", footerCopy, "text", "landing", "Copyright Text");
    await updateContentKey("landing.footer.links", footerLinks.map(i => ({ title: i.title, description: i.description })), "json_complex", "landing", "Footer Links");
  };

  if (loading) {
    return <div className="text-sm text-gray-500 py-4">Loading Landing Settings...</div>;
  }

  return (
    <div className="space-y-6">
      <ContentCard title="1. Hero Section" icon={<Globe className="h-4 w-4" />} onSave={saveHero}>
        <TextField label="Trust Badge Text" value={trustBadge} onChange={setTrustBadge} />
        <TextField label="Main Headline" value={heroHeadline} onChange={setHeroHeadline} multiline rows={3} />
        <TextField label="Body Copy" value={heroBody} onChange={setHeroBody} multiline rows={3} />
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Primary CTA Button" value={heroBtn1} onChange={setHeroBtn1} />
          <TextField label="Secondary CTA Button" value={heroBtn2} onChange={setHeroBtn2} />
        </div>
        <ListEditor label="Hero Stats (Format: Value / Label)" items={heroStats} onChange={setHeroStats} />
      </ContentCard>

      <ContentCard title="2. Features Section" icon={<Globe className="h-4 w-4" />} onSave={saveFeatures}>
        <TextField label="Section Heading" value={featHeading} onChange={setFeatHeading} />
        <TextField label="Section Subheading" value={featSub} onChange={setFeatSub} multiline rows={2} />
        <TextField label="CTA Button Label" value={featBtn} onChange={setFeatBtn} />
        <ComplexListEditor label="Feature Cards (Title & Description)" items={featList} onChange={setFeatList} />

        <div className="pt-4 border-t border-gray-100 mt-4">
          <FieldLabel>8th CTA Card (In Grid)</FieldLabel>
          <div className="space-y-4">
            <TextField label="Card Title" value={feat8Title} onChange={setFeat8Title} />
            <TextField label="Card Description" value={feat8Desc} onChange={setFeat8Desc} />
            <TextField label="Button Label" value={feat8Btn} onChange={setFeat8Btn} />
          </div>
        </div>
      </ContentCard>

      <ContentCard title="3. Digital Assets Section" icon={<Globe className="h-4 w-4" />} onSave={saveAssets}>
        <TextField label="Overline Text" value={assetsOverline} onChange={setAssetsOverline} />
        <TextField label="Section Heading" value={assetsHeading} onChange={setAssetsHeading} />
      </ContentCard>

      <ContentCard title="4. Onboarding Section" icon={<Globe className="h-4 w-4" />} onSave={saveOnboarding}>
        <TextField label="Overline Text" value={onboardOverline} onChange={setOnboardOverline} />
        <TextField label="Section Heading" value={onboardHeading} onChange={setOnboardHeading} />
        <ComplexListEditor label="Steps (Title & Description)" items={onboardList} onChange={setOnboardList} />
      </ContentCard>

      <ContentCard title="5. App Preview Section" icon={<Globe className="h-4 w-4" />} onSave={saveApp}>
        <TextField label="Overline Text" value={appOverline} onChange={setAppOverline} />
        <TextField label="Section Heading" value={appHeading} onChange={setAppHeading} />
        <TextField label="Section Body" value={appBody} onChange={setAppBody} multiline rows={2} />
        <ListEditor label="Benefits List" items={appBenefits} onChange={setAppBenefits} />
      </ContentCard>

      <ContentCard title="6. CTA Section" icon={<Globe className="h-4 w-4" />} onSave={saveCta}>
        <TextField label="Overline Text" value={ctaOverline} onChange={setCtaOverline} />
        <TextField label="Section Heading" value={ctaHeading} onChange={setCtaHeading} />
        <TextField label="Section Body" value={ctaBody} onChange={setCtaBody} multiline rows={2} />
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Primary CTA Button" value={ctaBtn1} onChange={setCtaBtn1} />
          <TextField label="Secondary CTA Button" value={ctaBtn2} onChange={setCtaBtn2} />
        </div>
      </ContentCard>

      <ContentCard title="7. Footer" icon={<Globe className="h-4 w-4" />} onSave={saveFooter}>
        <TextField label="Tagline" value={footerTagline} onChange={setFooterTagline} multiline rows={2} />
        <TextField label="Regulatory Text" value={footerReg} onChange={setFooterReg} multiline rows={2} />
        <TextField label="Copyright Text" value={footerCopy} onChange={setFooterCopy} />
        <ComplexListEditor label="Footer Links (Category Name & Links List)" items={footerLinks} onChange={setFooterLinks} />
      </ContentCard>
    </div>
  );
}
