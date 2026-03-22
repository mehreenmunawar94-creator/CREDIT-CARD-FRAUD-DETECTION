const Utils = {
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    formatDateTime(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    },

    formatNumber(num) {
        return new Intl.NumberFormat('en-US').format(num);
    },

    formatPercent(value) {
        return parseFloat(value).toFixed(1) + '%';
    },

    getFraudRiskLevel(probability) {
        if (probability >= 70) return { level: 'high', class: 'danger', label: 'High Risk' };
        if (probability >= 40) return { level: 'medium', class: 'warning', label: 'Medium Risk' };
        return { level: 'low', class: 'success', label: 'Low Risk' };
    }
};

window.Utils = Utils;