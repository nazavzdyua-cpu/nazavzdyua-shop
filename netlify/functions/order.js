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

    const itemsText = data.items.map((item, index) => {
      return `
${index + 1}. ${item.product}
Ціна: ${item.price} грн
Фото: ${item.photoCount}
Коментар: ${item.comment || "Без коментаря"}
Файл: ${item.fileName || "Не додано"}
`;
    }).join("\n");

    const message = `
🛍 НОВЕ ЗАМОВЛЕННЯ

👤 Імʼя: ${data.customer.name}
📞 Телефон: ${data.customer.phone}

📦 Товари:
${itemsText}

💵 Загальна сума: ${data.total} грн
`;

    const msgResponse = await fetch(
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

    const msgResult = await msgResponse.json();

    if (!msgResult.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify(msgResult)
      };
    }

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];

      if (item.fileBase64 && item.fileName) {
        const buffer = Buffer.from(item.fileBase64, "base64");

        const formData = new FormData();

        formData.append("chat_id", CHAT_ID);

        formData.append(
          "document",
          new Blob([buffer], {
            type: item.fileType || "application/octet-stream"
          }),
          item.fileName
        );

        formData.append(
          "caption",
          `${i + 1}. ${item.product}\nКоментар: ${item.comment || "Без коментаря"}`
        );

        await fetch(
          `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
          {
            method: "POST",
            body: formData
          }
        );
      }
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
        error: error.message
      })
    };
  }
};
