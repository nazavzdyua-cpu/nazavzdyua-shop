const Busboy = require('busboy');

exports.handler = async function(event) {

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const CHAT_ID = process.env.CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return {
      statusCode: 500,
      body: 'BOT_TOKEN or CHAT_ID missing'
    };
  }

  const fields = {};
  let uploadedFile = null;

  await new Promise((resolve, reject) => {

    const busboy = Busboy({
      headers: event.headers
    });

    busboy.on('field', (name, value) => {
      fields[name] = value;
    });

    busboy.on('file', (name, file, info) => {

      const chunks = [];

      file.on('data', (data) => {
        chunks.push(data);
      });

      file.on('end', () => {
        uploadedFile = {
          filename: info.filename,
          mimeType: info.mimeType,
          buffer: Buffer.concat(chunks)
        };
      });
    });

    busboy.on('finish', resolve);
    busboy.on('error', reject);

    busboy.end(
      Buffer.from(
        event.body,
        event.isBase64Encoded ? 'base64' : 'utf8'
      )
    );
  });

  const message =
`🛍 НОВЕ ЗАМОВЛЕННЯ

📦 Товар: ${fields.product}
💰 Ціна: ${fields.price}
🔢 Кількість: ${fields.quantity}
🖼 Фото: ${fields.photoCount}
💳 ${fields.totalPrice}

👤 Ім’я: ${fields.name}
📱 Телефон: ${fields.phone}

📝 Коментар:
${fields.comment || 'Без коментаря'}
`;

  const tgResponse = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message
      })
    }
  );

  const tgData = await tgResponse.json();

  if (!tgData.ok) {
    return {
      statusCode: 500,
      body: JSON.stringify(tgData)
    };
  }

  if (uploadedFile && uploadedFile.buffer.length > 0) {

    const formData = new FormData();

    formData.append(
      'chat_id',
      CHAT_ID
    );

    formData.append(
      'photo',
      new Blob(
        [uploadedFile.buffer],
        {
          type: uploadedFile.mimeType
        }
      ),
      uploadedFile.filename || 'photo.jpg'
    );

    await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
      {
        method: 'POST',
        body: formData
      }
    );
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true
    })
  };
};
