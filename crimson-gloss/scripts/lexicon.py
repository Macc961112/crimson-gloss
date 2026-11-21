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
    for c in (k, k[:-1] if k.endswith('s') else k, k[:-2] if k.endswith('es') else k, k[:-1] if k.endswith(('a', 'o')) else k):
        if c in EMOJI: return EMOJI[c]
    if len(k) >= 6:
        for key, e in EMOJI.items():
            if len(key) >= 5 and (k.startswith(key[:5]) and key[:5] == k[:5]): return e
    return None
