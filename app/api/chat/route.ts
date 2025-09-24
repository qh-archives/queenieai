import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

type Vec = { id: string; vector: number[]; text: string; meta?: Record<string, unknown> };
type Ex = { user: string; assistant: string };

const ai = new GoogleGenAI({});

const vectors: Vec[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content/vectors.json"), "utf8"));
const styleGuide = fs.readFileSync(path.join(process.cwd(), "content/style.md"), "utf8");
const exemplars: Ex[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content/exemplars.json"), "utf8"));
const projects: Array<{id:string; title:string; oneLiner:string; details:string[]; url:string}> = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "content/projects.json"), "utf8")
);

function cos(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-10);
}

async function retrieve(query: string, k = 6) {
  const q = await ai.models.embedContent({ model: "gemini-embedding-001", contents: query });
  const embeddings = (q as { embeddings?: { values: number[] }[] }).embeddings;
  if (!embeddings || embeddings.length === 0) {
    return vectors.slice(0, k);
  }
  const qv = embeddings[0].values;
  return vectors
    .map(v => ({ v, s: cos(qv, v.vector) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .map(x => x.v);
}

const SYSTEM =
`You are “Queenie Bot,” a concise, friendly guide on Queenie Hsiao’s portfolio.
STYLE GUIDE:
${styleGuide}

Rules:
- Answer only from the provided context (retrieved snippets, FAQs, projects).
- Speak in Queenie’s voice (see STYLE GUIDE + exemplars).
- If asked for resume/contact, point to the site header/footer links.
- If asked for NDA-sensitive info, say you can share process at a high level only.
- Keep replies under ~120 words unless asked for more.`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const msgs = (body?.messages || []) as { role: "user"|"assistant"|"system"; content: string }[];
  const user = msgs.findLast(m => m.role === "user")?.content || "";

  // Simple project name detection
  const userLc = user.toLowerCase();
  const matched = projects.find(p => userLc.includes(p.id) || userLc.includes(p.title.toLowerCase()));
  let context = "";
  if (matched) {
    const pCtx = [
      `${matched.title}`,
      `${matched.oneLiner}`,
      ...matched.details.map(d => `- ${d}`)
    ].join("\n");
    context = pCtx;
  } else {
    const top = await retrieve(user, 6);
    context = top.map(t => `• ${t.text}`).join("\n");
  }

  // Convert exemplars to proper content format (user/model roles with parts)
  const fewShotContents = exemplars.flatMap(ex => ([
    { role: "user" as const, parts: [{ text: ex.user }] },
    { role: "model" as const, parts: [{ text: ex.assistant }] }
  ]));

  const completion = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { role: "user", parts: [{ text: `${SYSTEM}\n\nUser: ${user}\n\nContext:\n${context}` }] },
      ...fewShotContents
    ],
    config: { thinkingConfig: { thinkingBudget: 0 } }
  });

  const raw = (completion as { text?: string } | null)?.text ?? "";
  const reply = raw.replaceAll(" + ", " and ");
  return NextResponse.json({ reply });
}
