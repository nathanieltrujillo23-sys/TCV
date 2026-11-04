import { supabase } from "../lib/supabaseClient";
import { parseWorkbook, type WorkbookData } from "../lib/workbook";

export interface SavedWorkbook {
  data: WorkbookData;
  completedAt: string | null;
}

export interface WorkbookRepository {
  /** The signed in account's workbook, or null if it has never been started. */
  load(): Promise<SavedWorkbook | null>;
  /** Creates or replaces the workbook. completedAt is null while it is unfinished. */
  save(data: WorkbookData, completedAt: string | null): Promise<void>;
}

export function createSupabaseWorkbookRepository(): WorkbookRepository {
  return {
    async load() {
      const { data, error } = await supabase.from("planning_workbooks").select("data, completed_at").maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      const parsed = parseWorkbook(data.data);
      return parsed ? { data: parsed, completedAt: data.completed_at } : null;
    },
    async save(data, completedAt) {
      const { error } = await supabase
        .from("planning_workbooks")
        .upsert({ data, completed_at: completedAt, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (error) throw new Error(error.message);
    },
  };
}
