import {
  displayTextLimit,
  hotlineDialPattern,
  siteUrlLimit,
  siteUrlPattern,
  whatsappDigitsPattern,
} from "@/lib/sheet-format";

export type ContactDraft = {
  whatsapp_display: string;
  whatsapp_digits: string;
  hotline_display: string;
  hotline_dial: string;
  nel_site_url: string;
};

export type ContactField = keyof ContactDraft;
export type ContactProblem = "required" | "pattern" | "too-long";

function textProblem(value: string, limit: number): ContactProblem | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "required";
  if ([...trimmed].length > limit) return "too-long";
  return null;
}

export function contactProblems(draft: ContactDraft): Partial<Record<ContactField, ContactProblem>> {
  const problems: Partial<Record<ContactField, ContactProblem>> = {};
  const display = textProblem(draft.whatsapp_display, displayTextLimit);
  if (display) problems.whatsapp_display = display;
  const digits = draft.whatsapp_digits.trim();
  if (digits.length === 0) problems.whatsapp_digits = "required";
  else if (!whatsappDigitsPattern.test(digits)) problems.whatsapp_digits = "pattern";
  const hotline = textProblem(draft.hotline_display, displayTextLimit);
  if (hotline) problems.hotline_display = hotline;
  const dial = draft.hotline_dial.trim();
  if (dial.length === 0) problems.hotline_dial = "required";
  else if (!hotlineDialPattern.test(dial)) problems.hotline_dial = "pattern";
  const site = draft.nel_site_url.trim();
  if (site.length === 0) problems.nel_site_url = "required";
  else if ([...site].length > siteUrlLimit) problems.nel_site_url = "too-long";
  else if (!siteUrlPattern.test(site)) problems.nel_site_url = "pattern";
  return problems;
}

export function contactsComplete(draft: ContactDraft) {
  return Object.keys(contactProblems(draft)).length === 0;
}
