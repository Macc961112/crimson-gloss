"""Léxico: palabra clave -> emoji que la ilustra (español e inglés). Las claves van sin tildes y en singular."""
import re, unicodedata

EMOJI = {
    # dinero / negocios / trading
    'dinero': '💰', 'money': '💰', 'ganancia': '💰', 'beneficio': '🏆', 'profit': '💰', 'riqueza': '💎', 'rico': '💎', 'precio': '🏷️', 'oferta': '🏷️',
    'inversion': '📈', 'crecimiento': '📈', 'crecer': '📈', 'subir': '📈', 'sube': '📈', 'growth': '📈', 'mercado': '📊', 'trading': '📊', 'grafico': '📊', 'estadistica': '📊', 'dato': '📊',
    'perdida': '📉', 'caida': '📉', 'bajar': '📉', 'loss': '📉', 'riesgo': '⚠️', 'peligro': '⚠️', 'cuidado': '⚠️', 'alerta': '🚨',
    'banco': '🏦', 'tarjeta': '💳', 'cuenta': '🧾', 'factura': '🧾', 'empresa': '🏢', 'negocio': '🏢', 'oficina': '🏢', 'cliente': '🤝', 'venta': '🛒', 'comprar': '🛒', 'tienda': '🛒',
    'mentoria': '🤝', 'acuerdo': '🤝', 'equipo': '👥', 'comunidad': '👥', 'amigo': '🫂', 'familia': '👨‍👩‍👧', 'persona': '🧑', 'gente': '👥', 'jefe': '👔', 'ceo': '👔',
    # conocimiento
    'estudio': '📚', 'estudiar': '📚', 'aprender': '🧠', 'aprendizaje': '🧠', 'entender': '🧠', 'mente': '🧠', 'cerebro': '🧠', 'idea': '💡', 'ideas': '💡', 'consejo': '🧭', 'guia': '🧭', 'camino': '🛤️', 'rumbo': '🧭',
    'conocimiento': '🎓', 'curso': '🎓', 'escuela': '🏫', 'libro': '📖', 'leer': '📖', 'maestro': '🧑‍🏫', 'profesor': '🧑‍🏫', 'experto': '🧑‍🏫', 'secreto': '🤫', 'verdad': '🔍', 'buscar': '🔍', 'analisis': '🔍',
    'herramienta': '🛠️', 'indicador': '📟', 'estrategia': '♟️', 'plan': '🗺️', 'objetivo': '🎯', 'meta': '🎯', 'enfoque': '🎯', 'foco': '🎯', 'sistema': '⚙️', 'proceso': '⚙️', 'metodo': '⚙️',
    # esfuerzo / emoción
    'sacrificio': '🔥', 'esfuerzo': '💪', 'fuerza': '💪', 'disciplina': '⏱️', 'constancia': '🔁', 'paciencia': '⏳', 'tiempo': '⏳', 'hora': '⏰', 'dia': '📅', 'semana': '📅', 'mes': '📅', 'ano': '🗓️',
    'exito': '🏆', 'ganar': '🏆', 'victoria': '🏆', 'campeon': '🏆', 'premio': '🏆', 'limite': '🚧', 'limites': '🚧', 'miedo': '😨', 'duda': '🤔', 'pregunta': '❓', 'problema': '🧩', 'solucion': '🧩', 'error': '❌', 'fallo': '❌',
    'amor': '❤️', 'corazon': '❤️', 'pasion': '🔥', 'gustar': '❤️', 'feliz': '😄', 'alegria': '😄', 'triste': '😢', 'risa': '😂', 'sorpresa': '😮', 'importante': '⭐', 'mejor': '⭐', 'maximo': '🔝', 'primero': '🥇', 'facil': '✅', 'sencillo': '✅', 'rapido': '⚡', 'energia': '⚡',
    # mundo / tecnología
    'mundo': '🌎', 'planeta': '🌎', 'global': '🌐', 'internet': '🌐', 'web': '🌐', 'sitio': '🌐', 'enlace': '🔗', 'link': '🔗', 'app': '📱', 'telefono': '📱', 'movil': '📱', 'celular': '📱', 'computadora': '💻', 'ordenador': '💻', 'codigo': '💻', 'programar': '💻',
    'video': '🎬', 'pelicula': '🎬', 'camara': '🎥', 'reel': '🎞️', 'foto': '📷', 'imagen': '🖼️', 'musica': '🎵', 'cancion': '🎵', 'voz': '🎙️', 'microfono': '🎙️', 'podcast': '🎙️', 'mensaje': '💬', 'comentario': '💬', 'hablar': '💬', 'decir': '💬',
    'robot': '🤖', 'inteligencia': '🤖', 'ia': '🤖', 'futuro': '🚀', 'cohete': '🚀', 'lanzar': '🚀', 'lanzamiento': '🚀', 'espacio': '🌌', 'estrella': '⭐', 'luna': '🌙', 'sol': '☀️', 'noche': '🌙',
    # vida
    'casa': '🏠', 'hogar': '🏠', 'coche': '🚗', 'carro': '🚗', 'auto': '🚗', 'viaje': '✈️', 'avion': '✈️', 'playa': '🏖️', 'comida': '🍽️', 'cocina': '🍳', 'cocinar': '🍳', 'cafe': '☕', 'salud': '❤️‍🩹', 'ejercicio': '🏋️', 'gimnasio': '🏋️', 'deporte': '⚽', 'futbol': '⚽',
    'regalo': '🎁', 'fiesta': '🎉', 'celebrar': '🎉', 'trabajo': '💼', 'trabajar': '💼', 'carrera': '🏁', 'inicio': '🏁', 'empezar': '🏁', 'final': '🏁', 'libertad': '🕊️', 'paz': '🕊️', 'vida': '🌱', 'nuevo': '🆕', 'gratis': '🆓',
}

STOP = set('''que como pero porque cuando donde entonces tambien aunque desde hasta sobre entre para por con sin los las una uno unos unas del este esta esto estos estas ese esa eso muy mas menos todo toda todos todas cada otro otra
siempre nunca puede pueden tiene tienen hacer haces hace hecho estar esta estan estoy somos soy eres ser fue son era eran hay habia seria quiero quieres quiere voy vas van vamos algo alguien nada nadie aqui alli ahora despues antes luego mismo misma
the and but because when where then also though from until about between for with without this that these those very more less all each other always never can has have make does done are was were will would could should something someone nothing here there now after before same'''.split())

def norm(w):
    w = unicodedata.normalize('NFD', w.lower())
    return re.sub(r'[^a-z0-9ñ]', '', ''.join(c for c in w if unicodedata.category(c) != 'Mn'))

def emoji_for(word):
    k = norm(word)
    if not k: return None
    for c in (k, k[:-1] if k.endswith('s') else k, k[:-2] if k.endswith('es') and len(k) > 5 else k, k[:-1] if k.endswith(('a', 'o')) and len(k) > 5 else k):  # sin recortar palabras cortas (solo != sol)
        if c in EMOJI: return EMOJI[c]
    if len(k) >= 6:
        for key, e in EMOJI.items():
            if len(key) >= 5 and (k.startswith(key[:5]) and key[:5] == k[:5]): return e
    return None


# --- Cuentos: personajes, mundos y verbos de movimiento ---------------------------------------------
ACTORS = {
    'oso': '🐻', 'osito': '🐻', 'conejo': '🐰', 'conejito': '🐰', 'zorro': '🦊', 'gato': '🐱', 'gatito': '🐱', 'perro': '🐶', 'perrito': '🐶', 'leon': '🦁', 'tigre': '🐯', 'elefante': '🐘', 'mono': '🐒',
    'tortuga': '🐢', 'buho': '🦉', 'lechuza': '🦉', 'rana': '🐸', 'ranita': '🐸', 'mago': '🧙', 'bruja': '🧙‍♀️', 'hada': '🧚', 'sirena': '🧜‍♀️', 'unicornio': '🦄', 'dragon': '🐉', 'princesa': '👸', 'principe': '🤴',
    'rey': '🤴', 'reina': '👸', 'nina': '👧', 'nino': '👦', 'abuela': '👵', 'abuelo': '👴', 'robot': '🤖', 'pez': '🐠', 'pulpo': '🐙', 'pajaro': '🐦', 'pajarito': '🐦', 'lobo': '🐺', 'cerdito': '🐷', 'cerdo': '🐷',
    'oveja': '🐑', 'cordero': '🐑', 'vaca': '🐮', 'caballo': '🐴', 'pato': '🦆', 'patito': '🦆', 'abeja': '🐝', 'mariposa': '🦋', 'ballena': '🐳', 'tiburon': '🦈', 'delfin': '🐬', 'raton': '🐭', 'ardilla': '🐿️',
    'jirafa': '🦒', 'cebra': '🦓', 'hipopotamo': '🦛', 'cocodrilo': '🐊', 'serpiente': '🐍', 'gallina': '🐔', 'gallo': '🐓', 'pollito': '🐥', 'pinguino': '🐧', 'koala': '🐨', 'panda': '🐼', 'cangrejo': '🦀',
    'caracol': '🐌', 'hormiga': '🐜', 'dinosaurio': '🦖', 'fantasma': '👻', 'alien': '👽', 'astronauta': '👩‍🚀', 'loro': '🦜', 'bebe': '👶', 'payaso': '🤡', 'angel': '👼', 'cisne': '🦢', 'aguila': '🦅',
    'rabbit': '🐰', 'bear': '🐻', 'fox': '🦊', 'cat': '🐱', 'dog': '🐶', 'lion': '🦁', 'dragon_en': '🐉', 'princess': '👸', 'prince': '🤴', 'fairy': '🧚', 'wizard': '🧙',
}
WORLD_WORDS = {
    'bosque': 'forest', 'selva': 'jungle', 'jungla': 'jungle', 'mar': 'ocean', 'oceano': 'ocean', 'playa': 'beach', 'castillo': 'castle', 'reino': 'castle', 'palacio': 'castle', 'espacio': 'space', 'planeta': 'space',
    'cohete': 'space', 'galaxia': 'space', 'granja': 'farm', 'campo': 'farm', 'desierto': 'desert', 'ciudad': 'city', 'nieve': 'snow', 'invierno': 'snow', 'noche': 'night', 'dulces': 'candy', 'caramelo': 'candy', 'pastel': 'candy',
    'forest': 'forest', 'sea': 'ocean', 'castle': 'castle', 'space': 'space', 'farm': 'farm', 'snow': 'snow', 'night': 'night',
}
MOVE_STEMS = [('walk', ('camin', 'corr', 'pase', 'marcha', 'avanz', 'sigui', 'fue', 'llego')), ('fly', ('vuel', 'volo', 'volab', 'volar', 'flew', 'fly')), ('swim', ('nadab', 'nado', 'nadar', 'nadan', 'swam')),
              ('bounce', ('salt', 'brinc', 'rebot', 'jump')), ('sway', ('bail', 'cant', 'dance', 'sing')), ('float', ('dorm', 'flot', 'sleep'))]

def actor_for(word):
    k = norm(word)
    for c in (k, k[:-1] if k.endswith('s') else k, k[:-2] if k.endswith('es') and len(k) > 5 else k):
        if c in ACTORS: return ACTORS[c]
    return None

def move_for(words):
    for w in words:
        k = norm(w)
        for mv, stems in MOVE_STEMS:
            if any(k.startswith(st) for st in stems) and len(k) > 3: return mv
    return None
