"use client";

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import {
    ArrowLeft, Users, UserPlus, UserCheck,
    Music, Loader2, Search, MapPin, CheckCircle2, Crown
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ConnectionsPage({ params }: { params: Promise<{ username: string }> }) {
    const resolvedParams = use(params);
    const username = resolvedParams.username;
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [followers, setFollowers] = useState<any[]>([]);
    const [following, setFollowing] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const fetchConnections = async () => {
            try {
                setLoading(true);
                const { data: { user } } = await supabase.auth.getUser();
                setCurrentUserId(user?.id || null);

                // 1. Get Target Profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('id, username, artistic_name, foto_perfil')
                    .eq('username', username)
                    .single();

                if (!profileData) return;
                setProfile(profileData);

                // 2. Get Followers
                const { data: followersData } = await supabase
                    .from('follows')
                    .select(`
                        follower_id,
                        profiles!follows_follower_id_fkey (
                            id, username, artistic_name, foto_perfil, is_verified, is_founder, subscription_tier, bio
                        )
                    `)
                    .eq('following_id', profileData.id);

                // 3. Get Following
                const { data: followingData } = await supabase
                    .from('follows')
                    .select(`
                        following_id,
                        profiles!follows_following_id_fkey (
                            id, username, artistic_name, foto_perfil, is_verified, is_founder, subscription_tier, bio
                        )
                    `)
                    .eq('follower_id', profileData.id);

                setFollowers(followersData?.map(f => f.profiles).filter(Boolean) || []);
                setFollowing(followingData?.map(f => f.profiles).filter(Boolean) || []);

            } catch (err) {
                console.error("Error fetching connections:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchConnections();
    }, [username]);

    const filteredList = (activeTab === 'followers' ? followers : following).filter(u =>
        u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.artistic_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin text-accent" size={40} />
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
                {/* Header Navigation */}
                <div className="flex items-center gap-4 mb-10">
                    <button
                        onClick={() => router.back()}
                        className="p-3 bg-card border border-border rounded-2xl text-muted hover:text-accent hover:border-accent transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter">
                            Conexiones de <span className="text-accent">@{profile?.username}</span>
                        </h1>
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">Descubre su red en el Tianguis</p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-2 bg-card p-2 rounded-[2rem] border border-border mb-8 shadow-sm">
                    <button
                        onClick={() => setActiveTab('followers')}
                        className={`flex-1 py-4 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-2 ${activeTab === 'followers'
                                ? 'bg-foreground text-background shadow-xl'
                                : 'text-muted hover:bg-background'
                            }`}
                    >
                        <Users size={14} />
                        Seguidores ({followers.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('following')}
                        className={`flex-1 py-4 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-2 ${activeTab === 'following'
                                ? 'bg-foreground text-background shadow-xl'
                                : 'text-muted hover:bg-background'
                            }`}
                    >
                        <UserPlus size={14} />
                        Siguiendo ({following.length})
                    </button>
                </div>

                {/* Search in List */}
                <div className="relative mb-8">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o usuario..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-card border-border border-2 rounded-3xl pl-14 pr-6 py-5 text-sm font-bold outline-none focus:border-accent transition-all shadow-sm"
                    />
                </div>

                {/* User List */}
                <div className="grid gap-4">
                    {filteredList.length > 0 ? (
                        filteredList.map((user) => (
                            <Link
                                key={user.id}
                                href={`/${user.username}`}
                                className="bg-card border border-border p-6 rounded-[2rem] flex items-center justify-between group hover:border-accent hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
                            >
                                <div className="flex items-center gap-5">
                                    <div className={`relative w-16 h-16 rounded-[1.5rem] overflow-hidden border-2 ${user.subscription_tier === 'premium' ? 'border-blue-500' :
                                            user.subscription_tier === 'pro' ? 'border-amber-500' : 'border-border'
                                        }`}>
                                        <img
                                            src={user.foto_perfil || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                                            className="w-full h-full object-cover"
                                            alt={user.username}
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-black text-foreground group-hover:text-accent transition-colors lowercase font-heading leading-none">
                                                {user.artistic_name || user.username}
                                            </h3>
                                            {user.is_verified && <CheckCircle2 size={14} className="text-blue-500" />}
                                            {user.is_founder && <Crown size={14} className="text-amber-500" />}
                                        </div>
                                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">@{user.username}</p>
                                        <p className="text-[11px] text-muted line-clamp-1 mt-2 max-w-md font-medium">{user.bio || 'Sin biografía'}</p>
                                    </div>
                                </div>
                                <div className="bg-background p-3 rounded-2xl group-hover:bg-accent group-hover:text-white transition-all shadow-inner">
                                    <Users size={18} />
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="text-center py-24 bg-card/50 rounded-[3rem] border border-dashed border-border">
                            <Users size={48} className="mx-auto text-muted/30 mb-4" />
                            <p className="text-muted font-bold uppercase tracking-widest text-xs">No se encontraron resultados</p>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
