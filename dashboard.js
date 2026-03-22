let dashboardData = { transactions:[], statistics:{}, timeSeriesData:[], hourlyData:[], alerts:[] };
let charts = { trend:null, distribution:null, hourly:null };

function initDashboard() {
    loadDashboardData();
    renderStatistics();
    renderCharts();
    renderRecentAlerts();
    setInterval(refreshDashboard, 30000);
}

function loadDashboardData() {
    dashboardData.transactions = MockData.generateTransactions(500, 30);
    dashboardData.statistics = MockData.generateStatistics(dashboardData.transactions);
    dashboardData.timeSeriesData = MockData.generateTimeSeriesData(7);
    dashboardData.hourlyData = MockData.generateHourlyData();
    dashboardData.alerts = dashboardData.transactions.filter(t=>t.isFraud).slice(0,10);
    const alertCount = document.getElementById('alertCount');
    if(alertCount) alertCount.textContent = dashboardData.transactions.filter(t=>t.isFraud).length;
}

function renderStatistics() {
    const stats = dashboardData.statistics;
    const statsGrid = document.getElementById('statsGrid');
    if(!statsGrid) return;
    const cards = [
        { title:'Total Transactions', value:Utils.formatNumber(stats.totalTransactions), icon:'fa-credit-card', trend:'+12.5%', trendUp:true, gradient:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
        { title:'Fraud Detected', value:Utils.formatNumber(stats.fraudDetected), icon:'fa-exclamation-triangle', trend:'-8.3%', trendUp:false, gradient:'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
        { title:'Detection Accuracy', value:Utils.formatPercent(stats.accuracy), icon:'fa-bullseye', trend:'+2.1%', trendUp:true, gradient:'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
        { title:'Amount Saved', value:Utils.formatCurrency(stats.savedAmount), icon:'fa-shield-halved', trend:'+15.7%', trendUp:true, gradient:'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }
    ];
    statsGrid.innerHTML = cards.map(s=>`
        <div class="stat-card animate-slide-up">
            <div class="stat-header"><span class="stat-title">${s.title}</span><div class="stat-icon" style="background:${s.gradient};"><i class="fas ${s.icon}"></i></div></div>
            <div class="stat-value">${s.value}</div>
            <div class="stat-footer"><span class="stat-trend ${s.trendUp?'up':'down'}"><i class="fas fa-arrow-${s.trendUp?'up':'down'}"></i> ${s.trend}</span><span class="text-muted">vs last month</span></div>
        </div>
    `).join('');
}

function renderCharts() { renderTrendChart(); renderDistributionChart(); renderHourlyChart(); }

function renderTrendChart() {
    const ctx = document.getElementById('trendChart');
    if(!ctx) return;
    const data = dashboardData.timeSeriesData;
    if(charts.trend) charts.trend.destroy();
    charts.trend = new Chart(ctx, {
        type:'line',
        data:{ labels:data.map(d=>d.date), datasets:[
            { label:'Total Transactions', data:data.map(d=>d.total), borderColor:'rgb(102,126,234)', backgroundColor:'rgba(102,126,234,0.1)', tension:0.4, fill:true },
            { label:'Fraudulent', data:data.map(d=>d.fraud), borderColor:'rgb(245,87,108)', backgroundColor:'rgba(245,87,108,0.1)', tension:0.4, fill:true }
        ]},
        options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#e5e7eb' } } }, scales:{ y:{ grid:{ color:'rgba(255,255,255,0.05)' }, ticks:{ color:'#9ca3af' } }, x:{ grid:{ display:false }, ticks:{ color:'#9ca3af' } } } }
    });
}

function renderDistributionChart() {
    const ctx = document.getElementById('distributionChart');
    if(!ctx) return;
    const stats = dashboardData.statistics;
    if(charts.distribution) charts.distribution.destroy();
    charts.distribution = new Chart(ctx, {
        type:'doughnut',
        data:{ labels:['Legitimate','Fraudulent'], datasets:[{ data:[stats.legitimateTransactions, stats.fraudDetected], backgroundColor:['rgba(67,233,123,0.8)','rgba(245,87,108,0.8)'], borderColor:['rgba(67,233,123,1)','rgba(245,87,108,1)'], borderWidth:2 }] },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#e5e7eb' } } } }
    });
}

function renderHourlyChart() {
    const ctx = document.getElementById('hourlyChart');
    if(!ctx) return;
    const data = dashboardData.hourlyData;
    if(charts.hourly) charts.hourly.destroy();
    charts.hourly = new Chart(ctx, {
        type:'bar',
        data:{ labels:data.map(d=>d.label), datasets:[{ label:'Transactions', data:data.map(d=>d.transactions), backgroundColor:data.map(d=>`rgba(245,87,108,${0.3+d.fraudRate/100*0.5})`), borderColor:'rgba(245,87,108,1)', borderWidth:1 }] },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ y:{ grid:{ color:'rgba(255,255,255,0.05)' }, ticks:{ color:'#9ca3af' } }, x:{ grid:{ display:false }, ticks:{ color:'#9ca3af' } } } }
    });
}

function renderRecentAlerts() {
    const tbody = document.getElementById('recentAlertsTable');
    if(!tbody) return;
    const alerts = dashboardData.alerts;
    if(alerts.length===0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem;"><div class="empty-state"><div class="empty-icon"><i class="fas fa-check-circle"></i></div><div class="empty-message">No fraud alerts detected</div></div></td></tr>';
        return;
    }
    tbody.innerHTML = alerts.map(t=>{
        const risk = Utils.getFraudRiskLevel(t.fraudProbability);
        return `<tr onclick="showTransactionDetails('${t.id}')"><td><strong>${t.id}</strong></td><td>${Utils.formatDateTime(t.date)}</td><td>${t.merchant}</td><td><strong>${Utils.formatCurrency(t.amount)}</strong></td><td><div class="probability-bar"><div class="probability-fill ${risk.level}" style="width:${t.fraudProbability}%"></div></div><div class="probability-text text-${risk.class}">${t.fraudProbability}%</div></td><td><span class="badge badge-${risk.class}">${t.status}</span></td><td><button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); showTransactionDetails('${t.id}')"><i class="fas fa-eye"></i></button></td></tr>`;
    }).join('');
}

function showTransactionDetails(id) {
    const t = dashboardData.transactions.find(t=>t.id===id);
    if(!t) return;
    const modal = document.getElementById('transactionModal');
    const details = document.getElementById('transactionDetails');
    const risk = Utils.getFraudRiskLevel(t.fraudProbability);
    details.innerHTML = `<div class="grid grid-cols-2">${Object.entries(t).map(([k,v])=>`<div class="form-group"><label class="form-label">${k}</label><p>${v}</p></div>`).join('')}</div>`;
    modal.classList.add('active');
}

function closeTransactionModal() { document.getElementById('transactionModal').classList.remove('active'); }
function refreshDashboard() { loadDashboardData(); renderStatistics(); renderCharts(); renderRecentAlerts(); Toast.success('Dashboard refreshed'); }
function updateTrendPeriod(days) { dashboardData.timeSeriesData = MockData.generateTimeSeriesData(parseInt(days)); renderTrendChart(); }
function exportDashboardData() { exportToCSV(dashboardData.alerts.map(t=>({ 'Transaction ID':t.id, 'Date':Utils.formatDateTime(t.date), 'Merchant':t.merchant, 'Amount':t.amount, 'Fraud Probability':t.fraudProbability+'%', 'Status':t.status, 'Card Type':t.cardType, 'Location':t.location })), 'fraud-alerts-report.csv'); }

document.addEventListener('DOMContentLoaded', initDashboard);