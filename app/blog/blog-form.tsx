"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Alert from "@/app/components/alert";
import BlogEditor from "@/app/components/blog-editor";
import { createBlogAction, updateBlogAction } from "@/app/lib/blog-actions";

type BlogFormProps = {
    mode: "create" | "edit";
    blogId?: number;
    initialTitle?: string;
    initialContent?: string;
};

export default function BlogForm({ mode, blogId, initialTitle = "", initialContent = "" }: BlogFormProps) {
    const router = useRouter();
    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState(initialContent);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        const res =
            mode === "create"
                ? await createBlogAction(title, content)
                : await updateBlogAction(blogId!, title, content);

        if (res.error) {
            setError(res.error);
            setSubmitting(false);
            return;
        }
        if (res.ok && res.blogId !== undefined) {
            router.push(`/blog/${res.blogId}`);
            router.refresh();
            return;
        }
        setError("Something went wrong.");
        setSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <Alert message={error} type="error" />

            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title
                </label>
                <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="px-3 py-2 mt-1 block w-full text-lg border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="A great title…"
                    maxLength={200}
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                </label>
                <BlogEditor initialContent={initialContent} onChange={setContent} />
            </div>

            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    disabled={submitting}
                    className="button-main inline-flex items-center gap-2 disabled:opacity-60"
                >
                    <i className={`bi ${mode === "create" ? "bi-send" : "bi-check-lg"}`}></i>
                    {submitting
                        ? "Saving…"
                        : mode === "create"
                          ? "Publish"
                          : "Save changes"}
                </button>
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="button-secondary"
                    disabled={submitting}
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
