// ========== DATOS LOCALES ==========
let orders = [];
let isLoading = false;

// Cargar datos desde localStorage
function loadData() {
    try {
        const saved = localStorage.getItem('kioscoDB');
        if (saved) {
            const db = JSON.parse(saved);
            orders = db.orders || [];
        } else {
            orders = [];
        }
        
        // ========== PEDIDO DE PRUEBA CORREGIDO ==========
        // Usando el número de cliente de prueba del sistema: 912345678
        const testPhone = "912345678";
        const existingTestOrder = orders.find(o => o.phone === testPhone);
        
        if (!existingTestOrder) {
            const testOrder = {
                id: 9999,
                phone: "912345678",
                name: "Cliente de Prueba",
                address: "Calle Principal 123",
                items: [
                    { id: 1, name: "Coca Cola 500ml", quantity: 2, price: 3.50 },
                    { id: 2, name: "Papas Lays", quantity: 1, price: 4.50 },
                    { id: 3, name: "Chocolate Triple", quantity: 3, price: 2.50 }
                ],
                total: 18.50,
                status: "delivered",
                paymentMethod: "yape",
                type: "now",
                date: new Date().toISOString()
            };
            orders.unshift(testOrder);
        }
        
        // Agregar un pedido pendiente para prueba
        const pendingPhone = "912345678";
        const hasPending = orders.find(o => o.phone === pendingPhone && o.status === 'pending');
        if (!hasPending && orders.length > 0) {
            const pendingOrder = {
                id: 10000,
                phone: "912345678",
                name: "Cliente de Prueba",
                address: "Calle Principal 123",
                items: [
                    { id: 1, name: "Coca Cola 500ml", quantity: 1, price: 3.50 },
                    { id: 4, name: "Papas Lays", quantity: 2, price: 4.50 }
                ],
                total: 12.50,
                status: "pending",
                paymentMethod: "yape",
                type: "now",
                date: new Date().toISOString()
            };
            orders.unshift(pendingOrder);
        }
        
    } catch (e) {
        console.error('Error cargando datos:', e);
        showToast('Error al cargar los datos', true);
    }
}

loadData();

// ========== SLIDESHOW DE FONDO ==========
const bgSlides = document.querySelectorAll('.bg-slide');
const indicators = document.querySelectorAll('.indicator');
let currentSlide = 0;
let slideInterval;

function changeSlide(index) {
    if (!bgSlides.length) return;
    bgSlides.forEach(slide => slide.classList.remove('active'));
    if (indicators.length) {
        indicators.forEach(ind => ind.classList.remove('active'));
    }
    bgSlides[index].classList.add('active');
    if (indicators[index]) {
        indicators[index].classList.add('active');
    }
    currentSlide = index;
}

function nextSlide() {
    if (!bgSlides.length) return;
    let next = (currentSlide + 1) % bgSlides.length;
    changeSlide(next);
}

function startSlideshow() {
    if (slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 5000);
}

if (indicators.length) {
    indicators.forEach(ind => {
        ind.addEventListener('click', () => {
            if (slideInterval) clearInterval(slideInterval);
            changeSlide(parseInt(ind.dataset.index));
            startSlideshow();
        });
    });
}

startSlideshow();

// ========== TOAST ==========
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.background = isError ? '#e74c3c' : '#27ae60';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ========== FUNCIONES DE PEDIDOS ==========
function getStatusText(status) {
    const map = {
        pending: '⏳ Pendiente',
        confirmed: '✅ Confirmado',
        preparing: '🍳 Preparando',
        delivered: '🚚 Entregado',
        cancelled: '❌ Cancelado'
    };
    return map[status] || status;
}

function getStatusIcon(status) {
    const map = {
        pending: '⏳',
        confirmed: '✅',
        preparing: '🍳',
        delivered: '🚚',
        cancelled: '❌'
    };
    return map[status] || '📦';
}

// Mostrar skeletons mientras carga
function showSkeletons() {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;
    ordersList.innerHTML = `
        <div class="skeleton-order-card"></div>
        <div class="skeleton-order-card"></div>
        <div class="skeleton-order-card"></div>
    `;
}

// Renderizar pedidos con mejor manejo de estados
function renderOrders(phone) {
    return new Promise((resolve) => {
        try {
            const ordersList = document.getElementById('ordersList');
            const emptyState = document.getElementById('emptyOrders');
            const errorState = document.getElementById('errorOrders');
            
            if (!ordersList) {
                resolve();
                return;
            }
            
            // Ocultar estados especiales
            if (emptyState) emptyState.style.display = 'none';
            if (errorState) errorState.style.display = 'none';
            
            const userOrders = orders.filter(o => o.phone === phone);
            const totalOrdersSpan = document.getElementById('totalOrders');
            const totalSpentSpan = document.getElementById('totalSpent');
            const activeOrdersSpan = document.getElementById('activeOrders');
            
            // Actualizar estadísticas con animación
            if (totalOrdersSpan) {
                animateNumber(totalOrdersSpan, parseInt(totalOrdersSpan.textContent) || 0, userOrders.length);
            }
            
            if (totalSpentSpan) {
                const total = userOrders.reduce((s, o) => s + o.total, 0);
                animateNumber(totalSpentSpan, parseFloat(totalSpentSpan.textContent.replace('S/ ', '')) || 0, total, true);
            }
            
            if (activeOrdersSpan) {
                const activeCount = userOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
                animateNumber(activeOrdersSpan, parseInt(activeOrdersSpan.textContent) || 0, activeCount);
            }
            
            if (userOrders.length === 0) {
                if (emptyState) emptyState.style.display = 'block';
                ordersList.innerHTML = '';
                resolve();
                return;
            }
            
            ordersList.innerHTML = userOrders.map((o, index) => `
                <div class="order-card" style="animation-delay: ${index * 0.05}s">
                    <div class="order-header">
                        <span class="order-id">📄 Pedido #${o.id}</span>
                        <span class="status-badge status-${o.status}">${getStatusIcon(o.status)} ${getStatusText(o.status)}</span>
                    </div>
                    <div class="order-items">${o.items.map(i => `${i.name} x${i.quantity}`).join(' • ')}</div>
                    <div class="order-total">Total: S/ ${o.total.toFixed(2)}</div>
                    <div class="order-date">📅 ${new Date(o.date).toLocaleString()}</div>
                </div>
            `).join('');
            
            resolve();
        } catch (error) {
            console.error('Error renderizando pedidos:', error);
            const errorState = document.getElementById('errorOrders');
            if (errorState) errorState.style.display = 'block';
            showToast('Error al cargar los pedidos', true);
            resolve();
        }
    });
}

// Animación de números
function animateNumber(element, start, end, isCurrency = false) {
    if (!element) return;
    const duration = 500;
    const step = 10;
    const increment = (end - start) / (duration / step);
    let current = start;
    let timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        if (isCurrency) {
            element.textContent = `S/ ${current.toFixed(2)}`;
        } else {
            element.textContent = Math.round(current);
        }
    }, step);
}

// ========== EVENTOS ==========
const viewOrdersBtn = document.getElementById('viewOrdersBtn');
const phoneInput = document.getElementById('phoneInput');
const loginCard = document.getElementById('loginCard');
const ordersResult = document.getElementById('ordersResult');
const logoutBtn = document.getElementById('logoutBtn');
const retryBtn = document.getElementById('retryBtn');

// Cargar último número guardado
const lastPhone = localStorage.getItem('lastOrdersPhone');
if (lastPhone && phoneInput) {
    phoneInput.value = lastPhone;
}

async function handleViewOrders() {
    if (!phoneInput) return;
    const phone = phoneInput.value.trim();
    
    if (!phone) {
        showToast('📱 Ingresa un número de teléfono', true);
        return;
    }
    if (!/^\d{9,}$/.test(phone)) {
        showToast('⚠️ Ingresa un número válido (9 dígitos mínimo)', true);
        return;
    }
    
    // Guardar número en localStorage
    localStorage.setItem('lastOrdersPhone', phone);
    
    // Mostrar skeletons
    showSkeletons();
    
    // Mostrar resultados con animación
    if (loginCard && ordersResult) {
        loginCard.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            loginCard.style.display = 'none';
            ordersResult.style.display = 'block';
            ordersResult.style.animation = 'fadeIn 0.5s ease';
        }, 300);
    }
    
    // Renderizar pedidos
    await renderOrders(phone);
}

function handleLogout() {
    if (loginCard && ordersResult) {
        ordersResult.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            ordersResult.style.display = 'none';
            loginCard.style.display = 'block';
            loginCard.style.animation = 'fadeIn 0.5s ease';
            if (phoneInput) phoneInput.value = '';
            // Limpiar número guardado opcional
            // localStorage.removeItem('lastOrdersPhone');
        }, 300);
    }
}

function handleRetry() {
    const errorState = document.getElementById('errorOrders');
    if (errorState) errorState.style.display = 'none';
    if (phoneInput) {
        const phone = phoneInput.value.trim();
        if (phone) {
            showSkeletons();
            renderOrders(phone);
        } else if (loginCard && ordersResult) {
            // Volver al login si no hay número
            handleLogout();
        }
    }
}

if (viewOrdersBtn) {
    viewOrdersBtn.addEventListener('click', handleViewOrders);
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
}

if (retryBtn) {
    retryBtn.addEventListener('click', handleRetry);
}

// Enter key
if (phoneInput) {
    phoneInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleViewOrders();
        }
    });
}

// ========== TEMA OSCURO ==========
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

function setTheme(theme) {
    if (!body || !themeToggle) return;
    if (theme === 'dark') {
        body.classList.add('dark-mode');
        themeToggle.classList.add('dark');
    } else {
        body.classList.remove('dark-mode');
        themeToggle.classList.remove('dark');
    }
    localStorage.setItem('ordersTheme', theme);
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const isDark = body.classList.contains('dark-mode');
        setTheme(isDark ? 'light' : 'dark');
    });
}

const savedTheme = localStorage.getItem('ordersTheme');
if (savedTheme === 'dark') setTheme('dark');

// ========== RECARGAR DATOS EN TIEMPO REAL ==========
window.addEventListener('storage', (e) => {
    if (e.key === 'kioscoDB') {
        loadData();
        // Si el usuario está viendo pedidos, actualizar
        if (ordersResult && ordersResult.style.display === 'block' && phoneInput) {
            const phone = phoneInput.value.trim();
            if (phone) {
                showSkeletons();
                renderOrders(phone);
                showToast('📦 Los pedidos se han actualizado');
            }
        }
    }
});

// ========== LIMPIEZA DE INTERVALOS ==========
window.addEventListener('beforeunload', () => {
    if (slideInterval) clearInterval(slideInterval);
});

// ========== ANIMACIONES CSS ADICIONALES ==========
// Agregar estilos de animación faltantes
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-20px); }
    }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .order-card {
        animation: slideIn 0.3s ease forwards;
        opacity: 0;
        transform: translateX(-20px);
    }
    @keyframes slideIn {
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);

// ========== INICIALIZACIÓN ==========
console.log('✅ client-orders.js cargado correctamente');
console.log('📱 Número de prueba: 912345678');
