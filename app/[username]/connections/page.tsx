"use client";

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import {
    ArrowLeft, Users, UserPlus, UserCheck,
    Loader2, Search, Crown
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
    const [userFollowingSet, setUserFollowingSet] = useState<Set<string>>(new Set());

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
                    .select('profiles:follower_id (id, username, artistic_name, foto_perfil, is_verified, is_founder, subscription_tier, bio)')
                    .eq('following_id', profileData.id);

                // 3. Get Following
                const { data: followingData } = await supabase
                    .from('follows')
                    .select('profiles:following_id (id, username, artistic_name, foto_perfil, is_verified, is_founder, subscription_tier, bio)')
                    .eq('follower_id', profileData.id);

                setFollowers(followersData?.map(f => f.profiles).filter(Boolean) || []);
                setFollowing(followingData?.map(f => f.profiles).filter(Boolean) || []);

                // 4. Get Current User's following list to show follow buttons correctly
                if (user) {
                    const { data: myFollowing } = await supabase
                        .from('follows')
                        .select('following_id')
                        .eq('follower_id', user.id);

                    setUserFollowingSet(new Set(myFollowing?.map(f => f.following_id) || []));
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
                await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', targetUserId);
                const newSet = new Set(userFollowingSet);
                newSet.delete(targetUserId);
                setUserFollowingSet(newSet);
            } else {
                await supabase.from('follows').insert({ follower_id: currentUserId, following_id: targetUserId });
                const newSet = new Set(userFollowingSet);
                newSet.add(targetUserId);
                setUserFollowingSet(newSet);
            }
        } catch (error) {
            console.error("Error toggling follow:", error);
        }
    };

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
                <div className="flex items-center gap-6 mb-12">
                    <button
                        onClick={() => router.back()}
                        className="p-4 bg-card border border-border rounded-2xl text-muted hover:text-accent hover:border-accent transition-all shadow-sm group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-black text-foreground uppercase tracking-tighter">
                            Lista de amigos de <span className="text-accent underline decoration-4 underline-offset-8">@{profile?.artistic_name || profile?.username}</span>
                        </h1>
                        <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] mt-3">Miembros de la comunidad Tianguis</p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-2 bg-card/50 backdrop-blur-xl p-2 rounded-[2.5rem] border border-border/50 mb-10 shadow-sm">
                    <button
                        onClick={() => setActiveTab('followers')}
                        className={`flex-1 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-2 ${activeTab === 'followers'
                            ? 'bg-foreground dark:bg-white text-background dark:text-slate-900 shadow-2xl'
                            : 'text-muted hover:bg-background/50'
                            }`}
                    >
                        <Users size={14} />
                        Seguidores ({followers.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('following')}
                        className={`flex-1 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-2 ${activeTab === 'following'
                            ? 'bg-foreground dark:bg-white text-background dark:text-slate-900 shadow-2xl'
                            : 'text-muted hover:bg-background/50'
                            }`}
                    >
                        <UserPlus size={14} />
                        Siguiendo ({following.length})
                    </button>
                </div>

                {/* Search in List */}
                <div className="relative mb-12">
                    <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar en la red..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-card/30 border-border/50 border-2 rounded-[2rem] pl-16 pr-8 py-6 text-sm font-bold outline-none focus:border-accent transition-all shadow-sm"
                    />
                </div>

                {/* User List */}
                <div className="grid gap-6">
                    {filteredList.length > 0 ? (
                        filteredList.map((user) => (
                            <Link
                                key={user.id}
                                href={`/${user.username}`}
                                className="bg-card/40 backdrop-blur-md border border-border/50 p-4 sm:p-6 rounded-[2.5rem] flex items-center justify-between group hover:border-accent hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
                            >
                                <div className="flex items-center gap-4 sm:gap-6">
                                    <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-[2rem] overflow-hidden border-2 transition-transform duration-500 group-hover:scale-105 ${user.subscription_tier === 'premium' ? 'border-blue-500' :
                                        user.subscription_tier === 'pro' ? 'border-amber-500' : 'border-border'
                                        }`}>
                                        <img
                                            src={user.foto_perfil || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                                            className="w-full h-full object-cover"
                                            alt={user.username}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg sm:text-2xl font-black text-foreground group-hover:text-accent transition-colors lowercase font-heading leading-tight">
                                                {user.artistic_name || user.username}
                                            </h3>
                                            <div className="flex items-center gap-1.5 ml-1">
                                                {user.is_verified && <img src="/verified-badge.png" className="w-5 h-5 shadow-lg shadow-blue-500/20" alt="V" />}
                                                {user.is_founder && <Crown size={18} className="text-amber-500" fill="currentColor" />}
                                            </div>
                                        </div>
                                        <p className="text-[11px] font-black text-muted uppercase tracking-[0.2em]">@{user.username}</p>
                                    </div>
                                </div>

                                {/* Follow Button */}
                                {currentUserId !== user.id && (
                                    <button
                                        onClick={(e) => handleFollowToggle(user.id, e)}
                                        className={`px-6 py-3 sm:px-8 sm:py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg ${userFollowingSet.has(user.id)
                                            ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-500/10 dark:hover:text-red-400'
                                            : 'bg-foreground dark:bg-white text-background dark:text-slate-900 hover:bg-accent dark:hover:bg-accent hover:text-white dark:hover:text-white shadow-accent/10'
                                            }`}
                                    >
                                        {userFollowingSet.has(user.id) ? 'Siguiendo' : 'Seguir'}
                                    </button>
                                )}
                            </Link>
                        ))
                    ) : (
                        <div className="text-center py-32 bg-card/20 rounded-[3.5rem] border border-dashed border-border/50">
                            <Users size={64} className="mx-auto text-muted/20 mb-6" />
                            <p className="text-muted font-black uppercase tracking-[0.3em] text-[10px]">Sin resultados en esta sección</p>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
