// ============ CONSTANTES ============
const STORAGE_KEYS = {
    PRODUCTS: 'kiosco_products',
    ORDERS: 'kiosco_orders',
    ADMIN_PHONE: 'kiosco_admin_phone',
    PRODUCT_IMAGES: 'kiosco_product_images',
    CUSTOMERS: 'kiosco_customers',
    DELIVERIES: 'kiosco_deliveries',
    ACTIVITY_LOG: 'kiosco_activity_log',
    SETTINGS: 'kiosco_settings'
};

// ============ INICIALIZACIÓN ============
function initDB() {
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
        const defaultProducts = {
            'Bebidas': [
                { id: 1, name: 'Coca Cola 500ml', price: 3.5, stock: 50, cost: 2.0 },
                { id: 2, name: 'Inca Kola 500ml', price: 3.5, stock: 45, cost: 2.0 },
                { id: 3, name: 'Sprite 500ml', price: 3.0, stock: 30, cost: 1.8 },
                { id: 4, name: 'Fanta 500ml', price: 3.0, stock: 25, cost: 1.8 }
            ],
            'Snacks': [
                { id: 5, name: 'Papas Lays', price: 4.0, stock: 20, cost: 2.5 },
                { id: 6, name: 'Doritos', price: 4.5, stock: 15, cost: 2.8 },
                { id: 7, name: 'Ruffles', price: 4.0, stock: 18, cost: 2.5 }
            ],
            'Dulces': [
                { id: 8, name: 'Chocolate Sublime', price: 2.5, stock: 40, cost: 1.2 },
                { id: 9, name: "M&M's", price: 3.0, stock: 35, cost: 1.5 }
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
    
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.DELIVERIES)) {
        localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify([]));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG)) {
        localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify([]));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
            businessName: 'Kiosco',
            businessPhone: '+51914491874',
            deliveryCost: 3.0,
            freeDeliveryMin: 20,
            scheduleStart: '08:00',
            scheduleEnd: '22:00'
        }));
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

// ============ IMÁGENES ============
function getProductImages() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCT_IMAGES)) || {};
}

function getProductImagesList(productId) {
    const images = getProductImages();
    return images[productId] || [];
}

function saveProductImage(productId, imageData, index = null) {
    const images = getProductImages();
    if (!images[productId]) images[productId] = [];
    if (index !== null && images[productId][index]) {
        images[productId][index] = imageData;
    } else {
        images[productId].push(imageData);
    }
    localStorage.setItem(STORAGE_KEYS.PRODUCT_IMAGES, JSON.stringify(images));
    window.dispatchEvent(new Event('imagesUpdated'));
}

function deleteProductImage(productId, index = null) {
    const images = getProductImages();
    if (index === null) {
        delete images[productId];
    } else if (images[productId]) {
        images[productId].splice(index, 1);
        if (images[productId].length === 0) delete images[productId];
    }
    localStorage.setItem(STORAGE_KEYS.PRODUCT_IMAGES, JSON.stringify(images));
    window.dispatchEvent(new Event('imagesUpdated'));
}

// ============ ÓRDENES ============
function getOrders() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || [];
}

function saveOrders(orders) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    window.dispatchEvent(new Event('ordersUpdated'));
}

function addOrder(order) {
    const orders = getOrders();
    const newOrder = { 
        ...order, 
        id: Date.now(), 
        status: 'pendiente', 
        date: new Date().toISOString(),
        orderNumber: orders.length + 1,
        deliveryStatus: 'pendiente',
        estimatedTime: null,
        history: [{ status: 'pendiente', date: new Date().toISOString(), note: 'Pedido creado' }]
    };
    orders.unshift(newOrder);
    saveOrders(orders);
    addActivityLog('Nuevo pedido', `Pedido #${newOrder.orderNumber} creado`, 'order');
    return newOrder;
}

function updateOrderStatus(orderId, newStatus, note = '') {
    let orders = getOrders();
    let updatedOrder = null;
    orders = orders.map(o => {
        if (o.id === orderId) {
            updatedOrder = { ...o, status: newStatus, history: [...(o.history || []), { status: newStatus, date: new Date().toISOString(), note }] };
            return updatedOrder;
        }
        return o;
    });
    saveOrders(orders);
    
    // Notificar al cliente si hay número de teléfono
    if (updatedOrder && updatedOrder.customerPhone) {
        notifyCustomerStatusChange(updatedOrder.customerPhone, updatedOrder.orderNumber, newStatus);
    }
    
    addActivityLog('Estado actualizado', `Pedido #${orderId} cambió a ${newStatus}`, 'order');
    return updatedOrder;
}

function deleteOrder(orderId) {
    let orders = getOrders();
    const orderToDelete = orders.find(o => o.id === orderId);
    orders = orders.filter(o => o.id !== orderId);
    saveOrders(orders);
    addActivityLog('Pedido eliminado', `Pedido #${orderId} fue eliminado`, 'order');
    return orderToDelete;
}

// ============ NOTIFICACIONES AL CLIENTE ============
function notifyCustomerStatusChange(phone, orderNumber, status) {
    const statusMessages = {
        'pendiente': '✅ Tu pedido ha sido recibido y está pendiente de confirmación',
        'confirmado': '✅ Tu pedido ha sido confirmado y está siendo preparado',
        'preparando': '👨‍🍳 Tu pedido está siendo preparado por nuestro equipo',
        'en_camino': '🚚 ¡Tu pedido está en camino! El repartidor llegará en aproximadamente 10-15 minutos',
        'entregado': '🎉 ¡Tu pedido ha sido entregado! Gracias por comprar en Kiosco',
        'rechazado': '❌ Tu pedido ha sido rechazado. Comunícate con nosotros para más información'
    };
    
    const notifications = JSON.parse(localStorage.getItem('kiosco_customer_notifications') || '{}');
    if (!notifications[phone]) notifications[phone] = [];
    notifications[phone].unshift({
        id: Date.now(),
        orderNumber: orderNumber,
        status: status,
        message: statusMessages[status] || `Tu pedido #${orderNumber} cambió a estado: ${status}`,
        read: false,
        date: new Date().toISOString()
    });
    localStorage.setItem('kiosco_customer_notifications', JSON.stringify(notifications));
    
    // Notificación en navegador
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('🛒 Actualización de tu pedido', {
            body: statusMessages[status] || `Pedido #${orderNumber} - Estado: ${status}`,
            icon: '/assets/icons/icon-192x192.png'
        });
    }
}

function getCustomerNotifications(phone) {
    const notifications = JSON.parse(localStorage.getItem('kiosco_customer_notifications') || '{}');
    return notifications[phone] || [];
}

function markNotificationAsRead(phone, notificationId) {
    const notifications = JSON.parse(localStorage.getItem('kiosco_customer_notifications') || '{}');
    if (notifications[phone]) {
        notifications[phone] = notifications[phone].map(n => 
            n.id === notificationId ? { ...n, read: true } : n
        );
        localStorage.setItem('kiosco_customer_notifications', JSON.stringify(notifications));
    }
}

// ============ REPORTES ============
function getMostProfitableProducts(limit = 5) {
    const products = getProducts();
    const orders = getOrders();
    const productSales = {};
    
    orders.forEach(order => {
        order.items.forEach(item => {
            let productCost = 0;
            for (const cat of Object.values(products)) {
                const product = cat.find(p => p.id === item.id);
                if (product) {
                    productCost = product.cost || item.price * 0.6;
                    break;
                }
            }
            if (!productSales[item.id]) {
                productSales[item.id] = { name: item.name, quantity: 0, revenue: 0, cost: 0, profit: 0 };
            }
            productSales[item.id].quantity += item.quantity;
            productSales[item.id].revenue += item.price * item.quantity;
            productSales[item.id].cost += productCost * item.quantity;
            productSales[item.id].profit = productSales[item.id].revenue - productSales[item.id].cost;
        });
    });
    
    return Object.values(productSales).sort((a, b) => b.profit - a.profit).slice(0, limit);
}

function getPeakHours() {
    const orders = getOrders();
    const hourStats = {};
    for (let i = 0; i < 24; i++) hourStats[i] = { count: 0, revenue: 0 };
    orders.forEach(order => {
        const hour = new Date(order.date).getHours();
        hourStats[hour].count++;
        hourStats[hour].revenue += order.total;
    });
    return hourStats;
}

function getTopCustomers(limit = 5) {
    const orders = getOrders();
    const customerStats = {};
    orders.forEach(order => {
        if (order.customerPhone) {
            if (!customerStats[order.customerPhone]) {
                customerStats[order.customerPhone] = { phone: order.customerPhone, name: order.customerName || 'Cliente', totalSpent: 0, orderCount: 0 };
            }
            customerStats[order.customerPhone].totalSpent += order.total;
            customerStats[order.customerPhone].orderCount++;
        }
    });
    return Object.values(customerStats).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, limit);
}

function getDailySales(days = 7) {
    const orders = getOrders();
    const result = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dailyOrders = orders.filter(order => new Date(order.date).toISOString().split('T')[0] === dateStr);
        result.push({ date: dateStr, total: dailyOrders.reduce((sum, order) => sum + order.total, 0), count: dailyOrders.length });
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
            return orderDate.getFullYear() === date.getFullYear() && orderDate.getMonth() === date.getMonth();
        });
        result.push({ month: monthStr, total: monthlyOrders.reduce((sum, order) => sum + order.total, 0), count: monthlyOrders.length });
    }
    return result;
}

// ============ ACTIVITY LOG ============
function addActivityLog(action, description, type = 'general') {
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG)) || [];
    logs.unshift({ id: Date.now(), action, description, type, date: new Date().toISOString() });
    if (logs.length > 500) logs.pop();
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify(logs));
    window.dispatchEvent(new Event('activityUpdated'));
}

function getActivityLog(limit = 100) {
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG)) || [];
    return logs.slice(0, limit);
}

function clearActivityLog() {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify([]));
}

// ============ CONFIGURACIÓN ============
function getSettings() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {};
}

function saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new Event('settingsUpdated'));
}

// ============ ADMIN ============
function isAdmin(phone) {
    const adminPhone = localStorage.getItem(STORAGE_KEYS.ADMIN_PHONE);
    const cleanPhone = phone.replace(/\s+/g, '').replace(/\+/g, '');
    const cleanAdmin = adminPhone.replace(/\s+/g, '').replace(/\+/g, '');
    return cleanPhone === cleanAdmin;
}

// Inicializar
initDB();