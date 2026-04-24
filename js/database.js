// ============ CONSTANTES ============
const STORAGE_KEYS = {
    PRODUCTS: 'kiosco_products',
    ORDERS: 'kiosco_orders',
    ADMIN_PHONE: 'kiosco_admin_phone',
    PRODUCT_IMAGES: 'kiosco_product_images',
    CUSTOMERS: 'kiosco_customers',
    DELIVERIES: 'kiosco_deliveries',
    ACTIVITY_LOG: 'kiosco_activity_log',
    SETTINGS: 'kiosco_settings',
    THEME: 'kiosco_theme',
    LOGO: 'kiosco_logo',
    INVOICES: 'kiosco_invoices'
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
        localStorage.setItem(STORAGE_KEYS.ADMIN_PHONE, '914491874');
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
            businessPhone: '914491874',
            businessRUC: '',
            businessAddress: '',
            deliveryCost: 3.0,
            freeDeliveryMin: 20,
            scheduleStart: '08:00',
            scheduleEnd: '22:00',
            paymentMethods: ['yape', 'plin', 'transferencia', 'efectivo'],
            deliveryWindows: ['10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00', '18:00-20:00']
        }));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.THEME)) {
        localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify({
            primaryColor: '#6366f1',
            secondaryColor: '#10b981',
            dangerColor: '#ef4444',
            warningColor: '#f59e0b',
            darkColor: '#1e293b'
        }));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.INVOICES)) {
        localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify([]));
    }
}

// ============ TEMAS Y PERSONALIZACIÓN ============
function getTheme() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.THEME)) || {
        primaryColor: '#6366f1',
        secondaryColor: '#10b981',
        dangerColor: '#ef4444',
        warningColor: '#f59e0b',
        darkColor: '#1e293b'
    };
}

function saveTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(theme));
    applyThemeToPage(theme);
    window.dispatchEvent(new Event('themeUpdated'));
}

function applyThemeToPage(theme) {
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primaryColor);
    root.style.setProperty('--primary-dark', theme.primaryColor);
    root.style.setProperty('--primary-light', theme.primaryColor + 'cc');
    root.style.setProperty('--success', theme.secondaryColor);
    root.style.setProperty('--danger', theme.dangerColor);
    root.style.setProperty('--warning', theme.warningColor);
    root.style.setProperty('--dark', theme.darkColor);
}

function getLogo() {
    return localStorage.getItem(STORAGE_KEYS.LOGO) || null;
}

function saveLogo(logoData) {
    localStorage.setItem(STORAGE_KEYS.LOGO, logoData);
    window.dispatchEvent(new Event('logoUpdated'));
}

function deleteLogo() {
    localStorage.removeItem(STORAGE_KEYS.LOGO);
    window.dispatchEvent(new Event('logoUpdated'));
}

// ============ FACTURACIÓN ELECTRÓNICA ============
function generateInvoice(order) {
    const invoices = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVOICES)) || [];
    const settings = getSettings();
    const invoiceNumber = `F001-${String(invoices.length + 1).padStart(8, '0')}`;
    
    const invoice = {
        id: Date.now(),
        number: invoiceNumber,
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerRUC: order.customerRUC || '',
        customerAddress: order.customerAddress || '',
        date: new Date().toISOString(),
        items: order.items,
        subtotal: order.subtotal || order.total - (order.deliveryCost || 0),
        igv: (order.subtotal || order.total - (order.deliveryCost || 0)) * 0.18,
        total: order.total,
        paymentMethod: order.paymentMethod,
        deliveryAddress: order.deliveryAddress,
        businessName: settings.businessName,
        businessRUC: settings.businessRUC,
        businessAddress: settings.businessAddress
    };
    
    invoices.unshift(invoice);
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    
    // Generar HTML de factura
    const invoiceHtml = generateInvoiceHTML(invoice);
    
    // Descargar automáticamente
    const blob = new Blob([invoiceHtml], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `factura_${invoiceNumber}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    return invoice;
}

function generateInvoiceHTML(invoice) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Factura Electrónica - ${invoice.number}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .invoice { max-width: 800px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .business-info { margin-bottom: 20px; }
                .customer-info { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background: #f0f0f0; }
                .totals { text-align: right; margin-top: 20px; }
                .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="invoice">
                <div class="header">
                    <h1>FACTURA ELECTRÓNICA</h1>
                    <p>${invoice.number}</p>
                    <p>Fecha: ${new Date(invoice.date).toLocaleString('es-PE')}</p>
                </div>
                <div class="business-info">
                    <strong>${invoice.businessName}</strong><br>
                    RUC: ${invoice.businessRUC || 'No registrado'}<br>
                    Dirección: ${invoice.businessAddress || 'No registrada'}
                </div>
                <div class="customer-info">
                    <strong>Cliente:</strong> ${invoice.customerName}<br>
                    <strong>Teléfono:</strong> ${invoice.customerPhone}<br>
                    ${invoice.customerRUC ? `<strong>RUC:</strong> ${invoice.customerRUC}<br>` : ''}
                    ${invoice.customerAddress ? `<strong>Dirección:</strong> ${invoice.customerAddress}<br>` : ''}
                </div>
                <table>
                    <thead>
                        <tr><th>Cantidad</th><th>Producto</th><th>Precio Unitario</th><th>Total</th></tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map(item => `
                            <tr>
                                <td>${item.quantity}</td>
                                <td>${item.name}</td>
                                <td>S/ ${item.price.toFixed(2)}</div></td>
                                <td>S/ ${(item.price * item.quantity).toFixed(2)}</div></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="totals">
                    <p><strong>Subtotal:</strong> S/ ${invoice.subtotal.toFixed(2)}</p>
                    <p><strong>IGV (18%):</strong> S/ ${invoice.igv.toFixed(2)}</p>
                    <p><strong>Total:</strong> S/ ${invoice.total.toFixed(2)}</p>
                    <p><strong>Método de pago:</strong> ${getPaymentMethodName(invoice.paymentMethod)}</p>
                </div>
                <div class="footer">
                    <p>¡Gracias por tu compra!</p>
                    <p>Este documento es una representación impresa de la factura electrónica.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

function getPaymentMethodName(method) {
    const methods = {
        'yape': 'Yape',
        'plin': 'Plin',
        'transferencia': 'Transferencia bancaria',
        'efectivo': 'Pago contra entrega'
    };
    return methods[method] || method;
}

function getInvoices() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.INVOICES)) || [];
}

// ============ MÉTODOS DE PAGO ============
function getPaymentMethods() {
    const settings = getSettings();
    return settings.paymentMethods || ['yape', 'plin', 'transferencia', 'efectivo'];
}

function getPaymentMethodDetails(method) {
    const details = {
        'yape': { name: 'Yape', icon: '📱', instructions: 'Escanea el código QR o transfiere al número +51 914 491 874' },
        'plin': { name: 'Plin', icon: '📱', instructions: 'Transfiere al número +51 914 491 874' },
        'transferencia': { name: 'Transferencia bancaria', icon: '🏦', instructions: 'BCP - Cuenta: 123-456-789 / Interbancario: 12345678901234567890' },
        'efectivo': { name: 'Pago contra entrega', icon: '💵', instructions: 'Paga en efectivo al momento de recibir tu pedido' }
    };
    return details[method] || { name: method, icon: '💳', instructions: '' };
}

// ============ VENTANAS DE ENTREGA ============
function getDeliveryWindows() {
    const settings = getSettings();
    return settings.deliveryWindows || ['10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00', '18:00-20:00'];
}

function saveDeliveryWindows(windows) {
    const settings = getSettings();
    settings.deliveryWindows = windows;
    saveSettings(settings);
}

function scheduleDelivery(orderId, deliveryWindow, deliveryDate) {
    let orders = getOrders();
    orders = orders.map(o => {
        if (o.id === orderId) {
            return {
                ...o,
                deliveryWindow,
                deliveryDate: deliveryDate,
                status: 'programado',
                scheduledNotification: false
            };
        }
        return o;
    });
    saveOrders(orders);
}

function checkDeliveryReminders() {
    const orders = getOrders();
    const now = new Date();
    
    orders.forEach(order => {
        if (order.status === 'programado' && order.deliveryDate && !order.scheduledNotification) {
            const deliveryTime = new Date(order.deliveryDate);
            const timeDiff = deliveryTime - now;
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            
            // Notificar 1 hora antes
            if (hoursDiff <= 1 && hoursDiff > 0 && !order.notified1Hour) {
                notifyCustomerDeliveryReminder(order.customerPhone, order.orderNumber, order.deliveryWindow);
                markOrderNotified(order.id, 'notified1Hour');
            }
            // Notificar 30 minutos antes
            if (hoursDiff <= 0.5 && hoursDiff > 0 && !order.notified30Min) {
                notifyCustomerDeliveryReminder(order.customerPhone, order.orderNumber, order.deliveryWindow, true);
                markOrderNotified(order.id, 'notified30Min');
                markOrderNotified(order.id, 'scheduledNotification', true);
            }
        }
    });
}

function markOrderNotified(orderId, field, value = true) {
    let orders = getOrders();
    orders = orders.map(o => o.id === orderId ? { ...o, [field]: value } : o);
    saveOrders(orders);
}

function notifyCustomerDeliveryReminder(phone, orderNumber, window, isUrgent = false) {
    const notifications = JSON.parse(localStorage.getItem('kiosco_customer_notifications') || '{}');
    if (!notifications[phone]) notifications[phone] = [];
    notifications[phone].unshift({
        id: Date.now(),
        orderNumber: orderNumber,
        status: 'recordatorio',
        message: isUrgent 
            ? `⏰ ¡Tu pedido #${orderNumber} llegará en 30 minutos! Ventana: ${window}`
            : `⏰ Recordatorio: Tu pedido #${orderNumber} está programado para la ventana ${window}. ¡Prepárate!`,
        read: false,
        date: new Date().toISOString()
    });
    localStorage.setItem('kiosco_customer_notifications', JSON.stringify(notifications));
}

// ============ PRODUCTOS ============
function getProducts() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)) || {};
}

function saveProducts(products) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    window.dispatchEvent(new Event('productsUpdated'));
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
        paymentConfirmed: order.paymentMethod === 'efectivo',
        history: [{ status: 'pendiente', date: new Date().toISOString(), note: 'Pedido creado' }]
    };
    orders.unshift(newOrder);
    saveOrders(orders);
    addActivityLog('Nuevo pedido', `Pedido #${newOrder.orderNumber} creado`, 'order');
    
    // Generar factura si el método de pago requiere facturación
    if (order.generateInvoice) {
        generateInvoice(newOrder);
    }
    
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
    
    if (updatedOrder && updatedOrder.customerPhone) {
        notifyCustomerStatusChange(updatedOrder.customerPhone, updatedOrder.orderNumber, newStatus);
    }
    
    addActivityLog('Estado actualizado', `Pedido #${orderId} cambió a ${newStatus}`, 'order');
    return updatedOrder;
}

function deleteOrder(orderId) {
    let orders = getOrders();
    orders = orders.filter(o => o.id !== orderId);
    saveOrders(orders);
    addActivityLog('Pedido eliminado', `Pedido #${orderId} fue eliminado`, 'order');
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
        notifications[phone] = notifications[phone].map(n => n.id === notificationId ? { ...n, read: true } : n);
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

// Inicializar y verificar recordatorios cada minuto
initDB();
setInterval(checkDeliveryReminders, 60000);