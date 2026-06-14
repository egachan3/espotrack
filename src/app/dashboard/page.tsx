"use client";

import { useState } from "react";
import { useMatches } from "@/hooks/useMatches";
import { MatchCard } from "@/components/MatchCard";
import type { GameWiki } from "@/lib/liquipedia";

const GAMES: { label: string; value: GameWiki }[] = [
  { label: "League of Legends", value: "leagueoflegends" },
  { label: "Valorant", value: "valorant" },
];

export default function DashboardPage() {
  const [wiki, setWiki] = useState<GameWiki>("leagueoflegends");
  const [upcoming, setUpcoming] = useState(false);

  const { matches, isLoading, isError } = useMatches({ wiki, upcoming, limit: 20 });

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">espotrack</h1>

        {/* フィルター */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex rounded-lg overflow-hidden border border-gray-700">
            {GAMES.map((g) => (
              <button
                key={g.value}
                onClick={() => setWiki(g.value)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  wiki === g.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="flex rounded-lg overflow-hidden border border-gray-700">
            {[
              { label: "過去の試合", value: false },
              { label: "今後の試合", value: true },
            ].map((tab) => (
              <button
                key={String(tab.value)}
                onClick={() => setUpcoming(tab.value)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  upcoming === tab.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* コンテンツ */}
        {isLoading && (
          <div className="grid gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-800 rounded-xl h-28 animate-pulse"
              />
            ))}
          </div>
        )}

        {isError && (
          <div className="bg-red-900/40 border border-red-700 rounded-xl p-4 text-red-300">
            データの取得に失敗しました。しばらくしてからもう一度お試しください。
          </div>
        )}

        {!isLoading && !isError && matches.length === 0 && (
          <div className="text-center text-gray-500 py-16">
            表示できる試合がありません
          </div>
        )}

        {!isLoading && !isError && matches.length > 0 && (
          <div className="grid gap-3">
            {matches.map((match) => (
              <MatchCard key={match.match2id} match={match} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
