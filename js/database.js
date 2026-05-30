// ========== SISTEMA CENTRAL DE DATOS ==========
// Única fuente de verdad para toda la aplicación

// Constantes exportables
export const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PREPARING: 'preparing',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
};

export const STATUS_TEXT = {
    pending: '⏳ Pendiente',
    confirmed: '✅ Confirmado',
    preparing: '🍳 Preparando',
    delivered: '🚚 Entregado',
    cancelled: '❌ Cancelado'
};

export const db = {
    // Datos principales
    products: [],
    categories: [],
    orders: [],
    customers: [],
    auditLog: [],
    
    // Configuración del negocio
    settings: {
        storeName: "Kiosco",
        storeLogo: "",
        currency: "S/",
        taxRate: 18,
        shippingCost: 3.50,
        freeShippingMin: 20,
        primaryColor: "#667eea",
        whatsappNumber: "51914491874"
    },
    
    // Estadísticas calculadas
    stats: {
        totalSales: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        totalOrders: 0,
        pendingOrders: 0,
        lowStockCount: 0
    }
};

// Datos iniciales de ejemplo
const initialData = {
    categories: ["Bebidas", "Snacks", "Dulces", "Postres", "Jugos", "Comidas Rápidas"],
    
    products: [
        { id: 1, name: "Coca Cola 500ml", price: 3.50, stock: 20, category: "Bebidas", image: "assets/images/1.png", sales: 45 },
        { id: 2, name: "Sprite 500ml", price: 3.00, stock: 10, category: "Bebidas", image: "assets/images/2.png", sales: 30 },
        { id: 3, name: "Fanta 500ml", price: 3.00, stock: 5, category: "Bebidas", image: "assets/images/3.png", sales: 25 },
        { id: 4, name: "Papas Lays", price: 4.50, stock: 15, category: "Snacks", image: "", sales: 12 },
        { id: 5, name: "Chocolate Triple", price: 2.50, stock: 30, category: "Dulces", image: "", sales: 8 }
    ],
    
    customers: [
        { 
            phone: "914491874", 
            name: "Jhonn Pether", 
            address: "Av. Principal 123", 
            totalSpent: 0, 
            orders: [], 
            registeredAt: new Date().toISOString() 
        },
        { 
            phone: "912345678", 
            name: "Cliente Prueba", 
            address: "Calle Prueba 456", 
            totalSpent: 0, 
            orders: [], 
            registeredAt: new Date().toISOString() 
        }
    ],
    
    orders: [],
    
    auditLog: []
};

// ========== PERSISTENCIA EN LOCALSTORAGE ==========
export function saveData() {
    try {
        localStorage.setItem("kioscoDB", JSON.stringify(db));
    } catch (error) {
        console.error('Error guardando datos:', error);
    }
}

export function loadData() {
    try {
        const data = localStorage.getItem("kioscoDB");
        if (data) {
            const parsed = JSON.parse(data);
            db.products = parsed.products || [];
            db.categories = parsed.categories || [];
            db.orders = parsed.orders || [];
            db.customers = parsed.customers || [];
            db.auditLog = parsed.auditLog || [];
            db.settings = { ...db.settings, ...(parsed.settings || {}) };
        } else {
            // Inicializar con datos de ejemplo
            db.categories = [...initialData.categories];
            db.products = [...initialData.products];
            db.customers = [...initialData.customers];
            db.orders = [];
            db.auditLog = [];
            saveData();
        }
        updateStats();
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

// ========== AUDITORÍA ==========
export function addAuditLog(action, details) {
    try {
        const log = {
            id: Date.now(),
            action,
            details,
            admin: sessionStorage.getItem('adminPhone') || 'system',
            date: new Date().toISOString()
        };
        db.auditLog.unshift(log);
        
        // Limitar a 500 logs para no sobrecargar localStorage
        if (db.auditLog.length > 500) {
            db.auditLog = db.auditLog.slice(0, 500);
        }
        
        saveData();
        return log;
    } catch (error) {
        console.error('Error agregando log de auditoría:', error);
        return null;
    }
}

export function getAuditLogs() {
    return [...db.auditLog];
}

export function clearAuditLogs() {
    db.auditLog = [];
    saveData();
    addAuditLog('clear_audit', 'Limpió registro de auditoría');
}

// ========== ESTADÍSTICAS ==========
export function updateStats() {
    try {
        const deliveredOrders = db.orders.filter(o => o.status === ORDER_STATUS.DELIVERED);
        const pendingOrders = db.orders.filter(o => o.status === ORDER_STATUS.PENDING);
        const lowStockProducts = db.products.filter(p => p.stock <= 5);
        
        db.stats.totalOrders = db.orders.length;
        db.stats.totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
        db.stats.totalCustomers = db.customers.length;
        db.stats.totalSales = deliveredOrders.reduce((sum, o) => {
            return sum + o.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
        }, 0);
        db.stats.pendingOrders = pendingOrders.length;
        db.stats.lowStockCount = lowStockProducts.length;
        
        saveData();
    } catch (error) {
        console.error('Error actualizando estadísticas:', error);
    }
}

export function getStats() {
    updateStats();
    return { ...db.stats };
}

export function getDashboardStats() {
    updateStats();
    return {
        totalProducts: db.products.length,
        totalOrders: db.stats.totalOrders,
        totalRevenue: db.stats.totalRevenue,
        totalCustomers: db.stats.totalCustomers,
        pendingOrders: db.stats.pendingOrders,
        lowStockCount: db.stats.lowStockCount
    };
}

// ========== CRUD PRODUCTOS ==========
export function getProducts() {
    return [...db.products];
}

export function getProductById(id) {
    return db.products.find(p => p.id === id);
}

export function addProduct(product) {
    try {
        const newId = db.products.length > 0 ? Math.max(...db.products.map(p => p.id)) + 1 : 1;
        const newProduct = { 
            ...product, 
            id: newId, 
            sales: 0,
            image: product.image || `assets/images/${newId}.png`
        };
        db.products.push(newProduct);
        addAuditLog('create_product', `Creó producto: ${newProduct.name} (S/ ${newProduct.price})`);
        saveData();
        return newProduct;
    } catch (error) {
        console.error('Error agregando producto:', error);
        return null;
    }
}

export function updateProduct(id, updatedData) {
    try {
        const index = db.products.findIndex(p => p.id === id);
        if (index !== -1) {
            const oldName = db.products[index].name;
            db.products[index] = { ...db.products[index], ...updatedData };
            addAuditLog('update_product', `Actualizó producto: ${oldName} → ${db.products[index].name}`);
            saveData();
            return db.products[index];
        }
        return null;
    } catch (error) {
        console.error('Error actualizando producto:', error);
        return null;
    }
}

export function deleteProduct(id) {
    try {
        const index = db.products.findIndex(p => p.id === id);
        if (index !== -1) {
            const name = db.products[index].name;
            db.products.splice(index, 1);
            addAuditLog('delete_product', `Eliminó producto: ${name}`);
            saveData();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error eliminando producto:', error);
        return false;
    }
}

export function updateStock(id, quantity) {
    try {
        const product = getProductById(id);
        if (product && product.stock >= quantity) {
            product.stock -= quantity;
            product.sales = (product.sales || 0) + quantity;
            saveData();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error actualizando stock:', error);
        return false;
    }
}

export function getLowStockProducts(threshold = 5) {
    return db.products.filter(p => p.stock <= threshold);
}

export function getTopProducts(limit = 5) {
    return [...db.products].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, limit);
}

// ========== CRUD CATEGORÍAS ==========
export function getCategories() {
    return [...db.categories];
}

export function addCategory(name) {
    try {
        if (!name || db.categories.includes(name)) {
            return false;
        }
        db.categories.push(name);
        addAuditLog('create_category', `Creó categoría: ${name}`);
        saveData();
        return true;
    } catch (error) {
        console.error('Error agregando categoría:', error);
        return false;
    }
}

export function updateCategory(oldName, newName) {
    try {
        const index = db.categories.findIndex(c => c === oldName);
        if (index !== -1 && !db.categories.includes(newName)) {
            db.categories[index] = newName;
            // Actualizar productos que usan esta categoría
            db.products.forEach(p => {
                if (p.category === oldName) p.category = newName;
            });
            addAuditLog('update_category', `Actualizó categoría: ${oldName} → ${newName}`);
            saveData();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error actualizando categoría:', error);
        return false;
    }
}

export function deleteCategory(name) {
    try {
        const productsInCategory = db.products.filter(p => p.category === name);
        if (productsInCategory.length > 0) return false;
        
        const index = db.categories.findIndex(c => c === name);
        if (index !== -1) {
            db.categories.splice(index, 1);
            addAuditLog('delete_category', `Eliminó categoría: ${name}`);
            saveData();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error eliminando categoría:', error);
        return false;
    }
}

// ========== CRUD PEDIDOS ==========
export function getOrders() {
    return [...db.orders].sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getOrderById(id) {
    return db.orders.find(o => o.id === id);
}

export function getOrdersByStatus(status) {
    return db.orders.filter(o => o.status === status);
}

export function addOrder(orderData) {
    try {
        // Validar stock antes de crear el pedido
        for (const item of orderData.items) {
            const product = getProductById(item.id);
            if (!product || product.stock < item.quantity) {
                addAuditLog('order_failed', `Pedido fallido: stock insuficiente de ${item.name}`);
                return null;
            }
        }
        
        const newId = db.orders.length > 0 ? Math.max(...db.orders.map(o => o.id)) + 1 : 1000;
        const newOrder = {
            id: newId,
            ...orderData,
            date: new Date().toISOString(),
            status: ORDER_STATUS.PENDING
        };
        
        // Actualizar stock y ventas de productos
        newOrder.items.forEach(item => {
            const product = getProductById(item.id);
            if (product) {
                product.stock -= item.quantity;
                product.sales = (product.sales || 0) + item.quantity;
            }
        });
        
        db.orders.push(newOrder);
        
        // Actualizar o crear cliente
        updateCustomerFromOrder(newOrder);
        
        addAuditLog('create_order', `Cliente ${newOrder.name} realizó pedido #${newId} por S/ ${newOrder.total}`);
        updateStats();
        saveData();
        return newOrder;
    } catch (error) {
        console.error('Error agregando pedido:', error);
        return null;
    }
}

function updateCustomerFromOrder(order) {
    try {
        let customer = db.customers.find(c => c.phone === order.phone);
        if (customer) {
            if (!customer.orders.includes(order.id)) {
                customer.orders.push(order.id);
            }
            customer.totalSpent = (customer.totalSpent || 0) + order.total;
            customer.name = order.name;
            customer.address = order.address;
        } else {
            db.customers.push({
                phone: order.phone,
                name: order.name,
                address: order.address,
                totalSpent: order.total,
                orders: [order.id],
                registeredAt: new Date().toISOString()
            });
        }
        saveData();
    } catch (error) {
        console.error('Error actualizando cliente desde pedido:', error);
    }
}

export function updateOrderStatus(id, status) {
    try {
        const order = getOrderById(id);
        if (!order) return false;
        
        const oldStatus = order.status;
        
        // Si se cancela, revertir stock
        if (status === ORDER_STATUS.CANCELLED && oldStatus !== ORDER_STATUS.CANCELLED) {
            order.items.forEach(item => {
                const product = getProductById(item.id);
                if (product) {
                    product.stock += item.quantity;
                    product.sales = Math.max(0, (product.sales || 0) - item.quantity);
                }
            });
            
            // Actualizar estadísticas del cliente
            const customer = db.customers.find(c => c.phone === order.phone);
            if (customer) {
                customer.totalSpent = Math.max(0, (customer.totalSpent || 0) - order.total);
            }
        }
        
        order.status = status;
        
        addAuditLog('update_order', `Actualizó pedido #${id}: ${oldStatus} → ${status}`);
        updateStats();
        saveData();
        return true;
    } catch (error) {
        console.error('Error actualizando estado del pedido:', error);
        return false;
    }
}

export function getOrdersByPhone(phone) {
    return db.orders.filter(o => o.phone === phone).sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ========== CRUD CLIENTES ==========
export function getCustomers() {
    return [...db.customers].sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
}

export function getCustomerByPhone(phone) {
    return db.customers.find(c => c.phone === phone);
}

export function addCustomer(customerData) {
    try {
        if (db.customers.find(c => c.phone === customerData.phone)) {
            return false;
        }
        const newCustomer = {
            ...customerData,
            totalSpent: 0,
            orders: [],
            registeredAt: new Date().toISOString()
        };
        db.customers.push(newCustomer);
        addAuditLog('create_customer', `Registró cliente: ${newCustomer.name} (${newCustomer.phone})`);
        saveData();
        return newCustomer;
    } catch (error) {
        console.error('Error agregando cliente:', error);
        return null;
    }
}

export function updateCustomerStats(phone) {
    try {
        const customer = getCustomerByPhone(phone);
        if (customer) {
            const customerOrders = db.orders.filter(o => o.phone === phone && o.status === ORDER_STATUS.DELIVERED);
            customer.totalSpent = customerOrders.reduce((sum, o) => sum + o.total, 0);
            customer.orders = customerOrders.map(o => o.id);
            saveData();
        }
    } catch (error) {
        console.error('Error actualizando estadísticas del cliente:', error);
    }
}

export function getCustomerOrders(phone) {
    const customer = getCustomerByPhone(phone);
    if (customer) {
        return db.orders.filter(o => customer.orders.includes(o.id)).sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    return [];
}

// ========== REPORTES Y VENTAS ==========
export function getDailySales(days = 7) {
    try {
        const result = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dailyTotal = db.orders
                .filter(o => o.status === ORDER_STATUS.DELIVERED && o.date.split('T')[0] === dateStr)
                .reduce((sum, o) => sum + o.total, 0);
            result.push({ date: dateStr, total: dailyTotal });
        }
        return result;
    } catch (error) {
        console.error('Error obteniendo ventas diarias:', error);
        return [];
    }
}

export function getMonthlySales() {
    try {
        const monthly = {};
        db.orders.filter(o => o.status === ORDER_STATUS.DELIVERED).forEach(order => {
            const month = new Date(order.date).toLocaleString('es', { month: 'short', year: 'numeric' });
            monthly[month] = (monthly[month] || 0) + order.total;
        });
        return monthly;
    } catch (error) {
        console.error('Error obteniendo ventas mensuales:', error);
        return {};
    }
}

export function getTopSellingProducts(limit = 10) {
    return getTopProducts(limit);
}

export function getTotalRevenue() {
    return db.orders.filter(o => o.status === ORDER_STATUS.DELIVERED).reduce((sum, o) => sum + o.total, 0);
}

// ========== CONFIGURACIÓN ==========
export function getSettings() {
    return { ...db.settings };
}

export function updateSettings(settings) {
    try {
        db.settings = { ...db.settings, ...settings };
        addAuditLog('update_settings', 'Actualizó configuración del sistema');
        saveData();
        return db.settings;
    } catch (error) {
        console.error('Error actualizando configuración:', error);
        return null;
    }
}

// ========== BÚSQUEDA ==========
export function searchProducts(term) {
    try {
        const searchTerm = term.toLowerCase();
        return db.products.filter(p => 
            p.name.toLowerCase().includes(searchTerm) || 
            p.category.toLowerCase().includes(searchTerm)
        );
    } catch (error) {
        console.error('Error buscando productos:', error);
        return [];
    }
}

// ========== INICIALIZACIÓN ==========
export function initDB() {
    loadData();
}

// Inicializar automáticamente
initDB();
