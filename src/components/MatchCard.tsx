"use client";

import type { Match } from "@/lib/liquipedia";

type Props = {
  match: Match;
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
}

function OpponentBlock({ name, score }: { name: string; score: string }) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
      <span className="text-sm font-semibold text-white truncate max-w-full">
        {name || "TBD"}
      </span>
      <span className="text-2xl font-bold text-white">
        {score === "-1" || score === "" ? "-" : score}
      </span>
    </div>
  );
}

export function MatchCard({ match }: Props) {
  const [team1, team2] = match.match2opponents ?? [];

  return (
    <div className="bg-gray-800 rounded-xl p-4 flex flex-col gap-3 shadow hover:bg-gray-750 transition-colors">
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="truncate">{match.tournament}</span>
        <span className="shrink-0 ml-2">{formatDate(match.date)}</span>
      </div>

      <div className="flex items-center gap-4">
        <OpponentBlock
          name={team1?.name ?? "TBD"}
          score={team1?.score ?? "-"}
        />
        <span className="text-gray-500 font-bold text-lg">vs</span>
        <OpponentBlock
          name={team2?.name ?? "TBD"}
          score={team2?.score ?? "-"}
        />
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span className="bg-gray-700 text-gray-300 rounded px-2 py-0.5">
          Tier {match.liquipediatier}
        </span>
        {match.type && (
          <span className="bg-gray-700 text-gray-300 rounded px-2 py-0.5">
            {match.type}
          </span>
        )}
      </div>
    </div>
  );
}
