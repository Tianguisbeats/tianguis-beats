"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Users, ArrowLeft, Loader2, Star, Instagram, Twitter, Globe, Crown, CheckCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ArtistsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="animate-spin text-accent" size={48} />
            </div>
        }>
            <ArtistsContent />
        </Suspense>
    );
}

function ArtistsContent() {
    const [artists, setArtists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchArtists() {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, username, artistic_name, foto_perfil, subscription_tier, is_verified, is_founder, bio, created_at, social_links')
                    .order('subscription_tier', { ascending: false })
                    .limit(100);

                if (error) throw error;

                // Custom sorting: Premium > Pro > Free
                const sorted = (data || []).sort((a, b) => {
                    const order: any = { premium: 0, pro: 1, free: 2 };
                    const tierA = order[a.subscription_tier as any] ?? 3;
                    const tierB = order[b.subscription_tier as any] ?? 3;
                    if (tierA !== tierB) return tierA - tierB;
                    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
                });

                setArtists(sorted);
            } catch (err) {
                console.error("Error fetching artists:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchArtists();
    }, []);

    return (
        <div className="min-h-screen bg-background text-white flex flex-col">
            <Navbar />

            <main className="flex-1 pb-32">
                <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-16">

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-24 animate-fade-in">
                        <div className="max-w-2xl">
                            <Link href="/beats" className="inline-flex items-center gap-2 text-slate-500 hover:text-accent font-black uppercase text-[10px] tracking-widest transition-all mb-6 group">
                                <ArrowLeft size={14} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                                Regresar al Hub
                            </Link>
                            <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter mb-8 font-heading leading-none">
                                Artistas
                            </h1>
                            <p className="text-xl text-slate-400 font-medium max-w-lg leading-relaxed">
                                El motor creativo del género urbano en México. Conecta con los productores que están definiendo el sonido actual.
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-40">
                            <Loader2 className="animate-spin text-accent" size={40} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
                            {artists.map((artist) => (
                                <Link
                                    href={`/${artist.username}`}
                                    key={artist.id}
                                    className="group block animate-fade-in"
                                >
                                    <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-slate-900 mb-6 group-hover:shadow-[0_0_50px_rgba(59,130,246,0.15)] transition-all duration-500 border border-white/5 group-hover:border-accent/30">
                                        <img
                                            src={artist.foto_perfil || `https://ui-avatars.com/api/?name=${artist.artistic_name || artist.username}&background=random&color=555`}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                                            alt={artist.artistic_name}
                                        />

                                        {/* Tier Badges */}
                                        <div className="absolute top-6 right-6 flex flex-col gap-2">
                                            {artist.subscription_tier === 'premium' && (
                                                <div className="bg-amber-500 text-white p-2 rounded-xl shadow-lg animate-pulse">
                                                    <Crown size={18} fill="currentColor" />
                                                </div>
                                            )}
                                            {artist.is_verified && (
                                                <div className="bg-blue-500 text-white p-2 rounded-xl shadow-lg">
                                                    <CheckCheck size={18} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>

                                        <div className="absolute bottom-8 left-8 right-8">
                                            <h3 className="text-2xl font-black uppercase tracking-tight font-heading leading-tight mb-1 group-hover:text-accent transition-colors">
                                                {artist.artistic_name || artist.username}
                                            </h3>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                                {artist.subscription_tier === 'premium' ? 'Verified Producer' : artist.subscription_tier === 'pro' ? 'Pro Producer' : 'Rising Artist'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="px-4">
                                        <p className="text-xs text-slate-500 line-clamp-2 font-medium leading-relaxed italic opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-500">
                                            {artist.bio || "Este productor prefiere que su música hable por él. Explora su catálogo completo."}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
