"use client";

import { useState, useEffect } from "react";
import { HeadphonesIcon, Info } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { TextField, ContentCard, updateContentKey } from "../shared/FieldComponents";

export function SupportPanel() {
  const [description, setDescription] = useState("Contact support for deposit, withdrawal, KYC, login, portfolio, and security issues.");
  const [responseTarget, setResponseTarget] = useState("Under 5 minutes");
  const [secureAttachments, setSecureAttachments] = useState("Screenshots and documents");
  const [ticketHistory, setTicketHistory] = useState("Always available");
  const [openingMsg, setOpeningMsg] = useState("Hi! How can we help you today? Describe your issue and we'll get back to you as soon as possible.");

  // Load data from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase
          .from("site_content")
          .select("key, value")
          .eq("category", "support");
        if (!error && data) {
          data.forEach((row) => {
            switch (row.key) {
              case "support.page_description":
                setDescription(row.value);
                break;
              case "support.response_target":
                setResponseTarget(row.value);
                break;
              case "support.secure_attachments":
                setSecureAttachments(row.value);
                break;
              case "support.ticket_history":
                setTicketHistory(row.value);
                break;
              case "support.opening_msg":
                setOpeningMsg(row.value);
                break;
              default:
                break;
            }
          });
        }
      } catch (err) {
        console.error("Error loading support settings:", err);
      }
    }
    loadData();
  }, []);

  // Save handlers for each section
  const savePageHeader = async () => {
    await updateContentKey("support.page_description", description, "text_multiline", "support", "Page Description");
  };
  const saveStatsCards = async () => {
    await updateContentKey("support.response_target", responseTarget, "text", "support", "Response Target");
    await updateContentKey("support.secure_attachments", secureAttachments, "text", "support", "Secure Attachments");
    await updateContentKey("support.ticket_history", ticketHistory, "text", "support", "Ticket History");
  };
  const saveChatMessage = async () => {
    await updateContentKey("support.opening_msg", openingMsg, "text_multiline", "support", "Opening Message");
  };

  return (
    <div className="space-y-6">
      <ContentCard title="Page Header" icon={<HeadphonesIcon className="h-4 w-4" />} onSave={savePageHeader}>
        <TextField label="Page Description" value={description} onChange={setDescription} multiline rows={2} updatedAt="Jul 1, 2026 at 9:00 AM" />
      </ContentCard>

      <ContentCard title="Support Stats Cards" icon={<Info className="h-4 w-4" />} onSave={saveStatsCards}>
        <p className="text-[12px] text-gray-500 -mt-1 mb-2">The three info cards shown at the top of the Support page.</p>
        <TextField
          label="Response target SLA"
          value={responseTarget}
          onChange={setResponseTarget}
          placeholder="Under 5 minutes"
          helper="Client-facing SLA commitment. Update carefully."
          updatedAt="Jul 4, 2026 at 11:00 AM"
        />
        <TextField label="Secure attachments description" value={secureAttachments} onChange={setSecureAttachments} updatedAt="Jul 4, 2026 at 11:00 AM" />
        <TextField label="Ticket history description" value={ticketHistory} onChange={setTicketHistory} updatedAt="Jul 4, 2026 at 11:00 AM" />
      </ContentCard>

      <ContentCard title="Chat Opening Message" icon={<Info className="h-4 w-4" />} onSave={saveChatMessage}>
        <TextField label="Default greeting shown when chat opens" value={openingMsg} onChange={setOpeningMsg} multiline rows={3} updatedAt="Jul 7, 2026 at 2:00 PM" />
      </ContentCard>
    </div>
  );
}
