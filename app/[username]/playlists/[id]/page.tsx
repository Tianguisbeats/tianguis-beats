"use client";

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { Music, ArrowLeft, Loader2, ListMusic, Edit3, Share2, Crown } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BeatCardPro from '@/components/explore/BeatCardPro';
import PlaylistManagerModal from '@/components/PlaylistManagerModal';
import { Beat, Profile } from '@/lib/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PlaylistPage({ params }: { params: Promise<{ username: string, id: string }> }) {
    const resolvedParams = use(params);
    const username = resolvedParams.username;
    const playlistId = resolvedParams.id;
    const router = useRouter();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [playlist, setPlaylist] = useState<any>(null);
    const [beatsInPlaylist, setBeatsInPlaylist] = useState<Beat[]>([]);
    const [allProducerBeats, setAllProducerBeats] = useState<Beat[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            // 1. Get Profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('username', username)
                .single();

            if (profileData) {
                setProfile(profileData);
                if (user?.id === profileData.id) setIsOwner(true);

                // 2. Get Playlist
                const { data: playlistData } = await supabase
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
                    .eq('id', playlistId)
                    .single();

                if (playlistData) {
                    const playlistBeats = playlistData.playlist_beats
                        .sort((a: any, b: any) => a.order_index - b.order_index)
                        .map((pb: any) => pb.beats)
                        .filter(Boolean);

                    const transformedBeats = await Promise.all(playlistBeats.map(async (b: any) => {
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

                    setPlaylist({
                        id: playlistData.id,
                        name: playlistData.name,
                        description: playlistData.description,
                        beats: transformedBeats
                    });
                    setBeatsInPlaylist(transformedBeats);

                    // 3. Get All Beats (only if owner)
                    if (user?.id === profileData.id) {
                        const { data: allBeatsData } = await supabase
                            .from('beats')
                            .select('*')
                            .eq('producer_id', profileData.id)
                            .eq('is_public', true)
                            .order('created_at', { ascending: false });

                        if (allBeatsData) {
                            // Transformation skip for brevity in modal
                            setAllProducerBeats(allBeatsData as any);
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Error fetching playlist:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [username, playlistId]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <Loader2 className="animate-spin text-slate-300" size={32} />
        </div>
    );

    if (!profile || !playlist) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 text-center">
            <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-4">No se encontró la playlist</h1>
            <p className="text-slate-400 text-sm mb-8 font-bold uppercase tracking-widest">Es posible que el enlace haya expirado o la colección sea privada.</p>
            <button onClick={() => router.back()} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl">
                Volver Atrás
            </button>
        </div>
    );

    return (
        <div className={`min-h-screen font-sans flex flex-col transition-colors duration-500 ${profile.tema_perfil === 'dark' ? 'bg-[#020205] text-white selection:bg-white selection:text-slate-900' :
                profile.tema_perfil === 'neon' ? 'bg-[#09090b] text-white selection:bg-green-400 selection:text-black' :
                    profile.tema_perfil === 'gold' ? 'bg-[#1a1610] text-amber-50 font-serif selection:bg-amber-400 selection:text-black' :
                        'bg-white text-slate-900 selection:bg-blue-600 selection:text-white'
            }`} style={{
                '--accent': profile.color_acento || '#2563eb'
            } as React.CSSProperties}>
            <Navbar />
            <main className="flex-1 pt-32 pb-20 relative overflow-hidden">
                {/* Ambient logic */}
                <div className={`absolute top-0 right-0 w-[500px] h-[500px] blur-[150px] -z-10 rounded-full ${profile.tema_perfil === 'dark' ? 'bg-white/5' :
                        profile.tema_perfil === 'neon' ? 'bg-green-500/10' :
                            profile.tema_perfil === 'gold' ? 'bg-amber-500/10' :
                                'bg-blue-50/50'
                    }`} />
                <div className={`absolute bottom-0 left-0 w-[300px] h-[300px] blur-[120px] -z-10 rounded-full ${profile.tema_perfil === 'dark' ? 'bg-white/5' :
                        profile.tema_perfil === 'neon' ? 'bg-purple-500/10' :
                            profile.tema_perfil === 'gold' ? 'bg-amber-600/10' :
                                'bg-indigo-50/50'
                    }`} />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Breadcrumbs */}
                    <Link href={`/${username}/beats`} className="inline-flex items-center gap-2 text-slate-400 font-black text-[9px] uppercase tracking-[0.4em] mb-12 hover:text-blue-600 transition-all group">
                        <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Catálogo de {profile.artistic_name || profile.username}
                    </Link>

                    {/* Header */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-20">
                        <div className="flex flex-col md:flex-row items-center gap-10 text-center md:text-left">
                            <div className={`w-32 h-32 md:w-40 md:h-40 rounded-[3rem] flex items-center justify-center shadow-2xl relative group ${profile.tema_perfil === 'dark' ? 'bg-white/5 text-white border border-white/10' :
                                    profile.tema_perfil === 'neon' ? 'bg-black text-green-400 border border-green-500/20 shadow-[0_0_30px_rgba(74,222,128,0.2)]' :
                                        profile.tema_perfil === 'gold' ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100 border border-amber-500/20' :
                                            'bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 text-white'
                                }`}>
                                <div className="absolute inset-0 bg-white/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                                <ListMusic size={60} className="relative z-10" />
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-center md:justify-start gap-3">
                                    <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${profile.tema_perfil === 'light' ? 'text-blue-600' : 'text-accent'
                                        }`}>TIANGUIS PLAYLIST</span>
                                    <div className={`w-8 h-px ${profile.tema_perfil === 'light' ? 'bg-slate-100' : 'bg-white/10'}`} />
                                    <span className={`text-[9px] font-bold uppercase tracking-widest ${profile.tema_perfil === 'light' ? 'text-slate-400' : 'text-white/40'}`}>{beatsInPlaylist.length} Beats Guardados</span>
                                </div>
                                <h1 className={`text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none italic ${profile.tema_perfil === 'light'
                                        ? 'bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600'
                                        : 'text-white drop-shadow-lg'
                                    }`}>
                                    {playlist.name}
                                </h1>
                                {playlist.description && (
                                    <p className={`text-sm font-medium italic max-w-xl ${profile.tema_perfil === 'light' ? 'text-slate-400' : 'text-white/60'}`}>{playlist.description}</p>
                                )}

                                <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-100">
                                            <img src={profile.foto_perfil || ''} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Por {profile.artistic_name || profile.username}</span>
                                    </div>
                                    {profile.is_verified && <img src="/verified-badge.png" className="w-4 h-4 object-contain" alt="Verificado" />}
                                    {profile.is_founder && <Crown size={14} className="text-yellow-400" fill="currentColor" />}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            {isOwner && (
                                <button
                                    onClick={() => setIsPlaylistModalOpen(true)}
                                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-blue-600 flex items-center gap-3 shadow-xl shadow-slate-900/10 hover:scale-105 active:scale-95"
                                >
                                    <Edit3 size={18} /> Editar Colección
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    alert("¡Enlace de la playlist copiado! 🚀");
                                }}
                                className={`p-4 rounded-2xl border transition-all hover:shadow-lg active:scale-90 ${profile.tema_perfil === 'light'
                                        ? 'bg-white text-slate-400 border-slate-100 hover:text-blue-600 hover:border-blue-200'
                                        : 'bg-white/5 text-white/40 border-white/5 hover:text-white hover:bg-white/10 hover:border-white/20'
                                    }`}
                            >
                                <Share2 size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-100 to-transparent mb-20" />

                    {/* Beats List */}
                    {beatsInPlaylist.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-16">
                            {beatsInPlaylist.map((beat, idx) => (
                                <div key={beat.id} className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <BeatCardPro beat={beat} compact={true} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={`rounded-[4rem] py-40 text-center border-2 border-dashed backdrop-blur-sm ${profile.tema_perfil === 'light'
                                ? 'bg-slate-50/50 border-slate-100'
                                : 'bg-white/5 border-white/5'
                            }`}>
                            <Music size={60} className={`mx-auto mb-10 ${profile.tema_perfil === 'light' ? 'text-slate-200' : 'text-white/20'}`} />
                            <h3 className={`text-3xl font-black uppercase tracking-tighter mb-4 italic ${profile.tema_perfil === 'light' ? 'text-slate-900' : 'text-white'}`}>Playlist sin beats</h3>
                            <p className={`text-[11px] font-black uppercase tracking-[0.3em] ${profile.tema_perfil === 'light' ? 'text-slate-400' : 'text-white/40'}`}>Esta colección aún no tiene tracks guardados</p>
                        </div>
                    )}
                </div>

                {isOwner && (
                    <PlaylistManagerModal
                        isOpen={isPlaylistModalOpen}
                        onClose={() => setIsPlaylistModalOpen(false)}
                        producerId={profile.id}
                        existingPlaylist={playlist}
                        allBeats={allProducerBeats}
                        onSuccess={fetchData}
                    />
                )}
            </main>
            <Footer />
        </div>
    );
}
