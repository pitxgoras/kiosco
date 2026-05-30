// ========== DATOS LOCALES ==========
let db = {
    products: [
        { id: 1, name: "Coca Cola 500ml", price: 3.50, stock: 20, category: "Bebidas", image: "", sales: 45 },
        { id: 2, name: "Sprite 500ml", price: 3.00, stock: 10, category: "Bebidas", image: "", sales: 30 },
        { id: 3, name: "Fanta 500ml", price: 3.00, stock: 5, category: "Bebidas", image: "", sales: 25 },
        { id: 4, name: "Papas Lays", price: 4.50, stock: 15, category: "Snacks", image: "", sales: 12 },
        { id: 5, name: "Chocolate Triple", price: 2.50, stock: 30, category: "Dulces", image: "", sales: 8 }
    ],
    categories: ["Bebidas", "Snacks", "Dulces", "Postres"],
    orders: [],
    customers: [],
    settings: { storeName: "Kiosco", whatsappNumber: "51914491874", shippingCost: 3.50, freeShippingMin: 20 }
};

function loadData() {
    const saved = localStorage.getItem('kioscoDB');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            db.products = parsed.products || db.products;
            db.categories = parsed.categories || db.categories;
            db.orders = parsed.orders || [];
            db.customers = parsed.customers || [];
            db.settings = { ...db.settings, ...(parsed.settings || {}) };
        } catch (e) {
            console.error('Error cargando datos:', e);
        }
    }
    saveData();
}

function saveData() {
    localStorage.setItem('kioscoDB', JSON.stringify(db));
}

loadData();

// ========== VARIABLES GLOBALES ==========
let allProducts = [...db.products];
let categories = [...db.categories];
let currentCategory = 'all';
let currentView = 'grid';
let currentLimit = 8;
let cart = [];

const savedCart = localStorage.getItem('kiosco_cart');
if (savedCart) {
    try {
        cart = JSON.parse(savedCart);
    } catch (e) {
        console.error('Error cargando carrito:', e);
        cart = [];
    }
}

// ========== ELEMENTOS DOM (Cache) ==========
const DOM = {
    productsGrid: document.getElementById('productsGrid'),
    categoriesList: document.getElementById('categoriesList'),
    searchInput: document.getElementById('searchProducts'),
    sortSelect: document.getElementById('sortBy'),
    minPriceInput: document.getElementById('minPrice'),
    maxPriceInput: document.getElementById('maxPrice'),
    loadMoreBtn: document.getElementById('loadMoreBtn'),
    currentCategoryTitle: document.getElementById('currentCategoryTitle'),
    cartFab: document.getElementById('cartFab'),
    cartBadge: document.getElementById('cartBadge'),
    cartModal: document.getElementById('cartModal'),
    paymentModal: document.getElementById('paymentModal'),
    toast: document.getElementById('toastNotification'),
    heroProducts: document.getElementById('heroProducts'),
    storeName: document.getElementById('storeName'),
    clearPriceBtn: document.getElementById('clearPriceBtn'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    resetCategoryBtn: document.getElementById('resetCategoryBtn'),
    activeFilters: document.getElementById('activeFilters'),
    productsCount: document.getElementById('productsCount')
};

// ========== FUNCIONES UTILITARIAS ==========
function showToast(message, isError = false) {
    if (!DOM.toast) return;
    DOM.toast.textContent = message;
    DOM.toast.style.background = isError ? '#e74c3c' : '#27ae60';
    DOM.toast.classList.add('show');
    setTimeout(() => DOM.toast.classList.remove('show'), 3000);
}

function updateHeroCount() {
    if (DOM.heroProducts) DOM.heroProducts.textContent = allProducts.length;
    if (DOM.storeName) DOM.storeName.textContent = db.settings.storeName || 'Kiosco';
}

// ========== FILTROS ACTIVOS ==========
function updateActiveFilters() {
    if (!DOM.activeFilters) return;
    
    const filters = [];
    if (currentCategory !== 'all') {
        filters.push(`📂 Categoría: ${currentCategory}`);
    }
    if (DOM.searchInput && DOM.searchInput.value.trim()) {
        filters.push(`🔍 Búsqueda: "${DOM.searchInput.value.trim()}"`);
    }
    const minPrice = DOM.minPriceInput ? parseFloat(DOM.minPriceInput.value) : null;
    const maxPrice = DOM.maxPriceInput ? parseFloat(DOM.maxPriceInput.value) : null;
    if (minPrice !== null && !isNaN(minPrice)) {
        filters.push(`💰 Mínimo: S/ ${minPrice}`);
    }
    if (maxPrice !== null && !isNaN(maxPrice)) {
        filters.push(`💰 Máximo: S/ ${maxPrice}`);
    }
    
    if (filters.length === 0) {
        DOM.activeFilters.innerHTML = '';
        return;
    }
    
    DOM.activeFilters.innerHTML = `
        <span class="filters-label">Filtros activos:</span>
        ${filters.map(f => `<span class="filter-tag">${f}</span>`).join('')}
        <button class="clear-all-filters" id="clearAllFiltersBtn">Limpiar todos</button>
    `;
    
    const clearAllBtn = document.getElementById('clearAllFiltersBtn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (DOM.searchInput) DOM.searchInput.value = '';
            if (DOM.minPriceInput) DOM.minPriceInput.value = '';
            if (DOM.maxPriceInput) DOM.maxPriceInput.value = '';
            if (DOM.sortSelect) DOM.sortSelect.value = 'default';
            currentCategory = 'all';
            currentLimit = 8;
            renderCategories();
            renderProducts();
            showToast('Filtros limpiados');
        });
    }
}

// ========== LIMPIAR FILTROS ==========
function clearFilters() {
    if (DOM.searchInput) DOM.searchInput.value = '';
    if (DOM.minPriceInput) DOM.minPriceInput.value = '';
    if (DOM.maxPriceInput) DOM.maxPriceInput.value = '';
    if (DOM.sortSelect) DOM.sortSelect.value = 'default';
    currentCategory = 'all';
    currentLimit = 8;
    renderCategories();
    renderProducts();
    updateActiveFilters();
    showToast('Filtros limpiados');
}

// ========== CARRITO ==========
function saveCart() {
    localStorage.setItem('kiosco_cart', JSON.stringify(cart));
}

function updateCartBadge() {
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (DOM.cartBadge) {
        DOM.cartBadge.textContent = total;
        DOM.cartBadge.style.display = total > 0 ? 'flex' : 'none';
    }
}

function renderCart() {
    const cartItemsList = document.getElementById('cartItemsList');
    const cartSubtotal = document.getElementById('cartSubtotal');
    const cartDelivery = document.getElementById('cartDelivery');
    const cartTotal = document.getElementById('cartTotal');
    const cartItemCount = document.getElementById('cartItemCount');
    
    if (!cartItemsList) return;
    
    if (cart.length === 0) {
        cartItemsList.innerHTML = '<div class="empty-cart">🛒 Tu carrito está vacío</div>';
        if (cartSubtotal) cartSubtotal.textContent = 'S/ 0.00';
        if (cartDelivery) cartDelivery.textContent = 'S/ 0.00';
        if (cartTotal) cartTotal.textContent = 'S/ 0.00';
        if (cartItemCount) cartItemCount.textContent = '0';
        return;
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const delivery = subtotal >= db.settings.freeShippingMin ? 0 : db.settings.shippingCost;
    const total = subtotal + delivery;
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (cartItemCount) cartItemCount.textContent = totalItems;
    
    cartItemsList.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <div class="cart-item-info">
                <strong>${item.name}</strong>
                <small>S/ ${item.price.toFixed(2)} c/u</small>
            </div>
            <div class="cart-item-controls">
                <button class="cart-qty-btn minus" data-id="${item.id}">-</button>
                <span class="cart-qty">${item.quantity}</span>
                <button class="cart-qty-btn plus" data-id="${item.id}">+</button>
                <button class="remove-item-btn" data-id="${item.id}">🗑️</button>
            </div>
            <div class="cart-item-total">
                <strong>S/ ${(item.price * item.quantity).toFixed(2)}</strong>
            </div>
        </div>
    `).join('');
    
    // Event listeners para controles del carrito
    document.querySelectorAll('.cart-qty-btn.minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            updateCartQuantity(id, -1);
        });
    });
    
    document.querySelectorAll('.cart-qty-btn.plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            updateCartQuantity(id, 1);
        });
    });
    
    document.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            removeFromCart(id);
        });
    });
    
    if (cartSubtotal) cartSubtotal.textContent = `S/ ${subtotal.toFixed(2)}`;
    if (cartDelivery) cartDelivery.textContent = delivery === 0 ? 'S/ 0.00 (Gratis)' : `S/ ${delivery.toFixed(2)}`;
    if (cartTotal) cartTotal.textContent = `S/ ${total.toFixed(2)}`;
}

function updateCartQuantity(id, delta) {
    const itemIndex = cart.findIndex(item => item.id === id);
    if (itemIndex === -1) return;
    
    const product = allProducts.find(p => p.id === id);
    const newQuantity = cart[itemIndex].quantity + delta;
    
    if (newQuantity <= 0) {
        cart.splice(itemIndex, 1);
        showToast('Producto eliminado del carrito');
    } else if (product && newQuantity <= product.stock) {
        cart[itemIndex].quantity = newQuantity;
        showToast(`${cart[itemIndex].name} x${newQuantity}`);
    } else if (product && newQuantity > product.stock) {
        showToast(`⚠️ Stock insuficiente. Solo quedan ${product.stock} unidades`, true);
        return;
    }
    
    renderCart();
    updateCartBadge();
    saveCart();
}

function removeFromCart(id) {
    const index = cart.findIndex(item => item.id === id);
    if (index !== -1) {
        cart.splice(index, 1);
        renderCart();
        updateCartBadge();
        saveCart();
        showToast('Producto eliminado del carrito');
    }
}

function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    const currentProduct = allProducts.find(p => p.id === product.id);
    
    if (!currentProduct || currentProduct.stock <= 0) {
        showToast('⚠️ Producto sin stock', true);
        return;
    }
    
    if (existing) {
        if (existing.quantity < currentProduct.stock) {
            existing.quantity++;
            showToast(`📦 ${product.name} x${existing.quantity}`);
        } else {
            showToast(`⚠️ Stock insuficiente. Solo quedan ${currentProduct.stock} unidades`, true);
            return;
        }
    } else {
        cart.push({ ...product, quantity: 1 });
        showToast(`✅ ${product.name} agregado al carrito`);
    }
    renderCart();
    updateCartBadge();
    saveCart();
}

// ========== MODALES ==========
function closeModals() {
    if (DOM.cartModal) {
        DOM.cartModal.style.display = 'none';
        DOM.cartModal.classList.remove('active');
    }
    if (DOM.paymentModal) {
        DOM.paymentModal.style.display = 'none';
        DOM.paymentModal.classList.remove('active');
    }
}

if (DOM.cartFab) {
    DOM.cartFab.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        renderCart();
        if (DOM.cartModal) {
            DOM.cartModal.style.display = 'flex';
            DOM.cartModal.classList.add('active');
        }
    });
}

document.querySelectorAll('.close-modal, .close-cart, .close-payment').forEach(btn => {
    btn.addEventListener('click', closeModals);
});

window.addEventListener('click', (e) => {
    if (e.target === DOM.cartModal) closeModals();
    if (e.target === DOM.paymentModal) closeModals();
});

// ========== FILTRAR PRODUCTOS ==========
function getFilteredProducts() {
    let products = [...allProducts];
    const searchTerm = DOM.searchInput ? DOM.searchInput.value.toLowerCase() : '';
    const minPrice = DOM.minPriceInput ? (parseFloat(DOM.minPriceInput.value) || 0) : 0;
    const maxPrice = DOM.maxPriceInput ? (parseFloat(DOM.maxPriceInput.value) || Infinity) : Infinity;
    
    if (currentCategory !== 'all') {
        products = products.filter(p => p.category === currentCategory);
    }
    if (searchTerm) {
        products = products.filter(p => p.name.toLowerCase().includes(searchTerm));
    }
    products = products.filter(p => p.price >= minPrice && p.price <= maxPrice);
    
    const sortValue = DOM.sortSelect ? DOM.sortSelect.value : 'default';
    if (sortValue === 'price_asc') products.sort((a, b) => a.price - b.price);
    if (sortValue === 'price_desc') products.sort((a, b) => b.price - a.price);
    if (sortValue === 'name_asc') products.sort((a, b) => a.name.localeCompare(b.name));
    if (sortValue === 'name_desc') products.sort((a, b) => b.name.localeCompare(a.name));
    
    return products;
}

function renderProducts() {
    if (!DOM.productsGrid) return;
    const filtered = getFilteredProducts();
    const displayProducts = filtered.slice(0, currentLimit);
    
    // Actualizar contador de productos
    if (DOM.productsCount) {
        DOM.productsCount.textContent = `${filtered.length} producto${filtered.length !== 1 ? 's' : ''}`;
    }
    
    if (displayProducts.length === 0) {
        DOM.productsGrid.innerHTML = '<div class="no-results">🔍 No se encontraron productos</div>';
        if (DOM.loadMoreBtn) DOM.loadMoreBtn.style.display = 'none';
        return;
    }
    
    DOM.productsGrid.innerHTML = displayProducts.map(p => `
        <div class="product-card" data-id="${p.id}">
            <div class="product-image">
                ${p.image ? `<img src="${p.image}" alt="${p.name}" loading="lazy">` : '<div class="product-placeholder">📦</div>'}
                ${p.stock < 5 && p.stock > 0 ? '<div class="product-badge">🔥 Últimos</div>' : ''}
                ${p.stock === 0 ? '<div class="product-badge out-of-stock">❌ Sin stock</div>' : ''}
            </div>
            <div class="product-info">
                <h3>${escapeHtml(p.name)}</h3>
                <div class="product-price">S/ ${p.price.toFixed(2)}</div>
                <div class="product-stock ${p.stock < 5 ? 'low-stock' : ''}">Stock: ${p.stock}</div>
                <button class="add-to-cart-btn" ${p.stock === 0 ? 'disabled' : ''} data-id="${p.id}" data-name="${escapeHtml(p.name)}" data-price="${p.price}" data-stock="${p.stock}">
                    ${p.stock === 0 ? 'Sin stock' : '🛒 Agregar al carrito'}
                </button>
            </div>
        </div>
    `).join('');
    
    // Delegación de eventos para botones de agregar al carrito
    DOM.productsGrid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        if (btn.disabled) return;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            const name = btn.dataset.name;
            const price = parseFloat(btn.dataset.price);
            const stock = parseInt(btn.dataset.stock);
            addToCart({ id, name, price, stock });
        });
    });
    
    DOM.productsGrid.className = `products-grid ${currentView === 'list' ? 'list-view' : ''}`;
    if (DOM.loadMoreBtn) DOM.loadMoreBtn.style.display = filtered.length > currentLimit ? 'flex' : 'none';
    updateActiveFilters();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function loadMore() {
    currentLimit += 8;
    renderProducts();
}

if (DOM.loadMoreBtn) {
    const loadMoreButton = DOM.loadMoreBtn.querySelector('button');
    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', loadMore);
    }
}

// ========== CATEGORÍAS ==========
function renderCategories() {
    if (!DOM.categoriesList) return;
    DOM.categoriesList.innerHTML = `
        <div class="category-item ${currentCategory === 'all' ? 'active' : ''}" data-cat="all">📦 Todos</div>
        ${categories.map(cat => `<div class="category-item ${currentCategory === cat ? 'active' : ''}" data-cat="${cat}">📂 ${escapeHtml(cat)}</div>`).join('')}
    `;
    
    DOM.categoriesList.querySelectorAll('.category-item').forEach(el => {
        el.addEventListener('click', () => {
            currentCategory = el.dataset.cat;
            currentLimit = 8;
            renderCategories();
            renderProducts();
            if (DOM.currentCategoryTitle) {
                DOM.currentCategoryTitle.textContent = currentCategory === 'all' ? 'Todos los productos' : currentCategory;
            }
        });
    });
}

// Resetear categorías
if (DOM.resetCategoryBtn) {
    DOM.resetCategoryBtn.addEventListener('click', () => {
        currentCategory = 'all';
        currentLimit = 8;
        renderCategories();
        renderProducts();
        if (DOM.currentCategoryTitle) {
            DOM.currentCategoryTitle.textContent = 'Todos los productos';
        }
        showToast('Mostrando todas las categorías');
    });
}

// ========== VISTA (GRID/LIST) ==========
document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        currentView = btn.dataset.view;
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderProducts();
    });
});

// ========== EVENTOS DE FILTROS ==========
if (DOM.searchInput) {
    DOM.searchInput.addEventListener('input', () => { currentLimit = 8; renderProducts(); });
}
if (DOM.sortSelect) {
    DOM.sortSelect.addEventListener('change', () => { currentLimit = 8; renderProducts(); });
}
if (DOM.minPriceInput) {
    DOM.minPriceInput.addEventListener('input', () => { currentLimit = 8; renderProducts(); });
}
if (DOM.maxPriceInput) {
    DOM.maxPriceInput.addEventListener('input', () => { currentLimit = 8; renderProducts(); });
}
if (DOM.clearPriceBtn) {
    DOM.clearPriceBtn.addEventListener('click', () => {
        if (DOM.minPriceInput) DOM.minPriceInput.value = '';
        if (DOM.maxPriceInput) DOM.maxPriceInput.value = '';
        currentLimit = 8;
        renderProducts();
        showToast('Filtros de precio limpiados');
    });
}
if (DOM.clearSearchBtn) {
    DOM.clearSearchBtn.addEventListener('click', () => {
        if (DOM.searchInput) {
            DOM.searchInput.value = '';
            currentLimit = 8;
            renderProducts();
            showToast('Búsqueda limpiada');
        }
    });
}

// ========== ADMIN ACCESS ==========
const adminBtn = document.getElementById('adminAccessBtn');
if (adminBtn) {
    adminBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'login-admin.html';
    });
}

// ========== CHECKOUT ==========
const checkoutBtn = document.getElementById('checkoutBtn');
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            showToast('🛒 Agrega productos primero', true);
            return;
        }
        closeModals();
        if (DOM.paymentModal) {
            DOM.paymentModal.style.display = 'flex';
            DOM.paymentModal.classList.add('active');
        }
    });
}

const paymentMethod = document.getElementById('paymentMethod');
if (paymentMethod) {
    paymentMethod.addEventListener('change', (e) => {
        const info = document.getElementById('paymentInfo');
        if (!info) return;
        const methods = {
            yape: '📱 Yape al número <strong>+51 914 491 874</strong>',
            plin: '📱 Plin al número <strong>+51 914 491 874</strong>',
            transferencia: '🏦 Cuenta BCP: 123-456-789',
            efectivo: '💵 Paga al recibir tu pedido'
        };
        info.innerHTML = methods[e.target.value] || methods.yape;
    });
}

const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
if (confirmPaymentBtn) {
    confirmPaymentBtn.addEventListener('click', () => {
        const nameInput = document.getElementById('customerName');
        const phoneInput = document.getElementById('customerPhone');
        const addressInput = document.getElementById('deliveryAddress');
        
        const name = nameInput ? nameInput.value.trim() : '';
        const phone = phoneInput ? phoneInput.value.trim() : '';
        const address = addressInput ? addressInput.value.trim() : '';
        const paymentMethodValue = paymentMethod ? paymentMethod.value : 'yape';
        
        if (!name || !phone || !address) {
            showToast('⚠️ Completa todos los campos', true);
            return;
        }
        
        if (!/^\d{9,}$/.test(phone)) {
            showToast('⚠️ Teléfono inválido (9 dígitos mínimo)', true);
            return;
        }
        
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const delivery = subtotal >= db.settings.freeShippingMin ? 0 : db.settings.shippingCost;
        const total = subtotal + delivery;
        
        const newOrder = {
            id: Date.now(),
            phone, name, address,
            items: cart.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, price: item.price })),
            total, paymentMethod: paymentMethodValue, type: 'now', status: 'pending', date: new Date().toISOString()
        };
        
        db.orders.push(newOrder);
        
        // Actualizar stock en productos
        cart.forEach(cartItem => {
            const productInAll = allProducts.find(p => p.id === cartItem.id);
            if (productInAll) {
                productInAll.stock -= cartItem.quantity;
            }
            const productInDb = db.products.find(p => p.id === cartItem.id);
            if (productInDb) {
                productInDb.stock -= cartItem.quantity;
            }
        });
        
        saveData();
        
        // Limpiar carrito
        cart = [];
        saveCart();
        updateCartBadge();
        renderProducts();
        
        showToast('✅ Pedido realizado con éxito');
        closeModals();
        
        // Limpiar formulario
        if (nameInput) nameInput.value = '';
        if (phoneInput) phoneInput.value = '';
        if (addressInput) addressInput.value = '';
        
        if (typeof canvasConfetti === 'function') {
            canvasConfetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
    });
}

// ========== MODO OSCURO/CLARO ==========
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

function setTheme(theme) {
    if (theme === 'dark') {
        body.classList.add('dark-mode');
        if (themeToggle) themeToggle.classList.add('dark');
        localStorage.setItem('kiosco_theme', 'dark');
    } else {
        body.classList.remove('dark-mode');
        if (themeToggle) themeToggle.classList.remove('dark');
        localStorage.setItem('kiosco_theme', 'light');
    }
}

if (themeToggle) {
    const newToggle = themeToggle.cloneNode(true);
    if (themeToggle.parentNode) {
        themeToggle.parentNode.replaceChild(newToggle, themeToggle);
    }
    
    newToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const isDark = body.classList.contains('dark-mode');
        setTheme(isDark ? 'light' : 'dark');
    });
    
    const savedTheme = localStorage.getItem('kiosco_theme');
    if (savedTheme === 'dark') {
        setTheme('dark');
    } else if (savedTheme === 'light') {
        setTheme('light');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
    }
}

// ========== EXPLORAR PRODUCTOS (SCROLL) ==========
const exploreBtn = document.getElementById('exploreBtn');
if (exploreBtn) {
    exploreBtn.addEventListener('click', () => {
        const productsSection = document.querySelector('.products-section');
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}

// ========== INICIALIZACIÓN ==========
function init() {
    allProducts = [...db.products];
    categories = [...db.categories];
    updateHeroCount();
    updateCartBadge();
    renderCategories();
    renderProducts();
}

init();
