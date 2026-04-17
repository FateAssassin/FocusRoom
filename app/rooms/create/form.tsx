"use client"

import Alert from "@/app/components/alert";
import { useState } from "react";

export default function CreateRoomForm({hostId}: {hostId?: number}) {
    const [roomName, setRoomName] = useState("");
    const [description, setDescription] = useState("");
    const [publicity, setPublicity] = useState("public");
    const [maxMembers, setMaxMembers] = useState<number | "">("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const res = await fetch("/api/createroom", {
          method: "POST",
          body: JSON.stringify({ roomName, description, publicity, maxMembers, hostId }),
          headers: {
          "Content-Type": "application/json",
          },
        });
        console.log(res);
        if (res.ok) {          
            const data = await res.json();
            console.log(data);
            // window.location.href = `/rooms/${data.id}`;
        } else {
          alert("Failed to create room");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mt-4">
                    Room Name
                </label>
                <input
                    type="text"
                    id="roomName"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="px-2 py-1 mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                />
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                </label>
                <textarea
                    id="description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="px-2 py-1 mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Publicity
                </label>
                <div className="space-y-2">
                    <div className="flex items-center">
                        <input
                            type="radio"
                            id="public"
                            name="publicity"
                            value="public"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            onChange={(e) => setPublicity(e.target.value)}
                            required
                        />
                        <label htmlFor="public" className="ml-2 text-sm text-gray-700">
                            Public
                        </label>
                    </div>
                    <div className="flex items-center">
                        <input
                            type="radio"
                            id="private"
                            name="publicity"
                            value="private"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            onChange={(e) => setPublicity(e.target.value)}
                        />
                        <label htmlFor="private" className="ml-2 text-sm text-gray-700">
                            Private (invite code)
                        </label>
                    </div>
                </div>
                <div>
                    <input type="number" value={maxMembers} placeholder="Max members" onChange={(e)=>setMaxMembers(parseInt(e.target.value) || 0)} max={100} className="mt-3 px-2 py-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
            </div>
            <button
                type="submit"
                className="inline-flex items-center button-main"
            >
                <i className="bi bi-plus"></i> 
                &nbsp; Create Room
            </button>
        </form>
    );
}