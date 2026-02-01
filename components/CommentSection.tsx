import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, User, Trash2, Crown } from 'lucide-react';

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    user: {
        username: string;
        artistic_name: string;
        avatar_url: string | null;
        is_verified?: boolean;
        is_founder?: boolean;
        subscription_tier?: string;
    }
}

export default function CommentSection({ beatId }: { beatId: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<string | null>(null);

    useEffect(() => {
        const fetchComments = async () => {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user ? user.id : null);

            // Fetch comments with user profile (username, artistic_name, avatar, badges, tier)
            const { data, error } = await supabase
                .from('comments')
                .select(`
                    id,
                    content,
                    created_at,
                    user_id,
                    user:user_id (
                        username,
                        artistic_name,
                        avatar_url,
                        is_verified,
                        is_founder,
                        subscription_tier
                    )
                `)
                .eq('beat_id', beatId)
                .order('created_at', { ascending: false });

            if (data) {
                const formatted = data.map((c: any) => ({
                    ...c,
                    user: c.user || { username: 'Usuario', artistic_name: 'Usuario', avatar_url: null }
                }));
                setComments(formatted);
            }
        };

        fetchComments();

        // Subscribe to real-time changes
        const channel = supabase
            .channel('public:comments')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `beat_id=eq.${beatId}` }, (payload) => {
                const fetchNewComment = async () => {
                    const { data } = await supabase
                        .from('comments')
                        .select(`id, content, created_at, user_id, user:user_id (username, artistic_name, avatar_url, is_verified, is_founder, subscription_tier)`)
                        .eq('id', (payload.new as any).id)
                        .single();
                    if (data) {
                        setComments(prev => [{ ...data, user: (data as any).user || { username: 'Usuario', artistic_name: 'Usuario', avatar_url: null } } as Comment, ...prev]);
                    }
                };
                fetchNewComment();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [beatId]);

    const handlePostComment = async () => {
        if (!commentText.trim()) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('Inicia sesión para comentar');
            return;
        }

        setIsLoading(true);
        const { error } = await supabase.from('comments').insert({
            content: commentText.trim(),
            beat_id: beatId,
            user_id: user.id
        });

        if (error) {
            console.error('Error posting comment:', error);
        } else {
            setCommentText('');
        }
        setIsLoading(false);
    };

    const handleDelete = async (commentId: string) => {
        const { error } = await supabase.from('comments').delete().eq('id', commentId);
        if (!error) {
            setComments(prev => prev.filter(c => c.id !== commentId));
        }
    };

    return (
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm mt-8">
            <h3 className="font-black text-2xl uppercase tracking-tighter mb-8 text-slate-900">
                Comentarios <span className="text-slate-300 ml-2">{comments.length}</span>
            </h3>

            {/* Input */}
            <div className="flex gap-4 mb-8">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <User size={20} className="text-slate-400" />
                </div>
                <div className="flex-1 relative">
                    <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Deja un comentario..."
                        className="w-full bg-slate-50 rounded-2xl p-4 pr-12 text-sm font-medium border border-transparent focus:border-blue-200 outline-none transition-all resize-none h-24"
                    />
                    <button
                        onClick={handlePostComment}
                        disabled={isLoading || !commentText.trim()}
                        className="absolute bottom-3 right-3 w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={14} />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="space-y-6">
                {comments.length === 0 ? (
                    <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest py-8">Sé el primero en comentar</p>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className="flex gap-4 group">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden border-2 transition-all ${comment.user.subscription_tier === 'premium' ? 'border-blue-500 shadow-sm shadow-blue-500/20' :
                                comment.user.subscription_tier === 'pro' ? 'border-amber-400' :
                                    'border-slate-100'
                                }`}>
                                {comment.user.avatar_url ? (
                                    <img src={comment.user.avatar_url} alt={comment.user.username} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300 italic font-black text-[10px]">
                                        {(comment.user.artistic_name || comment.user.username || 'U').charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <a href={`/${comment.user.username}`} className="text-xs font-black text-slate-900 uppercase tracking-tight hover:text-blue-600 transition-colors truncate max-w-[150px] username-highlight">
                                            {comment.user.artistic_name || comment.user.username}
                                        </a>
                                        {comment.user.is_verified && (
                                            <img src="/verified-badge.png" className="w-3.5 h-3.5 object-contain" alt="Verificado" title="Usuario Verificado" />
                                        )}
                                        {comment.user.is_founder && (
                                            <span title="Founder">
                                                <Crown size={12} className="text-amber-400" fill="currentColor" />
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest shrink-0">
                                        {new Date(comment.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-slate-500 text-sm leading-relaxed break-words">{comment.content}</p>
                            </div>
                            {currentUser === comment.user_id && (
                                <button
                                    onClick={() => {
                                        if (confirm('¿Eliminar comentario?')) {
                                            handleDelete(comment.id);
                                        }
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
