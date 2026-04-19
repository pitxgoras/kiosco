// Estado global
let cart = [];
let currentCategory = null;
let products = {};
let map = null;
let currentLocation = null;
let currentMarker = null;
let flyingProduct = null;

// Elementos DOM
const categoriesList = document.getElementById('categoriesList');
const productsGrid = document.getElementById('productsGrid');
const cartModal = document.getElementById('cartModal');
const cartFab = document.getElementById('cartFab');
const closeCart = document.querySelector('.close-cart');
const checkoutBtn = document.getElementById('checkoutBtn');
const themeToggle = document.getElementById('themeToggle');
const searchInput = document.getElementById('searchProducts');
const sortBy = document.getElementById('sortBy');
const minPriceInput = document.getElementById('minPrice');
const maxPriceInput = document.getElementById('maxPrice');
const adminAccessBtn = document.getElementById('adminAccessBtn');
const cartBadge = document.getElementById('cartBadge');
const cartItemsList = document.getElementById('cartItemsList');
const cartSubtotal = document.getElementById('cartSubtotal');
const cartTotal = document.getElementById('cartTotal');
const deliveryCostSpan = document.getElementById('deliveryCost');

// Modal elements
const deliveryModal = document.getElementById('deliveryModal');
const deliveryAddress = document.getElementById('deliveryAddress');
const paymentMethodSelect = document.getElementById('paymentMethodSelect');
const deliveryWindowSelect = document.getElementById('deliveryWindowSelect');
const deliveryDateInput = document.getElementById('deliveryDate');
const generateInvoiceCheckbox = document.getElementById('generateInvoice');
const customerRUCInput = document.getElementById('customerRUC');
const customerAddressInput = document.getElementById('customerAddress');

// ============ ANIMACIÓN DE PRODUCTO VOLADOR ============
function animateFlyingProduct(productElement, targetElement) {
    const productRect = productElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    
    const flyingDiv = document.createElement('div');
    flyingDiv.innerHTML = productElement.querySelector('h4')?.textContent || '🛒';
    flyingDiv.style.cssText = `
        position: fixed;
        left: ${productRect.left}px;
        top: ${productRect.top}px;
        width: ${productRect.width}px;
        height: ${productRect.height}px;
        background: var(--primary);
        color: white;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        z-index: 10000;
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(flyingDiv);
    
    setTimeout(() => {
        flyingDiv.style.left = `${targetRect.left + targetRect.width / 2 - productRect.width / 2}px`;
        flyingDiv.style.top = `${targetRect.top + targetRect.height / 2 - productRect.height / 2}px`;
        flyingDiv.style.transform = 'scale(0.3)';
        flyingDiv.style.opacity = '0';
        
        setTimeout(() => {
            flyingDiv.remove();
            // Efecto de rebote en el carrito
            if (cartFab) {
                cartFab.style.transform = 'scale(1.2)';
                setTimeout(() => { if(cartFab) cartFab.style.transform = ''; }, 300);
            }
        }, 500);
    }, 50);
}

// ============ RENDERIZADO CON ANIMACIONES ============
function renderProducts(category, searchTerm = '', minPrice = '', maxPrice = '', sortType = 'default') {
    if (!products[category]) return;
    let filtered = products[category];
    if (searchTerm) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (minPrice) filtered = filtered.filter(p => p.price >= parseFloat(minPrice));
    if (maxPrice) filtered = filtered.filter(p => p.price <= parseFloat(maxPrice));
    
    const sorted = [...filtered];
    switch(sortType) {
        case 'price_asc': sorted.sort((a, b) => a.price - b.price); break;
        case 'price_desc': sorted.sort((a, b) => b.price - a.price); break;
        case 'name_asc': sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
        case 'name_desc': sorted.sort((a, b) => b.name.localeCompare(a.name)); break;
    }
    
    const productImages = getProductImages();
    productsGrid.innerHTML = '';
    
    if (sorted.length === 0) {
        productsGrid.innerHTML = '<div class="no-results">😢 No se encontraron productos</div>';
        return;
    }
    
    sorted.forEach((product, index) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.animation = `fadeInUp 0.3s ease ${index * 0.05}s both`;
        const images = productImages[product.id] || [];
        const imageHtml = images[0] 
            ? `<img src="${images[0]}" class="product-img" style="width:100%; height:140px; object-fit:cover; border-radius:12px; margin-bottom:0.8rem;">` 
            : `<div class="product-img-placeholder" style="width:100%; height:140px; background:linear-gradient(135deg,#e2e8f0,#f1f5f9); border-radius:12px; margin-bottom:0.8rem; display:flex; align-items:center; justify-content:center;">📷</div>`;
        const stockHtml = product.stock !== undefined 
            ? `<div class="stock-badge" style="font-size:0.7rem; margin-bottom:0.5rem; color:${product.stock === 0 ? '#ef4444' : (product.stock < 10 ? '#f59e0b' : '#10b981')};">${product.stock === 0 ? '❌ Agotado' : `📦 Stock: ${product.stock}`}</div>`
            : '';
        const disabled = product.stock === 0 ? 'disabled' : '';
        
        card.innerHTML = `
            ${imageHtml}
            <h4>${product.name}</h4>
            <p class="product-price">S/ ${product.price.toFixed(2)}</p>
            ${stockHtml}
            <button class="add-to-cart-btn" ${disabled}>${product.stock > 0 ? '➕ Agregar' : '🚫 Sin stock'}</button>
        `;
        
        const addBtn = card.querySelector('.add-to-cart-btn');
        if (product.stock > 0) {
            addBtn.onclick = (e) => {
                e.stopPropagation();
                animateFlyingProduct(card, cartFab);
                addToCart(product);
            };
            card.onclick = () => {
                animateFlyingProduct(card, cartFab);
                addToCart(product);
            };
        }
        productsGrid.appendChild(card);
    });
}

// ============ AGREGAR AL CARRITO ============
function addToCart(product) {
    if (product.stock === 0) { showToast('❌ Producto agotado', 'error'); return; }
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
        if (existing.quantity >= product.stock) { showToast('⚠️ Stock insuficiente', 'error'); return; }
        existing.quantity++;
        showToast(`📦 +1 ${product.name}`, 'success');
    } else {
        cart.push({ ...product, quantity: 1 });
        showToast(`✨ ${product.name} agregado`, 'success');
    }
    updateCartUI();
}

// ============ ACTUALIZAR CARRITO ============
function updateCartUI() {
    const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
    if (cartBadge) cartBadge.textContent = totalItems;
    if (!cartItemsList) return;
    cartItemsList.innerHTML = '';
    
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const settings = getSettings();
    const deliveryCost = subtotal >= (settings.freeDeliveryMin || 20) ? 0 : (settings.deliveryCost || 3);
    if (cartSubtotal) cartSubtotal.textContent = subtotal.toFixed(2);
    if (deliveryCostSpan) deliveryCostSpan.textContent = deliveryCost.toFixed(2);
    if (cartTotal) cartTotal.textContent = (subtotal + deliveryCost).toFixed(2);
    
    if (cart.length === 0) {
        cartItemsList.innerHTML = '<div class="empty-cart">🛒 Tu carrito está vacío</div>';
        return;
    }
    
    cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div><strong>${item.name}</strong><br><small>S/ ${item.price.toFixed(2)}</small></div>
            <div class="cart-item-controls">
                <button class="qty-btn" data-id="${item.id}" data-d="-1">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" data-id="${item.id}" data-d="1">+</button>
                <button class="remove-item" data-id="${item.id}">🗑️</button>
            </div>
            <div><strong>S/ ${(item.price * item.quantity).toFixed(2)}</strong></div>
        `;
        cartItemsList.appendChild(div);
    });
    
    document.querySelectorAll('.qty-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            const change = parseInt(btn.dataset.d);
            const item = cart.find(i => i.id === id);
            if (item) {
                if (change === 1) {
                    const product = getProductById(id);
                    if (product && item.quantity >= product.stock) { showToast('⚠️ Stock insuficiente', 'error'); return; }
                }
                item.quantity += change;
                if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
                updateCartUI();
            }
        };
    });
    
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            cart = cart.filter(i => i.id !== parseInt(btn.dataset.id));
            updateCartUI();
            showToast('Producto eliminado', 'info');
        };
    });
}

// ============ MOSTRAR FORMULARIO DE PAGO ============
function showPaymentForm() {
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const settings = getSettings();
    const deliveryCost = subtotal >= (settings.freeDeliveryMin || 20) ? 0 : (settings.deliveryCost || 3);
    const total = subtotal + deliveryCost;
    const paymentMethods = getPaymentMethods();
    const deliveryWindows = getDeliveryWindows();
    
    const today = new Date();
    const minDate = today.toISOString().slice(0, 16);
    const maxDate = new Date(today.setDate(today.getDate() + 3)).toISOString().slice(0, 16);
    
    const modalHtml = `
        <div id="paymentFormModal" class="modal" style="display:flex;">
            <div class="modal-content" style="max-width:500px; max-height:80vh; overflow-y:auto;">
                <div class="cart-header">
                    <h3>💰 Datos de pago y entrega</h3>
                    <span class="close-payment">&times;</span>
                </div>
                <div style="padding:1rem;">
                    <h4>📋 Datos personales</h4>
                    <input type="text" id="customerName" placeholder="Tu nombre completo" style="width:100%; padding:0.8rem; margin-bottom:1rem; border-radius:12px; border:1px solid #ddd;">
                    <input type="tel" id="customerPhone" placeholder="Número de teléfono" style="width:100%; padding:0.8rem; margin-bottom:1rem; border-radius:12px; border:1px solid #ddd;">
                    
                    <h4>💳 Método de pago</h4>
                    <select id="paymentMethodSelect" style="width:100%; padding:0.8rem; margin-bottom:1rem; border-radius:12px; border:1px solid #ddd;">
                        ${paymentMethods.map(m => `<option value="${m}">${getPaymentMethodName(m)}</option>`).join('')}
                    </select>
                    <div id="paymentInstructions" style="background:#f1f5f9; padding:0.8rem; border-radius:12px; margin-bottom:1rem; font-size:0.9rem;"></div>
                    
                    <h4>📅 Ventana de entrega</h4>
                    <input type="date" id="deliveryDate" min="${minDate.split('T')[0]}" max="${maxDate.split('T')[0]}" style="width:100%; padding:0.8rem; margin-bottom:1rem; border-radius:12px; border:1px solid #ddd;">
                    <select id="deliveryWindowSelect" style="width:100%; padding:0.8rem; margin-bottom:1rem; border-radius:12px; border:1px solid #ddd;">
                        ${deliveryWindows.map(w => `<option value="${w}">${w}</option>`).join('')}
                    </select>
                    
                    <h4>📍 Dirección de entrega</h4>
                    <input type="text" id="deliveryAddress" placeholder="Tu dirección completa" style="width:100%; padding:0.8rem; margin-bottom:1rem; border-radius:12px; border:1px solid #ddd;">
                    <div id="map" style="height:200px; border-radius:12px; margin-bottom:1rem;"></div>
                    
                    <h4>🧾 Facturación</h4>
                    <label style="display:flex; align-items:center; gap:0.5rem; margin-bottom:1rem;">
                        <input type="checkbox" id="generateInvoice"> Generar factura electrónica
                    </label>
                    <div id="invoiceFields" style="display:none;">
                        <input type="text" id="customerRUC" placeholder="RUC" style="width:100%; padding:0.8rem; margin-bottom:1rem; border-radius:12px; border:1px solid #ddd;">
                        <input type="text" id="customerAddress" placeholder="Dirección fiscal" style="width:100%; padding:0.8rem; margin-bottom:1rem; border-radius:12px; border:1px solid #ddd;">
                    </div>
                    
                    <div class="cart-total" style="margin-bottom:1rem;">
                        <strong>Subtotal: S/ ${subtotal.toFixed(2)}</strong><br>
                        <small>Envío: S/ ${deliveryCost.toFixed(2)}</small><br>
                        <strong>Total: S/ ${total.toFixed(2)}</strong>
                    </div>
                    
                    <button id="confirmPaymentBtn" class="btn-primary">✅ Confirmar pedido</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const closeBtn = document.querySelector('.close-payment');
    closeBtn.onclick = () => document.getElementById('paymentFormModal').remove();
    
    const paymentSelect = document.getElementById('paymentMethodSelect');
    const instructionsDiv = document.getElementById('paymentInstructions');
    const invoiceCheckbox = document.getElementById('generateInvoice');
    const invoiceFields = document.getElementById('invoiceFields');
    
    function updatePaymentInstructions() {
        const method = paymentSelect.value;
        const details = getPaymentMethodDetails(method);
        instructionsDiv.innerHTML = `<strong>${details.icon} ${details.name}</strong><br>${details.instructions}`;
    }
    updatePaymentInstructions();
    paymentSelect.onchange = updatePaymentInstructions;
    
    invoiceCheckbox.onchange = () => {
        invoiceFields.style.display = invoiceCheckbox.checked ? 'block' : 'none';
    };
    
    document.getElementById('confirmPaymentBtn').onclick = () => {
        const name = document.getElementById('customerName').value.trim();
        const phone = document.getElementById('customerPhone').value.trim();
        const deliveryAddr = document.getElementById('deliveryAddress').value.trim();
        const paymentMethod = paymentSelect.value;
        const deliveryWindow = document.getElementById('deliveryWindowSelect').value;
        const deliveryDate = document.getElementById('deliveryDate').value;
        
        if (!name || !phone) {
            showToast('📱 Completa tus datos personales', 'error');
            return;
        }
        if (!deliveryAddr) {
            showToast('📍 Ingresa tu dirección de entrega', 'error');
            return;
        }
        if (!deliveryDate) {
            showToast('📅 Selecciona una fecha de entrega', 'error');
            return;
        }
        
        const order = {
            items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
            subtotal: subtotal,
            deliveryCost: deliveryCost,
            total: total,
            date: new Date().toISOString(),
            customerName: name,
            customerPhone: phone,
            deliveryAddress: deliveryAddr,
            deliveryCoordinates: currentLocation,
            paymentMethod: paymentMethod,
            deliveryWindow: deliveryWindow,
            deliveryDate: new Date(deliveryDate).toISOString(),
            generateInvoice: invoiceCheckbox.checked,
            customerRUC: invoiceCheckbox.checked ? document.getElementById('customerRUC').value : null,
            customerAddress: invoiceCheckbox.checked ? document.getElementById('customerAddress').value : null,
            status: paymentMethod === 'efectivo' ? 'pendiente' : 'confirmado'
        };
        
        const newOrder = addOrder(order);
        document.getElementById('paymentFormModal').remove();
        
        showToast(`✅ Pedido #${newOrder.orderNumber} confirmado!`, 'success');
        showConfetti();
        
        // Enviar WhatsApp con resumen
        const paymentNames = { 'yape':'Yape', 'plin':'Plin', 'transferencia':'Transferencia', 'efectivo':'Efectivo' };
        const message = `🛒 *NUEVO PEDIDO KIOSCO*\n👤 Cliente: ${name}\n📞 Teléfono: ${phone}\n📍 Dirección: ${deliveryAddr}\n💳 Pago: ${paymentNames[paymentMethod]}\n📅 Entrega: ${deliveryWindow} - ${new Date(deliveryDate).toLocaleDateString()}\n\n${cart.map(i => `• ${i.name} x${i.quantity} = S/ ${(i.price*i.quantity).toFixed(2)}`).join('\n')}\n\n💰 TOTAL: S/ ${total.toFixed(2)}`;
        window.open(`https://wa.me/51914491874?text=${encodeURIComponent(message)}`, '_blank');
        
        cart = [];
        updateCartUI();
    };
    
    setTimeout(() => initMap(), 100);
}

// ============ MAPA ============
function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer || typeof L === 'undefined') return;
    
    if (map) map.remove();
    map = L.map('map').setView([-12.0464, -77.0428], 13);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);
    
    let marker = null;
    
    map.on('click', async (e) => {
        if (marker) marker.remove();
        marker = L.marker(e.latlng).addTo(map);
        currentLocation = e.latlng;
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`);
        const data = await response.json();
        const addressInput = document.getElementById('deliveryAddress');
        if (addressInput && data.display_name) addressInput.value = data.display_name;
    });
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const userLoc = [pos.coords.latitude, pos.coords.longitude];
            map.setView(userLoc, 15);
            if (marker) marker.remove();
            marker = L.marker(userLoc).addTo(map);
            currentLocation = { lat: userLoc[0], lng: userLoc[1] };
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLoc[0]}&lon=${userLoc[1]}`);
            const data = await response.json();
            const addressInput = document.getElementById('deliveryAddress');
            if (addressInput && data.display_name) addressInput.value = data.display_name;
        }, () => {});
    }
}

// ============ UTILIDADES ============
function showToast(message, type = 'success') {
    const toast = document.getElementById('toastNotification');
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#ef4444' : '#10b981';
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
}

function showConfetti() {
    if (typeof canvasConfetti !== 'undefined') {
        canvasConfetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#6366f1', '#10b981', '#f59e0b'] });
        setTimeout(() => canvasConfetti({ particleCount: 100, spread: 100, origin: { y: 0.7 } }), 200);
    }
}

function getProductById(id) {
    for (const cat of Object.values(products)) {
        const product = cat.find(p => p.id === id);
        if (product) return product;
    }
    return null;
}

function renderCategories() {
    products = getProducts();
    categoriesList.innerHTML = '';
    const categories = Object.keys(products);
    if (categories.length === 0) {
        categoriesList.innerHTML = '<div class="empty-cart">No hay categorías</div>';
        return;
    }
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.textContent = cat;
        btn.className = 'category-btn';
        btn.onclick = () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = cat;
            renderProducts(cat);
            document.getElementById('currentCategoryTitle').textContent = cat;
        };
        categoriesList.appendChild(btn);
    });
    if (categories.length) {
        currentCategory = categories[0];
        const firstBtn = categoriesList.children[0];
        if (firstBtn) firstBtn.classList.add('active');
        if (currentCategory) renderProducts(currentCategory);
    }
}

// ============ EVENTOS ============
if (cartFab) cartFab.onclick = () => { if (cartModal) cartModal.style.display = 'flex'; };
if (closeCart) closeCart.onclick = () => { if (cartModal) cartModal.style.display = 'none'; };
if (checkoutBtn) checkoutBtn.onclick = () => {
    if (cart.length === 0) { showToast('🛒 Carrito vacío', 'error'); return; }
    showPaymentForm();
};
if (adminAccessBtn) adminAccessBtn.onclick = () => window.open('admin.html', '_blank');

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        if (currentCategory) renderProducts(currentCategory, e.target.value, minPriceInput?.value, maxPriceInput?.value, sortBy?.value);
    });
}
if (sortBy) {
    sortBy.addEventListener('change', () => {
        if (currentCategory) renderProducts(currentCategory, searchInput?.value, minPriceInput?.value, maxPriceInput?.value, sortBy.value);
    });
}
if (minPriceInput) {
    minPriceInput.addEventListener('input', () => {
        if (currentCategory) renderProducts(currentCategory, searchInput?.value, minPriceInput.value, maxPriceInput?.value, sortBy?.value);
    });
}
if (maxPriceInput) {
    maxPriceInput.addEventListener('input', () => {
        if (currentCategory) renderProducts(currentCategory, searchInput?.value, minPriceInput?.value, maxPriceInput.value, sortBy?.value);
    });
}

// Tema
if (themeToggle) {
    if (localStorage.getItem('kiosco_theme') === 'dark') document.body.classList.add('dark-mode');
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('kiosco_theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        showToast(document.body.classList.contains('dark-mode') ? '🌙 Modo oscuro' : '☀️ Modo claro', 'info');
    });
}

window.onclick = (e) => {
    if (e.target === cartModal && cartModal) cartModal.style.display = 'none';
};

window.addEventListener('productsUpdated', () => {
    products = getProducts();
    renderCategories();
});

window.addEventListener('themeUpdated', () => {
    const theme = getTheme();
    applyThemeToPage(theme);
});

// Aplicar tema guardado al cargar
const savedTheme = getTheme();
applyThemeToPage(savedTheme);

// Inicializar
renderCategories();
updateCartUI();
showToast('✨ ¡Bienvenido a Kiosco!', 'success');