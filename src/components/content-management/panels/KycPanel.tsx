"use client";

import { useState, useEffect } from "react";
import { FileCheck, Info, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ListItem, makeList, TextField, ListEditor, ContentCard, updateContentKey } from "../shared/FieldComponents";

export function KycPanel() {
  const [heading, setHeading] = useState("Identity Verification");
  const [subheading, setSubheading] = useState("Complete KYC to unlock your account");
  const [processingTime, setProcessingTime] = useState("1-2 business days");
  const [thankYou, setThankYou] = useState("Thank you for submitting your documents.\nOur team is reviewing your information.\nThis typically takes 1-2 business days.");
  const [selfieGuides, setSelfieGuides] = useState<ListItem[]>(makeList([
    "Face clearly visible",
    "Good lighting",
    "No sunglasses or hats",
    "Neutral expression",
  ]));
  const [whatNext, setWhatNext] = useState<ListItem[]>(makeList([
    "We'll verify your identity documents",
    "You'll receive an email when approved",
    "You can then access your full account",
  ]));

  // Load data from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase
          .from("site_content")
          .select("key, value")
          .eq("category", "kyc");
        if (!error && data) {
          data.forEach((row) => {
            switch (row.key) {
              case "kyc.page_heading":
                setHeading(row.value);
                break;
              case "kyc.page_subheading":
                setSubheading(row.value);
                break;
              case "kyc.processing_time":
                setProcessingTime(row.value);
                break;
              case "kyc.thank_you":
                setThankYou(row.value);
                break;
              case "kyc.selfie_guides":
                if (Array.isArray(row.value)) {
                  setSelfieGuides(row.value.map((v: string, i: number) => ({ id: String(i), value: v })));
                }
                break;
              case "kyc.what_next":
                if (Array.isArray(row.value)) {
                  setWhatNext(row.value.map((v: string, i: number) => ({ id: String(i), value: v })));
                }
                break;
              default:
                break;
            }
          });
        }
      } catch (err) {
        console.error("Error loading kyc settings:", err);
      }
    }
    loadData();
  }, []);

  // Save handlers for each section
  const savePageHeader = async () => {
    await updateContentKey("kyc.page_heading", heading, "text", "kyc", "Page Heading");
    await updateContentKey("kyc.page_subheading", subheading, "text", "kyc", "Page Subheading");
  };
  const saveSelfieGuides = async () => {
    const guidesArray = selfieGuides.map((item) => item.value);
    await updateContentKey("kyc.selfie_guides", guidesArray, "json_array", "kyc", "Selfie Guidelines");
  };
  const savePostSubmission = async () => {
    await updateContentKey("kyc.processing_time", processingTime, "text", "kyc", "Processing Time");
    await updateContentKey("kyc.thank_you", thankYou, "text_multiline", "kyc", "Thank You Message");
    const whatNextArray = whatNext.map((item) => item.value);
    await updateContentKey("kyc.what_next", whatNextArray, "json_array", "kyc", "What Happens Next");
  };

  return (
    <div className="space-y-6">
      <ContentCard title="Page Header" icon={<FileCheck className="h-4 w-4" />} onSave={savePageHeader}>
        <TextField label="Page Heading" value={heading} onChange={setHeading} updatedAt="Jul 1, 2026 at 9:00 AM" />
        <TextField label="Page Subheading" value={subheading} onChange={setSubheading} updatedAt="Jul 1, 2026 at 9:00 AM" />
      </ContentCard>

      <ContentCard title="Selfie Guidelines" icon={<Info className="h-4 w-4" />} onSave={saveSelfieGuides}>
        <ListEditor label="Guidelines shown in Selfie Upload step" items={selfieGuides} onChange={setSelfieGuides} updatedAt="Jul 3, 2026 at 2:00 PM" />
      </ContentCard>

      <ContentCard title="Post-Submission Messages" icon={<Clock className="h-4 w-4" />} onSave={savePostSubmission}>
        <TextField
          label="Processing time"
          value={processingTime}
          onChange={setProcessingTime}
          placeholder="1-2 business days"
          helper="Shown as 'This typically takes X' on the pending screen."
          updatedAt="Jul 6, 2026 at 10:00 AM"
        />
        <TextField label="Thank-you body text" value={thankYou} onChange={setThankYou} multiline rows={4} updatedAt="Jul 6, 2026 at 10:00 AM" />
        <ListEditor label="'What happens next?' bullet points" items={whatNext} onChange={setWhatNext} updatedAt="Jul 6, 2026 at 10:00 AM" />
      </ContentCard>
    </div>
  );
}
