// Estado
let currentOrders = [];
let currentFilter = 'day';

// DOM Elements
const loginDiv = document.getElementById('adminLogin');
const dashboardDiv = document.getElementById('adminDashboard');
const loginBtn = document.getElementById('loginAdminBtn');
const adminPhone = document.getElementById('adminPhone');
const categorySelect = document.getElementById('categorySelect');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const addProductBtn = document.getElementById('addProductBtn');
const productsAdminList = document.getElementById('productsAdminList');
const categoriesAdminList = document.getElementById('categoriesAdminList');
const ordersList = document.getElementById('ordersList');
const logoutBtn = document.getElementById('logoutAdmin');
const themeToggle = document.getElementById('themeToggle');

// Modal
const confirmModal = document.getElementById('confirmModal');
let pendingAction = null;

function showConfirm(message, callback) {
    document.getElementById('confirmMessage').textContent = message;
    confirmModal.style.display = 'flex';
    pendingAction = callback;
}

if (document.getElementById('confirmYes')) {
    document.getElementById('confirmYes').onclick = () => {
        if (pendingAction) pendingAction();
        confirmModal.style.display = 'none';
        pendingAction = null;
    };
}

if (document.getElementById('confirmNo')) {
    document.getElementById('confirmNo').onclick = () => {
        confirmModal.style.display = 'none';
        pendingAction = null;
    };
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#ef4444' : '#10b981';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Login
if (loginBtn) {
    loginBtn.onclick = () => {
        const phone = adminPhone.value;
        if (isAdmin(phone)) {
            loginDiv.style.display = 'none';
            dashboardDiv.style.display = 'block';
            loadAdminData();
            showToast('✅ Bienvenido Administrador', 'success');
        } else {
            showToast('❌ Número no autorizado', 'error');
            adminPhone.style.animation = 'shake 0.3s ease';
            setTimeout(() => adminPhone.style.animation = '', 300);
        }
    };
}

if (logoutBtn) {
    logoutBtn.onclick = () => {
        dashboardDiv.style.display = 'none';
        loginDiv.style.display = 'block';
        adminPhone.value = '';
        showToast('Sesión cerrada', 'info');
    };
}

function loadAdminData() {
    loadCategoriesSelect();
    renderProductsAdmin();
    renderCategoriesAdmin();
    renderOrders(currentFilter);
    updateStats();
}

function updateStats() {
    const products = getProducts();
    const totalProducts = Object.values(products).reduce((sum, cat) => sum + cat.length, 0);
    const orders = getOrders();
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    
    const totalProductsEl = document.getElementById('totalProducts');
    const totalOrdersEl = document.getElementById('totalOrders');
    const totalRevenueEl = document.getElementById('totalRevenue');
    
    if (totalProductsEl) totalProductsEl.textContent = totalProducts;
    if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
    if (totalRevenueEl) totalRevenueEl.textContent = `S/ ${totalRevenue.toFixed(2)}`;
}

function loadCategoriesSelect() {
    const products = getProducts();
    if (!categorySelect) return;
    categorySelect.innerHTML = '';
    Object.keys(products).forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        categorySelect.appendChild(opt);
    });
}

function renderProductsAdmin() {
    const products = getProducts();
    if (!productsAdminList) return;
    productsAdminList.innerHTML = '';
    
    for (const [cat, items] of Object.entries(products)) {
        const catDiv = document.createElement('div');
        catDiv.className = 'category-section';
        catDiv.innerHTML = `<div class="category-title">📁 ${cat}</div>`;
        
        items.forEach(prod => {
            const prodDiv = document.createElement('div');
            prodDiv.className = 'product-item';
            prodDiv.innerHTML = `
                <span><strong>${prod.name}</strong> - S/ ${prod.price}</span>
                <button class="btn-danger delete-product" data-cat="${cat}" data-id="${prod.id}" data-name="${prod.name}">🗑️ Eliminar</button>
            `;
            catDiv.appendChild(prodDiv);
        });
        productsAdminList.appendChild(catDiv);
    }
    
    document.querySelectorAll('.delete-product').forEach(btn => {
        btn.onclick = () => {
            const cat = btn.dataset.cat;
            const id = parseInt(btn.dataset.id);
            const name = btn.dataset.name;
            showConfirm(`¿Eliminar "${name}"?`, () => {
                let products = getProducts();
                products[cat] = products[cat].filter(p => p.id !== id);
                if (products[cat].length === 0) delete products[cat];
                saveProducts(products);
                loadAdminData();
                showToast(`✅ "${name}" eliminado`, 'success');
            });
        };
    });
}

function renderCategoriesAdmin() {
    const products = getProducts();
    if (!categoriesAdminList) return;
    categoriesAdminList.innerHTML = '';
    
    Object.keys(products).forEach(cat => {
        const div = document.createElement('div');
        div.className = 'category-item';
        div.innerHTML = `
            <span>📂 ${cat} (${products[cat].length} productos)</span>
            <button class="btn-danger delete-category" data-cat="${cat}">🗑️ Eliminar</button>
        `;
        categoriesAdminList.appendChild(div);
    });
    
    document.querySelectorAll('.delete-category').forEach(btn => {
        btn.onclick = () => {
            const cat = btn.dataset.cat;
            showConfirm(`¿Eliminar categoría "${cat}" y sus productos?`, () => {
                let products = getProducts();
                delete products[cat];
                saveProducts(products);
                loadAdminData();
                showToast(`✅ Categoría "${cat}" eliminada`, 'success');
            });
        };
    });
}

if (addCategoryBtn) {
    addCategoryBtn.onclick = () => {
        const newCat = document.getElementById('newCategory').value.trim();
        if (newCat) {
            const products = getProducts();
            if (!products[newCat]) {
                products[newCat] = [];
                saveProducts(products);
                loadAdminData();
                document.getElementById('newCategory').value = '';
                showToast(`✅ Categoría "${newCat}" agregada`, 'success');
            } else {
                showToast('⚠️ La categoría ya existe', 'error');
            }
        } else {
            showToast('Ingresa un nombre', 'error');
        }
    };
}

if (addProductBtn) {
    addProductBtn.onclick = () => {
        const category = categorySelect.value;
        const name = document.getElementById('productName').value.trim();
        const price = parseFloat(document.getElementById('productPrice').value);
        
        if (category && name && price > 0) {
            const products = getProducts();
            products[category].push({ id: Date.now(), name, price });
            saveProducts(products);
            loadAdminData();
            document.getElementById('productName').value = '';
            document.getElementById('productPrice').value = '';
            showToast(`✅ "${name}" agregado`, 'success');
        } else {
            showToast('Completa todos los campos', 'error');
        }
    };
}

function renderOrders(filter) {
    const orders = getOrders();
    const now = new Date();
    let filtered = [];
    
    if (filter === 'day') {
        filtered = orders.filter(o => new Date(o.date).toDateString() === now.toDateString());
    } else if (filter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        filtered = orders.filter(o => new Date(o.date) >= weekAgo);
    } else {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        filtered = orders.filter(o => new Date(o.date) >= monthAgo);
    }
    
    currentOrders = filtered;
    if (!ordersList) return;
    ordersList.innerHTML = '';
    
    if (filtered.length === 0) {
        ordersList.innerHTML = '<div style="text-align:center;padding:2rem;">📭 No hay pedidos en este período</div>';
        return;
    }
    
    filtered.forEach(order => {
        const div = document.createElement('div');
        div.className = 'order-item';
        const statusClass = order.status === 'hecho' ? 'status-done' : (order.status === 'rechazado' ? 'status-rejected' : 'status-pending');
        const statusText = order.status === 'pendiente' ? '⏳ Pendiente' : (order.status === 'hecho' ? '✅ Hecho' : '❌ Rechazado');
        
        div.innerHTML = `
            <div class="order-header">
                <strong>📅 ${new Date(order.date).toLocaleString('es-PE')}</strong>
                <span class="order-status-badge ${statusClass}">${statusText}</span>
            </div>
            <div style="margin: 0.5rem 0;">
                <strong>💰 Total: S/ ${order.total.toFixed(2)}</strong>
                <select class="order-status-select" data-id="${order.id}" style="margin-left: 0.5rem; padding: 0.3rem; border-radius: 8px;">
                    <option value="pendiente" ${order.status === 'pendiente' ? 'selected' : ''}>⏳ Pendiente</option>
                    <option value="hecho" ${order.status === 'hecho' ? 'selected' : ''}>✅ Hecho</option>
                    <option value="rechazado" ${order.status === 'rechazado' ? 'selected' : ''}>❌ Rechazado</option>
                </select>
            </div>
            <div class="order-items">
                ${order.items.map(i => `• ${i.name} x${i.quantity} = S/ ${(i.price*i.quantity).toFixed(2)}`).join('<br>')}
            </div>
        `;
        ordersList.appendChild(div);
    });
    
    document.querySelectorAll('.order-status-select').forEach(select => {
        select.onchange = () => {
            const orderId = parseInt(select.dataset.id);
            updateOrderStatus(orderId, select.value);
            renderOrders(filter);
            showToast('✅ Estado actualizado', 'success');
        };
    });
}

// Filtros
const filterDay = document.getElementById('filterDay');
const filterWeek = document.getElementById('filterWeek');
const filterMonth = document.getElementById('filterMonth');

if (filterDay) {
    filterDay.onclick = () => {
        currentFilter = 'day';
        renderOrders('day');
        updateFilterButtons('day');
    };
}

if (filterWeek) {
    filterWeek.onclick = () => {
        currentFilter = 'week';
        renderOrders('week');
        updateFilterButtons('week');
    };
}

if (filterMonth) {
    filterMonth.onclick = () => {
        currentFilter = 'month';
        renderOrders('month');
        updateFilterButtons('month');
    };
}

function updateFilterButtons(active) {
    const btns = document.querySelectorAll('.filter-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    if (active === 'day' && filterDay) filterDay.classList.add('active');
    if (active === 'week' && filterWeek) filterWeek.classList.add('active');
    if (active === 'month' && filterMonth) filterMonth.classList.add('active');
}

// Descargar reporte
const downloadBtn = document.getElementById('downloadReportBtn');
if (downloadBtn) {
    downloadBtn.onclick = () => {
        if (currentOrders.length === 0) {
            showToast('No hay datos para descargar', 'error');
            return;
        }
        
        let tableHtml = `
            <html>
            <head><meta charset="UTF-8"><title>Reporte Ventas - Kiosco</title>
            <style>th{background:#4f46e5;color:white;padding:8px;}td{padding:8px;border:1px solid #ddd;}table{border-collapse:collapse;width:100%;}</style>
            </head>
            <body>
                <h2>📊 REPORTE DE VENTAS - KIOSCO</h2>
                <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-PE')}</p>
                <p><strong>Período:</strong> ${currentFilter === 'day' ? 'Hoy' : currentFilter === 'week' ? 'Esta Semana' : 'Este Mes'}</p>
                <br>
                <table border="1">
                    <thead><tr><th>#</th><th>Fecha</th><th>Productos</th><th>Total</th><th>Estado</th></tr></thead>
                    <tbody>
        `;
        
        currentOrders.forEach((order, index) => {
            const productos = order.items.map(i => `${i.name} x${i.quantity}`).join('\n');
            tableHtml += `<tr><td>${index+1}</td><td>${new Date(order.date).toLocaleString('es-PE')}</td><td>${productos}</td><td style="text-align:right">S/ ${order.total.toFixed(2)}</td><td>${order.status}</td></tr>`;
        });
        
        const totalIngresos = currentOrders.reduce((s, o) => s + o.total, 0);
        tableHtml += `
                    </tbody>
                    <tfoot><tr style="background:#f0f9ff;"><td colspan="3"><strong>TOTAL</strong></td><td style="text-align:right"><strong>S/ ${totalIngresos.toFixed(2)}</strong></td><td><strong>${currentOrders.length} pedidos</strong></td></tr></tfoot>
                </table>
                <hr><small>Reporte generado por Kiosco Admin</small>
            </body></html>
        `;
        
        const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `reporte_ventas_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.xls`;
        link.click();
        URL.revokeObjectURL(link.href);
        showToast('📥 Reporte descargado', 'success');
    };
}

// Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`${btn.dataset.tab}Tab`).classList.add('active');
    };
});

// Tema claro/oscuro para admin
if (themeToggle) {
    if (localStorage.getItem('kiosco_admin_theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('kiosco_admin_theme', isDark ? 'dark' : 'light');
        showToast(isDark ? '🌙 Modo oscuro activado' : '☀️ Modo claro activado', 'info');
    });
}

// Actualización en tiempo real
window.addEventListener('productsUpdated', () => {
    if (dashboardDiv && dashboardDiv.style.display === 'block') {
        loadAdminData();
    }
});

window.addEventListener('ordersUpdated', () => {
    if (dashboardDiv && dashboardDiv.style.display === 'block') {
        renderOrders(currentFilter);
        updateStats();
    }
});