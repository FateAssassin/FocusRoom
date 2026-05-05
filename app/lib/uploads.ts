import "server-only";
import path from "node:path";

export function getProfilePicturesDir(): string {
    if (process.env.UPLOADS_DIR) {
        return path.join(process.env.UPLOADS_DIR, "profile-pictures");
    }
    if (process.env.DB_PATH) {
        return path.join(path.dirname(process.env.DB_PATH), "uploads", "profile-pictures");
    }
    return path.join(process.cwd(), "app", "data", "uploads", "profile-pictures");
}

export const PROFILE_PICTURE_URL_PREFIX = "/api/uploads/profile-pictures/";
