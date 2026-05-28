exports.handler = async function(event) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=*&order=sort_order.asc`,
      {
        headers: {
          "apikey": SERVICE_KEY,
          "Authorization": `Bearer ${SERVICE_KEY}`
        }
      }
    );

    const products = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(products));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        products
      })
    };

  } catch (error) {
    console.log("PRODUCTS LIST ERROR:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
