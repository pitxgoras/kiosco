// ============ CONSTANTES ============
const STORAGE_KEYS = {
    PRODUCTS: 'kiosco_products',
    ORDERS: 'kiosco_orders',
    ADMIN_PHONE: 'kiosco_admin_phone',
    PRODUCT_IMAGES: 'kiosco_product_images'
};

// ============ INICIALIZACIÓN ============
function initDB() {
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
        const defaultProducts = {
            '🥤 Bebidas': [
                { id: 1, name: 'Coca Cola 500ml', price: 3.5, stock: 50 },
                { id: 2, name: 'Inca Kola 500ml', price: 3.5, stock: 45 },
                { id: 3, name: 'Sprite 500ml', price: 3.0, stock: 30 },
                { id: 4, name: 'Fanta 500ml', price: 3.0, stock: 25 }
            ],
            '🍿 Snacks': [
                { id: 5, name: 'Papas Lays', price: 4.0, stock: 20 },
                { id: 6, name: 'Doritos', price: 4.5, stock: 15 },
                { id: 7, name: 'Ruffles', price: 4.0, stock: 18 }
            ],
            '🍫 Dulces': [
                { id: 8, name: 'Chocolate Sublime', price: 2.5, stock: 40 },
                { id: 9, name: "M&M's", price: 3.0, stock: 35 }
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
    
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCT_IMAGES)) {
        localStorage.setItem(STORAGE_KEYS.PRODUCT_IMAGES, JSON.stringify({}));
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

// ============ IMÁGENES DE PRODUCTOS ============
function getProductImages() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCT_IMAGES)) || {};
}

function saveProductImage(productId, imageData) {
    const images = getProductImages();
    images[productId] = imageData;
    localStorage.setItem(STORAGE_KEYS.PRODUCT_IMAGES, JSON.stringify(images));
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('imagesUpdated'));
    }
}

function deleteProductImage(productId) {
    const images = getProductImages();
    delete images[productId];
    localStorage.setItem(STORAGE_KEYS.PRODUCT_IMAGES, JSON.stringify(images));
}

function getProductImage(productId) {
    const images = getProductImages();
    return images[productId] || null;
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

// ============ ESTADÍSTICAS PARA GRÁFICAS ============
function getSalesByDay(days = 7) {
    const orders = getOrders();
    const result = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dailyOrders = orders.filter(order => {
            const orderDate = new Date(order.date).toISOString().split('T')[0];
            return orderDate === dateStr;
        });
        
        const total = dailyOrders.reduce((sum, order) => sum + order.total, 0);
        result.push({
            date: dateStr,
            total: total,
            count: dailyOrders.length
        });
    }
    return result;
}

function getSalesByMonth(months = 12) {
    const orders = getOrders();
    const result = [];
    const today = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(today.getMonth() - i);
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const monthlyOrders = orders.filter(order => {
            const orderDate = new Date(order.date);
            return orderDate.getFullYear() === date.getFullYear() && 
                   orderDate.getMonth() === date.getMonth();
        });
        
        const total = monthlyOrders.reduce((sum, order) => sum + order.total, 0);
        result.push({
            month: monthStr,
            total: total,
            count: monthlyOrders.length
        });
    }
    return result;
}

function getTopProducts(limit = 5) {
    const orders = getOrders();
    const productSales = {};
    
    orders.forEach(order => {
        order.items.forEach(item => {
            if (!productSales[item.name]) {
                productSales[item.name] = { quantity: 0, revenue: 0 };
            }
            productSales[item.name].quantity += item.quantity;
            productSales[item.name].revenue += item.price * item.quantity;
        });
    });
    
    const sorted = Object.entries(productSales)
        .sort((a, b) => b[1].quantity - a[1].quantity)
        .slice(0, limit);
    
    return sorted.map(([name, data]) => ({
        name: name.length > 20 ? name.substring(0, 20) + '...' : name,
        quantity: data.quantity,
        revenue: data.revenue
    }));
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