"use client";

import React, { useEffect, useState, use, Suspense } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Users, UserPlus, Loader2, Search, Crown, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ParallaxBackground, FloatingParticles, ScrollReveal, AbstractTrianglesBack, AbstractPuzzleBack, NoiseOverlay
} from "@/components/ui/BackgroundEffects";

function ConnectionsContent({ username }: { username: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = (searchParams.get('tab') as 'followers' | 'following') || 'followers';

    const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [followers, setFollowers] = useState<any[]>([]);
    const [following, setFollowing] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [userFollowingSet, setUserFollowingSet] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchConnections = async () => {
            try {
                setLoading(true);
                const { data: { user } } = await supabase.auth.getUser();
                setCurrentUserId(user?.id || null);

                // 1. Get Target Profile
                const { data: profileData } = await supabase
                    .from('perfiles')
                    .select('id, nombre_usuario, nombre_artistico, foto_perfil, esta_verificado, es_fundador')
                    .eq('nombre_usuario', username)
                    .single();

                if (!profileData) return;
                setProfile(profileData);

                // 2. Get Followers
                const { data: followersData } = await supabase
                    .from('seguidores')
                    .select('perfiles:seguidor_id (id, nombre_usuario, nombre_artistico, foto_perfil, esta_verificado, es_fundador, nivel_suscripcion, biografia)')
                    .eq('seguido_id', profileData.id);

                // 3. Get Following
                const { data: followingData } = await supabase
                    .from('seguidores')
                    .select('perfiles:seguido_id (id, nombre_usuario, nombre_artistico, foto_perfil, esta_verificado, es_fundador, nivel_suscripcion, biografia)')
                    .eq('seguidor_id', profileData.id);

                setFollowers(followersData?.map(f => (f as any).perfiles).filter(Boolean) || []);
                setFollowing(followingData?.map(f => (f as any).perfiles).filter(Boolean) || []);

                // 4. Get Current User's following list
                if (user) {
                    const { data: myFollowing } = await supabase
                        .from('seguidores')
                        .select('seguido_id')
                        .eq('seguidor_id', user.id);

                    setUserFollowingSet(new Set(myFollowing?.map(f => f.seguido_id) || []));
                }

            } catch (err) {
                console.error("Error fetching connections:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchConnections();
    }, [username]);

    const handleFollowToggle = async (targetUserId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentUserId) return router.push('/login');
        if (targetUserId === currentUserId) return;

        const isFollowing = userFollowingSet.has(targetUserId);

        try {
            if (isFollowing) {
                await supabase.from('seguidores').delete().eq('seguidor_id', currentUserId).eq('seguido_id', targetUserId);
                const newSet = new Set(userFollowingSet);
                newSet.delete(targetUserId);
                setUserFollowingSet(newSet);
            } else {
                await supabase.from('seguidores').insert({ seguidor_id: currentUserId, seguido_id: targetUserId });
                const newSet = new Set(userFollowingSet);
                newSet.add(targetUserId);
                setUserFollowingSet(newSet);
            }
        } catch (error) {
            console.error("Error toggling follow:", error);
        }
    };

    const filteredList = (activeTab === 'followers' ? followers : following).filter(u =>
        u.nombre_usuario?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.nombre_artistico?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 py-40">
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-2xl animate-pulse" />
                    <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin relative z-10" />
                </div>
                <p className="text-[10px] font-black text-muted uppercase tracking-[0.4em] animate-pulse">Analizando Red Social...</p>
            </div>
        );
    }

    return (
        <main className="flex-1 relative pb-32">
            {/* ── PREMIUM HERO ── */}
            <div className="relative pt-28 pb-16 md:pb-24 overflow-hidden bg-background">
                <div className="absolute inset-0 z-0">
                    <AbstractPuzzleBack theme="blue" />
                    <NoiseOverlay />
                </div>
                
                {/* Background Text Decoration */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                    <motion.h2 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0.03, scale: 1 }}
                        transition={{ duration: 1.5 }}
                        className="text-[30vw] font-black uppercase tracking-tighter text-blue-500 whitespace-nowrap select-none italic"
                    >
                        {activeTab === 'followers' ? 'Followers' : 'Following'}
                    </motion.h2>
                </div>

                <div className="max-w-6xl mx-auto px-5 relative z-10">
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => router.push(`/${profile?.nombre_usuario}`)}
                        className="group flex items-center gap-4 text-muted/50 hover:text-blue-500 font-black uppercase text-[10px] tracking-[0.3em] transition-all mb-12"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-all">
                            <ArrowLeft size={16} />
                        </div>
                        Ver {profile?.nombre_artistico || profile?.nombre_usuario}
                    </motion.button>

                    <div className="flex flex-col md:flex-row items-center md:items-end gap-8 text-center md:text-left">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] overflow-hidden border-2 border-white/5 bg-background shadow-2xl relative group/pfp"
                        >
                            <Image src={profile?.foto_perfil || `https://ui-avatars.com/api/?name=${username}`} alt="" fill sizes="(max-width: 768px) 96px, 128px" className="object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                        
                        <div className="flex-1">
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-4"
                            >
                                <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[9px] font-black uppercase tracking-widest rounded-full">Red Comunidad</span>
                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                <span className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Conexiones Profesionales</span>
                            </motion.div>
                            
                            <motion.h1 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8] mb-4 text-foreground italic flex flex-wrap justify-center md:justify-start"
                            >
                                {activeTab === 'followers' ? 'Seguidores' : 'Siguiendo'}
                            </motion.h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── CONTROLES Y LISTA ── */}
            <div className="max-w-6xl mx-auto px-5 -mt-8 md:-mt-12 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    {/* Sidebar de Filtros */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="p-4 rounded-[2.5rem] bg-white/[0.03] dark:bg-black/40 backdrop-blur-3xl border border-white/5 shadow-2xl space-y-3">
                            <button
                                onClick={() => setActiveTab('followers')}
                                className={`w-full flex items-center justify-between px-6 py-5 rounded-3xl transition-all group ${activeTab === 'followers'
                                    ? 'bg-blue-500 text-white shadow-xl shadow-blue-500/20'
                                    : 'bg-white/5 text-muted hover:text-foreground hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <Users size={18} className={activeTab === 'followers' ? 'text-white' : 'text-blue-500'} />
                                    <span className="font-black uppercase tracking-widest text-[10px]">Seguidores</span>
                                </div>
                                <span className={`text-[10px] font-black ${activeTab === 'followers' ? 'opacity-80' : 'text-blue-500'}`}>{followers.length}</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('following')}
                                className={`w-full flex items-center justify-between px-6 py-5 rounded-3xl transition-all group ${activeTab === 'following'
                                    ? 'bg-blue-500 text-white shadow-xl shadow-blue-500/20'
                                    : 'bg-white/5 text-muted hover:text-foreground hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <UserPlus size={18} className={activeTab === 'following' ? 'text-white' : 'text-blue-500'} />
                                    <span className="font-black uppercase tracking-widest text-[10px]">Siguiendo</span>
                                </div>
                                <span className={`text-[10px] font-black ${activeTab === 'following' ? 'opacity-80' : 'text-blue-500'}`}>{following.length}</span>
                            </button>
                        </div>

                        {/* Buscador */}
                        <div className="relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-blue-500 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Filtrar por nombre..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/[0.03] dark:bg-black/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] pl-14 pr-6 py-4 text-[11px] font-bold text-foreground uppercase tracking-widest focus:outline-none focus:border-blue-500/30 transition-all placeholder:text-muted/40"
                            />
                        </div>
                    </div>

                    {/* Lista de Usuarios */}
                    <div className="lg:col-span-3">
                        <div className="grid gap-4">
                            <AnimatePresence mode="popLayout">
                                {filteredList.length > 0 ? (
                                    filteredList.map((user, i) => (
                                        <motion.div
                                            key={user.id}
                                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                            transition={{ delay: i * 0.05 }}
                                            layout
                                        >
                                            <Link
                                                href={`/${user.nombre_usuario}`}
                                                className="group relative flex flex-col md:flex-row md:items-center justify-between gap-6 p-5 rounded-[2.5rem] bg-white/[0.02] dark:bg-black/20 border border-white/5 hover:border-blue-500/30 hover:bg-white/[0.04] transition-all duration-500 overflow-hidden"
                                            >
                                                {/* Interaction Hint Background */}
                                                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                
                                                <div className="flex items-center gap-5 relative z-10 flex-1 min-w-0">
                                                    <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-3xl overflow-hidden shrink-0 border-2 transition-all duration-500 group-hover:rotate-3 ${
                                                        user.nivel_suscripcion?.toLowerCase() === 'premium' ? 'border-blue-500 shadow-lg shadow-blue-500/20' :
                                                        user.nivel_suscripcion?.toLowerCase() === 'pro' ? 'border-amber-400 shadow-lg shadow-amber-400/20' : 
                                                        'border-white/5'
                                                    }`}>
                                                        <Image
                                                            src={user.foto_perfil || `https://ui-avatars.com/api/?name=${user.nombre_usuario}`}
                                                            fill
                                                            sizes="(max-width: 768px) 64px, 80px"
                                                            className="object-cover"
                                                            alt=""
                                                        />
                                                    </div>
                                                    
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="text-xl md:text-2xl font-black text-foreground group-hover:text-blue-400 transition-colors uppercase tracking-tighter truncate">
                                                                {user.nombre_artistico || user.nombre_usuario}
                                                            </h3>
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                {user.esta_verificado && <CheckCircle2 size={16} className="text-blue-500 fill-blue-500/10" />}
                                                                {user.es_fundador && <Crown size={16} className="text-amber-500" fill="currentColor" />}
                                                            </div>
                                                        </div>
                                                        <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] flex items-center gap-2">
                                                            @{user.nombre_usuario}
                                                            {user.biografia && (
                                                                <>
                                                                    <span className="w-1 h-1 rounded-full bg-white/10" />
                                                                    <span className="lowercase italic font-medium opacity-50 truncate max-w-[200px] hidden sm:block">
                                                                        {user.biografia}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 shrink-0 relative z-10 pr-2">
                                                    {currentUserId !== user.id && (
                                                        <button
                                                            onClick={(e) => handleFollowToggle(user.id, e)}
                                                            className={`px-8 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl ${
                                                                userFollowingSet.has(user.id)
                                                                    ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-red-500 hover:text-white hover:border-red-500'
                                                                    : 'bg-foreground dark:bg-white text-background dark:text-black hover:scale-[1.05]'
                                                            }`}
                                                        >
                                                            {userFollowingSet.has(user.id) ? 'Siguiendo' : 'Seguir'}
                                                        </button>
                                                    )}
                                                    <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-muted group-hover:text-blue-400 transition-colors">
                                                        <ArrowLeft size={16} className="rotate-180" />
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    ))
                                ) : (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-24 bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem] backdrop-blur-xl"
                                    >
                                        <div className="w-20 h-20 bg-blue-500/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-blue-500/10">
                                            <Users size={40} className="text-blue-500/30" strokeWidth={1} />
                                        </div>
                                        <h3 className="text-3xl font-black uppercase tracking-tighter text-foreground mb-3 opacity-60">Sin Resultados.</h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted/30">Intenta con otro criterio de búsqueda</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function ConnectionsPage({ params }: { params: Promise<{ username: string }> }) {
    const resolvedParams = use(params);
    
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-blue-500 selection:text-white">
            <Navbar />
            
            <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                </div>
            }>
                <ConnectionsContent username={resolvedParams.username} />
            </Suspense>
            
            <Footer />
        </div>
    );
}
