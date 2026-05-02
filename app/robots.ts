import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");

    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/api/",
                    "/blog/new",
                    "/blog/*/edit",
                    "/profile",
                    "/friends",
                    "/rooms/create",
                    "/room/",
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}