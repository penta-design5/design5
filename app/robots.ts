import type { MetadataRoute } from "next";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://layerary.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/login",
          "/register",
          "/error",
          "/profile",
          "/diagram/editor",
          "/edm/editor",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
