import db from "./db";

export type Blog = {
    id: number;
    author_id: number;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
};

export type BlogWithAuthor = Blog & {
    author_name: string;
    author_picture: string | null;
};

export type BlogMutationResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: string };

function errorMessage(err: unknown, fallback: string): string {
    if (err instanceof Error && err.message) return err.message;
    return fallback;
}

export function createBlog(authorId: number, title: string, content: string): BlogMutationResult<{ id: number }> {
    try {
        const stmt = db.prepare(
            "INSERT INTO blogs (author_id, title, content) VALUES (?, ?, ?)"
        );
        const info = stmt.run(authorId, title, content);
        return { ok: true, data: { id: Number(info.lastInsertRowid) } };
    } catch (err) {
        console.error("createBlog failed:", err);
        return { ok: false, error: errorMessage(err, "Failed to create blog") };
    }
}

export function updateBlog(blogId: number, title: string, content: string): BlogMutationResult<{ changes: number }> {
    try {
        const stmt = db.prepare(
            "UPDATE blogs SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        );
        const info = stmt.run(title, content, blogId);
        return { ok: true, data: { changes: info.changes } };
    } catch (err) {
        console.error("updateBlog failed:", err);
        return { ok: false, error: errorMessage(err, "Failed to update blog") };
    }
}

export function deleteBlog(blogId: number): BlogMutationResult<{ changes: number }> {
    try {
        const stmt = db.prepare("DELETE FROM blogs WHERE id = ?");
        const info = stmt.run(blogId);
        return { ok: true, data: { changes: info.changes } };
    } catch (err) {
        console.error("deleteBlog failed:", err);
        return { ok: false, error: errorMessage(err, "Failed to delete blog") };
    }
}

export function getBlogById(blogId: number): BlogWithAuthor | undefined {
    try {
        const stmt = db.prepare(`
            SELECT b.id, b.author_id, b.title, b.content, b.created_at, b.updated_at,
                   u.name AS author_name, u.profile_picture_link AS author_picture
            FROM blogs b
            JOIN users u ON u.id = b.author_id
            WHERE b.id = ?
        `);
        return stmt.get(blogId) as BlogWithAuthor | undefined;
    } catch (err) {
        console.error("getBlogById failed:", err);
        return undefined;
    }
}

export function getAllBlogs(): BlogWithAuthor[] {
    try {
        const stmt = db.prepare(`
            SELECT b.id, b.author_id, b.title, b.content, b.created_at, b.updated_at,
                   u.name AS author_name, u.profile_picture_link AS author_picture
            FROM blogs b
            JOIN users u ON u.id = b.author_id
            ORDER BY b.created_at DESC
        `);
        return stmt.all() as BlogWithAuthor[];
    } catch (err) {
        console.error("getAllBlogs failed:", err);
        return [];
    }
}
