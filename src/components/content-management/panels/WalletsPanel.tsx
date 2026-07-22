"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ListItem, makeList, TextField, ListEditor, ContentCard, updateContentKey } from "../shared/FieldComponents";

export function WalletsPanel() {
  const [cadTitle, setCadTitle] = useState("Withdrawal Only");
  const [cadBody, setCadBody] = useState("This wallet is only suitable for withdrawals. CAD deposits are not accepted on this platform due to Canadian regulations.");
  const [instructions, setInstructions] = useState<ListItem[]>(makeList([
    "Only send {asset name} to this address",
    "Minimum deposit: 0.0005 BTC / 0.01 ETH / 5.0 USDT",
    "Requires 3 network confirmations",
    "Submit transaction hash on deposit request page after sending",
  ]));
  const [confirmations, setConfirmations] = useState("3");

  // Load data from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase
          .from("site_content")
          .select("key, value")
          .eq("category", "wallets");
        if (!error && data) {
          data.forEach((row) => {
            switch (row.key) {
              case "wallets.cad_title":
                setCadTitle(row.value);
                break;
              case "wallets.cad_body":
                setCadBody(row.value);
                break;
              case "wallets.instructions":
                if (Array.isArray(row.value)) {
                  setInstructions(row.value.map((v: string, i: number) => ({ id: String(i), value: v })));
                }
                break;
              case "wallets.confirmations":
                setConfirmations(row.value);
                break;
              default:
                break;
            }
          });
        }
      } catch (err) {
        console.error("Error loading wallets settings:", err);
      }
    }
    loadData();
  }, []);

  // Save handlers for each section
  const saveCadNotice = async () => {
    await updateContentKey("wallets.cad_title", cadTitle, "text", "wallets", "CAD Title");
    await updateContentKey("wallets.cad_body", cadBody, "text_multiline", "wallets", "CAD Body");
  };
  const saveInstructions = async () => {
    const instructionsArray = instructions.map((item) => item.value);
    await updateContentKey("wallets.instructions", instructionsArray, "json_array", "wallets", "Instructions");
    await updateContentKey("wallets.confirmations", confirmations, "text", "wallets", "Confirmations");
  };

  return (
    <div className="space-y-6">
      <ContentCard title="CAD Wallet Regulatory Notice" icon={<AlertTriangle className="h-4 w-4" />} onSave={saveCadNotice}>
        <p className="text-[12px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 -mt-1 mb-2">
          Warning: This is a legal/regulatory message. Update with caution.
        </p>
        <TextField label="Notice heading" value={cadTitle} onChange={setCadTitle} updatedAt="Jun 20, 2026 at 10:00 AM" />
        <TextField label="Notice body text" value={cadBody} onChange={setCadBody} multiline rows={3} updatedAt="Jun 20, 2026 at 10:00 AM" />
      </ContentCard>

      <ContentCard title="Important Instructions Block" icon={<Info className="h-4 w-4" />} onSave={saveInstructions}>
        <p className="text-[12px] text-gray-500 -mt-1 mb-2">
          Shown for crypto wallets. Use {"{asset name}"} and {"{symbol}"} as dynamic placeholders.
        </p>
        <ListEditor label="Instruction Bullet Points" items={instructions} onChange={setInstructions} updatedAt="Jul 9, 2026 at 8:45 AM" />
        <TextField
          label="Network confirmations required"
          value={confirmations}
          onChange={setConfirmations}
          placeholder="3"
          helper="Used in the 'Requires X network confirmations' bullet. Numeric value."
          updatedAt="Jul 9, 2026 at 8:45 AM"
        />
      </ContentCard>
    </div>
  );
}
