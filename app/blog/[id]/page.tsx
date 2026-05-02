import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth/auth-options";
import { isAdmin } from "../../lib/db/admins";
import { getBlogById } from "../../lib/db/blogs";
import { sanitizeBlogHtml } from "../../lib/sanitize-blog";
import DeleteBlogButton from "./delete-button";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const blogId = Number(id);
    if (!Number.isFinite(blogId)) return { title: "Post not found", robots: { index: false, follow: false } };

    const blog = getBlogById(blogId);
    if (!blog) return { title: "Post not found", robots: { index: false, follow: false } };

    const description = excerptFromHtml(blog.content, 200);
    const url = `/blog/${blog.id}`;
    const published = toIsoDate(blog.created_at);
    const modified = toIsoDate(blog.updated_at);

    return {
        title: blog.title,
        description,
        authors: [{ name: blog.author_name }],
        alternates: { canonical: url },
        openGraph: {
            type: "article",
            title: blog.title,
            description,
            url,
            siteName: "FocusRoom",
            publishedTime: published,
            modifiedTime: modified,
            authors: [blog.author_name],
        },
        twitter: {
            card: "summary_large_image",
            title: blog.title,
            description,
        },
    };
}

function formatDate(iso: string): string {
    const d = new Date(iso.replace(" ", "T") + "Z");
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function toIsoDate(sqliteTs: string): string {
    const d = new Date(sqliteTs.replace(" ", "T") + "Z");
    return isNaN(d.getTime()) ? sqliteTs : d.toISOString();
}

function absoluteUrl(baseUrl: string, path: string | null): string | null {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

function excerptFromHtml(html: string, max = 200): string {
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text.length <= max) return text;
    return text.slice(0, max - 1).trimEnd() + "…";
}

export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const blogId = Number(id);
    if (!Number.isFinite(blogId)) notFound();

    const blog = getBlogById(blogId);
    if (!blog) notFound();

    const session = await getServerSession(authOptions);
    const meIsAdmin = session?.user?.id ? isAdmin(Number(session.user.id)) : false;

    const baseUrl = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const postUrl = `${baseUrl}/blog/${blog.id}`;
    const authorImage = absoluteUrl(baseUrl, blog.author_picture);
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: blog.title,
        description: excerptFromHtml(blog.content),
        datePublished: toIsoDate(blog.created_at),
        dateModified: toIsoDate(blog.updated_at),
        author: {
            "@type": "Person",
            name: blog.author_name,
            ...(authorImage ? { image: authorImage } : {}),
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
        url: postUrl,
    };

    return (
        <div className="min-h-screen bg-zinc-50">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-16">
                <Link href="/blog" className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1">
                    <i className="bi bi-arrow-left"></i> All posts
                </Link>

                <article className="mt-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{blog.title}</h1>

                    <div className="flex items-center gap-3 mt-4 text-sm text-gray-500">
                        {blog.author_picture ? (
                            <Image
                                src={blog.author_picture}
                                alt={blog.author_name}
                                width={28}
                                height={28}
                                className="rounded-full w-7 h-7 object-cover"
                            />
                        ) : (
                            <i className="bi bi-person-circle text-2xl"></i>
                        )}
                        <span className="font-medium text-gray-700">{blog.author_name}</span>
                        <span aria-hidden>·</span>
                        <span>{formatDate(blog.created_at)}</span>
                        {blog.updated_at !== blog.created_at && (
                            <span className="text-gray-400 italic">(edited)</span>
                        )}
                    </div>

                    {meIsAdmin && (
                        <div className="mt-5 flex gap-2">
                            <Link href={`/blog/${blog.id}/edit`} className="button-secondary inline-flex items-center gap-2">
                                <i className="bi bi-pencil"></i> Edit
                            </Link>
                            <DeleteBlogButton blogId={blog.id} />
                        </div>
                    )}

                    <hr className="my-8 border-gray-200" />

                    <div
                        className="blog-prose"
                        dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(blog.content) }}
                    />
                </article>
            </div>
        </div>
    );
}
