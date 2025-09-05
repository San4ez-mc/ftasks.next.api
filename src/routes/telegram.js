const express = require('express');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const { getPool } = require('../db');

const router = express.Router();

const {
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_SECRET,
  FRONTEND_URL,
  JWT_SECRET,
} = process.env;

router.post('/webhook', async (req, res) => {
  if (
    TELEGRAM_SECRET &&
    req.get('x-telegram-bot-api-secret-token') !== TELEGRAM_SECRET
  ) {
    return res.sendStatus(401);
  }
  const update = req.body;
  try {
    if (!update.message) return res.sendStatus(200);
    const { text, chat, from } = update.message;
    if (text === '/start auth') {
      const pool = getPool();
      const [rows] = await pool.execute(
        'SELECT id FROM users WHERE telegram_user_id = ?',
        [from.id]
      );
      let userId;
      if (rows.length === 0) {
        const [result] = await pool.execute(
          'INSERT INTO users (telegram_user_id, telegram_username, first_name, last_name) VALUES (?, ?, ?, ?)',
          [from.id, from.username || null, from.first_name || null, from.last_name || null]
        );
        userId = result.insertId;
      } else {
        userId = rows[0].id;
      }
      const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '5m' });
      const loginUrl = `${FRONTEND_URL}/auth/telegram/callback?token=${token}`;
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chat.id,
          text: 'Натисніть кнопку нижче, щоб увійти в таск трекер.',
          reply_markup: {
            inline_keyboard: [[{ text: 'Увійти в таск трекер', url: loginUrl }]]
          }
        })
      });
    } else {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chat.id,
          text: 'Ласкаво просимо! Для входу скористайтеся кнопкою входу в застосунку.'
        })
      });
    }
  } catch (err) {
    console.error('Telegram webhook error', err);
  }
  res.sendStatus(200);
});

router.get('/groups', auth, async (req, res) => {
  const { companyId } = req.query;
  if (!companyId)
    return res.status(400).json({ message: 'companyId is required' });
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT * FROM telegram_groups WHERE company_id = ?',
    [companyId]
  );
  res.json(rows);
});

router.post('/groups/link', auth, async (req, res) => {
  const { companyId, tgGroupId, title } = req.body;
  if (!companyId || !tgGroupId || !title)
    return res
      .status(400)
      .json({ message: 'companyId, tgGroupId and title are required' });
  const pool = getPool();
  const [result] = await pool.execute(
    'INSERT INTO telegram_groups (company_id, tg_group_id, title, linked_at) VALUES (?, ?, ?, NOW())',
    [companyId, tgGroupId, title]
  );
  res.json({ id: result.insertId, companyId, tgGroupId, title });
});

router.get('/groups/:groupId/members', auth, async (req, res) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT * FROM telegram_members WHERE tg_group_id = ?',
    [req.params.groupId]
  );
  res.json(rows);
});

module.exports = router;
