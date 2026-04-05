import { supabase } from './supabase';

export interface GlobalConfig {
    bloqueo_exclusivos: boolean;
    modo_mantenimiento: boolean;
    subidas_habilitadas: boolean;
    ventas_habilitadas: boolean;
    banner_noticia_activa: boolean;
    banner_texto: string;
}

// Module-level cache: only fetches once per session, avoiding N DB calls per page
let _configCache: GlobalConfig | null = null;
let _configFetchPromise: Promise<GlobalConfig> | null = null;

export async function getGlobalConfig(): Promise<GlobalConfig> {
    if (_configCache) return _configCache;
    if (_configFetchPromise) return _configFetchPromise;

    _configFetchPromise = (async () => {
        try {
            const { data, error } = await supabase
                .from('configuracion_global')
                .select('clave, valor');

            if (error) throw error;

            const config: any = {
                bloqueo_exclusivos: true,
                modo_mantenimiento: false,
                subidas_habilitadas: true,
                ventas_habilitadas: true,
                banner_noticia_activa: false,
                banner_texto: ''
            };

            data?.forEach((item: any) => {
                config[item.clave] = item.valor;
            });

            _configCache = config as GlobalConfig;
            return _configCache;
        } catch (err) {
            console.error('Error fetching global config:', err);
            _configFetchPromise = null;
            return {
                bloqueo_exclusivos: true,
                modo_mantenimiento: false,
                subidas_habilitadas: true,
                ventas_habilitadas: true,
                banner_noticia_activa: false,
                banner_texto: ''
            };
        }
    })();

    return _configFetchPromise;
}
