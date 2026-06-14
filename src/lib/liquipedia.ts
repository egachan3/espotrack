const BASE_URL = "https://liquipedia.net/api/v3";

// サポートするゲームの wiki 識別子
export type GameWiki = "leagueoflegends" | "valorant";

// --- 型定義 ---

export type Match = {
  match2id: string;
  date: string;
  dateexact: string;
  game: string;
  liquipediatier: string;
  liquipediatiertype: string;
  match2opponents: Opponent[];
  pagename: string;
  tournament: string;
  type: string;
};

type Opponent = {
  name: string;
  score: string;
  status: string;
  type: string;
  template: string;
};

export type Player = {
  id: string;
  nationality: string;
  name: string;
  pagename: string;
  romanizedname: string;
  status: string;
  team: string;
  type: string;
};

export type Team = {
  name: string;
  pagename: string;
  region: string;
  status: string;
};

export type Tournament = {
  displayname: string;
  enddate: string;
  game: string;
  liquipediatier: string;
  name: string;
  pagename: string;
  startdate: string;
  status: string;
  type: string;
};

export type Standing = {
  tournament: string;
  pagename: string;
  place: string;
  team: string;
  points: string;
};

type ApiResponse<T> = {
  result: T[];
};

// --- API クライアント ---

function getApiKey(): string {
  const key = process.env.LPDB_API_KEY;
  if (!key) throw new Error("LPDB_API_KEY が設定されていません");
  return key;
}

async function fetchFromApi<T>(
  endpoint: string,
  params: Record<string, string>
): Promise<T[]> {
  const url = new URL(`${BASE_URL}/${endpoint}`);

  url.searchParams.set("wiki", params.wiki ?? "leagueoflegends");
  for (const [key, value] of Object.entries(params)) {
    if (key !== "wiki") url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Apikey ${getApiKey()}`,
      // Liquipedia API はユーザーエージェントを必須としている
      "User-Agent": "espotrack/1.0 (https://github.com/egachan3/espotrack)",
    },
    // Next.js のデータキャッシュは呼び出し元（Route Handler 等）で制御する
    cache: "no-store",
  });

  // レート制限エラー（429）を明示的に伝える
  if (res.status === 429) {
    throw new Error(
      "Liquipedia API のレート制限に達しました。1時間あたり60リクエストまでです。"
    );
  }

  if (!res.ok) {
    throw new Error(
      `Liquipedia API エラー: ${res.status} ${res.statusText}`
    );
  }

  const data: ApiResponse<T> = await res.json();
  return data.result;
}

// --- 公開関数 ---

/** 直近の試合一覧を取得する */
export async function fetchMatches(
  wiki: GameWiki,
  options: { limit?: number; upcoming?: boolean } = {}
): Promise<Match[]> {
  const { limit = 20, upcoming = false } = options;
  const today = new Date().toISOString().split("T")[0];
  const conditions = upcoming
    ? `[[date::>${today}]]`
    : `[[date::<${today}]]`;

  return fetchFromApi<Match>("match", {
    wiki,
    conditions,
    limit: String(limit),
    order: upcoming ? "date ASC" : "date DESC",
  });
}

/** トーナメント一覧を取得する */
export async function fetchTournaments(
  wiki: GameWiki,
  options: { limit?: number; tier?: string } = {}
): Promise<Tournament[]> {
  const { limit = 10, tier = "1" } = options;

  return fetchFromApi<Tournament>("tournament", {
    wiki,
    conditions: `[[liquipediatier::${tier}]]`,
    limit: String(limit),
    order: "startdate DESC",
  });
}

/** 選手一覧を取得する */
export async function fetchPlayers(
  wiki: GameWiki,
  options: { limit?: number; team?: string } = {}
): Promise<Player[]> {
  const { limit = 20, team } = options;
  const conditions = team ? `[[team::${team}]]` : "[[status::Active]]";

  return fetchFromApi<Player>("player", {
    wiki,
    conditions,
    limit: String(limit),
  });
}

/** スタンディング（順位表）を取得する */
export async function fetchStandings(
  wiki: GameWiki,
  tournament: string,
  options: { limit?: number } = {}
): Promise<Standing[]> {
  const { limit = 50 } = options;

  return fetchFromApi<Standing>("placement", {
    wiki,
    conditions: `[[tournament::${tournament}]]`,
    limit: String(limit),
    order: "place ASC",
  });
}
