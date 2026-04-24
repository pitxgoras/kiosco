// Variables para gráficas
let revenueChart = null;
let topProductsChart = null;
let peakHoursChart = null;
let currentOrders = [];
let currentFilter = 'day';
let currentSalesFilter = 'day';
let locationMap = null;
let locationMarker = null;

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

// Elementos para personalización
const primaryColorInput = document.getElementById('primaryColor');
const secondaryColorInput = document.getElementById('secondaryColor');
const dangerColorInput = document.getElementById('dangerColor');
const warningColorInput = document.getElementById('warningColor');
const logoUpload = document.getElementById('logoUpload');
const uploadLogoBtn = document.getElementById('uploadLogoBtn');
const removeLogoBtn = document.getElementById('removeLogoBtn');
const logoPreview = document.getElementById('logoPreview');
const saveThemeBtn = document.getElementById('saveThemeBtn');
const businessNameDisplay = document.getElementById('businessNameDisplay');
const updateBusinessNameBtn = document.getElementById('updateBusinessNameBtn');

// Elementos para configuración
const businessRUCInput = document.getElementById('businessRUC');
const businessAddressInput = document.getElementById('businessAddress');
const deliveryCostInput = document.getElementById('deliveryCostSetting');
const freeDeliveryMinInput = document.getElementById('freeDeliveryMin');
const paymentMethodsList = document.getElementById('paymentMethodsList');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');

// Elementos para métodos de pago
const newPaymentMethodInput = document.getElementById('newPaymentMethod');
const addPaymentMethodBtn = document.getElementById('addPaymentMethodBtn');

// Elementos para ubicación
const getCurrentLocationBtn = document.getElementById('getCurrentLocationBtn');
const locationInfo = document.getElementById('locationInfo');
const locationCoords = document.getElementById('locationCoords');

// Elementos para ventas
const salesFilter = document.getElementById('salesFilter');
const applySalesFilter = document.getElementById('applySalesFilter');
const exportSalesBtn = document.getElementById('exportSalesBtn');
const exportSalesPdfBtn = document.getElementById('exportSalesPdfBtn');
const salesTotal = document.getElementById('salesTotal');
const salesCount = document.getElementById('salesCount');
const salesAverage = document.getElementById('salesAverage');
const salesTableBody = document.getElementById('salesTableBody');

// Elementos para reportes
const activityLogList = document.getElementById('activityLogList');
const topCustomersList = document.getElementById('topCustomersList');
const profitableProductsList = document.getElementById('profitableProductsList');

// Modal de imagen de producto
const imageModal = document.getElementById('imageModal');
const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const saveImageBtn = document.getElementById('saveImageBtn');
const cancelImageBtn = document.getElementById('cancelImageBtn');
let currentProductForImage = null;

// Modal de imagen de método de pago
const paymentImageModal = document.getElementById('paymentImageModal');
const paymentImageUpload = document.getElementById('paymentImageUpload');
const paymentImagePreview = document.getElementById('paymentImagePreview');
const savePaymentImageBtn = document.getElementById('savePaymentImageBtn');
const removePaymentImageBtn = document.getElementById('removePaymentImageBtn');
const cancelPaymentImageBtn = document.getElementById('cancelPaymentImageBtn');
let currentPaymentMethodForImage = null;

// Modal de confirmación
const confirmModal = document.getElementById('confirmModal');
let pendingAction = null;

// ============ UTILIDADES ============
function showConfirm(message, callback) {
    const confirmMessage = document.getElementById('confirmMessage');
    if (confirmMessage) confirmMessage.textContent = message;
    if (confirmModal) confirmModal.style.display = 'flex';
    pendingAction = callback;
}

const confirmYes = document.getElementById('confirmYes');
const confirmNo = document.getElementById('confirmNo');

if (confirmYes) {
    confirmYes.onclick = () => {
        if (pendingAction) pendingAction();
        if (confirmModal) confirmModal.style.display = 'none';
        pendingAction = null;
    };
}

if (confirmNo) {
    confirmNo.onclick = () => {
        if (confirmModal) confirmModal.style.display = 'none';
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

// ============ PERSONALIZACIÓN DE TEMA ============
function loadThemeSettings() {
    const theme = getTheme();
    if (primaryColorInput) primaryColorInput.value = theme.primaryColor;
    if (secondaryColorInput) secondaryColorInput.value = theme.secondaryColor;
    if (dangerColorInput) dangerColorInput.value = theme.dangerColor;
    if (warningColorInput) warningColorInput.value = theme.warningColor;
    
    updateColorPreviews();
    applyThemeToPage(theme);
}

function updateColorPreviews() {
    const primaryPreview = document.getElementById('primaryPreview');
    const secondaryPreview = document.getElementById('secondaryPreview');
    const dangerPreview = document.getElementById('dangerPreview');
    const warningPreview = document.getElementById('warningPreview');
    
    if (primaryPreview) primaryPreview.style.backgroundColor = primaryColorInput?.value;
    if (secondaryPreview) secondaryPreview.style.backgroundColor = secondaryColorInput?.value;
    if (dangerPreview) dangerPreview.style.backgroundColor = dangerColorInput?.value;
    if (warningPreview) warningPreview.style.backgroundColor = warningColorInput?.value;
}

function loadLogoPreview() {
    const logo = getLogo();
    const headerLogo = document.getElementById('headerLogo');
    const headerTitle = document.getElementById('headerTitle');
    
    if (logoPreview) {
        logoPreview.innerHTML = '';
        if (logo) {
            const img = document.createElement('img');
            img.src = logo;
            img.style.maxWidth = '150px';
            img.style.maxHeight = '80px';
            img.style.marginTop = '10px';
            logoPreview.appendChild(img);
            
            if (headerLogo) {
                headerLogo.src = logo;
                headerLogo.style.display = 'block';
            }
            if (headerTitle) headerTitle.style.display = 'none';
        } else {
            if (headerLogo) headerLogo.style.display = 'none';
            if (headerTitle) headerTitle.style.display = 'block';
        }
    }
}

function loadBusinessName() {
    const settings = getSettings();
    const businessName = settings.businessName || 'Kiosco';
    const headerTitle = document.getElementById('headerTitle');
    const storeNameInput = document.getElementById('businessNameDisplay');
    
    if (headerTitle && !getLogo()) {
        headerTitle.innerHTML = `🛒 ${businessName}`;
    }
    if (storeNameInput) storeNameInput.value = businessName;
}

if (uploadLogoBtn) {
    uploadLogoBtn.onclick = () => {
        const file = logoUpload?.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                saveLogo(e.target.result);
                loadLogoPreview();
                showToast('✅ Logo actualizado', 'success');
                addActivityLog('Logo actualizado', 'Se subió un nuevo logo', 'general');
            };
            reader.readAsDataURL(file);
        } else {
            showToast('Selecciona una imagen primero', 'error');
        }
    };
}

if (removeLogoBtn) {
    removeLogoBtn.onclick = () => {
        deleteLogo();
        loadLogoPreview();
        loadBusinessName();
        showToast('✅ Logo eliminado', 'success');
        addActivityLog('Logo eliminado', 'Se eliminó el logo del negocio', 'general');
    };
}

if (updateBusinessNameBtn) {
    updateBusinessNameBtn.onclick = () => {
        const newName = businessNameDisplay?.value.trim();
        if (newName) {
            const settings = getSettings();
            settings.businessName = newName;
            saveSettings(settings);
            loadBusinessName();
            showToast('✅ Nombre actualizado', 'success');
            addActivityLog('Nombre actualizado', `Nombre del negocio cambiado a "${newName}"`, 'general');
        }
    };
}

if (saveThemeBtn) {
    saveThemeBtn.onclick = () => {
        const theme = {
            primaryColor: primaryColorInput?.value || '#6366f1',
            secondaryColor: secondaryColorInput?.value || '#10b981',
            dangerColor: dangerColorInput?.value || '#ef4444',
            warningColor: warningColorInput?.value || '#f59e0b',
            darkColor: '#1e293b'
        };
        saveTheme(theme);
        showToast('✅ Tema guardado', 'success');
        addActivityLog('Tema actualizado', 'Se cambiaron los colores de la tienda', 'general');
    };
}

// ============ UBICACIÓN EN TIEMPO REAL ============
function initMiniMap() {
    if (typeof L === 'undefined') return;
    if (locationMap) locationMap.remove();
    
    const mapContainer = document.getElementById('miniMap');
    if (!mapContainer) return;
    
    locationMap = L.map('miniMap').setView([-12.0464, -77.0428], 15);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(locationMap);
}

function updateLocationOnMap(lat, lng, address) {
    if (typeof L === 'undefined') return;
    if (locationMap) {
        locationMap.setView([lat, lng], 16);
        if (locationMarker) locationMarker.remove();
        locationMarker = L.marker([lat, lng]).addTo(locationMap);
        locationMarker.bindPopup(`📍 ${address}`).openPopup();
    }
}

function getCurrentLocation() {
    if (!navigator.geolocation) {
        showToast('❌ Tu navegador no soporta geolocalización', 'error');
        return;
    }
    
    showToast('📍 Obteniendo tu ubicación...', 'info');
    
    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=es`);
            const data = await response.json();
            const address = data.display_name || `${lat}, ${lng}`;
            
            if (businessAddressInput) {
                businessAddressInput.value = address;
            }
            
            if (locationCoords) {
                locationCoords.innerHTML = `<strong>📍 Ubicación obtenida:</strong><br>${address}<br><small>Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}</small>`;
            }
            
            if (locationInfo) {
                locationInfo.style.display = 'block';
            }
            
            initMiniMap();
            setTimeout(() => updateLocationOnMap(lat, lng, address), 100);
            
            showToast('✅ Ubicación actualizada', 'success');
            addActivityLog('Ubicación actualizada', `Se actualizó la dirección del negocio a: ${address.substring(0, 100)}`, 'general');
        } catch (error) {
            console.error('Error al obtener dirección:', error);
            if (businessAddressInput) {
                businessAddressInput.value = `${lat}, ${lng}`;
            }
            if (locationCoords) {
                locationCoords.innerHTML = `<strong>📍 Coordenadas:</strong><br>Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
            }
            if (locationInfo) {
                locationInfo.style.display = 'block';
            }
            initMiniMap();
            setTimeout(() => updateLocationOnMap(lat, lng, `${lat}, ${lng}`), 100);
            showToast('✅ Coordenadas actualizadas', 'success');
        }
    }, (error) => {
        console.error('Error de geolocalización:', error);
        showToast('❌ No se pudo obtener tu ubicación. Verifica los permisos.', 'error');
    });
}

if (getCurrentLocationBtn) {
    getCurrentLocationBtn.onclick = getCurrentLocation;
}

// Elemento para restablecer colores
const resetColorsBtn = document.getElementById('resetColorsBtn');

// Colores predeterminados
const DEFAULT_COLORS = {
    primaryColor: '#6366f1',
    secondaryColor: '#10b981',
    dangerColor: '#ef4444',
    warningColor: '#f59e0b',
    darkColor: '#1e293b'
};

// Función para restablecer colores predeterminados
function resetToDefaultColors() {
    if (primaryColorInput) primaryColorInput.value = DEFAULT_COLORS.primaryColor;
    if (secondaryColorInput) secondaryColorInput.value = DEFAULT_COLORS.secondaryColor;
    if (dangerColorInput) dangerColorInput.value = DEFAULT_COLORS.dangerColor;
    if (warningColorInput) warningColorInput.value = DEFAULT_COLORS.warningColor;
    
    updateColorPreviews();
    applyThemeToPage(DEFAULT_COLORS);
    showToast('🎨 Colores restablecidos a los valores predeterminados', 'success');
}

// Evento del botón restablecer colores
if (resetColorsBtn) {
    resetColorsBtn.onclick = () => {
        showConfirm('¿Restablecer todos los colores a los valores predeterminados?', () => {
            resetToDefaultColors();
        });
    };
}

// ============ NOTIFICAR LLEGADA AL CLIENTE ============
function notifyCustomerArrival(orderId, customerPhone, orderNumber) {
    const notifications = JSON.parse(localStorage.getItem('kiosco_customer_notifications') || '{}');
    if (!notifications[customerPhone]) notifications[customerPhone] = [];
    notifications[customerPhone].unshift({
        id: Date.now(),
        orderNumber: orderNumber,
        status: 'en_camino',
        message: '🚚 ¡Tu pedido está en camino! El repartidor llegará en aproximadamente 10-15 minutos.',
        read: false,
        date: new Date().toISOString()
    });
    localStorage.setItem('kiosco_customer_notifications', JSON.stringify(notifications));
    showToast('✅ Notificación enviada al cliente', 'success');
    addActivityLog('Notificación enviada', `Se notificó al cliente sobre la llegada del pedido #${orderNumber}`, 'order');
}

// ============ GRÁFICAS ============
function initCharts() {
    updateRevenueChart('week');
    updateTopProductsChart();
    updatePeakHoursChart();
}

function updateRevenueChart(period) {
    let data = [];
    let labels = [];
    
    if (period === 'week') {
        const salesData = getDailySales(7);
        data = salesData.map(d => d.total);
        labels = salesData.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' });
        });
    } else if (period === 'month') {
        const salesData = getDailySales(30);
        data = salesData.map(d => d.total);
        labels = salesData.map(d => {
            const date = new Date(d.date);
            return `${date.getDate()}/${date.getMonth() + 1}`;
        });
    } else {
        const salesData = getSalesByMonth(12);
        data = salesData.map(d => d.total);
        labels = salesData.map(d => {
            const [year, month] = d.month.split('-');
            return new Date(year, month - 1).toLocaleDateString('es-PE', { month: 'short' });
        });
    }
    
    const ctx = document.getElementById('revenueChart')?.getContext('2d');
    if (!ctx) return;
    if (revenueChart) revenueChart.destroy();
    
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ingresos (S/)',
                data: data,
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#6366f1',
                pointBorderColor: '#fff',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: { 
                    callbacks: {
                        label: function(context) {
                            return `S/ ${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'S/ ' + value;
                        }
                    }
                }
            }
        }
    });
}

function updateTopProductsChart() {
    const topProducts = getMostProfitableProducts(5);
    const ctx = document.getElementById('topProductsChart')?.getContext('2d');
    if (!ctx) return;
    if (topProductsChart) topProductsChart.destroy();
    
    topProductsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topProducts.map(p => p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name),
            datasets: [
                {
                    label: 'Cantidad vendida',
                    data: topProducts.map(p => p.quantity),
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                    borderColor: '#6366f1',
                    borderWidth: 1,
                    borderRadius: 8
                },
                {
                    label: 'Ganancia (S/)',
                    data: topProducts.map(p => p.profit),
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    borderRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: { 
                    callbacks: {
                        label: function(context) {
                            if (context.dataset.label === 'Cantidad vendida') {
                                return `${context.raw} unidades`;
                            }
                            return `S/ ${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updatePeakHoursChart() {
    const peakHours = getPeakHours();
    const ctx = document.getElementById('peakHoursChart')?.getContext('2d');
    if (!ctx) return;
    if (peakHoursChart) peakHoursChart.destroy();
    
    const labels = [];
    const data = [];
    for (let i = 0; i < 24; i++) {
        labels.push(`${i}:00`);
        data.push(peakHours[i]?.count || 0);
    }
    
    peakHoursChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Pedidos por hora',
                data: data,
                backgroundColor: 'rgba(245, 158, 11, 0.8)',
                borderColor: '#f59e0b',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: { 
                    callbacks: {
                        label: function(context) {
                            return `${context.raw} pedidos`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

// ============ SECCIÓN DE VENTAS ============
function loadSalesData(filter) {
    const orders = getOrders();
    const now = new Date();
    let filtered = [];
    
    if (filter === 'day') {
        filtered = orders.filter(o => new Date(o.date).toDateString() === now.toDateString());
    } else if (filter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        filtered = orders.filter(o => new Date(o.date) >= weekAgo);
    } else if (filter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        filtered = orders.filter(o => new Date(o.date) >= monthAgo);
    } else {
        const yearAgo = new Date();
        yearAgo.setFullYear(now.getFullYear() - 1);
        filtered = orders.filter(o => new Date(o.date) >= yearAgo);
    }
    
    const total = filtered.reduce((sum, o) => sum + (o.total || 0), 0);
    const count = filtered.length;
    const average = count > 0 ? total / count : 0;
    
    if (salesTotal) salesTotal.textContent = `S/ ${total.toFixed(2)}`;
    if (salesCount) salesCount.textContent = count;
    if (salesAverage) salesAverage.textContent = `S/ ${average.toFixed(2)}`;
    
    if (salesTableBody) {
        salesTableBody.innerHTML = '';
        filtered.forEach(order => {
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid #e2e8f0';
            const statusClass = order.status === 'entregado' ? 'status-done' : (order.status === 'rechazado' ? 'status-rejected' : 'status-pending');
            row.innerHTML = `
                <td style="padding: 0.8rem;">${new Date(order.date).toLocaleDateString('es-PE')}</td>
                <td style="padding: 0.8rem;">#${order.orderNumber}</td>
                <td style="padding: 0.8rem;">${order.customerName || 'Cliente'}<br><small>${order.customerPhone || ''}</small></td>
                <td style="padding: 0.8rem;">${order.paymentMethod || 'No especificado'}</td>
                <td style="padding: 0.8rem;">S/ ${(order.total || 0).toFixed(2)}</div></td>
                <td style="padding: 0.8rem;"><span class="order-status-badge ${statusClass}">${order.status}</span></td>
                <td style="padding: 0.8rem;">
                    <button class="view-order-details" data-id="${order.id}" style="background:#3b82f6; color:white; border:none; padding:0.2rem 0.6rem; border-radius:8px; cursor:pointer;">Ver</button>
                    <button class="delete-order-btn" data-id="${order.id}" style="background:#ef4444; color:white; border:none; padding:0.2rem 0.6rem; border-radius:8px; cursor:pointer; margin-left:0.3rem;">Eliminar</button>
                </div>
            `;
            salesTableBody.appendChild(row);
        });
        
        document.querySelectorAll('.view-order-details').forEach(btn => {
            btn.onclick = () => {
                const orderId = parseInt(btn.dataset.id);
                const order = filtered.find(o => o.id === orderId);
                if (order) {
                    alert(`📦 Pedido #${order.orderNumber}\n👤 Cliente: ${order.customerName}\n📞 Teléfono: ${order.customerPhone}\n📍 Dirección: ${order.deliveryAddress || 'No especificada'}\n💳 Pago: ${order.paymentMethod}\n📅 Fecha: ${new Date(order.date).toLocaleString()}\n\nProductos:\n${order.items.map(i => `• ${i.name} x${i.quantity} = S/ ${(i.price*i.quantity).toFixed(2)}`).join('\n')}\n\nTotal: S/ ${order.total.toFixed(2)}`);
                }
            };
        });
        
        document.querySelectorAll('.delete-order-btn').forEach(btn => {
            btn.onclick = () => {
                const orderId = parseInt(btn.dataset.id);
                showConfirm('¿Eliminar este pedido permanentemente?', () => {
                    deleteOrder(orderId);
                    loadSalesData(currentSalesFilter);
                    showToast('🗑️ Pedido eliminado', 'success');
                });
            };
        });
    }
}

function exportSalesToExcel() {
    const orders = getOrders();
    const now = new Date();
    let filtered = [];
    
    if (currentSalesFilter === 'day') {
        filtered = orders.filter(o => new Date(o.date).toDateString() === now.toDateString());
    } else if (currentSalesFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        filtered = orders.filter(o => new Date(o.date) >= weekAgo);
    } else if (currentSalesFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        filtered = orders.filter(o => new Date(o.date) >= monthAgo);
    } else {
        const yearAgo = new Date();
        yearAgo.setFullYear(now.getFullYear() - 1);
        filtered = orders.filter(o => new Date(o.date) >= yearAgo);
    }
    
    let html = `<html><head><meta charset="UTF-8"><title>Reporte de Ventas</title>
        <style>th{background:#4f46e5;color:white;padding:8px;}td{padding:8px;border:1px solid #ddd;}table{border-collapse:collapse;width:100%;}</style>
        </head><body><h2>📊 REPORTE DE VENTAS</h2>
        <p>Fecha: ${new Date().toLocaleString('es-PE')}</p>
        <p>Período: ${currentSalesFilter === 'day' ? 'Hoy' : currentSalesFilter === 'week' ? 'Esta semana' : currentSalesFilter === 'month' ? 'Este mes' : 'Este año'}</p>
        <table border="1"><thead><tr><th>#</th><th>Fecha</th><th>Cliente</th><th>Teléfono</th><th>Pago</th><th>Total</th><th>Estado</th></tr></thead><tbody>`;
    
    filtered.forEach((o, i) => {
        html += `<tr>
            <td>${i+1}</td>
            <td>${new Date(o.date).toLocaleString()}</td>
            <td>${o.customerName || 'Cliente'}</td>
            <td>${o.customerPhone || ''}</td>
            <td>${o.paymentMethod || '-'}</td>
            <td>S/ ${(o.total || 0).toFixed(2)}</div></td>
            <td>${o.status}</td>
        </tr>`;
    });
    
    const total = filtered.reduce((s, o) => s + (o.total || 0), 0);
    html += `<tr style="background:#f0f9ff;"><td colspan="5"><strong>TOTAL</strong></div><td><td colspan="2"><strong>S/ ${total.toFixed(2)}</strong> (${filtered.length} pedidos)</div></tr>`;
    html += `</tbody></table><hr><small>Reporte generado por Kiosco Admin</small></body></html>`;
    
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ventas_${currentSalesFilter}_${new Date().toISOString().slice(0,10)}.xls`;
    link.click();
    showToast('📥 Reporte exportado', 'success');
}

function exportSalesToPDF() {
    const orders = getOrders();
    const now = new Date();
    let filtered = [];
    
    if (currentSalesFilter === 'day') {
        filtered = orders.filter(o => new Date(o.date).toDateString() === now.toDateString());
    } else if (currentSalesFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        filtered = orders.filter(o => new Date(o.date) >= weekAgo);
    } else if (currentSalesFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        filtered = orders.filter(o => new Date(o.date) >= monthAgo);
    } else {
        const yearAgo = new Date();
        yearAgo.setFullYear(now.getFullYear() - 1);
        filtered = orders.filter(o => new Date(o.date) >= yearAgo);
    }
    
    const printWindow = window.open('', '_blank');
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Reporte de Ventas</title>
        <style>body{font-family:Arial;padding:20px;}th{background:#4f46e5;color:white;padding:8px;}td{padding:8px;border:1px solid #ddd;}table{border-collapse:collapse;width:100%;}</style>
        </head><body><h2>📊 REPORTE DE VENTAS</h2>
        <p>Fecha: ${new Date().toLocaleString('es-PE')}</p>
        <p>Período: ${currentSalesFilter === 'day' ? 'Hoy' : currentSalesFilter === 'week' ? 'Esta semana' : currentSalesFilter === 'month' ? 'Este mes' : 'Este año'}</p>
        <table border="1"><thead><tr><th>#</th><th>Fecha</th><th>Cliente</th><th>Teléfono</th><th>Pago</th><th>Total</th><th>Estado</th></tr></thead><tbody>`;
    
    filtered.forEach((o, i) => {
        html += `<tr>
            <td>${i+1}</td>
            <td>${new Date(o.date).toLocaleString()}</td>
            <td>${o.customerName || 'Cliente'}</td>
            <td>${o.customerPhone || ''}</td>
            <td>${o.paymentMethod || '-'}</td>
            <td>S/ ${(o.total || 0).toFixed(2)}</div></td>
            <td>${o.status}</td>
        </tr>`;
    });
    
    const total = filtered.reduce((s, o) => s + (o.total || 0), 0);
    html += `<tr style="background:#f0f9ff;"><td colspan="5"><strong>TOTAL</strong></div><td><td colspan="2"><strong>S/ ${total.toFixed(2)}</strong> (${filtered.length} pedidos)</div></tr>`;
    html += `</tbody><td><div class="footer"><p>Reporte generado por Kiosco Admin</p></div></body></html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
    showToast('📄 Reporte enviado a impresión', 'success');
}

// ============ FUNCIONES DE IMAGEN DE PRODUCTOS ============
function renderImageGallery(productId) {
    const images = getProductImagesList(productId);
    const container = document.getElementById('imageGalleryContainer');
    if (!container) return;
    
    container.innerHTML = '';
    images.forEach((img, index) => {
        const imgDiv = document.createElement('div');
        imgDiv.style.cssText = 'position: relative; width: 80px; height: 80px; border-radius: 8px; overflow: hidden; border: 2px solid #ddd;';
        imgDiv.innerHTML = `
            <img src="${img}" style="width: 100%; height: 100%; object-fit: cover;">
            <button class="delete-image-btn" data-index="${index}" style="position: absolute; top: 2px; right: 2px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 10px; cursor: pointer;">✕</button>
        `;
        container.appendChild(imgDiv);
    });
    
    document.querySelectorAll('.delete-image-btn').forEach(btn => {
        btn.onclick = () => {
            const index = parseInt(btn.dataset.index);
            deleteProductImage(productId, index);
            renderImageGallery(productId);
            showToast('✅ Imagen eliminada', 'success');
        };
    });
}

function openImageModal(productId, productName) {
    currentProductForImage = productId;
    const modalTitle = document.querySelector('#imageModal h3');
    if (modalTitle) modalTitle.textContent = `🖼️ Galería de ${productName}`;
    if (imageUpload) imageUpload.value = '';
    if (imagePreview) imagePreview.innerHTML = '<span style="color: #999;">Vista previa</span>';
    
    renderImageGallery(productId);
    if (imageModal) imageModal.style.display = 'flex';
}

if (imageUpload) {
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && imagePreview) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = document.createElement('img');
                img.src = event.target.result;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                imagePreview.innerHTML = '';
                imagePreview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });
}

if (saveImageBtn) {
    saveImageBtn.onclick = () => {
        const previewImg = imagePreview?.querySelector('img');
        if (previewImg && currentProductForImage) {
            const images = getProductImagesList(currentProductForImage);
            saveProductImage(currentProductForImage, previewImg.src, images.length);
            renderImageGallery(currentProductForImage);
            if (imagePreview) imagePreview.innerHTML = '<span style="color: #999;">Vista previa</span>';
            if (imageUpload) imageUpload.value = '';
            showToast('✅ Imagen agregada', 'success');
            loadAdminData();
        } else {
            showToast('Selecciona una imagen primero', 'error');
        }
    };
}

if (cancelImageBtn) {
    cancelImageBtn.onclick = () => {
        if (imageModal) imageModal.style.display = 'none';
        currentProductForImage = null;
        if (imagePreview) imagePreview.innerHTML = '<span style="color: #999;">Vista previa</span>';
    };
}

// ============ FUNCIONES DE IMAGEN DE MÉTODOS DE PAGO ============
function getPaymentMethodImages() {
    const images = localStorage.getItem('kiosco_payment_method_images');
    return images ? JSON.parse(images) : {};
}

function savePaymentMethodImage(methodKey, imageData) {
    const images = getPaymentMethodImages();
    images[methodKey] = imageData;
    localStorage.setItem('kiosco_payment_method_images', JSON.stringify(images));
    loadPaymentMethods();
    showToast('✅ Imagen guardada', 'success');
}

function deletePaymentMethodImage(methodKey) {
    const images = getPaymentMethodImages();
    delete images[methodKey];
    localStorage.setItem('kiosco_payment_method_images', JSON.stringify(images));
    loadPaymentMethods();
    showToast('🗑️ Imagen eliminada', 'success');
}

function openPaymentImageModal(methodKey, methodName) {
    currentPaymentMethodForImage = methodKey;
    const modalTitle = document.querySelector('#paymentImageModal h3');
    if (modalTitle) modalTitle.textContent = `🖼️ Imagen para ${methodName}`;
    
    const images = getPaymentMethodImages();
    const currentImage = images[methodKey];
    
    if (paymentImagePreview) {
        paymentImagePreview.innerHTML = '';
        if (currentImage) {
            const img = document.createElement('img');
            img.src = currentImage;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            paymentImagePreview.appendChild(img);
        } else {
            paymentImagePreview.innerHTML = '<span style="color: #999;">Sin imagen</span>';
        }
    }
    
    if (paymentImageUpload) paymentImageUpload.value = '';
    if (paymentImageModal) paymentImageModal.style.display = 'flex';
}

if (paymentImageUpload) {
    paymentImageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && paymentImagePreview) {
            const reader = new FileReader();
            reader.onload = (event) => {
                paymentImagePreview.innerHTML = '';
                const img = document.createElement('img');
                img.src = event.target.result;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                paymentImagePreview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });
}

if (savePaymentImageBtn) {
    savePaymentImageBtn.onclick = () => {
        const previewImg = paymentImagePreview?.querySelector('img');
        if (previewImg && currentPaymentMethodForImage) {
            savePaymentMethodImage(currentPaymentMethodForImage, previewImg.src);
            if (paymentImageModal) paymentImageModal.style.display = 'none';
        } else {
            showToast('Selecciona una imagen primero', 'error');
        }
    };
}

if (removePaymentImageBtn) {
    removePaymentImageBtn.onclick = () => {
        if (currentPaymentMethodForImage) {
            deletePaymentMethodImage(currentPaymentMethodForImage);
            if (paymentImageModal) paymentImageModal.style.display = 'none';
        }
    };
}

if (cancelPaymentImageBtn) {
    cancelPaymentImageBtn.onclick = () => {
        if (paymentImageModal) paymentImageModal.style.display = 'none';
        currentPaymentMethodForImage = null;
    };
}

// ============ CONFIGURACIÓN DE MÉTODOS DE PAGO ============
function loadPaymentMethods() {
    const settings = getSettings();
    let methods = settings.paymentMethods || ['yape', 'plin', 'transferencia', 'efectivo'];
    
    // 🔧 FIX: Asegurar que methods sea un array de strings
    if (Array.isArray(methods)) {
        methods = methods.map(m => {
            if (typeof m === 'object') {
                return m.name || m.value || String(m);
            }
            return String(m);
        });
    } else {
        methods = ['yape', 'plin', 'transferencia', 'efectivo'];
    }
    
    const methodNames = { 
        'yape': '📱 Yape', 
        'plin': '📱 Plin', 
        'transferencia': '🏦 Transferencia bancaria', 
        'efectivo': '💵 Efectivo contra entrega' 
    };
    const paymentImages = getPaymentMethodImages();
    
    if (paymentMethodsList) {
        paymentMethodsList.innerHTML = '';
        if (methods.length === 0) {
            paymentMethodsList.innerHTML = '<div style="color: #64748b; padding: 0.5rem; text-align:center;">No hay métodos de pago configurados</div>';
            return;
        }
        
        methods.forEach((method) => {
            const methodKey = String(method);
            const displayName = methodNames[methodKey] || methodKey.charAt(0).toUpperCase() + methodKey.slice(1);
            
            const div = document.createElement('div');
            div.className = 'payment-method-item';
            div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.8rem; border-bottom: 1px solid #e2e8f0; background: var(--light); margin-bottom: 0.3rem; border-radius: 8px;';
            
            const imageUrl = paymentImages[methodKey];
            const imageHtml = imageUrl 
                ? `<img src="${imageUrl}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover;">` 
                : '<div style="width: 40px; height: 40px; background: #e2e8f0; border-radius: 8px; display: flex; align-items: center; justify-content: center;">📷</div>';
            
            div.innerHTML = `
                <div class="payment-method-info" style="display: flex; align-items: center; gap: 0.8rem;">
                    ${imageHtml}
                    <span style="font-weight: 500;">${displayName}</span>
                </div>
                <div>
                    <button class="edit-payment-image" data-method="${methodKey}" data-name="${displayName}" style="background: #3b82f6; color: white; border: none; padding: 0.3rem 0.8rem; border-radius: 8px; margin-right: 0.5rem; cursor: pointer;">🖼️ Imagen</button>
                    <button class="delete-payment-method" data-method="${methodKey}" style="background: #ef4444; color: white; border: none; padding: 0.3rem 0.8rem; border-radius: 8px; cursor: pointer;">🗑️ Eliminar</button>
                </div>
            `;
            paymentMethodsList.appendChild(div);
        });
        
        document.querySelectorAll('.delete-payment-method').forEach(btn => {
            btn.onclick = () => {
                const method = btn.dataset.method;
                showConfirm(`¿Eliminar el método de pago "${methodNames[method] || method}"?`, () => {
                    let settings = getSettings();
                    let methodsArray = settings.paymentMethods || [];
                    methodsArray = methodsArray.filter(m => {
                        const mKey = typeof m === 'object' ? (m.name || m.value) : String(m);
                        return mKey !== method;
                    });
                    settings.paymentMethods = methodsArray;
                    saveSettings(settings);
                    deletePaymentMethodImage(method);
                    loadPaymentMethods();
                    showToast('✅ Método de pago eliminado', 'success');
                    addActivityLog('Método de pago eliminado', `Se eliminó "${method}" de los métodos de pago`, 'general');
                });
            };
        });
        
        document.querySelectorAll('.edit-payment-image').forEach(btn => {
            btn.onclick = () => {
                const method = btn.dataset.method;
                const name = btn.dataset.name;
                openPaymentImageModal(method, name);
            };
        });
    }
}

// ============ AGREGAR MÉTODOS DE PAGO ============
if (addPaymentMethodBtn) {
    addPaymentMethodBtn.onclick = () => {
        const newMethod = newPaymentMethodInput?.value.trim();
        if (!newMethod) {
            showToast('Ingresa un nombre para el método de pago', 'error');
            return;
        }
        
        const methodKey = newMethod.toLowerCase().replace(/\s/g, '_');
        let settings = getSettings();
        if (!settings.paymentMethods) settings.paymentMethods = ['yape', 'plin', 'transferencia', 'efectivo'];
        
        if (settings.paymentMethods.includes(methodKey)) {
            showToast('⚠️ Este método de pago ya existe', 'error');
            return;
        }
        
        settings.paymentMethods.push(methodKey);
        saveSettings(settings);
        if (newPaymentMethodInput) newPaymentMethodInput.value = '';
        loadPaymentMethods();
        showToast(`✅ Método "${newMethod}" agregado`, 'success');
        addActivityLog('Método de pago agregado', `Se agregó "${newMethod}" a los métodos de pago`, 'general');
    };
}

// ============ LOGIN ============
if (loginBtn) {
    loginBtn.onclick = () => {
        const phone = adminPhone?.value || '';
        if (isAdmin(phone)) {
            if (loginDiv) loginDiv.style.display = 'none';
            if (dashboardDiv) dashboardDiv.style.display = 'block';
            loadAdminData();
            initCharts();
            loadActivityLog();
            loadTopCustomers();
            loadProfitableProducts();
            loadThemeSettings();
            loadLogoPreview();
            loadBusinessName();
            loadPaymentMethods();
            loadSalesData('day');
            loadSettings();
            showToast('✅ Bienvenido Administrador', 'success');
            addActivityLog('Inicio de sesión', 'Administrador ingresó al panel', 'auth');
        } else {
            showToast('❌ Número no autorizado', 'error');
            if (adminPhone) {
                adminPhone.style.animation = 'shake 0.3s ease';
                setTimeout(() => { if (adminPhone) adminPhone.style.animation = ''; }, 300);
            }
        }
    };
}

if (logoutBtn) {
    logoutBtn.onclick = () => {
        if (dashboardDiv) dashboardDiv.style.display = 'none';
        if (loginDiv) loginDiv.style.display = 'block';
        if (adminPhone) adminPhone.value = '';
        showToast('Sesión cerrada', 'info');
        addActivityLog('Cierre de sesión', 'Administrador cerró sesión', 'auth');
    };
}

// ============ REPORTES ============
function loadActivityLog() {
    const logs = getActivityLog(50);
    if (!activityLogList) return;
    
    activityLogList.innerHTML = '';
    if (logs.length === 0) {
        activityLogList.innerHTML = '<div style="text-align:center;padding:1rem;">📝 No hay actividades registradas</div>';
        return;
    }
    
    logs.forEach(log => {
        const div = document.createElement('div');
        div.className = 'activity-item';
        div.style.cssText = 'padding: 0.8rem; border-bottom: 1px solid #e2e8f0;';
        const typeColors = { 'order': '#10b981', 'product': '#6366f1', 'category': '#f59e0b', 'auth': '#ef4444', 'general': '#6b7280' };
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                <strong>${log.action}</strong>
                <small style="color: ${typeColors[log.type] || '#6b7280'};">${new Date(log.date).toLocaleString()}</small>
            </div>
            <p style="margin-top: 0.3rem; font-size: 0.85rem; color: #64748b;">${log.description}</p>
        `;
        activityLogList.appendChild(div);
    });
}

function loadTopCustomers() {
    const topCustomers = getTopCustomers(5);
    if (!topCustomersList) return;
    
    topCustomersList.innerHTML = '';
    if (topCustomers.length === 0) {
        topCustomersList.innerHTML = '<div style="text-align:center;padding:1rem;">👥 No hay clientes registrados</div>';
        return;
    }
    
    topCustomers.forEach((customer, index) => {
        const div = document.createElement('div');
        div.className = 'customer-item';
        div.style.cssText = 'padding: 0.8rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;';
        div.innerHTML = `
            <div><strong>#${index + 1}</strong> ${customer.name || 'Cliente'} <small style="color: #64748b;">📞 ${customer.phone}</small></div>
            <div style="text-align: right;"><strong>S/ ${(customer.totalSpent || 0).toFixed(2)}</strong><br><small>${customer.orderCount || 0} pedidos</small></div>
        `;
        topCustomersList.appendChild(div);
    });
}

function loadProfitableProducts() {
    const profitableProducts = getMostProfitableProducts(5);
    if (!profitableProductsList) return;
    
    profitableProductsList.innerHTML = '';
    if (profitableProducts.length === 0) {
        profitableProductsList.innerHTML = '<div style="text-align:center;padding:1rem;">📦 No hay datos de productos</div>';
        return;
    }
    
    profitableProducts.forEach((product, index) => {
        const div = document.createElement('div');
        div.className = 'product-profit-item';
        div.style.cssText = 'padding: 0.8rem; border-bottom: 1px solid #e2e8f0;';
        const profitMargin = (product.profit / product.revenue * 100).toFixed(1);
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div><strong>#${index + 1}</strong> ${product.name}</div>
                <div style="text-align: right;"><strong style="color: #10b981;">S/ ${product.profit.toFixed(2)}</strong> <small>(${profitMargin}%)</small></div>
            </div>
            <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.3rem;">
                Vendido: ${product.quantity} unidades | Ingreso: S/ ${product.revenue.toFixed(2)}
            </div>
        `;
        profitableProductsList.appendChild(div);
    });
}

// ============ FUNCIONES PRINCIPALES ============
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
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    
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
    const productImages = getProductImages();
    if (!productsAdminList) return;
    productsAdminList.innerHTML = '';
    
    for (const [cat, items] of Object.entries(products)) {
        const catDiv = document.createElement('div');
        catDiv.className = 'category-section';
        catDiv.innerHTML = `<div class="category-title">📁 ${cat}</div>`;
        
        items.forEach(prod => {
            const images = productImages[prod.id] || [];
            const imagePreviewHtml = images.length > 0 
                ? `<img src="${images[0]}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover; margin-right: 0.5rem;">` 
                : '<div style="width: 40px; height: 40px; background: #e2e8f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 0.5rem;">📷</div>';
            
            const prodDiv = document.createElement('div');
            prodDiv.className = 'product-item';
            prodDiv.innerHTML = `
                <div class="product-info" style="display: flex; align-items: center; flex: 1;">
                    ${imagePreviewHtml}
                    <div>
                        <strong>${prod.name}</strong><br>
                        <small>S/ ${prod.price} | Stock: ${prod.stock || 0} | Costo: S/ ${(prod.cost || prod.price * 0.6).toFixed(2)}</small>
                    </div>
                </div>
                <div>
                    <button class="image-upload-btn" data-id="${prod.id}" data-name="${prod.name}" style="background:#3b82f6; color:white; border:none; padding:0.3rem 0.8rem; border-radius:8px; margin:0 0.3rem; cursor:pointer;">🖼️ Imágenes</button>
                    <button class="edit-stock" data-cat="${cat}" data-id="${prod.id}" data-name="${prod.name}" data-stock="${prod.stock || 0}" style="background:#f59e0b; color:white; border:none; padding:0.3rem 0.8rem; border-radius:8px; margin:0 0.3rem; cursor:pointer;">📦 Stock</button>
                    <button class="edit-cost" data-cat="${cat}" data-id="${prod.id}" data-name="${prod.name}" data-cost="${(prod.cost || prod.price * 0.6).toFixed(2)}" style="background:#8b5cf6; color:white; border:none; padding:0.3rem 0.8rem; border-radius:8px; margin:0 0.3rem; cursor:pointer;">💰 Costo</button>
                    <button class="btn-danger delete-product" data-cat="${cat}" data-id="${prod.id}" data-name="${prod.name}">🗑️</button>
                </div>
            `;
            catDiv.appendChild(prodDiv);
        });
        productsAdminList.appendChild(catDiv);
    }
    
    document.querySelectorAll('.image-upload-btn').forEach(btn => {
        btn.onclick = () => {
            const id = parseInt(btn.dataset.id);
            const name = btn.dataset.name;
            openImageModal(id, name);
        };
    });
    
    document.querySelectorAll('.edit-stock').forEach(btn => {
        btn.onclick = () => {
            const cat = btn.dataset.cat;
            const id = parseInt(btn.dataset.id);
            const name = btn.dataset.name;
            const currentStock = parseInt(btn.dataset.stock);
            const newStock = prompt(`Stock actual de "${name}": ${currentStock}\nIngrese nuevo stock:`, currentStock);
            if (newStock !== null && !isNaN(parseInt(newStock))) {
                let products = getProducts();
                const product = products[cat].find(p => p.id === id);
                if (product) {
                    product.stock = parseInt(newStock);
                    saveProducts(products);
                    loadAdminData();
                    showToast(`✅ Stock de "${name}" actualizado`, 'success');
                    addActivityLog('Stock actualizado', `Stock de "${name}" cambiado a ${newStock}`, 'product');
                }
            }
        };
    });
    
    document.querySelectorAll('.edit-cost').forEach(btn => {
        btn.onclick = () => {
            const cat = btn.dataset.cat;
            const id = parseInt(btn.dataset.id);
            const name = btn.dataset.name;
            const currentCost = parseFloat(btn.dataset.cost);
            const newCost = prompt(`Costo actual de "${name}": S/ ${currentCost}\nIngrese nuevo costo (S/):`, currentCost);
            if (newCost !== null && !isNaN(parseFloat(newCost))) {
                let products = getProducts();
                const product = products[cat].find(p => p.id === id);
                if (product) {
                    product.cost = parseFloat(newCost);
                    saveProducts(products);
                    loadAdminData();
                    showToast(`✅ Costo de "${name}" actualizado`, 'success');
                    addActivityLog('Costo actualizado', `Costo de "${name}" cambiado a S/ ${newCost}`, 'product');
                }
            }
        };
    });
    
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
                deleteProductImage(id);
                loadAdminData();
                showToast(`✅ "${name}" eliminado`, 'success');
                addActivityLog('Producto eliminado', `"${name}" fue eliminado del catálogo`, 'product');
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
            <span>📂 ${cat} <small style="color:#64748b;">(${products[cat].length} productos)</small></span>
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
                addActivityLog('Categoría eliminada', `Categoría "${cat}" fue eliminada`, 'category');
            });
        };
    });
}

if (addCategoryBtn) {
    addCategoryBtn.onclick = () => {
        const newCat = document.getElementById('newCategory')?.value.trim();
        if (newCat) {
            const products = getProducts();
            if (!products[newCat]) {
                products[newCat] = [];
                saveProducts(products);
                loadAdminData();
                const newCategoryInput = document.getElementById('newCategory');
                if (newCategoryInput) newCategoryInput.value = '';
                showToast(`✅ Categoría "${newCat}" agregada`, 'success');
                addActivityLog('Categoría agregada', `Nueva categoría "${newCat}" creada`, 'category');
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
        const category = categorySelect?.value;
        const name = document.getElementById('productName')?.value.trim();
        const price = parseFloat(document.getElementById('productPrice')?.value || 0);
        const stock = parseInt(document.getElementById('productStock')?.value || 0);
        const cost = parseFloat(document.getElementById('productCost')?.value || (price * 0.6).toFixed(2));
        
        if (category && name && price > 0) {
            const products = getProducts();
            const newId = Date.now();
            products[category].push({ id: newId, name, price, stock: stock || 0, cost: cost || price * 0.6 });
            saveProducts(products);
            loadAdminData();
            const productNameInput = document.getElementById('productName');
            const productPriceInput = document.getElementById('productPrice');
            const productStockInput = document.getElementById('productStock');
            const productCostInput = document.getElementById('productCost');
            if (productNameInput) productNameInput.value = '';
            if (productPriceInput) productPriceInput.value = '';
            if (productStockInput) productStockInput.value = '';
            if (productCostInput) productCostInput.value = '';
            showToast(`✅ "${name}" agregado`, 'success');
            addActivityLog('Producto agregado', `"${name}" agregado a ${category}`, 'product');
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
        const statusClass = order.status === 'entregado' ? 'status-done' : (order.status === 'rechazado' ? 'status-rejected' : (order.status === 'programado' ? 'status-scheduled' : 'status-pending'));
        const statusText = order.status === 'pendiente' ? '⏳ Pendiente' : 
                          (order.status === 'confirmado' ? '✅ Confirmado' :
                          (order.status === 'preparando' ? '👨‍🍳 Preparando' :
                          (order.status === 'en_camino' ? '🚚 En camino' :
                          (order.status === 'entregado' ? '🎉 Entregado' :
                          (order.status === 'programado' ? '📅 Programado' : '❌ Rechazado')))));
        
        const div = document.createElement('div');
        div.className = 'order-item';
        div.innerHTML = `
            <div class="order-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
                <strong>📅 ${new Date(order.date).toLocaleString('es-PE')}</strong>
                <div>
                    <span class="order-status-badge ${statusClass}" style="background: ${order.status === 'programado' ? '#f59e0b' : ''};">${statusText}</span>
                    <button class="delete-order-btn" data-id="${order.id}" style="background:#ef4444; color:white; border:none; padding:0.2rem 0.6rem; border-radius:8px; margin-left:0.5rem; cursor:pointer;">🗑️ Eliminar</button>
                    ${order.status !== 'entregado' && order.status !== 'rechazado' && order.customerPhone ? `<button class="notify-arrival-btn" data-id="${order.id}" data-phone="${order.customerPhone}" data-num="${order.orderNumber}" style="background:#10b981; color:white; border:none; padding:0.2rem 0.6rem; border-radius:8px; margin-left:0.5rem; cursor:pointer;">🚚 Notificar llegada</button>` : ''}
                </div>
            </div>
            <div style="margin: 0.5rem 0;">
                <strong>👤 Cliente:</strong> ${order.customerName || 'Cliente'} (${order.customerPhone || 'Sin teléfono'})<br>
                <strong>💰 Total: S/ ${(order.total || 0).toFixed(2)}</strong>
                <strong>💳 Pago:</strong> ${order.paymentMethod || 'No especificado'}<br>
                ${order.deliveryAddress ? `<strong>📍 Dirección:</strong> ${order.deliveryAddress}<br>` : ''}
                ${order.deliveryWindow ? `<strong>⏰ Ventana de entrega:</strong> ${order.deliveryWindow}<br>` : ''}
                ${order.deliveryDate ? `<strong>📅 Fecha de entrega:</strong> ${new Date(order.deliveryDate).toLocaleDateString()}<br>` : ''}
                <select class="order-status-select" data-id="${order.id}" style="margin-left: 0.5rem; padding: 0.3rem; border-radius: 8px;">
                    <option value="pendiente" ${order.status === 'pendiente' ? 'selected' : ''}>⏳ Pendiente</option>
                    <option value="confirmado" ${order.status === 'confirmado' ? 'selected' : ''}>✅ Confirmado</option>
                    <option value="preparando" ${order.status === 'preparando' ? 'selected' : ''}>👨‍🍳 Preparando</option>
                    <option value="en_camino" ${order.status === 'en_camino' ? 'selected' : ''}>🚚 En camino</option>
                    <option value="entregado" ${order.status === 'entregado' ? 'selected' : ''}>🎉 Entregado</option>
                    <option value="rechazado" ${order.status === 'rechazado' ? 'selected' : ''}>❌ Rechazado</option>
                </select>
            </div>
            <div class="order-items">
                ${order.items.map(i => `• ${i.name} x${i.quantity} = S/ ${(i.price * i.quantity).toFixed(2)}`).join('<br>')}
            </div>
            ${order.history ? `
                <details style="margin-top: 0.5rem;">
                    <summary style="cursor: pointer; font-size: 0.8rem; color: #64748b;">📜 Historial</summary>
                    <div style="font-size: 0.7rem; margin-top: 0.3rem;">
                        ${order.history.map(h => `<div>• ${new Date(h.date).toLocaleString()} - ${h.status} ${h.note ? `(${h.note})` : ''}</div>`).join('')}
                    </div>
                </details>
            ` : ''}
        `;
        ordersList.appendChild(div);
    });
    
    document.querySelectorAll('.order-status-select').forEach(select => {
        select.onchange = () => {
            const orderId = parseInt(select.dataset.id);
            const newStatus = select.value;
            updateOrderStatus(orderId, newStatus);
            renderOrders(filter);
            showToast('✅ Estado actualizado', 'success');
            addActivityLog('Estado actualizado', `Pedido #${orderId} cambió a ${newStatus}`, 'order');
        };
    });
    
    document.querySelectorAll('.delete-order-btn').forEach(btn => {
        btn.onclick = () => {
            const orderId = parseInt(btn.dataset.id);
            showConfirm('¿Eliminar este pedido permanentemente?', () => {
                deleteOrder(orderId);
                renderOrders(filter);
                updateStats();
                showToast('🗑️ Pedido eliminado', 'success');
                addActivityLog('Pedido eliminado', `Pedido #${orderId} fue eliminado`, 'order');
            });
        };
    });
    
    document.querySelectorAll('.notify-arrival-btn').forEach(btn => {
        btn.onclick = () => {
            const orderId = parseInt(btn.dataset.id);
            const phone = btn.dataset.phone;
            const orderNum = btn.dataset.num;
            if (confirm(`¿Notificar al cliente que el pedido #${orderNum} está en camino?`)) {
                notifyCustomerArrival(orderId, phone, orderNum);
                updateOrderStatus(orderId, 'en_camino');
                renderOrders(filter);
            }
        };
    });
}

// ============ FILTROS ============
const filterDay = document.getElementById('filterDay');
const filterWeek = document.getElementById('filterWeek');
const filterMonth = document.getElementById('filterMonth');

if (filterDay) filterDay.onclick = () => { currentFilter = 'day'; renderOrders('day'); updateFilterButtons('day'); };
if (filterWeek) filterWeek.onclick = () => { currentFilter = 'week'; renderOrders('week'); updateFilterButtons('week'); };
if (filterMonth) filterMonth.onclick = () => { currentFilter = 'month'; renderOrders('month'); updateFilterButtons('month'); };

function updateFilterButtons(active) {
    const btns = document.querySelectorAll('.filter-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    if (active === 'day' && filterDay) filterDay.classList.add('active');
    if (active === 'week' && filterWeek) filterWeek.classList.add('active');
    if (active === 'month' && filterMonth) filterMonth.classList.add('active');
}

const chartDay = document.getElementById('chartDay');
const chartMonth = document.getElementById('chartMonth');
const chartYear = document.getElementById('chartYear');

if (chartDay) chartDay.onclick = () => { updateRevenueChart('week'); updateFilterChart('week'); };
if (chartMonth) chartMonth.onclick = () => { updateRevenueChart('month'); updateFilterChart('month'); };
if (chartYear) chartYear.onclick = () => { updateRevenueChart('year'); updateFilterChart('year'); };

function updateFilterChart(active) {
    const btns = document.querySelectorAll('.chart-filters .filter-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    if (active === 'week' && chartDay) chartDay.classList.add('active');
    if (active === 'month' && chartMonth) chartMonth.classList.add('active');
    if (active === 'year' && chartYear) chartYear.classList.add('active');
}

// ============ DESCARGAS ============
function downloadExcel() {
    if (!currentOrders.length) { showToast('No hay datos para descargar', 'error'); return; }
    
    let tableHtml = `
        <html><head><meta charset="UTF-8"><title>Reporte Ventas - Kiosco</title>
        <style>th{background:#4f46e5;color:white;padding:8px;}td{padding:8px;border:1px solid #ddd;}table{border-collapse:collapse;width:100%;}</style>
        </head><body>
            <h2>📊 REPORTE DE VENTAS - KIOSCO</h2>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-PE')}</p>
            <p><strong>Período:</strong> ${currentFilter === 'day' ? 'Hoy' : currentFilter === 'week' ? 'Esta Semana' : 'Este Mes'}</p>
            <table border="1"><thead><tr><th>#</th><th>Fecha</th><th>Cliente</th><th>Pago</th><th>Productos</th><th>Total</th><th>Estado</th></tr></thead><tbody>
    `;
    
    currentOrders.forEach((order, index) => {
        const productos = order.items.map(i => `${i.name} x${i.quantity}`).join('\n');
        tableHtml += `<tr>
            <td>${index+1}</td>
            <td>${new Date(order.date).toLocaleString('es-PE')}</td>
            <td>${order.customerName || 'Cliente'} (${order.customerPhone || ''})</div></td>
            <td>${order.paymentMethod || '-'}</td>
            <td>${productos}</td>
            <td>S/ ${(order.total || 0).toFixed(2)}</div></td>
            <td>${order.status}</td>
        </tr>`;
    });
    
    const totalIngresos = currentOrders.reduce((s, o) => s + (o.total || 0), 0);
    tableHtml += `<tr style="background:#f0f9ff;"><td colspan="5"><strong>TOTAL</strong></td><td colspan="2"><strong>S/ ${totalIngresos.toFixed(2)}</strong> (${currentOrders.length} pedidos)</div></tr>`;
    tableHtml += `</tbody></table><hr><small>Reporte generado por Kiosco Admin</small></body></html>`;
    
    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_ventas_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.xls`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('📥 Reporte descargado', 'success');
}

function downloadPDF() {
    if (!currentOrders.length) { showToast('No hay datos para descargar', 'error'); return; }
    
    const printWindow = window.open('', '_blank');
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Reporte Ventas - Kiosco</title>
        <style>body{font-family:Arial;padding:20px;}th{background:#4f46e5;color:white;padding:8px;}td{padding:8px;border:1px solid #ddd;}table{border-collapse:collapse;width:100%;}</style>
        </head><body><h1>📊 REPORTE DE VENTAS - KIOSCO</h1>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-PE')}</p>
        <p><strong>Período:</strong> ${currentFilter === 'day' ? 'Hoy' : currentFilter === 'week' ? 'Esta Semana' : 'Este Mes'}</p>
        <table border="1"><thead><tr><th>#</th><th>Fecha</th><th>Cliente</th><th>Pago</th><th>Productos</th><th>Total</th><th>Estado</th></tr></thead><tbody>`;
    
    currentOrders.forEach((order, index) => {
        const productos = order.items.map(i => `${i.name} x${i.quantity}`).join('<br>');
        html += `<tr>
            <td>${index+1}</td>
            <td>${new Date(order.date).toLocaleString('es-PE')}</td>
            <td>${order.customerName || 'Cliente'}<br>${order.customerPhone || ''}</div></td>
            <td>${order.paymentMethod || '-'}</td>
            <td>${productos}</td>
            <td>S/ ${(order.total || 0).toFixed(2)}</div></td>
            <td>${order.status}</td>
        </tr>`;
    });
    
    const totalIngresos = currentOrders.reduce((s, o) => s + (o.total || 0), 0);
    html += `<tr style="background:#f0f9ff;"><td colspan="5"><strong>TOTAL</strong></td><td colspan="2"><strong>S/ ${totalIngresos.toFixed(2)}</strong> (${currentOrders.length} pedidos)</div></tr>`;
    html += `</tbody></tr><div class="footer"><p>Reporte generado por Kiosco Admin</p></div></body></html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
    showToast('📥 Reporte enviado a impresión', 'success');
}

const downloadExcelBtn = document.getElementById('downloadReportBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');

if (downloadExcelBtn) downloadExcelBtn.onclick = downloadExcel;
if (downloadPdfBtn) downloadPdfBtn.onclick = downloadPDF;

// ============ TABS PRINCIPALES ============
document.querySelectorAll('.main-tab').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.main-tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.main-content').forEach(c => c.style.display = 'none');
        btn.classList.add('active');
        const mainContent = document.getElementById(`${btn.dataset.main}Main`);
        if (mainContent) mainContent.style.display = 'block';
        
        if (btn.dataset.main === 'reports') {
            updatePeakHoursChart();
            loadTopCustomers();
            loadProfitableProducts();
        }
        if (btn.dataset.main === 'activity') loadActivityLog();
        if (btn.dataset.main === 'settings') {
            loadSettings();
            loadPaymentMethods();
        }
        if (btn.dataset.main === 'customize') {
            loadThemeSettings();
            loadLogoPreview();
            loadBusinessName();
        }
        if (btn.dataset.main === 'sales') {
            loadSalesData(currentSalesFilter);
        }
    };
});

// ============ EVENTOS DE VENTAS ============
if (applySalesFilter) {
    applySalesFilter.onclick = () => {
        currentSalesFilter = salesFilter?.value || 'day';
        loadSalesData(currentSalesFilter);
    };
}

if (exportSalesBtn) {
    exportSalesBtn.onclick = exportSalesToExcel;
}

if (exportSalesPdfBtn) {
    exportSalesPdfBtn.onclick = exportSalesToPDF;
}

// ============ CONFIGURACIÓN ============
function loadSettings() {
    const settings = getSettings();
    if (businessRUCInput) businessRUCInput.value = settings.businessRUC || '';
    if (businessAddressInput) businessAddressInput.value = settings.businessAddress || '';
    if (deliveryCostInput) deliveryCostInput.value = settings.deliveryCost || 3;
    if (freeDeliveryMinInput) freeDeliveryMinInput.value = settings.freeDeliveryMin || 20;
}

if (saveSettingsBtn) {
    saveSettingsBtn.onclick = () => {
        const settings = {
            businessName: getSettings().businessName || 'Kiosco',
            businessPhone: getSettings().businessPhone || '914491874',
            businessRUC: businessRUCInput?.value || '',
            businessAddress: businessAddressInput?.value || '',
            deliveryCost: parseFloat(deliveryCostInput?.value || 3),
            freeDeliveryMin: parseFloat(freeDeliveryMinInput?.value || 20),
            paymentMethods: getSettings().paymentMethods || ['yape', 'plin', 'transferencia', 'efectivo'],
            scheduleStart: getSettings().scheduleStart || '08:00',
            scheduleEnd: getSettings().scheduleEnd || '22:00'
        };
        saveSettings(settings);
        showToast('✅ Configuración guardada', 'success');
        addActivityLog('Configuración', 'Se actualizó la configuración del negocio', 'general');
        loadPaymentMethods();
    };
}

const clearActivityBtn = document.getElementById('clearActivityLog');
if (clearActivityBtn) {
    clearActivityBtn.onclick = () => {
        showConfirm('¿Limpiar todo el registro de actividades?', () => {
            clearActivityLog();
            loadActivityLog();
            showToast('✅ Registro limpiado', 'success');
        });
    };
}

// ============ TABS DE PRODUCTOS/CATEGORÍAS ============
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const tabContent = document.getElementById(`${btn.dataset.tab}Tab`);
        if (tabContent) tabContent.classList.add('active');
    };
});

// ============ TEMA CLARO/OSCURO ============
if (themeToggle) {
    if (localStorage.getItem('kiosco_admin_theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('kiosco_admin_theme', isDark ? 'dark' : 'light');
        showToast(isDark ? '🌙 Modo oscuro activado' : '☀️ Modo claro activado', 'info');
        updateRevenueChart('week');
        updateTopProductsChart();
        updatePeakHoursChart();
    });
}

// ============ BOTÓN WHATSAPP FLOTANTE ============
function addWhatsAppFloat() {
    if (document.getElementById('adminWhatsAppFloat')) return;
    const btn = document.createElement('a');
    btn.id = 'adminWhatsAppFloat';
    btn.href = 'https://wa.me/51914491874';
    btn.target = '_blank';
    btn.innerHTML = '💬';
    btn.style.cssText = 'position:fixed; bottom:30px; left:30px; background:#25D366; color:white; width:55px; height:55px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:28px; text-decoration:none; box-shadow:0 4px 12px rgba(0,0,0,0.2); z-index:1000; transition:all 0.3s;';
    btn.onmouseover = () => btn.style.transform = 'scale(1.1)';
    btn.onmouseout = () => btn.style.transform = 'scale(1)';
    document.body.appendChild(btn);
}
addWhatsAppFloat();

// ============ ACTUALIZACIÓN EN TIEMPO REAL ============
window.addEventListener('productsUpdated', () => {
    if (dashboardDiv && dashboardDiv.style.display === 'block') loadAdminData();
});

window.addEventListener('ordersUpdated', () => {
    if (dashboardDiv && dashboardDiv.style.display === 'block') {
        renderOrders(currentFilter);
        updateStats();
        updateRevenueChart('week');
        updateTopProductsChart();
        updatePeakHoursChart();
        if (document.querySelector('.main-tab.active')?.dataset.main === 'sales') {
            loadSalesData(currentSalesFilter);
        }
    }
});

window.addEventListener('imagesUpdated', () => {
    if (dashboardDiv && dashboardDiv.style.display === 'block') loadAdminData();
});

window.addEventListener('themeUpdated', () => {
    loadThemeSettings();
});

window.addEventListener('logoUpdated', () => {
    loadLogoPreview();
    loadBusinessName();
});

// Cargar el script de Leaflet si no está disponible
if (typeof L === 'undefined') {
    const leafletScript = document.createElement('script');
    leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    leafletScript.onload = () => {
        console.log('Leaflet cargado correctamente');
    };
    document.head.appendChild(leafletScript);
}