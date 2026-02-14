import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
    title: "NovelVerse - AI-Powered Anime Novels",
    description: "Transform anime episodes into immersive light novels with AI. Your universe of anime stories.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className="md:pt-16">
                <Navigation />
                {children}
            </body>
        </html>
    );
}
