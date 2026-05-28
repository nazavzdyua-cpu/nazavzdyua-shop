let adminPassword = "";
let allOrders = [];
let allProducts = [];
let editingProductId = null;

function loginAdmin() {
  const input = document.getElementById("adminPassword");
  adminPassword = input.value.trim();

  if (!adminPassword) {
    alert("Введіть пароль");
    return;
  }

  document.getElementById("loginBox").style.display = "none";
  document.getElementById("adminPanel").style.display = "block";

  loadOrders();
  loadProducts();
}

function switchTab(tab) {
  document.getElementById("ordersTab").style.display = tab === "orders" ? "block" : "none";
  document.getElementById("productsTab").style.display = tab === "products" ? "block" : "none";

  document.getElementById("ordersTabBtn").classList.toggle("active", tab === "orders");
  document.getElementById("productsTabBtn").classList.toggle("active", tab === "products");

  if (tab === "products") {
    loadProducts();
  }
}

/* ORDERS */

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
    <div><span>Всього</span><strong>${totalOrders}</strong></div>
    <div><span>Сума</span><strong>${totalSum} грн</strong></div>
    <div><span>Нові</span><strong>${newCount}</strong></div>
    <div><span>В роботі</span><strong>${workCount}</strong></div>
    <div><span>Готові</span><strong>${readyCount}</strong></div>
    <div><span>Відправлені</span><strong>${sentCount}</strong></div>
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
        return { ...order, status };
      }

      return order;
    });

    renderOrders();

  } catch (error) {
    alert(error.message);
  }
}

/* PRODUCTS */

async function loadProducts() {
  const productsList = document.getElementById("productsList");

  productsList.innerHTML = "<p class='admin-loading'>Завантаження товарів...</p>";

  try {
    const response = await fetch("/.netlify/functions/products-list");
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error("Не вдалося завантажити товари");
    }

    allProducts = result.products || [];

    renderProducts();

  } catch (error) {
    productsList.innerHTML = `<p class="admin-error">${error.message}</p>`;
  }
}

function renderProducts() {
  const productsList = document.getElementById("productsList");

  if (!productsList) return;

  if (allProducts.length === 0) {
    productsList.innerHTML = "<p class='admin-empty'>Товарів поки немає.</p>";
    return;
  }

  productsList.innerHTML = `
    <div class="admin-products-grid">
      ${allProducts.map(product => `
        <div class="admin-product-card">

          <div class="admin-product-image">
            ${
              product.image_url
                ? `<img src="${product.image_url}" alt="">`
                : `<div class="admin-product-placeholder">Фото немає</div>`
            }
          </div>

          <div class="admin-product-body">
            <div class="admin-product-head">
              <div>
                <h3>${product.name}</h3>
                <p>${product.price} грн</p>
              </div>

              <span class="product-status ${getProductStatusClass(product.status)}">
                ${product.status}
              </span>
            </div>

            <p class="admin-product-category">
              ${getCategoryName(product.category)}
            </p>

            <p class="admin-product-description">
              ${product.description || "Опис не додано"}
            </p>

            <div class="admin-product-actions">
              <button class="admin-main-btn small" onclick="openProductModal(${product.id})">
                Редагувати
              </button>

              <button class="admin-delete-btn" onclick="deleteProduct(${product.id})">
                Видалити
              </button>
            </div>
          </div>

        </div>
      `).join("")}
    </div>
  `;
}

function openProductModal(productId = null) {
  editingProductId = productId;

  const modal = document.getElementById("productModal");
  const title = document.getElementById("productModalTitle");

  if (productId) {
    const product = allProducts.find(item => item.id === productId);

    if (!product) return;

    title.innerText = "Редагування товару";

    document.getElementById("productName").value = product.name || "";
    document.getElementById("productPrice").value = product.price || "";
    document.getElementById("productCategory").value = product.category || "medalions";
    document.getElementById("productDescriptionType").value = product.description_type || "medalion";
    document.getElementById("productStatus").value = product.status || "В наявності";
    document.getElementById("productStock").value = product.stock ?? 1;
    document.getElementById("productDescription").value = product.description || "";
    document.getElementById("productImage").value = product.image_url || "";
    document.getElementById("productImagePreview").innerHTML =
  product.image_url
    ? `<img src="${product.image_url}" style="width:120px;height:120px;object-fit:cover;border-radius:18px;margin-top:12px;">`
    : "";
  } else {
    title.innerText = "Новий товар";

    document.getElementById("productName").value = "";
    document.getElementById("productPrice").value = "";
    document.getElementById("productCategory").value = "medalions";
    document.getElementById("productDescriptionType").value = "medalion";
    document.getElementById("productStatus").value = "В наявності";
    document.getElementById("productStock").value = 1;
    document.getElementById("productDescription").value = "";
    document.getElementById("productImage").value = "";
    document.getElementById("productImagePreview").innerHTML = "";
  }

  modal.style.display = "block";
}

function closeProductModal() {
  document.getElementById("productModal").style.display = "none";
  editingProductId = null;
}

async function saveProduct() {
  const name = document.getElementById("productName").value.trim();
  const price = document.getElementById("productPrice").value;
  const category = document.getElementById("productCategory").value;
  const description_type = document.getElementById("productDescriptionType").value;
  const stock = Number(document.getElementById("productStock").value || 0);

let status = "В наявності";

if (stock <= 0) {
  status = "Немає в наявності";
} else if (stock <= 2) {
  status = "Закінчується";
}
  const description = document.getElementById("productDescription").value.trim();
  let image_url = document.getElementById("productImage").value.trim();

const fileInput = document.getElementById("productImageFile");
const selectedFile = fileInput.files[0];
  if (selectedFile) {

  const base64 = await fileToBase64(selectedFile);

  const uploadRes = await fetch("/.netlify/functions/product-upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      password: adminPassword,
      fileBase64: base64,
      fileName: selectedFile.name,
      fileType: selectedFile.type
    })
  });

  const uploadData = await uploadRes.json();

  if (!uploadRes.ok || !uploadData.success) {
    throw new Error(uploadData.error || "Помилка завантаження фото");
  }

  image_url = uploadData.image_url;

  document.getElementById("productImage").value = image_url;
}
  if (!name || !price) {
    alert("Вкажіть назву і ціну товару");
    return;
  }

  try {
    const response = await fetch("/.netlify/functions/product-save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        password: adminPassword,
        id: editingProductId,
        name,
        price,
        category,
        description_type,
        status,
        description,
        image_url,
        image_path: "",
        sort_order: editingProductId ? getProductSortOrder(editingProductId) : allProducts.length + 1
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error("Не вдалося зберегти товар");
    }

    closeProductModal();
    await loadProducts();

  } catch (error) {
    alert(error.message);
  }
}

async function deleteProduct(productId) {
  const confirmDelete = confirm("Видалити цей товар?");

  if (!confirmDelete) return;

  try {
    const response = await fetch("/.netlify/functions/product-delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        password: adminPassword,
        id: productId
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error("Не вдалося видалити товар");
    }

    await loadProducts();

  } catch (error) {
    alert(error.message);
  }
}

function getProductSortOrder(productId) {
  const product = allProducts.find(item => item.id === productId);
  return product ? product.sort_order : 0;
}

function getCategoryName(category) {
  if (category === "medalions") return "Медальйони";
  if (category === "rings") return "Каблучки";
  if (category === "keychains") return "Брелоки";
  return category;
}

function getProductStatusClass(status) {
  if (status === "В наявності") return "product-available";
  if (status === "Закінчується") return "product-low";
  if (status === "Немає в наявності") return "product-out";
  return "";
}

/* HELPERS */

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
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result.split(",")[1]);
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
