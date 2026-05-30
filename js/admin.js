// ========== IMPORTS ==========
import { 
    initDB, getProducts, addProduct, updateProduct, deleteProduct,
    getCategories, addCategory, updateCategory, deleteCategory,
    getOrders, updateOrderStatus, getOrdersByPhone,
    getCustomers, getCustomerOrders,
    getDailySales, getMonthlySales, getTopSellingProducts,
    getSettings, updateSettings,
    getAuditLogs, clearAuditLogs, addAuditLog,
    getStats, getLowStockProducts
} from './database.js';

// Inicializar
initDB();

// ========== VARIABLES GLOBALES ==========
let weeklySalesChart = null;
let topProductsChart = null;
let currentProductId = null;
let currentOrderId = null;
let currentDeleteCallback = null;
let isLoading = {
    products: false,
    categories: false,
    orders: false,
    customers: false,
    audit: false
};

// ========== ELEMENTOS DOM ==========
const sections = {
    dashboard: document.getElementById('dashboardSection'),
    products: document.getElementById('productsSection'),
    categories: document.getElementById('categoriesSection'),
    orders: document.getElementById('ordersSection'),
    customers: document.getElementById('customersSection'),
    reports: document.getElementById('reportsSection'),
    audit: document.getElementById('auditSection'),
    settings: document.getElementById('settingsSection')
};

const breadcrumb = document.querySelector('.breadcrumbs');

// ========== VERIFICAR LOGIN ==========
if (!sessionStorage.getItem('adminLogged')) {
    window.location.href = 'login-admin.html';
}

// ========== TOAST ==========
function showToast(message, isError = false) {
    const toast = document.getElementById('toastNotification');
    if (!toast) return;
    toast.textContent = message;
    toast.style.background = isError ? 'rgba(231,76,60,0.9)' : 'rgba(39,174,96,0.9)';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ========== CONFIRMACIÓN MODAL ==========
function showConfirm(title, message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmTitle');
    const messageEl = document.getElementById('confirmMessage');
    const confirmBtn = document.getElementById('confirmOkBtn');
    
    if (!modal) return;
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    modal.style.display = 'flex';
    modal.classList.add('active');
    
    const handleConfirm = () => {
        modal.style.display = 'none';
        modal.classList.remove('active');
        confirmBtn.removeEventListener('click', handleConfirm);
        closeBtn.removeEventListener('click', handleClose);
        if (onConfirm) onConfirm();
    };
    
    const handleClose = () => {
        modal.style.display = 'none';
        modal.classList.remove('active');
        confirmBtn.removeEventListener('click', handleConfirm);
        closeBtn.removeEventListener('click', handleClose);
    };
    
    const closeBtn = modal.querySelector('.close-confirm');
    confirmBtn.addEventListener('click', handleConfirm);
    closeBtn.addEventListener('click', handleClose);
}

// ========== EXPORTAR A CSV ==========
function exportToCSV(data, filename, headers) {
    if (!data || data.length === 0) {
        showToast('No hay datos para exportar', true);
        return;
    }
    
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(row => {
        const values = headers.map(header => {
            let value = row[header] !== undefined ? row[header] : '';
            if (typeof value === 'string' && value.includes(',')) {
                value = `"${value}"`;
            }
            return value;
        });
        csvContent += values.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast(`✅ ${filename} exportado correctamente`);
}

// ========== EXPORTAR PRODUCTOS ==========
document.getElementById('exportProductsBtn')?.addEventListener('click', () => {
    const products = getProducts();
    const headers = ['id', 'name', 'price', 'stock', 'category', 'sales'];
    exportToCSV(products, 'productos', headers);
});

// ========== EXPORTAR PEDIDOS ==========
document.getElementById('exportOrdersBtn')?.addEventListener('click', () => {
    const orders = getOrders();
    const headers = ['id', 'name', 'phone', 'address', 'total', 'status', 'date'];
    exportToCSV(orders, 'pedidos', headers);
});

// ========== EXPORTAR CLIENTES ==========
document.getElementById('exportCustomersBtn')?.addEventListener('click', () => {
    const customers = getCustomers();
    const headers = ['name', 'phone', 'address', 'totalSpent', 'ordersCount'];
    exportToCSV(customers, 'clientes', headers);
});

// ========== EXPORTAR DATOS GENERALES ==========
document.getElementById('exportDataBtn')?.addEventListener('click', () => {
    const allData = {
        products: getProducts(),
        orders: getOrders(),
        customers: getCustomers(),
        categories: getCategories(),
        settings: getSettings()
    };
    const dataStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `kiosco_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('✅ Datos exportados correctamente');
});

// ========== ACTUALIZAR ESTADÍSTICAS ==========
function updateStats() {
    try {
        const stats = getStats();
        const products = getProducts();
        const lowStock = getLowStockProducts();
        
        document.getElementById('totalProducts').textContent = products.length;
        document.getElementById('totalOrders').textContent = stats.totalOrders;
        document.getElementById('totalRevenue').textContent = `S/ ${stats.totalRevenue.toFixed(2)}`;
        document.getElementById('totalCustomers').textContent = stats.totalCustomers;
        
        // Alerta de stock bajo
        if (lowStock.length > 0) {
            const lowStockNames = lowStock.map(p => p.name).join(', ');
            showToast(`⚠️ Stock bajo: ${lowStockNames}`, true);
        }
    } catch (error) {
        console.error('Error actualizando estadísticas:', error);
        showToast('Error al cargar estadísticas', true);
    }
}

// ========== ACTUALIZAR BREADCRUMB ==========
function updateBreadcrumb(sectionName) {
    if (!breadcrumb) return;
    const sectionTitles = {
        dashboard: '📊 Dashboard',
        products: '📦 Productos',
        categories: '📂 Categorías',
        orders: '📋 Pedidos',
        customers: '👥 Clientes',
        reports: '📈 Reportes',
        audit: '🔍 Auditoría',
        settings: '⚙️ Configuración'
    };
    breadcrumb.innerHTML = `<span class="breadcrumb-item active">${sectionTitles[sectionName] || sectionName}</span>`;
}

// ========== MODO OSCURO ==========
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
    localStorage.setItem('adminTheme', theme);
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const isDark = body.classList.contains('dark-mode');
        setTheme(isDark ? 'light' : 'dark');
    });
}

const savedTheme = localStorage.getItem('adminTheme');
if (savedTheme === 'dark') setTheme('dark');

// ========== PANTALLA COMPLETA ==========
document.getElementById('fullscreenBtn')?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});

// ========== LOGOUT ==========
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    showConfirm('Cerrar sesión', '¿Estás seguro de que deseas cerrar sesión?', () => {
        sessionStorage.removeItem('adminLogged');
        sessionStorage.removeItem('adminPhone');
        sessionStorage.removeItem('adminLoginTime');
        window.location.href = 'login-admin.html';
    });
});

// ========== NAVEGACIÓN ==========
document.querySelectorAll('.menu-item').forEach(btn => {
    btn.addEventListener('click', () => {
        const section = btn.dataset.section;
        document.querySelectorAll('.menu-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        Object.values(sections).forEach(s => s?.classList.remove('active'));
        if (sections[section]) sections[section].classList.add('active');
        
        updateBreadcrumb(section);
        
        // Cargar datos según sección
        if (section === 'dashboard') updateCharts();
        if (section === 'products') renderProducts();
        if (section === 'categories') renderCategories();
        if (section === 'orders') renderOrders();
        if (section === 'customers') renderCustomers();
        if (section === 'audit') renderAudit();
        if (section === 'settings') loadSettings();
    });
});

// ========== DASHBOARD CHARTS ==========
function updateCharts() {
    try {
        const dailySales = getDailySales(7);
        const topProducts = getTopSellingProducts(5);
        
        const ctx1 = document.getElementById('weeklySalesChart')?.getContext('2d');
        if (ctx1) {
            if (weeklySalesChart) weeklySalesChart.destroy();
            weeklySalesChart = new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: dailySales.map(d => d.date),
                    datasets: [{
                        label: 'Ventas (S/)',
                        data: dailySales.map(d => d.total),
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102,126,234,0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: true }
            });
        }
        
        const ctx2 = document.getElementById('topProductsChart')?.getContext('2d');
        if (ctx2) {
            if (topProductsChart) topProductsChart.destroy();
            topProductsChart = new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: topProducts.map(p => p.name),
                    datasets: [{
                        label: 'Unidades Vendidas',
                        data: topProducts.map(p => p.sales || 0),
                        backgroundColor: '#764ba2',
                        borderRadius: 8
                    }]
                },
                options: { responsive: true, maintainAspectRatio: true }
            });
        }
    } catch (error) {
        console.error('Error actualizando gráficos:', error);
    }
}

// ========== CRUD PRODUCTOS ==========
function renderProducts() {
    if (isLoading.products) return;
    isLoading.products = true;
    
    try {
        let products = getProducts();
        const searchTerm = document.getElementById('searchProduct')?.value.toLowerCase() || '';
        const filterCat = document.getElementById('filterCategory')?.value || 'all';
        
        if (searchTerm) products = products.filter(p => p.name.toLowerCase().includes(searchTerm));
        if (filterCat !== 'all') products = products.filter(p => p.category === filterCat);
        
        const tbody = document.getElementById('productsTableBody');
        if (!tbody) return;
        
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No hay productos registrados</td></tr>';
            return;
        }
        
        tbody.innerHTML = products.map(p => `
            <tr data-id="${p.id}">
                <td>${p.id}</td>
                <td class="product-image-cell">${p.image ? `<img src="${p.image}" alt="${p.name}" loading="lazy">` : '📦'}</td>
                <td>${escapeHtml(p.name)}</td>
                <td>S/ ${p.price.toFixed(2)}</td>
                <td class="${p.stock < 5 ? 'low-stock' : ''}">${p.stock}</td>
                <td>${escapeHtml(p.category)}</td>
                <td>${p.sales || 0}</td>
                <td>
                    <button class="btn-edit" onclick="window.editProduct(${p.id})" aria-label="Editar">✏️</button>
                    <button class="btn-danger" onclick="window.deleteProductHandler(${p.id})" aria-label="Eliminar">🗑️</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error renderizando productos:', error);
        showToast('Error al cargar productos', true);
    } finally {
        isLoading.products = false;
    }
}

window.editProduct = function(id) {
    try {
        const product = getProducts().find(p => p.id === id);
        if (product) {
            currentProductId = product.id;
            document.getElementById('modalTitle').textContent = 'Editar Producto';
            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productStock').value = product.stock;
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productImage').value = product.image || '';
            const modal = document.getElementById('productModal');
            if (modal) {
                modal.style.display = 'flex';
                modal.classList.add('active');
            }
        }
    } catch (error) {
        console.error('Error editando producto:', error);
        showToast('Error al cargar producto', true);
    }
};

window.deleteProductHandler = function(id) {
    const product = getProducts().find(p => p.id === id);
    if (!product) return;
    
    showConfirm('Eliminar Producto', `¿Estás seguro de eliminar "${product.name}"?`, () => {
        try {
            deleteProduct(id);
            renderProducts();
            updateStats();
            updateCharts();
            showToast('✅ Producto eliminado');
        } catch (error) {
            console.error('Error eliminando producto:', error);
            showToast('Error al eliminar producto', true);
        }
    });
};

function loadCategorySelect() {
    try {
        const categories = getCategories();
        const select = document.getElementById('productCategory');
        if (select) {
            select.innerHTML = categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
        }
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

document.getElementById('addProductBtn')?.addEventListener('click', () => {
    currentProductId = null;
    document.getElementById('modalTitle').textContent = 'Agregar Producto';
    const form = document.getElementById('productForm');
    if (form) form.reset();
    document.getElementById('productId').value = '';
    loadCategorySelect();
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
});

document.getElementById('productForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    try {
        const productData = {
            name: document.getElementById('productName').value.trim(),
            price: parseFloat(document.getElementById('productPrice').value),
            stock: parseInt(document.getElementById('productStock').value),
            category: document.getElementById('productCategory').value,
            image: document.getElementById('productImage').value.trim()
        };
        
        if (!productData.name || isNaN(productData.price) || isNaN(productData.stock)) {
            showToast('⚠️ Completa todos los campos', true);
            return;
        }
        
        if (currentProductId) {
            updateProduct(currentProductId, productData);
            showToast('✅ Producto actualizado');
        } else {
            addProduct(productData);
            showToast('✅ Producto agregado');
        }
        
        const modal = document.getElementById('productModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
        renderProducts();
        updateStats();
        updateCharts();
    } catch (error) {
        console.error('Error guardando producto:', error);
        showToast('Error al guardar producto', true);
    }
});

document.getElementById('searchProduct')?.addEventListener('input', () => renderProducts());
document.getElementById('filterCategory')?.addEventListener('change', () => renderProducts());

// ========== CRUD CATEGORÍAS ==========
function renderCategories() {
    if (isLoading.categories) return;
    isLoading.categories = true;
    
    try {
        const categories = getCategories();
        const container = document.getElementById('categoriesList');
        if (!container) return;
        
        if (categories.length === 0) {
            container.innerHTML = '<div class="category-card">No hay categorías</div>';
            return;
        }
        
        container.innerHTML = categories.map(cat => `
            <div class="category-card">
                <span>📂 ${escapeHtml(cat)}</span>
                <div>
                    <button class="btn-edit" onclick="window.editCategory('${escapeHtml(cat)}')" aria-label="Editar">✏️</button>
                    <button class="btn-danger" onclick="window.deleteCategoryHandler('${escapeHtml(cat)}')" aria-label="Eliminar">🗑️</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error renderizando categorías:', error);
        showToast('Error al cargar categorías', true);
    } finally {
        isLoading.categories = false;
    }
}

window.editCategory = function(oldName) {
    const newName = prompt('Editar categoría:', oldName);
    if (newName && newName !== oldName) {
        try {
            if (updateCategory(oldName, newName)) {
                renderCategories();
                renderProducts();
                loadCategorySelect();
                updateCategoryFilter();
                showToast('✅ Categoría actualizada');
            } else {
                showToast('❌ No se pudo actualizar', true);
            }
        } catch (error) {
            console.error('Error editando categoría:', error);
            showToast('Error al editar categoría', true);
        }
    }
};

window.deleteCategoryHandler = function(cat) {
    showConfirm('Eliminar Categoría', `¿Eliminar categoría "${cat}"?`, () => {
        try {
            if (deleteCategory(cat)) {
                renderCategories();
                renderProducts();
                loadCategorySelect();
                updateCategoryFilter();
                showToast('✅ Categoría eliminada');
            } else {
                showToast('❌ No se puede eliminar: tiene productos', true);
            }
        } catch (error) {
            console.error('Error eliminando categoría:', error);
            showToast('Error al eliminar categoría', true);
        }
    });
};

function updateCategoryFilter() {
    try {
        const filterCat = document.getElementById('filterCategory');
        if (filterCat) {
            const categories = getCategories();
            filterCat.innerHTML = '<option value="all">Todas las categorías</option>' + 
                categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
        }
    } catch (error) {
        console.error('Error actualizando filtro:', error);
    }
}

document.getElementById('addCategoryBtn')?.addEventListener('click', () => {
    const modal = document.getElementById('categoryModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
});

document.getElementById('categoryForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    try {
        const name = document.getElementById('categoryName').value.trim();
        if (name && addCategory(name)) {
            renderCategories();
            renderProducts();
            loadCategorySelect();
            updateCategoryFilter();
            showToast('✅ Categoría agregada');
            const modal = document.getElementById('categoryModal');
            if (modal) {
                modal.style.display = 'none';
                modal.classList.remove('active');
            }
            document.getElementById('categoryForm').reset();
        } else {
            showToast('❌ La categoría ya existe o es inválida', true);
        }
    } catch (error) {
        console.error('Error agregando categoría:', error);
        showToast('Error al agregar categoría', true);
    }
});

// ========== CRUD PEDIDOS ==========
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

function renderOrders() {
    if (isLoading.orders) return;
    isLoading.orders = true;
    
    try {
        let orders = getOrders();
        const statusFilter = document.getElementById('orderStatusFilter')?.value || 'all';
        if (statusFilter !== 'all') orders = orders.filter(o => o.status === statusFilter);
        
        const container = document.getElementById('ordersList');
        if (!container) return;
        
        if (orders.length === 0) {
            container.innerHTML = '<div class="order-card">No hay pedidos registrados</div>';
            return;
        }
        
        container.innerHTML = orders.map(order => `
            <div class="order-card" onclick="window.openOrderModal(${order.id})">
                <div class="order-header">
                    <strong>📄 Pedido #${order.id}</strong>
                    <span class="order-status status-${order.status}">${getStatusText(order.status)}</span>
                </div>
                <div><strong>Cliente:</strong> ${escapeHtml(order.name)}</div>
                <div><strong>Teléfono:</strong> ${order.phone}</div>
                <div><strong>Dirección:</strong> ${escapeHtml(order.address)}</div>
                <div><strong>Productos:</strong> ${order.items.map(i => `${escapeHtml(i.name)} x${i.quantity}`).join(', ')}</div>
                <div><strong>Total:</strong> S/ ${order.total.toFixed(2)}</div>
                <div><strong>Fecha:</strong> ${new Date(order.date).toLocaleString()}</div>
                <div style="margin-top: 0.8rem;">
                    <button class="btn-edit" onclick="event.stopPropagation(); window.openOrderModal(${order.id})">✏️ Cambiar estado</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error renderizando pedidos:', error);
        showToast('Error al cargar pedidos', true);
    } finally {
        isLoading.orders = false;
    }
}

window.openOrderModal = function(id) {
    try {
        currentOrderId = id;
        const order = getOrders().find(o => o.id === id);
        if (order) {
            const orderDetails = document.getElementById('orderDetails');
            if (orderDetails) {
                orderDetails.innerHTML = `
                    <div style="padding: 1rem;">
                        <p><strong>Pedido #${order.id}</strong></p>
                        <p><strong>Cliente:</strong> ${escapeHtml(order.name)}</p>
                        <p><strong>Teléfono:</strong> ${order.phone}</p>
                        <p><strong>Dirección:</strong> ${escapeHtml(order.address)}</p>
                        <p><strong>Total:</strong> S/ ${order.total.toFixed(2)}</p>
                        <p><strong>Fecha:</strong> ${new Date(order.date).toLocaleString()}</p>
                        <hr>
                        <p><strong>Productos:</strong></p>
                        <ul class="order-items-list">
                            ${order.items.map(i => `<li>${escapeHtml(i.name)} x${i.quantity} - S/ ${(i.price * i.quantity).toFixed(2)}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            const statusSelect = document.getElementById('orderStatus');
            if (statusSelect) statusSelect.value = order.status;
            const modal = document.getElementById('orderModal');
            if (modal) {
                modal.style.display = 'flex';
                modal.classList.add('active');
            }
        }
    } catch (error) {
        console.error('Error abriendo modal de pedido:', error);
        showToast('Error al cargar detalles del pedido', true);
    }
};

document.getElementById('updateOrderBtn')?.addEventListener('click', () => {
    try {
        const newStatus = document.getElementById('orderStatus').value;
        if (updateOrderStatus(currentOrderId, newStatus)) {
            renderOrders();
            updateStats();
            updateCharts();
            showToast('✅ Estado del pedido actualizado');
            const modal = document.getElementById('orderModal');
            if (modal) {
                modal.style.display = 'none';
                modal.classList.remove('active');
            }
        }
    } catch (error) {
        console.error('Error actualizando pedido:', error);
        showToast('Error al actualizar estado', true);
    }
});

document.getElementById('orderStatusFilter')?.addEventListener('change', () => renderOrders());

// ========== CRUD CLIENTES ==========
function renderCustomers() {
    if (isLoading.customers) return;
    isLoading.customers = true;
    
    try {
        const customers = getCustomers();
        const searchTerm = document.getElementById('searchCustomer')?.value.toLowerCase() || '';
        const filtered = searchTerm ? customers.filter(c => 
            c.name.toLowerCase().includes(searchTerm) || c.phone.includes(searchTerm)
        ) : customers;
        
        const container = document.getElementById('customersList');
        if (!container) return;
        
        if (filtered.length === 0) {
            container.innerHTML = '<div class="customer-card">No hay clientes registrados</div>';
            return;
        }
        
        container.innerHTML = filtered.map(c => `
            <div class="customer-card">
                <div>
                    <strong>${escapeHtml(c.name)}</strong><br>
                    <small>📞 ${c.phone}</small><br>
                    <small>📍 ${escapeHtml(c.address)}</small><br>
                    <small>💰 Total gastado: S/ ${(c.totalSpent || 0).toFixed(2)}</small><br>
                    <small>📦 Pedidos: ${c.orders?.length || 0}</small>
                </div>
                <button class="btn-edit" onclick="window.viewCustomerHistory('${c.phone}')">Ver historial</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error renderizando clientes:', error);
        showToast('Error al cargar clientes', true);
    } finally {
        isLoading.customers = false;
    }
}

window.viewCustomerHistory = function(phone) {
    try {
        const orders = getOrdersByPhone(phone);
        const customer = getCustomers().find(c => c.phone === phone);
        
        const historyHtml = `
            <div style="padding: 1rem;">
                <h4>${escapeHtml(customer?.name || 'Cliente')}</h4>
                <p>📞 ${phone}</p>
                <p>📍 ${escapeHtml(customer?.address || 'No registrada')}</p>
                <hr style="margin: 1rem 0;">
                <h5>Historial de Pedidos (${orders.length})</h5>
                ${orders.map(o => `
                    <div style="padding: 0.8rem; border-bottom: 1px solid #eee;">
                        <strong>#${o.id}</strong> - ${new Date(o.date).toLocaleDateString()}<br>
                        Total: S/ ${o.total.toFixed(2)} - Estado: ${getStatusText(o.status)}<br>
                        <small>${o.items.map(i => `${escapeHtml(i.name)} x${i.quantity}`).join(', ')}</small>
                    </div>
                `).join('')}
                ${orders.length === 0 ? '<p>No tiene pedidos realizados</p>' : ''}
            </div>
        `;
        const historyContainer = document.getElementById('customerHistory');
        if (historyContainer) historyContainer.innerHTML = historyHtml;
        const modal = document.getElementById('customerModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('active');
        }
    } catch (error) {
        console.error('Error viendo historial:', error);
        showToast('Error al cargar historial', true);
    }
};

document.getElementById('searchCustomer')?.addEventListener('input', () => renderCustomers());

// ========== REPORTES ==========
document.getElementById('generateReportBtn')?.addEventListener('click', () => {
    try {
        const type = document.getElementById('reportType').value;
        const container = document.getElementById('reportContent');
        if (!container) return;
        
        if (type === 'daily') {
            const daily = getDailySales(7);
            container.innerHTML = `
                <table class="report-table">
                    <thead><tr><th>Fecha</th><th>Total Ventas</th></tr></thead>
                    <tbody>${daily.map(d => `<tr><td>${d.date}</td><td>S/ ${d.total.toFixed(2)}</td></tr>`).join('')}</tbody>
                </table>
                <p style="margin-top: 1rem; font-weight: bold;">Total 7 días: S/ ${daily.reduce((s, d) => s + d.total, 0).toFixed(2)}</p>
            `;
        } else if (type === 'monthly') {
            const monthly = getMonthlySales();
            const total = Object.values(monthly).reduce((s, t) => s + t, 0);
            container.innerHTML = `
                <table class="report-table">
                    <thead><tr><th>Mes</th><th>Total Ventas</th></tr></thead>
                    <tbody>${Object.entries(monthly).map(([m, t]) => `<tr><td>${m}</td><td>S/ ${t.toFixed(2)}</td></tr>`).join('')}</tbody>
                </table>
                <p style="margin-top: 1rem; font-weight: bold;">Total general: S/ ${total.toFixed(2)}</p>
            `;
        } else if (type === 'top') {
            const top = getTopSellingProducts(10);
            container.innerHTML = `
                <table class="report-table">
                    <thead><tr><th>Producto</th><th>Categoría</th><th>Unidades Vendidas</th><th>Ingresos</th></tr></thead>
                    <tbody>${top.map(p => `<tr><td>${escapeHtml(p.name)}</td><td>${escapeHtml(p.category)}</td><td>${p.sales || 0}</td><td>S/ ${((p.sales || 0) * p.price).toFixed(2)}</td></tr>`).join('')}</tbody>
                </table>
            `;
        }
    } catch (error) {
        console.error('Error generando reporte:', error);
        showToast('Error al generar reporte', true);
    }
});

// ========== AUDITORÍA ==========
function renderAudit() {
    if (isLoading.audit) return;
    isLoading.audit = true;
    
    try {
        const logs = getAuditLogs();
        const container = document.getElementById('auditList');
        if (!container) return;
        
        if (logs.length === 0) {
            container.innerHTML = '<div class="audit-item">No hay registros de auditoría</div>';
            return;
        }
        
        container.innerHTML = logs.slice(0, 50).map(log => `
            <div class="audit-item">
                <div>
                    <strong>${escapeHtml(log.action)}</strong><br>
                    <small>${escapeHtml(log.details)}</small>
                </div>
                <small>${new Date(log.date).toLocaleString()}</small>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error renderizando auditoría:', error);
        showToast('Error al cargar auditoría', true);
    } finally {
        isLoading.audit = false;
    }
}

document.getElementById('clearAuditBtn')?.addEventListener('click', () => {
    showConfirm('Limpiar Auditoría', '¿Limpiar todo el registro de auditoría?', () => {
        try {
            clearAuditLogs();
            renderAudit();
            showToast('✅ Registro limpiado');
        } catch (error) {
            console.error('Error limpiando auditoría:', error);
            showToast('Error al limpiar registro', true);
        }
    });
});

// ========== CONFIGURACIÓN ==========
function loadSettings() {
    try {
        const settings = getSettings();
        document.getElementById('storeName').value = settings.storeName;
        document.getElementById('whatsappNumber').value = settings.whatsappNumber;
        document.getElementById('currency').value = settings.currency;
        document.getElementById('taxRate').value = settings.taxRate;
        document.getElementById('shippingCost').value = settings.shippingCost;
        document.getElementById('freeShippingMin').value = settings.freeShippingMin;
        document.getElementById('storeNameDisplay').textContent = settings.storeName;
    } catch (error) {
        console.error('Error cargando configuración:', error);
        showToast('Error al cargar configuración', true);
    }
}

document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
    try {
        updateSettings({
            storeName: document.getElementById('storeName').value,
            whatsappNumber: document.getElementById('whatsappNumber').value,
            currency: document.getElementById('currency').value,
            taxRate: parseFloat(document.getElementById('taxRate').value),
            shippingCost: parseFloat(document.getElementById('shippingCost').value),
            freeShippingMin: parseFloat(document.getElementById('freeShippingMin').value)
        });
        document.getElementById('storeNameDisplay').textContent = document.getElementById('storeName').value;
        showToast('✅ Configuración guardada');
    } catch (error) {
        console.error('Error guardando configuración:', error);
        showToast('Error al guardar configuración', true);
    }
});

document.getElementById('resetSettingsBtn')?.addEventListener('click', () => {
    showConfirm('Restablecer Configuración', '¿Restablecer configuración a valores predeterminados?', () => {
        try {
            const defaultSettings = {
                storeName: 'Kiosco',
                whatsappNumber: '51914491874',
                currency: 'S/',
                taxRate: 18,
                shippingCost: 3.50,
                freeShippingMin: 20
            };
            updateSettings(defaultSettings);
            loadSettings();
            showToast('✅ Configuración restablecida');
        } catch (error) {
            console.error('Error restableciendo configuración:', error);
            showToast('Error al restablecer configuración', true);
        }
    });
});

// ========== UTILIDADES ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========== CERRAR MODALES ==========
function closeAllModals() {
    const modals = ['productModal', 'categoryModal', 'orderModal', 'customerModal', 'confirmModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
    });
}

document.querySelectorAll('.close-modal, .close-product, .close-category, .close-order, .close-customer, .close-confirm').forEach(btn => {
    btn?.addEventListener('click', closeAllModals);
});

window.addEventListener('click', (e) => {
    const modals = ['productModal', 'categoryModal', 'orderModal', 'customerModal', 'confirmModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (e.target === modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
    });
});

// ========== ESCUCHAR CAMBIOS EN LOCALSTORAGE ==========
window.addEventListener('storage', (e) => {
    if (e.key === 'kioscoDB') {
        updateStats();
        if (sections.dashboard.classList.contains('active')) updateCharts();
        if (sections.products.classList.contains('active')) renderProducts();
        if (sections.categories.classList.contains('active')) renderCategories();
        if (sections.orders.classList.contains('active')) renderOrders();
        if (sections.customers.classList.contains('active')) renderCustomers();
        if (sections.audit.classList.contains('active')) renderAudit();
        showToast('📦 Datos actualizados desde otra ventana');
    }
});

// ========== INICIALIZACIÓN ==========
function init() {
    updateStats();
    renderProducts();
    renderCategories();
    renderOrders();
    renderCustomers();
    renderAudit();
    loadSettings();
    updateCharts();
    updateCategoryFilter();
    updateBreadcrumb('dashboard');
}

init();
