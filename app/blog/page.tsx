import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth/auth-options";
import { isAdmin } from "../lib/db/admins";
import { getAllBlogs } from "../lib/db/blogs";

const blogDescription =
  "News, focus tips, and product updates from the FocusRoom team — guides on Pomodoro, deep work, and studying with friends.";

export const metadata: Metadata = {
  title: "Blog",
  description: blogDescription,
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    title: "FocusRoom Blog",
    description: blogDescription,
    url: "/blog",
  },
  twitter: {
    card: "summary_large_image",
    title: "FocusRoom Blog",
    description: blogDescription,
  },
};

function stripHtml(html: string): string {
    return html
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, " ")
        .trim();
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

export default async function BlogIndexPage() {
    const session = await getServerSession(authOptions);
    const meIsAdmin = session?.user?.id ? isAdmin(Number(session.user.id)) : false;
    const blogs = getAllBlogs();

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
                <header className="mb-8 md:mb-12 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Blog</h1>
                    <p className="text-gray-500 mt-2 text-sm md:text-base max-w-xl mx-auto">
                        News, focus tips, and updates from the FocusRoom team.
                    </p>
                    {meIsAdmin && (
                        <div className="mt-6">
                            <Link href="/blog/create" className="button-main inline-flex items-center gap-2">
                                <i className="bi bi-plus-lg"></i>
                                New post
                            </Link>
                        </div>
                    )}
                </header>

                {blogs.length === 0 ? (
                    <div className="card text-center text-gray-500">
                        No blog posts yet.
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {blogs.map((blog) => {
                            const excerpt = stripHtml(blog.content).slice(0, 220);
                            return (
                                <li key={blog.id}>
                                    <Link
                                        href={`/blog/${blog.id}`}
                                        className="card block hover:shadow-md transition-shadow"
                                    >
                                        <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                                            {blog.title}
                                        </h2>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                            {blog.author_picture ? (
                                                <Image
                                                    src={blog.author_picture}
                                                    alt={blog.author_name}
                                                    width={20}
                                                    height={20}
                                                    className="rounded-full w-5 h-5 object-cover"
                                                />
                                            ) : (
                                                <i className="bi bi-person-circle text-base"></i>
                                            )}
                                            <span>{blog.author_name}</span>
                                            <span aria-hidden>·</span>
                                            <span>{formatDate(blog.created_at)}</span>
                                        </div>
                                        {excerpt && (
                                            <p className="mt-3 text-sm text-gray-600 line-clamp-3">
                                                {excerpt}
                                                {excerpt.length === 220 ? "…" : ""}
                                            </p>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
