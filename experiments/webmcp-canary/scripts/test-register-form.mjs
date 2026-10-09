/**
 * The registration form behaviour shared by /member-register and /partner,
 * run from the real script.
 *
 * Three things went wrong for a visitor: a second click sent a second
 * application, that one came back as the bare code "member_exists", and a
 * success never said the registration was done. These drive the real handler
 * with a request held in flight and assert each of the three, in every
 * language the pages offer.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const SOURCE = read("../public/register-form.js");
const LANGS = ["ja", "en", "zh", "tw", "ko", "es", "fr", "de"];

function element(tag = "div") {
  const el = {
    tag, className: "", style: {}, children: [], attributes: {}, disabled: false, href: "",
    ownerDocument: { createElement: (t) => element(t) },
    appendChild(child) { el.children.push(child); },
    setAttribute(name, value) { el.attributes[name] = value; },
    removeAttribute(name) { delete el.attributes[name]; },
  };
  let own = "";
  Object.defineProperty(el, "textContent", {
    get: () => own + el.children.map((child) => child.textContent).join(" "),
    set: (value) => { own = String(value); el.children = []; },
  });
  return el;
}

/** A form, its button and status line, and a fetch the test resolves by hand. */
function setup({ lang = "ja", baseClass = "" } = {}) {
  const requests = [];
  const sandbox = {
    FormData: class { constructor(form) { this.form = form; } get(key) { return this.form.values[key] ?? null; } },
    fetch(url, init) {
      return new Promise((resolve, reject) => requests.push({ url, init, resolve, reject }));
    },
    JSON, Promise,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(SOURCE, sandbox);

  const button = element("button");
  button.textContent = "登録を申請";
  const status = element("p");
  status.className = baseClass;
  const form = {
    values: { email: "a@example.test", role: "store" },
    resets: 0, handlers: {},
    querySelector: (selector) => (selector === "button" ? button : null),
    addEventListener(type, handler) { form.handlers[type] = handler; },
    reset() { form.resets += 1; },
  };
  sandbox.NurevoRegister.attach(form, {
    status, lang: () => lang,
    payload: (f) => ({ email: f.get("email"), role: f.get("role") }),
  });
  const submit = () => form.handlers.submit({ preventDefault() {} });
  const respond = (index, status_, body) =>
    requests[index].resolve({ status: status_, json: async () => body });
  return { sandbox, form, button, status, requests, submit, respond };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

/* ---------------- a second click sends nothing ---------------- */

{
  const { button, status, requests, submit, respond, form } = setup();
  const first = submit();
  assert.equal(requests.length, 1, "the first submit sends the request");
  assert.equal(button.disabled, true, "the button is disabled at once, before any answer");
  assert.equal(button.attributes["aria-busy"], "true", "and announced as busy");
  assert.equal(button.textContent, "送信中…", "with a loading label");
  assert.equal(status.textContent, "送信中…", "and the status says so too");

  submit(); submit();
  assert.equal(requests.length, 1, "further submits while in flight send nothing");

  assert.equal(requests[0].url, "/api/members/register");
  assert.deepEqual(JSON.parse(requests[0].init.body), { email: "a@example.test", role: "store" });

  respond(0, 201, { ok: true, status: "pending", member_id: "mem_1", role: "store" });
  await first;
  assert.equal(button.disabled, false, "the button comes back when the answer arrives");
  assert.equal(button.attributes["aria-busy"], undefined);
  assert.equal(button.textContent, "登録を申請", "with its own label");
  assert.ok(status.textContent.includes("登録が完了しました"), "success says the registration is complete");
  assert.ok(status.textContent.includes("承認"), "and what happens next");
  assert.equal(status.className, "success");
  assert.equal(form.resets, 1, "the form is cleared");
  assert.equal(/mem_1|pending|\{/.test(status.textContent), false, "no raw response is shown");

  // Released means usable again: a later submit is a new request, not a dead button.
  submit();
  assert.equal(requests.length, 2, "a submit after completion goes through");
}

/* ---------------- already registered is an answer, not an error ---------------- */

for (const code of ["member_exists", "member_exist"]) {
  const { button, status, submit, respond, form } = setup({ baseClass: "status" });
  const done = submit();
  respond(0, 409, { error: code });
  await done;
  assert.ok(status.textContent.includes("このメールアドレスは既に登録済みです。ログインしてください。"), `${code}: explained in words`);
  assert.equal(status.textContent.includes(code), false, `${code}: the code itself is never shown`);
  assert.equal(status.className, "status exists", "not styled as an error, and the page's own class is kept");
  const link = status.children.find((child) => child.tag === "a");
  assert.ok(link, "a login link is offered");
  assert.equal(link.href, "/dashboard");
  assert.equal(form.resets, 0, "what was typed is left alone");
  assert.equal(button.disabled, false, "and the button is released");
}

/* ---------------- no failure shows a code ---------------- */

{
  const cases = [
    [429, { error: "rate_limited" }, "しばらく待って"],
    [400, { error: "email_and_role_required" }, "メールアドレスと種別"],
    [403, { error: "invalid_invite" }, "招待コード"],
    [503, { error: "partner_review_org_unavailable" }, "登録できませんでした"],
    [500, { message: "D1_ERROR: no such table" }, "登録できませんでした"],
  ];
  for (const [code, body, expected] of cases) {
    const { button, status, submit, respond } = setup();
    const done = submit();
    respond(0, code, body);
    await done;
    assert.ok(status.textContent.includes(expected), `${body.error || "message"}: readable`);
    assert.equal(/[a-z]+_[a-z_]+|D1_ERROR/.test(status.textContent), false, `${body.error || "message"}: nothing raw`);
    assert.equal(status.className, "error");
    assert.equal(button.disabled, false, "released after an error");
  }

  // A response that is not JSON, and a request that never arrives.
  const notJson = setup();
  const a = notJson.submit();
  notJson.requests[0].resolve({ status: 502, json: async () => { throw new SyntaxError("Unexpected token <"); } });
  await a;
  assert.ok(notJson.status.textContent.includes("登録できませんでした"));
  assert.equal(notJson.button.disabled, false);

  const offline = setup();
  const b = offline.submit();
  offline.requests[0].reject(new TypeError("Failed to fetch"));
  await b;
  assert.ok(offline.status.textContent.includes("登録できませんでした"));
  assert.equal(offline.status.textContent.includes("Failed to fetch"), false);
  assert.equal(offline.button.disabled, false, "released when the network fails");
  await settle();
}

/* ---------------- every language has every string ---------------- */

{
  const { sandbox } = setup();
  const M = sandbox.NurevoRegister.MESSAGES;
  const keys = Object.keys(M.ja);
  assert.deepEqual(Object.keys(M).sort(), [...LANGS].sort(), "the eight languages the pages offer");
  for (const lang of LANGS) {
    for (const key of keys) {
      assert.ok(typeof M[lang][key] === "string" && M[lang][key].trim(), `${lang}.${key} is present`);
    }
    assert.deepEqual(Object.keys(M[lang]).sort(), [...keys].sort(), `${lang} has no stray keys`);
  }
  // Japanese is written in Japanese, and nothing else silently reuses English.
  for (const key of keys) assert.ok(/[぀-ヿ一-龯]/.test(M.ja[key]), `ja.${key} is Japanese`);
  for (const lang of LANGS.filter((l) => l !== "en")) {
    for (const key of keys) assert.notEqual(M[lang][key], M.en[key], `${lang}.${key} is not the English string`);
  }

  for (const lang of LANGS) {
    const run = setup({ lang });
    const done = run.submit();
    assert.equal(run.button.textContent, M[lang].sending, `${lang}: loading label`);
    run.respond(0, 409, { error: "member_exists" });
    await done;
    assert.ok(run.status.textContent.includes(M[lang].exists), `${lang}: already-registered message`);
  }
}

/* ---------------- the pages use it, and the copies agree ---------------- */

{
  const lp = (path) => read(`../../nurevo-lp/public/${path}`);
  assert.equal(lp("register-form.js"), SOURCE, "the Pages copy of the script is identical");
  assert.equal(lp("member-register.html"), read("../public/member-register.html"), "as is the member page");

  for (const [name, page] of [["member-register", lp("member-register.html")], ["partner", lp("partner/index.html")]]) {
    assert.ok(page.includes('<script src="/register-form.js"></script>'), `${name} loads the shared script`);
    assert.ok(page.includes("NurevoRegister.attach("), `${name} attaches it`);
    assert.equal(/fetch\(['"]\/api\/members\/register/.test(page), false, `${name} has no handler of its own left`);
    assert.equal(/b\.message\|\|b\.error/.test(page), false, `${name} no longer prints the server's code`);
  }
  // The page that is actually served must not ask for an invite either.
  assert.equal(/name="invite"\s+required/.test(lp("member-register.html")), false, "the served member page does not require an invite");
  assert.equal(lp("member-register.html").includes("招待された方専用"), false, "nor call itself invite-only");
}

console.log("registration form tests passed");
