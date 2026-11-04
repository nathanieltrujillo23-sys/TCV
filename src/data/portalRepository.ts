import { supabase } from "../lib/supabaseClient";

export interface LessonProgress {
  lessonId: string;
  completedAt: string;
  quizScore: number | null;
}

export interface ClientProgressRow {
  userId: string;
  email: string;
  accountType: string | null;
  lessonsCompleted: number;
  averageScore: number | null;
  lastActivity: string | null;
  joinedAt: string;
}

export interface PortalRepository {
  listProgress(): Promise<LessonProgress[]>;
  /** Saves a passed quiz, keeping the best score if the module was already complete. */
  recordCompletion(lessonId: string, score: number, previousBest: number | null): Promise<void>;
  /** Owners only; the database returns nothing for anyone else. */
  clientProgress(): Promise<ClientProgressRow[]>;
}

export function createSupabasePortalRepository(): PortalRepository {
  return {
    async listProgress() {
      const { data, error } = await supabase.from("lesson_progress").select("lesson_id, completed_at, quiz_score");
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => ({ lessonId: r.lesson_id, completedAt: r.completed_at, quizScore: r.quiz_score }));
    },
    async recordCompletion(lessonId, score, previousBest) {
      if (previousBest !== null && previousBest >= score) return;
      const { error } = await supabase
        .from("lesson_progress")
        .upsert({ lesson_id: lessonId, quiz_score: score, completed_at: new Date().toISOString() }, { onConflict: "user_id,lesson_id" });
      if (error) throw new Error(error.message);
    },
    async clientProgress() {
      const { data, error } = await supabase.rpc("client_progress");
      if (error) throw new Error(error.message);
      return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        userId: r.user_id as string,
        email: r.email as string,
        accountType: (r.account_type as string | null) ?? null,
        lessonsCompleted: Number(r.lessons_completed),
        averageScore: r.average_score === null ? null : Number(r.average_score),
        lastActivity: (r.last_activity as string | null) ?? null,
        joinedAt: r.joined_at as string,
      }));
    },
  };
}
