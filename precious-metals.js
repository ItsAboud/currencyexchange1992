// عناصر DOM
const amountInput = document.getElementById('amount');
const fromMetal = document.getElementById('from-metal');
const toCurrency = document.getElementById('to-currency');
const convertBtn = document.querySelector('.convert-btn');
const resultElement = document.getElementById('result');
const swapBtn = document.querySelector('.swap-btn');
const lastUpdateElement = document.getElementById('last-update');
const trendChart = document.getElementById('trendChart');

// متغيرات الرسم البياني
let chart = null;
let priceHistory = [];

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
        calendar: 'islamic'
    };
    
    // الوقت
    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    
    const hijriDate = now.toLocaleDateString('ar-SA', hijriOptions);
    const time = now.toLocaleTimeString('ar-SA', timeOptions);
    
    // عرض التاريخ الهجري والوقت
    lastUpdateElement.innerHTML = `
        <div class="date-container">
            <div class="hijri-date">
                <span class="date-value">${hijriDate}</span>
                <span class="time-value">${time}</span>
            </div>
        </div>
    `;
}

// دالة لإنشاء الرسم البياني
function createChart(labels, data) {
    if (chart) {
        chart.destroy();
    }

    const ctx = trendChart.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    
    // تحديد لون الرسم البياني بناءً على اتجاه السعر
    const isUpward = data[data.length - 1] > data[0];
    const chartColor = isUpward ? '#2ecc71' : '#e74c3c';
    
    gradient.addColorStop(0, chartColor + '80'); // 50% opacity
    gradient.addColorStop(1, chartColor + '20'); // 10% opacity

    // حساب الحد الأدنى والأقصى للقيم مع هامش مناسب
    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const padding = (maxValue - minValue) * 0.05; // تقليل الهامش إلى 5%

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'سعر الصرف',
                data: data,
                borderColor: chartColor,
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: chartColor,
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y;
                            const change = context.dataset.data[context.dataIndex] - context.dataset.data[0];
                            const changePercent = ((change / context.dataset.data[0]) * 100).toFixed(2);
                            const changeSymbol = change >= 0 ? '+' : '';
                            return [
                                `السعر: ${value.toFixed(2)} ${toCurrency.value}`,
                                `التغيير: ${changeSymbol}${changePercent}%`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    display: false,
                    min: minValue - padding,
                    max: maxValue + padding
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// دالة لتحديث الرسم البياني
function updateChart(newPrice) {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit'
    });
    
    // تحديث التاريخ فقط إذا كان السعر مختلفاً
    if (priceHistory.length === 0 || priceHistory[priceHistory.length - 1].price !== newPrice) {
        priceHistory.push({
            time: timeLabel,
            price: newPrice
        });

        // الاحتفاظ بآخر 20 نقطة
        if (priceHistory.length > 20) {
            priceHistory.shift();
        }

        const labels = priceHistory.map(point => point.time);
        const data = priceHistory.map(point => point.price);

        createChart(labels, data);
    }
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

            // أسعار الذهب والفضة بالدولار الأمريكي للأونصة (أسعار اليوم)
            const metalPrices = {
                'XAU': 2324.50, // سعر الذهب للأونصة
                'XAG': 27.15    // سعر الفضة للأونصة
            };

            // تحويل من الأونصة إلى الجرام (1 أونصة = 31.1034768 جرام)
            const ounceToGram = 31.1034768;
            
            // حساب السعر النهائي
            const metalPriceInUSD = metalPrices[from] / ounceToGram;
            const convertedAmount = (amount * metalPriceInUSD * usdToTargetRate).toFixed(2);
            
            resultElement.textContent = `${convertedAmount} ${to}`;
            updateTimestamp();
            
            // تحديث الرسم البياني فقط إذا كان السعر مختلفاً
            updateChart(parseFloat(convertedAmount));
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

// دالة لتحديث أسعار الصرف
async function updateExchangeRates() {
    try {
        resultElement.textContent = 'جاري تحديث الأسعار...';
        await convertMetal();
    } catch (error) {
        console.error('Error updating rates:', error);
        alert('حدث خطأ أثناء تحديث الأسعار');
    }
}

// إضافة زر التحديث إلى الصفحة
const refreshButton = document.createElement('button');
refreshButton.className = 'refresh-btn';
refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> تحديث الأسعار';
refreshButton.onclick = updateExchangeRates;

// إضافة الزر قبل زر التحويل
const converterBox = document.querySelector('.converter-box');
converterBox.insertBefore(refreshButton, convertBtn); 
