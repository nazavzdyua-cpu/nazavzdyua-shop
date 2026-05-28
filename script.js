let cart = [];
let currentProduct = null;
let detailProduct = null;
let allCatalogProducts = [];
let currentFilter = "all";

document.addEventListener("DOMContentLoaded", () => {
  loadCatalogProducts();
});

/* MENU */

function toggleMenu() {
  document.getElementById("sideMenu")?.classList.toggle("active");
  document.getElementById("menuOverlay")?.classList.toggle("active");
}

function closeMenu() {
  document.getElementById("sideMenu")?.classList.remove("active");
  document.getElementById("menuOverlay")?.classList.remove("active");
}

/* CATALOG */

async function loadCatalogProducts() {
  const grid = document.getElementById("productsGrid");

  if (!grid) return;

  grid.innerHTML = "<p>Завантаження товарів...</p>";

  try {
    const response = await fetch("/.netlify/functions/products-list");
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error("Не вдалося завантажити товари");
    }

    allCatalogProducts = result.products || [];
    renderCatalogProducts();

  } catch (error) {
    grid.innerHTML = "<p>Не вдалося завантажити товари. Спробуйте оновити сторінку.</p>";
  }
}

function getStockInfo(product) {
  const stock = Number(product.stock || 0);

  if (stock <= 0) {
    return {
      stock,
      status: "Немає в наявності",
      isOut: true,
      isLow: false,
      label: "Немає в наявності"
    };
  }

  if (stock <= 2) {
    return {
      stock,
      status: "Закінчується",
      isOut: false,
      isLow: true,
      label: `Закінчується • ${stock} шт`
    };
  }

  return {
    stock,
    status: "В наявності",
    isOut: false,
    isLow: false,
    label: `В наявності • ${stock} шт`
  };
}

function renderCatalogProducts() {
  const grid = document.getElementById("productsGrid");

  if (!grid) return;

  let products = [...allCatalogProducts];

  if (currentFilter !== "all") {
    products = products.filter(product => product.category === currentFilter);
  }

  if (products.length === 0) {
    grid.innerHTML = "<p>У цій категорії поки немає товарів.</p>";
    return;
  }

  grid.innerHTML = products.map(product => {
    const stockInfo = getStockInfo(product);
    const image = product.image_url || "images/logo.jpeg";

    return `
      <div class="card" data-category="${product.category}">
        <div class="product-image-wrap">
          <img
            src="${image}"
            alt="${product.name}"
            onclick="openProductDetailsFromId(${product.id})">

          <span class="catalog-status ${getCatalogStatusClass(stockInfo.status)}">
            ${stockInfo.label}
          </span>
        </div>

        <h3>${product.name}</h3>
        <p>${product.price} грн</p>

        ${
          stockInfo.isOut
            ? `<button class="disabled-btn" disabled>Немає в наявності</button>`
            : `<button onclick="openItemModalFromId(${product.id})">
                ${stockInfo.isLow ? "Замовити, поки є" : "Додати в корзину"}
              </button>`
        }
      </div>
    `;
  }).join("");
}

function filterProducts(category, button) {
  currentFilter = category;

  const buttons = document.querySelectorAll(".filter-btn");
  buttons.forEach(btn => btn.classList.remove("active"));

  if (button) {
    button.classList.add("active");
  }

  renderCatalogProducts();
}

function getCatalogStatusClass(status) {
  if (status === "В наявності") return "catalog-available";
  if (status === "Закінчується") return "catalog-low";
  if (status === "Немає в наявності") return "catalog-out";
  return "";
}

function getProductById(id) {
  return allCatalogProducts.find(product => Number(product.id) === Number(id));
}

/* DETAILS */

function getDescription(product) {
  if (product.description && product.description.trim()) {
    return `
      <p>${product.description}</p>
      ${getDefaultDescriptionExtra(product.description_type)}
    `;
  }

  return getDefaultDescription(product.description_type);
}

function getDefaultDescriptionExtra(type) {
  if (type === "medalion") {
    return `
      <ul>
        <li>Може містити 1–2 фото, текст або дату</li>
        <li>У комплекті — підвіска універсальної довжини</li>
        <li>Срібне покриття 925 проби</li>
        <li>Матеріал — нержавіюча ювелірна сталь</li>
        <li>Термін виготовлення — 2–3 дні</li>
      </ul>
      <p><strong>Передоплата:</strong> повна вартість замовлення, оскільки прикраса виготовляється індивідуально.</p>
    `;
  }

  if (type === "ring") {
    return `
      <ul>
        <li>Може містити 1–2 фото, текст або дату</li>
        <li>Розмір регулюється під будь-який палець</li>
        <li>Матеріал — нержавіюча ювелірна сталь</li>
        <li>Термін виготовлення — 2–3 дні</li>
      </ul>
      <p><strong>Передоплата:</strong> повна вартість замовлення, оскільки виріб створюється індивідуально.</p>
    `;
  }

  return `
    <ul>
      <li>Може містити 1 фото, текст, логотип або марку авто</li>
      <li>Підходить для ключів, сумок та інших аксесуарів</li>
      <li>Термін виготовлення — 2–3 дні</li>
    </ul>
    <p><strong>Передоплата:</strong> повна вартість замовлення, оскільки кожне замовлення індивідуальне.</p>
  `;
}

function getDefaultDescription(type) {
  if (type === "medalion") {
    return `
      <p><strong>Ваш спогад — завжди поруч.</strong></p>
      <p>Медальйон створений для моментів, які хочеться зберегти назавжди.</p>
      ${getDefaultDescriptionExtra("medalion")}
    `;
  }

  if (type === "ring") {
    return `
      <p><strong>Прикраса зі змістом та особистою історією.</strong></p>
      <p>Каблучка допомагає зберегти найважливіше поруч.</p>
      ${getDefaultDescriptionExtra("ring")}
    `;
  }

  return `
    <p><strong>Невеликий аксесуар із великим змістом.</strong></p>
    <p>Брелок може стати особистим символом або памʼятним подарунком.</p>
    ${getDefaultDescriptionExtra("keychain")}
  `;
}

function openProductDetailsFromId(id) {
  const product = getProductById(id);

  if (!product) return;

  const stockInfo = getStockInfo(product);

  detailProduct = product;

  document.getElementById("detailsModal").style.display = "block";
  document.getElementById("detailsImage").src = product.image_url || "images/logo.jpeg";
  document.getElementById("detailsTitle").innerText = product.name;
  document.getElementById("detailsPrice").innerText = `${product.price} грн`;
  document.getElementById("detailsText").innerHTML = `
    <p><strong>Статус:</strong> ${stockInfo.label}</p>
    ${getDescription(product)}
  `;

  const btn = document.getElementById("detailsCartBtn");

  if (stockInfo.isOut) {
    btn.innerText = "Немає в наявності";
    btn.disabled = true;
    btn.classList.add("disabled-btn");
  } else {
    btn.innerText = stockInfo.isLow
      ? "Замовити, поки є"
      : "Додати в корзину";

    btn.disabled = false;
    btn.classList.remove("disabled-btn");
  }
}

function closeDetailsModal() {
  document.getElementById("detailsModal").style.display = "none";
}

function addDetailsProductToCart() {
  if (!detailProduct) return;

  const stockInfo = getStockInfo(detailProduct);

  if (stockInfo.isOut) return;

  closeDetailsModal();
  openItemModalFromId(detailProduct.id);
}

/* ITEM MODAL */

function openItemModalFromId(id) {
  const product = getProductById(id);

  if (!product) return;

  const stockInfo = getStockInfo(product);

  if (stockInfo.isOut) return;

  openItemModal(product.name, product.price, product.image_url || "images/logo.jpeg");
}

function openItemModal(product, price, image) {
  currentProduct = {
    product,
    price: Number(price),
    image
  };

  document.getElementById("itemModal").style.display = "block";
  document.getElementById("itemImage").src = image;
  document.getElementById("itemTitle").innerText = product;
  document.getElementById("itemPrice").innerText = `${price} грн`;
  document.getElementById("itemQuantity").value = 1;

  renderUnitFields();
}

function closeItemModal() {
  document.getElementById("itemModal").style.display = "none";
}

function renderUnitFields() {
  const quantity = Number(document.getElementById("itemQuantity").value) || 1;
  const container = document.getElementById("unitFields");
  const isKeychain = currentProduct?.product?.toLowerCase().includes("брелок");

  container.innerHTML = "";

  for (let i = 1; i <= quantity; i++) {
    container.innerHTML += `
      <div class="unit-box">
        <h4>Прикраса ${i}</h4>

        <label class="form-label">Кількість фото</label>

        ${
          isKeychain
            ? `
              <select class="unit-photo-count" disabled>
                <option value="1">1 фото — входить у вартість</option>
              </select>
              <p class="cart-note">Для брелока доступне тільки 1 фото.</p>
            `
            : `
              <select class="unit-photo-count">
                <option value="1">1 фото — входить у вартість</option>
                <option value="2">2 фото — +49 грн</option>
              </select>
            `
        }

        <label class="form-label">Файл для прикраси</label>
        <input type="file" class="unit-file" accept="image/*">

        <textarea class="unit-comment" placeholder="Коментар для цієї прикраси"></textarea>
      </div>
    `;
  }
}

document.getElementById("itemQuantity")?.addEventListener("input", renderUnitFields);

function addCurrentToCart() {
  const photoCounts = document.querySelectorAll(".unit-photo-count");
  const files = document.querySelectorAll(".unit-file");
  const comments = document.querySelectorAll(".unit-comment");

  for (let i = 0; i < photoCounts.length; i++) {
    const photoCount = Number(photoCounts[i].value) || 1;
    const extra = photoCount === 2 ? 49 : 0;

    cart.push({
      product: currentProduct.product,
      price: currentProduct.price + extra,
      basePrice: currentProduct.price,
      photoCount,
      comment: comments[i].value,
      file: files[i].files[0] || null
    });
  }

  closeItemModal();
  updateCartButton();
  openCart();
}

/* CART */

function updateCartButton() {
  const count = document.getElementById("cartCount");
  if (count) count.innerText = cart.length;
}

function openCart() {
  document.getElementById("cartPanel").classList.add("active");
  renderCart();
}

function closeCart() {
  document.getElementById("cartPanel").classList.remove("active");
}

function removeCartItem(index) {
  cart.splice(index, 1);
  updateCartButton();
  renderCart();
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price, 0);
}

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");

  if (!cartItems || !cartTotal) return;

  if (cart.length === 0) {
    cartItems.innerHTML = `<p>Корзина порожня</p>`;
    cartTotal.innerText = `0 грн`;
    return;
  }

  cartItems.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
      <div>
        <strong>${item.product}</strong>
        <p>${item.price} грн</p>
        <p>${item.photoCount} фото</p>
        <p>${item.file ? item.file.name : "Файл не додано"}</p>
      </div>

      <button onclick="removeCartItem(${index})">×</button>
    </div>
  `).join("");

  cartTotal.innerText = `${getCartTotal()} грн`;
}

/* ORDER */

function openConfirmOrder() {
  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();

  if (!name || !phone) {
    alert("Вкажіть імʼя та номер телефону");
    return;
  }

  if (cart.length === 0) {
    alert("Корзина порожня");
    return;
  }

  const confirmContent = document.getElementById("confirmContent");

  confirmContent.innerHTML = `
    <p><strong>Імʼя:</strong> ${name}</p>
    <p><strong>Телефон:</strong> ${phone}</p>

    <h3>Замовлення:</h3>

    ${cart.map((item, index) => `
      <div class="confirm-item">
        <strong>${index + 1}. ${item.product}</strong>
        <p>Ціна: ${item.price} грн</p>
        <p>Кількість фото: ${item.photoCount}</p>
        <p>Файл: ${item.file ? item.file.name : "Не додано"}</p>
        <p>Коментар: ${item.comment || "Без коментаря"}</p>
      </div>
    `).join("")}

    <h3>Загальна сума: ${getCartTotal()} грн</h3>
  `;

  document.getElementById("confirmModal").style.display = "block";
}

function closeConfirmModal() {
  document.getElementById("confirmModal").style.display = "none";
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

async function confirmAndSendOrder() {
  const confirmBtn = document.getElementById("confirmSendBtn");

  confirmBtn.disabled = true;
  confirmBtn.innerText = "Відправляємо...";

  const items = [];

  for (const item of cart) {
    const fileBase64 = await fileToBase64(item.file);

    items.push({
      product: item.product,
      price: item.price,
      photoCount: item.photoCount,
      comment: item.comment,
      fileName: item.file ? item.file.name : "",
      fileType: item.file ? item.file.type : "",
      fileBase64
    });
  }

  const orderData = {
    customer: {
      name: document.getElementById("customerName").value,
      phone: document.getElementById("customerPhone").value
    },
    items,
    total: getCartTotal()
  };

  try {
    const response = await fetch("/.netlify/functions/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error("Помилка відправки");
    }

    closeConfirmModal();
    closeCart();

    document.getElementById("thanksModal").style.display = "block";

    const thanksTitle = document.querySelector("#thanksModal h2");
    const thanksText = document.querySelector("#thanksModal .wide-text");

    if (thanksTitle) {
      thanksTitle.innerText = `Дякуємо за замовлення №${result.orderId}!`;
    }

    if (thanksText) {
      thanksText.innerText = "Найближчим часом ми з вами звʼяжемось.";
    }

    cart = [];
    updateCartButton();
    renderCart();

  } catch (error) {
    alert("Сталася помилка. Спробуйте ще раз або напишіть нам в Instagram.");
  }

  confirmBtn.disabled = false;
  confirmBtn.innerText = "Підтвердити замовлення";
}

function closeThanksModal() {
  document.getElementById("thanksModal").style.display = "none";
}
