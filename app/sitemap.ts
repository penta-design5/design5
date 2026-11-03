import type { MetadataRoute } from "next";
import { getCategories } from "@/lib/categories";
import { isHtmlMenu } from "@/lib/menus/schemas";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://layerary.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await getCategories();

  // 숨김 메뉴·HTML 메뉴(로그인 전용)는 제외
  const isListed = (c: { isHidden: boolean; pageType: string | null }) =>
    !c.isHidden && !isHtmlMenu(c);
  const categorySlugs = categories.filter(isListed).flatMap((c) => [
    c.slug,
    ...(c.children?.filter(isListed).map((ch) => ch.slug) ?? []),
  ]);

  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    ...categorySlugs.map((slug) => ({
      url: `${baseUrl}/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  return entries;
}
