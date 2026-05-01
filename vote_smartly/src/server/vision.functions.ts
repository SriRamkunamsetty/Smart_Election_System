import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  // data URL or base64 of the image
  image: z.string().min(64).max(8_000_000),
  docHint: z.enum(["aadhaar", "voter_id", "passport", "driving_licence", "pan", "any"]).default("any"),
});

const SYSTEM = `You are a non-partisan visual checker for Indian voter ID documents.
You will be shown ONE photo. Decide if the photo plausibly shows an official Indian ID acceptable for voter registration / polling-day identification:
- Aadhaar card, EPIC (Voter ID), Indian passport, driving licence, or PAN card.

Reply with JSON only. No markdown. Schema:
{
  "ok": boolean,                 // true if a plausible Indian ID is visible AND key fields look readable
  "doc": "aadhaar"|"voter_id"|"passport"|"driving_licence"|"pan"|"unknown",
  "confidence": number,          // 0..1
  "reason": string,              // 1 short sentence, friendly, India-aware
  "tips": string[]               // 0-3 short tips to improve the photo if not ok
}

Privacy rule: NEVER reveal or echo any personal numbers, names, addresses, photos, or QR data. Just judge the document type and visibility.`;

export const checkIdPhoto = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) {
      return {
        ok: false,
        doc: "unknown" as const,
        confidence: 0,
        reason: "AI is not configured.",
        tips: [],
        error: "no_key",
      };
    }

    // Ensure data URL prefix
    const imgUrl = data.image.startsWith("data:")
      ? data.image
      : `data:image/jpeg;base64,${data.image}`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `User said the document is: ${data.docHint}. Judge the photo and reply with JSON only.`,
                },
                { type: "image_url", image_url: { url: imgUrl } },
              ],
            },
          ],
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("vision error", res.status, txt);
        if (res.status === 429) {
          return {
            ok: false,
            doc: "unknown" as const,
            confidence: 0,
            reason: "Too many checks just now. Please try again in a moment.",
            tips: [],
            error: "rate_limit",
          };
        }
        if (res.status === 402) {
          return {
            ok: false,
            doc: "unknown" as const,
            confidence: 0,
            reason: "AI credits exhausted.",
            tips: [],
            error: "no_credits",
          };
        }
        return {
          ok: false,
          doc: "unknown" as const,
          confidence: 0,
          reason: "Could not check the photo.",
          tips: [],
          error: "gateway",
        };
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const raw = json.choices?.[0]?.message?.content?.trim() ?? "{}";
      // Strip code fences if any
      const cleaned = raw
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/i, "")
        .trim();
      let parsed: {
        ok?: boolean;
        doc?: string;
        confidence?: number;
        reason?: string;
        tips?: string[];
      } = {};
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = {};
      }

      const allowedDocs = ["aadhaar", "voter_id", "passport", "driving_licence", "pan", "unknown"] as const;
      const docVal = (allowedDocs as readonly string[]).includes(parsed.doc ?? "")
        ? (parsed.doc as (typeof allowedDocs)[number])
        : "unknown";

      return {
        ok: !!parsed.ok,
        doc: docVal,
        confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0,
        reason: parsed.reason || (parsed.ok ? "Looks like a valid ID." : "Could not verify the document."),
        tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 3).map(String) : [],
        error: null as string | null,
      };
    } catch (e) {
      console.error("vision exception", e);
      return {
        ok: false,
        doc: "unknown" as const,
        confidence: 0,
        reason: "Could not reach the Oracle.",
        tips: [],
        error: "network",
      };
    }
  });
