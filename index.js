// 1. Cargar el manual una sola vez al iniciar el servidor (fuera de los eventos)
let cachedManualText = "";
try {
  const filePath = path.join(__dirname, 'manual.txt');
  if (fs.existsSync(filePath)) {
    cachedManualText = fs.readFileSync(filePath, 'utf8');
  }
} catch (error) {
  console.error("Error al leer el manual:", error);
}

// ... (configuración de app y express)

app.event('app_mention', async ({ event, say }) => {
  try {
    const blocks = cachedManualText.split(/\r?\n\s*\r?\n/).filter(b => b.trim().length > 0);
    const stopWords = ['el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'a', 'en', 'y', 'o', 'que', 'es', 'por', 'con', 'para', 'cuanto', 'cuantos', 'cual', 'cuales', 'donde', 'como', 'su', 'sus', 'al', 'me', 'le', 'lo', 'hacer', 'hace', 'si'];

    const normalizedQuery = normalizeText(event.text);
    
    // Detectar si el usuario busca un procedimiento u operación (ej: "que hacer", "como", "pasos")
    const isActionQuery = /hacer|proceder|pasos|como|reportar|falla/i.test(normalizedQuery);

    const keywords = normalizedQuery
      .split(' ')
      .map(w => w.replace(/[^a-z0-9]/gi, ''))
      .filter(w => w.length > 2 && !stopWords.includes(w));

    let bestBlock = "";
    let maxScore = 0;

    for (const block of blocks) {
      const normalizedBlock = normalizeText(block);
      
      // Ignorar índices
      if (normalizedBlock.includes('indice general') || normalizedBlock.includes('indice')) {
        continue;
      }

      // FILTRO ANTITRAMPA: Si es una consulta de acción, filtramos bloques de sanciones o cláusulas punitivas
      if (isActionQuery && (normalizedBlock.includes('clausula') || normalizedBlock.includes('terminacion') || normalizedBlock.includes('sancion'))) {
        continue; 
      }

      let score = 0;
      keywords.forEach(keyword => {
        if (normalizedBlock.includes(keyword)) {
          score += 1;
        }
      });

      if (score > maxScore) {
        maxScore = score;
        bestBlock = block;
      }
    }

    let reply = `¡Hola <@${event.user}>!\n\n`;

    if (maxScore > 0 && bestBlock) {
      reply += bestBlock;
    } else {
      reply += "⚠️ No encontré una sección específica para esa consulta en el manual. Prueba con palabras más directas (ej: *deposito*, *siniestro*, *taller*).";
    }

    await say({
      text: reply,
      thread_ts: event.ts,
    });
  } catch (error) {
    console.error('Error al responder a la mención:', error);
    await say({
      text: "Hubo un error procesando tu solicitud.",
      thread_ts: event.ts,
    });
  }
});
