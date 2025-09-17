// Cloudflare Worker версия Telegram бота

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Получаем секреты из переменных окружения
    const BOT_TOKEN = env.BOT_TOKEN;
    const ADMIN_IDS = env.ADMIN_IDS;
    
    // Webhook endpoint для Telegram
    if (url.pathname === '/webhook' && request.method === 'POST') {
      const update = await request.json();
      await handleUpdate(update, BOT_TOKEN, ADMIN_IDS, env.WHITELIST);
      return new Response('OK');
    }
    
    // Установка webhook
    if (url.pathname === '/set-webhook' && request.method === 'GET') {
      const webhookUrl = `${url.origin}/webhook`;
      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${webhookUrl}`);
      const result = await response.json();
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Telegram Bot Worker', { status: 200 });
  }
};

async function handleUpdate(update, BOT_TOKEN, ADMIN_IDS, WHITELIST) {
  if (!update.message) return;
  
  const message = update.message;
  const user_id = message.from.id;
  const text = message.text;
  const photo = message.photo;
  const video = message.video;
  const adminIds = ADMIN_IDS.split(',').map(id => parseInt(id.trim()));
  
  // Команда /start
  if (text === '/start') {
    await sendMessage(user_id, 'Обратитесь к администратору для добавления в вайтлист.', BOT_TOKEN);
    return;
  }
  
  // Команды для админов
  if (adminIds.includes(user_id)) {
    // Команда /add <user_id> - добавить пользователя в вайтлист
    if (text && text.startsWith('/add ')) {
      const targetUserId = text.split(' ')[1];
      if (targetUserId && !isNaN(targetUserId)) {
        await WHITELIST.put(`user_${targetUserId}`, 'true');
        await sendMessage(user_id, `Пользователь ${targetUserId} добавлен в вайтлист`, BOT_TOKEN);
        console.log(`Админ ${user_id} добавил пользователя ${targetUserId} в вайтлист`);
      } else {
        await sendMessage(user_id, 'Использование: /add <user_id>', BOT_TOKEN);
      }
      return;
    }
    
    // Команда /remove <user_id> - удалить пользователя из вайтлиста
    if (text && text.startsWith('/remove ')) {
      const targetUserId = text.split(' ')[1];
      if (targetUserId && !isNaN(targetUserId)) {
        await WHITELIST.delete(`user_${targetUserId}`);
        await sendMessage(user_id, `Пользователь ${targetUserId} удален из вайтлиста`, BOT_TOKEN);
        console.log(`Админ ${user_id} удалил пользователя ${targetUserId} из вайтлиста`);
      } else {
        await sendMessage(user_id, 'Использование: /remove <user_id>', BOT_TOKEN);
      }
      return;
    }
    
    
    // Обычное сообщение/медиа от админа - рассылка по вайтлисту
    let messageType = 'текст';
    if (photo) messageType = 'фото';
    else if (video) messageType = 'видео';
    
    console.log(`Админ ${user_id} отправил ${messageType}: "${text || 'медиафайл'}"`);
    
    // Получаем всех пользователей из вайтлиста
    const keys = await WHITELIST.list();
    const whitelistedUsers = keys.keys
      .filter(key => key.name.startsWith('user_'))
      .map(key => parseInt(key.name.replace('user_', '')));
    
    // Отправляем сообщение всем пользователям из вайтлиста (кроме админов)
    for (const userId of whitelistedUsers) {
      if (!adminIds.includes(userId)) {
        try {
          if (photo) {
            await sendPhoto(userId, photo, text, BOT_TOKEN);
          } else if (video) {
            await sendVideo(userId, video, text, BOT_TOKEN);
          } else if (text) {
            await sendMessage(userId, text, BOT_TOKEN);
          }
        } catch (error) {
          console.error(`Ошибка отправки ${messageType} пользователю ${userId}:`, error);
        }
      }
    }
    
    await sendMessage(user_id, `${messageType.charAt(0).toUpperCase() + messageType.slice(1)} отправлен ${whitelistedUsers.filter(id => !adminIds.includes(id)).length} пользователям`, BOT_TOKEN);
  }
}

async function sendMessage(chatId, text, BOT_TOKEN) {
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text
    })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

async function sendPhoto(chatId, photo, caption, BOT_TOKEN) {
  // Берем фото самого высокого качества
  const photoFileId = photo[photo.length - 1].file_id;
  
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoFileId,
      caption: caption || ''
    })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

async function sendVideo(chatId, video, caption, BOT_TOKEN) {
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendVideo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      video: video.file_id,
      caption: caption || ''
    })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}
