document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  loadDashboard();
  loadAlerts();
  loadDemand();
  loadAnomalyAlerts();
  setInterval(loadDashboard, 30000);
  setInterval(loadAlerts, 30000);
  setInterval(() => { loadDemand(); loadAnomalyAlerts(); }, 60000);
});

async function checkAuth() {
  const res = await fetch('/auth/me');
  const data = await res.json();
  if (!data.success) {
    window.location.href = '/';
    return;
  }
  const el = document.getElementById('sidebarUser');
  if (el) el.textContent = data.user.name;
}

async function loadDashboard() {
  try {
    const res = await fetch('/dashboard/stats');
    const data = await res.json();
    if (!data.success) return;  // ← removed redirect, just return

    const { summary, recentTransactions } = data.data;

    document.getElementById('totalStock').textContent = summary.total ? Number(summary.total).toFixed(1) : '0';
    document.getElementById('distributedStock').textContent = summary.distributed ? Number(summary.distributed).toFixed(1) : '0';
    document.getElementById('remainingStock').textContent = summary.remaining ? Number(summary.remaining).toFixed(1) : '0';

    const stockRes = await fetch('/stock');
    const stockData = await stockRes.json();
    const tbody = document.getElementById('stockTableBody');
    const countEl = document.getElementById('stockCount');
    if (countEl) countEl.textContent = stockData.data.length + ' items';

    if (stockData.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#bbb;padding:1rem 0;">No stock items found</td></tr>`;
    } else {
      tbody.innerHTML = stockData.data.map(item => {
        const remaining = item.total_quantity - item.distributed_quantity;
        const percent = ((remaining / item.total_quantity) * 100).toFixed(0);
        let badge = '', color = '';
        if (percent > 30) { badge = 'Good'; color = '#66bb6a'; }
        else if (percent > 10) { badge = 'Low'; color = '#ffa726'; }
        else { badge = 'Critical'; color = '#ef5350'; }
        const cls = percent > 30 ? 'badge-green' : percent > 10 ? 'badge-orange' : 'badge-red';
        return `<tr>
          <td>${item.item_name}
            <div class="prog"><div class="prog-bar" style="width:${percent}%;background:${color};"></div></div>
          </td>
          <td>${item.total_quantity} ${item.unit}</td>
          <td>${item.distributed_quantity} ${item.unit}</td>
          <td>${remaining.toFixed(1)} ${item.unit}</td>
          <td><span class="badge ${cls}">${badge}</span></td>
        </tr>`;
      }).join('');
    }

    const txBody = document.getElementById('transactionTableBody');
    if (recentTransactions.length === 0) {
      txBody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#bbb;padding:1rem 0;">No transactions yet</td></tr>`;
    } else {
      txBody.innerHTML = recentTransactions.map(tx => `
        <tr>
          <td>${tx.beneficiary_name}</td>
          <td>${tx.item_name}</td>
          <td>${tx.quantity_issued} ${tx.unit}</td>
        </tr>`).join('');
    }
  } catch (err) { console.error('Dashboard error:', err); }
}

async function loadAlerts() {
  try {
    const res = await fetch('/stock/alerts');
    const data = await res.json();
    const banner = document.getElementById('alertBanner');
    const text = document.getElementById('alertText');

    if (data.data.length > 0) {
      const items = data.data.map(i => {
        const rem = (i.total_quantity - i.distributed_quantity).toFixed(1);
        return `${i.item_name} (${rem} ${i.unit} left)`;
      }).join(', ');
      text.innerHTML = `<strong>Low Stock:</strong> ${items} — <a href="/alerts.html" style="color:#e65100;font-weight:600;">View All Alerts</a>`;
      banner.classList.add('show');
    } else {
      banner.classList.remove('show');
    }
  } catch (err) { console.error('Alert error:', err); }
}

async function loadDemand() {
  const container = document.getElementById('demandCards');
  container.innerHTML = '<div class="loading-message">Analyzing data...</div>';
  try {
    const res = await fetch('/api/ml/demand-forecast');
    const data = await res.json();

    if (data.success && data.data && data.data.forecasts && data.data.forecasts.length > 0) {
      container.innerHTML = `<div class="demand-grid">` +
        data.data.forecasts.map(f => {
          const trendLower = (f.trend || '').toLowerCase();
          const trendClass = trendLower.includes('up') || trendLower.includes('high') || trendLower.includes('increas')
            ? 'up'
            : trendLower.includes('down') || trendLower.includes('low') || decreas(trendLower)
              ? 'down'
              : 'stable';
          return `<div class="demand-card">
            <div class="demand-item">${f.item_name}</div>
            <div class="demand-forecast">Next month: <strong>${f.forecast_qty} ${f.unit || 'kg'}</strong></div>
            <div class="demand-trend ${trendClass}">Trend: ${f.trend}</div>
          </div>`;
        }).join('') +
        `</div>`;
    } else {
      container.innerHTML = '<div class="empty-state">No forecast data available</div>';
    }
  } catch (err) {
    console.error('Demand forecast error:', err);
    container.innerHTML = '<div class="empty-state">ML service not reachable</div>';
  }
}

function decreas(s) { return s.includes('decreas'); }

async function loadAnomalyAlerts() {
  const summary = document.getElementById('anomalyAlertsSummary');
  summary.innerHTML = '<div class="loading-message">Processing insights...</div>';
  try {
    const [fraudRes, dupRes] = await Promise.all([
      fetch('/api/ml/fraud-detect'),
      fetch('/api/ml/duplicate-detect')
    ]);

    const fraud = await fraudRes.json();
    const dup = await dupRes.json();

    const fraudCount = fraud.success ? (fraud.data.total_flagged || 0) : 0;
    const dupCount = dup.success ? (dup.data.total_flagged || 0) : 0;
    const totalAlerts = fraudCount + dupCount;

    const alertBadge = document.getElementById('alertCount');
    alertBadge.textContent = totalAlerts;
    alertBadge.className = totalAlerts > 0 ? 'badge badge-red' : 'badge badge-green';

    if (totalAlerts > 0) {
      summary.innerHTML = `
        <div class="anomaly-warn">
          <div class="warn-title">⚠ ${totalAlerts} Suspicious ${totalAlerts === 1 ? 'Activity' : 'Activities'} Detected</div>
          <div class="warn-sub">
            Fraud flags: ${fraudCount} &nbsp;•&nbsp; Duplicate attempts: ${dupCount}
          </div>
          <a href="/alerts.html">View Details →</a>
        </div>`;
    } else {
      summary.innerHTML = `
        <div class="anomaly-ok">
          <div class="anomaly-check"><i class="bi bi-check-lg"></i></div>
          <p>No suspicious activity detected</p>
          <small>ML model actively monitoring transactions</small>
        </div>`;
    }
  } catch (err) {
    console.error('Anomaly detection error:', err);
    summary.innerHTML = '<div class="empty-state">ML service not reachable</div>';
  }
}