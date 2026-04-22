"use client";

import { useState, useTransition } from "react";
import { addFriendAction, removeFriendAction } from "@/app/lib/actions";

export default function FriendButton({
    targetUserId,
    initiallyFriend,
}: {
    targetUserId: number;
    initiallyFriend: boolean;
}) {
    const [isFriend, setIsFriend] = useState(initiallyFriend);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function onClick() {
        setError(null);
        startTransition(async () => {
            const result = isFriend
                ? await removeFriendAction(targetUserId)
                : await addFriendAction(targetUserId);
            if (result.error) {
                setError(result.error);
                return;
            }
            setIsFriend(!isFriend);
        });
    }

    return (
        <div className="flex flex-col items-end gap-1 mt-2">
            <button
                onClick={onClick}
                disabled={pending}
                className={`${isFriend ? "button-secondary" : "button-main"} disabled:opacity-60 disabled:cursor-not-allowed`}
            >
                <i className={`bi ${isFriend ? "bi-person-dash" : "bi-person-plus"} mr-2`}></i>
                {pending
                    ? (isFriend ? "Removing..." : "Adding...")
                    : (isFriend ? "Remove Friend" : "Add as Friend")}
            </button>
            {error ? <p className="text-xs text-red-500">{error}</p> : null}
        </div>
    );
}
