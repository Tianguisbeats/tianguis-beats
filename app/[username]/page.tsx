"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import {
    User,
    Music,
    Crown,
    Loader2,
    Play,
    Pause,
    ArrowRight
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { usePlayer } from '@/context/PlayerContext';

export default function PublicProfilePage() {
    const params = useParams();
    const router = useRouter();
    const username = (params.username as string)?.toLowerCase();

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [beats, setBeats] = useState<any[]>([]);
    const { currentBeat, isPlaying, playBeat } = usePlayer();

    useEffect(() => {
        if (!username) return;

        const fetchData = async () => {
            setLoading(true);

            // Fetch Profile by Username
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('username', username)
                .maybeSingle();

            if (profileError || !profileData) {
                // If not found, maybe redirect to 404 or show error
                // For now, just set profile null
                setLoading(false);
                return;
            }

            setProfile(profileData);

            // Fetch Beats if producer
            if (profileData.role === 'producer') {
                const { data: beatsData, error: beatsError } = await supabase
                    .from('beats')
                    .select('*')
                    .eq('producer_id', profileData.id)
                    .order('created_at', { ascending: false });

                if (beatsData) {
                    // Start getting public URLs
                    // Note: This is an async map properly handled?
                    // We need to resolve standard publicUrls

                    const transformed = beatsData.map(b => {
                        const { data: { publicUrl } } = supabase.storage
                            .from('beats-previews')
                            .getPublicUrl(b.mp3_url);

                        return {
                            ...b,
                            producer: profileData.display_name || profileData.username,
                            mp3_url: publicUrl
                        };
                    });
                    setBeats(transformed);
                }
            }
            setLoading(false);
        };

        fetchData();
    }, [username]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-white text-slate-900 flex flex-col">
                <Navbar />
                <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-4 text-center">
                    <User size={64} className="text-slate-300 mb-6" />
                    <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">Usuario no encontrado</h1>
                    <p className="text-slate-500 font-medium mb-8">El perfil @{username} no existe o no está disponible.</p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                    >
                        Volver al Inicio
                    </button>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
            <Navbar />

            <main className="flex-1 pt-32 pb-20 px-4">
                <div className="max-w-4xl mx-auto">

                    {/* Header Card */}
                    <div className="bg-slate-50 border border-slate-100 rounded-[3rem] p-8 md:p-12 text-center relative overflow-hidden mb-12">
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-50 to-transparent"></div>

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-32 h-32 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white mb-6 shadow-2xl shadow-blue-600/20 rotate-3 overflow-hidden border-4 border-white">
                                {profile.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt={profile.display_name}
                                        className="w-full h-full object-cover -rotate-3 scale-110"
                                    />
                                ) : (
                                    <User size={48} />
                                )}
                            </div>

                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-2">{profile.display_name}</h1>
                            <p className="text-blue-600 font-black uppercase tracking-widest text-sm mb-6">@{profile.username}</p>

                            <div className="flex flex-wrap justify-center gap-3">
                                <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest bg-slate-200 text-slate-700`}>
                                    {profile.role === 'producer' ? 'Productor' : 'Artista'}
                                </div>
                                {profile.subscription_tier === 'premium' && (
                                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest bg-purple-100 text-purple-600">
                                        <Crown size={14} /> Premium
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Beats Section (Only for Producers) */}
                    {profile.role === 'producer' && (
                        <div>
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-black uppercase tracking-tight">Beats de <span className="text-blue-600">{profile.display_name}</span></h3>
                            </div>

                            {beats.length > 0 ? (
                                <div className="grid gap-4">
                                    {beats.map((beat) => (
                                        <div key={beat.id} className="bg-white border-2 border-slate-50 hover:border-blue-100 p-6 rounded-[2rem] flex items-center justify-between group transition-all shadow-sm hover:shadow-md">
                                            <div className="flex items-center gap-5">
                                                <button
                                                    onClick={() => playBeat(beat)}
                                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all scale-100 group-hover:scale-105 ${currentBeat?.id === beat.id && isPlaying ? 'bg-blue-600 text-white shadow-blue-600/30' : 'bg-slate-50 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                                                >
                                                    {currentBeat?.id === beat.id && isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                                                </button>
                                                <div>
                                                    <h4 className="font-black uppercase tracking-tight text-lg leading-none mb-2">{beat.title}</h4>
                                                    <div className="flex flex-wrap gap-2 md:gap-3">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{beat.genre}</span>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{beat.bpm} BPM</span>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded-md">${beat.price_mxn} MXN</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button className="hidden md:flex bg-slate-900 text-white w-10 h-10 rounded-xl items-center justify-center hover:bg-blue-600 transition-colors">
                                                <ArrowRight size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-12 rounded-[2.5rem] text-center">
                                    <Music className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-400 font-bold text-sm">Este productor aún no ha subido beats.</p>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </main>

            <Footer />
        </div>
    );
}
