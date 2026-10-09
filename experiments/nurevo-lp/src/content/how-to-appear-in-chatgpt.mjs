// Content page: How to appear in ChatGPT / AI search
//
// This is the frame. The page is built, with its Q&A structure, FAQPage schema,
// breadcrumb, internal links and call to action, as soon as every field of a
// locale below has copy in it - and not before: a page with an empty answer is
// not published, listed in the sitemap, or linked from another page.
//
// To publish: fill title, description, h1, lead and every answer ("a") for a
// locale, then run `npm run build`. To see the unfinished page first, run
// `npm run preview:drafts`. To add a language, add a block under `locales`
// keyed by a code from src/site.mjs (ja, en, zh, zh-TW, ko, es, fr, de); the
// page is then served under that language's path and joins the hreflang set.
//
// Answers are plain text. A blank line starts a new paragraph. The questions
// below are a suggested outline, not copy: reword, reorder, add or remove them.
export default {
  slug: "how-to-appear-in-chatgpt",
  // The searches and questions this page is meant to answer.
  targetQueries: ["how to appear in ChatGPT", "how to get cited by ChatGPT", "how to show up in AI search", "how to rank in Perplexity"],
  // Other content pages to link to, by slug. Only published ones are linked.
  related: ["what-is-aeo", "llms-txt", "ai-visibility-check"],
  locales: {
    en: {
      title: "",        // <title>, about 60 characters
      description: "",  // meta description, about 155 characters
      h1: "",
      lead: "",         // one or two sentences that answer the page's main question outright
      questions: [
        { q: "How does ChatGPT find and choose the sites it cites?", a: "" },
        { q: "Which crawlers do I need to allow?", a: "" },
        { q: "What structured data helps an AI answer describe my business correctly?", a: "" },
        { q: "Does llms.txt help?", a: "" },
        { q: "How long does it take to appear?", a: "" },
        { q: "How can I check whether AI can read my site today?", a: "" },
      ],
      relatedHeading: "Related guides",
      cta: {
        heading: "Is your site visible to AI?",
        body: "Enter a URL and get a free AI-readability score. No sign-up.",
        label: "Run the free check",
        href: "/check?lang=en",
      },
    },
  },
};
