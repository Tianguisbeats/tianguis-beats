"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Notificacion = {
  id: string;
  tipo: string;
  contenido: string;
  esta_leida: boolean;
  url_destino: string | null;
  fecha_creacion: string;
};

function tiempoRelativo(fecha: string) {
  const diff = Date.now() - new Date(fecha).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function NotificacionesBell({
  userId,
  className = "",
}: {
  userId: string;
  className?: string;
}) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const noLeidas = notificaciones.filter((n) => !n.esta_leida).length;

  useEffect(() => {
    if (!userId) return;

    supabase
      .from("notificaciones")
      .select("*")
      .eq("usuario_id", userId)
      .order("fecha_creacion", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setNotificaciones(data);
      });

    const channel = supabase
      .channel(`notif-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notificaciones",
          filter: `usuario_id=eq.${userId}`,
        },
        (payload) => {
          setNotificaciones((prev) => [payload.new as Notificacion, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const marcarTodasLeidas = async () => {
    const ids = notificaciones.filter((n) => !n.esta_leida).map((n) => n.id);
    if (ids.length === 0) return;
    await supabase.from("notificaciones").update({ esta_leida: true }).in("id", ids);
    setNotificaciones((prev) => prev.map((n) => ({ ...n, esta_leida: true })));
  };

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next && noLeidas > 0) marcarTodasLeidas();
  };

  const handleClick = async (n: Notificacion) => {
    if (!n.esta_leida) {
      await supabase.from("notificaciones").update({ esta_leida: true }).eq("id", n.id);
      setNotificaciones((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, esta_leida: true } : x))
      );
    }
    setIsOpen(false);
  };

  const ItemWrapper = ({
    n,
    children,
  }: {
    n: Notificacion;
    children: React.ReactNode;
  }) =>
    n.url_destino ? (
      <Link href={n.url_destino} onClick={() => handleClick(n)}>
        {children}
      </Link>
    ) : (
      <div onClick={() => handleClick(n)}>{children}</div>
    );

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={handleToggle}
        className="relative p-2 transition-all hover:scale-110 text-gray-500 dark:text-white"
        aria-label="Notificaciones"
      >
        <Bell size={18} />
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center leading-none">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl z-[200] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10">
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              Notificaciones
            </span>
            {noLeidas > 0 && (
              <button
                onClick={marcarTodasLeidas}
                className="text-[10px] text-blue-500 font-semibold hover:underline"
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-white/5">
            {notificaciones.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={22} className="mx-auto mb-2 text-gray-300 dark:text-white/20" />
                <p className="text-xs text-gray-400 dark:text-white/30">Sin notificaciones</p>
              </div>
            ) : (
              notificaciones.map((n) => (
                <ItemWrapper key={n.id} n={n}>
                  <div
                    className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${
                      !n.esta_leida ? "bg-blue-50/60 dark:bg-blue-500/5" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs leading-snug ${
                          !n.esta_leida
                            ? "font-semibold text-gray-900 dark:text-white"
                            : "text-gray-500 dark:text-white/60"
                        }`}
                      >
                        {n.contenido}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-white/30 mt-0.5">
                        {tiempoRelativo(n.fecha_creacion)}
                      </p>
                    </div>
                    {!n.esta_leida && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                    )}
                  </div>
                </ItemWrapper>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
