document.addEventListener('DOMContentLoaded', () => {
  loadStock();
});

async function loadStock() {
  try {
    const res  = await fetch('/stock');
    const data = await res.json();
    if (!data.success) { window.location.href = '/'; return; }

    const tbody   = document.getElementById('stockTableBody');
    const countEl = document.getElementById('stockCount');
    if (countEl) countEl.textContent = data.data.length + ' items';

    if (data.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#bbb;padding:2rem 0;">No stock items yet. Add your first item!</td></tr>`;
      return;
    }

    tbody.innerHTML = data.data.map(item => {
      const remaining = (item.total_quantity - item.distributed_quantity).toFixed(1);
      const percent   = ((remaining / item.total_quantity) * 100).toFixed(0);
      let color = '';
      if      (percent > 30) color = '#66bb6a';
      else if (percent > 10) color = '#ffa726';
      else                   color = '#ef5350';
      const cls   = percent > 30 ? 'badge-green' : percent > 10 ? 'badge-orange' : 'badge-red';
      const badge = percent > 30 ? 'Good' : percent > 10 ? 'Low' : 'Critical';

      return `<tr>
        <td>
          ${item.item_name}
          <div class="prog"><div class="prog-bar" style="width:${percent}%;background:${color};"></div></div>
        </td>
        <td>${item.total_quantity} ${item.unit}</td>
        <td>${item.distributed_quantity} ${item.unit}</td>
        <td>${remaining} ${item.unit}</td>
        <td>${item.per_person_quota > 0 ? item.per_person_quota + ' ' + item.unit : '—'}</td>
        <td><span class="badge ${cls}">${badge}</span></td>
        <td>
          <div class="add-more">
            <input type="number" id="addQty_${item.id}" placeholder="Qty" min="1"/>
            <button class="add-more-btn" onclick="addMoreStock(${item.id})">
              <i class="bi bi-plus"></i> Add
            </button>
          </div>
        </td>
        <td>
          <button class="reset-btn" onclick="resetCycle(${item.id}, '${item.item_name}')">
            <i class="bi bi-arrow-clockwise"></i> Reset
          </button>
        </td>
        <td>
          <button class="delete-btn" onclick="deleteStock(${item.id}, '${item.item_name}')">
            <i class="bi bi-trash"></i> Delete
          </button>
        </td>
      </tr>`;
    }).join('');

  } catch (err) { console.error('Load stock error:', err); }
}

async function addStock() {
  const item_name        = document.getElementById('itemName').value.trim();
  const total_quantity   = document.getElementById('totalQty').value;
  const unit             = document.getElementById('unit').value;
  const alert_threshold  = document.getElementById('alertThreshold').value || 10;
  const per_person_quota = document.getElementById('perPersonQuota').value || 0;

  if (!item_name || !total_quantity) {
    showAlert('danger', 'Please fill in all required fields.');
    return;
  }

  try {
    const res  = await fetch('/stock/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_name, total_quantity, unit, alert_threshold, per_person_quota })
    });
    const data = await res.json();
    if (data.success) {
      showAlert('success', '✅ Stock item added successfully!');
      document.getElementById('itemName').value       = '';
      document.getElementById('totalQty').value       = '';
      document.getElementById('alertThreshold').value = '';
      document.getElementById('perPersonQuota').value = '';
      loadStock();
    } else { showAlert('danger', data.message); }
  } catch (err) { showAlert('danger', 'Server error. Try again.'); }
}

async function addMoreStock(id) {
  const qty = document.getElementById(`addQty_${id}`).value;
  if (!qty || qty <= 0) { showAlert('danger', 'Enter a valid quantity.'); return; }
  try {
    const res  = await fetch(`/stock/update/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: qty })
    });
    const data = await res.json();
    if (data.success) {
      showAlert('success', '✅ Stock updated successfully!');
      loadStock();
    } else { showAlert('danger', data.message); }
  } catch (err) { showAlert('danger', 'Server error. Try again.'); }
}

async function resetCycle(id, name) {
  if (!confirm(`Reset cycle for ${name}? All customers can receive ration again.`)) return;
  try {
    const res  = await fetch(`/ration/reset-cycle/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      showAlert('success', `✅ Cycle reset for ${name}! Customers can now receive ration again.`);
      loadStock();
    } else { showAlert('danger', data.message); }
  } catch (err) { showAlert('danger', 'Server error. Try again.'); }
}
async function deleteStock(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"?\nThis will also delete all transactions for this item.`)) return;
  try {
    const res  = await fetch(`/stock/delete/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      showAlert('success', `✅ "${name}" deleted successfully!`);
      loadStock();
    } else { showAlert('danger', data.message); }
  } catch (err) { showAlert('danger', 'Server error. Try again.'); }
}
function showAlert(type, msg) {
  const el = document.getElementById('alertBox');
  el.className = type === 'success' ? 'alert-box show-success' : 'alert-box show-danger';
  el.innerHTML = `<i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${msg}`;
  setTimeout(() => { el.className = 'alert-box'; }, 4000);
}