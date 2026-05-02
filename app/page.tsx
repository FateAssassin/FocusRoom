import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "./lib/auth/auth-options";

const homeDescription =
  "Join collaborative focus sessions with friends, colleagues, or study partners. Stay accountable with shared Pomodoro timers and real-time presence tracking.";

export const metadata: Metadata = {
  title: { absolute: "FocusRoom — Focus Together, Achieve More" },
  description: homeDescription,
  alternates: { canonical: "/" },
  openGraph: {
    title: "FocusRoom — Focus Together, Achieve More",
    description: homeDescription,
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FocusRoom — Focus Together, Achieve More",
    description: homeDescription,
  },
};

export default async function Home() {
  const session = await getServerSession(authOptions);
  const cards = [
    {
      icon: "clock",
      title: "Synchronized Timer",
      description: "Share a Pomodoro timer with your group. 25 minutes focus, 5 minutes break. Stay in sync and boost your productivity together.",
    },
    {
      icon: "people",
      title: "Real-time Presence",
      description: "See who's studying, on break, or idle. Stay connected with your focus group.",
    },
    {
      icon: "lightning",
      title: "Instant Sync",
      description: "All participants see timer updates instantly. No delays, no confusion.",
    },
    {
      icon: "brush",
      title: "Slick and Simple",
      description: "Intuitive interface designed for seamless collaboration. Focus on what matters most."
    }
  ]

  return (
    <div className="bg-zinc-50 font-sans">
      <div className="flex flex-col items-center justify-center min-h-[50vh] mt-10 md:mt-20 px-4">
        <h1 className="text-3xl md:text-5xl font-bold mb-6 text-center">Focus Together, Achieve More</h1>
        <p className="text-gray-500 text-lg md:text-xl w-full md:w-1/2 lg:w-1/3 text-center mb-6">
          Join collaborative focus sessions with friends, colleagues, or study partners. Stay accountable with shared Pomodoro timers and real-time presence tracking.
        </p>
        {session ? (
          <Link href="/rooms" className="button-main mt-6">
            Go to Rooms
          </Link>
        ) : (
          <Link href="/signin" className="button-main mt-6">
            Get Started
          </Link>
        )}
      </div>

      <div className="flex flex-col bg-gray-200/50 items-center justify-center px-4">
        <p className="text-2xl md:text-3xl font-bold mt-10 md:mt-20 text-center">Why FocusRoom?</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10 mb-20 w-full max-w-7xl">
          {cards.map((card, index) => (
            <div key={index} className="bg-white/70 hover:shadow-2xl transition duration-150 rounded-lg shadow-md p-6">
              <i className={`bi bi-${card.icon} text-4xl text-blue-500`}></i>
              <h2 className="text-xl md:text-2xl font-semibold mb-4 mt-4">{card.title}</h2>
              <p className="text-sm md:text-base text-gray-600">{card.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col justify-center items-center min-h-[30vh] pb-10 mt-20 px-4">
        <div className="text-center">
          <p className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">
            Ready to focus together?
          </p>
          <p className="text-gray-500 text-lg md:text-xl mb-6">
            Create or join a room and start your first focus session today.
          </p>
          {session ? (
            <Link href="/rooms" className="button-main mb-3 inline-block">
              Go to Rooms
            </Link>
          ) : (
            <>
            <Link href="/signup" className="button-main mb-3 inline-block">
              Join Now
            </Link>
            <br />
            <Link href="/signin" className="button-secondary inline-block">
              Already have an account? Sign up
            </Link></>
          )}
        </div>
      </div>
    </div>
  );
}
