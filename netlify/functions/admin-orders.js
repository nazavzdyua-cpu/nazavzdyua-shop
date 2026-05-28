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

    const ordersRes = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc`,
      {
        headers: {
          "apikey": SERVICE_KEY,
          "Authorization": `Bearer ${SERVICE_KEY}`
        }
      }
    );

    const orders = await ordersRes.json();

    if (!ordersRes.ok) {
      throw new Error(JSON.stringify(orders));
    }

    const itemsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/order_items?select=*&order=created_at.asc`,
      {
        headers: {
          "apikey": SERVICE_KEY,
          "Authorization": `Bearer ${SERVICE_KEY}`
        }
      }
    );

    const items = await itemsRes.json();

    if (!itemsRes.ok) {
      throw new Error(JSON.stringify(items));
    }

    const ordersWithItems = orders.map(order => ({
      ...order,
      items: items.filter(item => item.order_id === order.id)
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        orders: ordersWithItems
      })
    };

  } catch (error) {
    console.log("ADMIN ORDERS ERROR:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
