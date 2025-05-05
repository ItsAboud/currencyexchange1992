// عناصر DOM
const amountInput = document.getElementById('amount');
const fromCurrency = document.getElementById('from-currency');
const toCurrency = document.getElementById('to-currency');
const convertBtn = document.querySelector('.convert-btn');
const resultElement = document.getElementById('result');
const swapBtn = document.querySelector('.swap-btn');
const lastUpdateElement = document.getElementById('last-update');

// API URLs
const API_URL = 'https://open.er-api.com/v6/latest';

// دالة لتحديث وقت آخر تحديث
function updateTimestamp() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    lastUpdateElement.textContent = now.toLocaleDateString('ar-SA', options);
}

// دالة لتحويل العملات
async function convertCurrency() {
    const amount = amountInput.value;
    const from = fromCurrency.value;
    const to = toCurrency.value;

    if (!amount || amount <= 0) {
        resultElement.textContent = '0.00';
        return;
    }

    try {
        resultElement.textContent = 'جاري التحويل...';
        
        const response = await fetch(`${API_URL}/${from}`);
        if (!response.ok) {
            throw new Error(`خطأ في الاتصال: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.result === 'success') {
            const rate = data.rates[to];
            if (!rate) {
                throw new Error('العملة غير مدعومة');
            }
            const convertedAmount = (amount * rate).toFixed(2);
            resultElement.textContent = `${convertedAmount} ${to}`;
            updateTimestamp();
        } else {
            throw new Error(data.error || 'فشل في الحصول على سعر الصرف');
        }
    } catch (error) {
        console.error('Error:', error);
        resultElement.textContent = '0.00';
        alert(`حدث خطأ أثناء تحويل العملة: ${error.message}`);
    }
}

// دالة لتبديل العملات
function swapCurrencies() {
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
    convertCurrency();
}

// إضافة مستمعي الأحداث
convertBtn.addEventListener('click', convertCurrency);
swapBtn.addEventListener('click', swapCurrencies);

// تحويل تلقائي عند تغيير العملات
fromCurrency.addEventListener('change', convertCurrency);
toCurrency.addEventListener('change', convertCurrency);

// تحويل تلقائي عند إدخال المبلغ
amountInput.addEventListener('input', convertCurrency);

// تحديث تلقائي كل 5 دقائق
setInterval(convertCurrency, 5 * 60 * 1000);

// تحميل الصفحة
window.addEventListener('load', () => {
    amountInput.value = '1';
    convertCurrency();
    updateTimestamp();
}); 