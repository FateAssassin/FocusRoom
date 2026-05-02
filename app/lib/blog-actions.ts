'use server';

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/auth-options";
import { isAdmin } from "./db/admins";
import { createBlog, deleteBlog, getBlogById, updateBlog } from "./db/blogs";
import { sanitizeBlogHtml } from "./sanitize-blog";

const TITLE_MAX = 200;
const CONTENT_MAX = 100_000;

export type BlogActionState = { error?: string; ok?: boolean; blogId?: number };

async function currentAdminId(): Promise<{ id: number } | { error: string }> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: "You must be signed in." };
    const id = Number(session.user.id);
    if (!Number.isFinite(id)) return { error: "Invalid session." };
    if (!isAdmin(id)) return { error: "Only admins can manage blog posts." };
    return { id };
}

function validateInput(title: string, content: string): string | null {
    if (!title) return "Title is required.";
    if (title.length > TITLE_MAX) return `Title must be ${TITLE_MAX} characters or fewer.`;
    if (!content || content === "<p></p>") return "Content cannot be empty.";
    if (content.length > CONTENT_MAX) return "Content is too long.";
    return null;
}

export async function createBlogAction(title: string, content: string): Promise<BlogActionState> {
    const auth = await currentAdminId();
    if ("error" in auth) return { error: auth.error };

    const trimmedTitle = title.trim();
    const sanitizedContent = sanitizeBlogHtml(content);
    const validationError = validateInput(trimmedTitle, sanitizedContent);
    if (validationError) return { error: validationError };

    const result = createBlog(auth.id, trimmedTitle, sanitizedContent);
    if (!result.ok) return { error: result.error };

    revalidatePath("/blog");
    return { ok: true, blogId: result.data.id };
}

export async function updateBlogAction(blogId: number, title: string, content: string): Promise<BlogActionState> {
    const auth = await currentAdminId();
    if ("error" in auth) return { error: auth.error };

    const blog = getBlogById(blogId);
    if (!blog) return { error: "Blog not found." };

    const trimmedTitle = title.trim();
    const sanitizedContent = sanitizeBlogHtml(content);
    const validationError = validateInput(trimmedTitle, sanitizedContent);
    if (validationError) return { error: validationError };

    const result = updateBlog(blogId, trimmedTitle, sanitizedContent);
    if (!result.ok) return { error: result.error };

    revalidatePath("/blog");
    revalidatePath(`/blog/${blogId}`);
    return { ok: true, blogId };
}

export async function deleteBlogAction(blogId: number): Promise<BlogActionState> {
    const auth = await currentAdminId();
    if ("error" in auth) return { error: auth.error };

    const blog = getBlogById(blogId);
    if (!blog) return { error: "Blog not found." };

    const result = deleteBlog(blogId);
    if (!result.ok) return { error: result.error };

    revalidatePath("/blog");
    redirect("/blog");
}
