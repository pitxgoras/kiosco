// Estado global
let cart = [];
let currentCategory = null;
let products = {};

// Elementos DOM
const categoriesList = document.getElementById('categoriesList');
const productsGrid = document.getElementById('productsGrid');
const cartModal = document.getElementById('cartModal');
const cartFab = document.getElementById('cartFab');
const closeCart = document.querySelector('.close-cart');
const checkoutBtn = document.getElementById('checkoutBtn');
const themeToggle = document.getElementById('themeToggle');
const searchInput = document.getElementById('searchProducts');
const adminAccessBtn = document.getElementById('adminAccessBtn');
const cartBadge = document.getElementById('cartBadge');
const cartItemsList = document.getElementById('cartItemsList');
const cartTotal = document.getElementById('cartTotal');

// Mostrar notificación
function showToast(message, type = 'success') {
    const toast = document.getElementById('toastNotification');
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#ef4444' : '#10b981';
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Obtener imágenes de productos
function getProductImages() {
    return JSON.parse(localStorage.getItem('kiosco_product_images')) || {};
}

// Renderizar categorías
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

// Renderizar productos CON IMÁGENES
function renderProducts(category, searchTerm = '') {
    if (!products[category]) return;
    let filteredProducts = products[category];
    
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    const productImages = getProductImages();
    productsGrid.innerHTML = '';
    
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = '<div class="no-results">😢 No se encontraron productos</div>';
        return;
    }
    
    filteredProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        // Verificar si el producto tiene imagen
        const imageUrl = productImages[product.id];
        const imageHtml = imageUrl 
            ? `<img src="${imageUrl}" class="product-image-card" style="width: 100%; height: 140px; object-fit: cover; border-radius: 12px; margin-bottom: 0.8rem;">` 
            : `<div class="product-image-placeholder" style="width: 100%; height: 140px; background: linear-gradient(135deg, #e2e8f0, #f1f5f9); border-radius: 12px; margin-bottom: 0.8rem; display: flex; align-items: center; justify-content: center; color: #94a3b8;">📷 Sin imagen</div>`;
        
        // Mostrar stock si está disponible
        const stockHtml = product.stock !== undefined 
            ? `<div class="product-stock ${product.stock === 0 ? 'stock-out' : (product.stock < 10 ? 'stock-low' : '')}" style="font-size: 0.7rem; margin-bottom: 0.5rem; color: ${product.stock === 0 ? '#ef4444' : (product.stock < 10 ? '#f59e0b' : '#10b981')};">${product.stock === 0 ? '❌ Agotado' : `📦 Stock: ${product.stock}`}</div>`
            : '';
        
        const disabled = product.stock === 0 ? 'disabled' : '';
        const buttonText = product.stock === 0 ? '🚫 Sin stock' : '➕ Agregar al carrito';
        
        card.innerHTML = `
            ${imageHtml}
            <h4>${product.name}</h4>
            <p>S/ ${product.price.toFixed(2)}</p>
            ${stockHtml}
            <button class="add-to-cart-btn" ${disabled}>${buttonText}</button>
        `;
        
        const addBtn = card.querySelector('.add-to-cart-btn');
        if (product.stock !== 0) {
            addBtn.onclick = (e) => {
                e.stopPropagation();
                addToCart(product);
            };
            card.onclick = () => addToCart(product);
        }
        
        productsGrid.appendChild(card);
    });
}

// Agregar al carrito
function addToCart(product) {
    // Verificar stock antes de agregar
    if (product.stock !== undefined && product.stock === 0) {
        showToast('❌ Producto agotado', 'error');
        return;
    }
    
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        // Verificar stock disponible
        if (product.stock !== undefined && existing.quantity >= product.stock) {
            showToast('⚠️ No hay suficiente stock', 'error');
            return;
        }
        existing.quantity++;
        showToast(`📦 +1 ${product.name}`, 'success');
    } else {
        cart.push({ ...product, quantity: 1 });
        showToast(`✨ ${product.name} agregado`, 'success');
    }
    updateCartUI();
    
    // Animación del botón
    if (cartFab) {
        cartFab.style.transform = 'scale(1.2)';
        setTimeout(() => {
            cartFab.style.transform = '';
        }, 200);
    }
}

// Obtener producto por ID (para verificar stock)
function getProductById(id) {
    for (const cat of Object.values(products)) {
        const product = cat.find(p => p.id === id);
        if (product) return product;
    }
    return null;
}

// Actualizar UI del carrito
function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartBadge) cartBadge.textContent = totalItems;
    
    if (!cartItemsList) return;
    cartItemsList.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsList.innerHTML = '<div class="empty-cart">🛒 Tu carrito está vacío</div>';
        if (cartTotal) cartTotal.textContent = '0.00';
        return;
    }
    
    cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div>
                <strong>${item.name}</strong>
                <br>
                <small>S/ ${item.price.toFixed(2)}</small>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn" data-id="${item.id}" data-change="-1">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" data-id="${item.id}" data-change="1">+</button>
                <button class="remove-item" data-id="${item.id}">🗑️</button>
            </div>
            <div>
                <strong>S/ ${(item.price * item.quantity).toFixed(2)}</strong>
            </div>
        `;
        cartItemsList.appendChild(div);
    });
    
    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    if (cartTotal) cartTotal.textContent = total.toFixed(2);
    
    // Eventos para botones de cantidad
    document.querySelectorAll('.qty-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            const change = parseInt(btn.dataset.change);
            const item = cart.find(i => i.id === id);
            if (item) {
                // Verificar stock al aumentar cantidad
                if (change === 1) {
                    const product = getProductById(id);
                    if (product && product.stock !== undefined && item.quantity >= product.stock) {
                        showToast('⚠️ No hay suficiente stock', 'error');
                        return;
                    }
                }
                item.quantity += change;
                if (item.quantity <= 0) {
                    cart = cart.filter(i => i.id !== id);
                }
                updateCartUI();
            }
        };
    });
    
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            cart = cart.filter(item => item.id !== id);
            updateCartUI();
            showToast('Producto eliminado', 'info');
        };
    });
}

// Confirmar pedido
function confirmOrder() {
    if (cart.length === 0) {
        showToast('🛒 Tu carrito está vacío', 'error');
        return;
    }
    
    // Verificar stock antes de enviar el pedido
    for (const item of cart) {
        const product = getProductById(item.id);
        if (product && product.stock !== undefined && product.stock < item.quantity) {
            showToast(`⚠️ Stock insuficiente para ${item.name}`, 'error');
            return;
        }
    }
    
    const order = {
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })),
        total: cart.reduce((s, i) => s + i.price * i.quantity, 0),
        date: new Date().toISOString(),
        client: 'Cliente Web'
    };
    
    addOrder(order);
    
    const date = new Date().toLocaleString('es-PE');
    const summary = `🛒 *PEDIDO KIOSCO*\n📅 ${date}\n\n${cart.map(i => `• ${i.name} x${i.quantity} = S/ ${(i.price*i.quantity).toFixed(2)}`).join('\n')}\n\n━━━━━━━━━━━━━━\n💰 *TOTAL: S/ ${order.total.toFixed(2)}*\n\n✅ ¡Gracias por tu compra!`;
    const encoded = encodeURIComponent(summary);
    window.open(`https://wa.me/51914491874?text=${encoded}`, '_blank');
    
    cart = [];
    updateCartUI();
    showToast('✨ Pedido enviado con éxito', 'success');
    if (cartModal) cartModal.style.display = 'none';
}

// Eventos
if (cartFab) {
    cartFab.onclick = () => {
        if (cartModal) cartModal.style.display = 'flex';
    };
}

if (closeCart) {
    closeCart.onclick = () => {
        if (cartModal) cartModal.style.display = 'none';
    };
}

if (checkoutBtn) checkoutBtn.onclick = confirmOrder;

if (adminAccessBtn) {
    adminAccessBtn.onclick = () => {
        window.open('admin.html', '_blank');
    };
}

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        if (currentCategory) {
            renderProducts(currentCategory, e.target.value);
        }
    });
}

// Tema claro/oscuro
if (themeToggle) {
    // Cargar tema guardado
    if (localStorage.getItem('kiosco_theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('kiosco_theme', isDark ? 'dark' : 'light');
        showToast(isDark ? '🌙 Modo oscuro activado' : '☀️ Modo claro activado', 'info');
    });
}

// Cerrar modal al hacer clic fuera
window.onclick = (event) => {
    if (event.target === cartModal) {
        cartModal.style.display = 'none';
    }
};

// Actualizar en tiempo real
window.addEventListener('productsUpdated', () => {
    products = getProducts();
    renderCategories();
    if (searchInput && searchInput.value && currentCategory) {
        renderProducts(currentCategory, searchInput.value);
    }
});

window.addEventListener('imagesUpdated', () => {
    if (currentCategory) {
        renderProducts(currentCategory, searchInput ? searchInput.value : '');
    }
});

// Inicializar
renderCategories();
updateCartUI();
showToast('✨ ¡Bienvenido a Kiosco!', 'success');