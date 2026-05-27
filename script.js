let selectedProduct = '';
let selectedPrice = '';
let selectedBasePrice = 0;

function openForm(product, price, image) {
  selectedProduct = product;
  selectedPrice = price;
  selectedBasePrice = parseInt(price);

  document.getElementById('popup').style.display = 'block';
  document.getElementById('productTitle').innerText = product;
  document.getElementById('productPrice').innerText = price;
  document.getElementById('popupImage').src = image;
  document.getElementById('successMessage').innerText = '';

  updateTotalPrice();
}

function closeForm() {
  document.getElementById('popup').style.display = 'none';
}

function updateTotalPrice() {
  const quantity = Number(document.getElementById('quantity').value) || 1;
  const photoCount = Number(document.getElementById('photoCount').value) || 1;

  const extraPhotoPrice = photoCount === 2 ? 49 : 0;
  const total = (selectedBasePrice + extraPhotoPrice) * quantity;

  document.getElementById('totalPrice').innerText =
    `Загальна вартість: ${total} грн`;
}

document.getElementById('quantity')?.addEventListener('input', updateTotalPrice);
document.getElementById('photoCount')?.addEventListener('change', updateTotalPrice);

document.getElementById('popup')?.addEventListener('click', function(e) {
  if (e.target.id === 'popup') closeForm();
});

document.getElementById('orderForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('submitBtn');
  const successMessage = document.getElementById('successMessage');

  const formData = new FormData();
  formData.append('product', selectedProduct);
  formData.append('price', selectedPrice);
  formData.append('name', document.getElementById('name').value);
  formData.append('phone', document.getElementById('phone').value);
  formData.append('quantity', document.getElementById('quantity').value);
  formData.append('photoCount', document.getElementById('photoCount').value);
  formData.append('totalPrice', document.getElementById('totalPrice').innerText);
  formData.append('comment', document.getElementById('comment').value);

  const photo = document.getElementById('photo').files[0];
  if (photo) formData.append('photo', photo);

  submitBtn.disabled = true;
  submitBtn.innerText = 'Відправляємо...';

  try {
    const response = await fetch('/.netlify/functions/order', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Помилка');

    successMessage.innerText =
      'Дякуємо за замовлення, найближчим часом ми з вами звʼяжемось';

    document.getElementById('orderForm').reset();
    updateTotalPrice();

  } catch (error) {
    successMessage.innerText =
      'Сталася помилка. Спробуйте ще раз або напишіть нам в Instagram.';
  }

  submitBtn.disabled = false;
  submitBtn.innerText = 'Оформити замовлення';
});