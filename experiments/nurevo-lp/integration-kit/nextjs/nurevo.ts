/**
 * nurevo.ts — Nurevo サーバーサイドAEO連携（Next.js App Router 向け）
 * ------------------------------------------------------------------
 * Server Component で中央設定(ruleset反映済みJSON-LD)を取得し、サーバー側で
 * <script type="application/ld+json"> を描画する。Next の fetch revalidate で
 * 「常に最新（既定10分ごと再取得）」をCDNキャッシュ付きで実現。
 *
 * ⚠️ 必ず Server Component（"use client" の無いファイル）で使うこと。
 *     クライアント側描画ではAIクローラーに読まれません。
 */

const NUREVO_BASE = 'https://nurevo.jp';

export async function getNurevoJsonLd(siteKey: string): Promise<Record<string, unknown> | null> {
  if (!siteKey) return null;
  try {
    const r = await fetch(
      `${NUREVO_BASE}/api/tag/config?k=${encodeURIComponent(siteKey)}`,
      { next: { revalidate: 600 } } // 10分ごとに再取得＝常に最新
    );
    if (!r.ok) return null;
    const cfg = await r.json();
    return cfg?.ok && cfg.jsonld ? cfg.jsonld : null;
  } catch {
    return null; // fail open
  }
}

/* ───────────────────────────────────────────────────────────
   使い方: app/layout.tsx（または各 page.tsx）の Server Component 内

   import { getNurevoJsonLd } from '@/lib/nurevo';

   export default async function RootLayout({ children }: { children: React.ReactNode }) {
     const ld = await getNurevoJsonLd('nrv_あなたのサイトキー');
     return (
       <html lang="ja">
         <head>
           {ld && (
             <script
               type="application/ld+json"
               // </script> 混入対策で < をエスケープ
               dangerouslySetInnerHTML={{
                 __html: JSON.stringify(ld).replace(/</g, '\\u003c'),
               }}
             />
           )}
         </head>
         <body>{children}</body>
       </html>
     );
   }
   ─────────────────────────────────────────────────────────── */
