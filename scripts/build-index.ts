import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

type Doc = { id: string; text: string; meta?: Record<string, any> };
type Vec = { id: string; vector: number[]; text: string; meta?: Record<string, any> };

const ai = new GoogleGenAI({}); // reads GEMINI_API_KEY

if (!process.env.GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY. Skipping vector generation for build.");
  // Create a minimal vectors file for build purposes
  fs.writeFileSync("content/vectors.json", JSON.stringify([], null, 2));
  process.exit(0);
}

function loadText(p: string) { return fs.readFileSync(path.join(process.cwd(), p), "utf8").trim(); }
function loadJSON<T>(p: string): T { return JSON.parse(fs.readFileSync(path.join(process.cwd(), p), "utf8")); }

function chunk(text: string, size = 800, overlap = 100) {
  const out: { id: string; text: string }[] = [];
  for (let i = 0; i < text.length; i += (size - overlap)) out.push({ id: `bio_${i}`, text: text.slice(i, i + size) });
  return out;
}

async function main() {
  const bio = loadText("content/bio.md");
  const projects = loadJSON<any[]>("content/projects.json");
  const faqs = loadJSON<any[]>("content/faqs.json");

  const docs: Doc[] = [
    ...chunk(bio).map(c => ({ id: c.id, text: c.text, meta: { type: "bio" } })),
    ...projects.flatMap(p => [
      { id: `proj_${p.id}_one`, text: `${p.title}\n${p.oneLiner}`, meta: { type: "project", id: p.id, url: p.url } },
      ...p.details.map((d: string, i: number) => ({ id: `proj_${p.id}_d${i}`, text: `${p.title} — ${d}`, meta: { type: "project", id: p.id, url: p.url } }))
    ]),
    ...faqs.map((f, i) => ({ id: `faq_${i}`, text: `Q: ${f.q}\nA: ${f.a}`, meta: { type: "faq" } }))
  ];

  const resp = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: docs.map(d => d.text)
  });

  const embeddings = (resp as any).embeddings ?? [];
  if (!Array.isArray(embeddings) || embeddings.length !== docs.length) {
    throw new Error("Embedding response invalid or incomplete.");
  }

  const vecs: Vec[] = embeddings.map((e: any, i: number) => ({
    id: docs[i].id, vector: e.values, text: docs[i].text, meta: docs[i].meta
  }));

  fs.writeFileSync("content/vectors.json", JSON.stringify(vecs, null, 2));
  console.log(`Wrote ${vecs.length} vectors → content/vectors.json`);
}

main().catch(err => { console.error(err); process.exit(1); });
