"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { User, Shield, Bell, Settings, Trash2, Camera, Instagram, Youtube, Lock, Save, Loader2, Edit3, X, ChevronRight } from 'lucide-react';
import LoadingTianguis from '@/components/LoadingTianguis';
import { motion, AnimatePresence } from 'framer-motion';
import { NoiseOverlay, AbstractPuzzleBack } from '@/components/ui/BackgroundEffects';
import CurrencySwitcher from '@/components/CurrencySwitcher';

export default function AccountPage() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);

    const [isEditing, setIsEditing] = useState(false);

    // Form states
    const [form, setForm] = useState({
        nombre_artistico: '',
        nombre_usuario: '',
        nombre_completo: '',
        biografia: '',
        pais: '',
        verificacion_instagram: '',
        verificacion_youtube: '',
        verificacion_tiktok: '',
        boletin_activo: true,
        alertas_ventas: true,
    });
    
    const [initialForm, setInitialForm] = useState(form);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUser(user);

        const { data, error } = await supabase
            .from('perfiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (data && !error) {
            setProfile(data);
            const loadedForm = {
                nombre_artistico: data.nombre_artistico || '',
                nombre_usuario: data.nombre_usuario || '',
                nombre_completo: data.nombre_completo || '',
                biografia: data.biografia || '',
                pais: data.pais || '',
                verificacion_instagram: data.verificacion_instagram || '',
                verificacion_youtube: data.verificacion_youtube || '',
                verificacion_tiktok: data.verificacion_tiktok || '',
                boletin_activo: data.boletin_activo !== false,
                alertas_ventas: true,
            };
            setForm(loadedForm);
            setInitialForm(loadedForm);
        }
        setLoading(false);
    };

    const hasChanges = JSON.stringify(form) !== JSON.stringify(initialForm);

    const handleSaveProfile = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!hasChanges) {
            setIsEditing(false); // Just exit edit mode if no changes
            return;
        }
        
        setSaving(true);
        try {
            const { error } = await supabase
                .from('perfiles')
                .update({
                    nombre_artistico: form.nombre_artistico,
                    nombre_usuario: form.nombre_usuario,
                    nombre_completo: form.nombre_completo,
                    biografia: form.biografia,
                    pais: form.pais,
                    verificacion_instagram: form.verificacion_instagram,
                    verificacion_youtube: form.verificacion_youtube,
                    verificacion_tiktok: form.verificacion_tiktok,
                    boletin_activo: form.boletin_activo,
                })
                .eq('id', user.id);

            if (error) throw error;
            showToast("Perfil actualizado correctamente.", "success");
            setInitialForm(form);
            setIsEditing(false);
        } catch (error: any) {
            console.error(error);
            showToast("Error al guardar los cambios.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setForm(initialForm);
        setIsEditing(false);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !user) return;
        const file = e.target.files[0];
        
        showToast("Subiendo imagen...", "success");
        
        try {
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/avatar_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('fotos_perfil')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('fotos_perfil')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('perfiles')
                .update({ foto_perfil: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;
            
            setProfile({ ...profile, foto_perfil: publicUrl });
            showToast("Foto de perfil actualizada.", "success");
            
        } catch (error) {
            console.error(error);
            showToast("Error al procesar la imagen.", "error");
        }
    };

    if (loading) return <LoadingTianguis />;

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20 px-4 md:px-0 relative z-10 transition-all duration-700">
            {/* Header & Status Bar */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-tighter text-blue-500">Configuración Global</span>
                    </div>
                    <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-[0.8] text-foreground flex flex-col">
                        <span className="opacity-40">Mi</span>
                        <span className="text-blue-500 relative inline-block w-max">
                            Cuenta
                            <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500/50 to-transparent rounded-full" />
                        </span>
                    </h1>
                </div>

                {/* Edit Controls */}
                <div className="flex items-center gap-3">
                    <AnimatePresence mode="wait">
                        {!isEditing ? (
                            <motion.button
                                key="edit-btn"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={() => setIsEditing(true)}
                                className="px-6 py-4 bg-foreground text-background dark:bg-white dark:text-black rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 active:scale-95 transition-all outline-none flex items-center gap-2"
                            >
                                <Edit3 size={14} /> Editar
                            </motion.button>
                        ) : (
                            <motion.div
                                key="save-controls"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex flex-row items-center gap-2"
                            >
                                <button
                                    onClick={handleCancelEdit}
                                    className="px-6 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-sm active:scale-95 transition-all outline-none flex items-center gap-2 border border-red-500/20"
                                >
                                    <X size={14} /> {hasChanges ? 'Descartar' : 'Cancelar'}
                                </button>
                                
                                {hasChanges && (
                                    <button
                                        onClick={() => handleSaveProfile()}
                                        disabled={saving}
                                        className="px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/20 active:scale-95 transition-all outline-none flex items-center gap-2 border border-blue-500/50"
                                    >
                                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ── Left Column: Profile & Personal Data ── */}
                <div className="lg:col-span-8 space-y-8">
                    <form onSubmit={handleSaveProfile} className="space-y-8" id="account-form">
                        
                        {/* Avatar Section */}
                        <div className={`bg-card/50 border border-border rounded-[3rem] p-8 md:p-10 shadow-xl shadow-black/5 flex flex-col md:flex-row items-center gap-8 transition-colors ${isEditing ? 'border-blue-500/30' : ''}`}>
                            <div className="relative group shrink-0">
                                <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-background shadow-xl relative bg-black/5 dark:bg-white/5 transition-all ${isEditing ? 'ring-4 ring-blue-500/20' : ''}`}>
                                    {profile?.foto_perfil ? (
                                        <img src={profile.foto_perfil} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User size={48} className="text-muted opacity-50" />
                                        </div>
                                    )}
                                    
                                    {isEditing && (
                                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <Camera className="text-white mb-2" size={24} />
                                            <span className="text-[9px] font-black text-white uppercase tracking-widest">Cambiar</span>
                                        </div>
                                    )}
                                    {isEditing && (
                                        <input type="file" accept="image/*" onChange={handleAvatarUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    )}
                                </div>
                            </div>
                            <div className="text-center md:text-left space-y-2 flex-1">
                                <h3 className="text-2xl font-black uppercase tracking-tighter">{form.nombre_artistico || 'Tu Nombre Artístico'}</h3>
                                <p className="text-blue-500 font-bold uppercase tracking-widest text-xs">@{form.nombre_usuario || 'tu_usuario'}</p>
                                <p className="text-[10px] text-muted leading-relaxed uppercase tracking-widest opacity-60 mt-4 max-w-sm">
                                    Esta imagen y nombre es como te verán los artistas y otros productores en la plataforma.
                                </p>
                            </div>
                        </div>

                        {/* Public Profile Form */}
                        <div className="bg-card/50 border border-border rounded-[3rem] p-8 md:p-10 shadow-xl shadow-black/5 space-y-8">
                            <div className="flex items-center gap-4 border-b border-border pb-6">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tighter">Perfil Público</h2>
                                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-60">Datos visibles en tu página</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted ml-2">Nombre Artístico</label>
                                    <input type="text" value={form.nombre_artistico} onChange={e => setForm({ ...form, nombre_artistico: e.target.value })} disabled={!isEditing} className={`w-full bg-background border border-border rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all shadow-sm ${isEditing ? 'focus:border-blue-500 focus:bg-background' : 'opacity-60 cursor-default'}`} placeholder="Ej. Bizarrap" />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted ml-2">Nombre de Usuario (@)</label>
                                    <input type="text" value={form.nombre_usuario} disabled className="w-full bg-slate-100 dark:bg-black/40 border border-border rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all shadow-sm opacity-50 cursor-not-allowed" title="Contacta a soporte para cambiar tu usuario" />
                                </div>
                                <div className="space-y-4 md:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted ml-2">Biografía</label>
                                    <textarea value={form.biografia} onChange={e => setForm({ ...form, biografia: e.target.value })} disabled={!isEditing} className={`w-full bg-background border border-border rounded-3xl px-6 py-5 text-sm font-bold outline-none transition-all h-32 resize-none shadow-sm ${isEditing ? 'focus:border-blue-500' : 'opacity-60 cursor-default'}`} placeholder="Cuéntale al mundo sobre tus beats y tu estilo..." />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted ml-2">País</label>
                                    <input type="text" value={form.pais} onChange={e => setForm({ ...form, pais: e.target.value })} disabled={!isEditing} className={`w-full bg-background border border-border rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all shadow-sm ${isEditing ? 'focus:border-blue-500' : 'opacity-60 cursor-default'}`} placeholder="Ej. México" />
                                </div>
                            </div>
                            
                            <div className="pt-6 border-t border-border">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted ml-2 mb-6">Redes Sociales</h3>
                                <div className="space-y-4">
                                    <div className="flex relative items-center">
                                        <div className="absolute left-6 text-muted"><Instagram size={18} /></div>
                                        <input type="text" value={form.verificacion_instagram} onChange={e => setForm({ ...form, verificacion_instagram: e.target.value })} disabled={!isEditing} className={`w-full bg-background border border-border rounded-2xl pl-14 pr-6 py-4 text-sm font-bold outline-none transition-all shadow-sm ${isEditing ? 'focus:border-blue-500' : 'opacity-60 cursor-default'}`} placeholder="Usuario de Instagram" />
                                    </div>
                                    <div className="flex relative items-center">
                                        <div className="absolute left-6 text-muted">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                                            </svg>
                                        </div>
                                        <input type="text" value={form.verificacion_tiktok} onChange={e => setForm({ ...form, verificacion_tiktok: e.target.value })} disabled={!isEditing} className={`w-full bg-background border border-border rounded-2xl pl-14 pr-6 py-4 text-sm font-bold outline-none transition-all shadow-sm ${isEditing ? 'focus:border-blue-500' : 'opacity-60 cursor-default'}`} placeholder="Usuario de TikTok" />
                                    </div>
                                    <div className="flex relative items-center">
                                        <div className="absolute left-6 text-muted"><Youtube size={18} /></div>
                                        <input type="text" value={form.verificacion_youtube} onChange={e => setForm({ ...form, verificacion_youtube: e.target.value })} disabled={!isEditing} className={`w-full bg-background border border-border rounded-2xl pl-14 pr-6 py-4 text-sm font-bold outline-none transition-all shadow-sm ${isEditing ? 'focus:border-blue-500' : 'opacity-60 cursor-default'}`} placeholder="URL del Canal de YouTube" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Personal Data Form */}
                        <div className="bg-card/50 border border-border rounded-[3rem] p-8 md:p-10 shadow-xl shadow-black/5 space-y-8">
                            <div className="flex items-center gap-4 border-b border-border pb-6">
                                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tighter">Datos Personales</h2>
                                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-60">Información privada</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted ml-2">Nombre y Apellido Legal</label>
                                    <input type="text" value={form.nombre_completo} onChange={e => setForm({ ...form, nombre_completo: e.target.value })} disabled={!isEditing} className={`w-full bg-background border border-border rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all shadow-sm ${isEditing ? 'focus:border-violet-500' : 'opacity-60 cursor-default'}`} placeholder="Tu nombre legal" />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted ml-2">Correo Electrónico Principal</label>
                                    <input type="email" value={profile?.correo} disabled className="w-full bg-slate-100 dark:bg-black/40 border border-border rounded-2xl px-6 py-4 text-sm font-bold outline-none transition-all shadow-sm opacity-50 cursor-not-allowed" />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* ── Right Column: Preferences, Notifications, Security ── */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* Preferencias */}
                    <div className="bg-card/50 border border-border rounded-[2.5rem] p-8 shadow-xl shadow-black/5 space-y-6">
                        <div className="flex items-center gap-3">
                            <Settings size={18} className="text-muted" />
                            <h2 className="text-lg font-black uppercase tracking-tighter">Preferencias</h2>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-muted block mb-3">Moneda Predeterminada</label>
                                <div className={`bg-background rounded-2xl p-2 border border-border shadow-sm transition-opacity ${!isEditing ? 'opacity-60 pointer-events-none' : ''}`}>
                                    <CurrencySwitcher />
                                </div>
                                <p className="text-[8px] text-muted font-bold uppercase tracking-widest mt-3 opacity-50">Así verás los precios en el catálogo.</p>
                            </div>
                        </div>
                    </div>

                    {/* Notificaciones */}
                    <div className="bg-card/50 border border-border rounded-[2.5rem] p-8 shadow-xl shadow-black/5 space-y-6">
                        <div className="flex items-center gap-3">
                            <Bell size={18} className="text-amber-500" />
                            <h2 className="text-lg font-black uppercase tracking-tighter">Notificaciones</h2>
                        </div>
                        
                        <div className="space-y-4">
                            <label className={`flex items-start gap-4 p-4 border border-border rounded-2xl transition-all ${isEditing ? 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5' : 'opacity-60 cursor-default'}`}>
                                <div className="mt-1">
                                    <input type="checkbox" disabled={!isEditing} className="w-4 h-4 rounded text-blue-500 bg-black/10 border-transparent focus:ring-0 cursor-pointer disabled:cursor-default" checked={form.boletin_activo} onChange={e => setForm({...form, boletin_activo: e.target.checked})} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest">Boletín Tianguis</h4>
                                    <p className="text-[9px] font-medium text-muted mt-1 leading-relaxed">Novedades y recursos gratis.</p>
                                </div>
                            </label>

                            <label className={`flex items-start gap-4 p-4 border border-border rounded-2xl transition-all ${isEditing ? 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5' : 'opacity-60 cursor-default'}`}>
                                <div className="mt-1">
                                    <input type="checkbox" disabled={!isEditing} className="w-4 h-4 rounded text-blue-500 bg-black/10 border-transparent focus:ring-0 cursor-pointer disabled:cursor-default" checked={form.alertas_ventas} onChange={e => setForm({...form, alertas_ventas: e.target.checked})} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest">Alertas de Venta</h4>
                                    <p className="text-[9px] font-medium text-muted mt-1 leading-relaxed">Correos de cada venta.</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="bg-card/50 border border-border rounded-[2.5rem] p-8 shadow-xl shadow-black/5 space-y-6">
                        <div className="flex items-center gap-3">
                            <Lock size={18} className="text-muted" />
                            <h2 className="text-lg font-black uppercase tracking-tighter">Seguridad</h2>
                        </div>
                        
                        <div className="space-y-3">
                            <button disabled={!isEditing} className={`w-full p-4 border border-border rounded-2xl flex items-center justify-between transition-all bg-background ${isEditing ? 'group hover:border-blue-500/30 cursor-pointer' : 'opacity-60 cursor-default'}`}>
                                <span className={`text-[10px] font-black uppercase tracking-widest text-muted transition-colors ${isEditing ? 'group-hover:text-foreground' : ''}`}>Cambiar Contraseña</span>
                                <ChevronRight size={16} className={`text-muted transition-all ${isEditing ? 'group-hover:text-blue-500 group-hover:translate-x-1' : ''}`} />
                            </button>
                            <button disabled={!isEditing} className={`w-full p-4 border border-border rounded-2xl flex items-center justify-between transition-all bg-background ${isEditing ? 'group hover:border-blue-500/30 cursor-pointer' : 'opacity-60 cursor-default'}`}>
                                <span className={`text-[10px] font-black uppercase tracking-widest text-muted transition-colors ${isEditing ? 'group-hover:text-foreground' : ''}`}>Conexiones Activas</span>
                                <ChevronRight size={16} className={`text-muted transition-all ${isEditing ? 'group-hover:text-blue-500 group-hover:translate-x-1' : ''}`} />
                            </button>
                        </div>
                    </div>

                    <div className="bg-red-500/[0.02] border border-red-500/10 rounded-[2.5rem] p-8 space-y-6">
                        <div className="flex items-center gap-3 relative z-10">
                            <Trash2 size={18} className="text-red-500" />
                            <h2 className="text-lg font-black uppercase tracking-tighter text-red-500">Peligro</h2>
                        </div>
                        <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-60 leading-relaxed shadow-sm">
                            Eliminar tu cuenta borrará datos permanentemente.
                        </p>
                        <button className="w-full px-6 py-4 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border border-red-500/20 active:scale-95 shadow-sm">
                            Eliminar cuenta
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
