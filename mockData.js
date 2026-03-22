const merchantNames = ['Amazon', 'Walmart', 'Target', 'Best Buy', 'Apple', 'Starbucks', 'Netflix', 'Uber', 'Shell', 'McDonalds'];
const categories = ['Shopping', 'Dining', 'Travel', 'Entertainment', 'Gas', 'Groceries'];
const cardTypes = ['Visa', 'Mastercard', 'Amex', 'Discover'];
const locations = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami'];

function randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo = 30) {
    return new Date(Date.now() - randomInRange(0, daysAgo * 24 * 60 * 60 * 1000));
}

function generateTransactionId() {
    return 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function generateTransaction(index, daysAgo) {
    const date = randomDate(daysAgo);
    const amount = parseFloat((Math.random() * 1000 + 10).toFixed(2));
    const merchant = merchantNames[randomInRange(0, merchantNames.length - 1)];
    const category = categories[randomInRange(0, categories.length - 1)];
    const cardType = cardTypes[randomInRange(0, cardTypes.length - 1)];
    const location = locations[randomInRange(0, locations.length - 1)];
    const isFraud = Math.random() < 0.1;
    const fraudProbability = isFraud ? randomInRange(70, 95) : randomInRange(5, 30);
    
    return {
        id: generateTransactionId(),
        date: date,
        amount: amount,
        merchant: merchant,
        category: category,
        cardType: cardType,
        location: location,
        isFraud: isFraud,
        fraudProbability: fraudProbability,
        status: isFraud ? 'Flagged' : 'Approved'
    };
}

function generateTransactions(count = 500, daysAgo = 30) {
    return Array.from({ length: count }, (_, i) => generateTransaction(i, daysAgo));
}

function generateStatistics(transactions) {
    const total = transactions.length;
    const fraud = transactions.filter(t => t.isFraud).length;
    const legit = total - fraud;
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const fraudAmount = transactions.filter(t => t.isFraud).reduce((sum, t) => sum + t.amount, 0);
    
    return {
        totalTransactions: total,
        fraudDetected: fraud,
        legitimateTransactions: legit,
        totalAmount: totalAmount,
        fraudAmount: fraudAmount,
        savedAmount: fraudAmount,
        accuracy: ((legit / total) * 100).toFixed(1)
    };
}

function generateTimeSeriesData(days = 7) {
    return Array.from({ length: days }, (_, i) => {
        const d = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
        return {
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            total: randomInRange(50, 200),
            fraud: randomInRange(5, 30)
        };
    });
}

window.MockData = {
    generateTransactions,
    generateStatistics,
    generateTimeSeriesData,
    cardTypes,
    categories,
    locations
};