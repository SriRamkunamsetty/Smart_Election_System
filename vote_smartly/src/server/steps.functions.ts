import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  stepId: z.string().min(1).max(64).regex(/^[a-z0-9_-]+$/),
  stepTitle: z.string().min(1).max(200),
});

const SYSTEM = `You are "The Voting Oracle", a strictly non-partisan assistant focused on the Indian election process (Election Commission of India — ECI).

You produce concise, *current* practical guidance for one specific step of the voter journey.

Rules:
- India only (Lok Sabha + Vidhan Sabha). Refer to ECI procedures, Form 6, NVSP / voters.eci.gov.in / Voter Helpline app, EPIC / e-EPIC, electoral roll, EVM/VVPAT, MCC.
- Concise markdown: 2–4 short paragraphs OR 4–7 bullets. Use **bold** for key terms.
- Include 1–3 official links from these domains only when relevant: eci.gov.in, voters.eci.gov.in, electoralsearch.eci.gov.in, nvsp.in. Format as [label](https://...).
- If a fact may have changed (deadlines, exact forms), say so and link the official ECI source.
- No party / candidate recommendations. No speculation about results.
- Do NOT add a heading — the UI already shows the step title.`;

export const getStepDetails = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) {
      return { content: "", error: "AI is not configured." };
    }

    const userPrompt = `Step: "${data.stepTitle}" (id: ${data.stepId}).

Give the Indian voter clear, practical, up-to-date guidance for this step: what to do, what to bring, where to do it online or offline, common pitfalls, and a link or two to the official ECI source.`;

    try {
      const res = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: SYSTEM },
              { role: "user", content: userPrompt },
            ],
          }),
        },
      );

      if (!res.ok) {
        if (res.status === 429) {
          return { content: "", error: "Too many requests. Try again shortly." };
        }
        if (res.status === 402) {
          return {
            content: "",
            error: "AI credits exhausted. Please top up your workspace.",
          };
        }
        const text = await res.text().catch(() => "");
        console.error("step-details AI error", res.status, text);
        return { content: "", error: "AI gateway error." };
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = json.choices?.[0]?.message?.content?.trim() ?? "";
      return { content, error: null as string | null };
    } catch (e) {
      console.error("step-details exception", e);
      return { content: "", error: "Could not reach the Oracle." };
    }
  });
