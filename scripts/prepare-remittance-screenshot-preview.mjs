import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const out = "artifacts/chrome-publication/remittance-advice-generator";
const popup = await readFile(join(out, "extension", "popup.html"), "utf8");
const sampleDraft = {
  payer: "Acme Ltd",
  amount: "1250.00",
  invoice: "INV-1042, INV-1043",
  notes: "Bank transfer received; apply the payment across the listed invoices.",
  output: [
    "Remittance advice for Acme Ltd",
    "Payment amount: 1250.00",
    "Applied to invoice(s): INV-1042, INV-1043",
    "Notes: Bank transfer received; apply the payment across the listed invoices.",
    "Please match this payment against the listed invoice references and flag any remaining balance or deduction."
  ].join("\n")
};

const preview = popup
  .replace("<link rel=\"stylesheet\" href=\"popup.css\">", "<link rel=\"stylesheet\" href=\"extension/popup.css\">")
  .replace(
    "</head>",
    `<style>
      body {
        width: auto !important;
        min-height: 800px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #eef2f7 !important;
      }
      main {
        width: 360px;
        background: #f7f8fb;
        border: 1px solid #cfd7e2;
        box-shadow: 0 20px 70px rgba(24, 32, 42, 0.18);
      }
    </style>
    <script>
      globalThis.chrome = {
        storage: {
          local: {
            async get() { return { remittanceDraft: ${JSON.stringify(sampleDraft)} }; },
            async set() {},
            async remove() {}
          }
        }
      };
    </script>
  </head>`
  )
  .replace(
    "</body>",
    `<script>
      setTimeout(() => {
        const draft = ${JSON.stringify(sampleDraft)};
        for (const key of ["payer", "amount", "invoice", "notes", "output"]) {
          const element = document.querySelector("#" + key);
          if (element) element.value = draft[key] || "";
        }
      }, 50);
    </script>
  </body>`
  );

await writeFile(join(out, "screenshot-preview.html"), preview);
console.log(join(out, "screenshot-preview.html"));
