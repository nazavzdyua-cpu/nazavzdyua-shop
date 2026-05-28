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

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const stock = Number(data.stock || 0);

let status = "В наявності";

if (stock <= 0) {
  status = "Немає в наявності";
} else if (stock <= 2) {
  status = "Закінчується";
}

const productData = {
  name: data.name,
  price: Number(data.price),
  category: data.category,
  description_type: data.description_type,
  description: data.description || "",
  image_url: data.image_url || "",
  image_path: data.image_path || "",
  status,
  stock,
  sort_order: Number(data.sort_order || 0)
};

    let response;

    if (data.id) {
      response = await fetch(
        `${SUPABASE_URL}/rest/v1/products?id=eq.${data.id}`,
        {
          method: "PATCH",
          headers: {
            "apikey": SERVICE_KEY,
            "Authorization": `Bearer ${SERVICE_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
          },
          body: JSON.stringify(productData)
        }
      );
    } else {
      response = await fetch(
        `${SUPABASE_URL}/rest/v1/products`,
        {
          method: "POST",
          headers: {
            "apikey": SERVICE_KEY,
            "Authorization": `Bearer ${SERVICE_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
          },
          body: JSON.stringify(productData)
        }
      );
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(result));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        product: result[0]
      })
    };

  } catch (error) {
    console.log("PRODUCT SAVE ERROR:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
