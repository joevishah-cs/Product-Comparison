import { supabase, isSupabaseConfigured } from "./supabase";
import { uid } from "./utils";

/**
 * Records are written to Supabase when it is configured, and to a namespaced
 * localStorage collection otherwise, so every workspace persists out of the box.
 * The record shapes match the SQL tables in supabase/migrations exactly.
 */

export interface SavedComparison {
  id: string;
  owner_email: string;
  name: string;
  scenario: string;
  audience: string;
  product_ids: string[];
  unit_selections: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export type Sentiment = "positive" | "mixed" | "concern";

export interface ReviewSignal {
  id: string;
  owner_email: string;
  product_id: string;
  sentiment: Sentiment;
  excerpt: string;
  context: string;
  reviewer_type: string;
  source: string;
  occurred_on: string;
  verification_status: "approved_excerpt" | "field_note" | "pending_review";
  themes: string[];
  created_at: string;
}

export interface AnalystNote {
  id: string;
  owner_email: string;
  track: string;
  question: string;
  owner_name: string;
  status: "open" | "in_progress" | "evidence_pending" | "closed";
  due_date: string;
  connected_report: string;
  evidence_status: "external_source_required" | "internal_evidence" | "source_linked";
  notes: string;
  created_at: string;
}

export interface MediaClip {
  id: string;
  owner_email: string;
  headline: string;
  publication: string;
  author: string;
  published_on: string;
  product_id: string;
  sentiment: Sentiment;
  topic: string;
  url: string;
  notes: string;
  created_at: string;
}

export interface GeneratedBrief {
  id: string;
  owner_email: string;
  title: string;
  format: string;
  audience: string;
  product_ids: string[];
  body: string;
  created_at: string;
}

export interface ChatMessageRecord {
  id: string;
  session_id: string;
  owner_email: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

type TableName =
  | "saved_comparisons"
  | "review_signals"
  | "analyst_notes"
  | "media_clips"
  | "generated_briefs"
  | "chat_messages";

const LS_PREFIX = "dcmi.v1.";

function readLocal<T>(table: TableName): T[] {
  try {
    const raw = window.localStorage.getItem(LS_PREFIX + table);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeLocal<T>(table: TableName, rows: T[]): void {
  try {
    window.localStorage.setItem(LS_PREFIX + table, JSON.stringify(rows));
  } catch {
    /* storage full or unavailable -- the in-memory state still reflects the change */
  }
}

export async function listRows<T extends { owner_email: string; created_at: string }>(
  table: TableName,
  ownerEmail: string,
): Promise<T[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("owner_email", ownerEmail)
      .order("created_at", { ascending: false });
    if (!error && data) return data as T[];
  }
  return readLocal<T>(table)
    .filter((r) => r.owner_email === ownerEmail)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function insertRow<T extends { id: string }>(table: TableName, row: Omit<T, "id"> & { id?: string }): Promise<T> {
  const record = { ...row, id: row.id ?? uid(table.slice(0, 4)) } as T;
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from(table)
      .insert(record as Record<string, unknown>)
      .select()
      .single();
    if (!error && data) return data as T;
  }
  const rows = readLocal<T>(table);
  writeLocal(table, [record, ...rows]);
  return record;
}

export async function updateRow<T extends { id: string }>(
  table: TableName,
  id: string,
  patch: Partial<T>,
): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from(table).update(patch as Record<string, unknown>).eq("id", id);
    if (!error) return;
  }
  const rows = readLocal<T>(table);
  writeLocal(
    table,
    rows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
  );
}

export async function deleteRow(table: TableName, id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (!error) return;
  }
  const rows = readLocal<{ id: string }>(table);
  writeLocal(
    table,
    rows.filter((r) => r.id !== id),
  );
}

export const STORAGE_MODE: "supabase" | "local" = isSupabaseConfigured ? "supabase" : "local";
