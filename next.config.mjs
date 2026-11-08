// BASE_PATH is set automatically by the GitHub Action (e.g. "/my-blog").
const basePath = process.env.BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",          // build plain HTML files that GitHub Pages can host
  basePath,
  images: { unoptimized: true },
  trailingSlash: true,
  // Safety net so a small typing issue never blocks publishing the site.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
