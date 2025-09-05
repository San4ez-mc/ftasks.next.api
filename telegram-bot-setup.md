# Telegram Bot Setup & Technical Specification

This document provides a guide for setting up the Telegram bot and outlines the technical requirements for its backend logic.

## 1. Creating the Bot in Telegram

1. **Find BotFather**: Open Telegram and search for the official `@BotFather` bot.
2. **Create a New Bot**: Send the `/newbot` command to BotFather.
3. **Choose a Name and Username**:
   * **Name**: This is the display name (e.g., `FINEKO Tasks`).
   * **Username**: This must be unique and end in `bot` (e.g., `FinekoTasks_Bot`).
4. **Save the HTTP API Token**: BotFather will provide you with a token. This is your bot's secret key. Store it securely in your backend's environment variables (e.g., `TELEGRAM_BOT_TOKEN`). **Do not expose this token on the frontend.**
5. **Generate a Secret Token**: Create a random string and keep it in your `.env` as `TELEGRAM_SECRET`. Telegram will include this value in the `X-Telegram-Bot-Api-Secret-Token` header for each webhook call.

## 2. Bot Backend Logic

Your backend server (e.g., `https://api.tasks.fineko.space/`) needs to handle incoming updates from Telegram. The recommended method is to use a **webhook**.

### Setting the Webhook

You need to tell Telegram where to send updates for your bot. This is done by making a single API call:

`https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_BACKEND_WEBHOOK_URL>&secret_token=<YOUR_TELEGRAM_SECRET>`

- `<YOUR_BOT_TOKEN>`: The token you got from BotFather.
- `<YOUR_BACKEND_WEBHOOK_URL>`: A public URL on your backend that will receive POST requests from Telegram (e.g., `https://api.tasks.fineko.space/telegram/webhook`). This endpoint must be accessible without authentication so that Telegram can reach it.
- `<YOUR_TELEGRAM_SECRET>`: The same value as `TELEGRAM_SECRET` from your environment.

### Handling the `/start` Command

The core of the authentication flow relies on the `/start` command with a specific payload.

**Login Flow:**
1. The frontend redirects the user to `https://t.me/YourBotUsername_Bot?start=auth`.
2. Telegram sends an `update` object to your webhook URL. The `message.text` will be `/start auth`.

**Backend Webhook Logic (`/telegram/webhook`):**

When your webhook receives a message:

1. **Check for `/start auth`**:
   * If the message text is `/start auth`, proceed with the authentication logic.
   * If it's just `/start` or any other message, you can provide a helpful response (e.g., "Welcome! To log in to the FINEKO app, please use the login button inside the application.").

2. **Extract User Data**: The `update.message.from` object will contain the user's Telegram information:
   ```json
   {
     "id": 123456789,
     "is_bot": false,
     "first_name": "John",
     "last_name": "Doe",
     "username": "johndoe",
     "language_code": "en"
   }
   ```

3. **Find or Create User**:
   * Use the `id` (`tgUserId`) from the Telegram user data to look up a user in your `users` database table.
   * If the user exists, retrieve their profile.
   * If the user does not exist, create a new user record in your database with their Telegram details.

4. **Generate a Temporary JWT**:
   * Create a short-lived JSON Web Token (JWT). This token should be different from your permanent session tokens.
   * **Payload**: The JWT payload must contain the `userId` from your database.
   * **Expiration**: Set a very short expiration time (e.g., 1-5 minutes) to ensure it can only be used once for login.
   * Sign the token with a secret key stored on your backend (e.g., `JWT_SECRET`).

5. **Construct the Redirect URL**:
    * Create the URL for the user to be redirected back to the frontend:
       `https://[FRONTEND_URL]/auth/telegram/callback?token=<temporary_jwt_token>`
    * `[FRONTEND_URL]` should be a configurable environment variable on your backend (e.g., `FRONTEND_URL`).

6. **Send a Reply Message**:
   * Use the Telegram Bot API's `sendMessage` method to send a message back to the user.
   * This message should contain an **inline keyboard** with a "Log in to task tracker" button that points to the redirect URL you just constructed.

   **Example `sendMessage` request body:**
   ```json
   {
     "chat_id": 123456789,
    "text": "Please click the button below to log in to the task tracker.",
     "reply_markup": {
       "inline_keyboard": [
         [
           {
             "text": "Log in to task tracker",
             "url": "https://[FRONTEND_URL]/auth/telegram/callback?token=..."
           }
         ]
       ]
     }
   }
   ```

This setup ensures a secure, one-time-use login link is provided to the user, bridging the gap between Telegram and your web application.
