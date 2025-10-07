import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type GeminiResp = { label: string; confidence: number; reasons?: string[] };

const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = "gemini-1.5-pro";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

function toBase64(u8: Uint8Array) {
  return btoa(String.fromCharCode(...u8));
}

// --- Heuristics for document classification
const MRZ_REGEX = /([A-Z0-9<]{2}[A-Z]{3}[A-Z0-9<]{9}[0-9][A-Z0-9<]{15}[0-9])/; // Machine Readable Zone
const IBAN_REGEX = /\b[A-Z]{2}\d{2}[A-Z0-9]{1,30}\b/;
const INVOICE_WORDS = /(invoice|rechnung|facture|fattura)/i;
const RECEIPT_WORDS = /(receipt|kassenbon|bon|ticket de caisse)/i;
const PASSPORT_WORDS = /(passport|reisepass|passeport|passaporto)/i;
const ID_WORDS = /(identity|ausweis|identité|carta d'identità)/i;
const CONTRACT_WORDS = /(contract|vertrag|contrat|contratto)/i;
const RESUME_WORDS = /(resume|cv|curriculum|lebenslauf)/i;
const DIPLOMA_WORDS = /(diploma|zeugnis|zertifikat|certificate|schuldiplom|schulzeugnis)/i;

function heuristicLabel(ocr: string, mime: string, filename: string): { label: string; score: number; signal: string } {
  const txt = (ocr || "").toLowerCase();
  const fname = (filename || "").toLowerCase();
  
  // High confidence heuristics
  if (MRZ_REGEX.test(txt)) return { label: "passport", score: 0.95, signal: "mrz" };
  if (PASSPORT_WORDS.test(txt) || fname.includes("pass")) return { label: "passport", score: 0.9, signal: "passport_word" };
  if (ID_WORDS.test(txt) || fname.includes("id")) return { label: "id_card", score: 0.85, signal: "id_word" };
  
  // Medium confidence heuristics
  if (INVOICE_WORDS.test(txt) || fname.includes("invoice")) return { label: "invoice", score: 0.8, signal: "invoice_word" };
  if (RECEIPT_WORDS.test(txt) || fname.includes("receipt")) return { label: "receipt", score: 0.8, signal: "receipt_word" };
  if (CONTRACT_WORDS.test(txt) || fname.includes("contract")) return { label: "contract", score: 0.8, signal: "contract_word" };
  if (RESUME_WORDS.test(txt) || fname.includes("cv") || fname.includes("resume")) return { label: "resume", score: 0.8, signal: "resume_word" };
  if (DIPLOMA_WORDS.test(txt) || fname.includes("diplom") || fname.includes("zeugnis") || fname.includes("zertifikat")) return { label: "diploma", score: 0.9, signal: "diploma_word" };
  if (IBAN_REGEX.test(txt)) return { label: "bank_statement", score: 0.75, signal: "iban" };
  
  // Low confidence fallbacks
  if (mime.startsWith("image/")) return { label: "unknown", score: 0.3, signal: "image" };
  if (mime === "application/pdf") return { label: "unknown", score: 0.2, signal: "pdf" };
  
  return { label: "unknown", score: 0.1, signal: "none" };
}

// --- Gemini REST call (multimodal)
async function classifyWithGemini(base64Data: string, mimeType: string, ocrText?: string): Promise<GeminiResp> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`;
  
  const systemPrompt = `You are a strict document classifier for Swiss documents. Allowed labels:
["passport","id_card","driver_license","invoice","receipt","bank_statement",
 "payslip","utility_bill","contract","resume","diploma","insurance_card","tax_form","unknown"]

Return ONLY compact JSON: {"label":"<string>","confidence":<0..1>,"reasons":["<string>"]}.
If uncertain, use "unknown". No extra text.`;

  const body = {
    contents: [{
      role: "user",
      parts: [
        { text: systemPrompt },
        { inlineData: { mimeType, data: base64Data } },
        ...(ocrText ? [{ text: `OCR text (optional):\n${ocrText.slice(0, 8000)}` }] : [])
      ]
    }]
  };

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Gemini error ${resp.status}: ${t}`);
  }

  const json = await resp.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  
  try {
    const parsed = JSON.parse(text);
    return {
      label: String(parsed.label ?? "unknown"),
      confidence: Number(parsed.confidence ?? 0),
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : []
    };
  } catch {
    return { label: "unknown", confidence: 0.0, reasons: ["parse_error"] };
  }
}

// --- Extract text with Gemini (lightweight OCR)
async function extractTextWithGemini(base64Data: string, mimeType: string): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`;
  
  const body = {
    contents: [{
      role: "user",
      parts: [
        { text: "Extract the raw text only, no commentary." },
        { inlineData: { mimeType, data: base64Data } }
      ]
    }]
  };
  
  const resp = await fetch(endpoint, { 
    method: "POST", 
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify(body) 
  });
  
  if (!resp.ok) return "";
  const json = await resp.json();
  return json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function loadFileAsBase64(bucket: string, path: string) {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw error;
  const buf = new Uint8Array(await data.arrayBuffer());
  return toBase64(buf);
}

// --- Job management
async function fetchJob(documentId?: string) {
  if (documentId) {
    // Direct mode - process specific document
    const { data: doc, error } = await supabase.from("documents").select("*").eq("id", documentId).single();
    if (error) throw error;
    return { doc };
  }
  
  // Pick next unlocked job
  const { data: jobRow, error: jErr } = await supabase
    .from("classification_jobs")
    .select("id, document_id")
    .is("locked_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
    
  if (jErr) throw jErr;
  if (!jobRow) return null;

  // Lock the job
  await supabase.from("classification_jobs")
    .update({ locked_at: new Date().toISOString() })
    .eq("id", jobRow.id);

  const { data: doc, error: dErr } = await supabase.from("documents").select("*").eq("id", jobRow.document_id).single();
  if (dErr) throw dErr;
  return { jobId: jobRow.id, doc };
}

serve(async (req) => {
  try {
    const { document_id } = (await req.json().catch(() => ({}))) as { document_id?: string };

    const job = await fetchJob(document_id);
    if (!job) return new Response(JSON.stringify({ ok: true, message: "no jobs" }), { status: 200 });

    const { doc, jobId } = job;
    
    // Mark as processing
    await supabase.from("documents").update({ status: "processing" }).eq("id", doc.id);

    // Download file
    const base64 = await loadFileAsBase64(doc.storage_bucket, doc.storage_path);

    // Quick OCR for heuristics
    const ocrText = await extractTextWithGemini(base64, doc.mime_type).catch(() => "");

    // Apply heuristics
    const h = heuristicLabel(ocrText, doc.mime_type, doc.storage_path);

    // Call Gemini only if heuristics are uncertain
    let g: GeminiResp = { label: "unknown", confidence: 0, reasons: [] };
    if (h.score < 0.85) {
      console.log(`Heuristic confidence ${h.score} < 0.85, calling Gemini...`);
      g = await classifyWithGemini(base64, doc.mime_type, ocrText);
    } else {
      console.log(`High heuristic confidence ${h.score}, skipping Gemini`);
    }

    // Fuse results - take the best
    const candidates: Array<{label: string; score: number; source: string}> = [
      { label: h.label, score: h.score, source: `heuristic:${h.signal}` },
      { label: g.label, score: g.confidence ?? 0, source: "gemini" },
    ];
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];

    const signals = {
      heuristic: h,
      gemini: g,
      ocr_length: ocrText.length
    };

    // Update document (using existing schema)
    const update: Record<string, unknown> = {
      document_type: best.label,
      confidence: best.score,
      tags: [best.label], // Use existing tags column
      signals,
      status: "done",
      error_message: null
    };
    await supabase.from("documents").update(update).eq("id", doc.id);

    // Enqueue for review if low confidence
    if (best.score < 0.75) {
      await supabase.from("review_queue").insert({
        document_id: doc.id,
        reason: `low_confidence:${best.score}`
      });
    }

    // Cleanup job
    if (jobId) {
      await supabase.from("classification_jobs").delete().eq("id", jobId);
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      document_id: doc.id, 
      tag: best.label, 
      confidence: best.score,
      method: best.source
    }), { status: 200 });
    
  } catch (e) {
    console.error("Classification error:", e);
    
    // Try to persist error
    try {
      const { document_id } = (await req.json().catch(() => ({}))) as { document_id?: string };
      if (document_id) {
        await supabase.from("documents").update({ 
          status: "error", 
          error_message: String(e) 
        }).eq("id", document_id);
      }
    } catch {}
    
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
});
