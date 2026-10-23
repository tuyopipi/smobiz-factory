/**
 * Inputs for the recommendations golden test. Every branch that writes words:
 * failing checks (gate and not), each scored property as missing / criteria
 * lag / schema missing, an unknown property, and every stored row kind with
 * the reasons the learning job, autofix and geocoder actually write.
 */
const PROPS = ["name", "url", "address", "streetAddress", "telephone", "openingHours", "geo", "description", "email", "priceRange"];
const FULL = {
  name: "栞珈琲", url: "https://example.com/", address: "東京都千代田区", phone: "03-1234-5678",
  hours: "11:00-20:00", lat: 35.6, lng: 139.7, description: "自家焙煎", email: "a@example.com",
};
const STORED = [
  { kind: "missing_customer_data", detail_json: JSON.stringify({ reason: "最新AEO rulesetの必須・推奨schema項目に、顧客確認が必要な店舗情報が不足しています。",
    missing_fields: [{ key: "price_level|price", schema: "priceRange", label: "価格帯" }, { key: "image", schema: "image", label: "画像" }, { key: "reserve_url", schema: "potentialAction", label: "予約URL" }, { key: "business_type", schema: "additionalType", label: "業種" }] }) },
  { kind: "autofix_required", detail_json: JSON.stringify({ reason: "公開情報の不足です。既存データのみ抽出し、不明な事実はオーナーに確認します。", missing_fields: [{ entityType: "LocalBusiness", field: "telephone" }] }) },
  { kind: "geo_unresolved", detail_json: JSON.stringify({ reason: "住所が番地まで特定できないため、位置情報（geo）を自動で付けていません。番地・建物名まで含む住所を入力すると自動で補完されます。", status: "imprecise" }) },
  { kind: "unknown_kind", detail_json: "{not json" },
];
import { GEO_REASONS } from "../../worker/geocoder.mjs";
const GEO = Object.entries(GEO_REASONS).map(([status, reason]) => ({ status, reason }));
export const CASES = [
  { name: "empty", input: {} },
  { name: "checks", input: { plan: "pro", checks: [
    { id: "ai_crawlers_allowed", status: "BAD", label: "AIクローラー到達性", message: "拒否しています。" },
    { id: "llms", status: "BAD", label: "llms.txt", message: "ありません。" },
    { id: "schema", status: "WARN", label: "構造化データ", message: "一部のみ。" },
    { id: "edge_access", status: "WARN", label: "", message: "" },
    { id: "ok", status: "OK", label: "x", message: "y" },
  ] } },
  { name: "profile_missing", input: { plan: "pro", profile: {}, scoredProps: [...PROPS, "sameAs"], publishedProps: [] } },
  { name: "criteria_lag", input: { plan: "free", profile: FULL, scoredProps: PROPS, publishedProps: ["name"] } },
  { name: "schema_missing", input: { plan: "standard", profile: FULL, scoredProps: [...PROPS, "sameAs"], publishedProps: [] } },
  { name: "stored", input: { plan: "pro", stored: STORED } },
  { name: "geo_reasons", input: { plan: "pro", stored: GEO.map((g, i) => ({ kind: "geo_unresolved", detail_json: JSON.stringify({ reason: g.reason, status: g.status, i }) })) } },
];
