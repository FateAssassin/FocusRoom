import { getServerSession } from "next-auth/next";
import { authOptions } from "../lib/auth/auth-options";
import ChangeProfilePicture from "../components/profile/changeProfilePicture";
import EditDescription from "../components/profile/editDescription";
import { getUserById } from "../lib/db/users";
import { redirect } from "next/navigation";
import Link from "next/dist/client/link";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);
    console.log(session?.user)
    if (!session) {
        redirect("/signin");
        return null;
    }
    const user = getUserById(Number(session.user.id));
    if (!user) {
        redirect("/signin");
        return null;
    }

    return(
        <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
            <div className="w-full max-w-md">
                {/* Banner */}
                <div className="h-28 rounded-t-2xl relative overflow-hidden"
                    style={{ background: "linear-gradient(135deg, rgb(43, 127, 255) 0%, rgb(100, 160, 255) 100%)" }}>
                    <div className="absolute inset-0 opacity-20"
                        style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }}>
                    </div>
                </div>

                {/* Card */}
                <div className="bg-white rounded-b-2xl border border-gray-200 border-t-0 px-6 pb-6 shadow-sm">
                    <ChangeProfilePicture currentImage={user.profile_picture_link} userName={user.name} />

                    {/* Name & join date */}
                    <div className="mb-4">
                        <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
                        <p className="text-gray-400 text-sm mt-0.5">
                            Member since {new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </p>
                    </div>

                    <EditDescription description={user?.description || ""} userId={user.id.toString()} />

                    {/* Rooms section */}
                    <div>
                        <h2 className="text-xs mt-2 font-semibold uppercase tracking-widest mb-2" style={{ color: "rgb(43, 127, 255)" }}>Rooms</h2>
                        <div className="rounded-xl p-4 text-gray-400 text-sm italic mb-4" style={{ backgroundColor: "rgb(220, 220, 220)" }}>
                            No rooms yet.
                        </div>
                    </div>
                    <Link href="/rooms/create" className="button-main">
                        <i className="bi bi-plus-lg mr-2"></i>
                        Create Room
                    </Link>
                </div>
            </div>
        </div>
    )
}
