"use client";

import { useEffect, useState, useRef, useLayoutEffect } from 'react';
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
    const [viewMode, setViewMode] = useState<'scroll' | 'paged'>('scroll');
    const [scrollProgress, setScrollProgress] = useState(0);

    // Paged Mode State
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [pageWidth, setPageWidth] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [turnDirection, setTurnDirection] = useState<'next' | 'prev' | null>(null);
    const [touchStart, setTouchStart] = useState<number | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadedNovel = NovelStorage.getById(novelId);
        if (loadedNovel) setNovel(loadedNovel);
        else router.push('/novels');

        const savedViewMode = localStorage.getItem('novel_view_mode') as 'scroll' | 'paged';
        if (savedViewMode) setViewMode(savedViewMode);
    }, [novelId, router]);

    useEffect(() => {
        localStorage.setItem('novel_view_mode', viewMode);
        if (viewMode === 'paged') setCurrentPage(0);
    }, [viewMode]);

    // Pixel-Perfect Width Calculation using ResizeObserver
    useLayoutEffect(() => {
        if (!containerRef.current || viewMode !== 'paged') return;

        const measure = () => {
            if (containerRef.current) {
                // Use clientWidth to exclude scrollbars exactly
                const width = containerRef.current.clientWidth;
                // Ensure calculating even if it's 0 momentarily
                if (width > 0) setPageWidth(width);
            }
        };

        measure();

        const observer = new ResizeObserver(() => {
            // Debounce slightly or just run
            requestAnimationFrame(measure);
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [viewMode]);

    // Calculate Total Pages whenever content or width changes
    useEffect(() => {
        const article = document.getElementById('paged-content-article');
        if (article && pageWidth > 0) {
            const scrollWidth = article.scrollWidth;
            const pages = Math.ceil(scrollWidth / pageWidth);
            setTotalPages(pages || 1);
        }
    }, [pageWidth, novel, fontSize, viewMode]);

    useEffect(() => {
        if (!novel) return;
        const progress = viewMode === 'paged'
            ? Math.round(((currentPage + 1) / totalPages) * 100)
            : scrollProgress; // Handled by scroll listener

        setScrollProgress(progress);
        NovelStorage.updateProgress(novelId, progress);
    }, [currentPage, totalPages, viewMode, novelId, novel, scrollProgress]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (viewMode !== 'paged') return;
            if (e.key === 'ArrowRight' || e.key === ' ') nextPage();
            else if (e.key === 'ArrowLeft') prevPage();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [viewMode, currentPage, totalPages, isAnimating]);

    // Scroll Mode Listener
    useEffect(() => {
        const handleScroll = () => {
            if (viewMode !== 'scroll') return;
            const h = document.documentElement;
            const b = document.body;
            const st = 'scrollTop';
            const sh = 'scrollHeight';
            const progress = Math.min(Math.round(((h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight)) * 100), 100);
            setScrollProgress(progress);
        };
        if (viewMode === 'scroll') window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [viewMode]);

    const triggerPageTurn = (direction: 'next' | 'prev') => {
        if (isAnimating) return;
        setIsAnimating(true);
        setTurnDirection(direction);

        if (direction === 'next') setCurrentPage(p => p + 1);
        else setCurrentPage(p => p - 1);

        setTimeout(() => {
            setIsAnimating(false);
            setTurnDirection(null);
        }, 600);
    };

    const nextPage = () => {
        if (currentPage < totalPages - 1 && !isAnimating) triggerPageTurn('next');
    };

    const prevPage = () => {
        if (currentPage > 0 && !isAnimating) triggerPageTurn('prev');
    };

    const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStart === null) return;
        const diff = touchStart - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) diff > 0 ? nextPage() : prevPage();
        setTouchStart(null);
    };

    if (!novel) return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white text-xl">
            Loading...
        </div>
    );

    const themeClasses = {
        dark: 'bg-[#0a0a0a] text-gray-100',
        light: 'bg-white text-gray-900',
        sepia: 'bg-[#f4ecd8] text-[#5c4a3a]',
    };

    return (
        <div className={`min-h-screen ${themeClasses[theme]} transition-colors overflow-hidden`}>
            {/* 3D Animation Styles */}
            <style jsx global>{`
                .perspective-container {
                    perspective: 1500px; /* High perspective for subtle depth */
                    overflow: hidden;
                }
                .book-spine-pivot {
                    transform-origin: left center; /* Pivot from spine */
                    transform-style: preserve-3d;
                    transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1); /* Ease-out exponential */
                    will-change: transform;
                }
                /* Shadow that mimics the curl depth */
                .curl-shadow {
                    position: absolute;
                    top: 0; bottom: 0;
                    width: 100px;
                    background: linear-gradient(90deg, 
                        rgba(0,0,0,0.4) 0%, 
                        rgba(0,0,0,0.1) 40%, 
                        rgba(0,0,0,0) 100%);
                    opacity: 0;
                    transition: opacity 0.6s, transform 0.6s;
                    pointer-events: none;
                    z-index: 50;
                }
                .animating-next .curl-shadow {
                    opacity: 1;
                    /* Shadow moves across screen */
                    transform: translateX(100vw); 
                }
                .animating-prev .curl-shadow {
                    opacity: 1;
                    transform: translateX(0);
                }
            `}</style>

            <div className="fixed top-0 left-0 right-0 h-1 bg-gray-800 z-50">
                <div className="h-full bg-purple-600 transition-all duration-300 ease-out" style={{ width: `${scrollProgress}%` }} />
            </div>

            {/* Header */}
            <div className={`fixed top-1 left-0 right-0 z-40 border-b ${theme === 'dark' ? 'bg-gray-900/95 border-gray-800' : theme === 'light' ? 'bg-white/95 border-gray-200' : 'bg-[#e8dcc4]/95 border-[#d4c4a8]'} backdrop-blur-sm transition-opacity duration-300 ${viewMode === 'paged' ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
                    <Link href="/novels" className="flex items-center gap-2 hover:text-purple-500 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden sm:inline">Library</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setViewMode(viewMode === 'scroll' ? 'paged' : 'scroll')} className="p-2 hover:bg-purple-600/20 rounded-lg">
                            {viewMode === 'scroll' ? <BookOpen className="w-5 h-5" /> : <div className="w-5 h-5 i-lucide-scroll">📜</div>}
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

            {/* Container */}
            <div
                ref={containerRef}
                id="reader-container"
                className={`
                    ${viewMode === 'paged' ? 'h-[100vh] w-full pt-0 relative perspective-container' : 'pt-20 pb-20'}
                `}
            >
                {viewMode === 'paged' && pageWidth > 0 ? (
                    <div
                        className={`h-full w-full relative ${isAnimating ? (turnDirection === 'next' ? 'animating-next' : 'animating-prev') : ''}`}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className="absolute top-0 left-0 w-[20%] h-full z-20 cursor-pointer" onClick={prevPage} title="Previous" />
                        <div className="absolute top-0 right-0 w-[20%] h-full z-20 cursor-pointer" onClick={nextPage} title="Next" />

                        {/* Animated Curl Shadow */}
                        <div className="curl-shadow" style={{ left: isAnimating ? (turnDirection === 'next' ? `${(currentPage) * pageWidth}px` : `${(currentPage) * pageWidth}px`) : '-100px' }} />

                        <div
                            className="h-full flex book-spine-pivot"
                            style={{
                                width: 'max-content',
                                // The Magic Transform:
                                // 1. Translate to correct page strip
                                // 2. Rotate Y slightly to simulate the book opening angle during turn
                                transform: `
                                    translateX(${-1 * currentPage * pageWidth}px) 
                                    rotateY(${isAnimating ? (turnDirection === 'next' ? '-10deg' : '10deg') : '0deg'})
                                    translateZ(${isAnimating ? '-50px' : '0px'})
                                `
                            }}
                        >
                            <article
                                id="paged-content-article"
                                className="prose prose-lg max-w-none h-full"
                                style={{
                                    fontSize: `${fontSize}px`,
                                    lineHeight: '1.8',
                                    // Exact pixel width from clientWidth = No Scrollbar Clipping
                                    columnWidth: `${pageWidth}px`,
                                    columnGap: '0px',
                                    height: '100%',
                                    width: 'max-content',
                                    paddingTop: '3rem',
                                    paddingBottom: '3rem',
                                    // Padding Inset for content safety
                                    paddingLeft: '32px',
                                    paddingRight: '32px',
                                }}
                            >
                                <header className="mb-12 break-after-avoid px-4">
                                    <div className="text-purple-500 text-sm mb-2">{novel.animeTitle}</div>
                                    <h1 className="text-4xl font-bold mb-4">{novel.title}</h1>
                                    <div className="text-sm opacity-70">
                                        Episode {novel.episodeIds.join(', ')} • {novel.wordCount.toLocaleString()} words
                                    </div>
                                </header>
                                {novel.content.split('\n').map((p, i) => {
                                    if (p.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold mt-8 mb-4 break-inside-avoid px-4">{p.slice(2)}</h1>;
                                    if (p.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mt-6 mb-3 break-inside-avoid px-4">{p.slice(3)}</h2>;
                                    if (p.trim() === '---') return <hr key={i} className="my-8 border-t-2 mx-4 opacity-30" />;
                                    if (!p.trim()) return <br key={i} />;
                                    return <p key={i} className="mb-4 text-justify px-4">{p}</p>;
                                })}
                                <footer className="mt-16 pt-8 border-t break-before-auto mx-4 opacity-70">
                                    <div className="text-center">End of Chapter</div>
                                </footer>
                            </article>
                        </div>
                    </div>
                ) : viewMode === 'scroll' ? (
                    <article className="max-w-4xl mx-auto px-6">
                        <header className="mb-12">
                            <h1 className="text-4xl font-bold mb-4">{novel.title}</h1>
                        </header>
                        <div className="prose prose-lg max-w-none" style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}>
                            {novel.content.split('\n').map((p, i) => {
                                if (p.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold mt-8 mb-4">{p.slice(2)}</h1>;
                                if (p.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mt-6 mb-3">{p.slice(3)}</h2>;
                                return <p key={i} className="mb-4">{p}</p>;
                            })}
                        </div>
                    </article>
                ) : null}

                <NovelChatbot animeTitle={novel.animeTitle} episodeTitle={novel.episodeTitle} content={novel.content} />
            </div>
        </div>
    );
}
