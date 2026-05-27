const axios = require("axios");

exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body);

    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHAT_ID = process.env.CHAT_ID;

    const text = `
🛍 НОВЕ ЗАМОВЛЕННЯ

👤 Ім’я: ${data.name}
📞 Телефон: ${data.phone}
💍 Товар: ${data.product}
📝 Коментар: ${data.comment || "-"}
`;

    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        chat_id: CHAT_ID,
        text: text,
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
      }),
    };
  }
};
