import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vocal Training - Develop Your Singing Voice",
  description: "Train your singing voice by detecting your vocal range and practicing pitch matching",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{
          backgroundImage: "url('/background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          minHeight: "100vh",
        }}
      >
        <div className="min-h-screen bg-black/20">
          <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-md">
            <div className="container mx-auto px-4 py-4">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Vocal Training
              </h1>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
