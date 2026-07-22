"use client";

import { useState, useEffect } from "react";
import { ArrowUpFromLine, AlertTriangle, Info } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { TextField, ContentCard, updateContentKey } from "../shared/FieldComponents";

export function WithdrawPanel() {
  const [pageSubheading, setPageSubheading] = useState("Transfer to your bank via Interac e-Transfer");
  const [feeAmount, setFeeAmount] = useState("2.50");
  const [partialErrMsg, setPartialErrMsg] = useState("For partial withdrawals, please contact support.");
  const [supportLink, setSupportLink] = useState("/support");
  const [importantBox, setImportantBox] = useState("Make sure the recipient email is correct. The recipient will need the security answer to claim the funds.");
  const [otpText, setOtpText] = useState("We have sent a 6-digit code to your registered email address.");

  // Load data from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase
          .from("site_content")
          .select("key, value")
          .eq("category", "withdraw");
        if (!error && data) {
          data.forEach((row) => {
            switch (row.key) {
              case "withdraw.page_subheading":
                setPageSubheading(row.value);
                break;
              case "withdraw.fee_amount":
                setFeeAmount(row.value);
                break;
              case "withdraw.partial_error_message":
                setPartialErrMsg(row.value);
                break;
              case "withdraw.support_link":
                setSupportLink(row.value);
                break;
              case "withdraw.important_box":
                setImportantBox(row.value);
                break;
              case "withdraw.otp_text":
                setOtpText(row.value);
                break;
              default:
                break;
            }
          });
        }
      } catch (err) {
        console.error("Error loading withdraw settings:", err);
      }
    }
    loadData();
  }, []);

  // Save handlers for each section
  const savePageHeader = async () => {
    await updateContentKey("withdraw.page_subheading", pageSubheading, "text", "withdraw", "Page Subheading");
  };
  const saveFee = async () => {
    await updateContentKey("withdraw.fee_amount", feeAmount, "text", "withdraw", "Fee Amount");
  };
  const savePartialError = async () => {
    await updateContentKey("withdraw.partial_error_message", partialErrMsg, "text", "withdraw", "Partial Error Message");
    await updateContentKey("withdraw.support_link", supportLink, "text", "withdraw", "Support Link");
  };
  const saveImportantBox = async () => {
    await updateContentKey("withdraw.important_box", importantBox, "text_multiline", "withdraw", "Important Box Text");
  };
  const saveOtpText = async () => {
    await updateContentKey("withdraw.otp_text", otpText, "text", "withdraw", "OTP Text");
  };

  return (
    <div className="space-y-6">
      <ContentCard title="Page Header" icon={<ArrowUpFromLine className="h-4 w-4" />} onSave={savePageHeader}>
        <TextField label="Page Subheading" value={pageSubheading} onChange={setPageSubheading} updatedAt="Jul 3, 2026 at 9:00 AM" />
      </ContentCard>

      <ContentCard title="Transaction Fee" icon={<AlertTriangle className="h-4 w-4" />} onSave={saveFee}>
        <p className="text-[12px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 -mt-1 mb-2">
          Warning: This updates the display only. Ensure backend fee logic is updated separately.
        </p>
        <TextField
          label="Withdrawal fee amount (CAD)"
          value={feeAmount}
          onChange={setFeeAmount}
          placeholder="2.50"
          helper="Displayed as '$X.XX CAD' in the transaction summary. Numeric value only."
          updatedAt="Jul 5, 2026 at 3:00 PM"
        />
      </ContentCard>

      <ContentCard title="Partial Withdrawal Error Message" icon={<Info className="h-4 w-4" />} onSave={savePartialError}>
        <TextField label="Error message text" value={partialErrMsg} onChange={setPartialErrMsg} updatedAt="Jul 8, 2026 at 5:30 PM" />
        <TextField
          label="Support link URL"
          value={supportLink}
          onChange={setSupportLink}
          placeholder="/support"
          helper="The URL that 'support' links to in the error message."
          updatedAt="Jul 8, 2026 at 5:30 PM"
        />
      </ContentCard>

      <ContentCard title="Step 2 — Recipient Details Important Box" icon={<AlertTriangle className="h-4 w-4" />} onSave={saveImportantBox}>
        <TextField label="Important box body text" value={importantBox} onChange={setImportantBox} multiline rows={3} updatedAt="Jul 2, 2026 at 11:00 AM" />
      </ContentCard>

      <ContentCard title="Step 3 — 2FA Instruction Text" icon={<Info className="h-4 w-4" />} onSave={saveOtpText}>
        <TextField label="OTP instruction text" value={otpText} onChange={setOtpText} updatedAt="Jul 1, 2026 at 9:00 AM" />
      </ContentCard>
    </div>
  );
}
