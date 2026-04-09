export default function Alert({ message, type }: { message: string, type: "error" | "success" }) {  
    if (!message) return null;
    let className = "";
    if (type === "error") {
       className = "border-2 border-red-500 bg-red-100/80 text-red-700";
    } else if (type === "success") {
        className = "border-2 border-green-500 bg-green-100/80 text-green-700";
    }

    return (
        <div className="justify-center flex">
            <div className={`fixed top-[10%] animate-fadeIn text-center flex items-center px-8 py-3 rounded-md shadow-lg cursor-default ${className}`} role="alert">
                {message}
            </div>
        </div>
    );
}