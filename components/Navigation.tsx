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

            {/* Mobile Navigation - Bottom Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 z-50">
                <div className="flex items-center justify-around px-2 py-3 pb-safe">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${active
                                    ? "text-blue-500"
                                    : "text-gray-400 hover:text-white"
                                    }`}
                            >
                                <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                                <span className={`text-xs ${active ? "font-semibold" : "font-normal"}`}>
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
};

export default Navigation;
