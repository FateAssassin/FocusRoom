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

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "profile-pictures");
    await mkdir(uploadsDir, { recursive: true });

    const extension = ALLOWED_IMAGE_TYPES.get(file.type);
    const filename = `user-${userId}-${Date.now()}.${extension}`;
    const diskPath = path.join(uploadsDir, filename);
    const publicPath = `/uploads/profile-pictures/${filename}`;

    const bytes = await file.arrayBuffer();
    await writeFile(diskPath, Buffer.from(bytes));

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
