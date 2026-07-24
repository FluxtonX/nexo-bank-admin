import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkAdminPermission } from "@/lib/checkAdminPermission";

// Helper function to send email via Brevo
async function sendBrevoEmail(email: string, subject: string, htmlContent: string) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  if (!BREVO_API_KEY) {
    console.log(`[LOCAL DEV] Would send email to ${email}: ${subject}`);
    return;
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: "Nexo Support", email: "noreply@cdntbank.com" },
      to: [{ email }],
      subject,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    console.error("[sendBrevoEmail] Brevo API Error:", responseBody);
  }
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { allowed } = await checkAdminPermission(request, "view-transactions");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const supabaseAdmin = createAdminClient();

    // Fetch profiles first to get names/emails for matching
    const { data: profiles, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email");

    if (profErr) throw profErr;

    // Fetch deposit requests
    const { data: deposits, error: depErr } = await supabaseAdmin
      .from("deposit_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (depErr && depErr.code !== "PGRST205") {
      throw depErr;
    }

    // Map profiles to manual deposits
    const mappedDeposits = (deposits || []).map((dep: any) => {
      const profile = (profiles || []).find((p: any) => p.id === dep.user_id);
      return {
        ...dep,
        user: {
          name: profile?.full_name || "Unknown User",
          email: profile?.email || "N/A",
        }
      };
    });

    // Fetch payment_orders (Binance Pay)
    const { data: payOrders, error: payErr } = await supabaseAdmin
      .from("payment_orders")
      .select("*")
      .order("created_at", { ascending: false });

    let mappedPayOrders: any[] = [];
    if (!payErr) {
      mappedPayOrders = (payOrders || []).map((order: any) => {
        const profile = (profiles || []).find((p: any) => p.id === order.user_id);
        return {
          id: order.id,
          user_id: order.user_id,
          asset: order.currency,
          network: "Binance Pay",
          company_address: "BINANCE_PAY",
          expected_amount: order.amount,
          tx_hash: order.merchant_trade_no,
          status: order.status === "PAID" ? "approved" : (order.status === "PENDING" ? "pending" : "rejected"),
          admin_note: order.prepay_id ? `Prepay ID: ${order.prepay_id}` : null,
          created_at: order.created_at,
          reviewed_at: order.paid_at,
          user: {
            name: profile?.full_name || "Unknown User",
            email: profile?.email || "N/A",
          }
        };
      });
    }

    // Merge both types of deposits and sort by created_at descending
    const allDeposits = [...mappedDeposits, ...mappedPayOrders].sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ deposits: allDeposits });
  } catch (error: any) {
    console.error("GET Deposits Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { allowed } = await checkAdminPermission(request, "view-transactions");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { requestId, status, adminNote } = await request.json();
    if (!requestId || !status) {
      return NextResponse.json({ error: "requestId and status are required" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // Check if the requestId exists in payment_orders (Binance Pay)
    const { data: order } = await supabaseAdmin
      .from("payment_orders")
      .select("status, merchant_trade_no, user_id, amount, currency")
      .eq("id", requestId)
      .maybeSingle();

    if (order) {
      // If manual approval on a Binance Pay order, trigger the atomic complete_payment_order RPC
      if (status === "approved") {
        const { data: rpcSuccess, error: rpcError } = await supabaseAdmin.rpc("complete_payment_order", {
          p_merchant_trade_no: order.merchant_trade_no,
          p_transaction_id: "ADMIN_MANUAL_APPROVE",
          p_raw_webhook: { admin_approved: true, note: adminNote || null },
        });
        if (rpcError) throw rpcError;
      } else {
        // If rejected, mark the order as FAILED
        const { error } = await supabaseAdmin
          .from("payment_orders")
          .update({
            status: "FAILED",
            raw_webhook: { admin_rejected: true, note: adminNote || null },
            updated_at: new Date().toISOString()
          })
          .eq("id", requestId);
        if (error) throw error;
      }
    } else {
      // Otherwise update the traditional manual deposit_requests
      const { data: dep } = await supabaseAdmin
        .from("deposit_requests")
        .select("user_id, expected_amount, asset")
        .eq("id", requestId)
        .maybeSingle();

      const { error } = await supabaseAdmin
        .from("deposit_requests")
        .update({
          status,
          admin_note: adminNote || null,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", requestId);

      if (error) throw error;

      if (dep) {
        let userName = "Unknown User";
        let userEmail = "";
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("full_name, email")
          .eq("id", dep.user_id)
          .single();
        if (profile) {
          userName = profile.full_name;
          userEmail = profile.email;
        }

        const isApproved = status === "approved" || status === "completed";
        const notifTitle = isApproved ? "Deposit Confirmed" : "Deposit Rejected";
        const notifType = isApproved ? "Success" : "Error";
        const notifMessage = isApproved
          ? `Your deposit of ${dep.expected_amount} ${dep.asset} has been confirmed and added to your balance.`
          : `Your deposit of ${dep.expected_amount} ${dep.asset} was rejected.${adminNote ? ` Reason: ${adminNote}` : ''}`;

        await supabaseAdmin.from("notifications").insert({
          user_id: dep.user_id,
          type: notifType,
          title: notifTitle,
          message: notifMessage,
          audience: "User",
          is_read: false
        });

        if (userEmail) {
          const emailDate = new Date().toLocaleString();
          const emailHtml = isApproved
            ? `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                 <h2 style="color: #0F172A;">Deposit Approved</h2>
                 <p style="color: #475569; font-size: 16px;">Hello ${userName},</p>
                 <p style="color: #475569; font-size: 16px;">Your deposit has been approved and added to your balance.</p>
                 <p style="color: #475569; font-size: 14px;"><strong>Deposit Amount:</strong> ${dep.expected_amount} ${dep.asset}</p>
                 <p style="color: #475569; font-size: 14px;"><strong>Approval Date:</strong> ${emailDate}</p>
                 ${adminNote ? `<p style="color: #475569; font-size: 14px;"><strong>Admin Note:</strong> ${adminNote}</p>` : ''}
                 <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                 <p style="color: #94A3B8; font-size: 12px; text-align: center;">Secure Admin Portal &copy; Nexo</p>
               </div>`
            : `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                 <h2 style="color: #0F172A;">Deposit Rejected</h2>
                 <p style="color: #475569; font-size: 16px;">Hello ${userName},</p>
                 <p style="color: #475569; font-size: 16px;">Your deposit request was rejected.</p>
                 <p style="color: #475569; font-size: 14px;"><strong>Deposit Amount:</strong> ${dep.expected_amount} ${dep.asset}</p>
                 <p style="color: #475569; font-size: 14px;"><strong>Rejection Date:</strong> ${emailDate}</p>
                 <p style="color: #475569; font-size: 14px;"><strong>Reason:</strong> ${adminNote || 'No specific reason provided.'}</p>
                 <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                 <p style="color: #94A3B8; font-size: 12px; text-align: center;">Secure Admin Portal &copy; Nexo</p>
               </div>`;

          sendBrevoEmail(
            userEmail,
            isApproved ? "Deposit Approved - Nexo" : "Deposit Rejected - Nexo",
            emailHtml
          ).catch(e => console.error("Failed to send deposit email:", e));
        }
      }
    }

    if (order) {
      let userName = "Unknown User";
      let userEmail = "";
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("full_name, email")
        .eq("id", order.user_id)
        .single();
      if (profile) {
        userName = profile.full_name;
        userEmail = profile.email;
      }

      const isApproved = status === "approved" || status === "completed";
      const notifTitle = isApproved ? "Deposit Confirmed" : "Deposit Rejected";
      const notifType = isApproved ? "Success" : "Error";
      const notifMessage = isApproved
        ? `Your deposit of ${order.amount} ${order.currency} via Binance Pay has been confirmed.`
        : `Your deposit of ${order.amount} ${order.currency} via Binance Pay was rejected.${adminNote ? ` Reason: ${adminNote}` : ''}`;

      await supabaseAdmin.from("notifications").insert({
        user_id: order.user_id,
        type: notifType,
        title: notifTitle,
        message: notifMessage,
        audience: "User",
        is_read: false
      });

      if (userEmail) {
        const emailDate = new Date().toLocaleString();
        const emailHtml = isApproved
          ? `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
               <h2 style="color: #0F172A;">Deposit Approved</h2>
               <p style="color: #475569; font-size: 16px;">Hello ${userName},</p>
               <p style="color: #475569; font-size: 16px;">Your Binance Pay deposit has been confirmed.</p>
               <p style="color: #475569; font-size: 14px;"><strong>Deposit Amount:</strong> ${order.amount} ${order.currency}</p>
               <p style="color: #475569; font-size: 14px;"><strong>Approval Date:</strong> ${emailDate}</p>
               ${adminNote ? `<p style="color: #475569; font-size: 14px;"><strong>Admin Note:</strong> ${adminNote}</p>` : ''}
               <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
               <p style="color: #94A3B8; font-size: 12px; text-align: center;">Secure Admin Portal &copy; Nexo</p>
             </div>`
          : `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
               <h2 style="color: #0F172A;">Deposit Rejected</h2>
               <p style="color: #475569; font-size: 16px;">Hello ${userName},</p>
               <p style="color: #475569; font-size: 16px;">Your Binance Pay deposit was rejected.</p>
               <p style="color: #475569; font-size: 14px;"><strong>Deposit Amount:</strong> ${order.amount} ${order.currency}</p>
               <p style="color: #475569; font-size: 14px;"><strong>Rejection Date:</strong> ${emailDate}</p>
               <p style="color: #475569; font-size: 14px;"><strong>Reason:</strong> ${adminNote || 'No specific reason provided.'}</p>
               <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
               <p style="color: #94A3B8; font-size: 12px; text-align: center;">Secure Admin Portal &copy; Nexo</p>
             </div>`;

        sendBrevoEmail(
          userEmail,
          isApproved ? "Deposit Approved - Nexo" : "Deposit Rejected - Nexo",
          emailHtml
        ).catch(e => console.error("Failed to send deposit email:", e));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH Deposit Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
