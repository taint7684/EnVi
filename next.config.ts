import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  /* config options here */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Spec 7.1 route -> actual route (bookmarks tu ban cu van hoat dong)
      { source: "/speak", destination: "/speaking", permanent: true },
      { source: "/speak/coach", destination: "/speaking", permanent: true },
      { source: "/speak/missions", destination: "/speaking/missions", permanent: true },
      { source: "/speak/drills", destination: "/speaking/drills", permanent: true },
      { source: "/speak/strategy-cards", destination: "/speaking/strategy-cards", permanent: true },
      { source: "/practice", destination: "/reflex", permanent: true },
      { source: "/practice/reflex", destination: "/reflex", permanent: true },
      { source: "/practice/vocab", destination: "/vocab", permanent: true },
      { source: "/practice/listen", destination: "/shadowing", permanent: true },
      { source: "/practice/dictation", destination: "/dictation", permanent: true },
      { source: "/practice/pronunciation", destination: "/pronunciation", permanent: true },
      { source: "/practice/reading", destination: "/reading", permanent: true },
      { source: "/practice/grammar", destination: "/grammar", permanent: true },
      { source: "/practice/writing", destination: "/writing", permanent: true },
      { source: "/progress/roadmap", destination: "/roadmap", permanent: true },
      { source: "/progress/real-world", destination: "/real-world", permanent: true },
      { source: "/dashboard", destination: "/today", permanent: true },
    ];
  },
};

export default nextConfig;
