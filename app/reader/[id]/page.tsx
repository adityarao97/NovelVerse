"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { NovelStorage, type GeneratedNovel } from '@/lib/novel-storage';
import { ArrowLeft, BookOpen, Moon, Sun, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import NovelChatbot from '@/components/NovelChatbot';

export default function ReaderPage() {
    const params = useParams();
    const router = useRouter();
    const novelId = params.id as string;

    const [novel, setNovel] = useState<GeneratedNovel | null>(null);
    const [fontSize, setFontSize] = useState(18);
    const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('dark');
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        // Load novel
        const loadedNovel = NovelStorage.getById(novelId);
        if (loadedNovel) {
            setNovel(loadedNovel);
        } else {
            router.push('/novels');
        }
    }, [novelId, router]);

    useEffect(() => {
        // Track scroll progress
        const handleScroll = () => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.scrollY;
            const progress = Math.min(
                Math.round((scrollTop / (documentHeight - windowHeight)) * 100),
                100
            );
            setScrollProgress(progress);

            // Save progress
            if (novel) {
                NovelStorage.updateProgress(novelId, progress);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [novelId, novel]);

    if (!novel) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    const themeClasses = {
        dark: 'bg-[#0a0a0a] text-gray-100',
        light: 'bg-white text-gray-900',
        sepia: 'bg-[#f4ecd8] text-[#5c4a3a]',
    };

    return (
        <div className={`min-h-screen ${themeClasses[theme]} transition-colors`}>
            {/* Progress Bar */}
            <div className="fixed top-0 left-0 right-0 h-1 bg-gray-800 z-50">
                <div
                    className="h-full bg-purple-600 transition-all"
                    style={{ width: `${scrollProgress}%` }}
                />
            </div>

            {/* Header Controls */}
            <div className={`sticky top-1 z-40 border-b ${theme === 'dark' ? 'bg-gray-900/95 border-gray-800' : theme === 'light' ? 'bg-white/95 border-gray-200' : 'bg-[#e8dcc4]/95 border-[#d4c4a8]'} backdrop-blur-sm`}>
                <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
                    {/* Back Button */}
                    <Link
                        href="/novels"
                        className="flex items-center gap-2 hover:text-purple-500 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden sm:inline">Library</span>
                    </Link>

                    {/* Controls */}
                    <div className="flex items-center gap-4">
                        {/* Font Size */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                                className="p-2 hover:bg-purple-600/20 rounded-lg transition-colors"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-sm w-8 text-center">{fontSize}</span>
                            <button
                                onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                                className="p-2 hover:bg-purple-600/20 rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Theme */}
                        <div className="flex items-center gap-1 border rounded-lg p-1" style={{
                            borderColor: theme === 'dark' ? '#374151' : theme === 'light' ? '#e5e7eb' : '#d4c4a8'
                        }}>
                            <button
                                onClick={() => setTheme('light')}
                                className={`p-2 rounded transition-colors ${theme === 'light' ? 'bg-purple-600 text-white' : 'hover:bg-gray-700/20'}`}
                            >
                                <Sun className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setTheme('dark')}
                                className={`p-2 rounded transition-colors ${theme === 'dark' ? 'bg-purple-600 text-white' : 'hover:bg-gray-700/20'}`}
                            >
                                <Moon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setTheme('sepia')}
                                className={`p-2 rounded transition-colors ${theme === 'sepia' ? 'bg-purple-600 text-white' : 'hover:bg-gray-700/20'}`}
                            >
                                <BookOpen className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <article className="max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <header className="mb-12">
                    <div className="text-purple-500 text-sm mb-2">{novel.animeTitle}</div>
                    <h1 className="text-4xl font-bold mb-4">{novel.title}</h1>
                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : theme === 'light' ? 'text-gray-600' : 'text-[#8c7a6a]'}`}>
                        Episode {novel.episodeIds.join(', ')} • {novel.wordCount.toLocaleString()} words • {Math.ceil(novel.wordCount / 200)} min read
                    </div>
                </header>

                {/* Novel Content */}
                <div
                    className="prose prose-lg max-w-none"
                    style={{
                        fontSize: `${fontSize}px`,
                        lineHeight: '1.8',
                    }}
                >
                    {novel.content.split('\n').map((paragraph, idx) => {
                        // Handle markdown-style headings
                        if (paragraph.startsWith('# ')) {
                            return (
                                <h1 key={idx} className="text-3xl font-bold mt-8 mb-4">
                                    {paragraph.replace('# ', '')}
                                </h1>
                            );
                        }
                        if (paragraph.startsWith('## ')) {
                            return (
                                <h2 key={idx} className="text-2xl font-bold mt-6 mb-3">
                                    {paragraph.replace('## ', '')}
                                </h2>
                            );
                        }
                        if (paragraph.trim() === '---') {
                            return (
                                <hr key={idx} className={`my-8 border-t-2 ${theme === 'dark' ? 'border-gray-700' : theme === 'light' ? 'border-gray-300' : 'border-[#d4c4a8]'}`} />
                            );
                        }
                        if (paragraph.trim() === '') {
                            return <br key={idx} />;
                        }
                        return (
                            <p key={idx} className="mb-4">
                                {paragraph}
                            </p>
                        );
                    })}
                </div>

                {/* Footer */}
                <footer className="mt-16 pt-8 border-t" style={{
                    borderColor: theme === 'dark' ? '#374151' : theme === 'light' ? '#e5e7eb' : '#d4c4a8'
                }}>
                    <div className="text-center">
                        <div className={`text-sm ${theme === 'dark' ? 'text-gray-500' : theme === 'light' ? 'text-gray-500' : 'text-[#8c7a6a]'} mb-4`}>
                            End of Chapter
                        </div>
                        <Link
                            href="/novels"
                            className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-all"
                        >
                            Back to Library
                        </Link>
                    </div>
                </footer>
            </article>

            {/* Interactive Chatbot */}
            <NovelChatbot
                animeTitle={novel.animeTitle}
                episodeTitle={novel.episodeTitle}
                content={novel.content}
            />
        </div>
    );
}
