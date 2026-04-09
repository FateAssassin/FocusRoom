"use client";

import { useState } from "react";
import Link from "next/link";
import Alert from "../components/alert";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

export default function SignInPage() {

    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/rooms";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
  
    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (error) setError("");

    const errors: string[] = [];

    if (email.trim() === "") {
      errors.push("error-email");
    }
    if (password.trim() === "") {
      errors.push("error-password");
    }
    if (password && password.length < 6) {
      errors.push("error-length-password");
    }

    if (errors.length > 0) {
      setError(errors.join(","));
      return;
    }
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    if (!result || result.error) {
      setError(result?.error || "Invalid credentials");
      setSuccess(false);
      return;
    }

    setSuccess(true);
    setError("");

    setTimeout(() => {
      router.push("/rooms");
      router.refresh();
    }, 1000);
  };

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      {success && <Alert message="Signed in successfully! Redirecting..." type="success" />}
      {error && <Alert message={typeof error === "string" ? error : "Something went wrong"} type="error" />}
      <div className="min-h-screen flex items-center justify-center">
        <div className="rounded-lg shadow-xl p-8 w-full max-w-md card">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h1>
          <p className="text-gray-500 mb-6">Welcome back! Enter your credentials to continue focusing.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                error.includes("error-email") ? "border-red-500 placeholder:text-red-500" : ""
              }`}
            />
            <p className={`text-red-500 text-sm leading-0 ml-1 ${error.includes("error-email") ? "block" : "hidden"}`}>
              {error.includes("error-email") ? "Please enter an email." : ""}
            </p>

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                error.includes("error-password") || error.includes("error-length-password")
                  ? "border-red-500 placeholder:text-red-500"
                  : ""
              }`}
            />
            <p className={`text-red-500 text-sm leading-0 ml-1 ${error.includes("error-password") ? "block" : "hidden"}`}>
              {error.includes("error-password") ? "Please enter a password." : ""}
            </p>
            <p className={`text-red-500 text-sm leading-0 ml-1 ${error.includes("error-length-password") ? "block" : "hidden"}`}>
              {error.includes("error-length-password") ? "Password must be at least 6 characters long." : ""}
            </p>

            <button type="submit" className="w-full button-main transition">
              Sign In
            </button>
            <p className="text-center text-gray-500 text-sm">
              Don’t have an account? <Link href="/signup" className="text-indigo-500 hover:underline">Sign Up</Link>
            </p>
          </form>
        </div>
      </div>
    </Suspense>
  );
}
