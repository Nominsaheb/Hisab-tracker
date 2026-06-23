/* ============================================
   আয়-ব্যয়ের হিসাব - প্রিমিয়াম ট্র্যাকার
   ফাইল: script.js
   বিবরণ: অ্যাপের সকল JavaScript ফাংশন এখানে সংরক্ষিত
   ============================================ */

// ========== Chart.js প্লাগইন রেজিস্টার ==========
Chart.register(ChartDataLabels);

// ========== ডাটা স্টোরেজ ভেরিয়েবল ==========
let data = JSON.parse(localStorage.getItem('hisab_local_data') || '[]');
let categories = JSON.parse(localStorage.getItem('hisab_categories') || null);
if (!categories) {
    categories = {
        income: ['বেতন/ব্যবসা', 'ফ্রিল্যান্স', 'বিনিয়োগ', 'ভাড়া আয়', 'অন্যান্য আয়'],
        expense: ['বাড়ি ভাড়া', 'খাদ্য ও মুদি', 'পরিবহন', 'স্বাস্থ্য', 'শিক্ষা', 'বিনোদন', 'ইউটিলিটি', 'পোশাক', 'সঞ্চয়', 'অন্যান্য ব্যয়']
    };
    localStorage.setItem('hisab_categories', JSON.stringify(categories));
}
let paymentMethods = JSON.parse(localStorage.getItem('paymentMethods')) || ['নগদ', 'বিকাশ', 'ব্যাংক ট্রান্সফার', 'রকেট', 'কার্ড'];
let recurringRules = JSON.parse(localStorage.getItem('recurringRules')) || [];
let savingsGoals = JSON.parse(localStorage.getItem('savingsGoals')) || [];
let investments = JSON.parse(localStorage.getItem('investments')) || [];
let loans = JSON.parse(localStorage.getItem('hisab_loans')) || [];

// ========== সেটিংস ভেরিয়েবল ==========
let settings = JSON.parse(localStorage.getItem('hisab_settings')) || {
    language: 'bn',
    fontSize: 14,
    theme: 'light',
    primaryColor: '#6366F1',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    customColors: []
};

// ========== গ্রেডিয়েন্ট প্রিসেট ==========
const gradientPresets = [
    { 
        name: 'Purple Dream', 
        value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    { 
        name: 'Sunset Orange', 
        value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    { 
        name: 'Ocean Blue', 
        value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    { 
        name: 'Forest Green', 
        value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    },
    { 
        name: 'Sunrise Gold', 
        value: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'
    },
    { 
        name: 'Neon Pink', 
        value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    }
];

// ========== প্রিসেট কালার লিস্ট ==========
const presetColors = [
    { name: 'Charcoal', value: '#374151' },
    { name: 'Purple', value: '#6366F1' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Orange', value: '#F59E0B' },
    { name: 'Teal', value: '#14B8A6' }
];

// ========== কনস্ট্যান্ট ও হেলপার ফাংশন ==========
const ICONS = {
    'বেতন/ব্যবসা': '💼', 'ফ্রিল্যান্স': '💻', 'বিনিয়োগ': '📈', 'ভাড়া আয়': '🏠', 'অন্যান্য আয়': '🎁',
    'বাড়ি ভাড়া': '🏡', 'খাদ্য ও মুদি': '🛒', 'পরিবহন': '🚌', 'স্বাস্থ্য': '🏥', 'শিক্ষা': '📚',
    'বিনোদন': '🎬', 'ইউটিলিটি': '💡', 'পোশাক': '👗', 'সঞ্চয়': '💰', 'অন্যান্য ব্যয়': '📦'
};
const MONTHS_BN = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT_BN = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
const MONTHS_SHORT_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmt = n => '৳ ' + n.toLocaleString('bn-BD');
const now = new Date();
let currentYear = now.getFullYear(), currentMonth = now.getMonth(), activeNav = 0, txnFilter = 'all', searchQuery = '';
let monthlyChart = null, categoryChart = null, calcExpression = '';

// ========== ল্যাঙ্গুয়েজ অনুযায়ী হেলপার ফাংশন ==========
function getMonths() {
    return settings.language === 'bn' ? MONTHS_BN : MONTHS_EN;
}
function getMonthsShort() {
    return settings.language === 'bn' ? MONTHS_SHORT_BN : MONTHS_SHORT_EN;
}
function getMonthName(index) {
    return settings.language === 'bn' ? MONTHS_BN[index] : MONTHS_EN[index];
}
function getMonthShort(index) {
    return settings.language === 'bn' ? MONTHS_SHORT_BN[index] : MONTHS_SHORT_EN[index];
}
function getLocale() {
    return settings.language === 'bn' ? 'bn-BD' : 'en-US';
}
function getDateString(date) {
    return date.toLocaleDateString(getLocale(), { year: 'numeric', month: 'long', day: 'numeric' });
}
function getTimeString(date) {
    return date.toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ========== সেভ ফাংশনসমূহ ==========
const saveData = () => {
    localStorage.setItem('hisab_local_data', JSON.stringify(data));
    localStorage.setItem('hisab_categories', JSON.stringify(categories));
};
const savePaymentMethods = () => localStorage.setItem('paymentMethods', JSON.stringify(paymentMethods));
const saveRecurringRules = () => localStorage.setItem('recurringRules', JSON.stringify(recurringRules));
const saveSavingsGoals = () => localStorage.setItem('savingsGoals', JSON.stringify(savingsGoals));
const saveInvestments = () => localStorage.setItem('investments', JSON.stringify(investments));
const saveLoans = () => localStorage.setItem('hisab_loans', JSON.stringify(loans));
const saveSettings = () => localStorage.setItem('hisab_settings', JSON.stringify(settings));
const getIcon = cat => ICONS[cat] || '📌';
const showToast = msg => {
    let t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
};

// ========== HTML এসকেপ ফাংশন ==========
const escapeHtml = (str) => {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
};

// ========== কালার হেলপার ফাংশন ==========
function adjustColor(hex, percent) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.max(0, Math.min(255, r + percent));
    g = Math.max(0, Math.min(255, g + percent));
    b = Math.max(0, Math.min(255, b + percent));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ========== গ্রেডিয়েন্ট ফাংশন ==========
function setGradient(gradientValue) {
    settings.gradient = gradientValue;
    saveSettings();
    
    document.documentElement.style.setProperty('--gradient-primary', gradientValue);
    document.documentElement.style.setProperty('--header-bg', gradientValue);
    
    const header = document.getElementById('mainHeader');
    if (header) header.style.background = gradientValue;
    
    showToast('🎨 ' + (settings.language === 'bn' ? 'গ্রেডিয়েন্ট আপডেট হয়েছে' : 'Gradient updated'));
    renderSettingsPage();
}

// ========== প্রাইমারি কালার পরিবর্তন ফাংশন ==========
function setPrimaryColor(color) {
    settings.primaryColor = color;
    saveSettings();
    
    document.documentElement.style.setProperty('--accent', color);
    document.documentElement.style.setProperty('--accent-light', color + '33');
    
    const gradient = `linear-gradient(135deg, ${color}, ${adjustColor(color, -20)})`;
    document.documentElement.style.setProperty('--gradient-primary', gradient);
    document.documentElement.style.setProperty('--header-bg', gradient);
    
    const header = document.getElementById('mainHeader');
    if (header) header.style.background = gradient;
    
    showToast('🎨 ' + (settings.language === 'bn' ? 'কালার আপডেট হয়েছে' : 'Color updated'));
    renderSettingsPage();
}

// ========== ব্যাকগ্রাউন্ড ইমেজ ফাংশন ==========
function setBackgroundImage(imageData) {
    if (!imageData) {
        localStorage.removeItem('bgImage');
        document.documentElement.style.setProperty('--bg-image', 'none');
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundSize = 'auto';
        document.body.style.backgroundAttachment = 'auto';
        document.body.classList.remove('has-bg-image');
        showToast('🖼️ ' + (settings.language === 'bn' ? 'ব্যাকগ্রাউন্ড ইমেজ রিমুভ করা হয়েছে' : 'Background image removed'));
        renderSettingsPage();
        return;
    }
    
    localStorage.setItem('bgImage', imageData);
    document.documentElement.style.setProperty('--bg-image', `url(${imageData})`);
    document.body.style.backgroundImage = `url(${imageData})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.classList.add('has-bg-image');
    
    showToast('🖼️ ' + (settings.language === 'bn' ? 'ব্যাকগ্রাউন্ড ইমেজ সেট করা হয়েছে' : 'Background image set'));
    renderSettingsPage();
}

// ========== কাস্টম কালার ফাংশন ==========
function addCustomColor(color) {
    if (!settings.customColors) settings.customColors = [];
    
    const exists = settings.customColors.some(c => c.toLowerCase() === color.toLowerCase());
    if (exists) {
        showToast('⚠️ ' + (settings.language === 'bn' ? 'এই কালার ইতিমধ্যে আছে' : 'This color already exists'));
        return;
    }
    
    settings.customColors.push(color);
    saveSettings();
    showToast('✅ ' + (settings.language === 'bn' ? 'কাস্টম কালার যোগ হয়েছে' : 'Custom color added'));
    renderSettingsPage();
}

function removeCustomColor(color) {
    if (!settings.customColors) return;
    settings.customColors = settings.customColors.filter(c => c !== color);
    saveSettings();
    showToast('🗑️ ' + (settings.language === 'bn' ? 'কাস্টম কালার মুছে ফেলা হয়েছে' : 'Custom color removed'));
    renderSettingsPage();
}

function openCustomColorPicker() {
    const isBn = settings.language === 'bn';
    Swal.fire({
        title: isBn ? '🎨 কাস্টম কালার যোগ করুন' : '🎨 Add Custom Color',
        html: `
            <div style="text-align: center; padding: 10px 0;">
                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-weight: 600; margin-bottom: 8px; color: var(--text-secondary);">
                        ${isBn ? 'কালার পিকার থেকে সিলেক্ট করুন' : 'Select from color picker'}
                    </label>
                    <input type="color" id="customColorPicker" value="#6366F1" style="
                        width: 100px;
                        height: 100px;
                        padding: 0;
                        border: 3px solid var(--border);
                        border-radius: 16px;
                        cursor: pointer;
                        background: none;
                    ">
                </div>
                
                <div style="margin: 16px 0; position: relative;">
                    <div style="
                        position: absolute;
                        left: 50%;
                        top: 50%;
                        transform: translate(-50%, -50%);
                        color: var(--text-muted);
                        font-size: 12px;
                        background: var(--bg-card);
                        padding: 0 8px;
                        z-index: 1;
                    ">${isBn ? 'অথবা হেক্স কোড লিখুন' : 'Or enter hex code'}</div>
                    <hr style="border: none; border-top: 1px solid var(--border);">
                </div>
                
                <div style="display: flex; gap: 10px; align-items: center; justify-content: center; flex-wrap: wrap;">
                    <input type="text" id="customColorHex" placeholder="#6366F1" value="#6366F1" style="
                        width: 160px;
                        padding: 10px 14px;
                        border: 2px solid var(--border);
                        border-radius: 12px;
                        font-size: 16px;
                        font-family: monospace;
                        background: var(--bg-card);
                        color: var(--text-primary);
                        text-transform: uppercase;
                        text-align: center;
                        letter-spacing: 1px;
                        outline: none;
                        transition: all 0.3s ease;
                    " oninput="document.getElementById('customColorPicker').value = this.value; document.getElementById('colorPreview').style.background = this.value;">
                    <div id="colorPreview" style="
                        width: 48px;
                        height: 48px;
                        border-radius: 12px;
                        background: #6366F1;
                        border: 2px solid var(--border);
                        transition: all 0.3s ease;
                    "></div>
                </div>
                
                <div style="margin-top: 12px; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
                    <span style="
                        font-size: 11px;
                        color: var(--text-muted);
                        background: var(--bg-elevated);
                        padding: 4px 10px;
                        border-radius: 20px;
                        cursor: pointer;
                    " onclick="document.getElementById('customColorHex').value='#FF6B6B'; document.getElementById('customColorPicker').value='#FF6B6B'; document.getElementById('colorPreview').style.background='#FF6B6B';">#FF6B6B</span>
                    <span style="
                        font-size: 11px;
                        color: var(--text-muted);
                        background: var(--bg-elevated);
                        padding: 4px 10px;
                        border-radius: 20px;
                        cursor: pointer;
                    " onclick="document.getElementById('customColorHex').value='#4ECDC4'; document.getElementById('customColorPicker').value='#4ECDC4'; document.getElementById('colorPreview').style.background='#4ECDC4';">#4ECDC4</span>
                    <span style="
                        font-size: 11px;
                        color: var(--text-muted);
                        background: var(--bg-elevated);
                        padding: 4px 10px;
                        border-radius: 20px;
                        cursor: pointer;
                    " onclick="document.getElementById('customColorHex').value='#FFE66D'; document.getElementById('customColorPicker').value='#FFE66D'; document.getElementById('colorPreview').style.background='#FFE66D';">#FFE66D</span>
                    <span style="
                        font-size: 11px;
                        color: var(--text-muted);
                        background: var(--bg-elevated);
                        padding: 4px 10px;
                        border-radius: 20px;
                        cursor: pointer;
                    " onclick="document.getElementById('customColorHex').value='#A8E6CF'; document.getElementById('customColorPicker').value='#A8E6CF'; document.getElementById('colorPreview').style.background='#A8E6CF';">#A8E6CF</span>
                    <span style="
                        font-size: 11px;
                        color: var(--text-muted);
                        background: var(--bg-elevated);
                        padding: 4px 10px;
                        border-radius: 20px;
                        cursor: pointer;
                    " onclick="document.getElementById('customColorHex').value='#DDA0DD'; document.getElementById('customColorPicker').value='#DDA0DD'; document.getElementById('colorPreview').style.background='#DDA0DD';">#DDA0DD</span>
                </div>
                
                <div style="margin-top: 12px; font-size: 12px; color: var(--text-muted);">
                    💡 ${isBn ? 'হেক্স কোড লিখুন (যেমন: #FF0000) অথবা পিকার ব্যবহার করুন' : 'Enter hex code (e.g. #FF0000) or use picker'}
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: isBn ? '✅ যোগ করুন' : '✅ Add',
        cancelButtonText: isBn ? 'বাতিল' : 'Cancel',
        customClass: { popup: 'responsive-payment-popup' },
        didOpen: () => {
            const picker = document.getElementById('customColorPicker');
            const hexInput = document.getElementById('customColorHex');
            const preview = document.getElementById('colorPreview');
            
            picker.addEventListener('input', function() {
                hexInput.value = this.value.toUpperCase();
                preview.style.background = this.value;
            });
            
            hexInput.addEventListener('input', function() {
                let val = this.value.trim();
                if (val && !val.startsWith('#')) {
                    val = '#' + val;
                    this.value = val;
                }
                if (/^#([0-9A-F]{3}){1,2}$/i.test(val) || val === '') {
                    if (val) {
                        picker.value = val;
                        preview.style.background = val;
                    }
                }
            });
            
            hexInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    const val = this.value.trim();
                    if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
                        document.querySelector('.swal2-confirm')?.click();
                    }
                }
            });
        },
        preConfirm: () => {
            let color = document.getElementById('customColorHex').value.trim();
            
            if (!color) {
                Swal.showValidationMessage(isBn ? 'একটি কালার নির্বাচন বা লিখুন' : 'Select or enter a color');
                return;
            }
            
            if (!color.startsWith('#')) {
                color = '#' + color;
            }
            
            if (!/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
                Swal.showValidationMessage(isBn ? 'সঠিক হেক্স কোড দিন (যেমন: #FF0000)' : 'Enter valid hex code (e.g. #FF0000)');
                return;
            }
            
            return color.toUpperCase();
        }
    }).then(res => {
        if (res.isConfirmed) {
            addCustomColor(res.value);
        }
    });
}

// ========== থিম রিসেট ==========
function resetTheme() {
    settings.gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    settings.primaryColor = '#6366F1';
    settings.customColors = [];
    saveSettings();
    
    document.documentElement.style.setProperty('--gradient-primary', settings.gradient);
    document.documentElement.style.setProperty('--header-bg', settings.gradient);
    document.documentElement.style.setProperty('--bg-image', 'none');
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundSize = 'auto';
    document.body.style.backgroundAttachment = 'auto';
    document.body.classList.remove('has-bg-image');
    localStorage.removeItem('bgImage');
    
    const header = document.getElementById('mainHeader');
    if (header) header.style.background = settings.gradient;
    
    showToast('🔄 ' + (settings.language === 'bn' ? 'থিম রিসেট করা হয়েছে' : 'Theme reset'));
    renderSettingsPage();
}

// ========== পাসওয়ার্ড ফাংশন ==========
function getPassword() {
    return localStorage.getItem('app_password') || null;
}

function setPassword(newPassword) {
    if (newPassword) {
        localStorage.setItem('app_password', newPassword);
    } else {
        localStorage.removeItem('app_password');
    }
}

function isPasswordSet() {
    return !!getPassword();
}

function verifyPassword(inputPassword) {
    const stored = getPassword();
    if (!stored) return true;
    return inputPassword === stored;
}

function openPasswordSettings() {
    const isBn = settings.language === 'bn';
    const hasPassword = isPasswordSet();
    
    Swal.fire({
        title: hasPassword ? 
            (isBn ? '🔐 পাসওয়ার্ড পরিবর্তন করুন' : '🔐 Change Password') : 
            (isBn ? '🔐 পাসওয়ার্ড সেট করুন' : '🔐 Set Password'),
        html: `
            <div style="text-align: left; padding: 8px 0;">
                ${hasPassword ? `
                    <div class="outline-input">
                        <input type="password" id="oldPassword" placeholder=" ">
                        <label for="oldPassword">${isBn ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'}</label>
                    </div>
                ` : ''}
                <div class="outline-input">
                    <input type="password" id="newPassword" placeholder=" ">
                    <label for="newPassword">${isBn ? 'নতুন পাসওয়ার্ড' : 'New Password'}</label>
                </div>
                <div class="outline-input">
                    <input type="password" id="confirmPassword" placeholder=" ">
                    <label for="confirmPassword">${isBn ? 'নতুন পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'}</label>
                </div>
                <div style="display: flex; gap: 8px; align-items: center; margin-top: 8px; flex-wrap: wrap;">
                    <span style="font-size: 12px; color: var(--text-muted);">
                        <i class="fas fa-info-circle"></i> 
                        ${isBn ? 'পাসওয়ার্ড অবশ্যই ৪ অক্ষরের বেশি হতে হবে' : 'Password must be at least 4 characters'}
                    </span>
                </div>
                ${hasPassword ? `
                    <div style="margin-top: 12px; border-top: 1px solid var(--border); padding-top: 12px;">
                        <button onclick="removePassword()" style="
                            background: var(--expense-light);
                            color: var(--expense);
                            border: none;
                            padding: 8px 16px;
                            border-radius: 30px;
                            font-weight: 600;
                            cursor: pointer;
                            width: 100%;
                            font-size: 13px;
                        ">
                            <i class="fas fa-trash"></i> ${isBn ? 'পাসওয়ার্ড রিমুভ করুন' : 'Remove Password'}
                        </button>
                    </div>
                ` : ''}
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: hasPassword ? (isBn ? 'আপডেট করুন' : 'Update') : (isBn ? 'সেট করুন' : 'Set'),
        cancelButtonText: isBn ? 'বাতিল' : 'Cancel',
        customClass: { popup: 'responsive-payment-popup' },
        preConfirm: () => {
            const newPass = document.getElementById('newPassword').value;
            const confirmPass = document.getElementById('confirmPassword').value;
            
            if (hasPassword) {
                const oldPass = document.getElementById('oldPassword').value;
                if (!verifyPassword(oldPass)) {
                    Swal.showValidationMessage(isBn ? 'বর্তমান পাসওয়ার্ড ভুল' : 'Current password is incorrect');
                    return;
                }
            }
            
            if (!newPass || newPass.length < 4) {
                Swal.showValidationMessage(isBn ? 'পাসওয়ার্ড ৪ অক্ষরের বেশি হতে হবে' : 'Password must be at least 4 characters');
                return;
            }
            
            if (newPass !== confirmPass) {
                Swal.showValidationMessage(isBn ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match');
                return;
            }
            
            return newPass;
        }
    }).then(res => {
        if (res.isConfirmed) {
            setPassword(res.value);
            localStorage.removeItem('app_unlocked');
            showToast('✅ ' + (isBn ? 'পাসওয়ার্ড সেট করা হয়েছে' : 'Password set successfully'));
            renderSettingsPage();
        }
    });
}

function removePassword() {
    const isBn = settings.language === 'bn';
    Swal.fire({
        title: isBn ? '⚠️ পাসওয়ার্ড রিমুভ করুন' : '⚠️ Remove Password',
        text: isBn ? 'আপনি কি নিশ্চিত যে পাসওয়ার্ড রিমুভ করতে চান?' : 'Are you sure you want to remove password?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: isBn ? 'হ্যাঁ, রিমুভ করুন' : 'Yes, Remove',
        cancelButtonText: isBn ? 'বাতিল' : 'Cancel',
        confirmButtonColor: '#EF4444'
    }).then(res => {
        if (res.isConfirmed) {
            setPassword(null);
            localStorage.removeItem('app_unlocked');
            showToast('🗑️ ' + (isBn ? 'পাসওয়ার্ড রিমুভ করা হয়েছে' : 'Password removed'));
            renderSettingsPage();
        }
    });
}

function checkAppLock() {
    const hasPassword = isPasswordSet();
    if (!hasPassword) return true;
    
    // localStorage দিয়ে persistent চেক
    if (localStorage.getItem('app_unlocked') === 'true') {
        return true;
    }
    
    const isBn = settings.language === 'bn';
    
    return new Promise((resolve) => {
        Swal.fire({
            title: '🔐 ' + (isBn ? 'অ্যাপ লক' : 'App Lock'),
            html: `
                <div style="text-align: center; padding: 10px 0;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🔒</div>
                    <p style="color: var(--text-muted); margin-bottom: 16px;">
                        ${isBn ? 'অ্যাপটি লক করা আছে। অনুগ্রহ করে পাসওয়ার্ড দিন।' : 'App is locked. Please enter password.'}
                    </p>
                    <div class="outline-input">
                        <input type="password" id="unlockPassword" placeholder=" " autofocus>
                        <label for="unlockPassword">${isBn ? 'পাসওয়ার্ড' : 'Password'}</label>
                    </div>
                    <div style="margin-top: 8px; font-size: 12px; color: var(--text-muted);">
                        <i class="fas fa-info-circle"></i> 
                        ${isBn ? 'ভুল পাসওয়ার্ড দিলে অ্যাপ বন্ধ হয়ে যাবে' : 'Wrong password will close the app'}
                    </div>
                </div>
            `,
            showCancelButton: true,
            cancelButtonText: isBn ? 'বন্ধ করুন' : 'Close',
            confirmButtonText: isBn ? '✅ আনলক করুন' : '✅ Unlock',
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: { popup: 'responsive-payment-popup' },
            didOpen: () => {
                setTimeout(() => {
                    document.getElementById('unlockPassword')?.focus();
                }, 300);
                
                document.getElementById('unlockPassword')?.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        document.querySelector('.swal2-confirm')?.click();
                    }
                });
            },
            preConfirm: () => {
                const pass = document.getElementById('unlockPassword').value;
                if (!pass) {
                    Swal.showValidationMessage(isBn ? 'পাসওয়ার্ড দিন' : 'Enter password');
                    return;
                }
                if (!verifyPassword(pass)) {
                    Swal.showValidationMessage(isBn ? '❌ ভুল পাসওয়ার্ড' : '❌ Wrong password');
                    return;
                }
                return true;
            }
        }).then(res => {
            if (res.isConfirmed) {
                localStorage.setItem('app_unlocked', 'true');
                resolve(true);
            } else {
                document.body.innerHTML = `
                    <div style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        background: var(--bg-dark);
                        color: var(--text-primary);
                        font-family: 'Inter', sans-serif;
                        padding: 20px;
                        text-align: center;
                    ">
                        <div style="font-size: 64px; margin-bottom: 20px;">🔒</div>
                        <h2 style="margin-bottom: 12px;">${isBn ? 'অ্যাপ লক' : 'App Locked'}</h2>
                        <p style="color: var(--text-muted); max-width: 300px;">
                            ${isBn ? 'সঠিক পাসওয়ার্ড ছাড়া অ্যাপ ব্যবহার করা যাবে না।' : 'App cannot be used without correct password.'}
                        </p>
                        <button onclick="location.reload()" style="
                            margin-top: 20px;
                            padding: 12px 32px;
                            background: var(--accent);
                            color: white;
                            border: none;
                            border-radius: 40px;
                            font-weight: 600;
                            cursor: pointer;
                            font-size: 16px;
                        ">
                            🔄 ${isBn ? 'আবার চেষ্টা করুন' : 'Try Again'}
                        </button>
                    </div>
                `;
                resolve(false);
            }
        });
    });
}

// ========== প্রোফাইল ফাংশন ==========
let userProfile = JSON.parse(localStorage.getItem('userProfile')) || { name: 'ব্যবহারকারী', avatar: null };
function updateProfileUI() {
    document.getElementById('profileName').innerText = userProfile.name;
    const av = document.getElementById('profileAvatar');
    if (userProfile.avatar && userProfile.avatar !== 'null' && userProfile.avatar !== '') {
        av.innerHTML = `<img src="${userProfile.avatar}" style="width:100%;height:100%;object-fit:cover">`;
    } else {
        av.innerHTML = '👤';
    }
}
function openProfileModal() {
    const isBn = settings.language === 'bn';
    Swal.fire({
        title: isBn ? 'প্রোফাইল সেটিংস' : 'Profile Settings',
        html: `<input id="userName" placeholder="${isBn ? 'আপনার নাম' : 'Your Name'}" value="${userProfile.name}" style="width:100%; padding:10px; margin-bottom:10px;"><input type="file" id="avatarFile" accept="image/*" style="width:100%; padding:10px;">`,
        showCancelButton: true,
        confirmButtonText: isBn ? 'সংরক্ষণ' : 'Save',
        cancelButtonText: isBn ? 'বাতিল' : 'Cancel',
        preConfirm: () => {
            const newName = document.getElementById('userName').value.trim();
            if (newName) userProfile.name = newName;
            const file = document.getElementById('avatarFile').files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    userProfile.avatar = e.target.result;
                    localStorage.setItem('userProfile', JSON.stringify(userProfile));
                    updateProfileUI();
                };
                reader.readAsDataURL(file);
            }
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            updateProfileUI();
        }
    });
}
document.getElementById('profileBtn')?.addEventListener('click', openProfileModal);
updateProfileUI();

// ========== থিম ফাংশন ==========
function initTheme() {
    let saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    document.getElementById('themeToggleBtn').innerHTML = saved === 'dark' ? '☀️' : '🌙';
    settings.theme = saved;
    saveSettings();
}
function toggleTheme() {
    let cur = document.documentElement.getAttribute('data-theme');
    let neu = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', neu);
    localStorage.setItem('theme', neu);
    settings.theme = neu;
    saveSettings();
    document.getElementById('themeToggleBtn').innerHTML = neu === 'dark' ? '☀️' : '🌙';
    showToast(neu === 'dark' ? '🌙 ডার্ক মোড' : '☀️ লাইট মোড');
    if (activeNav === 10) renderSettingsPage();
}
document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme);
initTheme();

// ========== ফন্ট সাইজ ফাংশন ==========
function applyFontSize(size) {
    document.body.style.fontSize = size + 'px';
    settings.fontSize = size;
    saveSettings();
}
function changeFontSize(delta) {
    let newSize = settings.fontSize + delta;
    if (newSize < 12) newSize = 12;
    if (newSize > 20) newSize = 20;
    applyFontSize(newSize);
    if (activeNav === 10) renderSettingsPage();
}

// ========== ল্যাঙ্গুয়েজ ফাংশন ==========
function toggleLanguage() {
    settings.language = settings.language === 'bn' ? 'en' : 'bn';
    saveSettings();
    updateDateAndTime();
    showToast(settings.language === 'bn' ? 'ভাষা বাংলা হয়েছে' : 'Language changed to English');
    renderAll();
    if (activeNav === 10) renderSettingsPage();
}

// ========== তারিখ ও সময় আপডেট ==========
function updateDateAndTime() {
    document.getElementById('headerDate').innerText = getDateString(now);
    document.getElementById('liveClock').innerText = getTimeString(now);
}

// ========== লাইভ ক্লক ==========
function updateLiveClock() {
    const now2 = new Date();
    document.getElementById('liveClock').innerText = getTimeString(now2);
}
setInterval(updateLiveClock, 1000);
updateDateAndTime();

// ========== হেডার স্ক্রল ফাংশন ==========
let lastScrollY = 0;
let header = document.getElementById('mainHeader');
let isHeaderHidden = false;

function handleScroll() {
    const pagesContainer = document.getElementById('pagesContainer');
    if (!pagesContainer) return;
    const currentScrollY = pagesContainer.scrollTop;
    if (currentScrollY > 60 && currentScrollY > lastScrollY) {
        if (!isHeaderHidden) {
            header.classList.add('hidden');
            isHeaderHidden = true;
        }
    } else if (currentScrollY < lastScrollY || currentScrollY <= 30) {
        if (isHeaderHidden) {
            header.classList.remove('hidden');
            isHeaderHidden = false;
        }
    }
    lastScrollY = currentScrollY;
}
document.addEventListener('DOMContentLoaded', function() {
    const pagesContainer = document.getElementById('pagesContainer');
    if (pagesContainer) {
        pagesContainer.addEventListener('scroll', handleScroll);
    }
});

function resetScrollAndHeader() {
    const pagesContainer = document.getElementById('pagesContainer');
    if (pagesContainer) {
        pagesContainer.scrollTop = 0;
        lastScrollY = 0;
        if (isHeaderHidden) {
            header.classList.remove('hidden');
            isHeaderHidden = false;
        }
    }
}

// ========== নেভিগেশন ==========
function getNavLabels() {
    const isBn = settings.language === 'bn';
    return [
        { id: 'dashboardPage', icon: '📊', label: isBn ? 'ড্যাশবোর্ড' : 'Dashboard' },
        { id: 'addPage', icon: '➕', label: isBn ? 'যোগ করুন' : 'Add' },
        { id: 'transactionsPage', icon: '📋', label: isBn ? 'লেনদেন' : 'Transactions' },
        { id: 'reportsPage', icon: '📅', label: isBn ? 'রিপোর্ট' : 'Reports' },
        { id: 'categoriesPage', icon: '🏷️', label: isBn ? 'ক্যাটাগরি' : 'Categories' },
        { id: 'recurringPage', icon: '🔄', label: isBn ? 'পুনরাবৃত্তি' : 'Recurring' },
        { id: 'calculatorPage', icon: '🧮', label: isBn ? 'ক্যালকুলেটর' : 'Calculator' },
        { id: 'savingsPage', icon: '🎯', label: isBn ? 'সঞ্চয়' : 'Savings' },
        { id: 'investmentPage', icon: '📈', label: isBn ? 'বিনিয়োগ' : 'Investment' },
        { id: 'loanPage', icon: '🤝', label: isBn ? 'ধার-দেনা' : 'Loan' },
        { id: 'settingsPage', icon: '⚙️', label: isBn ? 'সেটিংস' : 'Settings' }
    ];
}
function renderNav() {
    const items = getNavLabels();
    document.getElementById('navContainer').innerHTML = items.map((item, idx) => `<div class="nav-item ${idx === activeNav ? 'active' : ''}" onclick="switchNav(${idx})">${item.icon} ${item.label}</div>`).join('');
}
function switchNav(idx) {
    activeNav = idx;
    renderNav();
    const items = getNavLabels();
    items.forEach((item, i) => document.getElementById(item.id).classList.toggle('active', i === idx));
    resetScrollAndHeader();
    if (idx === 0) renderDashboard();
    else if (idx === 1) renderAddForm();
    else if (idx === 2) renderTransactions();
    else if (idx === 3) renderReportsPage();
    else if (idx === 4) renderCategoriesPage();
    else if (idx === 5) renderRecurringPage();
    else if (idx === 6) renderCalculatorPage();
    else if (idx === 7) renderSavingsPage();
    else if (idx === 8) renderInvestmentPage();
    else if (idx === 9) renderLoanPage();
    else if (idx === 10) renderSettingsPage();
}

// ========== ড্যাশবোর্ড রেন্ডার ==========
function renderDashboard() {
    const isBn = settings.language === 'bn';
    const totalInc = data.filter(d => d.type === 'income').reduce((s, d) => s + d.amount, 0);
    const totalExp = data.filter(d => d.type === 'expense').reduce((s, d) => s + d.amount, 0);
    const net = totalInc - totalExp;
    const rate = totalInc > 0 ? Math.round((net / totalInc) * 100) : 0;

    const monthlyData = data.filter(d => d.year === currentYear && d.month === currentMonth);
    const dailyMap = new Map();
    monthlyData.forEach(d => {
        if (!dailyMap.has(d.day)) dailyMap.set(d.day, { inc: 0, exp: 0 });
        const val = dailyMap.get(d.day);
        if (d.type === 'income') val.inc += d.amount;
        else val.exp += d.amount;
    });
    let highestExpense = { day: null, amount: 0 };
    for (let [day, vals] of dailyMap) if (vals.exp > highestExpense.amount) highestExpense = { day, amount: vals.exp };
    const today = now.getDate();
    const alertHtml = (highestExpense.day === today && highestExpense.amount > 0) ? `<div class="alert-banner">⚠️ ${isBn ? 'আজ' : 'Today'} ${fmt(highestExpense.amount)} ${isBn ? 'ব্যয় হয়েছে!' : 'spent!'}</div>` : '';
    const dailyItems = Array.from(dailyMap.keys()).sort((a, b) => a - b).map(day => {
        const vals = dailyMap.get(day);
        const netVal = vals.inc - vals.exp;
        return `<div class="daily-item"><span class="daily-day">${day}</span><span class="daily-income">+${fmt(vals.inc)}</span><span class="daily-expense">-${fmt(vals.exp)}</span><span class="daily-net ${netVal >= 0 ? 'positive' : 'negative'}">${fmt(netVal)}</span></div>`;
    }).join('');

    const months = [], incData = [], expData = [];
    const monthShort = getMonthsShort();
    for (let i = 5; i >= 0; i--) {
        let d = new Date(currentYear, currentMonth - i, 1);
        months.push(monthShort[d.getMonth()]);
        let mData = data.filter(x => x.month === d.getMonth() && x.year === d.getFullYear());
        incData.push(mData.filter(x => x.type === 'income').reduce((s, dx) => s + dx.amount, 0));
        expData.push(mData.filter(x => x.type === 'expense').reduce((s, dx) => s + dx.amount, 0));
    }
    const catTotals = {};
    data.filter(d => d.type === 'expense').forEach(d => catTotals[d.category] = (catTotals[d.category] || 0) + d.amount);
    const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const recent = data.slice(0, 5);

    const html = `
        <div class="dashboard-two-col">
            <div class="kpi-grid">
                <div class="kpi-card"><div class="kpi-icon income">💰</div><div class="kpi-info"><div class="kpi-label">${isBn ? 'মোট আয়' : 'Total Income'}</div><div class="kpi-value income">${fmt(totalInc)}</div></div></div>
                <div class="kpi-card"><div class="kpi-icon expense">💸</div><div class="kpi-info"><div class="kpi-label">${isBn ? 'মোট ব্যয়' : 'Total Expense'}</div><div class="kpi-value expense">${fmt(totalExp)}</div></div></div>
                <div class="kpi-card"><div class="kpi-icon net">📊</div><div class="kpi-info"><div class="kpi-label">${isBn ? 'নেট সঞ্চয়' : 'Net Savings'}</div><div class="kpi-value net">${fmt(net)}</div></div></div>
                <div class="kpi-card"><div class="kpi-icon savings">🎯</div><div class="kpi-info"><div class="kpi-label">${isBn ? 'সঞ্চয় হার' : 'Savings Rate'}</div><div class="kpi-value savings">${rate}%</div></div></div>
            </div>
            <div class="daily-summary-card">
                <div class="daily-header"><div class="daily-title">📅 ${isBn ? 'দৈনিক সংক্ষিপ্ত' : 'Daily Summary'}</div><div class="daily-month">${getMonthName(currentMonth)} ${currentYear}</div></div>
                ${alertHtml}
                <div class="daily-list">
                    <div class="daily-item" style="font-weight:600; color:var(--text-muted); border-bottom:2px solid var(--border); padding-bottom:6px;"><span>${isBn ? 'তারিখ' : 'Date'}</span><span>${isBn ? 'আয়' : 'Income'}</span><span>${isBn ? 'ব্যয়' : 'Expense'}</span><span>${isBn ? 'নেট' : 'Net'}</span></div>
                    ${dailyItems || `<div class="empty-state">${isBn ? 'কোনো লেনদেন নেই' : 'No transactions'}</div>`}
                </div>
            </div>
        </div>
        <div class="charts-row">
            <div class="chart-container"><div class="chart-title">📊 ${isBn ? 'গত ৬ মাসের আয়-ব্যয় তুলনা' : 'Last 6 Months Income vs Expense'}</div><canvas id="monthlyChart"></canvas></div>
            <div class="chart-container"><div class="chart-title">🥧 ${isBn ? 'ব্যয়ের ক্যাটাগরি (পার্সেন্টেজ সহ)' : 'Expense Categories (with %)'}</div><canvas id="categoryChart"></canvas></div>
        </div>
        <div class="card"><div style="font-weight:700; margin-bottom:12px">🕒 ${isBn ? 'সাম্প্রতিক লেনদেন' : 'Recent Transactions'}</div><div id="recentList">${recent.map(t => `<div class="txn-item"><div class="txn-icon ${t.type}">${getIcon(t.category)}</div><div class="txn-info"><div class="txn-title">${escapeHtml(t.description)}</div><div class="txn-meta">${t.day} ${getMonthShort(t.month)} · ${t.category} · ${t.payment}</div></div><div class="txn-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}</div><button class="delete-btn" onclick="deleteEntry(${t.id})">🗑️</button></div>`).join('') || `<div class="empty-state">${isBn ? 'কোনো লেনদেন নেই' : 'No transactions'}</div>`}</div></div>
    `;
    document.getElementById('dashboardPage').innerHTML = html;
    setTimeout(() => {
        const ctxM = document.getElementById('monthlyChart')?.getContext('2d');
        if (ctxM) {
            if (monthlyChart) monthlyChart.destroy();
            monthlyChart = new Chart(ctxM, {
                type: 'bar', data: { labels: months, datasets: [{ label: isBn ? 'আয়' : 'Income', data: incData, backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 8 }, { label: isBn ? 'ব্যয়' : 'Expense', data: expData, backgroundColor: 'rgba(239,68,68,0.7)', borderRadius: 8 }] },
                options: { responsive: true, maintainAspectRatio: true, plugins: { tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmt(ctx.raw)}` } } } }
            });
        }
        const ctxC = document.getElementById('categoryChart')?.getContext('2d');
        if (ctxC) {
            if (categoryChart) categoryChart.destroy();
            categoryChart = new Chart(ctxC, {
                type: 'doughnut', data: { labels: sorted.map(s => s[0]), datasets: [{ data: sorted.map(s => s[1]), backgroundColor: ['#10B981', '#F59E0B', '#6366F1', '#EF4444', '#8B5CF6', '#EC4899'], borderWidth: 0 }] },
                options: { responsive: true, plugins: { datalabels: { color: 'white', formatter: (val, ctx) => { let total = ctx.dataset.data.reduce((a, b) => a + b, 0); let pct = total ? Math.round((val / total) * 100) : 0; return pct ? pct + '%' : ''; } }, legend: { position: 'right', labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') } } } }
            });
        }
    }, 100);
}

// ========== অ্যাড ফর্ম ==========
let currentType = 'income';
function renderAddForm() {
    const isBn = settings.language === 'bn';
    let incOpts = categories.income.map(c => `<option value="${c}">${getIcon(c)} ${c}</option>`).join('');
    let expOpts = categories.expense.map(c => `<option value="${c}">${getIcon(c)} ${c}</option>`).join('');
    let paymentOpts = paymentMethods.map(p => `<option value="${p}">${p}</option>`).join('');
    
    document.getElementById('addPage').innerHTML = `
        <div class="form-card" style="margin-bottom: 30px;">
            <div class="type-toggle">
                <button class="type-btn income ${currentType === 'income' ? 'active' : ''}" onclick="setType('income')">💚 ${isBn ? 'আয়' : 'Income'}</button>
                <button class="type-btn expense ${currentType === 'expense' ? 'active' : ''}" onclick="setType('expense')">❤️ ${isBn ? 'ব্যয়' : 'Expense'}</button>
            </div>
            <div class="form-group"><label class="form-label">${isBn ? 'পরিমাণ (৳)' : 'Amount (৳)'}</label><input type="number" id="amount" style="font-size:18px;font-weight:700" placeholder="0"></div>
            <div class="form-group"><label class="form-label">${isBn ? 'বিবরণ' : 'Description'}</label><input type="text" id="description" placeholder="${isBn ? 'যেমন: বেতন, বাজার' : 'e.g. Salary, Grocery'}"></div>
            <div class="form-group"><label class="form-label">${isBn ? 'ক্যাটাগরি' : 'Category'}</label><select id="category">${currentType === 'income' ? incOpts : expOpts}</select></div>
            <div class="form-group"><label class="form-label">${isBn ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}</label><select id="payment">${paymentOpts}</select></div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
                <div><label>${isBn ? 'দিন' : 'Day'}</label><select id="day">${[...Array(31)].map((_, i) => `<option ${i + 1 === now.getDate() ? 'selected' : ''}>${i + 1}</option>`).join('')}</select></div>
                <div><label>${isBn ? 'মাস' : 'Month'}</label><select id="month">${getMonths().map((m, i) => `<option ${i === currentMonth ? 'selected' : ''} value="${i}">${m}</option>`).join('')}</select></div>
                <div><label>${isBn ? 'বছর' : 'Year'}</label><select id="year">${[2024, 2025, 2026, 2027, 2028].map(y => `<option ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('')}</select></div>
            </div>
            <div class="form-group"><label>${isBn ? 'নোট' : 'Note'}</label><textarea id="note" rows="2" placeholder="${isBn ? 'ঐচ্ছিক' : 'Optional'}"></textarea></div>
            <button class="submit-btn ${currentType}" onclick="addEntry()">${currentType === 'income' ? '💚 ' + (isBn ? 'আয় যোগ করুন' : 'Add Income') : '❤️ ' + (isBn ? 'ব্যয় যোগ করুন' : 'Add Expense')}</button>
        </div>
        <div style="height: 400px; opacity: 0; pointer-events: none;"></div>
    `;
}
function setType(t) { currentType = t; renderAddForm(); }
function addEntry() {
    const isBn = settings.language === 'bn';
    let amt = parseFloat(document.getElementById('amount')?.value), desc = document.getElementById('description')?.value.trim();
    if (!amt || amt <= 0) return showToast(isBn ? 'সঠিক পরিমাণ দিন' : 'Enter valid amount');
    if (!desc) return showToast(isBn ? 'বিবরণ লিখুন' : 'Enter description');
    data.unshift({
        id: Date.now(), type: currentType, amount: amt, description: desc,
        category: document.getElementById('category').value, payment: document.getElementById('payment').value,
        note: document.getElementById('note')?.value || '', day: parseInt(document.getElementById('day').value),
        month: parseInt(document.getElementById('month').value), year: parseInt(document.getElementById('year').value)
    });
    saveData(); showToast(currentType === 'income' ? (isBn ? 'আয় যোগ হয়েছে' : 'Income added') : (isBn ? 'ব্যয় যোগ হয়েছে' : 'Expense added'));
    renderDashboard(); renderTransactions(); if (activeNav === 3) renderReportsPage();
    switchNav(2);
}

// ========== লেনদেন ==========
function renderTransactions() {
    const isBn = settings.language === 'bn';
    let filtered = data.filter(d => {
        let m = !searchQuery || d.description.toLowerCase().includes(searchQuery) || d.category.toLowerCase().includes(searchQuery);
        if (txnFilter === 'all') return m;
        if (txnFilter === 'income') return d.type === 'income' && m;
        if (txnFilter === 'expense') return d.type === 'expense' && m;
        if (txnFilter === 'month') return d.month === currentMonth && d.year === currentYear && m;
        return m;
    });
    document.getElementById('transactionsPage').innerHTML = `
        <div><input type="text" id="searchInput" placeholder="🔍 ${isBn ? 'খুঁজুন...' : 'Search...'}" style="width:100%;padding:10px 14px;border-radius:40px;margin-bottom:14px" oninput="updateSearch(this.value)"></div>
        <div class="filters"><button class="filter-chip ${txnFilter === 'all' ? 'active' : ''}" onclick="setFilter('all')">${isBn ? 'সব' : 'All'}</button><button class="filter-chip ${txnFilter === 'income' ? 'active' : ''}" onclick="setFilter('income')">${isBn ? 'আয়' : 'Income'}</button><button class="filter-chip ${txnFilter === 'expense' ? 'active' : ''}" onclick="setFilter('expense')">${isBn ? 'ব্যয়' : 'Expense'}</button><button class="filter-chip ${txnFilter === 'month' ? 'active' : ''}" onclick="setFilter('month')">${isBn ? 'এ মাস' : 'This Month'}</button></div>
        <div id="txnList">${filtered.map(t => `<div class="txn-item"><div class="txn-icon ${t.type}">${getIcon(t.category)}</div><div class="txn-info"><div class="txn-title">${escapeHtml(t.description)}</div><div class="txn-meta">${t.day} ${getMonthShort(t.month)} · ${t.category} · ${t.payment}</div></div><div class="txn-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}</div><button class="delete-btn" onclick="deleteEntry(${t.id})">🗑️</button></div>`).join('') || `<div class="empty-state">${isBn ? 'কোনো লেনদেন নেই' : 'No transactions'}</div>`}</div>
    `;
}
function updateSearch(val) { searchQuery = val.toLowerCase(); renderTransactions(); }
function setFilter(f) { txnFilter = f; renderTransactions(); }
function deleteEntry(id) {
    const isBn = settings.language === 'bn';
    if (confirm(isBn ? 'মুছবেন?' : 'Delete?')) {
        data = data.filter(d => d.id !== id);
        saveData(); renderDashboard(); renderTransactions(); if (activeNav === 3) renderReportsPage();
        showToast(isBn ? 'মুছে ফেলা হয়েছে' : 'Deleted');
    }
}

// ========== রিপোর্ট ==========
let reportGenerationTimeout = null;

function renderReportsPage() {
    const isBn = settings.language === 'bn';
    const years = [...new Set(data.map(d => d.year))].sort((a, b) => b - a);
    if (years.length === 0) years.push(currentYear);
    const html = `
        <div class="card">
            <div class="filter-group">
                <div style="display: flex; gap: 15px;">
                    <label><input type="radio" name="reportType" value="monthly" checked> ${isBn ? 'মাসিক রিপোর্ট' : 'Monthly Report'}</label>
                    <label><input type="radio" name="reportType" value="yearly"> ${isBn ? 'বার্ষিক রিপোর্ট' : 'Yearly Report'}</label>
                </div>
                <div id="monthlySelects">
                    <select id="reportYear">${years.map(y => `<option ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('')}</select>
                    <select id="reportMonth">${getMonths().map((m, i) => `<option ${i === currentMonth ? 'selected' : ''} value="${i}">${m}</option>`).join('')}</select>
                </div>
                <div id="yearlySelects" style="display: none;">
                    <select id="reportYearOnly">${years.map(y => `<option ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('')}</select>
                </div>
                <button id="generateReportBtn">📊 ${isBn ? 'রিপোর্ট দেখুন' : 'View Report'}</button>
            </div>
            <div id="reportContent"></div>
        </div>
    `;
    document.getElementById('reportsPage').innerHTML = html;
    
    const radioMonthly = document.querySelector('input[value="monthly"]');
    const radioYearly = document.querySelector('input[value="yearly"]');
    const monthlyDiv = document.getElementById('monthlySelects');
    const yearlyDiv = document.getElementById('yearlySelects');
    
    radioMonthly.addEventListener('change', () => { 
        monthlyDiv.style.display = 'flex'; 
        yearlyDiv.style.display = 'none'; 
        generateReport(); 
    });
    radioYearly.addEventListener('change', () => { 
        monthlyDiv.style.display = 'none'; 
        yearlyDiv.style.display = 'flex'; 
        generateReport(); 
    });
    document.getElementById('generateReportBtn').addEventListener('click', () => generateReport());
    generateReport();
}

function generateReport() {
    if (reportGenerationTimeout) {
        clearTimeout(reportGenerationTimeout);
        reportGenerationTimeout = null;
    }
    reportGenerationTimeout = setTimeout(() => {
        const isBn = settings.language === 'bn';
        const isMonthly = document.querySelector('input[value="monthly"]')?.checked;
        const container = document.getElementById('reportContent');
        if (!container) return;
        
        if (isMonthly) {
            let year = parseInt(document.getElementById('reportYear')?.value || currentYear);
            let month = parseInt(document.getElementById('reportMonth')?.value || currentMonth);
            let monthData = data.filter(d => d.year === year && d.month === month);
            let totalInc = monthData.filter(d => d.type === 'income').reduce((s, d) => s + d.amount, 0);
            let totalExp = monthData.filter(d => d.type === 'expense').reduce((s, d) => s + d.amount, 0);
            let net = totalInc - totalExp;
            
            container.innerHTML = `
                <div class="report-print-area" id="reportPrintArea">
                    <div class="report-header"><div class="report-title">📊 ${isBn ? 'মাসিক রিপোর্ট' : 'Monthly Report'}</div>
                    <div class="report-subtitle">${getMonthName(month)} ${year} | ${getDateString(now)}</div></div>
                    <div class="summary-cards">
                        <div class="summary-item"><div class="summary-label">${isBn ? 'মোট আয়' : 'Total Income'}</div><div class="summary-value income">${fmt(totalInc)}</div></div>
                        <div class="summary-item"><div class="summary-label">${isBn ? 'মোট ব্যয়' : 'Total Expense'}</div><div class="summary-value expense">${fmt(totalExp)}</div></div>
                        <div class="summary-item"><div class="summary-label">${isBn ? 'নেট সঞ্চয়' : 'Net Savings'}</div><div class="summary-value net">${fmt(net)}</div></div>
                    </div>
                    <div style="overflow-x:auto;"><table class="transaction-table"><thead><tr><th>${isBn ? 'তারিখ' : 'Date'}</th><th>${isBn ? 'বিবরণ' : 'Description'}</th><th>${isBn ? 'ক্যাটাগরি' : 'Category'}</th><th>${isBn ? 'পরিমাণ' : 'Amount'}</th></tr></thead><tbody>${monthData.map(t => `<tr><td>${t.day} ${getMonthShort(t.month)}</td><td>${escapeHtml(t.description)}</td><td>${t.category}</td><td style="color:${t.type === 'income' ? '#10B981' : '#EF4444'}">${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}</td></tr>`).join('') || `<tr><td colspan="4" class="empty-state">${isBn ? 'কোনো লেনদেন নেই' : 'No transactions'}</td></tr>`}</tbody>
                    </table></div>
                    <div style="margin-top:16px; text-align:center; font-size:10px; border-top:1px solid #ddd; padding-top:8px;">${isBn ? 'হিসাব ট্র্যাকার · মাসিক রিপোর্ট' : 'Tracker · Monthly Report'}</div>
                </div>
                <button class="print-btn no-print" onclick="window.print()">🖨️ ${isBn ? 'প্রিন্ট / PDF' : 'Print / PDF'}</button>
            `;
        } else {
            let year = parseInt(document.getElementById('reportYearOnly')?.value || currentYear);
            let yearData = data.filter(d => d.year === year);
            let totalInc = yearData.filter(d => d.type === 'income').reduce((s, d) => s + d.amount, 0);
            let totalExp = yearData.filter(d => d.type === 'expense').reduce((s, d) => s + d.amount, 0);
            let net = totalInc - totalExp;
            let savingsRate = totalInc > 0 ? Math.round((net / totalInc) * 100) : 0;
            let monthlyRows = '';
            for (let i = 0; i < 12; i++) {
                let mData = yearData.filter(d => d.month === i);
                let incM = mData.filter(d => d.type === 'income').reduce((s, d) => s + d.amount, 0);
                let expM = mData.filter(d => d.type === 'expense').reduce((s, d) => s + d.amount, 0);
                let netM = incM - expM;
                monthlyRows += `<tr><td style="padding:8px">${getMonthName(i)}</td><td style="color:var(--income)">${incM ? fmt(incM) : '—'}</td><td style="color:var(--expense)">${expM ? fmt(expM) : '—'}</td><td style="color:${netM >= 0 ? 'var(--income)' : 'var(--expense)'}">${netM ? fmt(netM) : '—'}</td></tr>`;
            }
            container.innerHTML = `
                <div class="report-print-area" id="reportPrintArea">
                    <div class="report-header"><div class="report-title">📊 ${isBn ? 'বার্ষিক রিপোর্ট' : 'Yearly Report'} ${year}</div>
                    <div class="report-subtitle">${isBn ? 'জানুয়ারি - ডিসেম্বর' : 'January - December'} ${year}</div></div>
                    <div class="summary-cards">
                        <div class="summary-item"><div class="summary-label">${isBn ? 'মোট আয়' : 'Total Income'}</div><div class="summary-value income">${fmt(totalInc)}</div></div>
                        <div class="summary-item"><div class="summary-label">${isBn ? 'মোট ব্যয়' : 'Total Expense'}</div><div class="summary-value expense">${fmt(totalExp)}</div></div>
                        <div class="summary-item"><div class="summary-label">${isBn ? 'নেট সঞ্চয়' : 'Net Savings'}</div><div class="summary-value net">${fmt(net)}</div></div>
                    </div>
                    <div><div class="card-title">${isBn ? 'মাসিক বিবরণী' : 'Monthly Summary'}</div><div style="overflow-x:auto;"><table class="transaction-table"><thead><tr><th>${isBn ? 'মাস' : 'Month'}</th><th>${isBn ? 'আয়' : 'Income'}</th><th>${isBn ? 'ব্যয়' : 'Expense'}</th><th>${isBn ? 'নেট' : 'Net'}</th></tr></thead><tbody>${monthlyRows}</tbody></table></div></div>
                    <div style="margin-top:16px; text-align:center; font-size:10px; border-top:1px solid #ddd; padding-top:8px;">${isBn ? 'সঞ্চয় হার' : 'Savings Rate'}: ${savingsRate}%</div>
                </div>
                <button class="print-btn no-print" onclick="window.print()">🖨️ ${isBn ? 'প্রিন্ট / PDF' : 'Print / PDF'}</button>
            `;
        }
    }, 50);
}

// ========== ক্যাটাগরি ==========
function renderCategoriesPage() {
    const isBn = settings.language === 'bn';
    const incHtml = categories.income.map(c => `<span class="cat-badge">${getIcon(c)} ${c}<button onclick="removeCat('income','${c}')">✕</button></span>`).join('');
    const expHtml = categories.expense.map(c => `<span class="cat-badge">${getIcon(c)} ${c}<button onclick="removeCat('expense','${c}')">✕</button></span>`).join('');
    const paymentHtml = paymentMethods.map(p => `<span class="payment-badge">💳 ${p}<button onclick="removePayment('${p}')">✕</button></span>`).join('');
    document.getElementById('categoriesPage').innerHTML = `
        <div class="card">
            <div class="category-section"><div class="category-title income"><i class="fas fa-arrow-up"></i> ${isBn ? 'আয়ের ক্যাটাগরি' : 'Income Categories'}</div><div class="cats-wrapper">${incHtml || `<div class="empty-state">${isBn ? 'কোনো ক্যাটাগরি নেই' : 'No categories'}</div>`}</div><div class="add-cat-row"><input type="text" id="newInc" placeholder="${isBn ? 'নতুন আয় ক্যাটাগরি' : 'New Income Category'}"><button onclick="addCat('income')"><i class="fas fa-plus"></i> ${isBn ? 'যোগ' : 'Add'}</button></div></div>
            <div class="category-section"><div class="category-title expense"><i class="fas fa-arrow-down"></i> ${isBn ? 'ব্যয়ের ক্যাটাগরি' : 'Expense Categories'}</div><div class="cats-wrapper">${expHtml || `<div class="empty-state">${isBn ? 'কোনো ক্যাটাগরি নেই' : 'No categories'}</div>`}</div><div class="add-cat-row"><input type="text" id="newExp" placeholder="${isBn ? 'নতুন ব্যয় ক্যাটাগরি' : 'New Expense Category'}"><button onclick="addCat('expense')"><i class="fas fa-plus"></i> ${isBn ? 'যোগ' : 'Add'}</button></div></div>
            <div class="payment-section"><div class="category-title"><i class="fas fa-credit-card"></i> ${isBn ? 'পেমেন্ট পদ্ধতি' : 'Payment Methods'}</div><div class="cats-wrapper">${paymentHtml || `<div class="empty-state">${isBn ? 'কোনো পদ্ধতি নেই' : 'No methods'}</div>`}</div><div class="add-cat-row"><input type="text" id="newPayment" placeholder="${isBn ? 'নতুন পেমেন্ট পদ্ধতি' : 'New Payment Method'}"><button onclick="addPayment()"><i class="fas fa-plus"></i> ${isBn ? 'যোগ' : 'Add'}</button></div><div class="empty-state" style="font-size:11px; margin-top:12px; padding:8px;">⚠️ ${isBn ? 'পুরনো পেমেন্ট পদ্ধতি মুছলে সংশ্লিষ্ট লেনদেনের পদ্ধতি "নগদ" হয়ে যাবে' : 'Deleting a method will set related transactions to "Cash"'}</div>
            </div>
        </div>
    `;
}
function addCat(type) {
    const isBn = settings.language === 'bn';
    let inp = document.getElementById(type === 'income' ? 'newInc' : 'newExp');
    let name = inp.value.trim();
    if (!name) return showToast(isBn ? 'ক্যাটাগরির নাম দিন' : 'Enter category name');
    if (categories[type].includes(name)) return showToast(isBn ? 'এই ক্যাটাগরি ইতিমধ্যে আছে' : 'Category already exists');
    categories[type].push(name);
    saveData(); renderCategoriesPage(); renderAddForm(); showToast(`"${name}" ${isBn ? 'যোগ হয়েছে' : 'added'}`);
    inp.value = '';
}
function removeCat(type, name) {
    const isBn = settings.language === 'bn';
    if (confirm(`"${name}" ${isBn ? 'ক্যাটাগরি মুছবেন?' : 'delete category?'}`)) {
        categories[type] = categories[type].filter(c => c !== name);
        let fallback = type === 'income' ? (isBn ? 'অন্যান্য আয়' : 'Other Income') : (isBn ? 'অন্যান্য ব্যয়' : 'Other Expense');
        data.forEach(d => { if (d.type === type && d.category === name) d.category = fallback; });
        saveData(); renderCategoriesPage(); renderAddForm(); renderDashboard(); renderTransactions(); showToast(`"${name}" ${isBn ? 'মুছে ফেলা হয়েছে' : 'deleted'}`);
    }
}
function addPayment() {
    const isBn = settings.language === 'bn';
    let inp = document.getElementById('newPayment');
    let name = inp.value.trim();
    if (!name) return showToast(isBn ? 'পদ্ধতির নাম দিন' : 'Enter method name');
    if (paymentMethods.includes(name)) return showToast(isBn ? 'ইতিমধ্যে আছে' : 'Already exists');
    paymentMethods.push(name);
    savePaymentMethods(); renderCategoriesPage(); renderAddForm(); showToast(`"${name}" ${isBn ? 'যোগ হয়েছে' : 'added'}`);
    inp.value = '';
}
function removePayment(name) {
    const isBn = settings.language === 'bn';
    if (confirm(`"${name}" ${isBn ? 'পেমেন্ট পদ্ধতি মুছবেন?' : 'delete payment method?'}`)) {
        let idx = paymentMethods.indexOf(name);
        if (idx !== -1) paymentMethods.splice(idx, 1);
        data.forEach(d => { if (d.payment === name) d.payment = isBn ? 'নগদ' : 'Cash'; });
        savePaymentMethods(); saveData(); renderCategoriesPage(); renderAddForm(); renderDashboard(); renderTransactions(); showToast(`"${name}" ${isBn ? 'মুছে ফেলা হয়েছে' : 'deleted'}`);
    }
}

// ========== পুনরাবৃত্তি ==========
function processRecurringTransactions() {
    if (!recurringRules.length) return;
    const today = new Date();
    let added = 0;
    for (let rule of recurringRules) {
        if (!rule.nextDate) continue;
        const nextDate = new Date(rule.nextDate);
        if (nextDate <= today) {
            const exists = data.some(t => t.description === rule.description && t.amount === rule.amount && t.type === rule.type && Math.abs(new Date(t.year, t.month, t.day) - today) < 86400000);
            if (!exists) {
                data.unshift({
                    id: Date.now() + Math.random(), type: rule.type, amount: rule.amount, description: rule.description,
                    category: rule.category, payment: rule.payment || 'নগদ', note: `[স্বয়ংক্রিয়] ${rule.note || ''}`,
                    day: today.getDate(), month: today.getMonth(), year: today.getFullYear()
                });
                added++;
            }
            let newNext = new Date(nextDate);
            if (rule.frequency === 'weekly') newNext.setDate(newNext.getDate() + 7);
            else if (rule.frequency === 'monthly') newNext.setMonth(newNext.getMonth() + 1);
            else if (rule.frequency === 'yearly') newNext.setFullYear(newNext.getFullYear() + 1);
            rule.nextDate = newNext.toISOString().split('T')[0];
        }
    }
    if (added > 0) { saveRecurringRules(); saveData(); showToast(`${added}টি পুনরাবৃত্ত লেনদেন যোগ হয়েছে`); renderDashboard(); renderTransactions(); }
    renderRecurringList();
}
setTimeout(() => processRecurringTransactions(), 500);

function renderRecurringPage() {
    const isBn = settings.language === 'bn';
    const html = `
        <div class="card">
            <div class="category-title"><i class="fas fa-sync-alt"></i> ${isBn ? 'পুনরাবৃত্তি লেনদেনের নিয়ম' : 'Recurring Rules'}</div>
            <div id="recurringList"></div>
            <div style="display:flex; gap:15px; margin-top:20px;">
                <button class="btn-gradient-primary" id="addRecurringBtn" style="flex:1;"><i class="fas fa-plus-circle"></i> ${isBn ? '+ নতুন নিয়ম' : '+ New Rule'}</button>
                <button class="btn-gradient-primary" id="checkNowBtn" style="flex:1;"><i class="fas fa-sync"></i> ${isBn ? 'এখনই চেক করুন' : 'Check Now'}</button>
            </div>
        </div>
    `;
    document.getElementById('recurringPage').innerHTML = html;
    renderRecurringList();
    document.getElementById('addRecurringBtn').addEventListener('click', () => showRecurringModal());
    document.getElementById('checkNowBtn').addEventListener('click', () => { processRecurringTransactions(); showToast('চেক করা হয়েছে'); });
}

function renderRecurringList() {
    const isBn = settings.language === 'bn';
    const container = document.getElementById('recurringList');
    if (!container) return;
    if (recurringRules.length === 0) {
        container.innerHTML = `<div class="empty-state">📭 ${isBn ? 'কোনো পুনরাবৃত্তি নিয়ম নেই। উপরে "+ নতুন নিয়ম" বাটনে ক্লিক করুন।' : 'No recurring rules. Click "+ New Rule" above.'}</div>`;
        return;
    }
    container.innerHTML = recurringRules.map((rule, idx) => `
        <div class="recurring-item">
            <div class="recurring-header">
                <span class="recurring-name">${rule.type === 'income' ? '💚' : '❤️'} ${escapeHtml(rule.description)}</span>
                <span class="recurring-amount ${rule.type}">${fmt(rule.amount)}</span>
            </div>
            <div class="recurring-meta">
                <span>${rule.frequency === 'weekly' ? (isBn ? '📅 সাপ্তাহিক' : '📅 Weekly') : rule.frequency === 'monthly' ? (isBn ? '📆 মাসিক' : '📆 Monthly') : (isBn ? '📅 বার্ষিক' : '📅 Yearly')}</span>
                <span><i class="far fa-calendar-alt"></i> ${isBn ? 'পরবর্তী' : 'Next'}: ${rule.nextDate || (isBn ? 'নির্ধারিত নয়' : 'Not set')}</span>
                <span class="category-badge">${escapeHtml(rule.category)}</span>
            </div>
            <div class="recurring-actions">
                <button class="btn-edit-recurring" onclick="showRecurringModal(${idx})"><i class="fas fa-edit"></i> ${isBn ? 'সম্পাদনা' : 'Edit'}</button>
                <button class="btn-delete-recurring" onclick="deleteRecurring(${idx})"><i class="fas fa-trash"></i> ${isBn ? 'মুছুন' : 'Delete'}</button>
            </div>
        </div>
    `).join('');
}

function showRecurringModal(editIndex = -1) {
    const isBn = settings.language === 'bn';
    const rule = editIndex >= 0 ? recurringRules[editIndex] : null;
    const getCategoriesForType = (type) => type === 'income' ? categories.income : categories.expense;

    Swal.fire({
        title: rule ? (isBn ? '✏️ নিয়ম সম্পাদনা' : '✏️ Edit Rule') : (isBn ? '➕ নতুন নিয়ম' : '➕ New Rule'),
        html: `
            <div class="outline-input">
                <select id="recType">
                    <option value=""></option>
                    <option value="income" ${rule && rule.type === 'income' ? 'selected' : ''}>💚 ${isBn ? 'আয়' : 'Income'}</option>
                    <option value="expense" ${rule && rule.type === 'expense' ? 'selected' : ''}>❤️ ${isBn ? 'ব্যয়' : 'Expense'}</option>
                </select>
                <label for="recType">🔄 ${isBn ? 'লেনদেনের ধরন' : 'Transaction Type'}</label>
            </div>
            <div class="outline-input">
                <input type="text" id="recDesc" placeholder=" " value="${rule ? escapeHtml(rule.description) : ''}">
                <label for="recDesc">📝 ${isBn ? 'বিবরণ (যেমন: বিদ্যুৎ বিল)' : 'Description (e.g. Utility Bill)'}</label>
            </div>
            <div class="outline-input">
                <input type="number" id="recAmount" placeholder=" " value="${rule ? rule.amount : ''}">
                <label for="recAmount">💰 ${isBn ? 'পরিমাণ (৳)' : 'Amount (৳)'}</label>
            </div>
            <div class="outline-input">
                <select id="recCategory">
                    <option value=""></option>
                    ${getCategoriesForType(rule ? rule.type : 'income').map(c => `<option ${rule && rule.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
                <label for="recCategory">🏷️ ${isBn ? 'ক্যাটাগরি' : 'Category'}</label>
            </div>
            <div class="outline-input">
                <select id="recPayment">
                    <option value=""></option>
                    ${paymentMethods.map(p => `<option ${rule && rule.payment === p ? 'selected' : ''}>${p}</option>`).join('')}
                </select>
                <label for="recPayment">💳 ${isBn ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}</label>
            </div>
            <div class="outline-input">
                <select id="recFrequency">
                    <option value=""></option>
                    <option value="weekly" ${rule && rule.frequency === 'weekly' ? 'selected' : ''}>${isBn ? 'সাপ্তাহিক (প্রতি 7 দিনে)' : 'Weekly (every 7 days)'}</option>
                    <option value="monthly" ${rule && rule.frequency === 'monthly' ? 'selected' : ''}>${isBn ? 'মাসিক (প্রতি মাসে)' : 'Monthly (every month)'}</option>
                    <option value="yearly" ${rule && rule.frequency === 'yearly' ? 'selected' : ''}>${isBn ? 'বার্ষিক (প্রতি বছরে)' : 'Yearly (every year)'}</option>
                </select>
                <label for="recFrequency">🔄 ${isBn ? 'পুনরাবৃত্তি সময়কাল' : 'Frequency'}</label>
            </div>
            <div class="outline-input">
                <input type="date" id="recNextDate" placeholder=" " value="${rule ? rule.nextDate || new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}">
                <label for="recNextDate">📅 ${isBn ? 'পরবর্তী কার্যকর তারিখ' : 'Next Effective Date'}</label>
            </div>
            <div class="outline-input">
                <textarea id="recNote" rows="2" placeholder=" ">${rule ? rule.note || '' : ''}</textarea>
                <label for="recNote">📝 ${isBn ? 'নোট (ঐচ্ছিক)' : 'Note (Optional)'}</label>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: rule ? (isBn ? '✅ আপডেট করুন' : '✅ Update') : (isBn ? '➕ যোগ করুন' : '➕ Add'),
        cancelButtonText: isBn ? 'বাতিল' : 'Cancel',
        customClass: { popup: 'responsive-payment-popup' },
        didOpen: () => {
            const typeSelect = document.getElementById('recType');
            const categorySelect = document.getElementById('recCategory');
            const updateCategories = () => {
                const selectedType = typeSelect.value;
                const currentCategoryValue = categorySelect.value;
                const categoriesForType = getCategoriesForType(selectedType);
                categorySelect.innerHTML = '<option value=""></option>' + categoriesForType.map(c => `<option value="${c}" ${currentCategoryValue === c ? 'selected' : ''}>${c}</option>`).join('');
            };
            typeSelect.addEventListener('change', updateCategories);
        },
        preConfirm: () => {
            const type = document.getElementById('recType').value;
            const desc = document.getElementById('recDesc').value.trim();
            const amt = parseFloat(document.getElementById('recAmount').value);
            const category = document.getElementById('recCategory').value;
            const payment = document.getElementById('recPayment').value;
            const frequency = document.getElementById('recFrequency').value;
            const nextDate = document.getElementById('recNextDate').value;
            const note = document.getElementById('recNote').value;
            if (!type) return Swal.showValidationMessage(isBn ? 'লেনদেনের ধরন নির্বাচন করুন' : 'Select transaction type');
            if (!desc || !amt) return Swal.showValidationMessage(isBn ? 'বিবরণ ও পরিমাণ দিন' : 'Enter description and amount');
            if (amt <= 0) return Swal.showValidationMessage(isBn ? 'পরিমাণ অবশ্যই 0 এর বেশি হতে হবে' : 'Amount must be greater than 0');
            if (!category) return Swal.showValidationMessage(isBn ? 'ক্যাটাগরি নির্বাচন করুন' : 'Select category');
            if (!payment) return Swal.showValidationMessage(isBn ? 'পেমেন্ট মাধ্যম নির্বাচন করুন' : 'Select payment method');
            if (!frequency) return Swal.showValidationMessage(isBn ? 'পুনরাবৃত্তি সময়কাল নির্বাচন করুন' : 'Select frequency');
            if (!nextDate) return Swal.showValidationMessage(isBn ? 'পরবর্তী কার্যকর তারিখ দিন' : 'Enter next effective date');
            return { type, description: desc, amount: amt, category, payment, frequency, nextDate, note };
        }
    }).then(res => {
        if (res.isConfirmed) {
            if (editIndex >= 0) recurringRules[editIndex] = res.value;
            else recurringRules.push(res.value);
            saveRecurringRules();
            renderRecurringList();
            processRecurringTransactions();
            showToast(editIndex >= 0 ? (isBn ? '✅ নিয়ম আপডেট হয়েছে' : '✅ Rule updated') : (isBn ? '✅ নতুন নিয়ম যোগ হয়েছে' : '✅ New rule added'));
        }
    });
}

function deleteRecurring(idx) {
    const isBn = settings.language === 'bn';
    if (confirm(isBn ? '❓ এই নিয়মটি মুছে ফেলতে চান?' : '❓ Delete this rule?')) {
        recurringRules.splice(idx, 1);
        saveRecurringRules();
        renderRecurringList();
        showToast(isBn ? '🗑️ নিয়মটি মুছে ফেলা হয়েছে' : '🗑️ Rule deleted');
    }
}

// ========== ক্যালকুলেটর ==========
function renderCalculatorPage() {
    document.getElementById('calculatorPage').innerHTML = `
        <div class="card">
            <div class="calculator-display" id="calcDisplay">0</div>
            <div class="calculator-buttons">
                <div class="calc-btn" onclick="calcAppend('7')">7</div><div class="calc-btn" onclick="calcAppend('8')">8</div><div class="calc-btn" onclick="calcAppend('9')">9</div><div class="calc-btn operator" onclick="calcAppend('/')">÷</div>
                <div class="calc-btn" onclick="calcAppend('4')">4</div><div class="calc-btn" onclick="calcAppend('5')">5</div><div class="calc-btn" onclick="calcAppend('6')">6</div><div class="calc-btn operator" onclick="calcAppend('*')">×</div>
                <div class="calc-btn" onclick="calcAppend('1')">1</div><div class="calc-btn" onclick="calcAppend('2')">2</div><div class="calc-btn" onclick="calcAppend('3')">3</div><div class="calc-btn operator" onclick="calcAppend('-')">−</div>
                <div class="calc-btn" onclick="calcAppend('0')">0</div><div class="calc-btn" onclick="calcAppend('.')">.</div><div class="calc-btn" onclick="calcPercent()">%</div><div class="calc-btn operator" onclick="calcAppend('+')">+</div>
                <div class="calc-btn clear" onclick="calcClear()">C</div><div class="calc-btn" onclick="calcAppend('00')">00</div><div class="calc-btn" onclick="calcBackspace()">⌫</div><div class="calc-btn equals" onclick="calcResult()">=</div>
            </div>
        </div>
    `;
    calcExpression = '';
}
window.calcAppend = (v) => { calcExpression += v; document.getElementById('calcDisplay').innerText = calcExpression || '0'; };
window.calcClear = () => { calcExpression = ''; document.getElementById('calcDisplay').innerText = '0'; };
window.calcBackspace = () => { calcExpression = calcExpression.slice(0, -1); document.getElementById('calcDisplay').innerText = calcExpression || '0'; };
window.calcPercent = () => {
    try {
        let last = '', expr = calcExpression;
        for (let i = expr.length - 1; i >= 0; i--) { if ('0123456789.'.includes(expr[i])) last = expr[i] + last; else break; }
        if (last) {
            let pv = parseFloat(last) / 100;
            let newExpr = expr.slice(0, expr.length - last.length);
            if (newExpr && '+-*/'.includes(newExpr.slice(-1))) calcExpression = newExpr + pv;
            else calcExpression = pv.toString();
            document.getElementById('calcDisplay').innerText = calcExpression;
            calcResult();
        }
    } catch (e) { calcExpression = '0'; document.getElementById('calcDisplay').innerText = '0'; }
};
window.calcResult = () => {
    try { let r = eval(calcExpression.replace(/×/g, '*').replace(/÷/g, '/')); calcExpression = r.toString(); document.getElementById('calcDisplay').innerText = calcExpression; }
    catch (e) { document.getElementById('calcDisplay').innerText = 'Error'; calcExpression = ''; }
};

// ========== ফ্লোটিং ক্যালকুলেটর ==========
let calcFloatingExpression = '';

function toggleCalcModal() {
    const modal = document.getElementById('calcModal');
    modal.classList.toggle('active');
    if (modal.classList.contains('active')) {
        calcFloatingExpression = '';
        document.getElementById('calcDisplayFloating').innerText = '0';
    }
}

function calcAppendFloating(v) {
    calcFloatingExpression += v;
    document.getElementById('calcDisplayFloating').innerText = calcFloatingExpression || '0';
}

function calcClearFloating() {
    calcFloatingExpression = '';
    document.getElementById('calcDisplayFloating').innerText = '0';
}

function calcBackspaceFloating() {
    calcFloatingExpression = calcFloatingExpression.slice(0, -1);
    document.getElementById('calcDisplayFloating').innerText = calcFloatingExpression || '0';
}

function calcPercentFloating() {
    try {
        let last = '', expr = calcFloatingExpression;
        for (let i = expr.length - 1; i >= 0; i--) {
            if ('0123456789.'.includes(expr[i])) last = expr[i] + last;
            else break;
        }
        if (last) {
            let pv = parseFloat(last) / 100;
            let newExpr = expr.slice(0, expr.length - last.length);
            if (newExpr && '+-*/'.includes(newExpr.slice(-1))) {
                calcFloatingExpression = newExpr + pv;
            } else {
                calcFloatingExpression = pv.toString();
            }
            document.getElementById('calcDisplayFloating').innerText = calcFloatingExpression;
            calcResultFloating();
        }
    } catch (e) {
        calcFloatingExpression = '0';
        document.getElementById('calcDisplayFloating').innerText = '0';
    }
}

function calcResultFloating() {
    try {
        let r = eval(calcFloatingExpression.replace(/×/g, '*').replace(/÷/g, '/'));
        calcFloatingExpression = r.toString();
        document.getElementById('calcDisplayFloating').innerText = calcFloatingExpression;
    } catch (e) {
        document.getElementById('calcDisplayFloating').innerText = 'Error';
        calcFloatingExpression = '';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('floatingCalcBtn')?.addEventListener('click', toggleCalcModal);
    document.getElementById('calcModalClose')?.addEventListener('click', toggleCalcModal);
    
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('calcModal');
        const btn = document.getElementById('floatingCalcBtn');
        if (modal && modal.classList.contains('active')) {
            if (!modal.contains(e.target) && e.target !== btn && !btn?.contains(e.target)) {
                modal.classList.remove('active');
            }
        }
    });
});

// ========== সঞ্চয় ==========
function getTotalSavings() {
    return data.filter(d => d.type === 'income').reduce((s, d) => s + d.amount, 0) - data.filter(d => d.type === 'expense').reduce((s, d) => s + d.amount, 0);
}
let savingsFilter = 'all';
function renderSavingsPage() {
    const isBn = settings.language === 'bn';
    const totalSaved = getTotalSavings();
    const totalTarget = savingsGoals.reduce((s, g) => s + g.target, 0);
    const percent = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;
    const html = `
        <div class="savings-stats-card"><div class="savings-percent">${percent}%</div><div class="savings-label">${isBn ? 'সঞ্চয়ের অগ্রগতি' : 'Savings Progress'}</div><div class="savings-amount">${fmt(totalSaved)}</div><div class="savings-sub">${fmt(totalSaved)} / ${fmt(totalTarget)}</div></div>
        <div class="savings-filter"><button class="filter-btn ${savingsFilter === 'all' ? 'active' : ''}" onclick="setSavingsFilter('all')">${isBn ? 'সব' : 'All'}</button><button class="filter-btn ${savingsFilter === 'active' ? 'active' : ''}" onclick="setSavingsFilter('active')">${isBn ? 'চলমান' : 'Active'}</button><button class="filter-btn ${savingsFilter === 'completed' ? 'active' : ''}" onclick="setSavingsFilter('completed')">${isBn ? 'সম্পন্ন' : 'Completed'}</button></div>
        <div id="savingsList"></div>
        <button class="btn-gradient-primary" onclick="addSavingsGoal()"><i class="fas fa-plus-circle"></i> ${isBn ? 'নতুন সঞ্চয় লক্ষ্য' : 'New Savings Goal'}</button>
    `;
    document.getElementById('savingsPage').innerHTML = html;
    renderSavingsList();
}
function setSavingsFilter(filter) { savingsFilter = filter; renderSavingsPage(); }
function renderSavingsList() {
    const isBn = settings.language === 'bn';
    const container = document.getElementById('savingsList');
    if (!container) return;
    const totalSaved = getTotalSavings();
    let filtered = savingsGoals;
    if (savingsFilter === 'active') filtered = savingsGoals.filter(g => totalSaved < g.target);
    if (savingsFilter === 'completed') filtered = savingsGoals.filter(g => totalSaved >= g.target);
    if (filtered.length === 0) { container.innerHTML = `<div class="empty-state">${isBn ? 'কোনো সঞ্চয় লক্ষ্য নেই' : 'No savings goals'}</div>`; return; }
    container.innerHTML = filtered.map((goal, idx) => {
        const p = goal.target > 0 ? Math.min(100, Math.round((totalSaved / goal.target) * 100)) : 0;
        return `<div class="savings-goal-card"><div class="savings-goal-header"><span class="savings-goal-name">${escapeHtml(goal.name)}</span><span class="savings-goal-amount">${fmt(goal.target)}</span></div><div class="savings-goal-progress"><div class="savings-goal-progress-fill" style="width:${p}%"></div></div><div class="savings-goal-stats"><span>${isBn ? 'শুরুর তারিখ' : 'Start Date'}: ${goal.startDate || (isBn ? 'শুরুর তারিখ' : 'Start Date')}</span><span>${isBn ? 'প্রাথমিক জমা' : 'Initial Deposit'}: ${fmt(goal.initialDeposit || 0)}</span><span>${isBn ? 'বর্তমান' : 'Current'}: ${fmt(totalSaved)}</span><span>${p}% ${isBn ? 'সম্পন্ন' : 'Complete'}</span></div><div class="savings-goal-actions"><button class="btn-add-money" onclick="addToSavings(${idx})"><i class="fas fa-plus-circle"></i> ${isBn ? 'টাকা যোগ' : 'Add Money'}</button><button class="btn-withdraw" onclick="withdrawFromSavings(${idx})"><i class="fas fa-minus-circle"></i> ${isBn ? 'তুলুন' : 'Withdraw'}</button><button class="btn-delete" onclick="deleteSavingsGoal(${idx})"><i class="fas fa-trash"></i></button></div></div>`;
    }).join('');
}
function addSavingsGoal() {
    const isBn = settings.language === 'bn';
    Swal.fire({
        title: isBn ? '🎯 সঞ্চয় লক্ষ্য যোগ করুন' : '🎯 Add Savings Goal',
        html: `
            <div class="outline-input"><input type="text" id="goalName" placeholder=" "><label for="goalName">🎯 ${isBn ? 'সঞ্চয়ের নাম' : 'Goal Name'}</label></div>
            <div class="outline-input"><input type="number" id="goalTarget" placeholder=" "><label for="goalTarget">💰 ${isBn ? 'লক্ষ্যের পরিমাণ (টাকা)' : 'Target Amount (৳)'}</label></div>
            <div class="outline-input"><input type="number" id="initialDeposit" placeholder=" "><label for="initialDeposit">💵 ${isBn ? 'প্রাথমিক জমা (ঐচ্ছিক)' : 'Initial Deposit (Optional)'}</label></div>
            <div class="outline-input"><input type="date" id="startDate" placeholder=" "><label for="startDate">📅 ${isBn ? 'শুরুর তারিখ' : 'Start Date'}</label></div>
        `,
        showCancelButton: true, confirmButtonText: isBn ? 'যোগ করুন' : 'Add', cancelButtonText: isBn ? 'বাতিল' : 'Cancel',
        customClass: { popup: 'responsive-payment-popup' },
        preConfirm: () => { let name = document.getElementById('goalName').value.trim(), target = parseFloat(document.getElementById('goalTarget').value); if (!name || !target) Swal.showValidationMessage(isBn ? 'নাম ও পরিমাণ দিন' : 'Enter name and amount'); return { name, target, initialDeposit: parseFloat(document.getElementById('initialDeposit').value) || 0, startDate: document.getElementById('startDate').value }; }
    }).then(res => { if (res.isConfirmed) { savingsGoals.push(res.value); saveSavingsGoals(); renderSavingsPage(); showToast(isBn ? '✅ সঞ্চয় লক্ষ্য যোগ হয়েছে' : '✅ Savings goal added'); } });
}
function addToSavings(idx) {
    const isBn = settings.language === 'bn';
    Swal.fire({ title: isBn ? '💰 টাকা যোগ করুন' : '💰 Add Money', input: 'number', inputPlaceholder: isBn ? 'পরিমাণ (৳)' : 'Amount (৳)', showCancelButton: true, confirmButtonText: isBn ? 'যোগ করুন' : 'Add', preConfirm: (amt) => { if (!amt || amt <= 0) Swal.showValidationMessage(isBn ? 'সঠিক পরিমাণ দিন' : 'Enter valid amount'); return parseFloat(amt); } })
        .then(res => { if (res.isConfirmed) { data.unshift({ id: Date.now(), type: 'expense', amount: res.value, description: `${isBn ? 'সঞ্চয়' : 'Savings'}: ${savingsGoals[idx].name}`, category: 'সঞ্চয়', payment: 'নগদ', note: '', day: now.getDate(), month: currentMonth, year: currentYear }); saveData(); renderDashboard(); renderTransactions(); renderSavingsPage(); showToast(`${fmt(res.value)} ${isBn ? 'সঞ্চয়ে যোগ হয়েছে' : 'added to savings'}`); } });
}
function withdrawFromSavings(idx) {
    const isBn = settings.language === 'bn';
    Swal.fire({ title: isBn ? '💰 টাকা তোলুন' : '💰 Withdraw Money', input: 'number', inputPlaceholder: isBn ? 'পরিমাণ (৳)' : 'Amount (৳)', showCancelButton: true, confirmButtonText: isBn ? 'তুলুন' : 'Withdraw', preConfirm: (amt) => { if (!amt || amt <= 0) Swal.showValidationMessage(isBn ? 'সঠিক পরিমাণ দিন' : 'Enter valid amount'); return parseFloat(amt); } })
        .then(res => { if (res.isConfirmed) { data.unshift({ id: Date.now(), type: 'income', amount: res.value, description: `${isBn ? 'সঞ্চয় থেকে উত্তোলন' : 'Withdrawal from savings'}: ${savingsGoals[idx].name}`, category: 'অন্যান্য আয়', payment: 'নগদ', note: '', day: now.getDate(), month: currentMonth, year: currentYear }); saveData(); renderDashboard(); renderTransactions(); renderSavingsPage(); showToast(`${fmt(res.value)} ${isBn ? 'উত্তোলন করা হয়েছে' : 'withdrawn'}`); } });
}
function deleteSavingsGoal(idx) { const isBn = settings.language === 'bn'; if (confirm(isBn ? 'মুছবেন?' : 'Delete?')) { savingsGoals.splice(idx, 1); saveSavingsGoals(); renderSavingsPage(); showToast(isBn ? '🗑️ মুছে ফেলা হয়েছে' : '🗑️ Deleted'); } }

// ========== বিনিয়োগ ==========
function renderInvestmentPage() {
    const isBn = settings.language === 'bn';
    const totalInv = investments.reduce((s, i) => s + i.amount, 0);
    const html = `<div class="investment-stats-card"><div class="savings-amount">${fmt(totalInv)}</div><div class="savings-label">${isBn ? 'মোট বিনিয়োগ' : 'Total Investment'}</div></div><div id="investmentsList"></div><button class="btn-gradient-primary" onclick="addInvestment()"><i class="fas fa-plus-circle"></i> ${isBn ? 'নতুন বিনিয়োগ যুক্ত করুন' : 'Add New Investment'}</button>`;
    document.getElementById('investmentPage').innerHTML = html;
    renderInvestmentsList();
}
function renderInvestmentsList() {
    const isBn = settings.language === 'bn';
    const container = document.getElementById('investmentsList');
    if (!container) return;
    if (investments.length === 0) { container.innerHTML = `<div class="empty-state">${isBn ? 'কোনো বিনিয়োগ নেই' : 'No investments'}</div>`; return; }
    container.innerHTML = investments.map((inv, idx) => `<div class="investment-card"><div class="investment-header"><span class="investment-name">${escapeHtml(inv.name)}</span><span class="investment-type">${inv.type || (isBn ? 'সাধারণ' : 'General')}</span></div><div class="investment-details"><span>${isBn ? 'পরিমাণ' : 'Amount'}: ${fmt(inv.amount)}</span><span>${isBn ? 'হার' : 'Rate'}: ${inv.interest || 0}%</span></div><div class="investment-maturity"><i class="fas fa-calendar-alt"></i> ${isBn ? 'শুরুর তারিখ' : 'Start Date'}: ${inv.startDate || (isBn ? 'শুরুর তারিখ' : 'Start Date')} | ${isBn ? 'মেয়াদ উত্তীর্ণের তারিখ' : 'Maturity Date'}: ${inv.maturityDate || (isBn ? 'শেষের তারিখ' : 'End Date')}</div><div class="investment-actions"><button class="btn-edit-invest" onclick="editInvestment(${idx})"><i class="fas fa-edit"></i> ${isBn ? 'সম্পাদনা' : 'Edit'}</button><button class="btn-delete-invest" onclick="deleteInvestment(${idx})"><i class="fas fa-trash"></i> ${isBn ? 'মুছুন' : 'Delete'}</button></div></div>`).join('');
}
function addInvestment() {
    const isBn = settings.language === 'bn';
    Swal.fire({
        title: isBn ? '📈 নতুন বিনিয়োগ' : '📈 New Investment',
        html: `
            <div class="outline-input"><input type="text" id="invName" placeholder=" "><label for="invName">📊 ${isBn ? 'বিনিয়োগের নাম' : 'Investment Name'}</label></div>
            <div class="outline-input"><select id="invType"><option value=""></option><option value="ডিপিএস">${isBn ? 'ডিপিএস' : 'DPS'}</option><option value="এফডিআর">${isBn ? 'এফডিআর' : 'FDR'}</option><option value="শেয়ার">${isBn ? 'শেয়ার' : 'Share'}</option><option value="সঞ্চয়পত্র">${isBn ? 'সঞ্চয়পত্র' : 'Savings Certificate'}</option><option value="অন্যান্য">${isBn ? 'অন্যান্য' : 'Other'}</option></select><label for="invType">🏷️ ${isBn ? 'বিনিয়োগের ধরন' : 'Investment Type'}</label></div>
            <div class="outline-input"><input type="number" id="invAmount" placeholder=" "><label for="invAmount">💰 ${isBn ? 'পরিমাণ (টাকা)' : 'Amount (৳)'}</label></div>
            <div class="outline-input"><input type="number" id="invInterest" placeholder=" "><label for="invInterest">📈 ${isBn ? 'সুদহার (%)' : 'Interest Rate (%)'}</label></div>
            <div class="outline-input"><input type="date" id="invStartDate" placeholder=" "><label for="invStartDate">📅 ${isBn ? 'শুরুর তারিখ' : 'Start Date'}</label></div>
            <div class="outline-input"><input type="date" id="invMaturityDate" placeholder=" "><label for="invMaturityDate">📅 ${isBn ? 'মেয়াদ উত্তীর্ণের তারিখ' : 'Maturity Date'}</label></div>
        `,
        showCancelButton: true, confirmButtonText: isBn ? 'যোগ করুন' : 'Add', cancelButtonText: isBn ? 'বাতিল' : 'Cancel',
        customClass: { popup: 'responsive-payment-popup' },
        preConfirm: () => { let name = document.getElementById('invName').value.trim(), amt = parseFloat(document.getElementById('invAmount').value); if (!name || !amt) Swal.showValidationMessage(isBn ? 'নাম ও পরিমাণ দিন' : 'Enter name and amount'); return { name, type: document.getElementById('invType').value, amount: amt, interest: parseFloat(document.getElementById('invInterest').value) || 0, startDate: document.getElementById('invStartDate').value, maturityDate: document.getElementById('invMaturityDate').value }; }
    }).then(res => { if (res.isConfirmed) { investments.push(res.value); saveInvestments(); renderInvestmentPage(); showToast(isBn ? '✅ বিনিয়োগ যোগ হয়েছে' : '✅ Investment added'); } });
}
function editInvestment(idx) {
    const isBn = settings.language === 'bn';
    const inv = investments[idx];
    Swal.fire({
        title: isBn ? '✏️ বিনিয়োগ সম্পাদনা' : '✏️ Edit Investment',
        html: `
            <div class="outline-input"><input type="text" id="invName" value="${escapeHtml(inv.name)}" placeholder=" "><label for="invName">📊 ${isBn ? 'বিনিয়োগের নাম' : 'Investment Name'}</label></div>
            <div class="outline-input"><select id="invType"><option value=""></option><option value="ডিপিএস" ${inv.type === 'ডিপিএস' ? 'selected' : ''}>${isBn ? 'ডিপিএস' : 'DPS'}</option><option value="এফডিআর" ${inv.type === 'এফডিআর' ? 'selected' : ''}>${isBn ? 'এফডিআর' : 'FDR'}</option><option value="শেয়ার" ${inv.type === 'শেয়ার' ? 'selected' : ''}>${isBn ? 'শেয়ার' : 'Share'}</option><option value="সঞ্চয়পত্র" ${inv.type === 'সঞ্চয়পত্র' ? 'selected' : ''}>${isBn ? 'সঞ্চয়পত্র' : 'Savings Certificate'}</option><option value="অন্যান্য" ${inv.type === 'অন্যান্য' ? 'selected' : ''}>${isBn ? 'অন্যান্য' : 'Other'}</option></select><label for="invType">🏷️ ${isBn ? 'বিনিয়োগের ধরন' : 'Investment Type'}</label></div>
            <div class="outline-input"><input type="number" id="invAmount" value="${inv.amount}" placeholder=" "><label for="invAmount">💰 ${isBn ? 'পরিমাণ (টাকা)' : 'Amount (৳)'}</label></div>
            <div class="outline-input"><input type="number" id="invInterest" value="${inv.interest}" placeholder=" "><label for="invInterest">📈 ${isBn ? 'সুদহার (%)' : 'Interest Rate (%)'}</label></div>
            <div class="outline-input"><input type="date" id="invStartDate" value="${inv.startDate || ''}" placeholder=" "><label for="invStartDate">📅 ${isBn ? 'শুরুর তারিখ' : 'Start Date'}</label></div>
            <div class="outline-input"><input type="date" id="invMaturityDate" value="${inv.maturityDate || ''}" placeholder=" "><label for="invMaturityDate">📅 ${isBn ? 'মেয়াদ উত্তীর্ণের তারিখ' : 'Maturity Date'}</label></div>
        `,
        showCancelButton: true, confirmButtonText: isBn ? 'আপডেট' : 'Update', cancelButtonText: isBn ? 'বাতিল' : 'Cancel',
        customClass: { popup: 'responsive-payment-popup' },
        preConfirm: () => {
            investments[idx] = {
                name: document.getElementById('invName').value.trim(), type: document.getElementById('invType').value,
                amount: parseFloat(document.getElementById('invAmount').value), interest: parseFloat(document.getElementById('invInterest').value) || 0,
                startDate: document.getElementById('invStartDate').value, maturityDate: document.getElementById('invMaturityDate').value
            };
            saveInvestments(); renderInvestmentPage(); showToast(isBn ? '✅ আপডেট হয়েছে' : '✅ Updated');
        }
    });
}
function deleteInvestment(idx) { const isBn = settings.language === 'bn'; if (confirm(isBn ? 'মুছবেন?' : 'Delete?')) { investments.splice(idx, 1); saveInvestments(); renderInvestmentPage(); showToast(isBn ? '🗑️ মুছে ফেলা হয়েছে' : '🗑️ Deleted'); } }

// ========== ধার-দেনা ==========
function renderLoanPage() {
    const isBn = settings.language === 'bn';
    const giveTotal = loans.filter(l => l.type === 'give' && l.status !== 'paid').reduce((s, l) => s + l.amount, 0);
    const takeTotal = loans.filter(l => l.type === 'take' && l.status !== 'paid').reduce((s, l) => s + l.amount, 0);
    const netReceivable = giveTotal - takeTotal;
    const html = `
        <div class="loan-summary-grid">
            <div class="loan-stat-card"><div class="loan-stat-icon">📤</div><div class="loan-stat-value">${fmt(giveTotal)}</div><div class="loan-stat-label">${isBn ? 'আমি দিয়েছি' : 'Given'}</div></div>
            <div class="loan-stat-card"><div class="loan-stat-icon">📥</div><div class="loan-stat-value">${fmt(takeTotal)}</div><div class="loan-stat-label">${isBn ? 'আমি নিয়েছি' : 'Taken'}</div></div>
            <div class="loan-stat-card"><div class="loan-stat-icon">⚖️</div><div class="loan-stat-value" style="color:${netReceivable >= 0 ? 'var(--income)' : 'var(--expense)'}">${fmt(Math.abs(netReceivable))}</div><div class="loan-stat-label">${netReceivable >= 0 ? (isBn ? 'পাওনা' : 'Receivable') : (isBn ? 'প্রাপ্য' : 'Payable')}</div></div>
        </div>
        <div id="loanModernListContainer" class="loan-list-modern"></div>
        <button class="btn-gradient-primary" onclick="openModernLoanModal()"><i class="fas fa-plus-circle"></i> ${isBn ? 'নতুন ধার-দেনা যোগ করুন' : 'Add New Loan'}</button>
    `;
    document.getElementById('loanPage').innerHTML = html;
    renderModernLoanList();
}

function renderModernLoanList() {
    const isBn = settings.language === 'bn';
    const container = document.getElementById('loanModernListContainer');
    if (!container) return;
    if (loans.length === 0) {
        container.innerHTML = `<div class="empty-state">🤝 ${isBn ? 'কোনো ধার-দেনা নেই। নতুন যোগ করুন' : 'No loans. Add new'}</div>`;
        return;
    }
    container.innerHTML = loans.map((loan, idx) => {
        const remaining = loan.amount - (loan.paidAmount || 0);
        const percent = loan.amount > 0 ? Math.min(100, Math.round(((loan.paidAmount || 0) / loan.amount) * 100)) : 0;
        const isOverdue = loan.status !== 'paid' && loan.dueDate && new Date(loan.dueDate) < new Date();
        const statusText = loan.status === 'paid' ? (isBn ? 'পরিশোধিত' : 'Paid') : (isOverdue ? (isBn ? 'মেয়াদউত্তীর্ণ' : 'Overdue') : (isBn ? 'বাকি' : 'Pending'));
        const statusColor = loan.status === 'paid' ? '#10B981' : (isOverdue ? '#EF4444' : '#F59E0B');
        return `
            <div class="loan-modern-card" onclick="openLoanDetailModal(${idx})">
                <div class="loan-card-header">
                    <div class="loan-person"><div class="loan-avatar">${loan.type === 'give' ? '👤' : '🤝'}</div><div><div class="loan-name">${escapeHtml(loan.name)}</div><div style="font-size:11px;color:var(--text-muted)">${loan.type === 'give' ? (isBn ? 'আমি দিয়েছি' : 'Given') : (isBn ? 'আমি নিয়েছি' : 'Taken')}</div></div></div>
                    <div class="loan-badge ${loan.type === 'give' ? 'give' : 'take'}">${loan.type === 'give' ? (isBn ? 'দেওয়া' : 'Given') : (isBn ? 'নেয়া' : 'Taken')}</div>
                </div>
                <div class="loan-amount-modern">${fmt(loan.amount)}</div>
                <div class="loan-progress-area"><div class="progress-bar-bg"><div class="progress-fill" style="width:${percent}%"></div></div><div style="display:flex; justify-content:space-between; margin-top:6px; font-size:11px;"><span>${isBn ? 'পরিশোধিত' : 'Paid'}: ${fmt(loan.paidAmount || 0)}</span><span>${isBn ? 'বাকি' : 'Remaining'}: ${fmt(remaining)}</span></div></div>
                <div class="loan-footer"><span><i class="far fa-calendar-alt"></i> ${isBn ? 'দেওয়ার তারিখ' : 'Loan Date'}: ${loan.loanDate || (isBn ? 'তারিখ নেই' : 'No date')}</span><span style="color:${statusColor}">${statusText}</span></div>
                <div class="loan-actions">
                    <button class="btn-edit-loan" onclick="event.stopPropagation(); openEditLoanModal(${idx})"><i class="fas fa-edit"></i> ${isBn ? 'সম্পাদনা' : 'Edit'}</button>
                    <button class="btn-delete-loan" onclick="event.stopPropagation(); deleteLoanItem(${idx})"><i class="fas fa-trash"></i> ${isBn ? 'মুছুন' : 'Delete'}</button>
                </div>
            </div>
        `;
    }).join('');
}

function deleteLoanItem(idx) {
    const isBn = settings.language === 'bn';
    if (confirm(isBn ? '❓ এই ধার-দেনাটি মুছে ফেলতে চান?' : '❓ Delete this loan?')) {
        loans.splice(idx, 1);
        saveLoans();
        renderLoanPage();
        showToast(isBn ? '🗑️ ধার-দেনা মুছে ফেলা হয়েছে' : '🗑️ Loan deleted');
    }
}

function openLoanDetailModal(loanIdx) {
    const isBn = settings.language === 'bn';
    const loan = loans[loanIdx];
    if (!loan) return;
    const remaining = loan.amount - (loan.paidAmount || 0);
    const paidPercent = loan.amount > 0 ? Math.round(((loan.paidAmount || 0) / loan.amount) * 100) : 0;
    let historyHtml = '';
    if (loan.transactions && loan.transactions.length > 0) {
        historyHtml = loan.transactions.map(tx => `<div class="history-item"><span>${tx.date || (isBn ? 'তারিখ নেই' : 'No date')}</span><span>${fmt(tx.amount)}</span><span>${tx.account || tx.type === 'late_fee' ? (isBn ? 'জরিমানা' : 'Late Fee') : (isBn ? 'পরিশোধ' : 'Payment')}</span></div>`).join('');
    } else {
        historyHtml = `<div class="empty-state" style="padding:12px">${isBn ? 'কোনো লেনদেন ইতিহাস নেই' : 'No transaction history'}</div>`;
    }
    Swal.fire({
        title: `<div style="font-size:26px; font-weight:800;">${escapeHtml(loan.name)}</div>`,
        html: `
            <div class="modern-detail-header">
                <div style="font-size:14px; opacity:0.9">${loan.type === 'give' ? (isBn ? 'আমি ধার দিয়েছি' : 'Given') : (isBn ? 'আমি ধার নিয়েছি' : 'Taken')}</div>
                <div class="detail-amount">${fmt(loan.amount)}</div>
                <div style="display:flex; justify-content:center; gap:20px; margin-top:8px;"><div><small>${isBn ? 'পরিশোধিত' : 'Paid'}</small><br><strong>${fmt(loan.paidAmount || 0)}</strong></div><div><small>${isBn ? 'বাকি' : 'Remaining'}</small><br><strong style="color:#FDE047">${fmt(remaining)}</strong></div></div>
                <div class="progress-bar-bg" style="background:rgba(255,255,255,0.3);margin-top:12px;"><div class="progress-fill" style="width:${paidPercent}%; background:white;"></div></div>
            </div>
            <div style="text-align:left; margin-top:12px;">
                <div style="display:flex; gap:12px; justify-content:space-between; background:var(--bg-elevated); padding:10px; border-radius:20px; margin-bottom:16px;">
                    <div><i class="far fa-calendar-check"></i> ${isBn ? 'দেওয়ার তারিখ' : 'Loan Date'}<br><strong>${loan.loanDate || '—'}</strong></div>
                    <div><i class="far fa-calendar-times"></i> ${isBn ? 'শেষ তারিখ' : 'Due Date'}<br><strong>${loan.dueDate || '—'}</strong></div>
                </div>
                <div style="font-weight:700; margin-bottom:8px;">📜 ${isBn ? 'লেনদেন ইতিহাস' : 'Transaction History'}</div>
                <div class="payment-history">${historyHtml}</div>
                <div style="margin-top:18px;"><textarea id="loanNoteUpdate" rows="2" placeholder="${isBn ? 'নোট' : 'Note'}" style="width:100%; background:var(--bg-dark); border:1px solid var(--border); border-radius:20px; padding:10px;">${loan.note || ''}</textarea></div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: loan.status !== 'paid' ? (isBn ? '💰 পরিশোধ করুন' : '💰 Pay Now') : (isBn ? 'সম্পন্ন' : 'Done'),
        cancelButtonText: isBn ? 'বন্ধ' : 'Close',
        showDenyButton: loan.status !== 'paid',
        denyButtonText: isBn ? '✏️ সম্পাদনা' : '✏️ Edit',
        confirmButtonColor: '#10B981',
        denyButtonColor: '#6366F1',
        width: '520px',
        customClass: { popup: 'responsive-payment-popup' },
        preConfirm: () => {
            const newNote = document.getElementById('loanNoteUpdate')?.value;
            if (newNote !== undefined) loan.note = newNote;
            saveLoans();
            renderModernLoanList();
            return true;
        }
    }).then(res => {
        if (res.isConfirmed && loan.status !== 'paid') {
            openPaymentModalForLoan(loanIdx, () => { renderLoanPage(); });
        } else if (res.isDenied) {
            openEditLoanModal(loanIdx);
        }
    });
}

function openPaymentModalForLoan(loanIdx, callback) {
    const isBn = settings.language === 'bn';
    const loan = loans[loanIdx];
    const remaining = loan.amount - (loan.paidAmount || 0);
    Swal.fire({
        title: isBn ? '💸 পরিশোধ করুন' : '💸 Make Payment',
        html: `
            <div style="background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 24px; padding: 20px; margin-bottom: 20px; text-align: center; color: white;">
                <div style="font-size: 14px; opacity: 0.9;">${isBn ? 'বাকি পরিশোধযোগ্য' : 'Remaining Balance'}</div>
                <div style="font-size: 36px; font-weight: 800;">${fmt(remaining)}</div>
                <div class="progress-bar-bg" style="background: rgba(255,255,255,0.3); margin-top: 12px;"><div class="progress-fill" style="width:${Math.round(((loan.paidAmount||0)/loan.amount)*100)}%; background: white;"></div></div>
            </div>
            <div class="outline-input"><input type="number" id="payAmount" placeholder=" "><label for="payAmount">💰 ${isBn ? 'পরিশোধের পরিমাণ (৳)' : 'Payment Amount (৳)'}</label></div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                <div class="outline-input"><input type="date" id="payDate" value="${new Date().toISOString().split('T')[0]}" placeholder=" "><label for="payDate">📅 ${isBn ? 'পরিশোধের তারিখ' : 'Payment Date'}</label></div>
                <div class="outline-input"><select id="payMethod"><option value=""></option>${paymentMethods.map(p => `<option>${p}</option>`).join('')}</select><label for="payMethod">💳 ${isBn ? 'অ্যাকাউন্ট' : 'Account'}</label></div>
            </div>
            <div style="margin-top: 8px;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 8px;"><input type="checkbox" id="includeLateFee"> ⚠️ ${isBn ? 'লেট ফি / জরিমানা যোগ করুন' : 'Add Late Fee / Penalty'}</label>
                <div class="outline-input" id="lateFeeContainer" style="display: none;"><input type="number" id="lateFeeVal" placeholder=" "><label for="lateFeeVal">💰 ${isBn ? 'জরিমানার পরিমাণ (৳)' : 'Penalty Amount (৳)'}</label></div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: isBn ? '✅ নিশ্চিত পরিশোধ' : '✅ Confirm Payment',
        cancelButtonText: isBn ? 'বাতিল' : 'Cancel',
        customClass: { popup: 'responsive-payment-popup' },
        didOpen: () => {
            const chk = document.getElementById('includeLateFee');
            const feeContainer = document.getElementById('lateFeeContainer');
            chk.addEventListener('change', () => { feeContainer.style.display = chk.checked ? 'block' : 'none'; });
        },
        preConfirm: () => {
            let amount = parseFloat(document.getElementById('payAmount').value);
            if (!amount || amount <= 0) Swal.showValidationMessage(isBn ? 'সঠিক পরিমাণ দিন' : 'Enter valid amount');
            if (amount > remaining) Swal.showValidationMessage(`${isBn ? 'বাকি' : 'Remaining'} ${fmt(remaining)} ${isBn ? 'এর বেশি দিতে পারবেন না' : 'cannot exceed'}`);
            let lateFee = 0;
            const chk = document.getElementById('includeLateFee');
            if (chk && chk.checked) {
                const feeVal = parseFloat(document.getElementById('lateFeeVal').value);
                if (!isNaN(feeVal) && feeVal > 0) lateFee = feeVal;
            }
            const method = document.getElementById('payMethod').value;
            if (!method) Swal.showValidationMessage(isBn ? 'অ্যাকাউন্ট নির্বাচন করুন' : 'Select account');
            return { amount, date: document.getElementById('payDate').value, method, lateFee };
        }
    }).then(res => {
        if (res.isConfirmed) {
            const { amount, date, method, lateFee } = res.value;
            if (!loan.paidAmount) loan.paidAmount = 0;
            loan.paidAmount += amount;
            if (!loan.transactions) loan.transactions = [];
            loan.transactions.push({ id: Date.now(), amount, date, account: method, type: 'payment' });
            if (lateFee > 0) {
                loan.amount += lateFee;
                loan.transactions.push({ id: Date.now() + 1, amount: lateFee, date, type: 'late_fee', note: isBn ? 'জরিমানা' : 'Penalty' });
            }
            if (loan.paidAmount >= loan.amount) { loan.status = 'paid'; loan.paidAmount = loan.amount; }
            saveLoans();
            if (callback) callback(); else renderLoanPage();
            showToast(`✅ ${fmt(amount)} ${isBn ? 'পরিশোধ সম্পন্ন হয়েছে' : 'payment completed'}`);
        }
    });
}

function openEditLoanModal(idx) {
    const isBn = settings.language === 'bn';
    const loan = loans[idx];
    Swal.fire({
        title: isBn ? '✏️ ধার-দেনা সম্পাদনা' : '✏️ Edit Loan',
        html: `
            <div class="outline-input"><input type="text" id="editName" value="${escapeHtml(loan.name)}" placeholder=" "><label for="editName">👤 ${isBn ? 'নাম' : 'Name'}</label></div>
            <div class="outline-input"><input type="number" id="editAmount" value="${loan.amount}" placeholder=" "><label for="editAmount">💰 ${isBn ? 'মোট পরিমাণ (টাকা)' : 'Total Amount (৳)'}</label></div>
            <div class="outline-input"><select id="editType"><option value=""></option><option value="give" ${loan.type === 'give' ? 'selected' : ''}>${isBn ? 'আমি দিয়েছি' : 'Given'}</option><option value="take" ${loan.type === 'take' ? 'selected' : ''}>${isBn ? 'আমি নিয়েছি' : 'Taken'}</option></select><label for="editType">🔄 ${isBn ? 'ধরণ' : 'Type'}</label></div>
            <div class="outline-input"><input type="date" id="editLoanDate" value="${loan.loanDate || ''}" placeholder=" "><label for="editLoanDate">📅 ${isBn ? 'দেওয়ার তারিখ' : 'Loan Date'}</label></div>
            <div class="outline-input"><input type="date" id="editDueDate" value="${loan.dueDate || ''}" placeholder=" "><label for="editDueDate">📅 ${isBn ? 'শেষ তারিখ' : 'Due Date'}</label></div>
            <div class="outline-input"><select id="editStatus"><option value="pending" ${loan.status === 'pending' ? 'selected' : ''}>${isBn ? 'বাকি' : 'Pending'}</option><option value="paid" ${loan.status === 'paid' ? 'selected' : ''}>${isBn ? 'পরিশোধিত' : 'Paid'}</option></select><label for="editStatus">✅ ${isBn ? 'স্ট্যাটাস' : 'Status'}</label></div>
        `,
        showCancelButton: true, confirmButtonText: isBn ? 'আপডেট করুন' : 'Update', cancelButtonText: isBn ? 'বাতিল' : 'Cancel',
        customClass: { popup: 'responsive-payment-popup' },
        preConfirm: () => {
            loan.name = document.getElementById('editName').value.trim();
            loan.amount = parseFloat(document.getElementById('editAmount').value);
            loan.type = document.getElementById('editType').value;
            loan.loanDate = document.getElementById('editLoanDate').value;
            loan.dueDate = document.getElementById('editDueDate').value;
            loan.status = document.getElementById('editStatus').value;
            if (loan.status === 'paid') loan.paidAmount = loan.amount;
            if (!loan.paidAmount) loan.paidAmount = loan.paidAmount || 0;
            saveLoans();
            renderLoanPage();
            showToast(isBn ? '✅ হালনাগাদ হয়েছে' : '✅ Updated');
        }
    });
}

function openModernLoanModal() {
    const isBn = settings.language === 'bn';
    Swal.fire({
        title: isBn ? '🤝 নতুন ধার-দেনা' : '🤝 New Loan',
        html: `
            <div class="outline-input"><input type="text" id="loanName" placeholder=" "><label for="loanName">👤 ${isBn ? 'ব্যক্তির নাম বা বিবরণ' : 'Person Name or Description'}</label></div>
            <div class="outline-input"><input type="number" id="loanAmount" placeholder=" "><label for="loanAmount">💰 ${isBn ? 'পরিমাণ (টাকা)' : 'Amount (৳)'}</label></div>
            <div class="outline-input"><select id="loanType"><option value=""></option><option value="give">${isBn ? 'আমি ধার দিয়েছি' : 'I have given'}</option><option value="take">${isBn ? 'আমি ধার নিয়েছি' : 'I have taken'}</option></select><label for="loanType">🔄 ${isBn ? 'ধরণ' : 'Type'}</label></div>
            <div class="outline-input"><input type="date" id="loanDate" placeholder=" "><label for="loanDate">📅 ${isBn ? 'দেওয়ার তারিখ' : 'Loan Date'}</label></div>
            <div class="outline-input"><input type="date" id="dueDate" placeholder=" "><label for="dueDate">📅 ${isBn ? 'শেষ তারিখ' : 'Due Date'}</label></div>
            <div class="outline-input"><textarea id="loanNote" rows="2" placeholder=" "></textarea><label for="loanNote">📝 ${isBn ? 'নোট (ঐচ্ছিক)' : 'Note (Optional)'}</label></div>
        `,
        showCancelButton: true,
        confirmButtonText: isBn ? 'যোগ করুন' : 'Add',
        cancelButtonText: isBn ? 'বাতিল' : 'Cancel',
        customClass: { popup: 'responsive-payment-popup' },
        didOpen: () => {
            document.querySelectorAll('.swal2-popup .outline-input').forEach(container => {
                const input = container.querySelector('input, select, textarea');
                const label = container.querySelector('label');
                if (!input || !label) return;

                const isTextarea = input.tagName === 'TEXTAREA';
                
                function setLabelDefault() {
                    if (isTextarea) {
                        label.style.top = '18px';
                        label.style.transform = 'translateY(0)';
                    } else {
                        label.style.top = '50%';
                        label.style.transform = 'translateY(-50%)';
                    }
                    label.style.fontSize = '14px';
                    label.style.color = '#64748B';
                    label.style.backgroundColor = 'transparent';
                    label.style.padding = '0 6px';
                    label.style.zIndex = '1';
                }

                function setLabelActive() {
                    label.style.top = '-8px';
                    label.style.transform = 'translateY(0) scale(0.85)';
                    label.style.fontSize = '12px';
                    label.style.color = '#6366F1';
                    label.style.backgroundColor = 'white';
                    label.style.padding = '0 6px';
                    label.style.zIndex = '2';
                }

                input.addEventListener('focus', setLabelActive);

                input.addEventListener('blur', function() {
                    const hasValue = this.value && this.value.trim() !== '' && this.value !== '';
                    if (!hasValue) {
                        setLabelDefault();
                    }
                });

                const hasValue = input.value && input.value.trim() !== '' && input.value !== '';
                if (hasValue) {
                    setLabelActive();
                } else {
                    setLabelDefault();
                }
            });
        },
        preConfirm: () => {
            let name = document.getElementById('loanName').value.trim();
            let amt = parseFloat(document.getElementById('loanAmount').value);
            let type = document.getElementById('loanType').value;
            if (!name || !amt || amt <= 0) Swal.showValidationMessage(isBn ? 'নাম ও সঠিক পরিমাণ দিন' : 'Enter name and valid amount');
            if (!type) Swal.showValidationMessage(isBn ? 'ধরণ নির্বাচন করুন' : 'Select type');
            return { 
                name, 
                amount: amt, 
                type, 
                loanDate: document.getElementById('loanDate').value, 
                dueDate: document.getElementById('dueDate').value, 
                note: document.getElementById('loanNote').value, 
                status: 'pending', 
                paidAmount: 0, 
                transactions: [] 
            };
        }
    }).then(res => { 
        if (res.isConfirmed) { 
            loans.push(res.value); 
            saveLoans(); 
            renderLoanPage(); 
            showToast(isBn ? '✅ ধার-দেনা যোগ হয়েছে' : '✅ Loan added'); 
        } 
    });
}

// ========== সেটিংস পেজ ==========
function renderSettingsPage() {
    const isBn = settings.language === 'bn';
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const fontSize = settings.fontSize || 14;
    const primaryColor = settings.primaryColor || '#6366F1';
    const currentGradient = settings.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    const bgImage = localStorage.getItem('bgImage') || null;
    const customColors = settings.customColors || [];
    const hasPassword = isPasswordSet();
    
    const allColors = [...presetColors];
    customColors.forEach(c => {
        allColors.push({ name: 'Custom', value: c, isCustom: true });
    });
    
    const html = `
        <div class="settings-container">
            <!-- থিম সেকশন -->
            <div class="settings-section">
                <div class="settings-section-title">🎨 ${isBn ? 'থিম কাস্টমাইজেশন' : 'Theme Customization'}</div>
                
                <div class="settings-item">
                    <div class="settings-item-left">
                        <div class="settings-item-icon">${isDark ? '🌙' : '☀️'}</div>
                        <div>
                            <div class="settings-item-label">${isBn ? 'থিম' : 'Theme'}</div>
                            <div class="settings-item-desc">${isBn ? (isDark ? 'ডার্ক মোড' : 'লাইট মোড') : (isDark ? 'Dark Mode' : 'Light Mode')}</div>
                        </div>
                    </div>
                    <div class="toggle-switch ${isDark ? 'active' : ''}" onclick="toggleTheme()"></div>
                </div>
                
                <div class="settings-item" style="flex-direction: column; align-items: flex-start; gap: 12px; border-bottom: 1px solid var(--border);">
                    <div class="settings-item-left">
                        <div class="settings-item-icon">🌈</div>
                        <div>
                            <div class="settings-item-label">${isBn ? 'গ্রেডিয়েন্ট থিম' : 'Gradient Theme'}</div>
                            <div class="settings-item-desc">${isBn ? 'হেডারের জন্য গ্রেডিয়েন্ট নির্বাচন করুন' : 'Select gradient for header'}</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; width: 100%; padding: 4px 0;">
                        ${gradientPresets.map(g => `
                            <div onclick="setGradient('${g.value}')" style="
                                width: 60px;
                                height: 60px;
                                border-radius: 16px;
                                background: ${g.value};
                                cursor: pointer;
                                border: 3px solid ${currentGradient === g.value ? 'white' : 'transparent'};
                                box-shadow: ${currentGradient === g.value ? '0 0 0 3px #6366F1' : 'none'};
                                transition: all 0.3s ease;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: white;
                                font-size: 10px;
                                font-weight: 700;
                                text-shadow: 0 1px 4px rgba(0,0,0,0.3);
                            " title="${g.name}">
                                ${currentGradient === g.value ? '✓' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="settings-item" style="flex-direction: column; align-items: flex-start; gap: 12px; border-bottom: 1px solid var(--border);">
                    <div class="settings-item-left">
                        <div class="settings-item-icon">🎨</div>
                        <div>
                            <div class="settings-item-label">${isBn ? 'প্রাইমারি কালার' : 'Primary Color'}</div>
                            <div class="settings-item-desc">${isBn ? 'অ্যাপের প্রধান রং নির্বাচন করুন' : 'Select app primary color'}</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap; width: 100%; padding: 4px 0;">
                        ${allColors.map(c => `
                            <div onclick="setPrimaryColor('${c.value}')" style="
                                width: 40px;
                                height: 40px;
                                border-radius: 50%;
                                background: ${c.value};
                                cursor: pointer;
                                border: 3px solid ${primaryColor === c.value ? 'white' : 'transparent'};
                                box-shadow: ${primaryColor === c.value ? '0 0 0 3px ' + c.value : 'none'};
                                transition: all 0.3s ease;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: white;
                                font-size: 12px;
                                font-weight: 700;
                                position: relative;
                            " title="${c.name}${c.isCustom ? ' (কাস্টম)' : ''}">
                                ${primaryColor === c.value ? '✓' : ''}
                                ${c.isCustom ? `
                                    <div onclick="event.stopPropagation(); removeCustomColor('${c.value}')" style="
                                        position: absolute;
                                        top: -6px;
                                        right: -6px;
                                        width: 18px;
                                        height: 18px;
                                        background: #EF4444;
                                        border-radius: 50%;
                                        color: white;
                                        font-size: 10px;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        border: 2px solid var(--bg-card);
                                        cursor: pointer;
                                    ">✕</div>
                                ` : ''}
                            </div>
                        `).join('')}
                        <div onclick="openCustomColorPicker()" style="
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            background: var(--bg-elevated);
                            border: 2px dashed var(--border);
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 20px;
                            color: var(--text-muted);
                            transition: all 0.3s ease;
                        " title="${isBn ? 'কাস্টম কালার যোগ করুন' : 'Add Custom Color'}">
                            +
                        </div>
                    </div>
                    <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
                        ${isBn ? 'বর্তমান: ' : 'Current: '} <span style="font-weight: 600; color: ${primaryColor};">${primaryColor}</span>
                        ${customColors.length > 0 ? ` | ${isBn ? 'কাস্টম: ' : 'Custom: '}${customColors.length}টি` : ''}
                    </div>
                </div>
                
                <div class="settings-item" style="flex-direction: column; align-items: flex-start; gap: 12px; border-bottom: none;">
                    <div class="settings-item-left">
                        <div class="settings-item-icon">🖼️</div>
                        <div>
                            <div class="settings-item-label">${isBn ? 'ব্যাকগ্রাউন্ড ইমেজ' : 'Background Image'}</div>
                            <div class="settings-item-desc">${isBn ? 'অ্যাপের ব্যাকগ্রাউন্ডে ছবি সেট করুন' : 'Set background image for the app'}</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; width: 100%; flex-wrap: wrap;">
                        <button class="settings-btn primary" onclick="document.getElementById('bgImageInput').click()" style="flex: 1;">
                            📤 ${isBn ? 'ইমেজ আপলোড' : 'Upload Image'}
                        </button>
                        ${bgImage ? `
                            <button class="settings-btn" onclick="setBackgroundImage(null)" style="flex: 1; background: var(--expense-light); color: var(--expense);">
                                🗑️ ${isBn ? 'ইমেজ রিমুভ' : 'Remove Image'}
                            </button>
                        ` : ''}
                    </div>
                    <input type="file" id="bgImageInput" accept="image/*" style="display:none">
                    ${bgImage ? `
                        <div style="width: 100%; margin-top: 8px; border-radius: 12px; overflow: hidden; border: 2px solid var(--border);">
                            <img src="${bgImage}" style="width: 100%; height: 100px; object-fit: cover;">
                        </div>
                    ` : `
                        <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
                            ⚠️ ${isBn ? 'কোনো ইমেজ সেট করা নেই' : 'No image set'}
                        </div>
                    `}
                </div>
            </div>

            <!-- থিম রিসেট -->
            <div class="settings-section">
                <div class="settings-section-title">🔄 ${isBn ? 'থিম রিসেট' : 'Reset Theme'}</div>
                <div class="settings-item" style="border-bottom: none;">
                    <div class="settings-item-left">
                        <div class="settings-item-icon">🔁</div>
                        <div>
                            <div class="settings-item-label">${isBn ? 'ডিফল্ট থিমে ফিরে যান' : 'Reset to Default Theme'}</div>
                            <div class="settings-item-desc">${isBn ? 'সব কাস্টমাইজেশন রিসেট হবে' : 'All customizations will be reset'}</div>
                        </div>
                    </div>
                    <button class="settings-btn" onclick="resetTheme()" style="background: var(--expense-light); color: var(--expense);">
                        ${isBn ? 'রিসেট' : 'Reset'}
                    </button>
                </div>
            </div>

            <!-- পাসওয়ার্ড সেকশন -->
            <div class="settings-section">
                <div class="settings-section-title">🔐 ${isBn ? 'অ্যাপ লক' : 'App Lock'}</div>
                <div class="settings-item" style="border-bottom: none;">
                    <div class="settings-item-left">
                        <div class="settings-item-icon">🔒</div>
                        <div>
                            <div class="settings-item-label">${isBn ? 'পাসওয়ার্ড লক' : 'Password Lock'}</div>
                            <div class="settings-item-desc">
                                ${hasPassword ? 
                                    (isBn ? '✅ পাসওয়ার্ড সেট করা আছে' : '✅ Password is set') : 
                                    (isBn ? '❌ পাসওয়ার্ড সেট করা নেই' : '❌ No password set')}
                            </div>
                        </div>
                    </div>
                    <button class="settings-btn primary" onclick="openPasswordSettings()">
                        ${hasPassword ? 
                            (isBn ? '🔑 পরিবর্তন' : '🔑 Change') : 
                            (isBn ? '🔐 সেট করুন' : '🔐 Set')}
                    </button>
                </div>
                <div style="font-size: 11px; color: var(--text-muted); padding: 8px 0 0 0;">
                    <i class="fas fa-info-circle"></i> 
                    ${isBn ? 'পাসওয়ার্ড সেট করলে অ্যাপ ওপেন করতে পাসওয়ার্ড চাইবে' : 'Setting a password will lock the app'}
                </div>
            </div>

            <!-- ভাষা -->
            <div class="settings-section">
                <div class="settings-section-title">🌐 ${isBn ? 'ভাষা' : 'Language'}</div>
                <div class="settings-item">
                    <div class="settings-item-left">
                        <div class="settings-item-icon">${isBn ? '🇧🇩' : '🇬🇧'}</div>
                        <div>
                            <div class="settings-item-label">${isBn ? 'বাংলা / ইংরেজি' : 'Bengali / English'}</div>
                            <div class="settings-item-desc">${isBn ? 'বর্তমান: বাংলা' : 'Current: Bengali'}</div>
                        </div>
                    </div>
                    <button class="settings-btn primary" onclick="toggleLanguage()">${isBn ? 'বদলান' : 'Switch'}</button>
                </div>
            </div>

            <!-- ফন্ট সাইজ -->
            <div class="settings-section">
                <div class="settings-section-title">🔤 ${isBn ? 'ফন্ট সাইজ' : 'Font Size'}</div>
                <div class="settings-item">
                    <div class="settings-item-left">
                        <div class="settings-item-icon">Aa</div>
                        <div>
                            <div class="settings-item-label">${isBn ? 'টেক্সট সাইজ' : 'Text Size'}</div>
                            <div class="settings-item-desc">${isBn ? 'বর্তমান: ' + fontSize + 'px' : 'Current: ' + fontSize + 'px'}</div>
                        </div>
                    </div>
                    <div class="font-size-control">
                        <button onclick="changeFontSize(-1)">−</button>
                        <span class="font-size-display">${fontSize}</span>
                        <button onclick="changeFontSize(1)">+</button>
                    </div>
                </div>
            </div>

            <!-- অ্যাপ সম্পর্কে -->
            <div class="settings-section">
                <div class="settings-section-title">ℹ️ ${isBn ? 'অ্যাপ সম্পর্কে' : 'About'}</div>
                <div class="settings-item">
                    <div class="settings-item-left">
                        <div class="settings-item-icon">📱</div>
                        <div>
                            <div class="settings-item-label">${isBn ? 'আয়-ব্যয়ের হিসাব' : 'Income Expense Tracker'}</div>
                            <div class="settings-item-desc">${isBn ? 'সংস্করণ 5.0' : 'Version 5.0'}</div>
                        </div>
                    </div>
                    <span style="font-size:20px;">💰</span>
                </div>
                <div class="settings-item" style="border-bottom: none; padding-bottom: 4px;">
                    <div style="font-size:12px; color:var(--text-muted); width:100%; text-align:center;">
                        ${isBn ? '© ২০২৪ - সব অধিকার সংরক্ষিত' : '© 2024 - All Rights Reserved'}
                    </div>
                </div>
            </div>

            <!-- ডাটা ব্যবস্থাপনা -->
            <div class="settings-section">
                <div class="settings-section-title">💾 ${isBn ? 'ডাটা ব্যবস্থাপনা' : 'Data Management'}</div>
                <div class="settings-item">
                    <div class="settings-item-left">
                        <div class="settings-item-icon">📤</div>
                        <div>
                            <div class="settings-item-label">${isBn ? 'ব্যাকআপ ডাউনলোড' : 'Backup Download'}</div>
                            <div class="settings-item-desc">${isBn ? 'সমস্ত ডাটা JSON ফাইলে সংরক্ষণ' : 'Save all data as JSON file'}</div>
                        </div>
                    </div>
                    <button class="settings-btn primary" onclick="exportBackup()">${isBn ? 'ডাউনলোড' : 'Download'}</button>
                </div>
                <div class="settings-item" style="border-bottom: none;">
                    <div class="settings-item-left">
                        <div class="settings-item-icon">📥</div>
                        <div>
                            <div class="settings-item-label">${isBn ? 'ব্যাকআপ রিস্টোর' : 'Restore Backup'}</div>
                            <div class="settings-item-desc">${isBn ? 'JSON ফাইল থেকে ডাটা পুনরুদ্ধার' : 'Restore data from JSON file'}</div>
                        </div>
                    </div>
                    <button class="settings-btn" onclick="document.getElementById('importFile').click()">${isBn ? 'আপলোড' : 'Upload'}</button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('settingsPage').innerHTML = html;
    
    document.getElementById('bgImageInput')?.addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                setBackgroundImage(ev.target.result);
            };
            reader.readAsDataURL(this.files[0]);
        }
    });
}

// ========== ব্যাকআপ ==========
function exportBackup() {
    const exportData = { transactions: data, categories, userProfile, paymentMethods, recurringRules, savingsGoals, investments, loans, version: '5.0', exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hisab_backup_${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('ব্যাকআপ ডাউনলোড হয়েছে');
}
function importBackup(file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const imported = JSON.parse(ev.target.result);
            if (imported.transactions) data = imported.transactions;
            if (imported.categories) categories = imported.categories;
            if (imported.userProfile) userProfile = imported.userProfile;
            if (imported.paymentMethods) paymentMethods = imported.paymentMethods;
            if (imported.recurringRules) recurringRules = imported.recurringRules;
            if (imported.savingsGoals) savingsGoals = imported.savingsGoals;
            if (imported.investments) investments = imported.investments;
            if (imported.loans) loans = imported.loans;
            saveData(); savePaymentMethods(); saveRecurringRules(); saveSavingsGoals(); saveInvestments(); saveLoans();
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            renderAll();
            showToast('ব্যাকআপ রিস্টোর সম্পন্ন');
        } catch (err) { showToast('ভুল ফাইল'); }
    };
    reader.readAsText(file);
}
document.getElementById('exportDataBtn')?.addEventListener('click', exportBackup);
document.getElementById('importDataBtn')?.addEventListener('click', () => document.getElementById('importFile').click());
document.getElementById('importFile')?.addEventListener('change', (e) => { if (e.target.files[0]) importBackup(e.target.files[0]); });

// ========== রেন্ডার অল ==========
function renderAll() {
    renderDashboard(); renderTransactions(); renderReportsPage(); renderCategoriesPage();
    renderRecurringPage(); renderCalculatorPage(); renderSavingsPage(); renderInvestmentPage(); renderLoanPage();
    if (activeNav === 0) renderDashboard();
    else if (activeNav === 2) renderTransactions();
    else if (activeNav === 3) renderReportsPage();
    else if (activeNav === 4) renderCategoriesPage();
    else if (activeNav === 5) renderRecurringPage();
    else if (activeNav === 6) renderCalculatorPage();
    else if (activeNav === 7) renderSavingsPage();
    else if (activeNav === 8) renderInvestmentPage();
    else if (activeNav === 9) renderLoanPage();
    else if (activeNav === 10) renderSettingsPage();
    updateProfileUI();
    updateDateAndTime();
}

// ========== অ্যাপ স্টার্ট ==========
(async function initApp() {
    const unlocked = await checkAppLock();
    if (!unlocked) return;
    
    renderNav();
    renderAll();
    switchNav(0);
    applyFontSize(settings.fontSize || 14);
    
    if (data.length === 0) {
        data = [
            { id: 1, type: 'income', amount: 35000, description: 'বেতন', category: 'বেতন/ব্যবসা', payment: 'ব্যাংক', note: '', day: 5, month: currentMonth, year: currentYear },
            { id: 2, type: 'expense', amount: 12000, description: 'বাসা ভাড়া', category: 'বাড়ি ভাড়া', payment: 'নগদ', note: '', day: 2, month: currentMonth, year: currentYear },
            { id: 3, type: 'expense', amount: 3500, description: 'মুদি বাজার', category: 'খাদ্য ও মুদি', payment: 'বিকাশ', note: '', day: 8, month: currentMonth, year: currentYear },
            { id: 4, type: 'income', amount: 8000, description: 'ফ্রিল্যান্স', category: 'ফ্রিল্যান্স', payment: 'বিকাশ', note: '', day: 12, month: currentMonth, year: currentYear }
        ];
        saveData();
        renderDashboard();
        renderTransactions();
    }
})();