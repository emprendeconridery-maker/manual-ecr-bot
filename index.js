const { App } = require('@slack/bolt');

const app = new App({
  token: "xoxb-TU-BOT-TOKEN-AQUI", // Pega aquí tu xoxb-...
  signingSecret: "TU-SIGNING-SECRET-AQUI", // Pega aquí tu Signing Secret
  socketMode: true,
  appToken: "xapp-TU-APP-TOKEN-AQUI" // Pega aquí tu xapp-... (App-Level Token)
});

const MANUAL_CHANNEL_ID = "AQUI_EL_ID_DEL_CANAL"; // Ej: C12345678

app.event('app_mention', async ({ event, say }) => {
  try {
    const userQuery = event.text.replace(/<@.*?>/, '').trim();
    
    const result = await app.client.conversations.history({
      channel: MANUAL_CHANNEL_ID,
      limit: 50
    });

    const messages = result.messages || [];
    const match = messages.find(msg => 
      msg.text && msg.text.toLowerCase().includes(userQuery.toLowerCase())
    );

    if (match) {
      await say({
        text: `Encontré esto en el manual <#${MANUAL_CHANNEL_ID}>:\n> ${match.text}`,
        thread_ts: event.ts
      });
    } else {
      await say({
        text: "No encontré un procedimiento exacto para esa consulta en el canal #manual-ecr.",
        thread_ts: event.ts
      });
    }
  } catch (error) {
    console.error(error);
  }
});

(async () => {
  await app.start();
  console.log('⚡️ ¡Bot de Manuales ECR activo!');
})();