import type { Metadata } from "next";
import SignUpForm from "./signup-form";

const signUpDescription =
  "Create a free FocusRoom account and start running synchronized Pomodoro sessions with your friends.";

export const metadata: Metadata = {
  title: "Sign up",
  description: signUpDescription,
  alternates: { canonical: "/signup" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: "Sign up · FocusRoom",
    description: signUpDescription,
    url: "/signup",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign up · FocusRoom",
    description: signUpDescription,
  },
};

export default function Page() {
  return <SignUpForm />;
}
