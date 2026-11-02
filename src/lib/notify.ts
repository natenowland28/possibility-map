import "server-only";
import { SECTIONS } from "@/config/methodology";
import type { SessionRecord } from "@/lib/types";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * When RESEND_API_KEY and FACILITATOR_EMAIL are set, the facilitator gets an
 * email with the participant's 15 approved themes the moment they submit.
 * Without them, submissions are still saved and visible in /admin.
 */
export async function notifyFacilitator(record: SessionRecord) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.FACILITATOR_EMAIL;
  if (!key || !to) return { sent: false as const };

  const sections = SECTIONS.map((s) => {
    const themes = record.sections[s.id]?.themes ?? [];
    const items = themes
      .map(
        (t, i) =>
          `<tr><td style="padding:10px 0;border-bottom:1px solid #eee"><div style="font:600 15px Georgia,serif;color:#1f1b16">${i + 1}. ${esc(t.heading)}</div><div style="font:14px/1.6 -apple-system,Segoe UI,sans-serif;color:#4a443c;margin-top:4px">${esc(t.body)}</div></td></tr>`,
      )
      .join("");
    return `<h2 style="font:600 18px Georgia,serif;color:#1f1b16;margin:28px 0 4px">${s.title} <span style="font-weight:400;color:#8a8175">— ${s.tagline}</span></h2><table width="100%" cellspacing="0" cellpadding="0">${items}</table>`;
  }).join("");

  const html = `<div style="max-width:640px;margin:0 auto;padding:24px"><p style="font:14px -apple-system,Segoe UI,sans-serif;color:#8a8175;margin:0">New Possibility Map submission</p><h1 style="font:600 26px Georgia,serif;color:#1f1b16;margin:6px 0 2px">${esc(record.name || "Participant")}</h1><p style="font:14px -apple-system,Segoe UI,sans-serif;margin:0"><a href="mailto:${esc(record.email)}">${esc(record.email)}</a></p>${sections}</div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "Possibility Map <onboarding@resend.dev>",
      to: [to],
      reply_to: record.email,
      subject: `Possibility Map — ${record.name || record.email}`,
      html,
    }),
  });
  return { sent: res.ok };
}
