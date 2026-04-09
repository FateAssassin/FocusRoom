"use client"

import Alert from "../alert";
import { useState } from "react";

export default function EditDescription({ description, userId }: { description: string; userId: string }) {
    const [newDescription, setNewDescription] = useState(description);
    const [isSaving, setIsSaving] = useState(false); 
    const [errorMessage, setErrorMessage] = useState<string | null>("");
    const [alertMessage, setAlertMessage] = useState<string | null>("");

    const handleSave = async () => {
        setIsSaving(true);
        setErrorMessage("");
        setAlertMessage("");
        if (newDescription === description) {
            setIsSaving(false);
            return;
        }
        if (newDescription.length > 500) {
            setErrorMessage("Description cannot exceed 500 characters.");
            setIsSaving(false);
            return;
        }
        try {
            const response = await fetch("/api/profile/updateDescription", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId: Number(userId), description: newDescription }),
            });
            const data = await response.json().catch(() => null) as { error?: string; success?: boolean } | null;
            console.log(data)
            if (!response.ok || !data?.success) {
                setErrorMessage(data?.error ?? "Failed to update description. Please try again.");
                return;
            }
            setAlertMessage("Description updated successfully!");
        } catch (error) {
            console.error("Error updating description:", error);
            setErrorMessage("An error occurred while updating your description. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (   
        <>
            {errorMessage && <Alert type="error" message={errorMessage} />}
            {alertMessage && <Alert type="success" message={alertMessage}/>}
            <div>
                <div className="rounded-xl mb-">
                    <textarea
                        className="w-full p-2 rounded-md border border-none focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ backgroundColor: "rgb(220, 220, 220)" }}
                        rows={2}
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Enter your description here..."
                    />
                </div>
                <button
                    className="button-main"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? "Saving..." : "Save Description"}
                </button>
            </div>    
        </>
);
}