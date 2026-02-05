"use client";

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { Music, ArrowLeft, Search, Filter, Loader2, Play, LayoutGrid, Heart, Eye, ListMusic, Plus, Edit3, Settings, Share2, ChevronDown, CheckCircle2, Crown } from 'lucide-react';
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
        <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col selection:bg-blue-600 selection:text-white">
            <Navbar />

            {/* Dynamic Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#eff6ff,transparent)] opacity-40" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-100/20 blur-[150px] rounded-full" />
                <div className="absolute top-1/4 left-0 w-[300px] h-[300px] bg-purple-100/20 blur-[120px] rounded-full" />
            </div>

            <main className="flex-1 relative z-10 pt-20">
                {/* Minimalist & Pro Header */}
                <div className="relative pt-16 pb-24 overflow-hidden border-b border-slate-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="flex flex-col md:flex-row items-end gap-12 md:gap-16">

                            {/* Pro Avatar Container */}
                            <div className="relative group shrink-0 mx-auto md:mx-0">
                                <div className="absolute -inset-4 bg-blue-600 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
                                <div className={`relative w-48 h-48 md:w-56 md:h-56 rounded-full p-1.5 bg-gradient-to-br from-slate-100 to-transparent backdrop-blur-3xl border border-slate-200 shadow-2xl transition-all duration-700 ${profile.subscription_tier === 'premium' ? 'ring-2 ring-blue-500/50 ring-offset-4 ring-offset-white' : ''}`}>
                                    {profile.foto_perfil ? (
                                        <img src={profile.foto_perfil} className="w-full h-full object-cover rounded-full" alt="Avatar" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center text-slate-500"><Music size={60} /></div>
                                    )}
                                    {profile.is_verified && (
                                        <div className="absolute bottom-2 right-2 p-3 bg-blue-600 rounded-full shadow-2xl border-4 border-white">
                                            <CheckCircle2 size={24} className="text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Impact Text Area - Streamlined */}
                            <div className="flex-1 text-center md:text-left space-y-6">
                                <Link href={`/${username}`} className="inline-flex items-center gap-2 text-slate-500 font-bold text-[9px] uppercase tracking-[0.3em] mb-4 hover:text-blue-400 transition-all group">
                                    <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Volver al Perfil
                                </Link>

                                <div>
                                    <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-2 leading-none">
                                        {profile.artistic_name || profile.username}
                                    </h1>
                                    <div className="flex items-center justify-center md:justify-start gap-3">
                                        <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">TIANGUIS PRO CATALOGO</span>
                                        <div className="w-8 h-px bg-slate-200" />
                                        {profile.is_founder && <span className="flex items-center gap-1.5 text-amber-500 text-[9px] font-black uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full"><Crown size={12} fill="currentColor" /> Founder</span>}
                                    </div>
                                </div>

                                {/* Premium Stats - Clean Dashboard Style */}
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 pt-4">
                                    <div className="text-center md:text-left">
                                        <span className="block text-2xl font-black mb-0.5 tabular-nums">
                                            {totalLikes.toString().padStart(2, '0')}
                                        </span>
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Likes</span>
                                    </div>
                                    <div className="w-px h-6 bg-slate-200" />
                                    <div className="text-center md:text-left">
                                        <span className="block text-2xl font-black mb-0.5 tabular-nums text-blue-500">
                                            {totalPlays.toString().padStart(2, '0')}
                                        </span>
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Plays</span>
                                    </div>
                                    <div className="w-px h-6 bg-slate-200" />
                                    <div className="text-center md:text-left">
                                        <span className="block text-2xl font-black mb-0.5 tabular-nums">
                                            {beats.length.toString().padStart(2, '0')}
                                        </span>
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Beats</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Area */}
                            <div className="flex flex-row md:flex-col gap-3 shrink-0">
                                {isOwner ? (
                                    <>
                                        <button
                                            onClick={() => { setEditingPlaylist(null); setIsPlaylistModalOpen(true); }}
                                            className="px-8 py-4 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
                                        >
                                            <Plus size={16} strokeWidth={3} /> Nueva Colección
                                        </button>
                                    </>
                                ) : (
                                    <button className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20">
                                        <Heart size={16} /> Seguir Artista
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-32 relative z-20">

                    {/* Floating Search Hub */}
                    <div className="bg-white/80 backdrop-blur-3xl rounded-[3.5rem] shadow-3xl border border-slate-100 p-4 md:p-6 mb-24 ring-1 ring-slate-200">
                        <div className="flex flex-col lg:flex-row gap-6 items-center">
                            <div className="relative flex-1 w-full group">
                                <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={24} />
                                <input
                                    type="text"
                                    placeholder="¿Cuál es tu próximo hit?"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-50 border border-transparent rounded-[2.5rem] pl-20 pr-10 py-6 text-lg font-bold focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:bg-white focus:border-blue-500/50 transition-all text-slate-900 placeholder:text-slate-400 uppercase tracking-tight"
                                />
                            </div>

                            <div className="flex items-center gap-4 w-full lg:w-auto">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex-1 lg:flex-none px-12 py-6 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 border ${showFilters ? 'bg-white text-black border-white' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                                >
                                    <Filter size={20} /> FILTROS {showFilters ? <ChevronDown size={14} className="rotate-180" /> : <ChevronDown size={14} />}
                                </button>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        alert("¡Enlace del catálogo copiado! 🚀");
                                    }}
                                    className="p-6 bg-slate-50 text-slate-400 rounded-[2.5rem] hover:text-blue-600 transition-all border border-slate-200 hover:border-blue-200"
                                >
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
                                                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border ${selectedGenre === g ? 'bg-emerald-500 text-white border-emerald-400 shadow-xl shadow-emerald-500/20' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-white hover:border-slate-200'}`}
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
                                                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border ${selectedMood === m ? 'bg-purple-600 text-white border-purple-500 shadow-xl shadow-purple-600/20' : 'bg-slate-50 text-slate-400 border-transparent hover:bg-white hover:border-slate-200'}`}
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
                                <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-b border-slate-100 pb-10">
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
                            <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-b border-slate-100 pb-10">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl">
                                        <Music size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">Explora todas las creaciones del productor</h2>
                                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Creaciones originales listas para grabar</p>
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
                                <div className="bg-slate-50 rounded-[4rem] py-32 text-center border-2 border-dashed border-slate-200">
                                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-slate-300 mx-auto mb-10 shadow-sm border border-slate-100">
                                        <Music size={48} />
                                    </div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-4 italic">No se encontraron frecuencias</h3>
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
