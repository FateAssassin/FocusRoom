import Link from "next/link";
import Image from "next/image";
import logo from "../logo.png";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="px-4 sm:px-8 md:px-16 lg:px-32 py-8 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col items-center sm:items-start gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Image src={logo} alt="FocusRoom logo" className="h-8 w-auto" />
            <span className="font-bold text-xl">
              <span className="text-blue-500">Focus</span>
              <span>Room</span>
            </span>
          </Link>
          <p className="text-sm text-gray-500">Study with your friends in a virtual room.</p>
        </div>

        <nav className="flex flex-col items-center sm:items-start gap-2 text-sm">
          <span className="font-semibold text-gray-700">Explore</span>
          <Link href="/rooms" className="text-gray-600 hover:text-blue-500">Rooms</Link>
          <Link href="/blog" className="text-gray-600 hover:text-blue-500">Blog</Link>
          <Link href="/friends" className="text-gray-600 hover:text-blue-500">Friends</Link>
        </nav>

        <nav className="flex flex-col items-center sm:items-start gap-2 text-sm">
          <span className="font-semibold text-gray-700">Account</span>
          <Link href="/signin" className="text-gray-600 hover:text-blue-500">Sign In</Link>
          <Link href="/signup" className="text-gray-600 hover:text-blue-500">Sign Up</Link>
          <Link href="/profile" className="text-gray-600 hover:text-blue-500">Profile</Link>
        </nav>
      </div>

      <div className="border-t border-gray-100 px-4 sm:px-8 md:px-16 lg:px-32 py-4 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} FocusRoom
      </div>
    </footer>
  );
}