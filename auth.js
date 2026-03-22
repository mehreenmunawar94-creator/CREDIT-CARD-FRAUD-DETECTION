const DEMO_USERS = {
    user: { email: 'user@example.com', password: 'user123', role: 'user', name: 'John Doe' },
    admin: { username: 'admin', password: 'admin123', role: 'admin', name: 'Admin User' }
};

class Auth {
    constructor() { this.storageKey = 'fraudguard_auth'; }
    login(identifier, password, role='user') {
        if(role==='user') {
            const user = DEMO_USERS.user;
            if(identifier===user.email && password===user.password) {
                this.setSession({ role:'user', name:user.name, email:user.email, loginTime:new Date().toISOString() });
                return { success:true, redirect:'check-card.html' };
            }
        } else if(role==='admin') {
            const admin = DEMO_USERS.admin;
            if(identifier===admin.username && password===admin.password) {
                this.setSession({ role:'admin', name:admin.name, username:admin.username, loginTime:new Date().toISOString() });
                return { success:true, redirect:'index.html' };
            }
        }
        return { success:false, message:'Invalid credentials' };
    }
    setSession(data) {
        const session = { ...data, authToken:this.generateToken(), expiresAt:new Date(Date.now()+24*60*60*1000).toISOString() };
        localStorage.setItem(this.storageKey, JSON.stringify(session));
    }
    getSession() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if(!data) return null;
            const session = JSON.parse(data);
            if(new Date(session.expiresAt) < new Date()) { this.logout(); return null; }
            return session;
        } catch(e){ return null; }
    }
    isAuthenticated() { return this.getSession() !== null; }
    isAdmin() { const s=this.getSession(); return s && s.role==='admin'; }
    isUser() { const s=this.getSession(); return s && s.role==='user'; }
    getCurrentUser() { return this.getSession(); }
    logout() { localStorage.removeItem(this.storageKey); window.location.href='home.html'; }
    requireAuth(requiredRole=null) {
        const session = this.getSession();
        if(!session) { window.location.href='login.html'; return false; }
        if(requiredRole && session.role !== requiredRole) {
            if(session.role==='admin') window.location.href='index.html';
            else window.location.href='check-card.html';
            return false;
        }
        return true;
    }
    generateToken() { return 'token_'+Math.random().toString(36).substr(2)+Date.now().toString(36); }
    updateUserDisplay() {
        const session = this.getSession();
        if(!session) return;
        document.querySelectorAll('.user-name').forEach(el=> el.textContent = session.name || session.username || session.email);
        document.querySelectorAll('.user-role').forEach(el=> el.textContent = session.role==='admin'?'Administrator':'User');
    }
}
const auth = new Auth();
window.auth = auth;
window.handleLogout = function() { if(confirm('Are you sure you want to logout?')) auth.logout(); };
document.addEventListener('DOMContentLoaded', ()=> auth.updateUserDisplay() );