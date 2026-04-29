"use client";

import { useState, useTransition } from "react";
import Alert from "@/app/components/alert";
import { deleteBlogAction } from "@/app/lib/blog-actions";

export default function DeleteBlogButton({ blogId }: { blogId: number }) {
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (!confirm("Delete this blog post? This cannot be undone.")) return;
        setError("");
        startTransition(async () => {
            const res = await deleteBlogAction(blogId);
            if (res?.error) setError(res.error);
        });
    };

    return (
        <>
            <Alert message={error} type="error" />
            <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-60 cursor-pointer"
            >
                <i className="bi bi-trash"></i>
                {isPending ? "Deleting…" : "Delete"}
            </button>
        </>
    );
}
