"use client";

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { Music, ArrowLeft, Search, Filter, Loader2, Play, LayoutGrid } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BeatCard from '@/components/BeatCard';
import { Beat, Profile } from '@/lib/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProducerBeatsPage({ params }: { params: Promise<{ username: string }> }) {
    const resolvedParams = use(params);
    const username = resolvedParams.username;
    const router = useRouter();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [beats, setBeats] = useState<Beat[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('Todos');

    const fetchAll = async () => {
        try {
            setLoading(true);

            // 1. Get Profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('id, username, artistic_name, avatar_url, is_verified, is_founder, subscription_tier, created_at')
                .eq('username', username)
                .single();

            if (profileData) {
                setProfile(profileData);

                // 2. Get All Beats
                const { data: beatsData } = await supabase
                    .from('beats')
                    .select('*, producer:producer_id(artistic_name, username)')
                    .eq('producer_id', profileData.id)
                    .eq('is_public', true)
                    .order('created_at', { ascending: false });

                if (beatsData) {
                    // Transform URLs (similar logic to profile/home)
                    const transformedBeats = await Promise.all(beatsData.map(async (b: any) => {
                        const path = b.mp3_tag_url || b.mp3_url || '';
                        const encodedPath = path.split('/').map((s: string) => encodeURIComponent(s)).join('/');
                        const bucket = path.includes('-hq-') ? 'beats-mp3-alta-calidad' : 'beats-muestras';

                        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(encodedPath);

                        const finalCoverUrl = b.portadabeat_url?.startsWith('http')
                            ? b.portadabeat_url
                            : b.portadabeat_url
                                ? supabase.storage.from('portadas-beats').getPublicUrl(b.portadabeat_url).data.publicUrl
                                : null;

                        return {
                            ...b,
                            mp3_url: publicUrl,
                            portadabeat_url: finalCoverUrl,
                            producer_username: profileData.username,
                            producer_is_verified: profileData.is_verified,
                            producer_is_founder: profileData.is_founder,
                            producer_tier: profileData.subscription_tier
                        };
                    }));
                    setBeats(transformedBeats);
                }
            }
        } catch (err) {
            console.error("Error fetching producer beats:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, [username]);

    const genres = ['Todos', ...new Set(beats.map(b => b.genre).filter(Boolean) as string[])];

    const filteredBeats = beats.filter(b => {
        const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGenre = selectedGenre === 'Todos' || b.genre === selectedGenre;
        return matchesSearch && matchesGenre;
    });

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <Loader2 className="animate-spin text-slate-300" size={32} />
        </div>
    );

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-white font-sans pt-24">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div className="flex items-center gap-6">
                        <Link href={`/${username}`} className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all text-slate-400 hover:text-blue-600 shadow-sm">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <LayoutGrid size={16} className="text-blue-600" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Catálogo Completo</span>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-slate-900">
                                {profile.artistic_name || profile.username}
                            </h1>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar en el catálogo..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-full text-sm font-bold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white focus:border-blue-600 transition-all w-full sm:w-64 md:w-80"
                            />
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex items-center gap-2 overflow-x-auto pb-8 no-scrollbar">
                    {genres.map(genre => (
                        <button
                            key={genre}
                            onClick={() => setSelectedGenre(genre)}
                            className={`whitespace-nowrap px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedGenre === genre
                                ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10'
                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-100'
                                }`}
                        >
                            {genre}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                {filteredBeats.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredBeats.map(beat => (
                            <BeatCard key={beat.id} beat={beat} />
                        ))}
                    </div>
                ) : (
                    <div className="py-24 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-6">
                            <Search size={32} />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 mb-2">Sin resultados</h3>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No encontramos beats que coincidan con tu búsqueda</p>
                    </div>
                )}
            </main>

            <Footer />

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
