"use client";

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { Music, ArrowLeft, Search, Filter, Loader2, Play, LayoutGrid, Heart, Eye, ListMusic, Plus, Edit3, Settings, Share2, ChevronDown, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BeatCardPro from '@/components/explore/BeatCardPro';
import PlaylistSection from '@/components/PlaylistSection';
import PlaylistManagerModal from '@/components/PlaylistManagerModal';
import { Beat, Profile } from '@/lib/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProducerBeatsPage({ params }: { params: Promise<{ username: string }> }) {
    const resolvedParams = use(params);
    const username = resolvedParams.username;
    const router = useRouter();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [beats, setBeats] = useState<Beat[]>([]);
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isOwner, setIsOwner] = useState(false);

    // Search and Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('Todos');
    const [selectedMood, setSelectedMood] = useState('Todos');
    const [showFilters, setShowFilters] = useState(false);

    // Playlist Management
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
    const [editingPlaylist, setEditingPlaylist] = useState<any>(null);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);

            // 1. Get Profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('username', username)
                .single();

            if (profileData) {
                setProfile(profileData);
                if (user?.id === profileData.id) setIsOwner(true);

                // 2. Get All Beats
                const { data: beatsData } = await supabase
                    .from('beats')
                    .select('*')
                    .eq('producer_id', profileData.id)
                    .eq('is_public', true)
                    .order('created_at', { ascending: false });

                if (beatsData) {
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
                            producer_artistic_name: profileData.artistic_name,
                            producer_foto_perfil: profileData.foto_perfil,
                            producer_is_verified: profileData.is_verified,
                            producer_is_founder: profileData.is_founder,
                            producer_tier: profileData.subscription_tier
                        };
                    }));
                    setBeats(transformedBeats);
                }

                // 3. Get Playlists
                const { data: playlistsData } = await supabase
                    .from('playlists')
                    .select(`
                        id, 
                        name, 
                        description, 
                        playlist_beats (
                            order_index,
                            beats (*)
                        )
                    `)
                    .eq('producer_id', profileData.id)
                    .eq('is_public', true);

                if (playlistsData) {
                    const formattedPlaylists = await Promise.all(playlistsData.map(async (pl: any) => {
                        const playlistBeats = pl.playlist_beats.map((pb: any) => pb.beats).filter(Boolean);
                        const transformedPLBeats = await Promise.all(playlistBeats.map(async (b: any) => {
                            // Simplified transformation for playlists
                            return {
                                ...b,
                                producer_username: profileData.username,
                                producer_artistic_name: profileData.artistic_name,
                                producer_foto_perfil: profileData.foto_perfil,
                                producer_is_verified: profileData.is_verified,
                                producer_is_founder: profileData.is_founder,
                                producer_tier: profileData.subscription_tier
                            };
                        }));
                        return { ...pl, beats: transformedPLBeats };
                    }));
                    setPlaylists(formattedPlaylists);
                }
            }
        } catch (err) {
            console.error("Error fetching producer catalog:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, [username]);

    // Stats Calculations
    const totalLikes = beats.reduce((acc, b) => acc + (b.like_count || 0), 0);
    const totalPlays = beats.reduce((acc, b) => acc + (b.play_count || 0), 0);

    const genres = ['Todos', ...new Set(beats.map(b => b.genre).filter(Boolean) as string[])];
    const moods = ['Todos', ...new Set(beats.map(b => b.mood).filter(Boolean) as string[])];

    const filteredBeats = beats.filter(b => {
        const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGenre = selectedGenre === 'Todos' || b.genre === selectedGenre;
        const matchesMood = selectedMood === 'Todos' || b.mood === selectedMood;
        return matchesSearch && matchesGenre && matchesMood;
    });

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <Loader2 className="animate-spin text-slate-300" size={32} />
        </div>
    );

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col selection:bg-blue-600 selection:text-white">
            <Navbar />

            {/* Dynamic Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#1e1b4b,transparent)] opacity-40" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full" />
                <div className="absolute top-1/4 left-0 w-[300px] h-[300px] bg-purple-600/10 blur-[120px] rounded-full" />
            </div>

            <main className="flex-1 relative z-10 pt-20">
                {/* Immersive Header */}
                <div className="relative pt-24 pb-32 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">

                            {/* Giant Avatar with Rings */}
                            <div className="relative group shrink-0">
                                <div className="absolute inset-0 bg-blue-600 rounded-[4rem] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
                                <div className={`relative w-56 h-56 md:w-72 md:h-72 rounded-[4.5rem] p-2 bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl transition-all duration-700 group-hover:scale-105 group-hover:-rotate-2 ${profile.subscription_tier === 'premium' ? 'ring-4 ring-blue-500/50' : ''}`}>
                                    {profile.foto_perfil ? (
                                        <img src={profile.foto_perfil} className="w-full h-full object-cover rounded-[4rem]" alt="Avatar" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-800 rounded-[4rem] flex items-center justify-center text-slate-500"><Music size={80} /></div>
                                    )}
                                </div>
                                {profile.is_verified && (
                                    <div className="absolute -top-4 -right-4 p-4 bg-blue-600 rounded-3xl shadow-2xl border-4 border-[#050505] animate-pulse">
                                        <CheckCircle2 size={32} className="text-white" />
                                    </div>
                                )}
                            </div>

                            {/* Impact Text Area */}
                            <div className="flex-1 text-center md:text-left">
                                <Link href={`/${username}`} className="inline-flex items-center gap-3 text-blue-400 font-black text-[11px] uppercase tracking-[0.3em] mb-8 hover:tracking-[0.4em] transition-all group">
                                    <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" /> Regresar al Perfil
                                </Link>

                                <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter mb-6 leading-[0.9] italic">
                                    <span className="block text-white">Catálogo</span>
                                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-600 drop-shadow-2xl pb-2">
                                        {profile.artistic_name || profile.username}
                                    </span>
                                </h1>

                                <p className="text-slate-400 text-base md:text-lg font-medium max-w-2xl mb-10 leading-relaxed italic opacity-80 border-l-2 border-blue-500/30 pl-6 md:pl-8 mx-auto md:mx-0 text-center md:text-left">
                                    {profile.bio || "Explora el universo sonoro de este productor premium."}
                                </p>

                                {/* Premium Stats */}
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 md:gap-12">
                                    <div className="group/stat text-center md:text-left">
                                        <span className="block text-3xl md:text-4xl font-black mb-1 group-hover/stat:text-blue-500 transition-colors uppercase tabular-nums">
                                            {totalLikes.toString().padStart(2, '0')}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Total Likes</span>
                                    </div>
                                    <div className="w-px h-10 bg-white/10 hidden md:block" />
                                    <div className="group/stat text-center md:text-left">
                                        <span className="block text-3xl md:text-4xl font-black mb-1 group-hover/stat:text-purple-500 transition-colors uppercase tabular-nums">
                                            {totalPlays.toString().padStart(2, '0')}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Plays</span>
                                    </div>
                                    <div className="w-px h-10 bg-white/10 hidden md:block" />
                                    <div className="group/stat text-center md:text-left">
                                        <span className="block text-3xl md:text-4xl font-black mb-1 group-hover/stat:text-amber-500 transition-colors uppercase tabular-nums">
                                            {beats.length.toString().padStart(2, '0')}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Beats</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions (Owner) */}
                            {isOwner && (
                                <div className="flex flex-col gap-4">
                                    <button
                                        onClick={() => { setEditingPlaylist(null); setIsPlaylistModalOpen(true); }}
                                        className="px-10 py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-[0_20px_40px_rgba(37,99,235,0.3)] flex items-center justify-center gap-4 hover:scale-105"
                                    >
                                        <Plus size={20} strokeWidth={3} /> Nueva Colección
                                    </button>
                                    <Link
                                        href="/studio"
                                        className="px-10 py-6 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 group"
                                    >
                                        <Settings size={20} className="group-hover:rotate-90 transition-transform" /> Panel de Control
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-32 relative z-20">

                    {/* Floating Search Hub */}
                    <div className="bg-[#0a0a0a]/80 backdrop-blur-3xl rounded-[3.5rem] shadow-3xl border border-white/5 p-4 md:p-6 mb-24 ring-1 ring-white/10">
                        <div className="flex flex-col lg:flex-row gap-6 items-center">
                            <div className="relative flex-1 w-full group">
                                <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={24} />
                                <input
                                    type="text"
                                    placeholder="¿Cuál es tu próximo hit?"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/5 border border-transparent rounded-[2.5rem] pl-20 pr-10 py-6 text-lg font-bold focus:outline-none focus:ring-4 focus:ring-blue-600/20 focus:bg-white/10 focus:border-blue-500/50 transition-all text-white placeholder:text-slate-600 uppercase tracking-tight"
                                />
                            </div>

                            <div className="flex items-center gap-4 w-full lg:w-auto">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex-1 lg:flex-none px-12 py-6 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 border ${showFilters ? 'bg-white text-black border-white' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                                >
                                    <Filter size={20} /> FILTROS {showFilters ? <ChevronDown size={14} className="rotate-180" /> : <ChevronDown size={14} />}
                                </button>
                                <button className="p-6 bg-white/5 text-slate-400 rounded-[2.5rem] hover:text-white transition-all border border-white/10 hover:border-white/20">
                                    <Share2 size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Ultra-Modern Filter Drawer */}
                        {showFilters && (
                            <div className="mt-10 pt-10 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 animate-in fade-in zoom-in-95 duration-500">
                                <div className="space-y-6">
                                    <label className="text-[11px] font-black uppercase text-blue-500 tracking-[0.3em] pl-2 mb-4 block">Géneros</label>
                                    <div className="flex flex-wrap gap-3">
                                        {genres.map(g => (
                                            <button
                                                key={g}
                                                onClick={() => setSelectedGenre(g)}
                                                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border ${selectedGenre === g ? 'bg-blue-600 text-white border-blue-500 shadow-xl shadow-blue-600/30' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'}`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <label className="text-[11px] font-black uppercase text-purple-500 tracking-[0.3em] pl-2 mb-4 block">Moods</label>
                                    <div className="flex flex-wrap gap-3">
                                        {moods.map(m => (
                                            <button
                                                key={m}
                                                onClick={() => setSelectedMood(m)}
                                                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border ${selectedMood === m ? 'bg-purple-600 text-white border-purple-500 shadow-xl shadow-purple-600/30' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'}`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end justify-center gap-6">
                                    <button
                                        onClick={() => { setSelectedGenre('Todos'); setSelectedMood('Todos'); setSearchQuery(''); }}
                                        className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-rose-500 transition-colors flex items-center gap-3"
                                    >
                                        Limpiar Todo
                                    </button>
                                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic pr-2">
                                        Filtrando {filteredBeats.length} resultados
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Vitaminized Content Grid */}
                    <div className="space-y-32">
                        {/* Featured Playlists Grid */}
                        {playlists.length > 0 && searchQuery === '' && (
                            <div className="space-y-16">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-b border-white/5 pb-10">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl">
                                            <ListMusic size={32} />
                                        </div>
                                        <div>
                                            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">Colecciones Master</h2>
                                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Curado especialmente por el equipo de producción</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-16">
                                    <PlaylistSection
                                        playlists={playlists}
                                        isOwner={isOwner}
                                        onEdit={(id) => {
                                            const pl = playlists.find(p => p.id === id);
                                            setEditingPlaylist(pl);
                                            setIsPlaylistModalOpen(true);
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Full Catalog Grid */}
                        <div className="space-y-16">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-b border-white/5 pb-10">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl">
                                        <Music size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">Universo Beats</h2>
                                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Explora {filteredBeats.length} creaciones originales listas para grabar</p>
                                    </div>
                                </div>
                            </div>

                            {filteredBeats.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-16">
                                    {filteredBeats.map((beat, idx) => (
                                        <div key={beat.id} className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both" style={{ animationDelay: `${idx * 50}ms` }}>
                                            <BeatCardPro beat={beat} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white/5 rounded-[4rem] py-32 text-center border-2 border-dashed border-white/10 backdrop-blur-3xl">
                                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-slate-700 mx-auto mb-10 shadow-inner">
                                        <Music size={48} />
                                    </div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter text-white mb-4 italic">No se encontraron frecuencias</h3>
                                    <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.3em]">Ajusta tus filtros para descubrir nuevos sonidos</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {isOwner && profile && (
                    <PlaylistManagerModal
                        isOpen={isPlaylistModalOpen}
                        onClose={() => setIsPlaylistModalOpen(false)}
                        producerId={profile.id}
                        existingPlaylist={editingPlaylist}
                        allBeats={beats}
                        onSuccess={fetchAll}
                    />
                )}
            </main>

            <Footer />

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
            `}</style>
        </div>
    );
}
