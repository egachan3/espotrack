import type { NextRequest } from "next/server";
import { fetchMatches, type GameWiki } from "@/lib/liquipedia";
import { withCache, TTL } from "@/lib/redis";

const VALID_WIKIS: GameWiki[] = ["leagueoflegends", "valorant"];

function isValidWiki(value: string): value is GameWiki {
  return VALID_WIKIS.includes(value as GameWiki);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const wiki = searchParams.get("wiki") ?? "leagueoflegends";
  const upcoming = searchParams.get("upcoming") === "true";
  const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 50);

  if (!isValidWiki(wiki)) {
    return Response.json(
      { error: `wiki は ${VALID_WIKIS.join(" / ")} のいずれかを指定してください` },
      { status: 400 }
    );
  }

  if (isNaN(limit) || limit < 1) {
    return Response.json(
      { error: "limit は 1 以上 50 以下の整数を指定してください" },
      { status: 400 }
    );
  }

  const cacheKey = `matches:${wiki}:${upcoming ? "upcoming" : "recent"}:${limit}`;
  // 今後の試合はスケジュール TTL、過去の試合は変化しないため長めに設定
  const ttl = upcoming ? TTL.MATCH_SCHEDULE : TTL.STANDINGS;

  try {
    const matches = await withCache(
      cacheKey,
      () => fetchMatches(wiki, { limit, upcoming }),
      ttl
    );

    return Response.json({ matches });
  } catch (err) {
    const message = err instanceof Error ? err.message : "不明なエラー";
    const status = message.includes("レート制限") ? 429 : 502;
    return Response.json({ error: message }, { status });
  }
}
