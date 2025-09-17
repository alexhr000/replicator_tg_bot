
```bash
npm install -g wrangler
```

```bash
wrangler login
```

2. **Установите секреты:**
```bash
wrangler secret put BOT_TOKEN
wrangler secret put ADMIN_IDS
```

## Деплой

```bash
# Установите зависимости
npm install

# Запустите локально для тестирования
npm run dev

# Деплой на Cloudflare
npm run deploy
```

## Передеплой после изменений

После изменения `wrangler.toml` или `worker.js`:

```bash
# Просто запустите деплой заново
npm run deploy

# Или напрямую через wrangler
wrangler deploy
```

**Важно:** При изменении конфигурации (например, добавлении KV namespace) может потребоваться:

```bash
# Если добавили новые секреты
wrangler secret put NEW_SECRET_NAME

# Если добавили KV namespace
wrangler kv:namespace create "NAMESPACE_NAME"
```

## Настройка Webhook

После деплоя получите URL вашего Worker и установите webhook:

```bash
# Замените YOUR_WORKER_URL на ваш URL
curl "https://YOUR_WORKER_URL/set-webhook"





```

Или откройте в браузере: `https://YOUR_WORKER_URL/set-webhook`

## Преимущества Cloudflare Workers

- ✅ Бесплатный тариф (100,000 запросов в день)
- ✅ Глобальная сеть (быстрая доставка)
- ✅ Автоматическое масштабирование
- ✅ Нет необходимости в сервере
- ✅ Встроенная защита от DDoS

## Ограничения

- ⚠️ Подписчики хранятся в памяти (сбрасываются при перезапуске)
- ⚠️ Для постоянного хранения нужен KV или D1

## Просмотр логов

### 1. Через Wrangler CLI
```bash
# Логи в реальном времени
wrangler tail

# Логи с фильтром
wrangler tail --format=pretty

# Логи за последние 100 записей
wrangler tail --format=pretty --once
```

### 2. Через Cloudflare Dashboard
1. Зайдите в [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Выберите Workers & Pages
3. Найдите ваш Worker
4. Перейдите в раздел "Logs"

### 3. Программно (в коде)
```javascript
// В worker.js уже есть console.log
console.log(`Админ ${user_id} отправил сообщение: "${text}"`);
```

## Команды бота

### Для админов:
- `/add <user_id>` - добавить пользователя в вайтлист
- `/remove <user_id>` - удалить пользователя из вайтлиста

### Для всех пользователей:
- `/start` - показать информацию о боте

## Как работает вайтлист

1. **Только админы** могут добавлять/удалять пользователей из вайтлиста
2. **Сообщения отправляются** только пользователям из вайтлиста
3. **Вайтлист хранится** в Cloudflare KV (постоянное хранилище)

Рекомендуется использовать Cloudflare KV для хранения подписчиков:

```bash
wrangler kv:namespace create "SUBSCRIPTIONS"
```

И обновить `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "SUBSCRIPTIONS"
id = "your-kv-namespace-id"
```
