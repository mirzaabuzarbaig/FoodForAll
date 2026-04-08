document.addEventListener('DOMContentLoaded', () => {
  loadCustomerInfo();
  loadAvailableStock();
  loadMyTransactions();
});

async function loadCustomerInfo() {
  try {
    const res  = await fetch('/customer/me');
    const data = await res.json();
    if (!data.success) { window.location.href = '/'; return; }
    const c = data.customer;

    document.getElementById('navUserName').textContent     = c.name;
    document.getElementById('custWelcomeName').textContent = c.name;
    document.getElementById('custCardDisplay').textContent = c.ration_card_no;
    document.getElementById('profName').textContent        = c.name;
    document.getElementById('profCard').textContent        = c.ration_card_no;
    document.getElementById('profPhone').textContent       = c.phone   || '—';
    document.getElementById('profAddress').textContent     = c.address || '—';
  } catch (err) {
    console.error('Auth error:', err);
    window.location.href = '/';
  }
}

async function loadAvailableStock() {
  try {
    const res  = await fetch('/customer/available-stock');
    const data = await res.json();
    const tbody = document.getElementById('stockTableBody');
    document.getElementById('totalItems').textContent = data.data.length;

    if (data.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#bbb;padding:1rem 0;">No stock available</td></tr>`;
      return;
    }

    tbody.innerHTML = data.data.map(item => {
      const remaining = item.total_quantity - item.distributed_quantity;
      const percent   = ((remaining / item.total_quantity) * 100).toFixed(0);
      let badge = '', color = '';
      if      (percent > 30) { badge = 'Available'; color = '#66bb6a'; }
      else if (percent > 10) { badge = 'Limited';   color = '#ffa726'; }
      else                   { badge = 'Very Low';  color = '#ef5350'; }
      const cls = percent > 30 ? 'badge-green' : percent > 10 ? 'badge-orange' : 'badge-red';
      return `<tr>
        <td>
          ${item.item_name}
          <div class="prog"><div class="prog-bar" style="width:${percent}%;background:${color};"></div></div>
        </td>
        <td>${remaining.toFixed(1)} ${item.unit}</td>
        <td><span class="badge ${cls}">${badge}</span></td>
      </tr>`;
    }).join('');
  } catch (err) { console.error('Stock error:', err); }
}

async function loadMyTransactions() {
  try {
    const res  = await fetch('/customer/my-transactions');
    const data = await res.json();
    const list  = document.getElementById('txList');

    document.getElementById('totalTx').textContent = data.data.length;

    if (data.data.length === 0) {
      list.innerHTML = `<div style="text-align:center;color:#bbb;padding:2rem 0;font-size:0.82rem;">No transactions yet</div>`;
      return;
    }

    // Last issued
    const last = data.data[0];
    document.getElementById('lastIssued').textContent =
      new Date(last.issued_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' });

    list.innerHTML = data.data.map(tx => `
      <div class="tx-item">
        <div class="tx-left">
          <div class="tx-icon"><i class="bi bi-bag-check"></i></div>
          <div>
            <div class="tx-name">${tx.item_name}</div>
            <div class="tx-date">${new Date(tx.issued_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div class="tx-qty">${tx.quantity_issued} ${tx.unit}</div>
          <div class="tx-issued">By ${tx.issued_by_name}</div>
        </div>
      </div>`).join('');
  } catch (err) { console.error('Transactions error:', err); }
}