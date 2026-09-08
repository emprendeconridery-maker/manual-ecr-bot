const { App } = require('@slack/bolt');
const http = require('http');

// Puerto dinámico asignado por Render o por defecto 3000
const PORT = process.env.PORT || 3000;

// Servidor HTTP simple para cumplir con el requisito de puertos de Render
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot de Manuales ECR activo\n');
}).listen(PORT, () => {
  console.log(`Servidor HTTP escuchando en el puerto ${PORT}`);
});

// Inicialización de la aplicación Slack Bolt en Modo Socket
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

const MANUAL_CHANNEL_ID = process.env.MANUAL_CHANNEL_ID;

// Escucha menciones al bot o mensajes dirigidos
app.event('app_mention', async ({ event, say }) => {
  try {
    await say({
      text: `¡Hola <@${event.user}>! Consulta recibida. Buscando información en el canal de manuales...`,
      thread_ts: event.ts,
    });
  } catch (error) {
    console.error('Error al responder a la mención:', error);
  }
});

// Listener general para mensajes en el canal del manual
app.message(async ({ message, say }) => {
  // Ignora mensajes enviados por otros bots o por el propio bot
  if (message.subtype && message.subtype === 'bot_message') return;

  try {
    // Si el mensaje ocurre en el canal de manuales configurado
    if (message.channel === MANUAL_CHANNEL_ID) {
      console.log(`Mensaje recibido en el canal de manuales: ${message.text}`);
    }
  } catch (error) {
    console.error('Error procesando el mensaje:', error);
  }
});

// Función principal de arranque
(async () => {
  try {
    await app.start();
    console.log('⚡️ El Bot de Manuales ECR está ejecutándose en Modo Socket!');
  } catch (error) {
    console.error('Error al iniciar la aplicación de Slack:', error);
    process.exit(1);
  }
})();
