import Link from "next/link";

export default function BlogNotFound() {
    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-32 pb-16 text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Blog post not found</h1>
                <p className="text-gray-500 mt-3">It may have been deleted or never existed.</p>
                <Link href="/blog" className="button-main inline-block mt-6">
                    Back to blog
                </Link>
            </div>
        </div>
    );
}
