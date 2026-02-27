"use client";

import React from 'react';
import { X, Music, Check, ShoppingCart, ShieldCheck, Zap, Layers, Crown, FileText, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Beat } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { useCurrency } from '@/context/CurrencyContext';

interface LicenseSelectionModalProps {
    beat: Beat | any;
    isOpen: boolean;
    onClose: () => void;
}

export default function LicenseSelectionModal({ beat, isOpen, onClose }: LicenseSelectionModalProps) {
    const router = useRouter();
    const { addItem } = useCart();
    const { showToast } = useToast();
    const { formatPrice, currency } = useCurrency();

    // Definir todas las licencias posibles
    const allLicenses = [
        {
            id: 'Básica',
            name: 'Licencia Básica (Baja Calidad)',
            price: beat.precio_basico_mxn || 199,
            features: [
                'Archivo MP3 con Tag (Muestra)',
                'Límite: 5,000 streams',
                'Uso no comercial / Maquetas',
                'Perfecto para grabar tu idea'
            ],
            icon: <FileText size={20} />,
            color: 'blue',
            isActive: beat.es_basica_activa !== false
        },
        {
            id: 'MP3',
            name: 'Licencia MP3 (Estándar)',
            price: beat.precio_mp3_mxn || 349,
            features: [
                'Archivo MP3 High Quality Limpio',
                'Límite: 25,000 streams',
                'Distribución en tiendas digitales',
                'Lanzamientos independientes'
            ],
            icon: <Music size={20} />,
            color: 'indigo',
            isActive: beat.es_mp3_activa !== false
        },
        {
            id: 'Pro',
            name: 'Licencia Pro (MP3/HQ)',
            price: beat.precio_pro_mxn || 599,
            features: [
                'Archivo WAV + MP3 Master',
                'Límites extendidos (100k streams)',
                'Derechos de radio y presentaciones',
                'Calidad profesional'
            ],
            icon: <Zap size={20} />,
            color: 'indigo',
            isActive: beat.es_pro_activa !== false
        },
        {
            id: 'Premium',
            name: 'Licencia Premium (WAV)',
            price: beat.precio_premium_mxn || 999,
            features: [
                'WAV High Fidelity + MP3',
                'Límite: 500,000 streams',
                'Ideal para videoclips y radio',
                'Sin tags de voz / Limpio'
            ],
            icon: <Package size={20} />,
            color: 'emerald',
            isActive: beat.es_premium_activa !== false
        },
        {
            id: 'Ilimitada',
            name: 'Licencia Ilimitada',
            price: beat.precio_ilimitado_mxn || 1999,
            features: [
                'Archivos STEMS / Trackout',
                'Uso comercial ILIMITADO',
                'Control total de la mezcla',
                'Uso en todo el mundo'
            ],
            icon: <Layers size={20} />,
            color: 'purple',
            isActive: beat.es_ilimitada_activa !== false
        },
        {
            id: 'Exclusiva',
            name: 'Licencia Exclusiva',
            price: beat.precio_exclusivo_mxn || 3500,
            features: [
                'Propiedad TOTAL del beat',
                'Eliminación del mercado',
                'Derechos de autor transferidos',
                'Máxima libertad creativa'
            ],
            icon: <Crown size={20} />,
            color: 'rose',
            isActive: beat.es_exclusiva_activa !== false && beat.esta_vendido
        },
        {
            id: 'Sound Kit',
            name: 'Sound Kit / Kit de Sonidos',
            price: beat.precio_soundkit_mxn || 499,
            features: [
                'Kits de sonidos del beat',
                'Royalty-Free / Sin regalías',
                'Archivos WAV de alta calidad',
                'Uso en tus propias producciones'
            ],
            icon: <Package size={20} />,
            color: 'rose',
            isActive: beat.es_soundkit_activa !== false
        }
    ];

    // Filtrar solo las licencias activas
    const activeLicenses = beat.esta_vendido ? [] : allLicenses.filter(l => l.isActive);

    const [selectedType, setSelectedType] = React.useState<string>('');
    const [producerInfo, setProducerInfo] = React.useState<any>(null);
    const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

    // Estado inicial para el tipo seleccionado
    React.useEffect(() => {
        if (activeLicenses.length > 0 && !selectedType) {
            setSelectedType(activeLicenses[0].id);
        }
    }, [activeLicenses]);

    // Obtener información del productor y del usuario actual
    React.useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                // Obtener productor
                const prodId = beat.productor_id;
                if (prodId) {
                    const { data: producerData } = await supabase
                        .from('perfiles')
                        .select('nombre_artistico, nombre_usuario, foto_perfil, esta_verificado, es_fundador')
                        .eq('id', prodId)
                        .single();
                    if (producerData) setProducerInfo(producerData);
                }

                // Obtener usuario actual
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    setCurrentUserId(session.user.id);
                }
            };
            fetchData();
        }
    }, [isOpen, beat.productor_id, beat.productor_id]);

    if (!isOpen) return null;

    const handleAddToCart = () => {
        const license = allLicenses.find(l => l.id === selectedType);
        if (!license) return;

        const wasAdded = addItem({
            id: `${beat.id}-${selectedType}`,
            type: 'beat',
            name: `${beat.titulo || beat.title} [${selectedType}]`,
            price: license.price,
            image: beat.portada_url || beat.portadabeat_url || undefined,
            subtitle: `Prod. by ${producerInfo?.artistic_name || beat.productor_nombre_artistico || beat.productor_nombre_usuario}`,
            metadata: {
                licenseType: selectedType,
                beatId: beat.id,
                producer_id: beat.productor_id,
                producer_name: producerInfo?.artistic_name || beat.productor_nombre_artistico,
                mp3_url: beat.archivo_muestra_url || beat.archivo_mp3_url,
                wav_url: beat.archivo_wav_url,
                stems_url: beat.archivo_stems_url
            }
        });

        if (wasAdded) {
            onClose();
            router.push('/cart');
        }
    };

    const currentLicense: any = allLicenses.find(l => l.id === selectedType) || (activeLicenses.length > 0 ? activeLicenses[0] : allLicenses[0]);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/95 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose}></div>

            <div className="relative bg-card w-full max-w-5xl rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in slide-in-from-bottom-12 duration-700 border border-white/10 flex flex-col lg:flex-row min-h-[600px]">

                {/* Botón de cerrar */}
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 p-4 bg-muted/10 text-muted hover:bg-foreground hover:text-background rounded-full transition-all z-50 group"
                >
                    <X size={20} className="group-hover:rotate-90 transition-transform" />
                </button>

                {/* PÁNEL IZQUIERDO: Especificaciones e Info del Productor */}
                <div className="lg:w-[40%] bg-background p-8 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border order-2 lg:order-1">
                    <div className="space-y-8">
                        {/* Arte Principal */}
                        <div className="space-y-6">
                            <div className="aspect-square w-full rounded-3xl overflow-hidden bg-muted/10 shadow-xl border border-white/10 group">
                                {beat.portada_url ? (
                                    <img src={beat.portada_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={beat.titulo} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center opacity-10">
                                        <Music size={80} />
                                    </div>
                                )}
                            </div>

                            <h3 className="text-3xl font-black text-foreground uppercase tracking-tighter leading-none">
                                {beat.titulo}
                            </h3>

                            {/* Fila del productor DEBAJO del título */}
                            <div className="flex items-center gap-4 p-4 rounded-3xl bg-card border border-border">
                                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-muted/10 shrink-0">
                                    {producerInfo?.foto_perfil || beat.productor_foto_perfil ? (
                                        <img src={producerInfo?.foto_perfil || beat.productor_foto_perfil} className="w-full h-full object-cover" alt="Producer" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted">
                                            <Music size={24} />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-heading font-black text-foreground flex items-center gap-2 truncate">
                                        {producerInfo?.nombre_artistico || beat.productor_nombre_artistico || beat.productor_nombre_usuario || 'Productor'}
                                        {(producerInfo?.esta_verificado || beat.productor_esta_verificado) && (
                                            <div className="bg-blue-500 text-white rounded-full p-0.5 shadow-lg shadow-blue-500/20">
                                                <Check size={8} strokeWidth={4} />
                                            </div>
                                        )}
                                        {(producerInfo?.es_fundador || beat.productor_es_fundador) && (
                                            <Crown size={14} className="text-amber-500 shrink-0" fill="currentColor" />
                                        )}
                                    </h4>
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest truncate">
                                        @{producerInfo?.nombre_usuario || beat.productor_nombre_usuario || 'tianguis'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <SpecItem label="Género" value={beat.genero} />
                                <SpecItem label="BPM" value={`${beat.bpm} BPM`} />
                                <SpecItem label="Tono / Escala" value={beat.tono_escala} />
                                <SpecItem label="Mood" value={beat.vibras} />
                                <SpecItem label="Tipo" value={Array.isArray(beat.tipos_beat) ? beat.tipos_beat[0] : (beat.tipos_beat || 'Original')} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center gap-3 text-muted">
                        <ShieldCheck size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Tianguis Safe Checkout</span>
                    </div>
                </div>

                {/* PÁNEL DERECHO: Selección de Licencias */}
                <div className="flex-1 p-8 lg:p-12 flex flex-col justify-between order-1 lg:order-2 bg-card">
                    <div className="space-y-10">
                        <header>
                            <h2 className="text-4xl font-black text-foreground uppercase tracking-tighter mb-2">Licencias Disponibles</h2>
                            <p className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Escala tu sonido al siguiente nivel</p>
                        </header>

                        {/* Lista interactiva - Altura incrementada para evitar cortes */}
                        <div className="grid gap-3 max-h-[480px] overflow-y-auto px-4 custom-scrollbar py-2">
                            {allLicenses.filter(l => l.isActive).map((lic) => {
                                const isSelected = selectedType === lic.id;
                                return (
                                    <button
                                        key={lic.id}
                                        onClick={() => setSelectedType(lic.id)}
                                        className={`w-full group px-6 py-5 rounded-[2rem] border-2 transition-all text-left flex items-center justify-between ${isSelected
                                            ? `bg-${lic.color}-500/5 border-${lic.color}-500 shadow-2xl shadow-${lic.color}-500/10 scale-[1.02]`
                                            : 'border-border hover:border-accent/40 bg-transparent'
                                            }`}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isSelected ? `bg-${lic.color}-500 text-white rotate-6` : 'bg-muted/10 text-muted'
                                                }`}>
                                                {lic.icon}
                                            </div>
                                            <div>
                                                <h5 className={`font-black uppercase tracking-widest text-[11px] ${isSelected ? `text-${lic.color}-500` : 'text-foreground'}`}>
                                                    {lic.name}
                                                </h5>
                                                <p className="text-[10px] font-bold text-muted">Contrato profesional</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-2xl font-black ${isSelected ? `text-${lic.color}-500` : 'text-foreground'}`}>
                                                {formatPrice(lic.price)}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Caja de características dinámica */}
                        {currentLicense && (
                            <div className="p-8 rounded-[2.5rem] bg-accent-soft border border-border animate-in fade-in slide-in-from-top-4 duration-500">
                                <h6 className="text-[10px] font-black uppercase text-accent tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <Zap size={14} fill="currentColor" /> Beneficios {currentLicense.id}:
                                </h6>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {currentLicense.features.map((f: string, i: number) => (
                                        <li key={i} className="flex items-center gap-3 text-[11px] font-bold text-foreground">
                                            <div className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center shrink-0">
                                                <Check size={10} strokeWidth={4} />
                                            </div>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="mt-12 flex gap-4">
                        <button
                            onClick={handleAddToCart}
                            disabled={!selectedType || beat.esta_vendido || beat.is_sold}
                            className={`flex-1 flex items-center justify-center gap-4 py-6 rounded-[2rem] font-black uppercase text-[12px] tracking-[0.4em] transition-all duration-300 active:scale-95 shadow-2xl ${beat.esta_vendido || beat.is_sold
                                ? 'bg-red-500/10 text-red-500 cursor-not-allowed border border-red-500/20 shadow-none'
                                : 'bg-accent text-white hover:bg-foreground hover:text-background shadow-accent/30'
                                }`}
                        >
                            {beat.esta_vendido || beat.is_sold ? (
                                <>AGOTADO / SOLD OUT</>
                            ) : (
                                <>
                                    <ShoppingCart size={20} />
                                    Añadir al Carrito
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SpecItem({ label, value }: { label: string; value: string | number }) {
    if (!value) return null;
    return (
        <div className="p-4 rounded-2xl bg-card border border-border">
            <p className="text-[8px] font-black uppercase text-muted tracking-widest mb-1 leading-none">{label}</p>
            <p className="text-[11px] font-black text-foreground truncate">{value}</p>
        </div>
    );
}
