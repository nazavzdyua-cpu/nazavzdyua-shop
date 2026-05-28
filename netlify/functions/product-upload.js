exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    const data = JSON.parse(event.body);

    if (data.password !== process.env.ADMIN_PASSWORD) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          error: "Невірний пароль"
        })
      };
    }

    if (!data.fileBase64 || !data.fileName) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: "Файл не передано"
        })
      };
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const cleanFileName = data.fileName
      .replace(/\s+/g, "_")
      .replace(/[^\w.\-а-яА-ЯіїєґІЇЄҐ]/g, "");

    const filePath = `products/${Date.now()}-${cleanFileName}`;
    const buffer = Buffer.from(data.fileBase64, "base64");

    const uploadRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/product-images/${filePath}`,
      {
        method: "POST",
        headers: {
          "apikey": SERVICE_KEY,
          "Authorization": `Bearer ${SERVICE_KEY}`,
          "Content-Type": data.fileType || "application/octet-stream",
          "x-upsert": "true"
        },
        body: buffer
      }
    );

    const uploadText = await uploadRes.text();

    if (!uploadRes.ok) {
      throw new Error(uploadText);
    }

    const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/${filePath}`;

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        image_url: fileUrl,
        image_path: filePath
      })
    };

  } catch (error) {
    console.log("PRODUCT UPLOAD ERROR:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
