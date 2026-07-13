
// 動画は静的な manifest.json（remote → cached → bundled の3段フォールバック）で管理する。

export type VideoAccess = 'free' | 'premium';

export type ManifestVideo = {
  id: string;
  title: string;
  /** Static Assets ルートからの相対パス（例: videos/void-001.mp4） */
  file: string;
  durationSeconds: number;
  access: VideoAccess;
};

export type VideoManifest = {
  version: number;
  updatedAt: string;
  videos: ManifestVideo[];
  /** 日別の指定（JST日付キー → 動画ID）。なければ rotation から決める */
  daily?: Record<string, { raidVideoId?: string; longVideoId?: string }>;
  /** 日替わりのデフォルトローテーション（動画IDの配列） */
  rotation: string[];
};

/** 再生画面へ渡す解決済みの動画ソース */
export type ResolvedVideo = {
  id: string;
  title: string;
  durationSeconds: number;
  /**
   * 再生ソース。
   * - number: アプリ同梱アセット（require の戻り値）
   * - string: ローカルキャッシュまたはリモートのURI
   * - null: 実動画が未配置（プレースホルダー描画で再生成立させる）
   */
  source: number | string | null;
};
