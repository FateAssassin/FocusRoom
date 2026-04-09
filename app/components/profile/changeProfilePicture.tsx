'use client';

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ChangeProfilePictureProps = {
    currentImage: string | null;
    userName: string;
};

export default function ChangeProfilePicture({ currentImage, userName }: ChangeProfilePictureProps) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [imageSrc, setImageSrc] = useState(currentImage);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isPending, startTransition] = useTransition();
    const isBusy = isUploading || isPending;

    async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        setError(null);
        setIsUploading(true);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/profile/updatepicture", {
                method: "POST",
                body: formData,
            });

            const data = await response.json().catch(() => null) as { error?: string; profilePictureLink?: string } | null;

            if (!response.ok || !data?.profilePictureLink) {
                setError(data?.error ?? "Could not update your profile picture.");
                return;
            }

            setImageSrc(data.profilePictureLink);
            startTransition(() => {
                router.refresh();
            });
        } catch {
            setError("Could not update your profile picture.");
        } finally {
            event.target.value = "";
            setIsUploading(false);
        }
    }

    return (
        <div className="mb">
            <div className="flex items-center justify-between">
                <div className="ring-4 ring-white rounded-full mt-4">
                    {imageSrc ? (
                        <img
                            src={imageSrc}
                            alt={`${userName}'s profile picture`}
                            className="w-20 h-20 rounded-full object-cover"
                        />
                    ) : (
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                            style={{ background: "linear-gradient(135deg, rgb(43, 127, 255), rgb(100, 160, 255))" }}
                        >
                            {userName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                <div className="relative">
                    <button
                        type="button"
                        className="flex items-center gap-2 button-secondary disabled:opacity-70"
                        onClick={() => inputRef.current?.click()}
                        disabled={isBusy}
                    >
                        <i className={`bi ${isBusy ? "bi-arrow-repeat animate-spin" : "bi-camera"}`}></i>
                        {isBusy ? "Uploading..." : "Change Picture"}
                    </button>
                    <p className="text-xs mt-2 text-gray-400">JPG, PNG, WEBP, or GIF up to 5 MB.</p>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isBusy}
                    />
                </div>
            </div>

            {error ? <p className="text-sm text-red-500 mt-2">{error}</p> : null}
        </div>
    );
}
