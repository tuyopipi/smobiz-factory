// Content page: What is AEO / GEO (pillar page)
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
  slug: "what-is-aeo",
  // The searches and questions this page is meant to answer.
  targetQueries: ["what is AEO", "answer engine optimization", "what is GEO", "generative engine optimization", "AEO vs SEO"],
  // Other content pages to link to, by slug. Only published ones are linked.
  related: ["how-to-appear-in-chatgpt", "aeo-for-wordpress", "llms-txt", "ai-visibility-check"],
  locales: {
    en: {
      title: "",        // <title>, about 60 characters
      description: "",  // meta description, about 155 characters
      h1: "",
      lead: "",         // one or two sentences that answer the page's main question outright
      questions: [
        { q: "What is AEO (answer engine optimization)?", a: "" },
        { q: "What is GEO (generative engine optimization), and is it different from AEO?", a: "" },
        { q: "How is AEO different from SEO?", a: "" },
        { q: "How do AI answer engines decide which sites to cite?", a: "" },
        { q: "What does a site need in place to be read by AI?", a: "" },
        { q: "How do you measure AEO?", a: "" },
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
