"use client";

import { useState, useTransition } from "react";
import { deleteMyRoomAction, updateMyRoomAction } from "@/app/lib/actions";

type Room = {
    id: number;
    name: string;
    description: string | null;
    publicity: string;
    max_members: number | null;
};

export function ExistingRoomBar({ room }: { room: Room }) {
    const [editing, setEditing] = useState(false);
    const [deleting, startDelete] = useTransition();
    const [updating, startUpdate] = useTransition();
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [updateError, setUpdateError] = useState<string | null>(null);

    function onDelete() {
        if (!confirm("Delete this room? This cannot be undone.")) return;
        setDeleteError(null);
        startDelete(async () => {
            const result = await deleteMyRoomAction();
            if (result.error) setDeleteError(result.error);
        });
    }

    function onUpdate(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        setUpdateError(null);
        startUpdate(async () => {
            const result = await updateMyRoomAction(undefined, formData);
            if (result.error) {
                setUpdateError(result.error);
                return;
            }
            setEditing(false);
        });
    }

    return (
        <div className="mt-3">
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setEditing((e) => !e)}
                    className="button-main bg-green-500 hover:bg-green-600"
                >
                    <i className={`bi ${editing ? "bi-x-lg" : "bi-pencil"} mr-2`}></i>
                    {editing ? "Cancel" : "Edit Room"}
                </button>
                <button
                    type="button"
                    onClick={onDelete}
                    disabled={deleting}
                    className="button-main bg-red-400 hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <i className="bi bi-trash mr-2"></i>
                    {deleting ? "Deleting..." : "Delete Room"}
                </button>
            </div>

            {deleteError ? (
                <p className="text-sm text-red-500 mt-2">{deleteError}</p>
            ) : null}

            {editing ? (
                <form onSubmit={onUpdate} className="mt-3 space-y-2">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Name</label>
                        <input
                            name="name"
                            defaultValue={room.name}
                            required
                            maxLength={80}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Description</label>
                        <textarea
                            name="description"
                            defaultValue={room.description ?? ""}
                            rows={2}
                            maxLength={300}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Publicity</label>
                            <select
                                name="publicity"
                                defaultValue={room.publicity}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="public">Public</option>
                                <option value="private">Private</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Max members</label>
                            <input
                                name="max_members"
                                type="number"
                                min={1}
                                defaultValue={room.max_members ?? ""}
                                placeholder="Unlimited"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={updating}
                        className="button-main w-full inline-flex items-center justify-center text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <i className={`bi ${updating ? "bi-arrow-repeat animate-spin" : "bi-check-lg"} mr-2`}></i>
                        {updating ? "Saving..." : "Save changes"}
                    </button>
                    {updateError ? (
                        <p className="text-sm text-red-500">{updateError}</p>
                    ) : null}
                </form>
            ) : null}
        </div>
    );
}
