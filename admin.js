let adminPassword = "";

function loginAdmin() {
  const input = document.getElementById("adminPassword");
  adminPassword = input.value.trim();

  if (!adminPassword) {
    alert("Введіть пароль");
    return;
  }

  document.getElementById("loginBox").style.display = "none";
  document.getElementById("ordersBox").style.display = "block";

  loadOrders();
}

async function loadOrders() {
  const ordersList = document.getElementById("ordersList");

  ordersList.innerHTML = "<p>Завантаження...</p>";

  try {
    const response = await fetch("/.netlify/functions/admin-orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        password: adminPassword
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error("Невірний пароль або помилка завантаження");
    }

    if (result.orders.length === 0) {
      ordersList.innerHTML = "<p>Замовлень поки немає.</p>";
      return;
    }

    ordersList.innerHTML = result.orders.map(order => {
      const itemsHtml = order.items.map(item => `
        <div class="admin-item">
          <strong>${item.product}</strong>
          <p>Ціна: ${item.price} грн</p>
          <p>Фото: ${item.photo_count}</p>
          <p>Коментар: ${item.comment || "Без коментаря"}</p>
          ${
            item.file_url
              ? `<a href="${item.file_url}" target="_blank" class="admin-file">Відкрити файл</a>`
              : `<p>Файл не додано</p>`
          }
        </div>
      `).join("");

      return `
        <div class="admin-order">
          <div class="admin-order-head">
            <div>
              <h3>Замовлення №${order.id}</h3>
              <p>${formatDate(order.created_at)}</p>
            </div>

            <select onchange="updateStatus(${order.id}, this.value)">
              <option value="Нове" ${order.status === "Нове" ? "selected" : ""}>Нове</option>
              <option value="В роботі" ${order.status === "В роботі" ? "selected" : ""}>В роботі</option>
              <option value="Готове" ${order.status === "Готове" ? "selected" : ""}>Готове</option>
              <option value="Відправлено" ${order.status === "Відправлено" ? "selected" : ""}>Відправлено</option>
            </select>
          </div>

          <div class="admin-customer">
            <p><strong>Імʼя:</strong> ${order.customer_name}</p>
            <p><strong>Телефон:</strong> ${order.customer_phone}</p>
            <p><strong>Сума:</strong> ${order.total} грн</p>
          </div>

          <div class="admin-items">
            ${itemsHtml}
          </div>
        </div>
      `;
    }).join("");

  } catch (error) {
    ordersList.innerHTML = `<p class="admin-error">${error.message}</p>`;
  }
}

async function updateStatus(orderId, status) {
  try {
    const response = await fetch("/.netlify/functions/update-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        password: adminPassword,
        orderId,
        status
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error("Не вдалося оновити статус");
    }

  } catch (error) {
    alert(error.message);
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);

  return date.toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
