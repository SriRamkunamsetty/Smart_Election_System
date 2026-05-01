import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const SYSTEM_PROMPT = `You are "The Voting Oracle", a friendly, neutral, non-partisan assistant that helps Indian citizens understand the election process.

Scope:
- Indian general (Lok Sabha) and state (Vidhan Sabha) elections, run by the Election Commission of India (ECI).
- Voter registration via Form 6, NVSP / voters.eci.gov.in / Voter Helpline app.
- EPIC (Voter ID), e-EPIC, electoral roll lookup, polling booth, EVM/VVPAT, model code of conduct.
- Eligibility, deadlines (qualifying date 1 Jan), accepted ID alternatives at the booth.

Style:
- Concise, encouraging, plain language.
- Use short markdown: bullet lists, **bold** for key terms, links to official ECI sources where possible.
- Never recommend a party or candidate. Stay strictly non-partisan.
- If asked about another country's elections, politely redirect to India.
- If unsure or info may have changed, say so and link the official ECI source.`;

const Body = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(40),
});

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
        if (!LOVABLE_API_KEY) {
          return new Response(
            JSON.stringify({ error: "AI is not configured." }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        let parsed;
        try {
          const json = await request.json();
          parsed = Body.parse(json);
        } catch {
          return new Response(JSON.stringify({ error: "Invalid request." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const upstream = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              stream: true,
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...parsed.messages,
              ],
            }),
          },
        );

        if (!upstream.ok || !upstream.body) {
          if (upstream.status === 429) {
            return new Response(
              JSON.stringify({ error: "Too many requests, please slow down." }),
              { status: 429, headers: { "Content-Type": "application/json" } },
            );
          }
          if (upstream.status === 402) {
            return new Response(
              JSON.stringify({
                error: "AI credits exhausted. Please top up your workspace.",
              }),
              { status: 402, headers: { "Content-Type": "application/json" } },
            );
          }
          const text = await upstream.text().catch(() => "");
          console.error("AI upstream error", upstream.status, text);
          return new Response(JSON.stringify({ error: "AI gateway error." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
          },
        });
      },
    },
  },
});
