// --- APPLICATION STATE (LocalStorage Persistence) ---
let state = JSON.parse(localStorage.getItem('financeAppState')) || {
    role: 'Employee',
    expenses: [
        { id: 1, title: 'AWS Cloud Hosting', category: 'Software Subscriptions', amount: 120, receipt: 'REC-101', status: 'Approved' },
        { id: 2, title: 'Client Dinner', category: 'Meals & Entertainment', amount: 85, receipt: 'REC-102', status: 'Pending' }
    ],
    wallet: 2500,
    creditScore: 720,
    loans: [],
    invoices: [
        { id: 1, client: 'TechCorp Solutions', desc: 'UI Revamp & API Integration', amount: 1200, status: 'Sent' }
    ]
};

function saveState() {
    localStorage.setItem('financeAppState', JSON.stringify(state));
    renderAll();
}

// --- THEME & ROLE MANAGEMENT ---
function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
}

function toggleRole() {
    state.role = state.role === 'Employee' ? 'Manager' : 'Employee';
    document.getElementById('role-display').innerText = `Role: ${state.role}`;
    document.getElementById('expense-form-panel').style.display = state.role === 'Employee' ? 'block' : 'none';
    renderExpenses();
}

function switchTab(tabId, event) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    if (event) event.target.classList.add('active');
}

// --- MODULE 1: EXPENSE TRACKER & APPROVAL WORKFLOW ---
document.getElementById('exp-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const newExp = {
        id: Date.now(),
        title: document.getElementById('e-title').value,
        category: document.getElementById('e-category').value,
        amount: parseFloat(document.getElementById('e-amount').value),
        receipt: document.getElementById('e-receipt').value,
        status: 'Pending'
    };
    state.expenses.push(newExp);
    saveState();
    e.target.reset();
});

function updateExpenseStatus(id, newStatus) {
    const exp = state.expenses.find(item => item.id === id);
    if (exp) {
        exp.status = newStatus;
        saveState();
    }
}

function renderExpenses() {
    const tbody = document.getElementById('expense-table-body');
    tbody.innerHTML = '';
    let total = 0, approved = 0, pending = 0;

    state.expenses.forEach(item => {
        total += item.amount;
        if (item.status === 'Approved') approved += item.amount;
        if (item.status === 'Pending') pending += item.amount;

        const tr = document.createElement('tr');
        let actions = '-';
        if (state.role === 'Manager' && item.status === 'Pending') {
            actions = `<button class="action-btn" style="color:var(--success); border-color:var(--success);" onclick="updateExpenseStatus(${item.id}, 'Approved')">Approve</button> ` +
                      `<button class="action-btn" style="color:var(--danger); border-color:var(--danger);" onclick="updateExpenseStatus(${item.id}, 'Rejected')">Reject</button>`;
        } else {
            actions = `<span style="font-size:0.8rem; color:var(--text-muted);">Ref: ${item.receipt}</span>`;
        }

        tr.innerHTML = `
            <td><strong>${item.title}</strong><br><small style="color:var(--text-muted)">${item.category}</small></td>
            <td>$${item.amount.toFixed(2)}</td>
            <td><span class="badge badge-${item.status.toLowerCase()}">${item.status}</span></td>
            <td>${actions}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('exp-total').innerText = `$${total.toFixed(2)}`;
    document.getElementById('exp-approved').innerText = `$${approved.toFixed(2)}`;
    document.getElementById('exp-pending').innerText = `$${pending.toFixed(2)}`;
}

// --- MODULE 2: P2P LENDING & WALLET SIMULATION ---
function walletAction(type) {
    const amt = parseFloat(prompt(`Enter amount to ${type}:`, '500'));
    if (!isNaN(amt) && amt > 0) {
        if (type === 'deposit') {
            state.wallet += amt;
        } else if (type === 'withdraw') {
            if (state.wallet >= amt) state.wallet -= amt;
            else { alert('Insufficient wallet balance.'); return; }
        }
        saveState();
    }
}

document.getElementById('loan-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('l-amount').value);
    const term = parseInt(document.getElementById('l-term').value);

    if (state.creditScore < 580) {
        alert('Loan Application Rejected: Credit score below minimum eligibility threshold (580).');
        return;
    }

    const annualRate = 0.10;
    const r = annualRate / 12;
    const emi = (amount * r * Math.pow(1 + r, term)) / (Math.pow(1 + r, term) - 1);

    state.loans.push({
        id: Date.now(),
        amount,
        term,
        emi: emi.toFixed(2),
        remaining: term
    });
    state.wallet += amount;
    saveState();
    e.target.reset();
});

function payEMI(id) {
    const loan = state.loans.find(l => l.id === id);
    if (loan && loan.remaining > 0) {
        const emiVal = parseFloat(loan.emi);
        if (state.wallet >= emiVal) {
            state.wallet -= emiVal;
            loan.remaining -= 1;
            if (loan.remaining === 0) {
                state.loans = state.loans.filter(l => l.id !== id);
                state.creditScore = Math.min(800, state.creditScore + 15);
            }
            saveState();
        } else {
            alert('Insufficient wallet balance to pay monthly EMI.');
        }
    }
}

function renderLending() {
    document.getElementById('wallet-balance').innerText = `$${state.wallet.toFixed(2)}`;
    document.getElementById('credit-score').innerText = state.creditScore;
    document.getElementById('active-loans-count').innerText = state.loans.length;

    const tbody = document.getElementById('loans-table-body');
    tbody.innerHTML = '';
    state.loans.forEach(loan => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${loan.id.toString().slice(-4)}</td>
            <td>$${loan.amount.toFixed(2)}</td>
            <td>$${loan.emi}/mo</td>
            <td>
                <span class="badge badge-sent">${loan.remaining} mo left</span>
                <button class="action-btn" style="margin-left: 6px;" onclick="payEMI(${loan.id})">Pay EMI</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- MODULE 3: INVOICE & CONTRACT GENERATOR ---
document.getElementById('invoice-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const newInv = {
        id: Date.now(),
        client: document.getElementById('inv-client').value,
        desc: document.getElementById('inv-desc').value,
        amount: parseFloat(document.getElementById('inv-rate').value),
        status: document.getElementById('inv-status').value
    };
    state.invoices.push(newInv);
    saveState();
    e.target.reset();
});

function deleteInvoice(id) {
    state.invoices = state.invoices.filter(i => i.id !== id);
    saveState();
}

function previewContract() {
    const client = document.getElementById('inv-client').value || 'Valued Client';
    const desc = document.getElementById('inv-desc').value || 'Professional Consulting Services';
    const amount = document.getElementById('inv-rate').value || '0.00';

    document.getElementById('contract-text').innerHTML = `
        <strong>Client Name:</strong> ${client}<br>
        <strong>Scope of Deliverables:</strong> ${desc}<br>
        <strong>Agreed Contract Value:</strong> $${amount} USD<br><br>
        <strong>Terms & Conditions:</strong><br>
        1. The Independent Contractor agrees to execute the services with professional diligence.<br>
        2. Payment terms are net-30 upon formal invoice submission.<br>
        3. Intellectual property rights transfer upon full settlement of agreed compensation.
    `;
    document.getElementById('contract-modal').classList.add('open');
}

function closeModal() {
    document.getElementById('contract-modal').classList.remove('open');
}

function renderInvoices() {
    const tbody = document.getElementById('invoice-table-body');
    tbody.innerHTML = '';
    state.invoices.forEach(inv => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${inv.client}</strong><br><small style="color:var(--text-muted)">${inv.desc}</small></td>
            <td>$${inv.amount.toFixed(2)}</td>
            <td><span class="badge badge-${inv.status.toLowerCase()}">${inv.status}</span></td>
            <td><button class="action-btn" style="color:var(--danger); border-color:var(--danger);" onclick="deleteInvoice(${inv.id})">Delete</button></td>
        `;
        tbody.appendChild(tr);
    });
}

// --- INITIALIZE RENDER ---
function renderAll() {
    renderExpenses();
    renderLending();
    renderInvoices();
}

renderAll();