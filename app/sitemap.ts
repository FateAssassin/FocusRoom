import type { MetadataRoute } from "next";
import { getAllBlogs } from "./lib/db/blogs";

export const revalidate = 3600;

function toDate(sqliteTs: string): Date {
    const d = new Date(sqliteTs.replace(" ", "T") + "Z");
    return isNaN(d.getTime()) ? new Date() : d;
}

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const now = new Date();

    const blogs = getAllBlogs();
    const blogEntries: MetadataRoute.Sitemap = blogs.map((b) => ({
        url: `${baseUrl}/blog/${b.id}`,
        lastModified: toDate(b.updated_at),
        changeFrequency: "weekly",
        priority: 0.8,
    }));

    return [
        {
            url: `${baseUrl}/`,
            lastModified: now,
            changeFrequency: "monthly",
            priority: 1.0,
        },
        {
            url: `${baseUrl}/blog`,
            lastModified: blogEntries[0]?.lastModified ?? now,
            changeFrequency: "weekly",
            priority: 0.9,
        },
        ...blogEntries,
        {
            url: `${baseUrl}/rooms`,
            lastModified: now,
            changeFrequency: "daily",
            priority: 0.5,
        },
    ];
}