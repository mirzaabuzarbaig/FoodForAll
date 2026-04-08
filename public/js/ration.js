document.addEventListener('DOMContentLoaded', () => {
  loadStockDropdown();
  loadTransactions();
  document.getElementById('familyMembers').addEventListener('input', autoCalculateQty);
  document.getElementById('stockItem').addEventListener('change', autoCalculateQty);
});

async function loadStockDropdown() {
  try {
    const res  = await fetch('/stock');
    const data = await res.json();
    if (!data.success) { window.location.href = '/'; return; }
    const select = document.getElementById('stockItem');
    select.innerHTML = '<option value="">-- Select Item --</option>';
    data.data.forEach(item => {
      const remaining       = item.total_quantity - item.distributed_quantity;
      const opt             = document.createElement('option');
      opt.value             = item.id;
      opt.textContent       = `${item.item_name} (${remaining.toFixed(1)} ${item.unit} available)`;
      opt.dataset.remaining = remaining;
      opt.dataset.unit      = item.unit;
      opt.dataset.quota     = item.per_person_quota;
      opt.dataset.name      = item.item_name;
      select.appendChild(opt);
    });
  } catch (err) { console.error('Dropdown error:', err); }
}

function autoCalculateQty() {
  const select   = document.getElementById('stockItem');
  const selected = select.options[select.selectedIndex];
  const family   = parseInt(document.getElementById('familyMembers').value) || 0;
  const qtyEl    = document.getElementById('quantity');
  const qtyWrap  = document.getElementById('qtyWrap');
  const hintEl   = document.getElementById('qtyHint');
  const lockTag  = document.getElementById('lockTag');
  const issueBtn = document.getElementById('issueBtn');

  // Reset state
  qtyEl.readOnly = false;
  qtyEl.value    = '';
  qtyWrap.className = 'inp-wrap';
  hintEl.className  = 'field-hint';
  hintEl.textContent = '';
  lockTag.className  = 'lock-tag d-none';
  issueBtn.disabled  = false;

  if (!selected.value) return;

  const quota     = parseFloat(selected.dataset.quota)     || 0;
  const remaining = parseFloat(selected.dataset.remaining) || 0;
  const unit      = selected.dataset.unit;

  // No quota set — manual entry allowed
  if (quota === 0) {
    qtyEl.readOnly     = false;
    qtyEl.placeholder  = 'Enter quantity manually';
    hintEl.textContent = `ℹ️ No quota set for this item. Enter quantity manually.`;
    hintEl.className   = 'field-hint show info';
    lockTag.className  = 'lock-tag d-none';
    return;
  }

  // Quota set — auto calculate
  lockTag.className = 'lock-tag';
  qtyEl.readOnly    = true;

  if (family > 0) {
    const allowed = quota * family;
    qtyEl.value = allowed;

    if (allowed > remaining) {
      // Not enough stock
      qtyWrap.className  = 'inp-wrap warning';
      hintEl.textContent = `⚠️ Not enough stock! Need ${allowed} ${unit} but only ${remaining.toFixed(1)} ${unit} available.`;
      hintEl.className   = 'field-hint show warning';
      lockTag.className  = 'lock-tag warn';
      issueBtn.disabled  = true;
    } else {
      // All good
      qtyWrap.className  = 'inp-wrap locked';
      hintEl.textContent = `✅ ${family} members × ${quota} ${unit}/person = ${allowed} ${unit} auto-calculated`;
      hintEl.className   = 'field-hint show success';
    }
  } else {
    qtyEl.placeholder  = 'Enter family members first';
    hintEl.textContent = `ℹ️ Enter number of family members to auto-calculate (${quota} ${unit} per person)`;
    hintEl.className   = 'field-hint show info';
  }
}

async function issueRation() {
  const stock_id         = document.getElementById('stockItem').value;
  const beneficiary_name = document.getElementById('beneficiaryName').value.trim();
  const ration_card_no   = document.getElementById('rationCard').value.trim();
  const quantity_issued  = document.getElementById('quantity').value;
  const family_members   = document.getElementById('familyMembers').value;

  if (!ration_card_no)   { showAlert('danger', 'Please enter ration card number.'); return; }
  if (!beneficiary_name) { showAlert('danger', 'Please enter beneficiary name.'); return; }
  if (!family_members || family_members < 1) { showAlert('danger', 'Please enter number of family members.'); return; }
  if (!stock_id)         { showAlert('danger', 'Please select an item.'); return; }
  if (!quantity_issued || quantity_issued <= 0) { showAlert('danger', 'Quantity could not be calculated. Please check stock.'); return; }

  try {
    const res  = await fetch('/ration/issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock_id, beneficiary_name, ration_card_no, quantity_issued, family_members })
    });
    const data = await res.json();

    if (data.success) {
      const select   = document.getElementById('stockItem');
      const selected = select.options[select.selectedIndex];
      showAlert('success', `✅ ${quantity_issued} ${selected.dataset.unit} of ${selected.dataset.name} issued to ${beneficiary_name} successfully!`);

      // Clear form
      document.getElementById('rationCard').value      = '';
      document.getElementById('beneficiaryName').value = '';
      document.getElementById('familyMembers').value   = '';
      document.getElementById('stockItem').value       = '';
      document.getElementById('quantity').value        = '';
      document.getElementById('quantity').readOnly     = false;
      document.getElementById('qtyWrap').className     = 'inp-wrap';
      document.getElementById('qtyHint').className     = 'field-hint';
      document.getElementById('qtyHint').textContent   = '';
      document.getElementById('lockTag').className     = 'lock-tag d-none';
      document.getElementById('issueBtn').disabled     = false;

      loadStockDropdown();
      loadTransactions();
    } else {
      showAlert('danger', data.message);
    }
  } catch (err) { showAlert('danger', 'Server error. Try again.'); }
}

async function loadTransactions() {
  try {
    const res   = await fetch('/ration/transactions');
    const data  = await res.json();
    const tbody = document.getElementById('transactionTableBody');
    if (data.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#bbb;padding:2rem 0;">No transactions yet</td></tr>`;
      return;
    }
    tbody.innerHTML = data.data.map(tx => `
      <tr>
        <td>${tx.ration_card_no}</td>
        <td>${tx.beneficiary_name}</td>
        <td>${tx.item_name}</td>
        <td>${tx.quantity_issued} ${tx.unit}</td>
        <td>${tx.issued_by_name}</td>
        <td>${new Date(tx.issued_at).toLocaleDateString('en-IN')}</td>
      </tr>`).join('');
  } catch (err) { console.error('Transactions error:', err); }
}

async function searchTransactions() {
  const card = document.getElementById('searchCard').value.trim();
  if (!card) { loadTransactions(); return; }
  try {
    const res   = await fetch(`/ration/search/${card}`);
    const data  = await res.json();
    const tbody = document.getElementById('transactionTableBody');
    if (data.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#bbb;padding:2rem 0;">No records for this card</td></tr>`;
      return;
    }
    tbody.innerHTML = data.data.map(tx => `
      <tr>
        <td>${tx.ration_card_no}</td>
        <td>${tx.beneficiary_name}</td>
        <td>${tx.item_name}</td>
        <td>${tx.quantity_issued} ${tx.unit}</td>
        <td>${tx.issued_by_name}</td>
        <td>${new Date(tx.issued_at).toLocaleDateString('en-IN')}</td>
      </tr>`).join('');
  } catch (err) { console.error('Search error:', err); }
}

function showAlert(type, msg) {
  const el = document.getElementById('alertBox');
  el.className = type === 'success' ? 'alert-box show-success' : 'alert-box show-danger';
  el.innerHTML = `<i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${msg}`;
  setTimeout(() => { el.className = 'alert-box'; }, 5000);
}