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

// Función mejorada para obtener y depurar el contenido del Canvas del canal
async function getCanvasContent(channelId) {
  try {
    const result = await app.client.conversations.canvases.get({
      channel_id: channelId,
    });
    
    // Imprimimos la estructura completa en los logs de Render para inspeccionarla
    console.log("Estructura del Canvas recibida:", JSON.stringify(result, null, 2));

    const canvasData = result.canvas;
    if (canvasData && canvasData.document_content) {
      return canvasData.document_content; 
    }
    
    return result.canvas?.content?.markdown || JSON.stringify(result, null, 2);
  } catch (error) {
    console.error("Error detallado al leer el Canvas:", error);
    return "No se pudo extraer la información del Canvas. Revisa los logs de Render para más detalles.";
  }
}

// Escucha menciones al bot
app.event('app_mention', async ({ event, say }) => {
  try {
    const userQuery = event.text.toLowerCase();
    
    // Obtenemos el contenido actualizado del Canvas del canal
    const canvasText = await getCanvasContent(event.channel);

    let reply = `¡Hola <@${event.user}>! Basándome en el Manual de ECR:\n\n`;
    reply += canvasText;

    await say({
      text: reply,
      thread_ts: event.ts,
    });
  } catch (error) {
    console.error('Error al responder a la mención:', error);
    await say({
      text: "Hubo un pequeño error procesando tu consulta con el manual.",
      thread_ts: event.ts,
    });
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
