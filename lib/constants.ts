/**
 * @file constants.ts
 * @description Constantes globales utilizadas en toda la plataforma Tianguis Beats.
 * Incluye listas de países, géneros musicales, subgéneros, y estados de ánimo (moods) 
 * con sus respectivos emojis y estilos.
 */

/**
 * Lista de países disponibles para la selección de ubicación del usuario.
 * @constant {string[]}
 */
export const COUNTRIES = [
    "México 🇲🇽",
    "Estados Unidos 🇺🇸",
    "Argentina 🇦🇷",
    "Colombia 🇨🇴",
    "España 🇪🇸",
    "Chile 🇨🇱",
    "Perú 🇵🇪",
    "Venezuela 🇻🇪",
    "Ecuador 🇪🇨",
    "República Dominicana 🇩🇴",
    "Puerto Rico 🇵🇷",
    "Guatemala 🇬🇹",
    "Bolivia 🇧🇴",
    "Cuba 🇨🇺",
    "Honduras 🇭🇳",
    "Paraguay 🇵🇾",
    "El Salvador 🇸🇻",
    "Nicaragua 🇳🇮",
    "Costa Rica 🇨🇷",
    "Panamá 🇵🇦",
    "Uruguay 🇺🇾",
    "Brasil 🇧🇷",
    "Canadá 🇨🇦",
    "Reino Unido 🇬🇧",
    "Francia 🇫🇷",
    "Italia 🇮🇹",
    "Alemania 🇩🇪",
];
/**
 * Lista principal de géneros musicales disponibles en la plataforma.
 * Cada género incluye su emoji representativo.
 * @constant {string[]}
 */
export const GENRES = [
    "Corridos Tumbados 🇲🇽",
    "Sierreño 🌵",
    "Banda / Norteño 🎺",
    "Mariachi Moderno 🎻",
    "Reggaetón 🍑",
    "Reggaetón Mexa 🇲🇽",
    "Dembow 🇩🇴",
    "Dancehall 🇯🇲",
    "Trap Latino 🔥",
    "R&B 🕯️",
    "Baile Funk 🇧🇷",
    "Afrobeats 🌍",
    "Boom Bap 🥁",
    "Drill 🔪",
    "Lo-Fi ☕",
    "Gangsta Rap 🔫",
    "House 🏠",
    "Hyperpop 🍭",
    "Techno ⛓️",
    "Phonk 🚗",
    "Pop / Indie 🎸",
    "Piano 🎹",
    "Trap 💎",
    "Hip Hop 🎤",
    "Rock 🤘",
    "Alternativo 🌀"
];
/**
 * Diccionario de subgéneros clasificados por su género principal.
 * @constant {Record<string, string[]>}
 */
export const SUBGENRES: Record<string, string[]> = {
    "Corridos Tumbados 🇲🇽": ["Bélicos 🦅", "Tumbados Románticos ❤️", "Corridos de Calle 🚬", "Trap Corridos 💎", "Sierreño Tumbado 🌵"],
    "Sierreño 🌵": ["Campirano 🤠", "Sierreño Tumbado 🎸", "Romántico 🌹", "Clásico 🎻"],
    "Banda / Norteño 🎺": ["Quebradita 💃", "Zapateado 🕺", "Huapango 🎻", "Norteño Sax 🎷", "Banda Sinaloense 🎺"],
    "Mariachi Moderno 🎻": ["Regional Pop 💎", "Mariacheño 🤠", "Mariachi Trap 🔥", "Clásico 🎻"],
    "Reggaetón 🍑": ["Old School 👴", "Perreo Pesado 🔥", "Romantiqueo ❤️", "Neoperreo 🌈", "Reggaetón Flow 🌊", "Mambo 💃"],
    "Reggaetón Mexa 🇲🇽": ["Mexa Bass 🇲🇽", "Perreo Chilango 🚬", "Flow Bajío 🌵", "Reggaetón Bélico 🦅"],
    "Dembow 🇩🇴": ["Dembow Dominicano 🇩🇴", "Bajo Mundo 🇩🇴", "Dembow Calle 🚬", "Afro Dembow 🌍"],
    "Dancehall 🇯🇲": ["Ragga 🔊", "Rockers 🎸", "Bashment 🔥", "Lovers Rock ❤️"],
    "Trap Latino 🔥": ["Melodic Trap 🌊", "Dark Trap 🌑", "Pluggnb 🔌", "Latin Drill 🔪", "Trap Soul 🕯️", "Ethereal Trap ✨"],
    "R&B 🕯️": ["Soul Moderno ✨", "R&B Alternativo 🌫️", "Neo-Soul 🧘", "Contemporary R&B 🕯️", "PBR&B 🌊"],
    "Baile Funk 🇧🇷": ["Funk Carioca 🇧🇷", "Brazilian Bass 🇧🇷", "Funk Ostentação 💰", "Funk Proibidão 🚫"],
    "Afrobeats 🌍": ["Afro-Fusion 🌍", "Amapiano 🇿🇦", "Afro-Swing 🌊", "Afro-Jazz 🎷"],
    "Boom Bap 🥁": ["Lo-Fi Hip Hop ☕", "Jazz Hop 🎷", "Hardcore Hip Hop 🥁", "Conscious Rap 🧘"],
    "Drill 🔪": ["UK Drill 🇬🇧", "NY Drill 🗽", "Latin Drill 🔥", "Sample Drill 📀"],
    "Lo-Fi ☕": ["Chillhop 🌊", "Study Beats 📚", "Jazz-Fi 🎷", "Ambient Lo-Fi 🧘"],
    "Gangsta Rap 🔫": ["G-Funk 🌴", "West Coast 🌴", "East Coast 🗽", "Dirty South 🦅"],
    "House 🏠": ["Tech House 🔊", "Deep House 🌊", "Afro House 🌍", "Melodic House ✨", "Slap House 🔨"],
    "Hyperpop 🍭": ["Glitchcore 👾", "Bubblegum Bass 🍬", "Cyberpop 💻", "Digicore 💿"],
    "Techno ⛓️": ["Hard Techno 🔨", "Acid Techno 🧪", "Industrial Techno ⚙️", "Peak Time Techno ⚡"],
    "Phonk 🚗": ["Drift Phonk 💨", "Brazilian Phonk 🇧🇷", "Rare Phonk 💎", "Vamp Phonk 🧛"],
    "Pop / Indie 🎸": ["Dream Pop ☁️", "Synth Pop 🎹", "Indie Rock 🎸", "Bedroom Pop 🛏️", "Alt-Pop 🌀"],
    "Piano 🎹": ["Piano Melódico 🎹", "Piano Instrumental 🎹", "Piano Trap 🔥", "Piano Sad 💔"],
    "Trap 💎": ["EDM Trap 🔊", "Trap Soul 🕯️", "Hard Trap 🔨", "Chill Trap 🌊"],
    "Hip Hop 🎤": ["Old School 🎤", "Underground 🎤", "Cloud Rap ☁️", "Emo Rap 💔"],
    "Rock 🤘": ["Metal 🤘", "Grunge 🎸", "Punk ⚡", "Indie Rock 🎸", "Psychedelic Rock 🍄"],
    "Alternativo 🌀": ["Experimental 🧪", "Avant-Garde 🎨", "Art Pop 🎨", "Shoegaze 🌫️"]
};
/**
 * Lista de estados de ánimo (moods) asociados a los beats.
 * Cada mood contiene una etiqueta, un emoji y clases de Tailwind para su estilización en la UI.
 * @constant {Array<{label: string, emoji: string, color: string}>}
 */
export const MOODS = [
    { label: "Oscuro", value: "Dark", emoji: "🌑" },
    { label: "Energético", value: "Energetic", emoji: "⚡" },
    { label: "Melódico / Soulful", value: "Soulful", emoji: "🕯️" },
    { label: "Inspirador", value: "Inspiring", emoji: "✨" },
    { label: "Audaz / Seguro", value: "Confident", emoji: "😎" },
    { label: "Triste", value: "Sad", emoji: "😢" },
    { label: "Relajado", value: "Relaxed", emoji: "🌊" },
    { label: "Dulce / Mellow", value: "Mellow", emoji: "🍭" },
    { label: "Enojado", value: "Angry", emoji: "😡" },
    { label: "Calmado", value: "Calm", emoji: "🧘" },
    { label: "Exitoso / Logrado", value: "Accomplished", emoji: "🏆" },
    { label: "Épico", value: "Epic", emoji: "⚔️" },
    { label: "Feliz", value: "Happy", emoji: "😊" },
    { label: "Loco", value: "Crazy", emoji: "🌀" },
    { label: "Determinado", value: "Determined", emoji: "🎯" },
    { label: "Amado", value: "Loved", emoji: "❤️" },
    { label: "Intenso", value: "Intense", emoji: "💥" },
    { label: "Extravagante", value: "Quirky", emoji: "🤡" },
    { label: "Poderoso", value: "Powerful", emoji: "🦾" },
    { label: "Solitario", value: "Lonely", emoji: "👤" },
    { label: "Deprimido", value: "Depressed", emoji: "📉" },
    { label: "Sucio / Dirty", value: "Dirty", emoji: "☣️" },
    { label: "Agradecido", value: "Grateful", emoji: "🙏" },
    { label: "Coqueto", value: "Flirty", emoji: "😏" },
    { label: "Hiper", value: "Hyper", emoji: "🚀" },
    { label: "Rebelde", value: "Rebellious", emoji: "🏴" },
    { label: "Pacífico", value: "Peaceful", emoji: "🕊️" },
    { label: "Malvado", value: "Evil", emoji: "😈" },
    { label: "Sombrío", value: "Gloomy", emoji: "☁️" },
    { label: "Ansioso", value: "Anxious", emoji: "😰" },
    { label: "Crunk", value: "Crunk", emoji: "🔥" },
    { label: "Adorado", value: "Adored", emoji: "💖" },
    { label: "Chill", value: "Chill", emoji: "🍹" },
    { label: "Romántico", value: "Romantic", emoji: "🌹" },
    { label: "Excéntrico", value: "Eccentric", emoji: "🎭" },
    { label: "Neutral", value: "Neutral", emoji: "😐" },
    { label: "Atrevido", value: "Bold", emoji: "🦁" },
    { label: "Emocionante", value: "Exciting", emoji: "🎢" },
    { label: "Melancólico", value: "Melancholy", emoji: "🎻" },
    { label: "Dramático", value: "Dramatic", emoji: "🎬" },
    { label: "Seductor", value: "Seductive", emoji: "💋" },
    { label: "Furioso", value: "Enraged", emoji: "😤" },
    { label: "Ensueño", value: "Dreamy", emoji: "☁️" },
    { label: "Tenso", value: "Tense", emoji: "⛓️" },
    { label: "Decepcionado", value: "Disappointed", emoji: "😞" },
    { label: "Majestuoso", value: "Majestic", emoji: "🏰" },
    { label: "Frenético", value: "Frantic", emoji: "🏃" },
    { label: "Divertido / Silly", value: "Silly", emoji: "😜" },
    { label: "Molesto", value: "Annoyed", emoji: "😒" },
    { label: "Perezoso", value: "Lazy", emoji: "🦥" },
    { label: "Asustado", value: "Scared", emoji: "😨" },
    { label: "Alegre / Giddy", value: "Giddy", emoji: "💃" },
    { label: "Bailable", value: "Dancy", emoji: "🕺" },
    { label: "Tenebroso", value: "Scary", emoji: "👻" },
    { label: "Inquieto", value: "Restless", emoji: "🦗" },
    { label: "Eufórico", value: "Euphoric", emoji: "🌈" },
    { label: "Misterioso", value: "Mysterious", emoji: "🔮" },
    { label: "Optimista", value: "Optimistic", emoji: "☀️" },
    { label: "Rabia", value: "Rage", emoji: "💢" },
    { label: "Cálido", value: "Warm", emoji: "🌡️" },
    { label: "Despreocupado", value: "Carefree", emoji: "🪁" },
    { label: "Sentimental", value: "Sentimental", emoji: "📜" },
    { label: "Sincero", value: "Heartfelt", emoji: "💌" },
    { label: "Motivador", value: "Uplifting", emoji: "🆙" },
    { label: "Relajante", value: "Soothing", emoji: "🍃" },
    { label: "Esperanzado", value: "Hopeful", emoji: "🕯️" },
    { label: "Juguetón", value: "Playful", emoji: "🎾" },
    { label: "Alegre", value: "Cheerful", emoji: "☀" }
];

/**
 * Lista de instrumentos musicales.
 * @constant {Array<{label: string, value: string, emoji: string}>}
 */
export const INSTRUMENTS = [
    { label: "Piano", value: "Piano", emoji: "🎹" },
    { label: "Bajo", value: "Bass", emoji: "🎸" },
    { label: "Sintetizador", value: "Synth", emoji: "🎹" },
    { label: "Beats", value: "Beats", emoji: "🥁" },
    { label: "Bajo Eléctrico", value: "Bass guitar", emoji: "🎸" },
    { label: "Guitarra Acústica", value: "Acoustic guitar", emoji: "🎸" },
    { label: "Guitarra Eléctrica", value: "Electric guitar", emoji: "🎸" },
    { label: "Cuerdas", value: "Strings", emoji: "🎻" },
    { label: "Guitarra", value: "Guitar", emoji: "🎸" },
    { label: "Violín", value: "Violin", emoji: "🎻" },
    { label: "Metales (Brass)", value: "Brass", emoji: "🎺" },
    { label: "Teclados", value: "Keys", emoji: "🎹" },
    { label: "Flauta", value: "Flute", emoji: "🪈" },
    { label: "Platillos", value: "Cymbals", emoji: "🥁" },
    { label: "Órgano", value: "Organ", emoji: "🎹" },
    { label: "Saxofón", value: "Saxophone", emoji: "🎷" },
    { label: "Violonchelo", value: "Cello", emoji: "🎻" },
    { label: "Viola", value: "Viola", emoji: "🎻" },
    { label: "Trompeta", value: "Trumpet", emoji: "🎺" },
    { label: "Banjo", value: "Banjo", emoji: "🪕" },
    { label: "Triángulo", value: "Triangle", emoji: "📐" },
    { label: "Contrabajo", value: "Double Bass", emoji: "🎻" },
    { label: "Pandereta", value: "Tambourine", emoji: "🪘" },
    { label: "Trompa", value: "French Horn", emoji: "🎺" },
    { label: "Trombón", value: "Trombone", emoji: "🎺" },
    { label: "Arpa", value: "Harp", emoji: "🪕" },
    { label: "Ukulele", value: "Ukulele", emoji: "🎸" },
    { label: "Mandolina", value: "Mandolin", emoji: "🎸" },
    { label: "Flauta Dulce", value: "Recorder", emoji: "🪈" },
    { label: "Píccolo", value: "Piccolo", emoji: "🪈" },
    { label: "Clarinete", value: "Clarinet", emoji: "🪈" },
    { label: "Fagot", value: "Bassoon", emoji: "🪈" },
    { label: "Tuba", value: "Tuba", emoji: "🎺" },
    { label: "Clavicémbalo", value: "Harpsichord", emoji: "🎹" },
    { label: "Armónica", value: "Harmonica", emoji: "🪗" },
    { label: "Oboe", value: "Oboe", emoji: "🪈" },
    { label: "Maracas", value: "Maracas", emoji: "🪇" },
    { label: "Castañuelas", value: "Castanets", emoji: "💃" },
    { label: "Gong", value: "Gong", emoji: "🥁" },
    { label: "Maderas", value: "Woodwind", emoji: "🪈" },
    { label: "Sitar", value: "Sitar", emoji: "🪕" },
    { label: "Corneta", value: "Bugle", emoji: "🎺" },
    { label: "Laúd", value: "Lute", emoji: "🪕" }
];

/**
 * Lista de tonalidades y escalas musicales con metadatos para búsqueda inteligente.
 * value: El ID técnico guardado en DB.
 * enharmonic: Valor equivalente (Db = C#).
 * vibe: Categoría emocional (happy, sad, dark, aggressive).
 * group: Clasificación para la UI (natural, accidental).
 */
export const MUSICAL_KEYS = [
    // TONALIDADES MAYORES (Major) - Vibes: Happy / Bright
    { label: "C Major", value: "C_maj", vibe: "happy", group: "natural" },
    { label: "Db / C# Major", value: "Db_maj", enharmonic: "Csharp_maj", vibe: "happy", group: "accidental" },
    { label: "D Major", value: "D_maj", vibe: "happy", group: "natural" },
    { label: "Eb / D# Major", value: "Eb_maj", enharmonic: "Dsharp_maj", vibe: "happy", group: "accidental" },
    { label: "E Major", value: "E_maj", vibe: "happy", group: "natural" },
    { label: "F Major", value: "F_maj", vibe: "happy", group: "natural" },
    { label: "Gb / F# Major", value: "Gb_maj", enharmonic: "Fsharp_maj", vibe: "happy", group: "accidental" },
    { label: "G Major", value: "G_maj", vibe: "happy", group: "natural" },
    { label: "Ab / G# Major", value: "Ab_maj", enharmonic: "Gsharp_maj", vibe: "happy", group: "accidental" },
    { label: "A Major", value: "A_maj", vibe: "happy", group: "natural" },
    { label: "Bb / A# Major", value: "Bb_maj", enharmonic: "Asharp_maj", vibe: "happy", group: "accidental" },
    { label: "B Major", value: "B_maj", vibe: "happy", group: "natural" },

    // TONALIDADES MENORES (Minor) - Vibes: Sad / Dark / Aggressive
    { label: "C Minor", value: "C_min", vibe: "sad", group: "natural" },
    { label: "C# / Db Minor", value: "Csharp_min", enharmonic: "Db_min", vibe: "aggressive", group: "accidental" },
    { label: "D Minor", value: "D_min", vibe: "sad", group: "natural" },
    { label: "Eb / D# Minor", value: "Eb_min", enharmonic: "Dsharp_min", vibe: "aggressive", group: "accidental" },
    { label: "E Minor", value: "E_min", vibe: "sad", group: "natural" },
    { label: "F Minor", value: "F_min", vibe: "dark", group: "natural" },
    { label: "F# / Gb Minor", value: "Fsharp_min", enharmonic: "Gb_min", vibe: "aggressive", group: "accidental" },
    { label: "G Minor", value: "G_min", vibe: "sad", group: "natural" },
    { label: "Ab / G# Minor", value: "Ab_min", enharmonic: "Gsharp_min", vibe: "dark", group: "accidental" },
    { label: "A Minor", value: "A_min", vibe: "sad", group: "natural" },
    { label: "Bb / A# Minor", value: "Bb_min", enharmonic: "Asharp_min", vibe: "aggressive", group: "accidental" },
    { label: "B Minor", value: "B_min", vibe: "dark", group: "natural" }
];
