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

export function HelpPanel() {
  const [loading, setLoading] = useState(true);
  const [headerTitle, setHeaderTitle] = useState("How Can We Help?");
  const [headerSub, setHeaderSub] = useState("Search our knowledge base or browse categories below");
  const [searchPlace, setSearchPlace] = useState("Search for help articles...");
  const [faqTitle, setFaqTitle] = useState("Frequently Asked Questions");
  const [faqSub, setFaqSub] = useState("Quick answers to common questions");
  const [faqs, setFaqs] = useState<ListItem[]>([]);
  const [helpTitle, setHelpTitle] = useState("Still Need Help?");
  const [helpSub, setHelpSub] = useState("Our support team is here for you");
  const [btnChat, setBtnChat] = useState("Start Chat");
  const [btnEmail, setBtnEmail] = useState("Email Us");
  const [btnPhone, setBtnPhone] = useState("Premium Feature");

  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase
          .from("site_content")
          .select("key, value")
          .eq("category", "help");
        if (!error && data) {
          data.forEach((row) => {
            if (row.key === "help.hero.heading") setHeaderTitle(row.value);
            if (row.key === "help.hero.body") setHeaderSub(row.value);
            if (row.key === "help.hero.placeholder") setSearchPlace(row.value);
            if (row.key === "help.faq.heading") setFaqTitle(row.value);
            if (row.key === "help.faq.subheading") setFaqSub(row.value);
            if (row.key === "help.faq.list") setFaqs(makeList(row.value || []));
            if (row.key === "help.support.heading") setHelpTitle(row.value);
            if (row.key === "help.support.subheading") setHelpSub(row.value);
            if (row.key === "help.support.channels") {
              const list = row.value || [];
              if (list[0]) setBtnChat(list[0].btnText);
              if (list[1]) setBtnEmail(list[1].btnText);
              if (list[2]) setBtnPhone(list[2].btnText);
            }
          });
        }
      } catch (err) {
        console.error("Error loading help settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const saveHeader = async () => {
    await updateContentKey("help.hero.heading", headerTitle, "text", "help", "Hero Heading");
    await updateContentKey("help.hero.body", headerSub, "text", "help", "Hero Subheading");
    await updateContentKey("help.hero.placeholder", searchPlace, "text", "help", "Search Input Placeholder");
  };

  const saveFaqs = async () => {
    await updateContentKey("help.faq.heading", faqTitle, "text", "help", "FAQ Heading");
    await updateContentKey("help.faq.subheading", faqSub, "text", "help", "FAQ Subheading");
    await updateContentKey("help.faq.list", faqs.map(f => f.value), "json_array", "help", "FAQ Accordion Questions");
  };

  const saveSupport = async () => {
    await updateContentKey("help.support.heading", helpTitle, "text", "help", "Support Channels Heading");
    await updateContentKey("help.support.subheading", helpSub, "text", "help", "Support Channels Subtitle");
    
    const list = [
      {
        icon: "MessageSquare",
        title: "Live Chat",
        description: "Chat with our support team in real-time",
        btnText: btnChat,
        premiumOnly: false
      },
      {
        icon: "Mail",
        title: "Email Support",
        description: "Get help via email within 24 hours",
        btnText: btnEmail,
        premiumOnly: false
      },
      {
        icon: "Phone",
        title: "Phone Support",
        description: "Available for premium customers only",
        btnText: btnPhone,
        premiumOnly: true
      }
    ];
    await updateContentKey("help.support.channels", list, "json_complex", "help", "Support Channels Info");
  };

  if (loading) return <div className="text-sm text-gray-500 py-4">Loading Help Settings...</div>;

  return (
    <div className="space-y-6">
      <ContentCard title="Header Section" icon={<Globe className="h-4 w-4" />} onSave={saveHeader}>
        <TextField label="Title" value={headerTitle} onChange={setHeaderTitle} />
        <TextField label="Subtitle" value={headerSub} onChange={setHeaderSub} multiline rows={2} />
        <TextField label="Search Input Placeholder" value={searchPlace} onChange={setSearchPlace} />
      </ContentCard>
      <ContentCard title="FAQs (Quick Answers)" icon={<Globe className="h-4 w-4" />} onSave={saveFaqs}>
        <TextField label="Section Title" value={faqTitle} onChange={setFaqTitle} />
        <TextField label="Section Subtitle" value={faqSub} onChange={setFaqSub} />
        <ListEditor label="Question List" items={faqs} onChange={setFaqs} />
      </ContentCard>
      <ContentCard title="Still Need Help Section" icon={<Globe className="h-4 w-4" />} onSave={saveSupport}>
        <TextField label="Section Title" value={helpTitle} onChange={setHelpTitle} />
        <TextField label="Section Subtitle" value={helpSub} onChange={setHelpSub} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <TextField label="Live Chat Button" value={btnChat} onChange={setBtnChat} />
          <TextField label="Email Button" value={btnEmail} onChange={setBtnEmail} />
          <TextField label="Phone Button" value={btnPhone} onChange={setBtnPhone} />
        </div>
      </ContentCard>
    </div>
  );
}
