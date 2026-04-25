import { authOptions } from "@/app/lib/auth/auth-options";
import { getUserById, updateUserProfilePicture } from "@/app/lib/db/users";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Map([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
    ["image/gif", "gif"],
]);

function sniffImageMime(buf: Buffer): string | null {
    if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
        return "image/jpeg";
    }
    if (
        buf.length >= 8 &&
        buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
        buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
    ) {
        return "image/png";
    }
    if (
        buf.length >= 6 &&
        buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38 &&
        (buf[4] === 0x37 || buf[4] === 0x39) && buf[5] === 0x61
    ) {
        return "image/gif";
    }
    if (
        buf.length >= 12 &&
        buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
        buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
    ) {
        return "image/webp";
    }
    return null;
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        return NextResponse.json({ error: "Please upload a JPG, PNG, WEBP, or GIF image." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "Image must be 5 MB or smaller." }, { status: 400 });
    }

    const userId = Number(session.user.id);
    const user = getUserById(userId);
    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sniffedMime = sniffImageMime(buffer);
    if (!sniffedMime || !ALLOWED_IMAGE_TYPES.has(sniffedMime)) {
        return NextResponse.json(
            { error: "File contents don't match a supported image format." },
            { status: 400 },
        );
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "profile-pictures");
    await mkdir(uploadsDir, { recursive: true });

    const extension = ALLOWED_IMAGE_TYPES.get(sniffedMime);
    const filename = `user-${userId}-${Date.now()}.${extension}`;
    const diskPath = path.join(uploadsDir, filename);
    const publicPath = `/uploads/profile-pictures/${filename}`;

    await writeFile(diskPath, buffer);

    const previousPicture = user.profile_picture_link;
    updateUserProfilePicture(userId, publicPath);

    if (previousPicture?.startsWith("/uploads/profile-pictures/")) {
        const previousFilePath = path.join(process.cwd(), "public", previousPicture.replace(/^\/+/, "").replace(/\//g, path.sep));
        if (previousFilePath !== diskPath) {
            await unlink(previousFilePath).catch(() => undefined);
        }
    }

    return NextResponse.json({ profilePictureLink: publicPath });
}
