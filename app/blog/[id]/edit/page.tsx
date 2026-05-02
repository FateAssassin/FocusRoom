import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth/auth-options";
import { isAdmin } from "../../../lib/db/admins";
import { getBlogById } from "../../../lib/db/blogs";
import BlogForm from "../../blog-form";

export const metadata: Metadata = {
    title: "Edit blog post",
    description: "Edit an existing FocusRoom blog post.",
    robots: { index: false, follow: false },
};

export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const blogId = Number(id);
    if (!Number.isFinite(blogId)) notFound();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) redirect(`/signin?callbackUrl=/blog/${blogId}/edit`);
    if (!isAdmin(Number(session.user.id))) redirect(`/blog/${blogId}`);

    const blog = getBlogById(blogId);
    if (!blog) notFound();

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
                <header className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Edit blog post</h1>
                </header>
                <BlogForm
                    mode="edit"
                    blogId={blog.id}
                    initialTitle={blog.title}
                    initialContent={blog.content}
                />
            </div>
        </div>
    );
}
