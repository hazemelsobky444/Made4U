// ===============================================
// 2. صفحة Details ديناميكية
// ===============================================
const detailsContainer = document.getElementById('detailsContainer');

async function loadProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    if (!productId || !detailsContainer) return;

    detailsContainer.innerHTML = '<p style="text-align:center;padding:50px;">جارٍ تحميل تفاصيل المنتج...</p>';

    try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const product = await response.json();

        detailsContainer.innerHTML = `
            <div class="content">
                <div class="product-img">
                    <img src="${product.image || '../media/default-product.jpg'}" id="productImage" alt="${product.name}">
                </div>
                <div class="text">
                    <div class="details">
                        <h1 class="product-name">${product.name}</h1>
                        <p class="price">${product.price} EGP</p>
                        <p class="description-text">${product.description || 'لا يوجد وصف متاح.'}</p>
                    </div>
                    <div class="sizes">
                        ${product.sizes.split(',').map(size => `<a href="#" data-size="${size.trim()}">${size.trim()}</a>`).join('')}
                    </div>
                    <div class="bey-details">
                        <div class="quantity-counter">
                            <button id="decrement-btn" class="counter-btn minus-btn">-</button>
                            <span id="quantity-display">1</span>
                            <button id="increment-btn" class="counter-btn plus-btn">+</button>
                        </div>
                        <button id="add-to-cart-details-btn" class="add-to-cart cart-button" 
                                data-id="${product.id}" data-name="${product.name}" 
                                data-price="${product.price}" data-image="${product.image}" data-sizes="" data-qty="1">
                            Add To Cart
                        </button>
                        <a href="" class="bey-button">Buy Now</a>
                    </div>
                </div>
            </div>
        `;

        const decBtn = document.getElementById('decrement-btn');
        const incBtn = document.getElementById('increment-btn');
        const qtyDisplay = document.getElementById('quantity-display');
        const cartBtn = document.getElementById('add-to-cart-details-btn');

        initializeDetailsPageEvents(product, decBtn, incBtn, qtyDisplay, cartBtn);

    } catch (error) {
        console.error('فشل تحميل التفاصيل:', error);
        detailsContainer.innerHTML = '<p style="color:red;text-align:center;padding:50px;">تعذر تحميل بيانات المنتج.</p>';
    }
}



function initializeDetailsPageEvents(product, decBtn, incBtn, qtyDisplay, cartBtn) {
    if (!decBtn || !incBtn || !qtyDisplay || !cartBtn) return;

    let quantity = 1;
    const MIN_QUANTITY = 1;
    const sizeLinks = document.querySelectorAll('.sizes a');
    let selectedSize = sizeLinks[0]?.dataset.size || product.sizes.split(',')[0] || 'L';
    cartBtn.dataset.sizes = selectedSize;

    sizeLinks.forEach(link => { if(link.dataset.size === selectedSize) link.classList.add('active-size'); });

    function updateDisplay(){
        qtyDisplay.textContent = quantity;
        cartBtn.dataset.qty = quantity;
        if(quantity === MIN_QUANTITY) decBtn.setAttribute('disabled','disabled'); 
        else decBtn.removeAttribute('disabled');
    }

    sizeLinks.forEach(link => {
        link.addEventListener('click', e=>{
            e.preventDefault();
            sizeLinks.forEach(l=>l.classList.remove('active-size'));
            link.classList.add('active-size');
            selectedSize = link.dataset.size;
            cartBtn.dataset.sizes = selectedSize;
        });
    });

    incBtn.addEventListener('click', ()=> { quantity++; updateDisplay(); });
    decBtn.addEventListener('click', ()=> { if(quantity>MIN_QUANTITY) {quantity--; updateDisplay();} });

    updateDisplay();
}



















document.addEventListener('click',function(e){
    const btn=e.target.closest('.add-to-cart');
    if(!btn) return;
    e.preventDefault();

    const qty=parseInt(btn.dataset.qty||1,10);
    const id=btn.dataset.id||Date.now().toString();
    const name=btn.dataset.name||'Product';
    const price=parseFloat(btn.dataset.price||'0')||0;
    const image=btn.dataset.image||'../media/default-product.jpg';
    const sizes=btn.dataset.sizes||'';

    addToCart({id,name,price,image,sizes,qty});
    window.location.href='../html/cart.html';
});

const checkoutBtn=document.getElementById('checkoutBtn');
if(checkoutBtn) checkoutBtn.addEventListener('click',()=>{
    const items=readCart();
    if(items.length===0){ alert('Your cart is empty'); return; }
    window.location.href='checkout.html';
});

document.addEventListener('DOMContentLoaded',()=>{
    if(document.getElementById('itemsContainer')) renderCart();
    if(document.getElementById('detailsContainer')) loadProductDetails();
});



// js/product-details.js
const API_BASE = '/Made4U/api';

async function loadProductDetails() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if (!id) return document.querySelector('#product').innerText = 'Invalid product';

  const res = await fetch(`${API_BASE}/products/get.php?id=${id}`);
  if (!res.ok) return document.querySelector('#product').innerText = 'Error fetching';
  const data = await res.json();
  const p = data.product;
  if (!p) return document.querySelector('#product').innerText = 'Product not found';

  document.querySelector('#product-image').src = p.image ? ('/' + p.image) : '/Made4U/css/placeholder.png';
  document.querySelector('#product-title').innerText = p.title;
  document.querySelector('#product-price').innerText = 'EGP ' + p.price;
  document.querySelector('#product-size').innerText = 'Size: ' + p.size;
  document.querySelector('#product-gender').innerText = p.gender === 'men' ? 'Men' : 'Women';
  document.querySelector('#product-seller').href = p.seller_link || '#';
  document.querySelector('#product-description').innerText = p.description || '';
}

document.addEventListener('DOMContentLoaded', loadProductDetails);
