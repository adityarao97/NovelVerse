"use client";

import { Home, TrendingUp, Search, User, Book, Heart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Navigation = () => {
    const pathname = usePathname();

    const navItems = [
        { name: "Home", href: "/", icon: Home },
        { name: "Novels", href: "/novels", icon: Book },
        { name: "Favorites", href: "/favorites", icon: Heart },
    ];

    const isActive = (href: string) => pathname === href;

    return (
        <>
            {/* Desktop Navigation - Top Bar */}
            <nav className="hidden md:flex fixed top-0 left-0 right-0 bg-gray-900 border-b border-gray-800 z-50">
                <div className="max-w-7xl mx-auto w-full px-6 py-4 flex items-center justify-between">
                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                        NovelVerse
                    </div>

                    <div className="flex items-center gap-8">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${active
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                                        }`}
                                >
                                    <Icon size={20} />
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>

            {/* Mobile Navigation - Bottom Bar (Removed for immersive reading) */}

        </>
    );
};

export default Navigation;
