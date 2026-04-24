document.addEventListener('DOMContentLoaded', () => {
  let incomes = [{ name: '薪資', day: 1, amount: 0 }];
  let creditCards = [];
  let expenses = [];

  const $ = id => document.getElementById(id);
  const fmt = n => n.toLocaleString('zh-TW');
  const getVal = id => +($(id).value) || 0;
  const now = new Date();

  // ── Render Incomes ──
  function renderIncomes() {
    const el = $('incomeList'); el.innerHTML = '';
    incomes.forEach((inc, i) => {
      const r = document.createElement('div'); r.className = 'income-row';
      r.innerHTML = `
        <div class="field"><label>名稱</label><div class="input-group"><input type="text" value="${inc.name}" data-i="${i}" data-f="name" class="inc-in"></div></div>
        <div class="field"><label>發薪日</label><div class="input-group"><input type="number" value="${inc.day}" min="1" max="31" data-i="${i}" data-f="day" class="inc-in"><span class="suffix">日</span></div></div>
        <div class="field"><label>金額</label><div class="input-group"><input type="number" value="${inc.amount}" min="0" data-i="${i}" data-f="amount" class="inc-in"><span class="suffix">NTD</span></div></div>
        <button type="button" class="remove-btn" data-i="${i}">✕</button>`;
      el.appendChild(r);
    });
    el.querySelectorAll('.inc-in').forEach(inp => inp.addEventListener('change', e => {
      const f = e.target.dataset.f;
      incomes[+e.target.dataset.i][f] = (f === 'name') ? e.target.value : (+e.target.value || 0);
    }));
    el.querySelectorAll('.remove-btn').forEach(b => b.addEventListener('click', e => { incomes.splice(+e.currentTarget.dataset.i, 1); renderIncomes(); }));
  }
  $('addIncomeBtn').addEventListener('click', () => { incomes.push({ name: '收入', day: 1, amount: 0 }); renderIncomes(); });

  // ── Render Cards ──
  function renderCards() {
    const el = $('cardList'); el.innerHTML = '';
    creditCards.forEach((c, i) => {
      const r = document.createElement('div'); r.className = 'card-row';
      r.innerHTML = `
        <div class="field"><label>卡名</label><div class="input-group"><input type="text" value="${c.name}" data-i="${i}" data-f="name" class="cc-in"></div></div>
        <div class="field"><label>餘額</label><div class="input-group"><input type="number" value="${c.balance}" min="0" data-i="${i}" data-f="balance" class="cc-in"><span class="suffix">NTD</span></div></div>
        <div class="field"><label>繳款日</label><div class="input-group"><input type="number" value="${c.payDay}" min="1" max="31" data-i="${i}" data-f="payDay" class="cc-in"><span class="suffix">日</span></div></div>
        <div class="field"><label>年利率</label><div class="input-group"><input type="number" value="${c.rate}" min="0" max="30" step="0.1" data-i="${i}" data-f="rate" class="cc-in"><span class="suffix">%</span></div></div>
        <button type="button" class="remove-btn" data-i="${i}">✕</button>`;
      el.appendChild(r);
    });
    el.querySelectorAll('.cc-in').forEach(inp => inp.addEventListener('change', e => {
      const f = e.target.dataset.f;
      creditCards[+e.target.dataset.i][f] = (f === 'name') ? e.target.value : (+e.target.value || 0);
    }));
    el.querySelectorAll('.remove-btn').forEach(b => b.addEventListener('click', e => { creditCards.splice(+e.currentTarget.dataset.i, 1); renderCards(); }));
  }
  $('addCardBtn').addEventListener('click', () => { creditCards.push({ name: '', balance: 0, payDay: 1, rate: 0 }); renderCards(); });

  // ── Render Expenses ──
  function renderExpenses() {
    const el = $('expenseList'); el.innerHTML = '';
    expenses.forEach((ex, i) => {
      const r = document.createElement('div'); r.className = 'expense-row';
      r.innerHTML = `
        <div class="field"><label>名稱</label><div class="input-group"><input type="text" value="${ex.name}" data-i="${i}" data-f="name" class="ex-in"></div></div>
        <div class="field"><label>扣款日</label><div class="input-group"><input type="number" value="${ex.day}" min="1" max="31" data-i="${i}" data-f="day" class="ex-in"><span class="suffix">日</span></div></div>
        <div class="field"><label>金額</label><div class="input-group"><input type="number" value="${ex.amount}" min="0" data-i="${i}" data-f="amount" class="ex-in"><span class="suffix">NTD</span></div></div>
        <div class="field"><label>到期日</label><div class="input-group"><input type="date" value="${ex.expiry||''}" data-i="${i}" data-f="expiry" class="ex-in"></div></div>
        <button type="button" class="remove-btn" data-i="${i}">✕</button>`;
      el.appendChild(r);
    });
    el.querySelectorAll('.ex-in').forEach(inp => inp.addEventListener('change', e => {
      const f = e.target.dataset.f;
      expenses[+e.target.dataset.i][f] = (f === 'name' || f === 'expiry') ? e.target.value : (+e.target.value || 0);
    }));
    el.querySelectorAll('.remove-btn').forEach(b => b.addEventListener('click', e => { expenses.splice(+e.currentTarget.dataset.i, 1); renderExpenses(); }));
  }
  $('addExpenseBtn').addEventListener('click', () => { expenses.push({ name: '', day: 1, amount: 0, expiry: '' }); renderExpenses(); });

  // ── Helpers ──
  function isExpenseActive(expiry, monthOffset) {
    if (!expiry) return true;
    const d = new Date(expiry);
    const proj = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    return proj <= d;
  }

  function getIncomeIdx(eventDay, sortedDays) {
    let idx = -1;
    for (let i = 0; i < sortedDays.length; i++) { if (sortedDays[i] <= eventDay) idx = i; }
    return idx === -1 ? sortedDays.length - 1 : idx;
  }

  function findPayment(cards, spend, months, target) {
    if (cards.length === 0) return 0;
    const totalBal = cards.reduce((s, c) => s + c.balance, 0);
    if (totalBal <= 0 && spend <= 0) return 0;
    let lo = 0, hi = totalBal + spend * months + totalBal * 0.3;
    for (let iter = 0; iter < 80; iter++) {
      const mid = (lo + hi) / 2;
      let bal = totalBal;
      const wAvgRate = totalBal > 0 ? cards.reduce((s, c) => s + c.balance * (c.rate / 100 / 12), 0) / totalBal : 0;
      for (let m = 0; m < months; m++) {
        bal = (bal + spend) * (1 + wAvgRate) - mid;
        if (bal < 0) { bal = 0; break; }
      }
      if (bal > target) lo = mid; else hi = mid;
    }
    return Math.ceil(hi);
  }

  // ── Store report data for export ──
  let lastReportData = null;

  // ── Generate Report ──
  $('generateBtn').addEventListener('click', generateReport);

  function generateReport() {
    const sortedIncomes = [...incomes].filter(i => i.amount > 0).sort((a, b) => a.day - b.day);
    const monthlyIncome = sortedIncomes.reduce((s, i) => s + i.amount, 0);
    const initialCash = getVal('initialCash');
    const monthlySpend = getVal('monthlySpend');
    const loanMonthly = getVal('loanMonthlyPayment');
    const loanPayDay = getVal('loanPayDay');
    const targetMonths = getVal('targetMonths');
    const targetBalance = getVal('targetBalance');
    const savingsGoal = getVal('savingsGoal');
    const totalCardBal = creditCards.reduce((s, c) => s + c.balance, 0);

    // Active expenses for month 1
    const activeExp1 = expenses.filter(e => e.amount > 0 && isExpenseActive(e.expiry, 0));
    const allFixed = [...activeExp1];
    if (loanMonthly > 0) allFixed.push({ name: '貸款還款', day: loanPayDay, amount: loanMonthly, expiry: '' });
    if (savingsGoal > 0) allFixed.push({ name: '儲蓄預留', day: sortedIncomes.length > 0 ? sortedIncomes[sortedIncomes.length - 1].day : 1, amount: savingsGoal, expiry: '' });

    const totalFixed1 = allFixed.reduce((s, e) => s + e.amount, 0);
    const requiredCC = findPayment(creditCards, monthlySpend, targetMonths, targetBalance);

    // Per-card payments (proportional)
    const cardPayments = creditCards.map(c => {
      const ratio = totalCardBal > 0 ? c.balance / totalCardBal : (1 / (creditCards.length || 1));
      return { ...c, payment: Math.round(requiredCC * ratio) };
    });
    const paySum = cardPayments.reduce((s, p) => s + p.payment, 0);
    if (cardPayments.length > 0) cardPayments[0].payment += (requiredCC - paySum);

    const disposable = monthlyIncome - totalFixed1 - requiredCC;

    // ── Events for month 1 ──
    const events = [];
    sortedIncomes.forEach(inc => events.push({ day: inc.day, label: inc.name, amount: inc.amount, type: 'income' }));
    allFixed.forEach(e => events.push({ day: e.day, label: e.name, amount: -e.amount, type: e.name === '儲蓄預留' ? 'savings' : 'expense' }));
    cardPayments.forEach(cp => events.push({ day: cp.payDay, label: `${cp.name} 還款`, amount: -cp.payment, type: 'payment' }));
    events.sort((a, b) => a.day - b.day || (a.amount < 0 ? 1 : -1));

    // ── Income allocation ──
    const incomeDays = sortedIncomes.map(i => i.day);
    const allocations = sortedIncomes.map(inc => ({ ...inc, items: [], totalOut: 0 }));
    const allocItems = [...allFixed.map(e => ({ ...e })), ...cardPayments.map(cp => ({ name: `${cp.name} 還款`, day: cp.payDay, amount: cp.payment }))];
    allocItems.forEach(item => {
      if (allocations.length === 0) return;
      const idx = getIncomeIdx(item.day, incomeDays);
      allocations[idx].items.push(item);
      allocations[idx].totalOut += item.amount;
    });

    // ── Cash flow sim ──
    let cash = initialCash, minCash = initialCash, minDay = 0;
    for (let day = 1; day <= 31; day++) {
      events.filter(e => e.day === day).forEach(ev => { cash += ev.amount; });
      if (cash < minCash) { minCash = cash; minDay = day; }
    }

    // ── Projections ──
    const projections = [];
    let runBal = totalCardBal, cumInt = 0;
    const wAvgRate = totalCardBal > 0 ? creditCards.reduce((s, c) => s + c.balance * (c.rate / 100 / 12), 0) / totalCardBal : 0;
    for (let m = 1; m <= targetMonths; m++) {
      const sb = runBal;
      const activeExpM = expenses.filter(e => e.amount > 0 && isExpenseActive(e.expiry, m - 1));
      const ws = sb + monthlySpend;
      const interest = Math.round(ws * wAvgRate);
      cumInt += interest;
      const eb = Math.max(0, ws + interest - requiredCC);
      projections.push({ month: m, startBal: sb, spend: monthlySpend, interest, payment: requiredCC, endBal: eb, cumInterest: cumInt });
      runBal = eb;
    }

    const m1Int = projections.length > 0 ? projections[0].interest : 0;
    const finalM = projections[projections.length - 1] || { endBal: 0, cumInterest: 0 };
    const onTrack = finalM.endBal <= targetBalance;

    // Store for export
    lastReportData = { sortedIncomes, monthlyIncome, totalCardBal, totalFixed1, requiredCC, disposable, monthlySpend, m1Int, cardPayments, allocations, events, initialCash, minCash, minDay, projections, finalM, onTrack, targetMonths, targetBalance, wAvgRate, savingsGoal };

    // ══ BUILD HTML ══
    let h = '';

    // 1. Overview
    h += `<section class="report-section"><h3>📋 基本概覽</h3>
      <div class="summary-bar"><div class="summary-item"><div class="label">每月總收入</div><div class="value green">${fmt(monthlyIncome)}</div></div>
      <div class="summary-item"><div class="label">信用卡總餘額</div><div class="value red">${fmt(totalCardBal)}</div></div></div>
      <div class="summary-bar tri"><div class="summary-item"><div class="label">每月固定支出</div><div class="value amber">${fmt(totalFixed1)}</div></div>
      <div class="summary-item"><div class="label">需月還信用卡</div><div class="value blue">${fmt(requiredCC)}</div></div>
      <div class="summary-item"><div class="label">月結餘可支配</div><div class="value ${disposable >= 0 ? 'green' : 'red'}">${fmt(disposable)}</div></div></div>
      <div class="summary-bar"><div class="summary-item"><div class="label">每月新增消費</div><div class="value amber">${fmt(monthlySpend)}</div></div>
      <div class="summary-item"><div class="label">首月預估利息</div><div class="value red">${fmt(m1Int)}</div></div></div></section>`;

    // 2. Month 1 plan
    h += `<section class="report-section"><h3>📅 第 1 個月還款計畫</h3>`;
    if (cardPayments.length > 0) {
      h += `<table class="report-table"><thead><tr><th>卡片</th><th class="num">起始餘額</th><th class="num">繳款日</th><th class="num">年利率</th><th class="num">本月還款</th></tr></thead><tbody>`;
      cardPayments.forEach(cp => {
        h += `<tr><td>${cp.name}</td><td class="num">${fmt(cp.balance)}</td><td class="num">${cp.payDay}日</td><td class="num">${cp.rate}%</td><td class="num" style="color:var(--accent-green)">${fmt(cp.payment)}</td></tr>`;
      });
      h += `</tbody></table>`;
    }

    // Allocation
    if (allocations.length > 0) {
      h += `<h4 style="font-size:0.85rem;margin-top:1.4rem;margin-bottom:0.6rem;color:var(--text-secondary)">💵 收入分配明細</h4>`;
      allocations.forEach(al => {
        h += `<div class="alloc-block"><h5>📌 ${al.day}日 ${al.name}：<span style="color:var(--accent-green)">${fmt(al.amount)}</span></h5>`;
        al.items.sort((a, b) => a.day - b.day).forEach(it => {
          h += `<div class="alloc-row"><span class="ar-label">${it.name}<span class="ar-day">(${it.day}日)</span></span><span class="ar-amount neg">-${fmt(it.amount)}</span></div>`;
        });
        const rem = al.amount - al.totalOut;
        h += `<div class="alloc-row total-row"><span class="ar-label">期間餘額</span><span class="ar-amount ${rem >= 0 ? 'pos' : 'neg'}">${fmt(rem)}</span></div></div>`;
      });
    }

    // Timeline
    h += `<h4 style="font-size:0.85rem;margin-top:1.4rem;margin-bottom:0.5rem;color:var(--text-secondary)">月度現金流時間線</h4><div class="timeline">`;
    events.forEach(ev => {
      const cls = ev.amount >= 0 ? 'positive' : (ev.type === 'payment' ? 'warning' : 'negative');
      h += `<div class="timeline-item ${ev.type}"><div class="tl-left"><span class="tl-day">${ev.day}日</span><span class="tl-label">${ev.label}</span></div><span class="tl-amount ${cls}">${ev.amount >= 0 ? '+' : ''}${fmt(ev.amount)}</span></div>`;
    });
    h += `</div>`;
    h += `<div class="cashflow-alert ${minCash < 0 ? 'danger' : 'safe'}"><span class="cfa-icon">${minCash < 0 ? '⚠️' : '✅'}</span><span class="cfa-text">現金最低點：第 ${minDay} 日</span><span class="cfa-val">${fmt(Math.round(minCash))}</span></div></section>`;

    // 3. Predictions
    if (projections.length > 0 && totalCardBal > 0) {
      h += `<section class="report-section"><h3>📈 還款預測</h3>`;
      const m24 = projections.find(p => p.month === 24);
      if (m24) {
        const pct = Math.max(0, Math.min(100, Math.round((1 - m24.endBal / totalCardBal) * 100)));
        h += `<h4 style="font-size:0.85rem;margin-bottom:0.5rem;color:var(--text-secondary)">第 24 個月</h4>
          <div class="summary-bar"><div class="summary-item"><div class="label">預測餘額</div><div class="value ${m24.endBal <= targetBalance ? 'green' : 'amber'}">${fmt(m24.endBal)}</div></div>
          <div class="summary-item"><div class="label">已償還</div><div class="value blue">${pct}%</div></div></div>
          <div class="progress-wrap"><div class="progress-label"><span>起始 ${fmt(totalCardBal)}</span><span>目標 ${fmt(targetBalance)}</span></div><div class="progress-bar"><div class="progress-fill ${pct >= 60 ? 'on-track' : 'behind'}" style="width:${pct}%"></div></div></div>`;
      }
      const pctF = Math.max(0, Math.min(100, Math.round((1 - finalM.endBal / totalCardBal) * 100)));
      h += `<h4 style="font-size:0.85rem;margin-top:1.2rem;margin-bottom:0.5rem;color:var(--text-secondary)">第 ${targetMonths} 個月（目標月）</h4>
        <div class="summary-bar"><div class="summary-item"><div class="label">預測餘額</div><div class="value ${onTrack ? 'green' : 'red'}">${fmt(finalM.endBal)}</div></div>
        <div class="summary-item"><div class="label">達標狀態</div><div class="value"><span class="badge ${onTrack ? 'success' : 'danger'}">${onTrack ? '✓ 達標' : '✗ 未達標'}</span></div></div></div>
        <div class="progress-wrap"><div class="progress-label"><span>起始 ${fmt(totalCardBal)}</span><span>目標 ${fmt(targetBalance)}</span></div><div class="progress-bar"><div class="progress-fill ${onTrack ? 'on-track' : 'behind'}" style="width:${pctF}%"></div></div></div>`;
      if (finalM.cumInterest > 0) {
        const intPct = requiredCC * targetMonths > 0 ? Math.round(finalM.cumInterest / (requiredCC * targetMonths) * 100) : 0;
        h += `<div class="interest-stat"><div class="interest-stat-item"><div class="is-label">累計利息支出</div><div class="is-value">${fmt(finalM.cumInterest)}</div></div>
          <div class="interest-stat-item"><div class="is-label">利息佔總還款</div><div class="is-value">${intPct}%</div></div></div>`;
      }
      h += `</section>`;
    }

    // 4. Monthly table
    if (projections.length > 0) {
      h += `<section class="report-section"><h3>📊 逐月預測表</h3><div class="projection-scroll"><table class="report-table"><thead><tr><th>月份</th><th class="num">月初餘額</th><th class="num">＋消費</th><th class="num">＋利息</th><th class="num">－還款</th><th class="num">月底餘額</th></tr></thead><tbody>`;
      projections.forEach(p => {
        const hl = p.month === 24 ? 'background:rgba(56,132,244,0.08);' : '';
        h += `<tr style="${hl}"><td>${p.month}</td><td class="num">${fmt(p.startBal)}</td><td class="num" style="color:var(--accent-red)">+${fmt(p.spend)}</td><td class="num" style="color:var(--accent-amber)">+${fmt(p.interest)}</td><td class="num" style="color:var(--accent-green)">-${fmt(p.payment)}</td><td class="num" style="font-weight:600">${fmt(p.endBal)}</td></tr>`;
      });
      h += `</tbody></table></div></section>`;
    }

    $('reportOutput').innerHTML = h;
    $('reportOutput').classList.remove('hidden');
    $('exportBar').classList.remove('hidden');
    $('reportOutput').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── MD Export ──
  $('exportMdBtn').addEventListener('click', () => {
    if (!lastReportData) return;
    const d = lastReportData;
    let md = `# FINCALANCE 還款報告\n\n生成日期：${now.toLocaleDateString('zh-TW')}\n\n`;
    md += `## 📋 基本概覽\n\n| 項目 | 金額 |\n|---|---:|\n`;
    md += `| 每月總收入 | ${fmt(d.monthlyIncome)} |\n| 信用卡總餘額 | ${fmt(d.totalCardBal)} |\n| 每月固定支出 | ${fmt(d.totalFixed1)} |\n| 需月還信用卡 | ${fmt(d.requiredCC)} |\n| 月結餘可支配 | ${fmt(d.disposable)} |\n| 每月新增消費 | ${fmt(d.monthlySpend)} |\n| 首月預估利息 | ${fmt(d.m1Int)} |\n\n`;

    if (d.cardPayments.length > 0) {
      md += `## 📅 第 1 個月還款計畫\n\n| 卡片 | 起始餘額 | 繳款日 | 年利率 | 本月還款 |\n|---|---:|---:|---:|---:|\n`;
      d.cardPayments.forEach(cp => { md += `| ${cp.name} | ${fmt(cp.balance)} | ${cp.payDay}日 | ${cp.rate}% | ${fmt(cp.payment)} |\n`; });
      md += `\n`;
    }

    if (d.allocations.length > 0) {
      md += `### 💵 收入分配明細\n\n`;
      d.allocations.forEach(al => {
        md += `**${al.day}日 ${al.name}：${fmt(al.amount)}**\n\n| 項目 | 日期 | 金額 |\n|---|---:|---:|\n`;
        al.items.forEach(it => { md += `| ${it.name} | ${it.day}日 | -${fmt(it.amount)} |\n`; });
        md += `| **期間餘額** | | **${fmt(al.amount - al.totalOut)}** |\n\n`;
      });
    }

    md += `### 現金最低點\n\n第 ${d.minDay} 日：${fmt(Math.round(d.minCash))}\n\n`;

    if (d.projections.length > 0 && d.totalCardBal > 0) {
      md += `## 📈 還款預測\n\n| 月份 | 預測餘額 | 達標 |\n|---|---:|---:|\n`;
      const m24 = d.projections.find(p => p.month === 24);
      if (m24) md += `| 第 24 個月 | ${fmt(m24.endBal)} | ${m24.endBal <= d.targetBalance ? '✓' : '✗'} |\n`;
      md += `| 第 ${d.targetMonths} 個月 | ${fmt(d.finalM.endBal)} | ${d.onTrack ? '✓ 達標' : '✗ 未達標'} |\n\n`;
      if (d.finalM.cumInterest > 0) md += `累計利息支出：${fmt(d.finalM.cumInterest)}\n\n`;
    }

    if (d.projections.length > 0) {
      md += `## 📊 逐月預測表\n\n| 月份 | 月初餘額 | ＋消費 | ＋利息 | －還款 | 月底餘額 |\n|---|---:|---:|---:|---:|---:|\n`;
      d.projections.forEach(p => { md += `| ${p.month} | ${fmt(p.startBal)} | +${fmt(p.spend)} | +${fmt(p.interest)} | -${fmt(p.payment)} | ${fmt(p.endBal)} |\n`; });
    }

    md += `\n---\n*FINCALANCE © 2026 — 僅供數字分析參考，不構成財務建議*\n`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `FINCALANCE_報告_${now.toISOString().slice(0, 10)}.md`; a.click();
    URL.revokeObjectURL(a.href);
  });

  // ── PDF Export ──
  $('exportPdfBtn').addEventListener('click', () => {
    const el = $('reportOutput');
    if (el.classList.contains('hidden')) return;
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `FINCALANCE_報告_${now.toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, backgroundColor: '#0b0e14', useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(el).save();
  });

  // ── Init ──
  renderIncomes();
  renderCards();
  renderExpenses();
});
