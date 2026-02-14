"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { NovelStorage, type GeneratedNovel } from '@/lib/novel-storage';
import { ArrowLeft, BookOpen, Moon, Sun, Minus, Plus, Download, Smartphone } from 'lucide-react';
import Link from 'next/link';
import NovelChatbot from '@/components/NovelChatbot';
import { generateEpub } from '@/lib/epub-generator';

export default function ReaderPage() {
    const params = useParams();
    const router = useRouter();
    const novelId = params.id as string;

    const [novel, setNovel] = useState<GeneratedNovel | null>(null);
    const [fontSize, setFontSize] = useState(18);
    const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('dark');
    const [scrollProgress, setScrollProgress] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const loadedNovel = NovelStorage.getById(novelId);
        if (loadedNovel) setNovel(loadedNovel);
        else router.push('/novels');
    }, [novelId, router]);

    useEffect(() => {
        // Simple mobile detection
        const checkMobile = () => {
            const userAgent = typeof window.navigator === "undefined" ? "" : navigator.userAgent;
            const mobile = Boolean(userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i));
            setIsMobile(mobile);
        };
        checkMobile();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const h = document.documentElement;
            const b = document.body;
            const st = 'scrollTop';
            const sh = 'scrollHeight';
            const progress = Math.min(Math.round(((h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight)) * 100), 100);
            setScrollProgress(progress);
            if (novel) NovelStorage.updateProgress(novelId, progress);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [novelId, novel]);

    const handleExport = async () => {
        if (!novel) return;
        setIsExporting(true);
        try {
            await generateEpub(novel);
        } catch (error) {
            console.error("Failed to export EPUB", error);
            alert("Failed to create eBook file.");
        } finally {
            setIsExporting(false);
        }
    };

    if (!novel) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white text-xl">Loading...</div>;

    const themeClasses = {
        dark: 'bg-[#0a0a0a] text-gray-100',
        light: 'bg-white text-gray-900',
        sepia: 'bg-[#f4ecd8] text-[#5c4a3a]',
    };

    return (
        <div className={`min-h-screen ${themeClasses[theme]} transition-colors`}>
            {/* Progress Bar */}
            <div className="fixed top-0 left-0 right-0 h-1 bg-gray-800 z-50">
                <div className="h-full bg-purple-600 transition-all duration-300 ease-out" style={{ width: `${scrollProgress}%` }} />
            </div>

            {/* Header */}
            <div className={`fixed top-1 left-0 right-0 z-40 border-b ${theme === 'dark' ? 'bg-gray-900/95 border-gray-800' : theme === 'light' ? 'bg-white/95 border-gray-200' : 'bg-[#e8dcc4]/95 border-[#d4c4a8]'} backdrop-blur-sm`}>
                <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
                    <Link href="/novels" className="flex items-center gap-2 hover:text-purple-500 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden sm:inline">Library</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        {/* Play Books / Export Button */}
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium
                                ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}
                            `}
                            title="Open in Google Play Books / Apple Books"
                        >
                            {isMobile ? <Smartphone className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                            <span className="hidden sm:inline">{isExporting ? 'Creating...' : 'Open in App'}</span>
                            <span className="sm:hidden">{isExporting ? '...' : 'App'}</span>
                        </button>

                        <div className="flex items-center gap-2">
                            <button onClick={() => setFontSize(Math.max(12, fontSize - 2))} className="p-2 hover:bg-purple-600/20 rounded-lg"><Minus className="w-4 h-4" /></button>
                            <span className="text-sm w-8 text-center">{fontSize}</span>
                            <button onClick={() => setFontSize(Math.min(32, fontSize + 2))} className="p-2 hover:bg-purple-600/20 rounded-lg"><Plus className="w-4 h-4" /></button>
                        </div>
                        <div className="flex items-center gap-1 border rounded-lg p-1" style={{ borderColor: themeClasses[theme].includes('border') ? '' : '#374151' }}>
                            <button onClick={() => setTheme('light')} className={`p-2 rounded ${theme === 'light' ? 'bg-purple-600 text-white' : ''}`}><Sun className="w-4 h-4" /></button>
                            <button onClick={() => setTheme('dark')} className={`p-2 rounded ${theme === 'dark' ? 'bg-purple-600 text-white' : ''}`}><Moon className="w-4 h-4" /></button>
                            <button onClick={() => setTheme('sepia')} className={`p-2 rounded ${theme === 'sepia' ? 'bg-purple-600 text-white' : ''}`}><BookOpen className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Standard Vertical Content */}
            <div className="pt-20 pb-20">
                <article className="max-w-4xl mx-auto px-6">
                    <header className="mb-12">
                        <div className="text-purple-500 text-sm mb-2">{novel.animeTitle}</div>
                        <h1 className="text-4xl font-bold mb-4">{novel.title}</h1>
                        <div className="text-sm opacity-70">
                            Episode {novel.episodeIds.join(', ')} • {novel.wordCount.toLocaleString()} words
                        </div>
                    </header>
                    <div className="prose prose-lg max-w-none" style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}>
                        {novel.content.split('\n').map((p, i) => {
                            if (p.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold mt-8 mb-4">{p.slice(2)}</h1>;
                            if (p.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mt-6 mb-3">{p.slice(3)}</h2>;
                            if (p.trim() === '---') return <hr key={i} className="my-8 border-t-2 opacity-30" />;
                            if (!p.trim()) return <br key={i} />;
                            return <p key={i} className="mb-4">{p}</p>;
                        })}
                    </div>
                    <footer className="mt-16 pt-8 border-t opacity-70" style={{ borderColor: theme === 'dark' ? '#374151' : theme === 'light' ? '#e5e7eb' : '#d4c4a8' }}>
                        <div className="text-center">
                            <Link href="/novels" className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg">Back to Library</Link>
                        </div>
                    </footer>
                </article>
                <NovelChatbot animeTitle={novel.animeTitle} episodeTitle={novel.episodeTitle} content={novel.content} />
            </div>
        </div>
    );
}
