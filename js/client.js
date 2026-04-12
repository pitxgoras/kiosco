// Estado global
let cart = [];
let currentCategory = null;
let products = {};
let map = null;
let currentLocation = null;
let currentMarker = null;

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

// Delivery modal elements
const deliveryModal = document.getElementById('deliveryModal');
const deliveryAddress = document.getElementById('deliveryAddress');
const deliverNowBtn = document.getElementById('deliverNowBtn');
const scheduleLaterBtn = document.getElementById('scheduleLaterBtn');
const schedulePicker = document.getElementById('schedulePicker');
const scheduleDate = document.getElementById('scheduleDate');
const confirmScheduleBtn = document.getElementById('confirmScheduleBtn');

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

// ============ MAPA CON BÚSQUEDA DE DIRECCIONES ============
function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;
    
    if (map) map.remove();
    
    // Centro de Lima por defecto
    map = L.map('map').setView([-12.0464, -77.0428], 13);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);
    
    // Control de búsqueda personalizado
    const SearchControl = L.Control.extend({
        options: { position: 'topright' },
        onAdd: function() {
            const container = L.DomUtil.create('div', 'search-control');
            container.innerHTML = `
                <div style="background:white; border-radius:8px; padding:4px; box-shadow:0 2px 6px rgba(0,0,0,0.3);">
                    <input type="text" id="addressSearchInput" placeholder="Buscar dirección, avenida, distrito..." style="width:250px; padding:8px; border:none; border-radius:8px; outline:none; font-size:14px;">
                </div>
            `;
            const input = container.querySelector('#addressSearchInput');
            input.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') await searchAddress(input.value);
            });
            return container;
        }
    });
    map.addControl(new SearchControl());
    
    let marker = null;
    
    // Click en el mapa para seleccionar ubicación
    map.on('click', async (e) => {
        if (marker) marker.remove();
        marker = L.marker(e.latlng).addTo(map);
        currentLocation = e.latlng;
        await reverseGeocode(e.latlng.lat, e.latlng.lng);
    });
    
    // Geocodificación inversa (coordenadas -> dirección)
    async function reverseGeocode(lat, lng) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=es`);
            const data = await response.json();
            if (data.display_name && deliveryAddress) {
                deliveryAddress.value = data.display_name;
            }
        } catch(e) {
            console.error('Error en geocodificación:', e);
        }
    }
    
    // Búsqueda de dirección
    window.searchAddress = async (query) => {
        if (!query) return;
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}, Lima, Peru&limit=5&addressdetails=1&accept-language=es`);
            const data = await response.json();
            if (data.length > 0) {
                const bounds = L.latLngBounds(data.map(p => [parseFloat(p.lat), parseFloat(p.lon)]));
                map.fitBounds(bounds);
                if (marker) marker.remove();
                marker = L.marker([data[0].lat, data[0].lon]).addTo(map);
                currentLocation = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
                if (deliveryAddress) deliveryAddress.value = data[0].display_name;
                showToast('Dirección encontrada', 'success');
            } else {
                showToast('No se encontró la dirección, intenta con otro nombre', 'error');
            }
        } catch(e) {
            console.error('Error en búsqueda:', e);
            showToast('Error al buscar la dirección', 'error');
        }
    };
    
    // Obtener ubicación actual del usuario
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const userLoc = [position.coords.latitude, position.coords.longitude];
            map.setView(userLoc, 15);
            if (marker) marker.remove();
            marker = L.marker(userLoc).addTo(map);
            currentLocation = { lat: userLoc[0], lng: userLoc[1] };
            await reverseGeocode(userLoc[0], userLoc[1]);
        }, () => {
            showToast('📍 Activa tu ubicación para una mejor experiencia', 'info');
        });
    }
}

// ============ RENDERIZADO ============
function getProductImages() {
    return JSON.parse(localStorage.getItem('kiosco_product_images')) || {};
}

function sortProducts(items, sortType) {
    const sorted = [...items];
    switch(sortType) {
        case 'price_asc': return sorted.sort((a, b) => a.price - b.price);
        case 'price_desc': return sorted.sort((a, b) => b.price - a.price);
        case 'name_asc': return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'name_desc': return sorted.sort((a, b) => b.name.localeCompare(a.name));
        default: return sorted;
    }
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

function renderProducts(category, searchTerm = '', minPrice = '', maxPrice = '', sortType = 'default') {
    if (!products[category]) return;
    let filtered = products[category];
    if (searchTerm) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (minPrice) filtered = filtered.filter(p => p.price >= parseFloat(minPrice));
    if (maxPrice) filtered = filtered.filter(p => p.price <= parseFloat(maxPrice));
    filtered = sortProducts(filtered, sortType);
    
    const productImages = getProductImages();
    productsGrid.innerHTML = '';
    if (filtered.length === 0) {
        productsGrid.innerHTML = '<div class="no-results">No se encontraron productos</div>';
        return;
    }
    filtered.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        const images = productImages[product.id] || [];
        const imageHtml = images[0] 
            ? `<img src="${images[0]}" style="width:100%; height:140px; object-fit:cover; border-radius:12px; margin-bottom:0.8rem;">` 
            : `<div style="width:100%; height:140px; background:linear-gradient(135deg,#e2e8f0,#f1f5f9); border-radius:12px; margin-bottom:0.8rem; display:flex; align-items:center; justify-content:center; color:#94a3b8;">📷 Sin imagen</div>`;
        const stockHtml = product.stock !== undefined 
            ? `<div style="font-size:0.7rem; margin-bottom:0.5rem; color:${product.stock === 0 ? '#ef4444' : (product.stock < 10 ? '#f59e0b' : '#10b981')};">${product.stock === 0 ? '❌ Agotado' : `📦 Stock: ${product.stock}`}</div>`
            : '';
        const disabled = product.stock === 0 ? 'disabled' : '';
        card.innerHTML = `
            ${imageHtml}
            <h4>${product.name}</h4>
            <p>S/ ${product.price.toFixed(2)}</p>
            ${stockHtml}
            <button class="add-to-cart-btn" ${disabled}>${product.stock > 0 ? 'Agregar' : 'Sin stock'}</button>
        `;
        const addBtn = card.querySelector('.add-to-cart-btn');
        if (product.stock > 0) {
            addBtn.onclick = (e) => { e.stopPropagation(); addToCart(product); };
            card.onclick = () => addToCart(product);
        }
        productsGrid.appendChild(card);
    });
}

// ============ CARRITO ============
function addToCart(product) {
    if (product.stock === 0) { showToast('❌ Producto agotado', 'error'); return; }
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
        if (existing.quantity >= product.stock) { showToast('Stock insuficiente', 'error'); return; }
        existing.quantity++;
        showToast(`📦 +1 ${product.name}`, 'success');
    } else {
        cart.push({ ...product, quantity: 1 });
        showToast(`✨ ${product.name} agregado`, 'success');
    }
    updateCartUI();
    if (cartFab) {
        cartFab.style.transform = 'scale(1.2)';
        setTimeout(() => { if(cartFab) cartFab.style.transform = ''; }, 200);
    }
}

function getProductById(id) {
    for (const cat of Object.values(products)) {
        const product = cat.find(p => p.id === id);
        if (product) return product;
    }
    return null;
}

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
        cartItemsList.innerHTML = '<div class="empty-cart">Tu carrito está vacío</div>';
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
                    if (product && item.quantity >= product.stock) { showToast('Stock insuficiente', 'error'); return; }
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

// ============ PROCESO DE COMPRA CON DATOS DEL CLIENTE ============
function showCustomerForm() {
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const settings = getSettings();
    const deliveryCost = subtotal >= (settings.freeDeliveryMin || 20) ? 0 : (settings.deliveryCost || 3);
    const total = subtotal + deliveryCost;
    
    const modalHtml = `
        <div id="customerFormModal" class="modal" style="display:flex;">
            <div class="modal-content" style="max-width:400px;">
                <div class="cart-header"><h3>Datos para el pedido</h3><span class="close-form">&times;</span></div>
                <div style="padding:1rem;">
                    <input type="text" id="customerName" placeholder="Tu nombre completo" style="width:100%; padding:0.8rem; margin-bottom:1rem; border-radius:12px; border:1px solid #ddd;">
                    <input type="tel" id="customerPhone" placeholder="Número de teléfono" style="width:100%; padding:0.8rem; margin-bottom:1rem; border-radius:12px; border:1px solid #ddd;">
                    <div class="cart-total" style="margin-bottom:1rem;">
                        <strong>Total: S/ ${total.toFixed(2)}</strong>
                    </div>
                    <button id="confirmCustomerBtn" class="btn-primary">✅ Confirmar pedido</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const closeBtn = document.querySelector('.close-form');
    closeBtn.onclick = () => document.getElementById('customerFormModal').remove();
    
    document.getElementById('confirmCustomerBtn').onclick = () => {
        const name = document.getElementById('customerName').value.trim();
        const phone = document.getElementById('customerPhone').value.trim();
        if (!name || !phone) {
            showToast('Completa todos los datos', 'error');
            return;
        }
        document.getElementById('customerFormModal').remove();
        proceedToDelivery(name, phone, subtotal, deliveryCost, total);
    };
}

function proceedToDelivery(customerName, customerPhone, subtotal, deliveryCost, total) {
    const order = {
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        subtotal: subtotal,
        deliveryCost: deliveryCost,
        total: total,
        date: new Date().toISOString(),
        customerName: customerName,
        customerPhone: customerPhone
    };
    const newOrder = addOrder(order);
    currentOrderForDelivery = newOrder;
    showDeliveryModal();
}

let currentOrderForDelivery = null;

function showDeliveryModal() {
    if (deliveryModal) deliveryModal.style.display = 'flex';
    setTimeout(() => initMap(), 100);
}

function calculateDeliveryTime() {
    const baseTime = 20;
    const randomVariation = Math.floor(Math.random() * 15);
    return baseTime + randomVariation;
}

deliverNowBtn.onclick = () => {
    if (!deliveryAddress.value.trim()) {
        showToast('📍 Selecciona una dirección en el mapa', 'error');
        return;
    }
    const estimatedTime = calculateDeliveryTime();
    let orders = getOrders();
    orders = orders.map(o => {
        if (o.id === currentOrderForDelivery.id) {
            return {
                ...o,
                deliveryAddress: deliveryAddress.value,
                deliveryCoordinates: currentLocation,
                deliveryType: 'now',
                estimatedTime,
                status: 'confirmado'
            };
        }
        return o;
    });
    saveOrders(orders);
    deliveryModal.style.display = 'none';
    showToast(`🚚 Pedido confirmado! Llegará en ${estimatedTime} minutos`, 'success');
    showConfetti();
    cart = [];
    updateCartUI();
    
    // Enviar WhatsApp
    const message = `🛒 *NUEVO PEDIDO KIOSCO*\n👤 Cliente: ${currentOrderForDelivery.customerName}\n📞 Teléfono: ${currentOrderForDelivery.customerPhone}\n📍 Dirección: ${deliveryAddress.value}\n⏱️ Tiempo estimado: ${estimatedTime} min\n\n${cart.map(i => `• ${i.name} x${i.quantity}`).join('\n')}\n\n💰 Total: S/ ${currentOrderForDelivery.total.toFixed(2)}`;
    window.open(`https://wa.me/51914491874?text=${encodeURIComponent(message)}`, '_blank');
};

scheduleLaterBtn.onclick = () => {
    schedulePicker.style.display = 'block';
    const minDate = new Date();
    minDate.setHours(minDate.getHours() + 1);
    scheduleDate.min = minDate.toISOString().slice(0, 16);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 3);
    scheduleDate.max = maxDate.toISOString().slice(0, 16);
};

confirmScheduleBtn.onclick = () => {
    if (!scheduleDate.value) { showToast('📅 Selecciona una fecha', 'error'); return; }
    if (!deliveryAddress.value.trim()) { showToast('📍 Selecciona una dirección', 'error'); return; }
    const scheduledDate = new Date(scheduleDate.value);
    let orders = getOrders();
    orders = orders.map(o => {
        if (o.id === currentOrderForDelivery.id) {
            return {
                ...o,
                deliveryAddress: deliveryAddress.value,
                deliveryCoordinates: currentLocation,
                deliveryType: 'scheduled',
                scheduledDate: scheduledDate.toISOString(),
                status: 'programado'
            };
        }
        return o;
    });
    saveOrders(orders);
    deliveryModal.style.display = 'none';
    schedulePicker.style.display = 'none';
    showToast(`Pedido programado para ${scheduledDate.toLocaleString()}`, 'success');
    showConfetti();
    cart = [];
    updateCartUI();
    
    const message = `*PEDIDO PROGRAMADO KIOSCO*\n👤 Cliente: ${currentOrderForDelivery.customerName}\nTeléfono: ${currentOrderForDelivery.customerPhone}\nDirección: ${deliveryAddress.value}\nFecha: ${scheduledDate.toLocaleString()}\n\nTotal: S/ ${currentOrderForDelivery.total.toFixed(2)}`;
    window.open(`https://wa.me/51914491874?text=${encodeURIComponent(message)}`, '_blank');
};

// ============ EVENTOS ============
if (cartFab) cartFab.onclick = () => { if (cartModal) cartModal.style.display = 'flex'; };
if (closeCart) closeCart.onclick = () => { if (cartModal) cartModal.style.display = 'none'; };
if (checkoutBtn) checkoutBtn.onclick = () => {
    if (cart.length === 0) { showToast('🛒 Carrito vacío', 'error'); return; }
    showCustomerForm();
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
    if (e.target === deliveryModal && deliveryModal) deliveryModal.style.display = 'none';
};

window.addEventListener('productsUpdated', () => {
    products = getProducts();
    renderCategories();
});

// Inicializar
renderCategories();
updateCartUI();
showToast('✨ ¡Bienvenido a Kiosco!', 'success');