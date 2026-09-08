const { App } = require('@slack/bolt');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Servidor HTTP simple para mantener el puerto activo en Render
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

// Función para leer el manual localmente
function getManualContent() {
  try {
    const filePath = path.join(__dirname, 'manual.txt');
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    return "El archivo manual.txt aún no ha sido creado en el servidor.";
  } catch (error) {
    console.error("Error al leer el manual:", error);
    return "Error al cargar la información del manual.";
  }
}

// Escucha menciones al bot
app.event('app_mention', async ({ event, say }) => {
  try {
    const userQuery = event.text.toLowerCase();
    const manualText = getManualContent();
    
    // Separamos el manual en párrafos o líneas para buscar coincidencias relevantes
    const lines = manualText.split('\n');
    let matchedLines = [];

    // Buscador inteligente por palabras clave de la pregunta del usuario
    const keywords = userQuery.split(' ').filter(word => word.length > 3); // Ignora palabras muy cortas
    
    if (keywords.length > 0) {
      matchedLines = lines.filter(line => {
        const lowerLine = line.toLowerCase();
        return keywords.some(keyword => lowerLine.includes(keyword));
      });
    }

    let reply = `¡Hola <@${event.user}>! Analizando tu consulta:\n\n`;

    if (matchedLines.length > 0) {
      reply += "📌 **Esto es lo que encontré en el Manual de ECR para ti:**\n" + matchedLines.join('\n');
    } else {
      // Si no encuentra una coincidencia exacta, muestra una sección general o el manual completo resumido
      reply += "⚠️ No encontré una coincidencia exacta con esas palabras. Aquí tienes un extracto general del manual:\n" + lines.slice(0, 15).join('\n');
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
