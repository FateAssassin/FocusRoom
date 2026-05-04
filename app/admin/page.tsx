import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "../lib/auth/auth-options";
import { isAdmin, listAdminIds } from "../lib/db/admins";
import db from "../lib/db/db";
import AdminDashboard, { type AdminRoomRow, type AdminUserRow } from "./dashboard";

export const metadata: Metadata = {
    title: "Admin",
    robots: { index: false, follow: false },
};

export default async function AdminPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) notFound();

    const me = Number(session.user.id);
    if (!isAdmin(me)) notFound();

    const users = db
        .prepare(
            `SELECT id, name, email, description, created_at, profile_picture_link
             FROM users
             ORDER BY id`
        )
        .all() as AdminUserRow[];

    const rooms = db
        .prepare(
            `SELECT r.id, r.name, r.description, r.host_id, u.name AS host_name,
                    r.publicity, r.invite_code, r.max_members, r.created_at
             FROM rooms r
             JOIN users u ON u.id = r.host_id
             ORDER BY r.id`
        )
        .all() as AdminRoomRow[];

    const adminIds = listAdminIds();

    return (
        <AdminDashboard
            currentUserId={me}
            users={users}
            rooms={rooms}
            adminIds={adminIds}
        />
    );
}
