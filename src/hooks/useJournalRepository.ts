import { useMemo } from "react";
import { useAuth } from "../state/AuthContext";
import { createSupabaseJournalRepository, type JournalRepository } from "../data/journalRepository";

export function useJournalRepository(): JournalRepository {
  const { user } = useAuth();
  const userId = user!.id;
  return useMemo(() => createSupabaseJournalRepository(userId), [userId]);
}
