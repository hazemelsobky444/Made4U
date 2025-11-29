// ===============================================
// 1. كود الصفحة الرئيسية (collections) - ديناميكي بالكامل
// ===============================================

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
                <img class="a" src="${product.image || '../media/default-product.jpg'}" alt="${product.name}" class="product-img">
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

// دالة توليد Pagination Buttons
function renderPaginationButtons(totalPages) {
    if (!paginationContainer) return;
    paginationContainer.innerHTML = ''; 

    if (totalPages <= 1) return;

    const maxDisplayButtons = 7;
    const boundaryPages = 1;
    const neighborhoodPages = 2;

    const addButton = (page, text = page) => {
        const btn = document.createElement('button');
        btn.className = 'page-btn';
        btn.textContent = text;
        
        if (page === currentPage) btn.classList.add('active');
        if (text === '...') btn.setAttribute('disabled', 'disabled');
        else btn.addEventListener('click', () => { currentPage = page; renderProductCards(); });

        paginationContainer.appendChild(btn);
    };

    if (totalPages <= maxDisplayButtons) {
        for (let i = 1; i <= totalPages; i++) addButton(i);
    } else {
        addButton(1);
        let start = Math.max(boundaryPages + 1, currentPage - neighborhoodPages);
        let end = Math.min(totalPages - boundaryPages, currentPage + neighborhoodPages);

        if (currentPage <= neighborhoodPages + boundaryPages) {
            end = maxDisplayButtons - boundaryPages;
            start = boundaryPages + 1;
        } 
        
        if (currentPage > totalPages - (neighborhoodPages + boundaryPages)) {
            start = totalPages - (maxDisplayButtons - boundaryPages - 1);
            end = totalPages - boundaryPages;
        }

        if (start > boundaryPages + 1) addButton(start - 1, '...');
        for (let i = start; i <= end; i++) addButton(i);
        if (end < totalPages - boundaryPages) addButton(end + 1, '...');
        if (end < totalPages) addButton(totalPages);
    }
}

// الدالة الرئيسية لعرض البطاقات
async function renderProductCards() {
    const cardsFrame = document.querySelector('.cards-frame');
    if (!cardsFrame) return; 
    cardsFrame.innerHTML = '<p style="text-align:center;padding:20px;">جارٍ تحميل المنتجات...</p>';

    let allProducts = [];

    try {
        const response = await fetch('/api/products'); 
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allProducts = await response.json(); 
    } catch (error) {
        console.error('فشل جلب المنتجات:', error);
        cardsFrame.innerHTML = '<p style="text-align:center;color:red;padding:20px;">لا يمكن تحميل المنتجات حالياً.</p>';
        if(paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    const filteredProducts = allProducts.filter(p => currentFilter === 'all' || p.category === currentFilter);
    const totalPages = Math.ceil(filteredProducts.length / cardsPerPage);

    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
    else if (totalPages === 0) currentPage = 1;

    const start = (currentPage - 1) * cardsPerPage;
    const end = start + cardsPerPage;
    const productsToDisplay = filteredProducts.slice(start, end);

    cardsFrame.innerHTML = productsToDisplay.map(createCardHTML).join('') || 
        '<p style="text-align:center;padding:20px;">لا توجد منتجات مطابقة للفلتر.</p>';

    renderPaginationButtons(totalPages);
}

// فلترة المنتجات
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        currentPage = 1;
        renderProductCards();
    });
});

// تعديل عدد الكروت حسب الشاشة
if(document.querySelector('.second-section')) {
    window.addEventListener('resize', () => {
        cardsPerPage = calculateCardsPerPage();
        renderProductCards();
    });
    
    document.addEventListener('DOMContentLoaded', () => {
        cardsPerPage = calculateCardsPerPage();
        renderProductCards();
    }); 
}

// Sidebar
const menuToggle = document.querySelector('.menu-toggle');
const sidebar = document.querySelector('.sidebar');
const sidebarClose = document.querySelector('.sidebar-close');
const sidebarLinks = document.querySelectorAll('.sidebar a');

if (menuToggle && sidebar && sidebarClose) {
    function toggleSidebar(){ sidebar.classList.toggle('open'); }
    menuToggle.addEventListener('click', toggleSidebar);
    sidebarClose.addEventListener('click', toggleSidebar);
    sidebarLinks.forEach(link => link.addEventListener('click', ()=> sidebar.classList.remove('open')));
}




// ===============================================
// 3. سلة المشتريات (Cart)
// ===============================================
const CART_KEY = 'made4u_cart'; 
const SHIPPING = 50;

function readCart(){ try{return JSON.parse(localStorage.getItem(CART_KEY))||[];}catch(e){return [];} }
function writeCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

function addToCart(item){
    const cart = readCart();
    const idx = cart.findIndex(it=>it.id==item.id && it.sizes==item.sizes);
    const qtyToAdd = item.qty || 1;
    if(idx!==-1) cart[idx].qty+=qtyToAdd;
    else cart.push({...item, qty: qtyToAdd});
    writeCart(cart);
}

function escapeHtml(s){ return String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function formatEGP(n){ return n.toFixed(2)+' EGP'; }

function renderCart(){
    const items = readCart();
    const container = document.getElementById('itemsContainer');
    const summaryEl = document.querySelector('.summary');
    if(!container || !summaryEl) return;

    container.innerHTML='';
    if(items.length===0){
        const emptyNotice = document.getElementById('emptyNotice'); if(emptyNotice) emptyNotice.style.display='block';
        if(document.getElementById('subtotal')) document.getElementById('subtotal').textContent = formatEGP(0);
        if(document.getElementById('total')) document.getElementById('total').textContent = formatEGP(0+SHIPPING);
        return;
    }

    const emptyNotice = document.getElementById('emptyNotice'); if(emptyNotice) emptyNotice.style.display='none';
    let subtotal=0;
    items.forEach((it,idx)=>{
        subtotal+=it.qty*Number(it.price);
        const div=document.createElement('div');
        div.className='item';
        div.innerHTML=`
        <div class="left">
            <img src="${it.image}" class="item-img" onerror="this.src='../media/default-product.jpg'"/>
            <div class="info">
              <h3 title="${escapeHtml(it.name)}">${escapeHtml(it.name)}</h3>
              <p class="meta"><span class="size">Size: ${escapeHtml(it.sizes||'—')}</span></p>
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
        <div class="price">${formatEGP(Number(it.price)*it.qty)}</div>`;
        container.appendChild(div);
    });

    if(document.getElementById('subtotal')) document.getElementById('subtotal').textContent=formatEGP(subtotal);
    if(document.getElementById('total')) document.getElementById('total').textContent=formatEGP(subtotal+SHIPPING);

    container.querySelectorAll('.qty').forEach(el=>{
        const idx=parseInt(el.dataset.idx,10);
        el.querySelector('.inc').addEventListener('click',()=>changeQty(idx,1));
        el.querySelector('.dec').addEventListener('click',()=>changeQty(idx,-1));
    });
    container.querySelectorAll('.remove').forEach(btn=>{
        btn.addEventListener('click',()=>removeItem(parseInt(btn.dataset.idx,10)));
    });
}

function changeQty(idx, delta){
    const cart=readCart();
    if(!cart[idx]) return;
    cart[idx].qty=Math.max(1,cart[idx].qty+delta);
    writeCart(cart);
    renderCart();
    animateFlash();
}

function removeItem(idx){
    const cart=readCart();
    if(!cart[idx]) return;
    cart.splice(idx,1);
    writeCart(cart);
    renderCart();
    animateFlash();
}

function animateFlash(){
    const el=document.querySelector('.summary');
    if(!el) return;
    el.animate([{transform:'scale(1.00)'},{transform:'scale(1.01)'},{transform:'scale(1.00)'}],{duration:240});
}


// إضافة للـ Add-to-Cart Buttons
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








// يتم حذف الكود التالي فيما بعد


// =======================
// Mock products للتجربة
// =======================
const mockProducts = [
    {
        id: '1',
        name: 'T-Shirt Basic',
        price: 150,
        image: 'https://www.bagybagy.com/cdn/shop/files/T101001_BLACK_2.jpg?v=1749642991&width=2119',
        category: 'men',
        sizes: 'S,M,L,XL,XXL'
    },
    {
        id: '2',
        name: 'Dress Elegant',
        price: 300,
        image: 'https://www.bagybagy.com/cdn/shop/files/T101001_BLACK_2.jpg?v=1749642991&width=2119',
        category: 'women',
        sizes: 'S,M,L,XL,XXL'
    },
    {
        id: '3',
        name: 'Sneakers Classic',
        price: 500,
        image: 'https://www.bagybagy.com/cdn/shop/files/T101001_BLACK_2.jpg?v=1749642991&width=2119',
        category: 'men',
        sizes: 'S,M,L,XL'
    },
    {
        id: '4',
        name: 'Bag Leather',
        price: 250,
        image: 'https://www.bagybagy.com/cdn/shop/files/T101001_BLACK_2.jpg?v=1749642991&width=2119',
        category: 'women',
        sizes: 'M,L'
    }
];

// لو كان الـ Backend غير موجود، استخدم المنتجات الوهمية
async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Backend not ready');
        return await response.json();
    } catch (err) {
        console.warn('Backend not found, using mock products');
        return mockProducts; // منتجات وهمية للتجربة
    }
}

// تعديل الدالة renderProductCards
async function renderProductCards() {
    const cardsFrame = document.querySelector('.cards-frame');
    if (!cardsFrame) return; 
    cardsFrame.innerHTML = '<p style="text-align:center;padding:20px;">جارٍ تحميل المنتجات...</p>';

    let allProducts = await fetchProducts();

    const filteredProducts = allProducts.filter(p => currentFilter === 'all' || p.category === currentFilter);
    const totalPages = Math.ceil(filteredProducts.length / cardsPerPage);

    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
    else if (totalPages === 0) currentPage = 1;

    const start = (currentPage - 1) * cardsPerPage;
    const end = start + cardsPerPage;
    const productsToDisplay = filteredProducts.slice(start, end);

    cardsFrame.innerHTML = productsToDisplay.map(createCardHTML).join('') || 
        '<p style="text-align:center;padding:20px;">لا توجد منتجات مطابقة للفلتر.</p>';

    renderPaginationButtons(totalPages);
}






// صفحة FAQ
// ===============================================
// كود التوسع والطي لقسم الأسئلة الشائعة (FAQ)
// ===============================================
const readMoreBtn = document.querySelector('.read-more-btn');
const faqWrapper = document.querySelector('.faq-content-wrapper');

if (readMoreBtn && faqWrapper) {
    readMoreBtn.addEventListener('click', function() {
        // تبديل كلاس 'expanded' لتفعيل الارتفاع الكامل المعرف في CSS
        faqWrapper.classList.toggle('expanded');
        
        // تغيير نص الزر بناءً على الحالة الحالية
        if (faqWrapper.classList.contains('expanded')) {
            this.textContent = 'Read Less';
        } else {
            this.textContent = 'Read More';
            
            // التمرير إلى أعلى قسم FAQ عند التصغير (اختياري لتحسين تجربة المستخدم)
            const faqSection = document.querySelector('.faq-section');
            if (faqSection) {
                faqSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
}




// كود تحديث السنة في ال footer بشكل تلقائي
  document.getElementById("year").textContent = new Date().getFullYear();
  