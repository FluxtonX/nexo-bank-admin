/**
 * Support Chat Utilities for Day Dividers & Attachment Formatting
 */

/**
 * Checks whether two dates occur on the same calendar day
 */
export function isSameDay(d1Input: Date | string, d2Input: Date | string): boolean {
  const d1 = new Date(d1Input);
  const d2 = new Date(d2Input);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Formats a date into a human-readable day divider:
 * - "Today"
 * - "Yesterday"
 * - "Monday, Sep 15" (within the last 6 days)
 * - "Sep 15, 2026" (or older dates / different year)
 */
export function formatChatDayDivider(dateInput: Date | string): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(date, now)) {
    return "Today";
  }

  if (isSameDay(date, yesterday)) {
    return "Yesterday";
  }

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((startOfToday - startOfDate) / (1000 * 60 * 60 * 24));

  if (diffDays > 0 && diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  }

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Parses message raw text into an optional image URL and accompanying caption text.
 * Detects tags like [attachment:https://...] or markdown ![image](url)
 */
export function parseMessageContent(
  rawText: string,
  explicitAttachmentUrl?: string | null
): { text: string; imageUrl: string | null } {
  if (explicitAttachmentUrl) {
    return { text: (rawText || "").trim(), imageUrl: explicitAttachmentUrl };
  }

  if (!rawText) return { text: "", imageUrl: null };

  const attachmentTagMatch = rawText.match(/\[attachment:(https?:\/\/[^\s\]]+)\]/i);
  if (attachmentTagMatch) {
    const imageUrl = attachmentTagMatch[1];
    const text = rawText.replace(attachmentTagMatch[0], "").trim();
    return { text, imageUrl };
  }

  const markdownImageMatch = rawText.match(/!\[.*?\]\((https?:\/\/[^\s\)]+)\)/i);
  if (markdownImageMatch) {
    const imageUrl = markdownImageMatch[1];
    const text = rawText.replace(markdownImageMatch[0], "").trim();
    return { text, imageUrl };
  }

  return { text: rawText, imageUrl: null };
}

/**
 * Formats a message string combining attachment URL and caption text cleanly.
 */
export function formatMessageContent(text: string, imageUrl?: string | null): string {
  const trimmed = (text || "").trim();
  if (!imageUrl) return trimmed;
  if (!trimmed) return `[attachment:${imageUrl}]`;
  return `[attachment:${imageUrl}] ${trimmed}`;
}
