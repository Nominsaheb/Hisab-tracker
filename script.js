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

// ========== কনস্ট্যান্ট ও হেলপার ফাংশন ==========
const ICONS = {
  'বেতন/ব্যবসা': '💼', 'ফ্রিল্যান্স': '💻', 'বিনিয়োগ': '📈', 'ভাড়া আয়': '🏠', 'অন্যান্য আয়': '🎁',
  'বাড়ি ভাড়া': '🏡', 'খাদ্য ও মুদি': '🛒', 'পরিবহন': '🚌', 'স্বাস্থ্য': '🏥', 'শিক্ষা': '📚',
  'বিনোদন': '🎬', 'ইউটিলিটি': '💡', 'পোশাক': '👗', 'সঞ্চয়': '💰', 'অন্যান্য ব্যয়': '📦'
};
const MONTHS_BN = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
const MONTHS_SHORT = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
const fmt = n => '৳ ' + n.toLocaleString('bn-BD');
const now = new Date();
let currentYear = now.getFullYear(),
  currentMonth = now.getMonth(),
  activeNav = 0,
  txnFilter = 'all',
  searchQuery = '';
let monthlyChart = null,
  categoryChart = null,
  calcExpression = '';

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
const getIcon = cat => ICONS[cat] || '📌';
const showToast = msg => {
  let t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
};

// ========== প্রোফাইল ফাংশন ==========
let userProfile = JSON.parse(localStorage.getItem('userProfile')) || {
  name: 'ব্যবহারকারী',
  avatar: null
};

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
  Swal.fire({
    title: 'প্রোফাইল সেটিংস',
    html: `<input id="userName" placeholder="আপনার নাম" value="${userProfile.name}" style="width:100%; padding:10px; margin-bottom:10px;"><input type="file" id="avatarFile" accept="image/*" style="width:100%; padding:10px;">`,
    showCancelButton: true,
    confirmButtonText: 'সংরক্ষণ',
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

// ========== থিম ফাংশন ==========
function initTheme() {
  let saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  document.getElementById('themeToggleBtn').innerHTML = saved === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  let cur = document.documentElement.getAttribute('data-theme');
  let neu = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', neu);
  localStorage.setItem('theme', neu);
  document.getElementById('themeToggleBtn').innerHTML = neu === 'dark' ? '☀️' : '🌙';
  showToast(neu === 'dark' ? 'ডার্ক মোড' : 'লাইট মোড');
}

// ========== নেভিগেশন আইটেম ==========
const navItems = [{
    id: 'dashboardPage',
    icon: '📊',
    label: 'ড্যাশবোর্ড'
  },
  {
    id: 'addPage',
    icon: '➕',
    label: 'যোগ করুন'
  },
  {
    id: 'transactionsPage',
    icon: '📋',
    label: 'লেনদেন'
  },
  {
    id: 'reportsPage',
    icon: '📅',
    label: 'রিপোর্ট'
  },
  {
    id: 'categoriesPage',
    icon: '🏷️',
    label: 'ক্যাটাগরি'
  },
  {
    id: 'recurringPage',
    icon: '🔄',
    label: 'পুনরাবৃত্তি'
  },
  {
    id: 'calculatorPage',
    icon: '🧮',
    label: 'ক্যালকুলেটর'
  },
  {
    id: 'savingsPage',
    icon: '🎯',
    label: 'সঞ্চয়'
  },
  {
    id: 'investmentPage',
    icon: '📈',
    label: 'বিনিয়োগ'
  },
  {
    id: 'loanPage',
    icon: '🤝',
    label: 'ধার-দেনা'
  }
];

function renderNav() {
  document.getElementById('navContainer').innerHTML = navItems.map((item, idx) => `<div class="nav-item ${idx === activeNav ? 'active' : ''}" onclick="switchNav(${idx})">${item.icon} ${item.label}</div>`).join('');
}

function switchNav(idx) {
  activeNav = idx;
  renderNav();
  navItems.forEach((item, i) => document.getElementById(item.id).classList.toggle('active', i === idx));
  if (idx === 0) renderDashboard();
  if (idx === 1) renderAddForm();
  if (idx === 2) renderTransactions();
  if (idx === 3) renderReportsPage();
  if (idx === 4) renderCategoriesPage();
  if (idx === 5) renderRecurringPage();
  if (idx === 6) renderCalculatorPage();
  if (idx === 7) renderSavingsPage();
  if (idx === 8) renderInvestmentPage();
  if (idx === 9) renderLoanPage();
}

// ========== ড্যাশবোর্ড রেন্ডার ==========
function renderDashboard() {
  const totalInc = data.filter(d => d.type === 'income').reduce((s, d) => s + d.amount, 0);
  const totalExp = data.filter(d => d.type === 'expense').reduce((s, d) => s + d.amount, 0);
  const net = totalInc - totalExp;
  const rate = totalInc > 0 ? Math.round((net / totalInc) * 100) : 0;

  const monthlyData = data.filter(d => d.year === currentYear && d.month === currentMonth);
  const dailyMap = new Map();
  monthlyData.forEach(d => {
    if (!dailyMap.has(d.day)) dailyMap.set(d.day, {
      inc: 0,
      exp: 0
    });
    const val = dailyMap.get(d.day);
    if (d.type === 'income') val.inc += d.amount;
    else val.exp += d.amount;
  });
  let highestExpense = {
    day: null,
    amount: 0
  };
  for (let [day, vals] of dailyMap)
    if (vals.exp > highestExpense.amount) highestExpense = {
      day,
      amount: vals.exp
    };
  const today = now.getDate();
  const alertHtml = (highestExpense.day === today && highestExpense.amount > 0) ? `<div class="alert-banner">⚠️ আজ ${fmt(highestExpense.amount)} ব্যয় হয়েছে!</div>` : '';
  const dailyItems = Array.from(dailyMap.keys()).sort((a, b) => a - b).map(day => {
    const vals = dailyMap.get(day);
    const netVal = vals.inc - vals.exp;
    return `<div class="daily-item"><span class="daily-day">${day} ${MONTHS_SHORT[currentMonth]}</span><span class="daily-income">+${fmt(vals.inc)}</span><span class="daily-expense">-${fmt(vals.exp)}</span><span class="daily-net ${netVal >= 0 ? 'positive' : 'negative'}">${fmt(netVal)}</span></div>`;
  }).join('');

  const months = [],
    incData = [],
    expData = [];
  for (let i = 5; i >= 0; i--) {
    let d = new Date(currentYear, currentMonth - i, 1);
    months.push(MONTHS_SHORT[d.getMonth()]);
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
        <div class="kpi-card"><div class="kpi-icon income">💰</div><div class="kpi-info"><div class="kpi-label">মোট আয়</div><div class="kpi-value income">${fmt(totalInc)}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon expense">💸</div><div class="kpi-info"><div class="kpi-label">মোট ব্যয়</div><div class="kpi-value expense">${fmt(totalExp)}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon net">📊</div><div class="kpi-info"><div class="kpi-label">নেট সঞ্চয়</div><div class="kpi-value net">${fmt(net)}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon savings">🎯</div><div class="kpi-info"><div class="kpi-label">সঞ্চয় হার</div><div class="kpi-value savings">${rate}%</div></div></div>
      </div>
      <div class="daily-summary-card">
        <div class="daily-header"><div class="daily-title">📅 দৈনিক সংক্ষিপ্ত</div><div class="daily-month">${MONTHS_BN[currentMonth]} ${currentYear}</div></div>
        ${alertHtml}
        <div class="daily-list">
          <div class="daily-item" style="font-weight:600; color:var(--text-muted); border-bottom:2px solid var(--border); padding-bottom:6px;"><span>তারিখ</span><span>আয়</span><span>ব্যয়</span><span>নেট</span></div>
          ${dailyItems || '<div class="empty-state">কোনো লেনদেন নেই</div>'}
        </div>
      </div>
    </div>
    <div class="charts-row">
      <div class="chart-container"><div class="chart-title">📊 গত ৬ মাসের আয়-ব্যয় তুলনা</div><canvas id="monthlyChart"></canvas></div>
      <div class="chart-container"><div class="chart-title">🥧 ব্যয়ের ক্যাটাগরি (পার্সেন্টেজ সহ)</div><canvas id="categoryChart"></canvas></div>
    </div>
    <div class="card"><div style="font-weight:700; margin-bottom:12px">🕒 সাম্প্রতিক লেনদেন</div><div id="recentList">${recent.map(t => `<div class="txn-item"><div class="txn-icon ${t.type}">${getIcon(t.category)}</div><div class="txn-info"><div class="txn-title">${t.description}</div><div class="txn-meta">${t.day} ${MONTHS_SHORT[t.month]} · ${t.category} · ${t.payment}</div></div><div class="txn-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}</div><button class="delete-btn" onclick="deleteEntry(${t.id})">🗑️</button></div>`).join('') || '<div class="empty-state">কোনো লেনদেন নেই</div>'}</div></div>
  `;
  document.getElementById('dashboardPage').innerHTML = html;
  setTimeout(() => {
    const ctxM = document.getElementById('monthlyChart')?.getContext('2d');
    if (ctxM) {
      if (monthlyChart) monthlyChart.destroy();
      monthlyChart = new Chart(ctxM, {
        type: 'bar',
        data: {
          labels: months,
          datasets: [{
            label: 'আয়',
            data: incData,
            backgroundColor: 'rgba(16,185,129,0.7)',
            borderRadius: 8
          }, {
            label: 'ব্যয়',
            data: expData,
            backgroundColor: 'rgba(239,68,68,0.7)',
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.dataset.label}: ${fmt(ctx.raw)}`
              }
            }
          }
        }
      });
    }
    const ctxC = document.getElementById('categoryChart')?.getContext('2d');
    if (ctxC) {
      if (categoryChart) categoryChart.destroy();
      categoryChart = new Chart(ctxC, {
        type: 'doughnut',
        data: {
          labels: sorted.map(s => s[0]),
          datasets: [{
            data: sorted.map(s => s[1]),
            backgroundColor: ['#10B981', '#F59E0B', '#6366F1', '#EF4444', '#8B5CF6', '#EC4899'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          plugins: {
            datalabels: {
              color: 'white',
              formatter: (val, ctx) => {
                let total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                let pct = total ? Math.round((val / total) * 100) : 0;
                return pct ? pct + '%' : '';
              }
            },
            legend: {
              position: 'right',
              labels: {
                color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
              }
            }
          }
        }
      });
    }
  }, 100);
}

// ========== অ্যাড ফর্ম রেন্ডার ==========
let currentType = 'income';

function renderAddForm() {
  let incOpts = categories.income.map(c => `<option value="${c}">${getIcon(c)} ${c}</option>`).join('');
  let expOpts = categories.expense.map(c => `<option value="${c}">${getIcon(c)} ${c}</option>`).join('');
  let paymentOpts = paymentMethods.map(p => `<option value="${p}">${p}</option>`).join('');
  document.getElementById('addPage').innerHTML = `
    <div class="form-card">
      <div class="type-toggle"><button class="type-btn income ${currentType === 'income' ? 'active' : ''}" onclick="setType('income')">💚 আয়</button><button class="type-btn expense ${currentType === 'expense' ? 'active' : ''}" onclick="setType('expense')">❤️ ব্যয়</button></div>
      <div class="form-group"><label class="form-label">পরিমাণ (৳)</label><input type="number" id="amount" style="font-size:18px;font-weight:700" placeholder="0"></div>
      <div class="form-group"><label class="form-label">বিবরণ</label><input type="text" id="description" placeholder="যেমন: বেতন, বাজার"></div>
      <div class="form-group"><label class="form-label">ক্যাটাগরি</label><select id="category">${currentType === 'income' ? incOpts : expOpts}</select></div>
      <div class="form-group"><label class="form-label">পেমেন্ট মাধ্যম</label><select id="payment">${paymentOpts}</select></div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;"><div><label>দিন</label><select id="day">${[...Array(31)].map((_, i) => `<option ${i + 1 === now.getDate() ? 'selected' : ''}>${i + 1}</option>`).join('')}</select></div><div><label>মাস</label><select id="month">${MONTHS_BN.map((m, i) => `<option ${i === currentMonth ? 'selected' : ''} value="${i}">${m}</option>`).join('')}</select></div><div><label>বছর</label><select id="year">${[2024, 2025, 2026, 2027, 2028].map(y => `<option ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('')}</select></div></div>
      <div class="form-group"><label>নোট</label><textarea id="note" rows="2" placeholder="ঐচ্ছিক"></textarea></div>
      <button class="submit-btn ${currentType}" onclick="addEntry()">${currentType === 'income' ? '💚 আয় যোগ করুন' : '❤️ ব্যয় যোগ করুন'}</button>
    </div>
  `;
}

function setType(t) {
  currentType = t;
  renderAddForm();
}

function addEntry() {
  let amt = parseFloat(document.getElementById('amount')?.value),
    desc = document.getElementById('description')?.value.trim();
  if (!amt || amt <= 0) return showToast('সঠিক পরিমাণ দিন');
  if (!desc) return showToast('বিবরণ লিখুন');
  data.unshift({
    id: Date.now(),
    type: currentType,
    amount: amt,
    description: desc,
    category: document.getElementById('category').value,
    payment: document.getElementById('payment').value,
    note: document.getElementById('note')?.value || '',
    day: parseInt(document.getElementById('day').value),
    month: parseInt(document.getElementById('month').value),
    year: parseInt(document.getElementById('year').value)
  });
  saveData();
  showToast(currentType === 'income' ? 'আয় যোগ হয়েছে' : 'ব্যয় যোগ হয়েছে');
  renderDashboard();
  renderTransactions();
  if (activeNav === 3) renderReportsPage();
  switchNav(2);
}

// ========== লেনদেন রেন্ডার ==========
function renderTransactions() {
  let filtered = data.filter(d => {
    let m = !searchQuery || d.description.toLowerCase().includes(searchQuery) || d.category.toLowerCase().includes(searchQuery);
    if (txnFilter === 'all') return m;
    if (txnFilter === 'income') return d.type === 'income' && m;
    if (txnFilter === 'expense') return d.type === 'expense' && m;
    if (txnFilter === 'month') return d.month === currentMonth && d.year === currentYear && m;
    return m;
  });
  document.getElementById('transactionsPage').innerHTML = `
    <div><input type="text" id="searchInput" placeholder="🔍 খুঁজুন..." style="width:100%;padding:10px 14px;border-radius:40px;margin-bottom:14px" oninput="updateSearch(this.value)"></div>
    <div class="filters"><button class="filter-chip ${txnFilter === 'all' ? 'active' : ''}" onclick="setFilter('all')">সব</button><button class="filter-chip ${txnFilter === 'income' ? 'active' : ''}" onclick="setFilter('income')">আয়</button><button class="filter-chip ${txnFilter === 'expense' ? 'active' : ''}" onclick="setFilter('expense')">ব্যয়</button><button class="filter-chip ${txnFilter === 'month' ? 'active' : ''}" onclick="setFilter('month')">এ মাস</button></div>
    <div id="txnList">${filtered.map(t => `<div class="txn-item"><div class="txn-icon ${t.type}">${getIcon(t.category)}</div><div class="txn-info"><div class="txn-title">${t.description}</div><div class="txn-meta">${t.day} ${MONTHS_SHORT[t.month]} · ${t.category} · ${t.payment}</div></div><div class="txn-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}</div><button class="delete-btn" onclick="deleteEntry(${t.id})">🗑️</button></div>`).join('') || '<div class="empty-state">কোনো লেনদেন নেই</div>'}</div>
  `;
}

function updateSearch(val) {
  searchQuery = val.toLowerCase();
  renderTransactions();
}

function setFilter(f) {
  txnFilter = f;
  renderTransactions();
}

function deleteEntry(id) {
  if (confirm('মুছবেন?')) {
    data = data.filter(d => d.id !== id);
    saveData();
    renderDashboard();
    renderTransactions();
    if (activeNav === 3) renderReportsPage();
    showToast('মুছে ফেলা হয়েছে');
  }
}

// ========== রিপোর্ট রেন্ডার ==========
function renderReportsPage() {
  const years = [...new Set(data.map(d => d.year))].sort((a, b) => b - a);
  if (years.length === 0) years.push(currentYear);
  const html = `
    <div class="card">
      <div class="filter-group">
        <div style="display: flex; gap: 15px;"><label><input type="radio" name="reportType" value="monthly" checked> মাসিক রিপোর্ট</label><label><input type="radio" name="reportType" value="yearly"> বার্ষিক রিপোর্ট</label></div>
        <div id="monthlySelects"><select id="reportYear">${years.map(y => `<option ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('')}</select><select id="reportMonth">${MONTHS_BN.map((m, i) => `<option ${i === currentMonth ? 'selected' : ''} value="${i}">${m}</option>`).join('')}</select></div>
        <div id="yearlySelects" style="display: none;"><select id="reportYearOnly">${years.map(y => `<option ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('')}</select></div>
        <button id="generateReportBtn">📊 রিপোর্ট দেখুন</button>
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
  const isMonthly = document.querySelector('input[value="monthly"]')?.checked;
  if (isMonthly) {
    let year = parseInt(document.getElementById('reportYear')?.value || currentYear);
    let month = parseInt(document.getElementById('reportMonth')?.value || currentMonth);
    let monthData = data.filter(d => d.year === year && d.month === month);
    let totalInc = monthData.filter(d => d.type === 'income').reduce((s, d) => s + d.amount, 0);
    let totalExp = monthData.filter(d => d.type === 'expense').reduce((s, d) => s + d.amount, 0);
    let net = totalInc - totalExp;
    let html = `
      <div class="report-print-area" id="reportPrintArea">
        <div class="report-header">
          <div class="report-title">📊 মাসিক রিপোর্ট</div>
          <div class="report-subtitle">${MONTHS_BN[month]} ${year} | ${new Date().toLocaleDateString('bn-BD')}</div>
        </div>
        <div class="summary-cards">
          <div class="summary-item"><div class="summary-label">মোট আয়</div><div class="summary-value income">${fmt(totalInc)}</div></div>
          <div class="summary-item"><div class="summary-label">মোট ব্যয়</div><div class="summary-value expense">${fmt(totalExp)}</div></div>
          <div class="summary-item"><div class="summary-label">নেট সঞ্চয়</div><div class="summary-value net">${fmt(net)}</div></div>
        </div>
        <div style="overflow-x:auto;">
          <table class="transaction-table">
            <thead><tr><th>তারিখ</th><th>বিবরণ</th><th>ক্যাটাগরি</th><th>পরিমাণ</th></tr></thead>
            <tbody>${monthData.map(t => `<tr><td>${t.day} ${MONTHS_SHORT[t.month]}</td><td>${t.description}</td><td>${t.category}</td><td style="color:${t.type === 'income' ? '#10B981' : '#EF4444'}">${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}</td></tr>`).join('') || '<tr><td colspan="4" class="empty-state">কোনো লেনদেন নেই</td></tr>'}</tbody>
          </table>
        </div>
        <div style="margin-top:16px; text-align:center; font-size:10px; border-top:1px solid #ddd; padding-top:8px;">হিসাব ট্র্যাকার · মাসিক রিপোর্ট</div>
      </div>
      <button class="print-btn no-print" onclick="window.print()">🖨️ প্রিন্ট / PDF</button>
    `;
    document.getElementById('reportContent').innerHTML = html;
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
      monthlyRows += `<tr><td style="padding:8px">${MONTHS_BN[i]}</td><td style="color:var(--income)">${incM ? fmt(incM) : '—'}</td><td style="color:var(--expense)">${expM ? fmt(expM) : '—'}</td><td style="color:${netM >= 0 ? 'var(--income)' : 'var(--expense)'}">${netM ? fmt(netM) : '—'}</td></tr>`;
    }
    let html = `
      <div class="report-print-area" id="reportPrintArea">
        <div class="report-header">
          <div class="report-title">📊 বার্ষিক রিপোর্ট ${year}</div>
          <div class="report-subtitle">জানুয়ারি - ডিসেম্বর ${year}</div>
        </div>
        <div class="summary-cards">
          <div class="summary-item"><div class="summary-label">মোট আয়</div><div class="summary-value income">${fmt(totalInc)}</div></div>
          <div class="summary-item"><div class="summary-label">মোট ব্যয়</div><div class="summary-value expense">${fmt(totalExp)}</div></div>
          <div class="summary-item"><div class="summary-label">নেট সঞ্চয়</div><div class="summary-value net">${fmt(net)}</div></div>
        </div>
        <div><div class="card-title">মাসিক বিবরণী</div><div style="overflow-x:auto;"><table class="transaction-table"><thead><tr><th>মাস</th><th>আয়</th><th>ব্যয়</th><th>নেট</th></tr></thead><tbody>${monthlyRows}</tbody></table></div></div>
        <div style="margin-top:16px; text-align:center; font-size:10px; border-top:1px solid #ddd; padding-top:8px;">সঞ্চয় হার: ${savingsRate}%</div>
      </div>
      <button class="print-btn no-print" onclick="window.print()">🖨️ প্রিন্ট / PDF</button>
    `;
    document.getElementById('reportContent').innerHTML = html;
  }
}

// ========== ক্যাটাগরি রেন্ডার ==========
function renderCategoriesPage() {
  const incHtml = categories.income.map(c => `<span class="cat-badge">${getIcon(c)} ${c}<button onclick="removeCat('income','${c}')">✕</button></span>`).join('');
  const expHtml = categories.expense.map(c => `<span class="cat-badge">${getIcon(c)} ${c}<button onclick="removeCat('expense','${c}')">✕</button></span>`).join('');
  const paymentHtml = paymentMethods.map(p => `<span class="payment-badge">💳 ${p}<button onclick="removePayment('${p}')">✕</button></span>`).join('');
  document.getElementById('categoriesPage').innerHTML = `
    <div class="card">
      <div class="category-section"><div class="category-title income"><i class="fas fa-arrow-up"></i> আয়ের ক্যাটাগরি</div><div class="cats-wrapper">${incHtml || '<div class="empty-state">কোনো ক্যাটাগরি নেই</div>'}</div><div class="add-cat-row"><input type="text" id="newInc" placeholder="নতুন আয় ক্যাটাগরি"><button onclick="addCat('income')"><i class="fas fa-plus"></i> যোগ</button></div></div>
      <div class="category-section"><div class="category-title expense"><i class="fas fa-arrow-down"></i> ব্যয়ের ক্যাটাগরি</div><div class="cats-wrapper">${expHtml || '<div class="empty-state">কোনো ক্যাটাগরি নেই</div>'}</div><div class="add-cat-row"><input type="text" id="newExp" placeholder="নতুন ব্যয় ক্যাটাগরি"><button onclick="addCat('expense')"><i class="fas fa-plus"></i> যোগ</button></div></div>
      <div class="payment-section"><div class="category-title"><i class="fas fa-credit-card"></i> পেমেন্ট পদ্ধতি</div><div class="cats-wrapper">${paymentHtml || '<div class="empty-state">কোনো পদ্ধতি নেই</div>'}</div><div class="add-cat-row"><input type="text" id="newPayment" placeholder="নতুন পেমেন্ট পদ্ধতি"><button onclick="addPayment()"><i class="fas fa-plus"></i> যোগ</button></div><div class="empty-state" style="font-size:11px; margin-top:12px; padding:8px;">⚠️ পুরনো পেমেন্ট পদ্ধতি মুছলে সংশ্লিষ্ট লেনদেনের পদ্ধতি 'নগদ' হয়ে যাবে</div>
      </div>
    </div>
  `;
}

function addCat(type) {
  let inp = document.getElementById(type === 'income' ? 'newInc' : 'newExp');
  let name = inp.value.trim();
  if (!name) return showToast('ক্যাটাগরির নাম দিন');
  if (categories[type].includes(name)) return showToast('এই ক্যাটাগরি ইতিমধ্যে আছে');
  categories[type].push(name);
  saveData();
  renderCategoriesPage();
  renderAddForm();
  showToast(`"${name}" যোগ হয়েছে`);
  inp.value = '';
}

function removeCat(type, name) {
  if (confirm(`"${name}" ক্যাটাগরি মুছবেন?`)) {
    categories[type] = categories[type].filter(c => c !== name);
    let fallback = type === 'income' ? 'অন্যান্য আয়' : 'অন্যান্য ব্যয়';
    data.forEach(d => {
      if (d.type === type && d.category === name) d.category = fallback;
    });
    saveData();
    renderCategoriesPage();
    renderAddForm();
    renderDashboard();
    renderTransactions();
    showToast(`"${name}" মুছে ফেলা হয়েছে`);
  }
}

function addPayment() {
  let inp = document.getElementById('newPayment');
  let name = inp.value.trim();
  if (!name) return showToast('পদ্ধতির নাম দিন');
  if (paymentMethods.includes(name)) return showToast('ইতিমধ্যে আছে');
  paymentMethods.push(name);
  savePaymentMethods();
  renderCategoriesPage();
  renderAddForm();
  showToast(`"${name}" যোগ হয়েছে`);
  inp.value = '';
}

function removePayment(name) {
  if (confirm(`"${name}" পেমেন্ট পদ্ধতি মুছবেন?`)) {
    let idx = paymentMethods.indexOf(name);
    if (idx !== -1) paymentMethods.splice(idx, 1);
    data.forEach(d => {
      if (d.payment === name) d.payment = 'নগদ';
    });
    savePaymentMethods();
    saveData();
    renderCategoriesPage();
    renderAddForm();
    renderDashboard();
    renderTransactions();
    showToast(`"${name}" মুছে ফেলা হয়েছে`);
  }
}

// ========== পুনরাবৃত্তি ফাংশন ==========
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
          id: Date.now() + Math.random(),
          type: rule.type,
          amount: rule.amount,
          description: rule.description,
          category: rule.category,
          payment: rule.payment || 'নগদ',
          note: `[স্বয়ংক্রিয়] ${rule.note || ''}`,
          day: today.getDate(),
          month: today.getMonth(),
          year: today.getFullYear()
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
  if (added > 0) {
    saveRecurringRules();
    saveData();
    showToast(`${added}টি পুনরাবৃত্ত লেনদেন যোগ হয়েছে`);
    renderDashboard();
    renderTransactions();
  }
  renderRecurringList();
}

setTimeout(() => processRecurringTransactions(), 500);

function renderRecurringPage() {
  const html = `
    <div class="card">
      <div class="category-title"><i class="fas fa-sync-alt"></i> পুনরাবৃত্তি লেনদেনের নিয়ম</div>
      <div id="recurringList"></div>
      <div style="display:flex; gap:15px; margin-top:20px;">
        <button class="btn-primary" id="addRecurringBtn" style="background:var(--gradient-gold); flex:1;"><i class="fas fa-plus-circle"></i> + নতুন নিয়ম</button>
        <button class="btn-primary" id="checkNowBtn" style="background:var(--accent); flex:1;"><i class="fas fa-sync"></i> এখনই চেক করুন</button>
      </div>
    </div>
  `;
  document.getElementById('recurringPage').innerHTML = html;
  renderRecurringList();
  document.getElementById('addRecurringBtn').addEventListener('click', () => showRecurringModal());
  document.getElementById('checkNowBtn').addEventListener('click', () => {
    processRecurringTransactions();
    showToast('চেক করা হয়েছে');
  });
}

function renderRecurringList() {
  const container = document.getElementById('recurringList');
  if (!container) return;
  if (recurringRules.length === 0) {
    container.innerHTML = '<div class="empty-state">📭 কোনো পুনরাবৃত্তি নিয়ম নেই। উপরে "+ নতুন নিয়ম" বাটনে ক্লিক করুন।</div>';
    return;
  }
  container.innerHTML = recurringRules.map((rule, idx) => `
    <div class="recurring-item">
      <div class="recurring-header">
        <span class="recurring-name">${rule.type === 'income' ? '💚' : '❤️'} ${rule.description}</span>
        <span class="recurring-amount ${rule.type}">${fmt(rule.amount)}</span>
      </div>
      <div class="recurring-meta">
        ${rule.frequency === 'weekly' ? '📅 সাপ্তাহিক' : rule.frequency === 'monthly' ? '📆 মাসিক' : '📅 বার্ষিক'} | 
        <i class="far fa-calendar-alt"></i> পরবর্তী তারিখ: ${rule.nextDate || 'নির্ধারিত নয়'} | 
        <span class="category-badge" style="background: var(--accent-light); padding: 2px 10px; border-radius: 20px;">${rule.category}</span>
      </div>
      <div class="recurring-actions">
        <button class="btn-edit-loan" onclick="showRecurringModal(${idx})"><i class="fas fa-edit"></i> সম্পাদনা</button>
        <button class="btn-delete-loan" onclick="deleteRecurring(${idx})"><i class="fas fa-trash"></i> মুছুন</button>
      </div>
    </div>
  `).join('');
}

function showRecurringModal(editIndex = -1) {
  const rule = editIndex >= 0 ? recurringRules[editIndex] : null;
  Swal.fire({
    title: rule ? '✏️ নিয়ম সম্পাদনা' : '➕ নতুন নিয়ম',
    html: `
      <select id="recType" style="width:100%; margin-bottom:12px; padding:12px; border-radius:16px;">
        <option value="income" ${rule && rule.type === 'income' ? 'selected' : ''}>💚 আয়</option>
        <option value="expense" ${rule && rule.type === 'expense' ? 'selected' : ''}>❤️ ব্যয়</option>
      </select>
      <input id="recDesc" placeholder="বিবরণ (যেমন: বিদ্যুৎ বিল)" value="${rule ? rule.description : ''}" style="width:100%; margin-bottom:12px; padding:12px; border-radius:16px;">
      <input id="recAmount" type="number" placeholder="পরিমাণ (৳)" value="${rule ? rule.amount : ''}" style="width:100%; margin-bottom:12px; padding:12px; border-radius:16px;">
      <select id="recCategory" style="width:100%; margin-bottom:12px; padding:12px; border-radius:16px;">${(rule && rule.type === 'income' ? categories.income : categories.expense).map(c => `<option ${rule && rule.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
      <select id="recPayment" style="width:100%; margin-bottom:12px; padding:12px; border-radius:16px;">${paymentMethods.map(p => `<option ${rule && rule.payment === p ? 'selected' : ''}>${p}</option>`).join('')}</select>
      <select id="recFrequency" style="width:100%; margin-bottom:12px; padding:12px; border-radius:16px;"><option value="weekly" ${rule && rule.frequency === 'weekly' ? 'selected' : ''}>সাপ্তাহিক (প্রতি 7 দিনে)</option><option value="monthly" ${rule && rule.frequency === 'monthly' ? 'selected' : ''}>মাসিক (প্রতি মাসে)</option><option value="yearly" ${rule && rule.frequency === 'yearly' ? 'selected' : ''}>বার্ষিক (প্রতি বছরে)</option></select>
      <input id="recNextDate" type="date" placeholder="পরবর্তী কার্যকর তারিখ" value="${rule ? rule.nextDate || new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}" style="width:100%; margin-bottom:12px; padding:12px; border-radius:16px;">
      <textarea id="recNote" placeholder="নোট (ঐচ্ছিক)" rows="2" style="width:100%; padding:12px; border-radius:16px;">${rule ? rule.note || '' : ''}</textarea>
    `,
    showCancelButton: true,
    confirmButtonText: rule ? '✅ আপডেট করুন' : '➕ যোগ করুন',
    cancelButtonText: 'বাতিল',
    customClass: {
      popup: 'responsive-payment-popup'
    },
    preConfirm: () => {
      const type = document.getElementById('recType').value;
      const desc = document.getElementById('recDesc').value.trim();
      const amt = parseFloat(document.getElementById('recAmount').value);
      if (!desc || !amt) return Swal.showValidationMessage('বিবরণ ও পরিমাণ দিন');
      if (amt <= 0) return Swal.showValidationMessage('পরিমাণ অবশ্যই 0 এর বেশি হতে হবে');
      return {
        type,
        description: desc,
        amount: amt,
        category: document.getElementById('recCategory').value,
        payment: document.getElementById('recPayment').value,
        frequency: document.getElementById('recFrequency').value,
        nextDate: document.getElementById('recNextDate').value,
        note: document.getElementById('recNote').value
      };
    }
  }).then(res => {
    if (res.isConfirmed) {
      if (editIndex >= 0) recurringRules[editIndex] = res.value;
      else recurringRules.push(res.value);
      saveRecurringRules();
      renderRecurringList();
      processRecurringTransactions();
      showToast(editIndex >= 0 ? '✅ নিয়ম আপডেট হয়েছে' : '✅ নতুন নিয়ম যোগ হয়েছে');
    }
  });
}

function deleteRecurring(idx) {
  if (confirm('❓ এই নিয়মটি মুছে ফেলতে চান?')) {
    recurringRules.splice(idx, 1);
    saveRecurringRules();
    renderRecurringList();
    showToast('🗑️ নিয়মটি মুছে ফেলা হয়েছে');
  }
}

// ========== ক্যালকুলেটর ফাংশন ==========
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

window.calcAppend = (v) => {
  calcExpression += v;
  document.getElementById('calcDisplay').innerText = calcExpression || '0';
};
window.calcClear = () => {
  calcExpression = '';
  document.getElementById('calcDisplay').innerText = '0';
};
window.calcBackspace = () => {
  calcExpression = calcExpression.slice(0, -1);
  document.getElementById('calcDisplay').innerText = calcExpression || '0';
};
window.calcPercent = () => {
  try {
    let last = '',
      expr = calcExpression;
    for (let i = expr.length - 1; i >= 0; i--) {
      if ('0123456789.'.includes(expr[i])) last = expr[i] + last;
      else break;
    }
    if (last) {
      let pv = parseFloat(last) / 100;
      let newExpr = expr.slice(0, expr.length - last.length);
      if (newExpr && '+-*/'.includes(newExpr.slice(-1))) calcExpression = newExpr + pv;
      else calcExpression = pv.toString();
      document.getElementById('calcDisplay').innerText = calcExpression;
      calcResult();
    }
  } catch (e) {
    calcExpression = '0';
    document.getElementById('calcDisplay').innerText = '0';
  }
};
window.calcResult = () => {
  try {
    let r = eval(calcExpression.replace(/×/g, '*').replace(/÷/g, '/'));
    calcExpression = r.toString();
    document.getElementById('calcDisplay').innerText = calcExpression;
  } catch (e) {
    document.getElementById('calcDisplay').innerText = 'Error';
    calcExpression = '';
  }
};

// ========== সঞ্চয় ফাংশন ==========
function getTotalSavings() {
  return data.filter(d => d.type === 'income').reduce((s, d) => s + d.amount, 0) - data.filter(d => d.type === 'expense').reduce((s, d) => s + d.amount, 0);
}
let savingsFilter = 'all';

function renderSavingsPage() {
  const totalSaved = getTotalSavings();
  const totalTarget = savingsGoals.reduce((s, g) => s + g.target, 0);
  const percent = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;
  const html = `
    <div class="savings-stats-card"><div class="savings-percent">${percent}%</div><div class="savings-label">সঞ্চয়ের অগ্রগতি</div><div class="savings-amount">${fmt(totalSaved)}</div><div class="savings-sub">${fmt(totalSaved)} / ${fmt(totalTarget)}</div></div>
    <div class="savings-filter"><button class="filter-btn ${savingsFilter === 'all' ? 'active' : ''}" onclick="setSavingsFilter('all')">সব</button><button class="filter-btn ${savingsFilter === 'active' ? 'active' : ''}" onclick="setSavingsFilter('active')">চলমান</button><button class="filter-btn ${savingsFilter === 'completed' ? 'active' : ''}" onclick="setSavingsFilter('completed')">সম্পন্ন</button></div>
    <div id="savingsList"></div>
    <button class="btn-primary" onclick="addSavingsGoal()"><i class="fas fa-plus"></i> নতুন সঞ্চয় লক্ষ্য</button>
  `;
  document.getElementById('savingsPage').innerHTML = html;
  renderSavingsList();
}

function setSavingsFilter(filter) {
  savingsFilter = filter;
  renderSavingsPage();
}

function renderSavingsList() {
  const container = document.getElementById('savingsList');
  if (!container) return;
  const totalSaved = getTotalSavings();
  let filtered = savingsGoals;
  if (savingsFilter === 'active') filtered = savingsGoals.filter(g => totalSaved < g.target);
  if (savingsFilter === 'completed') filtered = savingsGoals.filter(g => totalSaved >= g.target);
  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state">কোনো সঞ্চয় লক্ষ্য নেই</div>';
    return;
  }
  container.innerHTML = filtered.map((goal, idx) => {
    const p = goal.target > 0 ? Math.min(100, Math.round((totalSaved / goal.target) * 100)) : 0;
    return `<div class="savings-goal-card"><div class="savings-goal-header"><span class="savings-goal-name">${goal.name}</span><span class="savings-goal-amount">${fmt(goal.target)}</span></div><div class="savings-goal-progress"><div class="savings-goal-progress-fill" style="width:${p}%"></div></div><div class="savings-goal-stats"><span>শুরুর তারিখ: ${goal.startDate || 'শুরুর তারিখ'}</span><span>প্রাথমিক জমা: ${fmt(goal.initialDeposit || 0)}</span><span>বর্তমান: ${fmt(totalSaved)}</span><span>${p}% সম্পন্ন</span></div><div class="savings-goal-actions"><button class="btn-add-money" onclick="addToSavings(${idx})"><i class="fas fa-plus-circle"></i> টাকা যোগ</button><button class="btn-withdraw" onclick="withdrawFromSavings(${idx})"><i class="fas fa-minus-circle"></i> তুলুন</button><button class="btn-delete" onclick="deleteSavingsGoal(${idx})"><i class="fas fa-trash"></i></button></div></div>`;
  }).join('');
}

function addSavingsGoal() {
  Swal.fire({
    title: 'সঞ্চয় যোগ করুন',
    html: '<input id="goalName" placeholder="সঞ্চয়ের নাম" style="width:100%;margin-bottom:10px;"><input id="goalTarget" type="number" placeholder="লক্ষ্যের পরিমাণ" style="width:100%;margin-bottom:10px;"><input id="initialDeposit" type="number" placeholder="প্রাথমিক জমা (ঐচ্ছিক)" style="width:100%;margin-bottom:10px;"><input id="startDate" type="text" placeholder="শুরুর তারিখ" style="width:100%;" onfocus="this.type=\'date\'" onblur="if(!this.value) this.type=\'text\'">',
    showCancelButton: true,
    confirmButtonText: 'যোগ করুন',
    preConfirm: () => {
      let name = document.getElementById('goalName').value.trim(),
        target = parseFloat(document.getElementById('goalTarget').value);
      if (!name || !target) Swal.showValidationMessage('নাম ও পরিমাণ দিন');
      return {
        name,
        target,
        initialDeposit: parseFloat(document.getElementById('initialDeposit').value) || 0,
        startDate: document.getElementById('startDate').value
      };
    }
  }).then(res => {
    if (res.isConfirmed) {
      savingsGoals.push(res.value);
      saveSavingsGoals();
      renderSavingsPage();
      showToast('সঞ্চয় লক্ষ্য যোগ হয়েছে');
    }
  });
}

function addToSavings(idx) {
  Swal.fire({
    title: 'টাকা যোগ করুন',
    input: 'number',
    inputPlaceholder: 'পরিমাণ (৳)',
    showCancelButton: true,
    confirmButtonText: 'যোগ করুন',
    preConfirm: (amt) => {
      if (!amt || amt <= 0) Swal.showValidationMessage('সঠিক পরিমাণ দিন');
      return parseFloat(amt);
    }
  }).then(res => {
    if (res.isConfirmed) {
      data.unshift({
        id: Date.now(),
        type: 'expense',
        amount: res.value,
        description: `সঞ্চয়: ${savingsGoals[idx].name}`,
        category: 'সঞ্চয়',
        payment: 'নগদ',
        note: '',
        day: now.getDate(),
        month: currentMonth,
        year: currentYear
      });
      saveData();
      renderDashboard();
      renderTransactions();
      renderSavingsPage();
      showToast(`${fmt(res.value)} সঞ্চয়ে যোগ হয়েছে`);
    }
  });
}

function withdrawFromSavings(idx) {
  Swal.fire({
    title: 'টাকা তোলুন',
    input: 'number',
    inputPlaceholder: 'পরিমাণ (৳)',
    showCancelButton: true,
    confirmButtonText: 'তুলুন',
    preConfirm: (amt) => {
      if (!amt || amt <= 0) Swal.showValidationMessage('সঠিক পরিমাণ দিন');
      return parseFloat(amt);
    }
  }).then(res => {
    if (res.isConfirmed) {
      data.unshift({
        id: Date.now(),
        type: 'income',
        amount: res.value,
        description: `সঞ্চয় থেকে উত্তোলন: ${savingsGoals[idx].name}`,
        category: 'অন্যান্য আয়',
        payment: 'নগদ',
        note: '',
        day: now.getDate(),
        month: currentMonth,
        year: currentYear
      });
      saveData();
      renderDashboard();
      renderTransactions();
      renderSavingsPage();
      showToast(`${fmt(res.value)} উত্তোলন করা হয়েছে`);
    }
  });
}

function deleteSavingsGoal(idx) {
  if (confirm('মুছবেন?')) {
    savingsGoals.splice(idx, 1);
    saveSavingsGoals();
    renderSavingsPage();
    showToast('মুছে ফেলা হয়েছে');
  }
}

// ========== বিনিয়োগ ফাংশন ==========
function renderInvestmentPage() {
  const totalInv = investments.reduce((s, i) => s + i.amount, 0);
  const html = `<div class="investment-stats-card"><div class="savings-amount">${fmt(totalInv)}</div><div class="savings-label">মোট বিনিয়োগ</div></div><div id="investmentsList"></div><button class="btn-primary" onclick="addInvestment()"><i class="fas fa-plus"></i> নতুন বিনিয়োগ যুক্ত করুন</button>`;
  document.getElementById('investmentPage').innerHTML = html;
  renderInvestmentsList();
}

function renderInvestmentsList() {
  const container = document.getElementById('investmentsList');
  if (!container) return;
  if (investments.length === 0) {
    container.innerHTML = '<div class="empty-state">কোনো বিনিয়োগ নেই</div>';
    return;
  }
  container.innerHTML = investments.map((inv, idx) => `<div class="investment-card"><div class="investment-header"><span class="investment-name">${inv.name}</span><span class="investment-type">${inv.type || 'সাধারণ'}</span></div><div class="investment-details"><span>পরিমাণ: ${fmt(inv.amount)}</span><span>হার: ${inv.interest || 0}%</span></div><div class="investment-maturity"><i class="fas fa-calendar-alt"></i> শুরুর তারিখ: ${inv.startDate || 'শুরুর তারিখ'} | মেয়াদ উত্তীর্ণের তারিখ: ${inv.maturityDate || 'শেষের তারিখ'}</div><div class="investment-actions"><button class="btn-edit-invest" onclick="editInvestment(${idx})"><i class="fas fa-edit"></i> সম্পাদনা</button><button class="btn-delete-invest" onclick="deleteInvestment(${idx})"><i class="fas fa-trash"></i> মুছুন</button></div></div>`).join('');
}

function addInvestment() {
  Swal.fire({
    title: 'নতুন বিনিয়োগ',
    html: '<input id="invName" placeholder="নাম" style="width:100%;margin-bottom:10px;"><select id="invType" style="width:100%;margin-bottom:10px;"><option value="ডিপিএস">ডিপিএস</option><option value="এফডিআর">এফডিআর</option><option value="শেয়ার">শেয়ার</option><option value="সঞ্চয়পত্র">সঞ্চয়পত্র</option><option value="অন্যান্য">অন্যান্য</option></select><input id="invAmount" type="number" placeholder="পরিমাণ" style="width:100%;margin-bottom:10px;"><input id="invInterest" type="number" placeholder="সুদহার (%)" style="width:100%;margin-bottom:10px;"><input id="invStartDate" type="text" placeholder="শুরুর তারিখ" style="width:100%;margin-bottom:10px;" onfocus="this.type=\'date\'" onblur="if(!this.value) this.type=\'text\'"><input id="invMaturityDate" type="text" placeholder="শেষের তারিখ" style="width:100%;" onfocus="this.type=\'date\'" onblur="if(!this.value) this.type=\'text\'">',
    showCancelButton: true,
    confirmButtonText: 'যোগ করুন',
    preConfirm: () => {
      let name = document.getElementById('invName').value.trim(),
        amt = parseFloat(document.getElementById('invAmount').value);
      if (!name || !amt) Swal.showValidationMessage('নাম ও পরিমাণ দিন');
      return {
        name,
        type: document.getElementById('invType').value,
        amount: amt,
        interest: parseFloat(document.getElementById('invInterest').value) || 0,
        startDate: document.getElementById('invStartDate').value,
        maturityDate: document.getElementById('invMaturityDate').value
      };
    }
  }).then(res => {
    if (res.isConfirmed) {
      investments.push(res.value);
      saveInvestments();
      renderInvestmentPage();
      showToast('বিনিয়োগ যোগ হয়েছে');
    }
  });
}

function editInvestment(idx) {
  const inv = investments[idx];
  Swal.fire({
    title: 'বিনিয়োগ সম্পাদনা',
    html: `<input id="invName" value="${inv.name}" style="width:100%;margin-bottom:10px;"><select id="invType" style="width:100%;margin-bottom:10px;"><option value="ডিপিএস" ${inv.type === 'ডিপিএস' ? 'selected' : ''}>ডিপিএস</option><option value="এফডিআর" ${inv.type === 'এফডিআর' ? 'selected' : ''}>এফডিআর</option><option value="শেয়ার" ${inv.type === 'শেয়ার' ? 'selected' : ''}>শেয়ার</option><option value="সঞ্চয়পত্র" ${inv.type === 'সঞ্চয়পত্র' ? 'selected' : ''}>সঞ্চয়পত্র</option><option value="অন্যান্য" ${inv.type === 'অন্যান্য' ? 'selected' : ''}>অন্যান্য</option></select><input id="invAmount" type="number" value="${inv.amount}" style="width:100%;margin-bottom:10px;"><input id="invInterest" type="number" value="${inv.interest}" style="width:100%;margin-bottom:10px;"><input id="invStartDate" type="text" value="${inv.startDate || ''}" style="width:100%;margin-bottom:10px;" onfocus="this.type=\'date\'" onblur="if(!this.value) this.type=\'text\'"><input id="invMaturityDate" type="text" value="${inv.maturityDate || ''}" style="width:100%;" onfocus="this.type=\'date\'" onblur="if(!this.value) this.type=\'text\'">`,
    showCancelButton: true,
    confirmButtonText: 'আপডেট',
    preConfirm: () => {
      investments[idx] = {
        name: document.getElementById('invName').value.trim(),
        type: document.getElementById('invType').value,
        amount: parseFloat(document.getElementById('invAmount').value),
        interest: parseFloat(document.getElementById('invInterest').value) || 0,
        startDate: document.getElementById('invStartDate').value,
        maturityDate: document.getElementById('invMaturityDate').value
      };
      saveInvestments();
      renderInvestmentPage();
      showToast('আপডেট হয়েছে');
    }
  });
}

function deleteInvestment(idx) {
  if (confirm('মুছবেন?')) {
    investments.splice(idx, 1);
    saveInvestments();
    renderInvestmentPage();
    showToast('মুছে ফেলা হয়েছে');
  }
}

// ========== ধার-দেনা (লোন) ফাংশন ==========
function renderLoanPage() {
  const giveTotal = loans.filter(l => l.type === 'give' && l.status !== 'paid').reduce((s, l) => s + l.amount, 0);
  const takeTotal = loans.filter(l => l.type === 'take' && l.status !== 'paid').reduce((s, l) => s + l.amount, 0);
  const netReceivable = giveTotal - takeTotal;
  const html = `
    <div class="loan-summary-grid">
      <div class="loan-stat-card"><div class="loan-stat-icon">📤</div><div class="loan-stat-value">${fmt(giveTotal)}</div><div class="loan-stat-label">আমি দিয়েছি</div></div>
      <div class="loan-stat-card"><div class="loan-stat-icon">📥</div><div class="loan-stat-value">${fmt(takeTotal)}</div><div class="loan-stat-label">আমি নিয়েছি</div></div>
      <div class="loan-stat-card"><div class="loan-stat-icon">⚖️</div><div class="loan-stat-value" style="color:${netReceivable >= 0 ? 'var(--income)' : 'var(--expense)'}">${fmt(Math.abs(netReceivable))}</div><div class="loan-stat-label">${netReceivable >= 0 ? 'পাওনা' : 'প্রাপ্য'}</div></div>
    </div>
    <div id="loanModernListContainer" class="loan-list-modern"></div>
    <button class="btn-primary" onclick="openModernLoanModal()"><i class="fas fa-plus-circle"></i> নতুন ধার-দেনা যোগ করুন</button>
  `;
  document.getElementById('loanPage').innerHTML = html;
  renderModernLoanList();
}

function renderModernLoanList() {
  const container = document.getElementById('loanModernListContainer');
  if (!container) return;
  if (loans.length === 0) {
    container.innerHTML = '<div class="empty-state">🤝 কোনো ধার-দেনা নেই। নতুন যোগ করুন</div>';
    return;
  }
  container.innerHTML = loans.map((loan, idx) => {
    const remaining = loan.amount - (loan.paidAmount || 0);
    const percent = loan.amount > 0 ? Math.min(100, Math.round(((loan.paidAmount || 0) / loan.amount) * 100)) : 0;
    const isOverdue = loan.status !== 'paid' && loan.dueDate && new Date(loan.dueDate) < new Date();
    const statusText = loan.status === 'paid' ? 'পরিশোধিত' : (isOverdue ? 'মেয়াদউত্তীর্ণ' : 'বাকি');
    const statusColor = loan.status === 'paid' ? '#10B981' : (isOverdue ? '#EF4444' : '#F59E0B');
    return `
      <div class="loan-modern-card" onclick="openLoanDetailModal(${idx})">
        <div class="loan-card-header">
          <div class="loan-person"><div class="loan-avatar">${loan.type === 'give' ? '👤' : '🤝'}</div><div><div class="loan-name">${escapeHtml(loan.name)}</div><div style="font-size:11px;color:var(--text-muted)">${loan.type === 'give' ? 'আমি দিয়েছি' : 'আমি নিয়েছি'}</div></div></div>
          <div class="loan-badge ${loan.type === 'give' ? 'give' : 'take'}">${loan.type === 'give' ? 'দেওয়া' : 'নেয়া'}</div>
        </div>
        <div class="loan-amount-modern">${fmt(loan.amount)}</div>
        <div class="loan-progress-area"><div class="progress-bar-bg"><div class="progress-fill" style="width:${percent}%"></div></div><div style="display:flex; justify-content:space-between; margin-top:6px; font-size:11px;"><span>পরিশোধিত: ${fmt(loan.paidAmount || 0)}</span><span>বাকি: ${fmt(remaining)}</span></div></div>
        <div class="loan-footer"><span><i class="far fa-calendar-alt"></i> দেওয়ার তারিখ: ${loan.loanDate || 'তারিখ নেই'}</span><span style="color:${statusColor}">${statusText}</span></div>
      </div>
    `;
  }).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function openLoanDetailModal(loanIdx) {
  const loan = loans[loanIdx];
  if (!loan) return;
  const remaining = loan.amount - (loan.paidAmount || 0);
  const paidPercent = loan.amount > 0 ? Math.round(((loan.paidAmount || 0) / loan.amount) * 100) : 0;
  let historyHtml = '';
  if (loan.transactions && loan.transactions.length > 0) {
    historyHtml = loan.transactions.map(tx => `<div class="history-item"><span>${tx.date || 'তারিখ নেই'}</span><span>${fmt(tx.amount)}</span><span>${tx.account || tx.type === 'late_fee' ? 'জরিমানা' : 'পরিশোধ'}</span></div>`).join('');
  } else {
    historyHtml = '<div class="empty-state" style="padding:12px">কোনো লেনদেন ইতিহাস নেই</div>';
  }
  Swal.fire({
    title: `<div style="font-size:26px; font-weight:800;">${escapeHtml(loan.name)}</div>`,
    html: `
      <div class="modern-detail-header">
        <div style="font-size:14px; opacity:0.9">${loan.type === 'give' ? 'আমি ধার দিয়েছি' : 'আমি ধার নিয়েছি'}</div>
        <div class="detail-amount">${fmt(loan.amount)}</div>
        <div style="display:flex; justify-content:center; gap:20px; margin-top:8px;"><div><small>পরিশোধিত</small><br><strong>${fmt(loan.paidAmount || 0)}</strong></div><div><small>বাকি</small><br><strong style="color:#FDE047">${fmt(remaining)}</strong></div></div>
        <div class="progress-bar-bg" style="background:rgba(255,255,255,0.3);margin-top:12px;"><div class="progress-fill" style="width:${paidPercent}%; background:white;"></div></div>
      </div>
      <div style="text-align:left; margin-top: 12px;">
        <div style="display:flex; gap:12px; justify-content:space-between; background:var(--bg-elevated); padding:10px; border-radius:20px; margin-bottom:16px;">
          <div><i class="far fa-calendar-check"></i> দেওয়ার তারিখ<br><strong>${loan.loanDate || '—'}</strong></div>
          <div><i class="far fa-calendar-times"></i> শেষ তারিখ<br><strong>${loan.dueDate || '—'}</strong></div>
        </div>
        <div style="font-weight:700; margin-bottom:8px;">📜 লেনদেন ইতিহাস</div>
        <div class="payment-history">${historyHtml}</div>
        <div style="margin-top:18px;"><textarea id="loanNoteUpdate" rows="2" placeholder="নোট" style="width:100%; background:var(--bg-dark); border:1px solid var(--border); border-radius:20px; padding:10px;">${loan.note || ''}</textarea></div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: loan.status !== 'paid' ? '💰 পরিশোধ করুন' : 'সম্পন্ন',
    cancelButtonText: 'বন্ধ',
    showDenyButton: loan.status !== 'paid',
    denyButtonText: '✏️ সম্পাদনা',
    confirmButtonColor: '#10B981',
    denyButtonColor: '#6366F1',
    width: '520px',
    customClass: {
      popup: 'responsive-payment-popup'
    },
    preConfirm: () => {
      const newNote = document.getElementById('loanNoteUpdate')?.value;
      if (newNote !== undefined) loan.note = newNote;
      saveLoans();
      renderModernLoanList();
      return true;
    }
  }).then(res => {
    if (res.isConfirmed && loan.status !== 'paid') {
      openPaymentModalForLoan(loanIdx, () => {
        renderLoanPage();
      });
    } else if (res.isDenied) {
      openEditLoanModal(loanIdx);
    }
  });
}

function openPaymentModalForLoan(loanIdx, callback) {
  const loan = loans[loanIdx];
  const remaining = loan.amount - (loan.paidAmount || 0);
  Swal.fire({
    title: '💸 পরিশোধ করুন',
    html: `
      <div style="background:var(--accent-light); border-radius:28px; padding:16px; margin-bottom:16px;">
        <div>বাকি পরিশোধযোগ্য</div>
        <div style="font-size:32px; font-weight:800;">${fmt(remaining)}</div>
      </div>
      <input type="number" id="payAmount" placeholder="পরিমাণ (৳)" style="width:100%; padding:12px; border-radius:30px; margin-bottom:12px;">
      <input type="date" id="payDate" value="${new Date().toISOString().split('T')[0]}" style="width:100%; padding:12px; border-radius:30px; margin-bottom:12px;">
      <select id="payMethod" style="width:100%; padding:12px; border-radius:30px;">${paymentMethods.map(p => `<option>${p}</option>`).join('')}</select>
      <div style="margin-top:12px;"><label><input type="checkbox" id="includeLateFee"> লেট ফি / জরিমানা যোগ করুন</label> <input type="number" id="lateFeeVal" placeholder="জরিমানা" style="display:none; margin-top:8px; border-radius:30px; padding:8px;"></div>
    `,
    showCancelButton: true,
    confirmButtonText: '✅ নিশ্চিত পরিশোধ',
    preConfirm: () => {
      let amount = parseFloat(document.getElementById('payAmount').value);
      if (!amount || amount <= 0) Swal.showValidationMessage('সঠিক পরিমাণ দিন');
      if (amount > remaining) Swal.showValidationMessage(`বাকি ${fmt(remaining)} এর বেশি দিতে পারবেন না`);
      let lateFee = 0;
      const chk = document.getElementById('includeLateFee');
      if (chk && chk.checked) {
        const feeVal = parseFloat(document.getElementById('lateFeeVal').value);
        if (!isNaN(feeVal) && feeVal > 0) lateFee = feeVal;
      }
      return {
        amount,
        date: document.getElementById('payDate').value,
        method: document.getElementById('payMethod').value,
        lateFee
      };
    }
  }).then(res => {
    if (res.isConfirmed) {
      const {
        amount,
        date,
        method,
        lateFee
      } = res.value;
      if (!loan.paidAmount) loan.paidAmount = 0;
      loan.paidAmount += amount;
      if (!loan.transactions) loan.transactions = [];
      loan.transactions.push({
        id: Date.now(),
        amount,
        date,
        account: method,
        type: 'payment'
      });
      if (lateFee > 0) {
        loan.amount += lateFee;
        loan.transactions.push({
          id: Date.now() + 1,
          amount: lateFee,
          date,
          type: 'late_fee',
          note: 'জরিমানা'
        });
      }
      if (loan.paidAmount >= loan.amount) {
        loan.status = 'paid';
        loan.paidAmount = loan.amount;
      }
      saveLoans();
      if (callback) callback();
      else renderLoanPage();
      showToast(`${fmt(amount)} পরিশোধ সম্পন্ন হয়েছে`);
    }
  });
}

function openEditLoanModal(idx) {
  const loan = loans[idx];
  Swal.fire({
    title: '✏️ ধার-দেনা সম্পাদনা',
    html: `
      <input id="editName" value="${escapeHtml(loan.name)}" placeholder="নাম" style="width:100%; margin-bottom:10px; padding:10px; border-radius:20px;">
      <input id="editAmount" type="number" value="${loan.amount}" placeholder="মোট পরিমাণ" style="width:100%; margin-bottom:10px; padding:10px; border-radius:20px;">
      <select id="editType" style="width:100%; margin-bottom:10px; padding:10px; border-radius:20px;"><option value="give" ${loan.type === 'give' ? 'selected' : ''}>আমি দিয়েছি</option><option value="take" ${loan.type === 'take' ? 'selected' : ''}>আমি নিয়েছি</option></select>
      <input id="editLoanDate" type="date" value="${loan.loanDate || ''}" style="width:100%; margin-bottom:10px; padding:10px; border-radius:20px;">
      <input id="editDueDate" type="date" value="${loan.dueDate || ''}" style="width:100%; margin-bottom:10px; padding:10px; border-radius:20px;">
      <select id="editStatus" style="width:100%; padding:10px; border-radius:20px;"><option value="pending" ${loan.status === 'pending' ? 'selected' : ''}>বাকি</option><option value="paid" ${loan.status === 'paid' ? 'selected' : ''}>পরিশোধিত</option></select>
    `,
    showCancelButton: true,
    confirmButtonText: 'আপডেট করুন',
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
      showToast('হালনাগাদ হয়েছে');
    }
  });
}

function openModernLoanModal() {
  Swal.fire({
    title: '🤝 নতুন ধার-দেনা',
    html: `
      <input id="loanName" placeholder="ব্যক্তির নাম বা বিবরণ" style="width:100%; margin-bottom:10px; padding:12px; border-radius:24px;">
      <input id="loanAmount" type="number" placeholder="পরিমাণ (টাকা)" style="width:100%; margin-bottom:10px; padding:12px; border-radius:24px;">
      <select id="loanType" style="width:100%; margin-bottom:10px; padding:12px; border-radius:24px;"><option value="give">আমি ধার দিয়েছি</option><option value="take">আমি ধার নিয়েছি</option></select>
      <input id="loanDate" type="date" style="width:100%; margin-bottom:10px; padding:12px; border-radius:24px;">
      <input id="dueDate" type="date" style="width:100%; margin-bottom:10px; padding:12px; border-radius:24px;">
      <textarea id="loanNote" placeholder="নোট (ঐচ্ছিক)" rows="2" style="width:100%; padding:12px; border-radius:24px;"></textarea>
    `,
    showCancelButton: true,
    confirmButtonText: 'যোগ করুন',
    preConfirm: () => {
      let name = document.getElementById('loanName').value.trim();
      let amt = parseFloat(document.getElementById('loanAmount').value);
      if (!name || !amt || amt <= 0) Swal.showValidationMessage('নাম ও সঠিক পরিমাণ দিন');
      return {
        name,
        amount: amt,
        type: document.getElementById('loanType').value,
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
      showToast('ধার-দেনা যোগ হয়েছে');
    }
  });
}

// ========== ব্যাকআপ ফাংশন ==========
function exportBackup() {
  const exportData = {
    transactions: data,
    categories,
    userProfile,
    paymentMethods,
    recurringRules,
    savingsGoals,
    investments,
    loans,
    version: '5.0',
    exportDate: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  });
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
      saveData();
      savePaymentMethods();
      saveRecurringRules();
      saveSavingsGoals();
      saveInvestments();
      saveLoans();
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
      renderAll();
      showToast('ব্যাকআপ রিস্টোর সম্পন্ন');
    } catch (err) {
      showToast('ভুল ফাইল');
    }
  };
  reader.readAsText(file);
}

// ========== রেন্ডার অল ফাংশন ==========
function renderAll() {
  renderDashboard();
  renderTransactions();
  renderReportsPage();
  renderCategoriesPage();
  renderRecurringPage();
  renderCalculatorPage();
  renderSavingsPage();
  renderInvestmentPage();
  renderLoanPage();
  if (activeNav === 0) renderDashboard();
  if (activeNav === 2) renderTransactions();
  if (activeNav === 3) renderReportsPage();
  if (activeNav === 4) renderCategoriesPage();
  if (activeNav === 5) renderRecurringPage();
  if (activeNav === 6) renderCalculatorPage();
  if (activeNav === 7) renderSavingsPage();
  if (activeNav === 8) renderInvestmentPage();
  if (activeNav === 9) renderLoanPage();
  updateProfileUI();
}

// ========== ইভেন্ট লিসেনার ও ইনিশিয়ালাইজেশন ==========
document.getElementById('profileBtn')?.addEventListener('click', openProfileModal);
document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme);
document.getElementById('exportDataBtn')?.addEventListener('click', exportBackup);
document.getElementById('importDataBtn')?.addEventListener('click', () => document.getElementById('importFile').click());
document.getElementById('importFile')?.addEventListener('change', (e) => {
  if (e.target.files[0]) importBackup(e.target.files[0]);
});

// লাইভ ক্লক আপডেট
function updateLiveClock() {
  document.getElementById('liveClock').innerText = new Date().toLocaleTimeString('bn-BD', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
setInterval(updateLiveClock, 1000);
updateLiveClock();
document.getElementById('headerDate').innerText = new Date().toLocaleDateString('bn-BD', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

// অ্যাপ স্টার্ট
renderNav();
renderAll();
switchNav(0);

// স্যাম্পল ডাটা
if (data.length === 0) {
  data = [{
      id: 1,
      type: 'income',
      amount: 35000,
      description: 'বেতন',
      category: 'বেতন/ব্যবসা',
      payment: 'ব্যাংক',
      note: '',
      day: 5,
      month: currentMonth,
      year: currentYear
    },
    {
      id: 2,
      type: 'expense',
      amount: 12000,
      description: 'বাসা ভাড়া',
      category: 'বাড়ি ভাড়া',
      payment: 'নগদ',
      note: '',
      day: 2,
      month: currentMonth,
      year: currentYear
    },
    {
      id: 3,
      type: 'expense',
      amount: 3500,
      description: 'মুদি বাজার',
      category: 'খাদ্য ও মুদি',
      payment: 'বিকাশ',
      note: '',
      day: 8,
      month: currentMonth,
      year: currentYear
    },
    {
      id: 4,
      type: 'income',
      amount: 8000,
      description: 'ফ্রিল্যান্স',
      category: 'ফ্রিল্যান্স',
      payment: 'বিকাশ',
      note: '',
      day: 12,
      month: currentMonth,
      year: currentYear
    }
  ];
  saveData();
  renderDashboard();
  renderTransactions();
}