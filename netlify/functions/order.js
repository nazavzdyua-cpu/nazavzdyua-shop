exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_KEY) {
      throw new Error("Supabase env variables are missing");
    }

    const data = JSON.parse(event.body);

    const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: "POST",
      headers: {
        "apikey": SERVICE_KEY,
        "Authorization": `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        customer_name: data.customer.name,
        customer_phone: data.customer.phone,
        total: data.total,
        status: "Нове"
      })
    });

    const orderJson = await orderRes.json();

    if (!orderRes.ok) {
      throw new Error(JSON.stringify(orderJson));
    }

    const order = orderJson[0];
    const orderId = order.id;

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];

      let fileUrl = "";
      let fileName = item.fileName || "";

      if (item.fileBase64 && item.fileName) {
        const cleanFileName = item.fileName
          .replace(/\s+/g, "_")
          .replace(/[^\w.\-а-яА-ЯіїєґІЇЄҐ]/g, "");

        const filePath = `order-${orderId}/${Date.now()}-${i}-${cleanFileName}`;
        const buffer = Buffer.from(item.fileBase64, "base64");

        const uploadRes = await fetch(
          `${SUPABASE_URL}/storage/v1/object/order-files/${filePath}`,
          {
            method: "POST",
            headers: {
              "apikey": SERVICE_KEY,
              "Authorization": `Bearer ${SERVICE_KEY}`,
              "Content-Type": item.fileType || "application/octet-stream",
              "x-upsert": "true"
            },
            body: buffer
          }
        );

        const uploadText = await uploadRes.text();

        if (!uploadRes.ok) {
          throw new Error(uploadText);
        }

        fileUrl = `${SUPABASE_URL}/storage/v1/object/public/order-files/${filePath}`;
      }

      const itemRes = await fetch(`${SUPABASE_URL}/rest/v1/order_items`, {
        method: "POST",
        headers: {
          "apikey": SERVICE_KEY,
          "Authorization": `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          order_id: orderId,
          product: item.product,
          price: item.price,
          photo_count: item.photoCount,
          comment: item.comment || "",
          file_name: fileName,
          file_url: fileUrl
        })
      });

      const itemText = await itemRes.text();

      if (!itemRes.ok) {
        throw new Error(itemText);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        orderId: orderId
      })
    };

  } catch (error) {
    console.log("ORDER ERROR:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
