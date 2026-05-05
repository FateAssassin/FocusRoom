import { getProfilePicturesDir } from "@/app/lib/uploads";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const CONTENT_TYPES: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
};

const FILENAME_PATTERN = /^[A-Za-z0-9._-]+$/;

function notFound() {
    return new NextResponse("Not found", { status: 404 });
}

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ filename: string }> },
) {
    const { filename } = await params;

    if (!filename || filename.includes("..") || !FILENAME_PATTERN.test(filename)) {
        return notFound();
    }

    const ext = path.extname(filename).toLowerCase();
    const contentType = CONTENT_TYPES[ext];
    if (!contentType) return notFound();

    const filePath = path.join(getProfilePicturesDir(), filename);

    try {
        const stats = await stat(filePath);
        if (!stats.isFile()) return notFound();
        const data = await readFile(filePath);
        return new NextResponse(new Uint8Array(data), {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Content-Length": String(stats.size),
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch {
        return notFound();
    }
}
