import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth/auth-options";
import { isAdmin } from "../../lib/db/admins";
import BlogForm from "../blog-form";

export const metadata: Metadata = {
    title: "New blog post",
    description: "Create a new FocusRoom blog post.",
    robots: { index: false, follow: false },
    alternates: { canonical: "/blog/create" },
};

export default async function CreateBlogPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) redirect("/signin?callbackUrl=/blog/create");
    if (!isAdmin(Number(session.user.id))) redirect("/blog");

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
                <header className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">New blog post</h1>
                    <p className="text-gray-500 text-sm mt-1">Write something worth reading.</p>
                </header>
                <BlogForm mode="create" />
            </div>
        </div>
    );
}
