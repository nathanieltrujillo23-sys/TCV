import { supabase } from "../lib/supabaseClient";

export type ContactStatus = "new" | "read" | "archived";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  topic: string | null;
  message: string;
  status: ContactStatus;
  createdAt: string;
}

export interface NewContactMessage {
  name: string;
  email: string;
  topic: string | null;
  message: string;
}

// Visitors may only insert; reading and updating work for owners only (RLS).
export interface ContactRepository {
  send(message: NewContactMessage): Promise<void>;
  list(): Promise<ContactMessage[]>;
  setStatus(id: string, status: ContactStatus): Promise<void>;
}

export function createSupabaseContactRepository(): ContactRepository {
  return {
    async send(m) {
      const { error } = await supabase.from("contact_messages").insert({
        name: m.name.trim(),
        email: m.email.trim(),
        topic: m.topic,
        message: m.message.trim(),
      });
      if (error) throw new Error(error.message);
    },

    async list() {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("id, name, email, topic, message, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        topic: r.topic,
        message: r.message,
        status: r.status as ContactStatus,
        createdAt: r.created_at,
      }));
    },

    async setStatus(id, status) {
      const { error } = await supabase.from("contact_messages").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
    },
  };
}
