/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F172A",
        paper: "#FBFBFD",
        mute: "#64748B",
        accent: "#0E7C86",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      typography: {
        article: {
          css: {
            "--tw-prose-body": "#1E293B",
            "--tw-prose-headings": "#0F172A",
            "--tw-prose-links": "#0E7C86",
            "--tw-prose-quote-borders": "#0E7C86",
            "--tw-prose-bullets": "#94A3B8",
            fontFamily: "var(--font-serif)",
            fontSize: "1.1875rem",
            lineHeight: "1.8",
            "h1,h2,h3,h4": { fontFamily: "var(--font-sans)", letterSpacing: "-0.02em" },
            a: { textUnderlineOffset: "3px" },
            "blockquote p:first-of-type::before": { content: "none" },
            "blockquote p:last-of-type::after": { content: "none" },
            img: { borderRadius: "0.5rem" },
            code: { fontWeight: "500" },
            "code::before": { content: '""' },
            "code::after": { content: '""' },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
