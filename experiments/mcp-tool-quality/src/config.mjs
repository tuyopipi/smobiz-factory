import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const QUALITIES = ["low", "high"];

export const DEFAULTS = {
  runs: 10,
  smokeRuns: 3,
  maxSteps: 25,
  provider: process.env.MODEL_PROVIDER || "openai",
  model: process.env.MODEL_NAME || process.env.OPENAI_MODEL || "gpt-4.1-mini",
  temperature: Number(process.env.MODEL_TEMPERATURE || process.env.OPENAI_TEMPERATURE || "0.7")
};

export const SAMPLE_FORMS = [
  {
    id: "a",
    name: "A Multi-step Booking",
    path: "/samples/forms/a-multistep-booking.html",
    mcp: { low: "samples/mcp/a-low.json", high: "samples/mcp/a-high.json" },
    task: "東京で2026年3月15日から2泊、2名で予約してください。代表者は山田 太郎、メールは taro.yamada.test@example.com、電話は 090-1234-5678 です。"
  },
  {
    id: "b",
    name: "B Conditional Application",
    path: "/samples/forms/b-conditional-application.html",
    mcp: { low: "samples/mcp/b-low.json", high: "samples/mcp/b-high.json" },
    task: "法人申込をしてください。会社名は株式会社テスト、役職はエンジニア、国は日本、都道府県は東京都、郵便番号は150-0001、メールは taro.yamada.test@example.com、電話は090-1234-5678です。"
  },
  {
    id: "c",
    name: "C Ambiguous Labels",
    path: "/samples/forms/c-ambiguous-labels.html",
    mcp: { low: "samples/mcp/c-low.json", high: "samples/mcp/c-high.json" },
    task: "会員登録をしてください。姓は山田、名は太郎、メールは taro.yamada.test@example.com、電話は090-1234-5678、郵便番号は150-0001、都道府県は東京都、市区町村は渋谷区、会社名は株式会社テストです。"
  },
  {
    id: "d",
    name: "D Strict Formats",
    path: "/samples/forms/d-strict-formats.html",
    mcp: { low: "samples/mcp/d-low.json", high: "samples/mcp/d-high.json" },
    task: "本人確認フォームを記入してください。生年月日は1995年4月1日、希望時刻は14時30分、姓カナはヤマダ、名カナはタロウ、電話は090-1234-5678、郵便番号は150-0001、年収は5,000,000円です。"
  },
  {
    id: "e",
    name: "E Combined Complex",
    path: "/samples/forms/e-combined-complex.html",
    mcp: { low: "samples/mcp/e-low.json", high: "samples/mcp/e-high.json" },
    task: "法人の総合申請をしてください。会社名は株式会社テスト、役職はエンジニア、国は日本、郵便番号は150-0001、都道府県は東京都、市区町村は渋谷区、姓は山田、名は太郎、メールは taro.yamada.test@example.com、電話は090-1234-5678、生年月日は1995年4月1日です。"
  }
];

export const FORMS = SAMPLE_FORMS;

export async function loadBenchmarkConfig({ configPath, projectDir }) {
  if (!configPath) return { forms: SAMPLE_FORMS, defaults: DEFAULTS };
  const absolute = configPath.startsWith("/") ? configPath : join(projectDir, configPath);
  const parsed = JSON.parse(await readFile(absolute, "utf8"));
  return {
    forms: parsed.forms ?? SAMPLE_FORMS,
    defaults: { ...DEFAULTS, ...(parsed.defaults ?? {}) }
  };
}
