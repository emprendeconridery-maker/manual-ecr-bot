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
    return "El archivo manual.txt no se encuentra en el servidor.";
  } catch (error) {
    console.error("Error al leer el manual:", error);
    return "Error al cargar la información del manual.";
  }
}

app.event('app_mention', async ({ event, say }) => {
  try {
    const userQuery = event.text.toLowerCase();
    const manualText = getManualContent();
    const lines = manualText.split('\n');

    // Limpiamos la consulta y sacamos palabras clave (incluso de 2 letras o más)
    const keywords = userQuery.split(' ').map(w => w.replace(/[^a-záéíóúñ0-9]/gi, '')).filter(w => w.length > 1);

    let matchedLines = [];

    // Buscamos líneas que contengan al menos una de las palabras clave del usuario
    if (keywords.length > 0) {
      matchedLines = lines.filter(line => {
        const lowerLine = line.toLowerCase();
        return keywords.some(keyword => lowerLine.includes(keyword));
      });
    }

    let reply = `¡Hola <@${event.user}>!\n\n`;

    if (matchedLines.length > 0) {
      reply += "📌 **Esto es lo que encontré en el Manual de ECR:**\n" + matchedLines.join('\n');
    } else {
      reply += "📄 **Aquí tienes el contenido completo del manual:**\n" + manualText;
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
