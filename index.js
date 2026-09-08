const { App } = require('@slack/bolt');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot de Manuales ECR activo\n');
}).listen(PORT, () => {
  console.log(`Servidor HTTP escuchando en el puerto ${PORT}`);
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

function getManualContent() {
  try {
    const filePath = path.join(__dirname, 'manual.txt');
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    return "";
  } catch (error) {
    console.error("Error al leer el manual:", error);
    return "";
  }
}

app.event('app_mention', async ({ event, say }) => {
  try {
    const userQuery = event.text.toLowerCase();
    const manualText = getManualContent();
    const lines = manualText.split('\n');

    // Palabras comunes a ignorar para centrarse en lo importante
    const stopWords = ['el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'a', 'en', 'y', 'o', 'que', 'es', 'por', 'con', 'para', 'cuanto', 'cuantos', 'cual', 'cuales', 'donde', 'como', 'su', 'sus', 'al', 'me', 'le', 'lo'];

    // Extraer solo palabras clave relevantes (mayores a 2 letras y que no sean stop words)
    const keywords = userQuery
      .split(' ')
      .map(w => w.replace(/[^a-záéíóúñ0-9]/gi, ''))
      .filter(w => w.length > 2 && !stopWords.includes(w));

    let matchedLines = [];

    if (keywords.length > 0) {
      matchedLines = lines.filter(line => {
        const lowerLine = line.toLowerCase();
        return keywords.some(keyword => lowerLine.includes(keyword));
      });
    }

    let reply = `¡Hola <@${event.user}>!\n\n`;

    if (matchedLines.length > 0) {
      // Muestra únicamente las líneas que coinciden de forma estricta
      reply += matchedLines.join('\n');
    } else {
      reply += "⚠️ No encontré una coincidencia exacta en el manual para esa consulta. Prueba usando palabras más específicas (ej: *depósito*, *taller*, *siniestro*).";
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

(async () => {
  try {
    await app.start();
    console.log('⚡️ El Bot de Manuales ECR inteligente está en línea!');
  } catch (error) {
    console.error('Error al iniciar la aplicación de Slack:', error);
    process.exit(1);
  }
})();
