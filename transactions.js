let transactionsData = { all:[], filtered:[], currentPage:1, itemsPerPage:15, sortColumn:'date', sortDirection:'desc', selectedTransaction:null };

function initTransactions() { loadTransactions(); renderTransactionsTable(); setupTableSorting(); updateAlertCount(); }
function loadTransactions() { transactionsData.all = MockData.generateTransactions(500,30); transactionsData.filtered = [...transactionsData.all]; sortTransactions(); }
function setupTableSorting() { document.querySelectorAll('#transactionsTable th.sortable').forEach(h=>h.addEventListener('click',()=>handleSort(h.dataset.column))); }
function handleSort(col) {
    if(transactionsData.sortColumn===col) transactionsData.sortDirection = transactionsData.sortDirection==='asc'?'desc':'asc';
    else { transactionsData.sortColumn=col; transactionsData.sortDirection='asc'; }
    sortTransactions(); updateSortIndicators(); renderTransactionsTable();
}
function sortTransactions() {
    transactionsData.filtered.sort((a,b)=>{
        let aV=a[transactionsData.sortColumn], bV=b[transactionsData.sortColumn];
        if(transactionsData.sortColumn==='date') { aV=a.timestamp; bV=b.timestamp; }
        if(typeof aV==='string') { aV=aV.toLowerCase(); bV=bV.toLowerCase(); }
        if(aV<bV) return transactionsData.sortDirection==='asc'?-1:1;
        if(aV>bV) return transactionsData.sortDirection==='asc'?1:-1;
        return 0;
    });
}
function updateSortIndicators() {
    document.querySelectorAll('#transactionsTable th.sortable').forEach(h=>{
        h.classList.remove('sorted-asc','sorted-desc');
        if(h.dataset.column===transactionsData.sortColumn) h.classList.add(`sorted-${transactionsData.sortDirection}`);
    });
}
const handleSearch = Utils.debounce((q)=>{
    if(!q.trim()) transactionsData.filtered = [...transactionsData.all];
    else { q=q.toLowerCase(); transactionsData.filtered = transactionsData.all.filter(t=> t.id.toLowerCase().includes(q)||t.merchant.toLowerCase().includes(q)||t.cardNumber.toLowerCase().includes(q)||t.category.toLowerCase().includes(q)||t.location.toLowerCase().includes(q)); }
    applyFilters();
},300);
function applyFilters() {
    const status = document.getElementById('statusFilter').value;
    const amount = document.getElementById('amountFilter').value;
    const risk = document.getElementById('riskFilter').value;
    const search = document.getElementById('searchInput').value;
    let filtered = [...transactionsData.all];
    if(search.trim()) {
        const q=search.toLowerCase();
        filtered = filtered.filter(t=> t.id.toLowerCase().includes(q)||t.merchant.toLowerCase().includes(q)||t.cardNumber.toLowerCase().includes(q)||t.category.toLowerCase().includes(q)||t.location.toLowerCase().includes(q));
    }
    if(status!=='all') filtered = filtered.filter(t=> status==='flagged'?t.isFraud:!t.isFraud);
    if(amount!=='all') {
        filtered = filtered.filter(t=>{
            const a=t.amount;
            if(amount==='0-100') return a>=0&&a<=100;
            if(amount==='100-500') return a>100&&a<=500;
            if(amount==='500-1000') return a>500&&a<=1000;
            if(amount==='1000+') return a>1000;
            return true;
        });
    }
    if(risk!=='all') {
        filtered = filtered.filter(t=> Utils.getFraudRiskLevel(t.fraudProbability).level === risk);
    }
    transactionsData.filtered = filtered;
    transactionsData.currentPage = 1;
    sortTransactions();
    renderTransactionsTable();
}
function resetFilters() {
    document.getElementById('searchInput').value='';
    document.getElementById('statusFilter').value='all';
    document.getElementById('amountFilter').value='all';
    document.getElementById('riskFilter').value='all';
    transactionsData.filtered = [...transactionsData.all];
    transactionsData.currentPage=1;
    sortTransactions();
    renderTransactionsTable();
    Toast.info('Filters reset');
}
function renderTransactionsTable() {
    const tbody = document.getElementById('transactionsTableBody');
    const countEl = document.getElementById('transactionCount');
    if(!tbody) return;
    if(countEl) countEl.textContent = `(${Utils.formatNumber(transactionsData.filtered.length)} total)`;
    const paginated = getPaginatedData();
    if(paginated.length===0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:3rem;"><div class="empty-state"><div class="empty-icon"><i class="fas fa-search"></i></div><div class="empty-title">No transactions found</div><div class="empty-message">Try adjusting your filters</div></div></td></tr>';
        updatePagination();
        return;
    }
    tbody.innerHTML = paginated.map(t=>{
        const risk = Utils.getFraudRiskLevel(t.fraudProbability);
        return `<tr style="cursor:pointer;" onclick="showTransactionDetails('${t.id}')"><td><code style="font-size:0.75rem;">${t.id}</code></td><td>${Utils.formatDateTime(t.date)}</td><td><strong>${t.merchant}</strong></td><td>${t.category}</td><td><strong>${Utils.formatCurrency(t.amount)}</strong></td><td><i class="fab fa-cc-${t.cardType.toLowerCase().replace(' ','-')}"></i> ${t.cardType}</td><td>${t.location} ${t.isInternational?'<span class="badge badge-info" style="margin-left:0.5rem;">INT</span>':''}</td><td><div class="probability-bar"><div class="probability-fill ${risk.level}" style="width:${t.fraudProbability}%"></div></div><div class="probability-text text-${risk.class}" style="margin-top:0.25rem;">${t.fraudProbability}%</div></td><td><span class="badge badge-${risk.class}">${t.status}</span></td><td><button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); showTransactionDetails('${t.id}')" title="View Details"><i class="fas fa-eye"></i></button></td></tr>`;
    }).join('');
    updatePagination();
}
function getPaginatedData() { return transactionsData.filtered.slice((transactionsData.currentPage-1)*transactionsData.itemsPerPage, transactionsData.currentPage*transactionsData.itemsPerPage); }
function getTotalPages() { return Math.ceil(transactionsData.filtered.length/transactionsData.itemsPerPage); }
function updatePagination() {
    const total = getTotalPages();
    const cur = transactionsData.currentPage;
    const start = (cur-1)*transactionsData.itemsPerPage+1;
    const end = Math.min(start+transactionsData.itemsPerPage-1, transactionsData.filtered.length);
    const info = document.getElementById('paginationInfo');
    if(info) info.textContent = `Showing ${start} - ${end} of ${Utils.formatNumber(transactionsData.filtered.length)} transactions`;
    const controls = document.getElementById('paginationControls');
    if(!controls) return;
    let html = `<button class="pagination-btn" onclick="changePage(${cur-1})" ${cur===1?'disabled':''}><i class="fas fa-chevron-left"></i></button>`;
    const max = 5;
    let startPage = Math.max(1, cur-Math.floor(max/2));
    let endPage = Math.min(total, startPage+max-1);
    if(endPage-startPage < max-1) startPage = Math.max(1, endPage-max+1);
    if(startPage>1) { html+=`<button class="pagination-btn" onclick="changePage(1)">1</button>`; if(startPage>2) html+=`<span style="padding:0 0.5rem; color:var(--text-muted);">...</span>`; }
    for(let i=startPage; i<=endPage; i++) html+=`<button class="pagination-btn ${i===cur?'active':''}" onclick="changePage(${i})">${i}</button>`;
    if(endPage<total) { if(endPage<total-1) html+=`<span style="padding:0 0.5rem; color:var(--text-muted);">...</span>`; html+=`<button class="pagination-btn" onclick="changePage(${total})">${total}</button>`; }
    html+=`<button class="pagination-btn" onclick="changePage(${cur+1})" ${cur===total?'disabled':''}><i class="fas fa-chevron-right"></i></button>`;
    controls.innerHTML = html;
}
function changePage(p) { const t=getTotalPages(); if(p<1||p>t) return; transactionsData.currentPage=p; renderTransactionsTable(); document.querySelector('.table-container').scrollIntoView({behavior:'smooth'}); }
function showTransactionDetails(id) {
    const t = transactionsData.all.find(t=>t.id===id);
    if(!t) return;
    transactionsData.selectedTransaction = t;
    const modal = document.getElementById('transactionModal');
    const details = document.getElementById('transactionDetails');
    const risk = Utils.getFraudRiskLevel(t.fraudProbability);
    details.innerHTML = `<div class="grid grid-cols-2">${Object.entries(t).map(([k,v])=>`<div class="form-group"><label class="form-label">${k}</label><p>${v}</p></div>`).join('')}</div>`;
    modal.classList.add('active');
}
function closeModal() { document.getElementById('transactionModal').classList.remove('active'); transactionsData.selectedTransaction=null; }
function markAsLegitimate() { Toast.success(`Transaction ${transactionsData.selectedTransaction?.id} marked as legitimate`); closeModal(); }
function markAsFraud() { Toast.warning(`Transaction ${transactionsData.selectedTransaction?.id} flagged as fraud`); closeModal(); }
function refreshTransactions() { loadTransactions(); resetFilters(); Toast.success('Transactions refreshed'); }
function exportTransactions() { exportToCSV(transactionsData.filtered.map(t=>({ 'Transaction ID':t.id, 'Date':Utils.formatDateTime(t.date), 'Merchant':t.merchant, 'Category':t.category, 'Amount':t.amount, 'Card Type':t.cardType, 'Card Number':t.cardNumber, 'Location':t.location, 'Type':t.isInternational?'International':'Domestic', 'Fraud Probability':t.fraudProbability+'%', 'Status':t.status })), 'transactions-export.csv'); }
function updateAlertCount() { const ac = document.getElementById('alertCount'); if(ac) ac.textContent = transactionsData.all.filter(t=>t.isFraud).length; }

document.addEventListener('DOMContentLoaded', initTransactions);