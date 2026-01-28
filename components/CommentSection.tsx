import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, User, Trash2 } from 'lucide-react';

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    user: {
        email: string;
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

            // Fetch comments with user email
            // Note: This assumes we can join auth.users (requires specific supabase setup sometimes) 
            // OR we fetch public profile table.
            // For now, let's just fetch comments and we might not have email if RLS blocks auth.users select.
            // We will simplify: just fetch content and created_at

            const { data, error } = await supabase
                .from('comments')
                .select('*')
                .eq('beat_id', beatId)
                .order('created_at', { ascending: false });

            if (data) {
                // Mocking user email display for now as joining auth.users is restricted usually
                const formatted = data.map(c => ({
                    ...c,
                    user: { email: 'Usuario' }
                }));
                setComments(formatted);
            }
        };

        fetchComments();

        // Subscribe to real-time changes
        const channel = supabase
            .channel('public:comments')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `beat_id=eq.${beatId}` }, (payload) => {
                setComments(prev => [{ ...payload.new as Comment, user: { email: 'Nuevo' } }, ...prev]);
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
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0">
                                <span className="text-blue-600 font-black text-xs">U</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-black text-slate-900 uppercase tracking-wide">Usuario de Tianguis</span>
                                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                                        {new Date(comment.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-slate-500 text-sm leading-relaxed">{comment.content}</p>
                            </div>
                            {currentUser === comment.user_id && (
                                <button
                                    onClick={() => handleDelete(comment.id)}
                                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
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
