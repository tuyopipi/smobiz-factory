// Content page: Is your site visible to AI? - free check
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
  slug: "ai-visibility-check",
  // The searches and questions this page is meant to answer.
  targetQueries: ["is my site visible to AI", "AI visibility checker", "check if ChatGPT can read my site", "AI readability test"],
  // Other content pages to link to, by slug. Only published ones are linked.
  related: ["what-is-aeo", "how-to-appear-in-chatgpt", "aeo-for-wordpress"],
  locales: {
    en: {
      title: "",        // <title>, about 60 characters
      description: "",  // meta description, about 155 characters
      h1: "",
      lead: "",         // one or two sentences that answer the page's main question outright
      questions: [
        { q: "How can I tell whether AI can read my site?", a: "" },
        { q: "What does the free check look at?", a: "" },
        { q: "What does the score mean?", a: "" },
        { q: "What should I fix first?", a: "" },
        { q: "Is the check really free?", a: "" },
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
