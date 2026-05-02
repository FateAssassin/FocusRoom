import type { Metadata } from "next";
import { Suspense } from "react";
import SignInForm from "./signin-form";

const signInDescription =
  "Sign in to FocusRoom to join or host synchronized Pomodoro rooms with your friends.";

export const metadata: Metadata = {
  title: "Sign in",
  description: signInDescription,
  alternates: { canonical: "/signin" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: "Sign in · FocusRoom",
    description: signInDescription,
    url: "/signin",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign in · FocusRoom",
    description: signInDescription,
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
