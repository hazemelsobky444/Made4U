// 1. كود الصفحة الرئيسية (collections) - خاص بالفلترة والصفحات

const filterButtons = document.querySelectorAll('.filter-btn');
const paginationContainer = document.querySelector('.pagination-buttons');

let currentFilter = 'all';
let currentPage = 1;
let cardsPerPage = 10; 

// دالة لتوليد بطاقة منتج HTML بناءً على بيانات المنتج 
function createCardHTML(product) {
    return `
        <div class="card" data-category="${product.category}" data-product-id="${product.id}">
            <div class="card__content">
                <img class="a" src="${product.image}" alt="${product.name}" class="product-img">
                <div class="info">
                    <span class="price">${product.price} EGP</span>
                    <button class="add-to-cart"
                            data-id="${product.id}"
                            data-name="${product.name}"
                            data-price="${product.price}"
                            data-image="${product.image}"
                            data-sizes="${product.sizes ? product.sizes.split(',')[0] : ''}" 
                            title="Add to Cart">
                        <i class="fa-solid fa-cart-shopping cart-icon"></i>
                    </button>
                </div>
                <a href="details.html?id=${product.id}" class="btn-seller">Details</a>
            </div>
        </div>
    `;
}

// دالة لحساب عدد البطاقات في الصفحة بناءً على عرض الشاشة الحالي 
function calculateCardsPerPage() {
    const width = window.innerWidth;
    
    if (width >= 1200) {
        return 10; 
    } else if (width >= 992) {
        return 12; 
    } else if (width >= 768) {
        return 9; 
    } else if (width >= 480) {
        return 8; 
    } else {
        return 5; 
    }
}

// ** NEW: دالة لتوليد نطاق محدود من أزرار الصفحات مع إضافة علامة "..." **
function renderPaginationButtons(totalPages) {
    if (!paginationContainer) return;
    paginationContainer.innerHTML = ''; 

    if (totalPages <= 1) {
        return; 
    }

    const maxDisplayButtons = 7; // الحد الأقصى للأزرار التي نريد عرضها
    const boundaryPages = 1;     // عدد الأزرار التي تعرض في البداية والنهاية
    const neighborhoodPages = 2; // عدد الأزرار حول الصفحة الحالية

    // دالة مساعدة لإنشاء زر وإضافة مُستمع الحدث
    const addButton = (page, text = page) => {
        const btn = document.createElement('button');
        btn.className = 'page-btn';
        btn.textContent = text;
        
        if (page === currentPage) {
            btn.classList.add('active');
        }
        
        if (text === '...') {
             // تعطيل زر النقاط
            btn.setAttribute('disabled', 'disabled');
        } else {
            btn.addEventListener('click', () => {
                currentPage = page;
                renderProductCards(); 
            });
        }
        paginationContainer.appendChild(btn);
    };


    if (totalPages <= maxDisplayButtons) {
        // إذا كان العدد الإجمالي صغيرًا، نعرض جميع الأزرار
        for (let i = 1; i <= totalPages; i++) {
            addButton(i);
        }
    } else {
        // العدد كبير: عرض نطاق محدود
        
        // 1. عرض زر الصفحة الأولى
        addButton(1);

        // حساب بداية ونهاية النطاق الأوسط
        let start = Math.max(boundaryPages + 1, currentPage - neighborhoodPages);
        let end = Math.min(totalPages - boundaryPages, currentPage + neighborhoodPages);

        // إذا كانت الصفحة الحالية قريبة جداً من البداية، عدّل النطاق
        if (currentPage <= neighborhoodPages + boundaryPages) {
            end = maxDisplayButtons - boundaryPages;
            start = boundaryPages + 1;
        } 
        
        // إذا كانت الصفحة الحالية قريبة جداً من النهاية، عدّل النطاق
        if (currentPage > totalPages - (neighborhoodPages + boundaryPages)) {
            start = totalPages - (maxDisplayButtons - boundaryPages - 1);
            end = totalPages - boundaryPages;
        }

        // 2. عرض علامات النقاط (قبل النطاق الأوسط)
        if (start > boundaryPages + 1) {
            addButton(start - 1, '...');
        }

        // 3. عرض النطاق الأوسط
        for (let i = start; i <= end; i++) {
            addButton(i);
        }

        // 4. عرض علامات النقاط (بعد النطاق الأوسط)
        if (end < totalPages - boundaryPages) {
            addButton(end + 1, '...');
        }

        // 5. عرض زر الصفحة الأخيرة (إذا لم يتم تضمينه بالفعل)
        if (end < totalPages) {
            addButton(totalPages);
        }
    }
}


// الدالة الرئيسية: لفلترة المنتجات وتوليد وعرض البطاقات 
// 🚨 تم تحويلها إلى دالة غير متزامنة (async) لجلب البيانات ديناميكياً 🚨
async function renderProductCards() {
    const cardsFrame = document.querySelector('.cards-frame');
    const paginationButtonsContainer = document.querySelector('.pagination-buttons');
    if (!cardsFrame) return; 

    // 1. عرض رسالة تحميل بينما ننتظر استجابة الخادم
    cardsFrame.innerHTML = '<p style="text-align: center; font-size: 1.2rem; padding: 20px;">جارٍ تحميل المنتجات...</p>';
    
    let allProducts = []; // مصفوفة المنتجات التي سيتم جلبها

    try {
        // 🚀 جلب البيانات من الـ Backend
        const response = await fetch('/api/products'); 
        if (!response.ok) {
            // التعامل مع أخطاء الـ HTTP (مثل 404 أو 500)
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // قائمة المنتجات الحية من قاعدة البيانات
        allProducts = await response.json(); 
        
    } catch (error) {
        console.error('فشل جلب المنتجات من الخادم:', error);
        cardsFrame.innerHTML = '<p style="text-align: center; color: red; font-size: 1.2rem; padding: 20px;">عذراً، لم نتمكن من جلب المنتجات حالياً. يرجى التأكد من تشغيل الخادم والمسار الصحيح (<code>/api/products</code>).</p>';
        if(paginationButtonsContainer) paginationButtonsContainer.innerHTML = ''; // إخفاء أزرار الصفحات عند الفشل
        return; // توقف عن تنفيذ الدالة
    }

    // 2. الفلترة (تستخدم الآن مصفوفة allProducts المُجلبة حديثاً)
    const filteredProducts = allProducts.filter(product => {
        return currentFilter === 'all' || product.category === currentFilter;
    });

    const totalPages = Math.ceil(filteredProducts.length / cardsPerPage);

    // 3. تحديث رقم الصفحة الحالية
    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
    } else if (totalPages === 0) {
        currentPage = 1;
    }

    // 4. تحديد المنتجات المراد عرضها في الصفحة الحالية
    const start = (currentPage - 1) * cardsPerPage;
    const end = start + cardsPerPage;
    const productsToDisplay = filteredProducts.slice(start, end);
    
    // 5. توليد وتثبيت HTML البطاقات
    const newCardsHTML = productsToDisplay.map(product => createCardHTML(product)).join('');
    cardsFrame.innerHTML = newCardsHTML || '<p style="text-align: center; font-size: 1.2rem; padding: 20px;">لا توجد منتجات مطابقة لهذا الفلتر.</p>';

    // 6. توليد أزرار الصفحات ديناميكيًا 
    renderPaginationButtons(totalPages);
}

// معالج أحداث الفلتر
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        currentPage = 1; // إعادة التعيين للصفحة الأولى
        renderProductCards(); 
    });
});


// عند تحميل الصفحة ولتعديل عدد الكروت مع تغيير حجم الشاشة
if(document.querySelector('.second-section')) {
    window.addEventListener('resize', () => {
        cardsPerPage = calculateCardsPerPage(); // التحديث الديناميكي
        renderProductCards(); // إعادة العرض
    });
    
    document.addEventListener('DOMContentLoaded', () => {
        cardsPerPage = calculateCardsPerPage(); // التحديد الأولي
        renderProductCards(); // العرض الأولي (يبدأ عملية الـ Fetch)
    }); 
}

// ===============================================
// 5. كود القائمة الجانبية (Sidebar)
// ===============================================
const menuToggle = document.querySelector('.menu-toggle');
const sidebar = document.querySelector('.sidebar');
const sidebarClose = document.querySelector('.sidebar-close');
const sidebarLinks = document.querySelectorAll('.sidebar a');

if (menuToggle && sidebar && sidebarClose) {
    function toggleSidebar() {
        sidebar.classList.toggle('open');
    }

    menuToggle.addEventListener('click', toggleSidebar);
    sidebarClose.addEventListener('click', toggleSidebar);

    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        });
    });
}





// ======================================================================
// 2. كود صفحة التفاصيل (details.js) - تم تعديله ليصبح ديناميكياً
// ======================================================================

const decrementBtn = document.getElementById('decrement-btn');
const incrementBtn = document.getElementById('increment-btn');
const quantityDisplay = document.getElementById('quantity-display');
const addToCartDetailsBtn = document.getElementById('add-to-cart-details-btn');
const detailsContainer = document.getElementById('detailsContainer'); // تم تحديثه ليتناسب مع ID الجديد في HTML

// دالة لجلب وعرض بيانات المنتج وتفعيل الأحداث
async function loadProductDetails() {
    // 1. قراءة الـ ID من رابط الصفحة (Query Parameter)
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId || !detailsContainer) {
        if(detailsContainer) detailsContainer.innerHTML = '<p style="text-align: center; font-size: 1.5rem; padding: 50px;">لم يتم تحديد المنتج المراد عرضه.</p>';
        return;
    }
    
    // عرض رسالة تحميل مؤقتة
    detailsContainer.innerHTML = '<p style="text-align: center; font-size: 1.5rem; padding: 50px;">جارٍ تحميل تفاصيل المنتج...</p>';

    try {
        // 2. جلب تفاصيل المنتج المحدد من الـ Backend
        const response = await fetch(`/api/products/${productId}`); 
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const product = await response.json();

        // 3. إعادة بناء هيكل الصفحة بالبيانات المُجلبة
        // (إلغاء رسالة التحميل وإعادة بناء المحتوى الأصلي)
        detailsContainer.innerHTML = `
            <div class="content">
                <div class="product-img">
                    <img src="${product.image}" id="productImage" alt="${product.name}" onerror="this.src='../media/default-product.jpg'">
                </div>
                <div class="text">
                    <div class="details">
                        <h1 class="product-name" id="productTitle">${product.name}</h1>
                        <p class="price" id="productPrice">${product.price} EGP</p>
                        <p class="description-text" id="productDescription">${product.description || 'لا يوجد وصف متاح لهذا المنتج حالياً.'}</p>
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
                                data-id="${product.id}" 
                                data-name="${product.name}" 
                                data-price="${product.price}" 
                                data-image="${product.image}" 
                                data-sizes="" 
                                data-qty="1">
                            Add To Cart
                        </button>
                        <a href="" class="bey-button">Buy Now</a>
                    </div>
                </div>
            </div>
        `;
        
        // 4. تفعيل منطق العداد والعربة بعد تحميل البيانات وإعادة بناء الـ DOM
        // يجب إعادة الحصول على العناصر لأن الـ DOM تغير
        const newDecrementBtn = document.getElementById('decrement-btn');
        const newIncrementBtn = document.getElementById('increment-btn');
        const newQuantityDisplay = document.getElementById('quantity-display');
        const newAddToCartDetailsBtn = document.getElementById('add-to-cart-details-btn');
        
        initializeDetailsPageEvents(product, newDecrementBtn, newIncrementBtn, newQuantityDisplay, newAddToCartDetailsBtn);

    } catch (error) {
        console.error('فشل جلب تفاصيل المنتج:', error);
        detailsContainer.innerHTML = '<p style="text-align: center; color: red; font-size: 1.5rem; padding: 50px;">عذراً، تعذر تحميل بيانات هذا المنتج. يرجى التأكد من الـ ID ومسار الـ API.</p>';
    }
}

// دالة تقوم بتهيئة الأحداث (العداد واختيار الحجم) بعد تحميل البيانات
function initializeDetailsPageEvents(product, decBtn, incBtn, qtyDisplay, cartBtn) {
    if (!decBtn || !incBtn || !qtyDisplay || !cartBtn) return;
    
    let quantity = 1;
    const MIN_QUANTITY = 1;
    const sizeLinks = document.querySelectorAll('.sizes a');
    let selectedSize = sizeLinks[0] ? sizeLinks[0].dataset.size : (product.sizes.split(',')[0] || 'L'); 

    // تهيئة زر Add to Cart بالـ ID والبيانات المُجلبة
    cartBtn.dataset.sizes = selectedSize;

    // Set initial size and active class
    sizeLinks.forEach(link => {
        if (link.dataset.size === selectedSize) {
            link.classList.add('active-size');
        }
    });

    function updateDisplay() {
        qtyDisplay.textContent = quantity;
        cartBtn.dataset.qty = quantity;

        if (quantity === MIN_QUANTITY) {
            decBtn.setAttribute('disabled', 'disabled');
        } else {
            decBtn.removeAttribute('disabled');
        }
    }
    
    // Handle size selection
    sizeLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.sizes a').forEach(l => l.classList.remove('active-size'));
            link.classList.add('active-size');
            selectedSize = link.dataset.size;
            cartBtn.dataset.sizes = selectedSize; 
        });
    });


    incBtn.addEventListener('click', () => {
        quantity++;
        updateDisplay();
    });

    decBtn.addEventListener('click', () => {
        if (quantity > MIN_QUANTITY) {
            quantity--;
            updateDisplay();
        }
    });

    updateDisplay(); // Initial update
}

// ===============================================
// 3. كود سلة المشتريات (Cart)
// ===============================================

const CART_KEY = 'made4u_cart'; 
const SHIPPING = 50;

function readCart(){
    try{ return JSON.parse(localStorage.getItem(CART_KEY)) || []; }catch(e){ return []; }
}
function writeCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

function addToCart(item){
    const cart = readCart();
    // Check if item exists with same ID AND SIZE
    const idx = cart.findIndex(it => it.id == item.id && it.sizes == item.sizes);
    const qtyToAdd = item.qty || 1;
    
    if(idx !== -1){ 
        cart[idx].qty += qtyToAdd; 
    }
    else {
        // Ensure new item has all necessary properties
        cart.push({...item, qty: qtyToAdd});
    }
    writeCart(cart);
}

function escapeHtml(s){ return String(s).replace(/[&<>"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c])); }

// 4. كود صفحة الـ Cart (cart.js) - خاص بالعرض والحسابات

function formatEGP(n){ return n.toFixed(2) + ' EGP'; }

function renderCart(){
    const items = readCart();
    const container = document.getElementById('itemsContainer');
    const summaryEl = document.querySelector('.summary');

    if (!container || !summaryEl) return;

    container.innerHTML = '';
    
    if(items.length === 0){
        // Logic for empty cart... (assumes cart page handles this)
        const emptyNotice = document.getElementById('emptyNotice');
        if(emptyNotice) emptyNotice.style.display = 'block';
        const subtotal = document.getElementById('subtotal');
        const total = document.getElementById('total');
        if(subtotal) subtotal.textContent = formatEGP(0);
        if(total) total.textContent = formatEGP(0 + SHIPPING);
        return;
    }
    
    const emptyNotice = document.getElementById('emptyNotice');
    if(emptyNotice) emptyNotice.style.display = 'none';


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
          <div class="price">${formatEGP(Number(it.price) * it.qty)}</div> 
        `;

        container.appendChild(div);
    });

    // Update summary table in cart.html (assuming IDs exist)
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('total');
    if(subtotalEl) subtotalEl.textContent = formatEGP(subtotal);
    if(totalEl) totalEl.textContent = formatEGP(subtotal + SHIPPING);

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
document.addEventListener('click', function(e){
    // Target the button itself or any ancestor with the class 'add-to-cart'
    const btn = e.target.closest('.add-to-cart'); 
    if(!btn) return;
    e.preventDefault();
    
    // Read the quantity from the data-qty attribute (used on details page) or default to 1 (used on collections page)
    const qty = parseInt(btn.dataset.qty || 1, 10); 
    
    // Read product details from data attributes
    const id = btn.dataset.id || Date.now().toString();
    const name = btn.dataset.name || btn.dataset.title || 'Product';
    const price = parseFloat(btn.dataset.price || '0') || 0; 
    const image = btn.dataset.image || '../media/default-product.jpg';
    const sizes = btn.dataset.sizes || ''; 
    
    // Add item to cart (this function handles adding or incrementing quantity)
    addToCart({id,name,price,image,sizes,qty:qty});
    
    // ** REDIRECT TO CART PAGE AFTER ADDING **
    window.location.href = '../html/cart.html'; 
});

// Checkout button demo action
const checkoutBtn = document.getElementById('checkoutBtn');
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', ()=>{
        const items = readCart();
        if(items.length === 0){ alert('Your cart is empty'); return; }
        window.location.href = 'checkout.html';
    });
}

// Initial renders based on page context
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('itemsContainer')) {
        renderCart(); // Render cart items if on cart page
    }
    // هذا الجزء هو المسؤول عن تشغيل جلب بيانات المنتج في صفحة details.html
    if (document.getElementById('detailsContainer')) {
        loadProductDetails(); 
    }
});