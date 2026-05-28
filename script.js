let cart = [];

let currentProduct = null;

function toggleMenu() {
  document.getElementById('sideMenu')?.classList.toggle('active');
  document.getElementById('menuOverlay')?.classList.toggle('active');
}

function closeMenu() {
  document.getElementById('sideMenu')?.classList.remove('active');
  document.getElementById('menuOverlay')?.classList.remove('active');
}

function openItemModal(name, price, image) {
    const isKeychain = name.toLowerCase().includes("брелок");

    document.getElementById("modal-product-name").textContent = name;
    document.getElementById("modal-product-price").textContent = price + " грн";
    document.getElementById("modal-product-image").src = image;

    const photoCountSelect = document.getElementById("photoCount");

    if (isKeychain) {
        photoCountSelect.value = "1";
        photoCountSelect.disabled = true;
        photoCountSelect.style.opacity = "0.5";
    } else {
        photoCountSelect.disabled = false;
        photoCountSelect.style.opacity = "1";
    }

    currentItem = {
        name,
        price,
        image
    };

    itemModal.classList.add("active");
}
  currentProduct = {
    product,
    price: Number(price),
    image
  };

  document.getElementById('itemModal').style.display = 'block';
  document.getElementById('itemImage').src = image;
  document.getElementById('itemTitle').innerText = product;
  document.getElementById('itemPrice').innerText = `${price} грн`;
  document.getElementById('itemQuantity').value = 1;

  renderUnitFields();
}

function closeItemModal() {
  document.getElementById('itemModal').style.display = 'none';
}

function renderUnitFields() {
  const quantity = Number(document.getElementById('itemQuantity').value) || 1;
  const container = document.getElementById('unitFields');

  container.innerHTML = '';

  for (let i = 1; i <= quantity; i++) {
    container.innerHTML += `
      <div class="unit-box">
        <h4>Прикраса ${i}</h4>

        <label class="form-label">Кількість фото</label>
        <select class="unit-photo-count">
          <option value="1">1 фото — входить у вартість</option>
          <option value="2">2 фото — +49 грн</option>
        </select>

        <label class="form-label">Файл для прикраси</label>
        <input type="file" class="unit-file" accept="image/*">

        <textarea class="unit-comment" placeholder="Коментар для цієї прикраси"></textarea>
      </div>
    `;
  }
}

document.getElementById('itemQuantity')?.addEventListener('input', renderUnitFields);

function addCurrentToCart() {
  const photoCounts = document.querySelectorAll('.unit-photo-count');
  const files = document.querySelectorAll('.unit-file');
  const comments = document.querySelectorAll('.unit-comment');

  for (let i = 0; i < photoCounts.length; i++) {
    const photoCount = Number(photoCounts[i].value);
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

function updateCartButton() {
  const count = document.getElementById('cartCount');
  if (count) {
    count.innerText = cart.length;
  }
}

function openCart() {
  document.getElementById('cartPanel').classList.add('active');
  renderCart();
}

function closeCart() {
  document.getElementById('cartPanel').classList.remove('active');
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
  const cartItems = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');

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
        <p>${item.file ? item.file.name : 'Файл не додано'}</p>
      </div>

      <button onclick="removeCartItem(${index})">×</button>
    </div>
  `).join('');

  cartTotal.innerText = `${getCartTotal()} грн`;
}

function openConfirmOrder() {
  const name = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();

  if (!name || !phone) {
    alert('Вкажіть імʼя та номер телефону');
    return;
  }

  if (cart.length === 0) {
    alert('Корзина порожня');
    return;
  }

  const confirmContent = document.getElementById('confirmContent');

  confirmContent.innerHTML = `
    <p><strong>Імʼя:</strong> ${name}</p>
    <p><strong>Телефон:</strong> ${phone}</p>

    <h3>Замовлення:</h3>

    ${cart.map((item, index) => `
      <div class="confirm-item">
        <strong>${index + 1}. ${item.product}</strong>
        <p>Ціна: ${item.price} грн</p>
        <p>Кількість фото: ${item.photoCount}</p>
        <p>Файл: ${item.file ? item.file.name : 'Не додано'}</p>
        <p>Коментар: ${item.comment || 'Без коментаря'}</p>
      </div>
    `).join('')}

    <h3>Загальна сума: ${getCartTotal()} грн</h3>
  `;

  document.getElementById('confirmModal').style.display = 'block';
}

function closeConfirmModal() {
  document.getElementById('confirmModal').style.display = 'none';
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result.split(',')[1]);
    };

    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

async function confirmAndSendOrder() {
  const confirmBtn = document.getElementById('confirmSendBtn');

  confirmBtn.disabled = true;
  confirmBtn.innerText = 'Відправляємо...';

  const items = [];

  for (const item of cart) {
    const fileBase64 = await fileToBase64(item.file);

    items.push({
      product: item.product,
      price: item.price,
      photoCount: item.photoCount,
      comment: item.comment,
      fileName: item.file ? item.file.name : '',
      fileType: item.file ? item.file.type : '',
      fileBase64
    });
  }

  const orderData = {
    customer: {
      name: document.getElementById('customerName').value,
      phone: document.getElementById('customerPhone').value
    },
    items,
    total: getCartTotal()
  };

  try {
    const response = await fetch('/.netlify/functions/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      throw new Error('Помилка відправки');
    }

    closeConfirmModal();
    closeCart();

    document.getElementById('thanksModal').style.display = 'block';

    cart = [];
    updateCartButton();
    renderCart();

  } catch (error) {
    alert('Сталася помилка. Спробуйте ще раз або напишіть нам в Instagram.');
  }

  confirmBtn.disabled = false;
  confirmBtn.innerText = 'Підтвердити замовлення';
}

function closeThanksModal() {
  document.getElementById('thanksModal').style.display = 'none';
}
