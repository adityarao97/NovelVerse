"use client";

import { useState, useEffect } from 'react';
import { Book, Loader2, Sparkles, Eye, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { EnhancedEpisode } from '@/types/anime';
import type { NovelLength } from '@/lib/novel-generator';
import { NovelStorage } from '@/lib/novel-storage';

interface NovelGeneratorProps {
    animeId: number;
    animeTitle: string;
    episodes: EnhancedEpisode[];
    selectedEpisodes?: number[];
}

export default function NovelGenerator({
    animeId,
    animeTitle,
    episodes,
    selectedEpisodes
}: NovelGeneratorProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [length, setLength] = useState<NovelLength>('medium');
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState('');
    const [existingNovel, setExistingNovel] = useState<any>(null);
    const [showRegenerateOptions, setShowRegenerateOptions] = useState(false);
    const [mounted, setMounted] = useState(false);

    const episodeIds = selectedEpisodes || episodes.map(ep => ep.mal_id);
    const isBatch = episodeIds.length > 1;
    const isSingleEpisode = episodeIds.length === 1;

    // Wait for client-side mount to prevent hydration errors
    useEffect(() => {
        setMounted(true);
    }, []);

    // Check if novel already exists (only for single episodes, after mount)
    useEffect(() => {
        if (mounted && isSingleEpisode) {
            const novels = NovelStorage.getAll();
            const found = novels.find(n =>
                n.animeId === animeId &&
                n.episodeIds.length === 1 &&
                n.episodeIds[0] === episodeIds[0]
            );
            setExistingNovel(found || null);
        }
    }, [mounted, animeId, episodeIds[0], isSingleEpisode]);

    const handleGenerate = async (regenerate = false) => {
        setIsGenerating(true);
        setProgress('Preparing to generate novel...');

        try {
            const response = await fetch('/api/generate-novel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    animeId,
                    episodeIds,
                    length,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate novel');
            }

            const data = await response.json();

            setProgress('Novel generated successfully!');

            // If regenerating, delete the old one first
            if (regenerate && existingNovel) {
                NovelStorage.delete(existingNovel.id);
            }

            data.novels.forEach((novel: any) => {
                NovelStorage.save({
                    id: `${animeId}-${novel.episodeId}-${Date.now()}`,
                    animeId,
                    animeTitle,
                    episodeIds: [novel.episodeId],
                    episodeTitle: novel.episodeTitle,
                    title: novel.title,
                    content: novel.content,
                    htmlContent: '',
                    wordCount: novel.wordCount,
                    length,
                    generatedAt: new Date(data.generatedAt),
                    readingProgress: 0,
                    epubGenerated: false,
                });
            });

            // Refresh to show updated state
            const novels = NovelStorage.getAll();
            const found = novels.find(n =>
                n.animeId === animeId &&
                n.episodeIds.length === 1 &&
                n.episodeIds[0] === episodeIds[0]
            );
            setExistingNovel(found || null);

            // Close modal
            setTimeout(() => {
                setIsOpen(false);
                setShowRegenerateOptions(false);
                setIsGenerating(false);
                setProgress('');

                if (regenerate) {
                    alert(`✅ Novel regenerated! ${data.totalWordCount} words in ${length} format.`);
                } else if (isSingleEpisode) {
                    // Don't show alert for single episodes, UI will update automatically
                } else {
                    alert(`✅ Generated ${data.novels.length} novel(s)! Total ${data.totalWordCount} words.`);
                }
            }, 1000);

        } catch (error) {
            console.error('Error generating novel:', error);
            setProgress('');
            setIsGenerating(false);
            alert('Failed to generate novel. Please check your Gemini API key.');
        }
    };

    const handleRead = () => {
        if (existingNovel) {
            router.push(`/reader/${existingNovel.id}`);
        }
    };

    // Don't render until mounted to prevent hydration errors
    if (!mounted) {
        return (
            <button disabled className="w-full flex items-center justify-center gap-2 bg-gray-700 text-gray-400 px-4 py-2 rounded-lg">
                <Sparkles className="w-4 h-4" />
                <span>Loading...</span>
            </button>
        );
    }

    // If novel exists for single episode, show Read + Regenerate buttons
    if (existingNovel && isSingleEpisode) {
        return (
            <>
                <div className="flex gap-2">
                    <button
                        onClick={handleRead}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all shadow-lg"
                    >
                        <Eye className="w-4 h-4" />
                        <span>Read Novel</span>
                    </button>
                    <button
                        onClick={() => {
                            setShowRegenerateOptions(true);
                            setIsOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all"
                        title="Regenerate with different length"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                {/* Regenerate Modal */}
                {isOpen && showRegenerateOptions && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-700">
                            <div className="flex items-center gap-3 mb-4">
                                <RefreshCw className="w-6 h-6 text-purple-500" />
                                <h2 className="text-2xl font-bold text-white">Regenerate Novel</h2>
                            </div>

                            <p className="text-gray-300 mb-2">
                                Current: <span className="text-purple-400 capitalize">{existingNovel.length}</span> ({existingNovel.wordCount.toLocaleString()} words)
                            </p>
                            <p className="text-gray-400 text-sm mb-4">
                                Choose a different length to regenerate this novel.
                            </p>

                            {/* Length Selector */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    New Length
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['short', 'medium', 'long'] as NovelLength[]).map((len) => (
                                        <button
                                            key={len}
                                            onClick={() => setLength(len)}
                                            disabled={len === existingNovel.length}
                                            className={`px-4 py-2 rounded-lg border transition-all ${length === len
                                                ? 'bg-purple-600 border-purple-500 text-white'
                                                : len === existingNovel.length
                                                    ? 'bg-gray-800 border-gray-700 text-gray-600 cursor-not-allowed'
                                                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-purple-500'
                                                }`}
                                        >
                                            <div className="text-sm font-medium capitalize">{len}</div>
                                            <div className="text-xs opacity-70">
                                                {len === 'short' ? '~1k' : len === 'medium' ? '~2.5k' : '~5k'} words
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Progress */}
                            {progress && (
                                <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
                                    <p className="text-sm text-gray-300">{progress}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        setShowRegenerateOptions(false);
                                    }}
                                    disabled={isGenerating}
                                    className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleGenerate(true)}
                                    disabled={isGenerating || length === existingNovel.length}
                                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Regenerating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-4 h-4" />
                                            <span>Regenerate</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    // Default: Generate button for new novels or batch
    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2.5 rounded-lg transition-all shadow-lg"
            >
                <Sparkles className="w-4 h-4" />
                <span>Generate {isBatch ? 'Novels' : 'Novel'}</span>
            </button>

            {isOpen && !showRegenerateOptions && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <Book className="w-6 h-6 text-purple-500" />
                            <h2 className="text-2xl font-bold text-white">Generate Web Novel</h2>
                        </div>

                        <p className="text-gray-300 mb-4">
                            {isBatch
                                ? `Transform ${episodeIds.length} episodes into immersive light novel chapters.`
                                : `Transform this episode into an immersive light novel chapter.`
                            }
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Novel Length
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['short', 'medium', 'long'] as NovelLength[]).map((len) => (
                                    <button
                                        key={len}
                                        onClick={() => setLength(len)}
                                        className={`px-4 py-2 rounded-lg border transition-all ${length === len
                                            ? 'bg-purple-600 border-purple-500 text-white'
                                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-purple-500'
                                            }`}
                                    >
                                        <div className="text-sm font-medium capitalize">{len}</div>
                                        <div className="text-xs opacity-70">
                                            {len === 'short' ? '~1k' : len === 'medium' ? '~2.5k' : '~5k'} words
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {progress && (
                            <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
                                <p className="text-sm text-gray-300">{progress}</p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsOpen(false)}
                                disabled={isGenerating}
                                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleGenerate(false)}
                                disabled={isGenerating}
                                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        <span>Generate</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 mt-4">
                            Powered by Google Gemini AI
                            {isBatch && ` • Est. ${Math.ceil(episodeIds.length * 4.5)} seconds`}
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
