"use client";

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { Music, ArrowLeft, Search, Filter, Loader2, Play, LayoutGrid, Heart, Eye, ListMusic, Plus, Edit3, Settings, Share2, ChevronDown } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BeatCard from '@/components/BeatCard';
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
                            return { ...b, producer_username: profileData.username, producer_artistic_name: profileData.artistic_name };
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
        <div className="min-h-screen bg-white font-sans flex flex-col pt-24">
            <Navbar />

            <main className="flex-1 pb-32">
                {/* Hero Catalog Header */}
                <div className="bg-slate-900 text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#3b82f6,transparent)]" />
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
                        <div className="flex flex-col md:flex-row items-center gap-12">
                            {/* Producer Identity */}
                            <div className="relative shrink-0">
                                <div className={`w-48 h-48 rounded-[3rem] border-4 overflow-hidden shadow-2xl ${profile.subscription_tier === 'premium' ? 'border-blue-500' : 'border-white/10'}`}>
                                    {profile.foto_perfil ? (
                                        <img src={profile.foto_perfil} className="w-full h-full object-cover" alt="Avatar" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500"><Music size={64} /></div>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <Link href={`/${username}`} className="inline-flex items-center gap-2 text-blue-400 font-black text-[10px] uppercase tracking-widest mb-4 hover:text-blue-300 transition-colors">
                                    <ArrowLeft size={14} /> Volver al Perfil
                                </Link>
                                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4 leading-tight">
                                    Catálogo de {profile.artistic_name || profile.username}
                                </h1>
                                <p className="text-slate-400 text-sm font-medium max-w-xl mb-8 leading-relaxed italic opacity-80">
                                    "{profile.bio?.slice(0, 100) || "Escucha el sonido original de este productor."}{profile.bio && profile.bio.length > 100 ? '...' : ''}"
                                </p>

                                {/* Stats Bar */}
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-blue-400">
                                            <Heart size={20} fill="currentColor" />
                                        </div>
                                        <div>
                                            <span className="block text-xl font-black">{totalLikes}</span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Likes</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-purple-400">
                                            <Eye size={20} />
                                        </div>
                                        <div>
                                            <span className="block text-xl font-black">{totalPlays}</span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reproducciones</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-amber-400">
                                            <Music size={20} />
                                        </div>
                                        <div>
                                            <span className="block text-xl font-black">{beats.length}</span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Beats Listos</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Area */}
                            {isOwner && (
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => { setEditingPlaylist(null); setIsPlaylistModalOpen(true); }}
                                        className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3"
                                    >
                                        <Plus size={18} /> Nueva Playlist
                                    </button>
                                    <Link
                                        href="/studio"
                                        className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                                    >
                                        <Edit3 size={18} /> Gestionar Beats
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
                    {/* Search and Filters Strip */}
                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-4 md:p-6 mb-16">
                        <div className="flex flex-col lg:flex-row gap-6 items-center">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="¿Qué estás buscando hoy?"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-50 border border-transparent rounded-[1.5rem] pl-16 pr-8 py-5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white focus:border-blue-600 transition-all shadow-inner"
                                />
                            </div>

                            <div className="flex items-center gap-3 w-full lg:w-auto">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex-1 lg:flex-none px-8 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 border shadow-sm ${showFilters ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-900 border-slate-100 hover:bg-slate-50'}`}
                                >
                                    <Filter size={18} /> Filtros {showFilters ? <ChevronDown size={14} className="rotate-180" /> : <ChevronDown size={14} />}
                                </button>
                                <button className="p-5 bg-slate-50 text-slate-400 rounded-[1.5rem] hover:text-blue-600 transition-colors border border-slate-100">
                                    <Share2 size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Expandable Filters */}
                        {showFilters && (
                            <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Género Musical</label>
                                    <div className="flex flex-wrap gap-2">
                                        {genres.map(g => (
                                            <button
                                                key={g}
                                                onClick={() => setSelectedGenre(g)}
                                                className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${selectedGenre === g ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Estado de Ánimo</label>
                                    <div className="flex flex-wrap gap-2">
                                        {moods.map(m => (
                                            <button
                                                key={m}
                                                onClick={() => setSelectedMood(m)}
                                                className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${selectedMood === m ? 'bg-purple-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center justify-end">
                                    <button
                                        onClick={() => { setSelectedGenre('Todos'); setSelectedMood('Todos'); setSearchQuery(''); }}
                                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        Limpiar Filtros
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content Sections */}
                    <div className="space-y-24">
                        {/* Playlists Section if any */}
                        {playlists.length > 0 && searchQuery === '' && (
                            <div className="space-y-12">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                                        <ListMusic size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black uppercase tracking-tighter">Colecciones Recomendadas</h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Selección especial del productor</p>
                                    </div>
                                </div>
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
                        )}

                        {/* Beats Grid */}
                        <div className="space-y-12">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                        <Music size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black uppercase tracking-tighter">Todo el Catálogo</h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Mostrando {filteredBeats.length} beats</p>
                                    </div>
                                </div>
                            </div>

                            {filteredBeats.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                    {filteredBeats.map(beat => (
                                        <BeatCard key={beat.id} beat={beat} />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-slate-50 rounded-[3rem] py-24 text-center border-2 border-dashed border-slate-200">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-200 mx-auto mb-8 shadow-sm">
                                        <Search size={40} />
                                    </div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-2">No se encontraron beats</h3>
                                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Intenta ajustar tus criterios de búsqueda</p>
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
            `}</style>
        </div>
    );
}
