import Redis from "ioredis";

// --- TTL 定数（秒） ---
export const TTL = {
  LIVE_SCORE: 30,        // ライブ試合スコア
  MATCH_SCHEDULE: 5 * 60,  // 試合スケジュール
  STANDINGS: 60 * 60,      // スタンディング
  PLAYER_PROFILE: 24 * 60 * 60, // 選手プロフィール
} as const;

// --- Redis クライアントのシングルトン ---
// Next.js の開発環境ではホットリロードのたびにモジュールが再評価されるため
// グローバルオブジェクトにキャッシュして接続を使い回す
declare global {
  // eslint-disable-next-line no-var
  var _redisClient: Redis | undefined;
}

function getClient(): Redis {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL が設定されていません");
  }

  if (global._redisClient) return global._redisClient;

  const client = new Redis(process.env.REDIS_URL, {
    // 接続失敗時に無限再試行しない（サーバー起動時のクラッシュを防ぐ）
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  client.on("error", (err) => {
    console.error("[Redis] 接続エラー:", err);
  });

  global._redisClient = client;
  return client;
}

// --- キャッシュ操作 ---

/**
 * キャッシュから取得する。存在しない場合は fetcher を実行して結果を保存する。
 * @param key  キャッシュキー
 * @param fetcher データ取得関数
 * @param ttl  有効期限（秒）
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<T> {
  const client = getClient();

  const cached = await client.get(key);
  if (cached !== null) {
    return JSON.parse(cached) as T;
  }

  const data = await fetcher();
  await client.set(key, JSON.stringify(data), "EX", ttl);
  return data;
}

/** キャッシュを手動で削除する（再検証用） */
export async function invalidateCache(key: string): Promise<void> {
  const client = getClient();
  await client.del(key);
}

/** プレフィックスに一致するキャッシュをまとめて削除する */
export async function invalidateCacheByPrefix(prefix: string): Promise<void> {
  const client = getClient();
  const keys = await client.keys(`${prefix}*`);
  if (keys.length > 0) {
    await client.del(...keys);
  }
}
