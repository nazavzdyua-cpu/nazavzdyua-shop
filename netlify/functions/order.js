exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed"
    };
  }

  try {
    const data = JSON.parse(event.body);

    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHAT_ID = process.env.CHAT_ID;

    const message = `
🛍 НОВЕ ЗАМОВЛЕННЯ

💍 Товар: ${data.product}
💰 Ціна: ${data.price}
🔢 Кількість: ${data.quantity}
🖼 Фото: ${data.photoCount}
💵 ${data.totalPrice}

👤 Ім’я: ${data.name}
📞 Телефон: ${data.phone}

📝 Коментар:
${data.comment || "Без коментаря"}
`;

    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message
        })
      }
    );

    const result = await response.json();

    if (!result.ok) {
      console.log("TELEGRAM ERROR:", result);

      return {
        statusCode: 500,
        body: JSON.stringify(result)
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true
      })
    };

  } catch (error) {
    console.log("ORDER ERROR:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        full: String(error)
      })
    };
  }
};
