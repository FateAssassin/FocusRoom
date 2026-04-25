"use client";

import { useState, useTransition } from "react";
import {
    sendFriendRequestAction,
    cancelFriendRequestAction,
    acceptFriendRequestAction,
    declineFriendRequestAction,
    removeFriendAction,
    type FriendActionResult,
} from "@/app/lib/actions";

type Status = "none" | "friends" | "outgoing" | "incoming";

export default function FriendButton({
    targetUserId,
    initialStatus,
}: {
    targetUserId: number;
    initialStatus: Status;
}) {
    const [status, setStatus] = useState<Status>(initialStatus);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function run(
        action: (id: number) => Promise<FriendActionResult>,
        fallback: Status,
    ) {
        setError(null);
        startTransition(async () => {
            const result = await action(targetUserId);
            if (result.error) {
                setError(result.error);
                return;
            }
            setStatus(result.nextStatus ?? fallback);
        });
    }

    return (
        <div className="flex flex-col items-end gap-1 mt-2">
            {status === "none" && (
                <button
                    onClick={() => run(sendFriendRequestAction, "outgoing")}
                    disabled={pending}
                    className="button-main disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <i className="bi bi-person-plus mr-2"></i>
                    {pending ? "Sending..." : "Add as Friend"}
                </button>
            )}

            {status === "outgoing" && (
                <button
                    onClick={() => run(cancelFriendRequestAction, "none")}
                    disabled={pending}
                    className="button-secondary disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <i className="bi bi-hourglass-split mr-2"></i>
                    {pending ? "Cancelling..." : "Request sent · Cancel"}
                </button>
            )}

            {status === "incoming" && (
                <div className="flex gap-2">
                    <button
                        onClick={() => run(acceptFriendRequestAction, "friends")}
                        disabled={pending}
                        className="button-main disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <i className="bi bi-check-lg mr-2"></i>
                        {pending ? "..." : "Accept"}
                    </button>
                    <button
                        onClick={() => run(declineFriendRequestAction, "none")}
                        disabled={pending}
                        className="button-secondary disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <i className="bi bi-x-lg mr-2"></i>
                        Decline
                    </button>
                </div>
            )}

            {status === "friends" && (
                <button
                    onClick={() => run(removeFriendAction, "none")}
                    disabled={pending}
                    className="button-secondary disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <i className="bi bi-person-dash mr-2"></i>
                    {pending ? "Removing..." : "Remove Friend"}
                </button>
            )}

            {error ? <p className="text-xs text-red-500">{error}</p> : null}
        </div>
    );
}
