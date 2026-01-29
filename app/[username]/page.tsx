"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import {
    User, Music, Crown, Loader2, Play, Pause,
    Instagram, Youtube, Twitter, Check,
    Calendar, MapPin, Share2, MoreHorizontal, ExternalLink
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { usePlayer } from '@/context/PlayerContext';
import { Profile, Beat } from '@/lib/types';

export default function PublicProfilePage() {
    const params = useParams();
    const router = useRouter();
    const usernameParam = (params.username as string)?.toLowerCase();

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [beats, setBeats] = useState<Beat[]>([]);
    const { currentBeat, isPlaying, playBeat } = usePlayer();

    useEffect(() => {
        if (!usernameParam) return;

        const fetchData = async () => {
            setLoading(true);

            // Fetch Profile by Username
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .ilike('username', usernameParam)
                .maybeSingle();

            if (profileError || !profileData) {
                setLoading(false);
                return;
            }

            setProfile(profileData);

            // Fetch Beats
            const { data: beatsData, error: beatsError } = await supabase
                .from('beats')
                .select('*, producer:producer_id(artistic_name)')
                .eq('producer_id', profileData.id)
                .order('created_at', { ascending: false });

            if (beatsData) {
                const transformed = beatsData.map(b => {
                    const { data: { publicUrl } } = supabase.storage
                        .from('beats-previews')
                        .getPublicUrl(b.mp3_url);

                    const { data: { publicUrl: coverUrl } } = b.cover_url
                        ? supabase.storage.from('beats-previews').getPublicUrl(b.cover_url)
                        : { data: { publicUrl: null } };

                    return {
                        ...b,
                        mp3_url: publicUrl,
                        cover_url: coverUrl
                    };
                });
                setBeats(transformed);
            }
            setLoading(false);
        };

        fetchData();
    }, [usernameParam]);

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
                    <User size={64} className="text-slate-200 mb-6" />
                    <h1 className="text-3xl font-black uppercase tracking-tighter mb-4 text-slate-400">Perfil no encontrado</h1>
                    <p className="text-slate-400 font-medium mb-8">El usuario @{usernameParam} todavía no aterriza en el Tianguis.</p>
                    <button onClick={() => router.push('/')} className="bg-slate-900 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs">
                        Explorar el Tianguis
                    </button>
                </main>
                <Footer />
            </div>
        );
    }

    const socialLinks = profile.social_links || {};

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
            <Navbar />

            <main className="flex-1 pb-20">
                {/* HERO AREA (Facebook-style) */}
                <div className="relative h-64 md:h-80 bg-slate-200 overflow-hidden">
                    {profile.cover_url ? (
                        <img src={profile.cover_url} className="w-full h-full object-cover" alt="Cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-blue-600 to-indigo-700 opacity-20"></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
                </div>

                {/* PROFILE HEADER CARD */}
                <div className="max-w-6xl mx-auto px-4 relative -mt-20 md:-mt-24">
                    <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-slate-200/50 border border-slate-100 mb-8">
                        <div className="flex flex-col md:flex-row gap-8 items-center md:items-end">
                            {/* Avatar with Membership Border */}
                            <div className={`relative w-40 h-40 md:w-48 md:h-48 rounded-[3rem] p-2 bg-white shadow-xl shadow-slate-200/50 -mt-24 md:-mt-32 ${profile.subscription_tier === 'premium' ? 'ring-8 ring-blue-600/10' :
                                    profile.subscription_tier === 'pro' ? 'ring-8 ring-slate-100' : ''
                                }`}>
                                <div className={`w-full h-full rounded-[2.5rem] overflow-hidden border-4 transition-all ${profile.subscription_tier === 'premium' ? 'border-blue-600' :
                                        profile.subscription_tier === 'pro' ? 'border-slate-400' : 'border-slate-100'
                                    }`}>
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} className="w-full h-full object-cover" alt={profile.username} />
                                    ) : (
                                        <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                                            <User size={64} />
                                        </div>
                                    )}
                                </div>

                                {/* Status Badge (Corner) */}
                                {profile.subscription_tier === 'premium' && (
                                    <div className="absolute -top-2 -right-2 bg-blue-600 text-white p-2 rounded-2xl shadow-lg shadow-blue-600/20">
                                        <Crown size={20} />
                                    </div>
                                )}
                            </div>

                            {/* Info Section */}
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">{profile.artistic_name || profile.full_name || profile.username}</h1>

                                    <div className="flex items-center gap-2">
                                        {profile.is_verified && (
                                            <div className="bg-blue-600 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-blue-600/20">
                                                <Check size={12} strokeWidth={4} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Verificado</span>
                                            </div>
                                        )}
                                        {profile.is_founder && (
                                            <div className="bg-yellow-400 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-yellow-400/20">
                                                <Crown size={12} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Founder</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="text-blue-600 font-black uppercase tracking-[0.2em] text-sm mb-6 flex items-center justify-center md:justify-start gap-2">
                                    @{profile.username}
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    <span className="text-slate-400">{profile.role === 'producer' ? 'Productor' : 'Artista'}</span>
                                </p>

                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <div className="flex items-center gap-2">
                                        <Music size={14} className="text-blue-600" /> {beats.length} Beats
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} /> Miembro desde {new Date(profile.created_at).getFullYear()}
                                    </div>
                                    {profile.bio && (
                                        <div className="w-full md:w-auto mt-2 md:mt-0 text-slate-600 normal-case tracking-normal font-medium text-sm">
                                            {profile.bio}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all text-slate-600">
                                    <Share2 size={20} />
                                </button>
                                <button className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all text-slate-600">
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Social Links & Tiers */}
                        <div className="mt-12 pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex gap-4">
                                {socialLinks.instagram && (
                                    <a href={`https://instagram.com/${socialLinks.instagram}`} target="_blank" className="social-pill">
                                        <Instagram size={18} /> Instagram
                                    </a>
                                )}
                                {socialLinks.youtube && (
                                    <a href={`https://youtube.com/@${socialLinks.youtube}`} target="_blank" className="social-pill">
                                        <Youtube size={18} /> Youtube
                                    </a>
                                )}
                                {socialLinks.twitter && (
                                    <a href={`https://twitter.com/${socialLinks.twitter}`} target="_blank" className="social-pill">
                                        <Twitter size={18} /> Twitter
                                    </a>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status en el Tianguis:</p>
                                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${profile.subscription_tier === 'premium' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' :
                                        profile.subscription_tier === 'pro' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    Plan {profile.subscription_tier}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BEATS FEED */}
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                                <h3 className="text-lg font-black uppercase tracking-tight mb-6">Información</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">País</span>
                                        <span className="text-sm font-black flex items-center gap-1"><MapPin size={14} className="text-red-500" /> México</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Colaboraciones</span>
                                        <span className="text-sm font-black">Abiertas</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Beat List */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-2xl font-black uppercase tracking-tighter">Catálogo de <span className="text-blue-600">Beats</span></h3>
                                <div className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-slate-50 rounded-lg text-slate-400">
                                    {beats.length} resultados
                                </div>
                            </div>

                            {beats.length > 0 ? (
                                <div className="space-y-4">
                                    {beats.map((beat) => (
                                        <div key={beat.id} className="bg-white p-5 rounded-[2rem] border border-slate-50 hover:border-blue-100 shadow-sm hover:shadow-xl hover:shadow-blue-600/5 transition-all flex items-center gap-5 group">
                                            <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 shadow-inner">
                                                {beat.cover_url ? (
                                                    <img src={beat.cover_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={beat.title} />
                                                ) : <Music className="w-full h-full p-4 text-slate-300" />}

                                                <button
                                                    onClick={() => playBeat(beat)}
                                                    className={`absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity ${currentBeat?.id === beat.id && isPlaying ? 'opacity-100 bg-blue-600/60' : ''}`}
                                                >
                                                    {currentBeat?.id === beat.id && isPlaying ? <Pause size={24} /> : <Play size={24} />}
                                                </button>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-black uppercase tracking-tight text-lg text-slate-900 truncate leading-tight mb-1">{beat.title}</h4>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">{beat.genre}</span>
                                                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                                    <span className="text-[10px] font-bold text-slate-400 tracking-widest">{beat.bpm} BPM</span>
                                                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                                    <span className="text-[10px] font-bold text-slate-400 tracking-widest">{beat.musical_key}{beat.musical_scale === 'Menor' ? 'm' : ''}</span>
                                                </div>
                                            </div>

                                            <div className="text-right flex flex-col items-end gap-2 pr-2">
                                                <p className="text-sm font-black text-slate-900">${beat.price_mxn}</p>
                                                <button onClick={() => router.push(`/beats/${beat.id}`)} className="text-blue-600 hover:text-slate-900 transition-colors">
                                                    <ExternalLink size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-slate-50 rounded-[3rem] p-16 text-center border-2 border-dashed border-slate-200">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-6">
                                        <Music size={32} />
                                    </div>
                                    <h4 className="text-xl font-black uppercase tracking-tight text-slate-400">Silencio total</h4>
                                    <p className="text-slate-400 text-sm font-medium">Este productor aún no ha soltado su primer hit.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            <style jsx>{`
                .social-pill {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.25rem;
                    border-radius: 1rem;
                    background: #f8fafc;
                    border: 1px solid #f1f5f9;
                    font-size: 10px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: #475569;
                    transition: all 0.2s;
                }
                .social-pill:hover {
                    background: #2563eb;
                    color: white;
                    border-color: #2563eb;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(37, 99, 235, 0.1);
                }
            `}</style>
        </div>
    );
}
