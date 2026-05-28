let adminPassword = "";
let allOrders = [];

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

  ordersList.innerHTML = "<p class='admin-loading'>Завантаження замовлень...</p>";

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

    allOrders = result.orders || [];

    renderOrders();

  } catch (error) {
    ordersList.innerHTML = `<p class="admin-error">${error.message}</p>`;
  }
}

function renderOrders() {
  const ordersList = document.getElementById("ordersList");
  const searchValue = document.getElementById("orderSearch")?.value.toLowerCase().trim() || "";
  const statusValue = document.getElementById("statusFilter")?.value || "all";

  let filteredOrders = [...allOrders];

  if (statusValue !== "all") {
    filteredOrders = filteredOrders.filter(order => order.status === statusValue);
  }

  if (searchValue) {
    filteredOrders = filteredOrders.filter(order => {
      return (
        String(order.id).includes(searchValue) ||
        String(order.customer_name).toLowerCase().includes(searchValue) ||
        String(order.customer_phone).toLowerCase().includes(searchValue)
      );
    });
  }

  renderStats(filteredOrders);

  if (filteredOrders.length === 0) {
    ordersList.innerHTML = "<p class='admin-empty'>Замовлень не знайдено.</p>";
    return;
  }

  ordersList.innerHTML = filteredOrders.map(order => {
    const itemsHtml = order.items.map(item => `
      <div class="admin-item-card">
        <div>
          <strong>${item.product}</strong>
          <p>Ціна: ${item.price} грн</p>
          <p>Фото: ${item.photo_count}</p>
          <p>Коментар: ${item.comment || "Без коментаря"}</p>
        </div>

        ${
          item.file_url
            ? `<a href="${item.file_url}" target="_blank" class="admin-file-btn">Відкрити файл</a>`
            : `<span class="admin-no-file">Файл не додано</span>`
        }
      </div>
    `).join("");

    return `
      <div class="admin-order-card">

        <div class="admin-order-header">
          <div>
            <span class="admin-order-number">№${order.id}</span>
            <h3>Замовлення №${order.id}</h3>
            <p>${formatDate(order.created_at)}</p>
          </div>

          <span class="status-badge ${getStatusClass(order.status)}">
            ${order.status}
          </span>
        </div>

        <div class="admin-order-info">
          <div>
            <span>Імʼя</span>
            <strong>${order.customer_name}</strong>
          </div>

          <div>
            <span>Телефон</span>
            <strong>${order.customer_phone}</strong>
          </div>

          <div>
            <span>Сума</span>
            <strong>${order.total} грн</strong>
          </div>
        </div>

        <div class="admin-items-list">
          ${itemsHtml}
        </div>

        <div class="admin-order-actions">
          <select onchange="updateStatus(${order.id}, this.value)">
            <option value="Нове" ${order.status === "Нове" ? "selected" : ""}>Нове</option>
            <option value="В роботі" ${order.status === "В роботі" ? "selected" : ""}>В роботі</option>
            <option value="Готове" ${order.status === "Готове" ? "selected" : ""}>Готове</option>
            <option value="Відправлено" ${order.status === "Відправлено" ? "selected" : ""}>Відправлено</option>
          </select>
        </div>

      </div>
    `;
  }).join("");
}

function renderStats(orders) {
  const statsBox = document.getElementById("adminStats");

  if (!statsBox) return;

  const totalOrders = orders.length;
  const totalSum = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

  const newCount = orders.filter(order => order.status === "Нове").length;
  const workCount = orders.filter(order => order.status === "В роботі").length;
  const readyCount = orders.filter(order => order.status === "Готове").length;
  const sentCount = orders.filter(order => order.status === "Відправлено").length;

  statsBox.innerHTML = `
    <div>
      <span>Всього</span>
      <strong>${totalOrders}</strong>
    </div>

    <div>
      <span>Сума</span>
      <strong>${totalSum} грн</strong>
    </div>

    <div>
      <span>Нові</span>
      <strong>${newCount}</strong>
    </div>

    <div>
      <span>В роботі</span>
      <strong>${workCount}</strong>
    </div>

    <div>
      <span>Готові</span>
      <strong>${readyCount}</strong>
    </div>

    <div>
      <span>Відправлені</span>
      <strong>${sentCount}</strong>
    </div>
  `;
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

    allOrders = allOrders.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          status
        };
      }

      return order;
    });

    renderOrders();

  } catch (error) {
    alert(error.message);
  }
}

function getStatusClass(status) {
  if (status === "Нове") return "status-new";
  if (status === "В роботі") return "status-work";
  if (status === "Готове") return "status-ready";
  if (status === "Відправлено") return "status-sent";

  return "";
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
