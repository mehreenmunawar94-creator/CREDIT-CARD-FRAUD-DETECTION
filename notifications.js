const NotificationManager = {
    storageKey: 'fraudguard_notifications',
    getAll() {
        const n = localStorage.getItem(this.storageKey);
        return n ? JSON.parse(n) : [];
    },
    save(notifs) { localStorage.setItem(this.storageKey, JSON.stringify(notifs)); },
    add(notification) {
        const notifs = this.getAll();
        const newNotif = { id: Date.now()+Math.random().toString(36).substr(2,5), timestamp: new Date().toISOString(), read: false, ...notification };
        notifs.unshift(newNotif);
        if(notifs.length > 50) notifs.pop();
        this.save(notifs);
        this.updateBell();
        return newNotif;
    },
    markAsRead(id) {
        const notifs = this.getAll();
        const n = notifs.find(n=>n.id===id);
        if(n) n.read = true;
        this.save(notifs);
        this.updateBell();
    },
    markAllRead() {
        const notifs = this.getAll();
        notifs.forEach(n=>n.read=true);
        this.save(notifs);
        this.updateBell();
    },
    getUnreadCount() { return this.getAll().filter(n=>!n.read).length; },
    remove(id) {
        const notifs = this.getAll().filter(n=>n.id!==id);
        this.save(notifs);
        this.updateBell();
    },
    clearAll() { localStorage.removeItem(this.storageKey); this.updateBell(); },
    updateBell() {
        const count = this.getUnreadCount();
        const badge = document.querySelector('.notification-badge');
        if(badge) { badge.textContent = count; badge.style.display = count ? 'flex' : 'none'; }
        this.renderDropdown();
    },
    renderDropdown() {
        const list = document.querySelector('.notification-list');
        if(!list) return;
        const notifs = this.getAll();
        if(notifs.length===0) {
            list.innerHTML = '<div class="empty-state" style="padding:2rem; text-align:center;">No notifications</div>';
            return;
        }
        list.innerHTML = notifs.map(n => `
            <div class="notification-item ${n.read?'':'unread'}" data-id="${n.id}" onclick="NotificationManager.clickNotif('${n.id}')">
                <div class="icon"><i class="fas fa-exclamation-triangle"></i></div>
                <div class="content">
                    <div class="title">${n.title}</div>
                    <div class="message">${n.message}</div>
                    <div class="time">${Utils.formatTimeAgo(n.timestamp)}</div>
                </div>
            </div>
        `).join('');
    },
    clickNotif(id) {
        this.markAsRead(id);
        window.location.href = 'alerts.html';
    },
    generateFraudAlert(transaction) {
        const risk = Utils.getFraudRiskLevel(transaction.fraudProbability);
        this.add({ title:'Fraud Alert', message:`Transaction of ${Utils.formatCurrency(transaction.amount)} at ${transaction.merchant} flagged as ${risk.label}.`, transactionId:transaction.id, severity:risk.level });
    }
};

document.addEventListener('DOMContentLoaded', ()=>{
    if(!document.querySelector('.notification-bell')) {
        const header = document.querySelector('.page-header');
        if(header) {
            const bell = document.createElement('div');
            bell.className = 'notification-bell';
            bell.innerHTML = `<i class="fas fa-bell bell-icon"></i><span class="notification-badge">0</span><div class="notification-dropdown"><div class="notification-header"><h4>Notifications</h4><span class="mark-read" onclick="NotificationManager.markAllRead(); event.stopPropagation();">Mark all read</span></div><div class="notification-list"></div><div class="notification-footer"><a href="alerts.html">View all alerts</a></div></div>`;
            header.appendChild(bell);
            bell.addEventListener('click', (e) => { e.stopPropagation(); bell.querySelector('.notification-dropdown').classList.toggle('show'); });
            document.addEventListener('click', () => { bell.querySelector('.notification-dropdown').classList.remove('show'); });
        }
    }
    NotificationManager.updateBell();
    // Simulate new alerts every 30 seconds
    setInterval(() => {
        if(Math.random() > 0.7) {
            const mockTx = MockData.generateTransaction(Date.now(), 1);
            NotificationManager.generateFraudAlert(mockTx);
        }
    }, 30000);
});
window.NotificationManager = NotificationManager;