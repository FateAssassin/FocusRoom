import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Poppins } from "next/font/google";
import "./globals.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Navbar } from "./components/navbar";
// import { Footer } from "./components/footer";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
const siteDescription =
  "FocusRoom is a collaborative Pomodoro app: create or join a room, share a synchronized timer, and stay accountable with friends in real time.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FocusRoom — Study with your friends in a virtual room",
    template: "%s · FocusRoom",
  },
  description: siteDescription,
  applicationName: "FocusRoom",
  generator: "Next.js",
  keywords: [
    "Pomodoro",
    "focus timer",
    "study with friends",
    "collaborative study",
    "virtual study room",
    "productivity",
    "deep work",
    "co-working",
    "FocusRoom",
  ],
  authors: [{ name: "FocusRoom" }],
  creator: "FocusRoom",
  publisher: "FocusRoom",
  category: "productivity",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "FocusRoom",
    title: "FocusRoom — Study with your friends in a virtual room",
    description: siteDescription,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "FocusRoom — Study with your friends in a virtual room",
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.className} antialiased`}
      >
        <Providers>
          <Navbar />
          {children}
          {/* <Footer /> */}
        </Providers>
      </body>
    </html>
  );
}
