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

// Función para obtener el contenido del Canvas del canal
async function getCanvasContent(channelId) {
  try {
    const result = await app.client.conversations.canvases.get({
      channel_id: channelId,
    });
    return result.canvas?.content?.markdown || "No se pudo leer el contenido del canvas.";
  } catch (error) {
    console.error("Error al leer el Canvas:", error);
    return "Método RIDED:\n- R: Saludo cálido y personalizado\n- I: Indagar necesidades\n- D: Dar solución correcta\n- E: Escuchar problemas\n- D: Despedir con autogestión.";
  }
}

// Escucha menciones al bot
app.event('app_mention', async ({ event, say }) => {
  try {
    const userQuery = event.text.toLowerCase();
    
    // Obtenemos el contenido actualizado del Canvas del canal
    const canvasText = await getCanvasContent(event.channel);

    let reply = `¡Hola <@${event.user}>! Basándome en el Manual de ECR:\n\n`;

    if (userQuery.includes('rided') || userQuery.includes('protocolo') || userQuery.includes('contacto')) {
      reply += "📋 **Método RIDED extraído del Canvas:**\n" + canvasText;
    } else if (userQuery.includes('cuota') || userQuery.includes('siniestro')) {
      reply += "📌 **Información del Canvas:**\n" + canvasText;
    } else {
      reply += "Aquí tienes la información general registrada:\n" + canvasText;
    }

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
