const CART_KEY = 'made4u_cart';
const SHIPPING = 50;

function readCart(){
  try{ return JSON.parse(localStorage.getItem(CART_KEY)) || []; }catch(e){ return []; }
}
function writeCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

function formatEGP(n){ return n.toFixed(2) + ' EGP'; }

function renderCart(){
  const items = readCart();
  const container = document.getElementById('itemsContainer');
  container.innerHTML = '';
  if(items.length === 0){
    document.getElementById('emptyNotice').style.display = 'block';
    document.getElementById('subtotal').textContent = formatEGP(0);
    document.getElementById('total').textContent = formatEGP(0 + SHIPPING);
    return;
  }
  document.getElementById('emptyNotice').style.display = 'none';

  let subtotal = 0;
  items.forEach((it, idx) => {
    subtotal += it.qty * Number(it.price);

    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <div class="left">
        <img src="${it.image}" class="item-img" onerror="this.src='../media/default-product.jpg'"/>
        <div class="info">
          <h3 title="${escapeHtml(it.name)}">${escapeHtml(it.name)}</h3>
          <p class="meta"><span class="size">Size: ${escapeHtml(it.sizes || '—')}</span></p>
          <div class="meta">
            <div class="qty" data-idx="${idx}">
              <button class="dec">−</button>
              <span class="count">${it.qty}</span>
              <button class="inc">+</button>
            </div>
            <button class="remove" data-idx="${idx}">Remove</button>
          </div>
        </div>
      </div>
      <div class="price">${formatEGP(Number(it.price))}</div>
    `;

    container.appendChild(div);
  });

  document.getElementById('subtotal').textContent = formatEGP(subtotal);
  document.getElementById('total').textContent = formatEGP(subtotal + SHIPPING);

  // attach events
  container.querySelectorAll('.qty').forEach(el => {
    const idx = parseInt(el.dataset.idx,10);
    el.querySelector('.inc').addEventListener('click', ()=> changeQty(idx, 1));
    el.querySelector('.dec').addEventListener('click', ()=> changeQty(idx, -1));
  });
  container.querySelectorAll('.remove').forEach(btn => {
    btn.addEventListener('click', ()=> removeItem(parseInt(btn.dataset.idx,10)));
  });
}

function escapeHtml(s){ return String(s).replace(/[&<>"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c])); }

function changeQty(idx, delta){
  const cart = readCart();
  if(!cart[idx]) return;
  cart[idx].qty = Math.max(1, cart[idx].qty + delta);
  writeCart(cart);
  renderCart();
  animateFlash();
}

function removeItem(idx){
  const cart = readCart();
  if(!cart[idx]) return;
  cart.splice(idx,1);
  writeCart(cart);
  renderCart();
  animateFlash();
}

function animateFlash(){
  const el = document.querySelector('.summary');
  if(!el) return;
  el.animate([{transform:'scale(1.00)'},{transform:'scale(1.01)'},{transform:'scale(1.00)'}], {duration:240});
}

// Listen for clicks on product Add-to-cart buttons across pages
// Expected: elements with class 'add-to-cart' and data-* attrs
document.addEventListener('click', function(e){
  const btn = e.target.closest('.add-to-cart');
  if(!btn) return;
  e.preventDefault();
  const id = btn.dataset.id || Date.now().toString();
  const name = btn.dataset.name || btn.dataset.title || 'Product';
  const price = parseFloat(btn.dataset.price || '0') || 0;
  const image = btn.dataset.image || '../media/default-product.jpg';
  const sizes = btn.dataset.sizes || '';
  addToCart({id,name,price,image,sizes,qty:1});
  // redirect to cart page (assumes cart.html is in same folder as collections/details)
  window.location.href = 'cart.html';
});

function addToCart(item){
  const cart = readCart();
  // if same product (by id + sizes) exists increment qty
  const idx = cart.findIndex(it => it.id == item.id && it.sizes == item.sizes);
  if(idx !== -1){ cart[idx].qty += item.qty; }
  else cart.push(item);
  writeCart(cart);
}

// Checkout button demo action
document.getElementById('checkoutBtn').addEventListener('click', ()=>{
  const items = readCart();
  if(items.length === 0){ alert('Your cart is empty'); return; }
  // For demo: redirect to login or checkout page
  window.location.href = 'checkout.html';
});

// initial render
renderCart();