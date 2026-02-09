import React from 'react';
import Link from 'next/link';
import { ChevronRight, Crown, Check, ExternalLink, Users } from 'lucide-react';

interface ArtistCardProps {
    artist: {
        id: string;
        username: string;
        artistic_name: string;
        foto_perfil: string;
        subscription_tier: string;
        is_verified: boolean;
        is_founder: boolean;
        bio?: string;
        social_links?: any;
    };
}

export default function ArtistCard({ artist }: ArtistCardProps) {
    const isPremium = artist.subscription_tier === 'premium';
    const isPro = artist.subscription_tier === 'pro';

    return (
        <Link
            href={`/${artist.username}`}
            className="group relative bg-card/60 backdrop-blur-xl rounded-[2.5rem] p-6 border border-border hover:border-accent/40 hover:shadow-2xl hover:shadow-accent/5 transition-all duration-500 hover:-translate-y-2 flex flex-col h-full overflow-hidden"
        >
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br transition-opacity duration-500 opacity-10 group-hover:opacity-20 ${isPremium ? 'from-amber-400 to-transparent' : isPro ? 'from-accent to-transparent' : 'from-slate-400 to-transparent'}`}></div>

            {/* Profile Section */}
            <div className="relative mb-6 flex flex-col items-center text-center">
                <div className={`relative w-28 h-28 md:w-32 md:h-32 rounded-full p-1.5 border-2 transition-transform duration-700 group-hover:scale-105 ${isPremium ? 'border-amber-400' : isPro ? 'border-accent' : 'border-border'}`}>
                    <img
                        src={artist.foto_perfil || `https://ui-avatars.com/api/?name=${artist.artistic_name || artist.username}&background=random`}
                        className="w-full h-full object-cover rounded-full shadow-2xl"
                        alt={artist.artistic_name}
                    />

                    {isPremium && (
                        <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-2 rounded-xl shadow-xl animate-bounce">
                            <Crown size={16} fill="currentColor" />
                        </div>
                    )}
                </div>

                <div className="mt-6">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                        <h3 className="text-xl font-black text-foreground tracking-tighter lowercase font-heading truncate max-w-[200px]">
                            {artist.artistic_name || artist.username}
                        </h3>
                        {artist.is_verified && <Check size={16} className="text-blue-500 shrink-0" />}
                        {artist.is_founder && <Crown size={14} className="text-amber-500 fill-amber-500 shrink-0" />}
                    </div>
                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">@{artist.username}</p>
                </div>
            </div>

            {/* Bio Snippet */}
            <p className="text-xs text-muted font-medium line-clamp-2 text-center mb-8 leading-relaxed font-body">
                {artist.bio || "Productor de la escena nacional mexicana. Descubre su sonido único."}
            </p>

            {/* Stats/Badges Row */}
            <div className="mt-auto pt-6 border-t border-border flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[8px] text-muted font-black uppercase tracking-[0.2em] mb-1 italic">Nivel</span>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isPremium ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                            isPro ? 'bg-accent/10 text-accent border border-accent/20' :
                                'bg-muted/10 text-muted border border-muted/20'
                        }`}>
                        {artist.subscription_tier || 'Free'}
                    </span>
                </div>

                <div className="w-10 h-10 rounded-2xl bg-foreground text-background flex items-center justify-center transition-all group-hover:bg-accent group-hover:text-white shadow-xl">
                    <ChevronRight size={20} />
                </div>
            </div>
        </Link>
    );
}
