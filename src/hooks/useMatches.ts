"use client";

import useSWR from "swr";
import type { Match, GameWiki } from "@/lib/liquipedia";

type MatchesResponse = {
  matches: Match[];
};

type UseMatchesOptions = {
  wiki?: GameWiki;
  upcoming?: boolean;
  limit?: number;
};

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("試合データの取得に失敗しました");
    return res.json() as Promise<MatchesResponse>;
  });

export function useMatches(options: UseMatchesOptions = {}) {
  const { wiki = "leagueoflegends", upcoming = false, limit = 20 } = options;

  const params = new URLSearchParams({
    wiki,
    upcoming: String(upcoming),
    limit: String(limit),
  });

  const { data, error, isLoading } = useSWR<MatchesResponse>(
    `/api/matches?${params}`,
    fetcher,
    {
      // 今後の試合は5分、過去の試合は1時間ごとに再検証
      refreshInterval: upcoming ? 5 * 60 * 1000 : 60 * 60 * 1000,
    }
  );

  return {
    matches: data?.matches ?? [],
    isLoading,
    isError: !!error,
  };
}
