const HIGH_PLANS = {
  a: [
    ["select", "#destination", "tokyo"], ["fill", "#checkin", "2026-03-15"], ["fill", "#nights", "2"], ["fill", "#guests", "2"], ["click", "#next1"],
    ["fill", "#familyName", "山田"], ["fill", "#givenName", "太郎"], ["fill", "#email", "taro.yamada.test@example.com"], ["fill", "#phone", "09012345678"], ["click", "#next2"], ["click", "#submit"]
  ],
  b: [
    ["select", "#plan", "business"], ["fill", "#company", "株式会社テスト"], ["fill", "#jobTitle", "エンジニア"], ["select", "#country", "JP"], ["select", "#prefecture", "東京都"], ["fill", "#postalCode", "1500001"], ["fill", "#email", "taro.yamada.test@example.com"], ["fill", "#phone", "09012345678"], ["click", "#submit"]
  ],
  c: [
    ["fill", "#f1", "山田"], ["fill", "#f2", "太郎"], ["fill", "#f3", "taro.yamada.test@example.com"], ["fill", "#f4", "09012345678"], ["fill", "#f5", "1500001"], ["fill", "#f6", "東京都"], ["fill", "#f7", "渋谷区"], ["fill", "#f8", "株式会社テスト"], ["click", "#submit"]
  ],
  d: [
    ["fill", "#birthdate", "1995-04-01"], ["fill", "#visitTime", "14:30"], ["fill", "#kanaFamily", "ヤマダ"], ["fill", "#kanaGiven", "タロウ"], ["fill", "#phone", "09012345678"], ["fill", "#postalCode", "1500001"], ["fill", "#annualIncome", "5000000"], ["click", "#submit"]
  ],
  e: [
    ["select", "#accountType", "business"], ["fill", "#x1", "株式会社テスト"], ["fill", "#x2", "エンジニア"], ["click", "#next1"], ["select", "#country", "JP"], ["fill", "#zip", "1500001"], ["fill", "#pref", "東京都"], ["fill", "#city", "渋谷区"], ["click", "#next2"], ["fill", "#n1", "山田"], ["fill", "#n2", "太郎"], ["fill", "#mail", "taro.yamada.test@example.com"], ["fill", "#tel", "09012345678"], ["fill", "#birth", "1995-04-01"], ["click", "#submit"]
  ],
  f: [
    ["fill", "#pickup", "羽田空港"], ["fill", "#dropoff", "渋谷"], ["fill", "#rideDate", "2026-03-15"], ["fill", "#rideTime", "14:30"], ["fill", "#passengers", "2"], ["fill", "#last", "山田"], ["fill", "#first", "太郎"], ["fill", "#mail", "taro.yamada.test@example.com"], ["fill", "#tel", "09012345678"], ["click", "#submit"]
  ]
};

const LOW_PLANS = {
  a: [["select", "#destination", "tokyo"], ["fill", "#checkin", "2026-03-15"], ["fill", "#nights", "2"], ["fill", "#guests", "2"], ["click", "#next1"], ["fill", "#familyName", "山田"], ["fill", "#givenName", "太郎"], ["fill", "#email", "taro.yamada.test@example.com"], ["fill", "#phone", "090-1234-5678"], ["click", "#next2"], ["click", "#submit"]],
  b: [["select", "#plan", "personal"], ["select", "#country", "JP"], ["select", "#prefecture", "東京都"], ["fill", "#postalCode", "150-0001"], ["fill", "#email", "taro.yamada.test@example.com"], ["fill", "#phone", "090-1234-5678"], ["click", "#submit"]],
  c: [["fill", "#f1", "山田 太郎"], ["fill", "#f2", "taro.yamada.test@example.com"], ["fill", "#f3", "090-1234-5678"], ["fill", "#f4", "150-0001"], ["fill", "#f5", "東京都"], ["fill", "#f6", "渋谷区"], ["fill", "#f7", "株式会社テスト"], ["click", "#submit"]],
  d: [["fill", "#birthdate", "1995年4月1日"], ["fill", "#visitTime", "14時30分"], ["fill", "#kanaFamily", "やまだ"], ["fill", "#kanaGiven", "たろう"], ["fill", "#phone", "090-1234-5678"], ["fill", "#postalCode", "150-0001"], ["fill", "#annualIncome", "5,000,000円"], ["click", "#submit"]],
  e: [["fill", "#website", "example.com"], ["select", "#accountType", "business"], ["fill", "#x1", "株式会社テスト"], ["click", "#next1"], ["select", "#country", "JP"], ["fill", "#zip", "150-0001"], ["fill", "#pref", "東京都"], ["click", "#next2"], ["fill", "#n1", "山田 太郎"], ["fill", "#mail", "taro.yamada.test@example.com"], ["fill", "#tel", "090-1234-5678"], ["fill", "#birth", "1995年4月1日"], ["click", "#submit"]],
  f: [["fill", "#pickup", "羽田空港"], ["fill", "#dropoff", "渋谷"], ["fill", "#rideDate", "2026-03-15"], ["fill", "#rideTime", "14:30"], ["fill", "#passengers", "2"], ["fill", "#last", "山田"], ["fill", "#first", "太郎"], ["fill", "#mail", "taro.yamada.test@example.com"], ["fill", "#tel", "090-1234-5678"], ["click", "#submit"]]
};

export function mockAction({ formId, quality, step, mcpDefinition }) {
  const plan = mcpDefinition?.repair_plan ?? (quality === "high" || quality === "repaired" ? HIGH_PLANS[formId] : LOW_PLANS[formId]);
  const item = plan?.[step - 1];
  if (!item) return { action: "done", reason: "mock plan exhausted" };
  const [action, selector, value] = item;
  return { action, selector, value, reason: `mock ${quality} action for ${formId}` };
}
