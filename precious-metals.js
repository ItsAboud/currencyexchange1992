// عناصر DOM
const amountInput = document.getElementById('amount');
const fromMetal = document.getElementById('from-metal');
const toCurrency = document.getElementById('to-currency');
const convertBtn = document.querySelector('.convert-btn');
const resultElement = document.getElementById('result');
const swapBtn = document.querySelector('.swap-btn');
const lastUpdateElement = document.getElementById('last-update');

// API URLs
const API_URL = 'https://open.er-api.com/v6/latest';

// Theme switching functionality
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeIcon = themeToggleBtn.querySelector('i');

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

// Theme toggle click handler
themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

// Update theme icon
function updateThemeIcon(theme) {
    themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// دالة لتحديث وقت آخر تحديث
function updateTimestamp() {
    const now = new Date();
    
    // التاريخ الهجري
    const hijriOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        calendar: 'islamic'
    };
    const hijriDate = now.toLocaleDateString('ar-SA', hijriOptions);
    
    // عرض التاريخ الهجري
    lastUpdateElement.innerHTML = `
        <div class="date-container">
            <div class="hijri-date">
                <span class="date-value">${hijriDate}</span>
            </div>
        </div>
    `;
}

// دالة لتحويل المعادن الثمينة
async function convertMetal() {
    const amount = amountInput.value;
    const from = fromMetal.value;
    const to = toCurrency.value;

    if (!amount || amount <= 0) {
        resultElement.textContent = '0.00';
        return;
    }

    try {
        resultElement.textContent = 'جاري التحويل...';
        
        // الحصول على سعر الذهب أو الفضة بالدولار الأمريكي
        const response = await fetch(`${API_URL}/USD`);
        if (!response.ok) {
            throw new Error(`خطأ في الاتصال: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.result === 'success') {
            // تحويل من الدولار الأمريكي إلى العملة المطلوبة
            const usdToTargetRate = data.rates[to];
            if (!usdToTargetRate) {
                throw new Error('العملة غير مدعومة');
            }

            // أسعار الذهب والفضة بالدولار الأمريكي للأونصة
            const metalPrices = {
                'XAU': 2000, // سعر الذهب (يمكن تحديثه من API حقيقي)
                'XAG': 25    // سعر الفضة (يمكن تحديثه من API حقيقي)
            };

            // تحويل من الأونصة إلى الجرام (1 أونصة = 31.1034768 جرام)
            const ounceToGram = 31.1034768;
            
            // حساب السعر النهائي
            const metalPriceInUSD = metalPrices[from] / ounceToGram;
            const convertedAmount = (amount * metalPriceInUSD * usdToTargetRate).toFixed(2);
            
            resultElement.textContent = `${convertedAmount} ${to}`;
            updateTimestamp();
        } else {
            throw new Error(data.error || 'فشل في الحصول على سعر الصرف');
        }
    } catch (error) {
        console.error('Error:', error);
        resultElement.textContent = '0.00';
        alert(`حدث خطأ أثناء التحويل: ${error.message}`);
    }
}

// دالة لتبديل المعادن والعملات
function swapCurrencies() {
    const temp = fromMetal.value;
    fromMetal.value = toCurrency.value;
    toCurrency.value = temp;
    convertMetal();
}

// إضافة مستمعي الأحداث
convertBtn.addEventListener('click', convertMetal);
swapBtn.addEventListener('click', swapCurrencies);

// تحويل تلقائي عند تغيير العملات
fromMetal.addEventListener('change', convertMetal);
toCurrency.addEventListener('change', convertMetal);

// تحويل تلقائي عند إدخال المبلغ
amountInput.addEventListener('input', convertMetal);

// تحديث تلقائي كل 5 دقائق
setInterval(convertMetal, 5 * 60 * 1000);

// تحميل الصفحة
window.addEventListener('load', () => {
    amountInput.value = '1';
    convertMetal();
    updateTimestamp();
}); 
