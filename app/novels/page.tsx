"use client";

import { useState, useEffect } from 'react';
import { Book, Trash2, Eye, Clock, FileText } from 'lucide-react';
import { NovelStorage, type GeneratedNovel } from '@/lib/novel-storage';
import Link from 'next/link';
import Image from 'next/image';

export default function NovelsPage() {
    const [novels, setNovels] = useState<GeneratedNovel[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // Load novels from localStorage
        const loadedNovels = NovelStorage.getAll();
        // Sort by most recent first
        loadedNovels.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
        setNovels(loadedNovels);
    }, []);

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this novel?')) {
            NovelStorage.delete(id);
            setNovels(novels.filter(n => n.id !== id));
        }
    };

    const filteredNovels = novels.filter(novel =>
        novel.animeTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        novel.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white">
            <div className="max-w-7xl mx-auto px-8 py-12">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                        <Book className="w-10 h-10 text-purple-500" />
                        My Novel Library
                    </h1>
                    <p className="text-gray-400">
                        Your AI-generated anime novels
                    </p>
                </div>

                {/* Search */}
                <div className="mb-8">
                    <input
                        type="text"
                        placeholder="Search novels..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full max-w-md px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                    />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <FileText className="w-8 h-8 text-blue-500" />
                            <div>
                                <div className="text-2xl font-bold">{novels.length}</div>
                                <div className="text-sm text-gray-400">Total Novels</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <Book className="w-8 h-8 text-green-500" />
                            <div>
                                <div className="text-2xl font-bold">
                                    {novels.reduce((sum, n) => sum + n.wordCount, 0).toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-400">Total Words</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <Clock className="w-8 h-8 text-purple-500" />
                            <div>
                                <div className="text-2xl font-bold">
                                    {novels.filter(n => n.readingProgress > 0).length}
                                </div>
                                <div className="text-sm text-gray-400">In Progress</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Novels Grid */}
                {filteredNovels.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredNovels.map((novel) => (
                            <div
                                key={novel.id}
                                className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-purple-500 transition-all group"
                            >
                                {/* Content */}
                                <div className="p-5">
                                    {/* Anime Title */}
                                    <div className="text-sm text-purple-400 mb-2">{novel.animeTitle}</div>

                                    {/* Novel Title */}
                                    <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
                                        {novel.title}
                                    </h3>

                                    {/* Episode Info */}
                                    <div className="text-sm text-gray-400 mb-3">
                                        Episode {novel.episodeIds.join(', ')}
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                        <span>{novel.wordCount.toLocaleString()} words</span>
                                        <span className="capitalize">{novel.length}</span>
                                        <span>{new Date(novel.generatedAt).toLocaleDateString()}</span>
                                    </div>

                                    {/* Progress Bar */}
                                    {novel.readingProgress > 0 && (
                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                <span>Progress</span>
                                                <span>{novel.readingProgress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-800 rounded-full h-2">
                                                <div
                                                    className="bg-purple-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${novel.readingProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/reader/${novel.id}`}
                                            className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span>{novel.readingProgress > 0 ? 'Continue' : 'Read'}</span>
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(novel.id)}
                                            className="flex items-center justify-center bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <Book className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-600 mb-2">
                            {searchQuery ? 'No novels found' : 'No novels yet'}
                        </h2>
                        <p className="text-gray-500 mb-6">
                            {searchQuery
                                ? 'Try a different search term'
                                : 'Generate your first novel from an anime episode'
                            }
                        </p>
                        {!searchQuery && (
                            <Link
                                href="/"
                                className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-all"
                            >
                                Browse Anime
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
