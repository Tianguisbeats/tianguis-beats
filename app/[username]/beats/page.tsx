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
import { useToast } from '@/context/ToastContext';

export default function ProducerBeatsPage({ params }: { params: Promise<{ username: string }> }) {
    const resolvedParams = use(params);
    const username = resolvedParams.username;
    const router = useRouter();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [beats, setBeats] = useState<Beat[]>([]);
    // Playlists eliminadas de esta vista
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isOwner, setIsOwner] = useState(false);
    const { showToast } = useToast();

    // Search and Filters
    const [selectedBpmRange, setSelectedBpmRange] = useState('Todos');
    const [searchQuery, setSearchQuery] = useState('');


    const fetchAll = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);

            // 1. Get Profile
            const { data: profileData } = await supabase
                .from('perfiles')
                .select('*')
                .eq('nombre_usuario', username)
                .single();

            if (profileData) {
                setProfile(profileData);
                if (user?.id === profileData.id) setIsOwner(true);

                // 2. Get All Beats
                const { data: beatsData } = await supabase
                    .from('beats')
                    .select('*')
                    .eq('productor_id', profileData.id)
                    .eq('es_publico', true)
                    .order('fecha_creacion', { ascending: false });

                if (beatsData) {
                    const transformedBeats = await Promise.all(beatsData.map(async (b: any) => {
                        // Priorizar archivo_muestra_url
                        const path = b.archivo_muestra_url || b.archivo_mp3_url || '';
                        const encodedPath = path.split('/').map((s: string) => encodeURIComponent(s)).join('/');

                        // Usar buckets unificados en español
                        const bucket = path === b.archivo_muestra_url ? 'muestras_beats' : 'beats_mp3';
                        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(encodedPath);

                        const finalCoverUrl = b.portada_url?.startsWith('http')
                            ? b.portada_url
                            : b.portada_url
                                ? supabase.storage.from('portadas_beats').getPublicUrl(b.portada_url).data.publicUrl
                                : null;

                        return {
                            ...b,
                            archivo_mp3_url: publicUrl,
                            portada_url: finalCoverUrl,
                            productor_nombre_usuario: profileData.nombre_usuario,
                            productor_nombre_artistico: profileData.nombre_artistico,
                            productor_foto_perfil: profileData.foto_perfil,
                            productor_esta_verificado: profileData.esta_verificado,
                            productor_es_fundador: profileData.es_fundador,
                            productor_nivel_suscripcion: profileData.nivel_suscripcion
                        };
                    }));
                    setBeats(transformedBeats);
                }

            }

            // 3. Playlists logic removed
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
    const totalLikes = beats.reduce((acc, b) => acc + (b.conteo_likes || 0), 0);
    const totalPlays = beats.reduce((acc, b) => acc + (b.conteo_reproducciones || 0), 0);

    const genres = ['Todos', ...new Set(beats.map(b => b.genero).filter(Boolean) as string[])];
    const moods = ['Todos', ...new Set(beats.map(b => b.vibras).filter(Boolean) as string[])];

    const filteredBeats = beats.filter(b => {
        return b.titulo.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Loader2 className="animate-spin text-muted" size={32} />
        </div>
    );

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col selection:bg-accent selection:text-white transition-colors duration-300">
            <Navbar />

            {/* Dynamic Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,var(--accent-soft),transparent)] opacity-40" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[150px] rounded-full" />
                <div className="absolute top-1/4 left-0 w-[300px] h-[300px] bg-accent/5 blur-[120px] rounded-full" />
            </div>

            <main className="flex-1 relative z-10 pt-20">
                {/* Minimalist & Pro Header */}
                <div className="relative pt-16 pb-24 overflow-hidden border-b border-border">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="flex flex-col md:flex-row items-end gap-12 md:gap-16">

                            {/* Pro Avatar Container */}
                            <div className="relative group shrink-0 mx-auto md:mx-0">
                                <div className="absolute -inset-4 bg-accent rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
                                <div className={`relative w-48 h-48 md:w-56 md:h-56 rounded-full p-1.5 bg-gradient-to-br from-card to-transparent backdrop-blur-3xl border border-border shadow-2xl transition-all duration-700 ${profile?.nivel_suscripcion === 'premium' ? 'ring-2 ring-accent/50 ring-offset-4 ring-offset-background' : ''}`}>
                                    {profile?.foto_perfil ? (
                                        <img src={profile.foto_perfil} className="w-full h-full object-cover rounded-full" alt="Avatar" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center text-slate-500"><Music size={60} /></div>
                                    )}
                                    {profile?.esta_verificado && (
                                        <div className="absolute bottom-2 right-2 translate-x-1/4 translate-y-1/4">
                                            <img src="/verified-badge.png" className="w-12 h-12 md:w-14 md:h-14 drop-shadow-2xl" alt="Verificado" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Impact Text Area - Streamlined */}
                            <div className="flex-1 text-center md:text-left space-y-6">
                                <Link href={`/${username}`} className="inline-flex items-center gap-2 text-muted font-bold text-[9px] uppercase tracking-[0.3em] mb-4 hover:text-accent transition-all group">
                                    <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Volver al Perfil
                                </Link>

                                <div>
                                    <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-2 leading-none">
                                        {profile.nombre_artistico || profile.nombre_usuario}
                                    </h1>
                                    <div className="flex items-center justify-center md:justify-start gap-3">
                                        <span className="text-accent text-[10px] font-black uppercase tracking-[0.4em]">TIANGUIS PRO CATALOGO</span>
                                        <div className="w-8 h-px bg-border" />
                                        {profile.es_fundador && <span className="flex items-center gap-1.5 text-[#FDE047] text-[9px] font-black uppercase tracking-widest bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/20"><Crown size={12} fill="currentColor" /> Founder</span>}
                                    </div>
                                </div>

                                {/* Premium Stats - Clean Dashboard Style */}
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 pt-4">
                                    <div className="text-center md:text-left">
                                        <span className="block text-2xl font-black mb-0.5 tabular-nums">
                                            {totalLikes.toString().padStart(2, '0')}
                                        </span>
                                        <span className="text-[9px] font-black text-muted uppercase tracking-[0.2em]">Likes</span>
                                    </div>
                                    <div className="w-px h-6 bg-border" />
                                    <div className="text-center md:text-left">
                                        <span className="block text-2xl font-black mb-0.5 tabular-nums text-accent">
                                            {totalPlays.toString().padStart(2, '0')}
                                        </span>
                                        <span className="text-[9px] font-black text-muted uppercase tracking-[0.2em]">Plays</span>
                                    </div>
                                    <div className="w-px h-6 bg-border" />
                                    <div className="text-center md:text-left">
                                        <span className="block text-2xl font-black mb-0.5 tabular-nums">
                                            {beats.length.toString().padStart(2, '0')}
                                        </span>
                                        <span className="text-[9px] font-black text-muted uppercase tracking-[0.2em]">Beats</span>
                                    </div>
                                </div>
                            </div>


                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-32 relative z-20">

                    {/* Floating Search Hub */}
                    <div className="bg-card/80 backdrop-blur-3xl rounded-[3.5rem] shadow-3xl border border-border p-4 md:p-6 mb-24 ring-1 ring-border">
                        <div className="flex flex-col lg:flex-row gap-6 items-center">
                            <div className="relative flex-1 w-full group">
                                <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors" size={24} />
                                <input
                                    type="text"
                                    placeholder="¿Cuál es tu próximo hit?"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-accent-soft border border-transparent rounded-[2.5rem] pl-20 pr-10 py-6 text-lg font-bold focus:outline-none focus:ring-4 focus:ring-accent/10 focus:bg-background focus:border-accent/50 transition-all text-foreground placeholder:text-muted/50 uppercase tracking-tight"
                                />
                            </div>

                            <div className="flex items-center gap-4 w-full lg:w-auto">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        showToast("¡Enlace del catálogo copiado! 🚀", "success");
                                    }}
                                    className="p-6 bg-accent-soft text-muted rounded-[2.5rem] hover:text-accent transition-all border border-border hover:border-accent/20 flex-1 lg:flex-none flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest"
                                >
                                    <Share2 size={24} /> Compartir Catálogo
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Vitaminized Content Grid */}
                    <div className="space-y-32">


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
                                            <BeatCardPro beat={beat} compact={true} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-card rounded-[4rem] py-32 text-center border-2 border-dashed border-border">
                                    <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center text-muted/30 mx-auto mb-10 shadow-sm border border-border">
                                        <Music size={48} />
                                    </div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter text-foreground mb-4 italic">No se encontraron frecuencias</h3>
                                    <p className="text-muted text-[11px] font-black uppercase tracking-[0.3em]">Ajusta tus filtros para descubrir nuevos sonidos</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>


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
