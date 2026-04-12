// ============ CONSTANTES ============
const STORAGE_KEYS = {
    PRODUCTS: 'kiosco_products',
    ORDERS: 'kiosco_orders',
    ADMIN_PHONE: 'kiosco_admin_phone'
};

// ============ INICIALIZACIÓN ============
function initDB() {
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
        const defaultProducts = {
            '🥤 Bebidas': [
                { id: 1, name: 'Coca Cola 500ml', price: 3.5 },
                { id: 2, name: 'Inca Kola 500ml', price: 3.5 },
                { id: 3, name: 'Sprite 500ml', price: 3.0 },
                { id: 4, name: 'Fanta 500ml', price: 3.0 }
            ],
            '🍿 Snacks': [
                { id: 5, name: 'Papas Lays', price: 4.0 },
                { id: 6, name: 'Doritos', price: 4.5 },
                { id: 7, name: 'Ruffles', price: 4.0 }
            ],
            '🍫 Dulces': [
                { id: 8, name: 'Chocolate Sublime', price: 2.5 },
                { id: 9, name: "M&M's", price: 3.0 }
            ]
        };
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(defaultProducts));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.ADMIN_PHONE)) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_PHONE, '+51914491874');
    }
}

// ============ PRODUCTOS ============
function getProducts() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)) || {};
}

function saveProducts(products) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('productsUpdated'));
    }
}

// ============ ÓRDENES ============
function getOrders() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || [];
}

function saveOrders(orders) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('ordersUpdated'));
    }
}

function addOrder(order) {
    const orders = getOrders();
    const newOrder = { 
        ...order, 
        id: Date.now(), 
        status: 'pendiente', 
        date: new Date().toISOString(),
        orderNumber: orders.length + 1
    };
    orders.unshift(newOrder);
    saveOrders(orders);
    return newOrder;
}

function updateOrderStatus(orderId, newStatus) {
    let orders = getOrders();
    orders = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    saveOrders(orders);
}

function deleteOrder(orderId) {
    let orders = getOrders();
    orders = orders.filter(o => o.id !== orderId);
    saveOrders(orders);
}

// ============ ADMIN ============
function isAdmin(phone) {
    const adminPhone = localStorage.getItem(STORAGE_KEYS.ADMIN_PHONE);
    const cleanPhone = phone.replace(/\s+/g, '').replace(/\+/g, '');
    const cleanAdmin = adminPhone.replace(/\s+/g, '').replace(/\+/g, '');
    return cleanPhone === cleanAdmin;
}

function getAdminPhone() {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_PHONE);
}

// Inicializar
initDB();