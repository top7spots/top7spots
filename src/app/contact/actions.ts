"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseAdminClient } from "@/lib/supabase";

const maxMessageLength = 5000;
const maxRequests = 3;
const windowMs = 60 * 60 * 1000;
const rateLimit = new Map<string, { count: number; resetAt: number }>();

type ContactMessage = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export async function submitContactForm(formData: FormData) {
  const honeypot = textValue(formData, "website");

  if (honeypot) {
    redirect("/contact?sent=1");
  }

  const message = parseContactMessage(formData);
  const validationError = validateContactMessage(message);

  if (validationError) {
    redirect(`/contact?error=${encodeURIComponent(validationError)}`);
  }

  const clientIp = await requestIp();

  if (isRateLimited(clientIp)) {
    redirect(`/contact?error=${encodeURIComponent("Please wait before sending another message.")}`);
  }

  await saveContactMessage(message);
  await sendContactEmail(message);

  redirect("/contact?sent=1");
}

function parseContactMessage(formData: FormData): ContactMessage {
  return {
    name: textValue(formData, "name"),
    email: textValue(formData, "email"),
    subject: textValue(formData, "subject"),
    message: textValue(formData, "message"),
  };
}

function validateContactMessage(message: ContactMessage) {
  if (!message.name || !message.email || !message.message) {
    return "Name, email, and message are required.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(message.email)) {
    return "Please enter a valid email address.";
  }

  if (message.message.length > maxMessageLength) {
    return `Message must be ${maxMessageLength} characters or fewer.`;
  }

  return "";
}

async function saveContactMessage(message: ContactMessage) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("contact_messages").insert({
    name: message.name,
    email: message.email,
    subject: message.subject || null,
    message: message.message,
  });

  if (error) {
    throw new Error(`Failed to save contact message: ${error.message}`);
  }
}

async function sendContactEmail(message: ContactMessage) {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    console.warn("[Top7Spots Contact] RESEND_API_KEY is not configured; message saved without email notification.");
    return;
  }

  const to = process.env.CONTACT_TO_EMAIL?.trim() || "info@top7spots.com";
  const from = process.env.CONTACT_FROM_EMAIL?.trim() || "noreply@top7spots.com";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: message.subject || "New Top7Spots contact message",
      reply_to: message.email,
      text: [
        `Name: ${message.name}`,
        `Email: ${message.email}`,
        `Subject: ${message.subject || "Not provided"}`,
        "",
        message.message,
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("[Top7Spots Contact] Resend notification failed.", {
      status: response.status,
      details,
    });
  }
}

function isRateLimited(key: string) {
  const now = Date.now();
  const existing = rateLimit.get(key);

  if (!existing || existing.resetAt <= now) {
    rateLimit.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  existing.count += 1;
  return existing.count > maxRequests;
}

async function requestIp() {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || requestHeaders.get("x-real-ip") || "unknown";
}

function textValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}
