"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Alert from "../components/alert";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function SignUpForm() {
  const router = useRouter();
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [newLogin, setNewLogin] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      if (!newLogin) {
        router.replace("/rooms");
      }
    }
  }, [router, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewLogin(true);
    error && setError("");
    const errors: string[] = [];


    if (name.trim() === "") {
      errors.push("error-username");
    } else if (name.length < 3) {
      errors.push("error-username-length");
    } else{

    }
    if (email.trim() === "") {
      errors.push("error-email");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.push("error-email-format");
    }
    if (password.trim() === "") {
      errors.push("error-password");
    }
    if (password.length < 8) {
      if (!errors.includes("error-password")) {
        errors.push("error-length-password");
      }
    }
    if (!errors.includes("error-password") && password !== confirmPassword || !errors.includes("error-length-password") && password !== confirmPassword) {
      errors.push("error-confirm-password");
    }

    if (errors.length > 0) {
      setError(errors.join(","));
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
      headers: {
      "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    if (data.error) {
      setError(data.error);
    }
    if (res.ok) {
      await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      setSuccess(true);
      setError("");
        setTimeout(() => {
          window.location.href = "/profile";
        }, 1000);
    }
  };

  return (
  <div className="min-h-screen flex items-center justify-center p-4">
    {success &&
      <Alert message='Account created successfully! Redirecting...' type="success" />
    }
    {error && (
      error === "User with that email or username already exists, please choose a different one or sign in." ||
      error.startsWith("Too many")
    ) && (
      <Alert message={error} type="error" />
    )}
    <div className="rounded-lg shadow-xl p-8 w-full max-w-md card">
    <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
    <p className="text-gray-500 mb-6">Join us today and start focusing.</p>

    <form onSubmit={handleSubmit} className="space-y-4">
      <input
      placeholder="Username"
      value={name}
      onChange={(e) => setName(e.target.value)}
      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${error.includes("error-username") ? "border-red-500 placeholder:text-red-500" : ""}`}
      />
      <p className={`text-red-500 text-sm leading-0 ml-1 ${error.includes("error-username") ? "block" : "hidden"}`}>{error.includes("error-username") ? "Please enter a username." : ""}</p>
      <input
      type="email"
      placeholder="Email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${error.includes("error-email") ? "border-red-500 placeholder:text-red-500" : ""}`}
      />
      <p className={`text-red-500 text-sm leading-0 ml-1 ${error.includes("error-email") && !error.includes("error-email-format") ? "block" : "hidden"}`}>{error.includes("error-email") && !error.includes("error-email-format") ? "Please enter an email." : ""}</p>
      <p className={`text-red-500 text-sm leading-0 ml-1 ${error.includes("error-email-format") ? "block" : "hidden"}`}>{error.includes("error-email-format") ? "Please enter a valid email address." : ""}</p>
      <input
      type="password"
      placeholder="Password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${error.includes("error-password") || error.includes("error-length-password") ? "border-red-500 placeholder:text-red-500" : ""}`}
      />
      <input
      type="password"
      placeholder="Confirm Password"
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${error.includes("error-confirm-password") || error.includes("error-password") || error.includes("error-length-password") ? "border-red-500 placeholder:text-red-500" : ""}`}
      />
      <p className={`text-red-500 text-sm leading-0 ml-1 ${error.includes("error-password") ? "block" : "hidden"}`}>{error.includes("error-password") ? "Please enter a password." : ""}</p>
      <p className={`text-red-500 text-sm leading-0 ml-1 ${error.includes("error-length-password") ? "block" : "hidden"}`}>{error.includes("error-length-password") ? "Password must be at least 8 characters long." : ""}</p>
      <p className={`text-red-500 text-sm leading-0 ml-1 ${error.includes("error-confirm-password") ? "block" : "hidden"}`}>{error.includes("error-confirm-password") ? "Passwords do not match." : ""}</p>

      <button type="submit" className="w-full button-main transition">
      Sign Up
      </button>
      <p className="text-center text-gray-500 text-sm">Already have an account? <Link href="/signin" className="text-indigo-500 hover:underline">Sign In</Link></p>
    </form>
    </div>
  </div>
  );
}
