document.addEventListener('DOMContentLoaded',()=>{
let incomes=[{name:'薪資',day:1,amount:0}];
let creditCards=[];
// Preset expenses: cannot be deleted, amount can be 0
const PRESETS=['房租','水電瓦斯','網路／電話','保險費','生活費（餐飲）','交通費','娛樂費'];
let expenses=PRESETS.map(n=>({name:n,day:1,amount:0,expiry:'',preset:true}));

const $=id=>document.getElementById(id);
const fmt=n=>n.toLocaleString('zh-TW');
const getVal=id=>+($(id).value)||0;
const now=new Date();

function renderIncomes(){
  const el=$('incomeList');el.innerHTML='';
  incomes.forEach((inc,i)=>{
    const r=document.createElement('div');r.className='income-row';
    r.innerHTML=`<div class="field"><label>名稱</label><div class="input-group"><input type="text" value="${inc.name}" data-i="${i}" data-f="name" class="inc-in"></div></div>
    <div class="field"><label>發薪日</label><div class="input-group"><input type="number" value="${inc.day}" min="1" max="31" data-i="${i}" data-f="day" class="inc-in"><span class="suffix">日</span></div></div>
    <div class="field"><label>金額</label><div class="input-group"><input type="number" value="${inc.amount}" min="0" data-i="${i}" data-f="amount" class="inc-in"><span class="suffix">NTD</span></div></div>
    <button type="button" class="remove-btn" data-i="${i}">✕</button>`;
    el.appendChild(r);
  });
  el.querySelectorAll('.inc-in').forEach(inp=>inp.addEventListener('change',e=>{
    const f=e.target.dataset.f;incomes[+e.target.dataset.i][f]=(f==='name')?e.target.value:(+e.target.value||0);
  }));
  el.querySelectorAll('.remove-btn').forEach(b=>b.addEventListener('click',e=>{incomes.splice(+e.currentTarget.dataset.i,1);renderIncomes();}));
}
$('addIncomeBtn').addEventListener('click',()=>{incomes.push({name:'收入',day:1,amount:0});renderIncomes();});

function renderCards(){
  const el=$('cardList');el.innerHTML='';
  creditCards.forEach((c,i)=>{
    const r=document.createElement('div');r.className='card-row';
    r.innerHTML=`<div class="field"><label>卡名</label><div class="input-group"><input type="text" value="${c.name}" data-i="${i}" data-f="name" class="cc-in"></div></div>
    <div class="field"><label>餘額</label><div class="input-group"><input type="number" value="${c.balance}" min="0" data-i="${i}" data-f="balance" class="cc-in"><span class="suffix">NTD</span></div></div>
    <div class="field"><label>繳款日</label><div class="input-group"><input type="number" value="${c.payDay}" min="1" max="31" data-i="${i}" data-f="payDay" class="cc-in"><span class="suffix">日</span></div></div>
    <div class="field"><label>年利率</label><div class="input-group"><input type="number" value="${c.rate}" min="0" max="30" step="0.1" data-i="${i}" data-f="rate" class="cc-in"><span class="suffix">%</span></div></div>
    <button type="button" class="remove-btn" data-i="${i}">✕</button>`;
    el.appendChild(r);
  });
  el.querySelectorAll('.cc-in').forEach(inp=>inp.addEventListener('change',e=>{
    const f=e.target.dataset.f;creditCards[+e.target.dataset.i][f]=(f==='name')?e.target.value:(+e.target.value||0);
  }));
  el.querySelectorAll('.remove-btn').forEach(b=>b.addEventListener('click',e=>{creditCards.splice(+e.currentTarget.dataset.i,1);renderCards();}));
}
$('addCardBtn').addEventListener('click',()=>{creditCards.push({name:'',balance:0,payDay:1,rate:0});renderCards();});

function renderExpenses(){
  const el=$('expenseList');el.innerHTML='';
  expenses.forEach((ex,i)=>{
    const r=document.createElement('div');r.className='expense-row';
    const nameCell=ex.preset
      ?`<div class="field"><label>名稱</label><div class="preset-name"><span class="lock-icon">🔒</span>${ex.name}</div></div>`
      :`<div class="field"><label>名稱</label><div class="input-group"><input type="text" value="${ex.name}" data-i="${i}" data-f="name" class="ex-in"></div></div>`;
    const delBtn=ex.preset?`<div style="width:32px"></div>`:`<button type="button" class="remove-btn" data-i="${i}">✕</button>`;
    r.innerHTML=`${nameCell}
    <div class="field"><label>扣款日</label><div class="input-group"><input type="number" value="${ex.day}" min="1" max="31" data-i="${i}" data-f="day" class="ex-in"><span class="suffix">日</span></div></div>
    <div class="field"><label>金額</label><div class="input-group"><input type="number" value="${ex.amount}" min="0" data-i="${i}" data-f="amount" class="ex-in"><span class="suffix">NTD</span></div></div>
    <div class="field"><label>到期日</label><div class="input-group"><input type="date" value="${ex.expiry||''}" data-i="${i}" data-f="expiry" class="ex-in"></div></div>
    ${delBtn}`;
    el.appendChild(r);
  });
  el.querySelectorAll('.ex-in').forEach(inp=>inp.addEventListener('change',e=>{
    const f=e.target.dataset.f;expenses[+e.target.dataset.i][f]=(f==='name'||f==='expiry')?e.target.value:(+e.target.value||0);
  }));
  el.querySelectorAll('.remove-btn').forEach(b=>b.addEventListener('click',e=>{
    const i=+e.currentTarget.dataset.i;if(!expenses[i].preset){expenses.splice(i,1);renderExpenses();}
  }));
}
$('addExpenseBtn').addEventListener('click',()=>{expenses.push({name:'',day:1,amount:0,expiry:'',preset:false});renderExpenses();});

function isActive(expiry,monthOff){if(!expiry)return true;return new Date(now.getFullYear(),now.getMonth()+monthOff,1)<=new Date(expiry);}
function getIncomeIdx(day,days){let idx=-1;for(let i=0;i<days.length;i++){if(days[i]<=day)idx=i;}return idx===-1?days.length-1:idx;}
function findPayment(cards,spend,months,target){
  if(!cards.length)return 0;const tb=cards.reduce((s,c)=>s+c.balance,0);if(tb<=0&&spend<=0)return 0;
  const wr=tb>0?cards.reduce((s,c)=>s+c.balance*(c.rate/100/12),0)/tb:0;
  let lo=0,hi=tb+spend*months+tb*0.3;
  for(let it=0;it<80;it++){const mid=(lo+hi)/2;let b=tb;for(let m=0;m<months;m++){b=(b+spend)*(1+wr)-mid;if(b<0){b=0;break;}}if(b>target)lo=mid;else hi=mid;}
  return Math.ceil(hi);
}

let lastReportData=null;
$('generateBtn').addEventListener('click',generateReport);

function generateReport(){
  const si=[...incomes].filter(i=>i.amount>0).sort((a,b)=>a.day-b.day);
  const mi=si.reduce((s,i)=>s+i.amount,0);
  const ic=getVal('initialCash'),ms=getVal('monthlySpend');
  const lm=getVal('loanMonthlyPayment'),lpd=getVal('loanPayDay'),led=$('loanEndDate').value;
  const tm=getVal('targetMonths'),tb=getVal('targetBalance'),sg=getVal('savingsGoal');
  const tcb=creditCards.reduce((s,c)=>s+c.balance,0);

  // Active expenses for month 1
  const ae=expenses.filter(e=>e.amount>0&&isActive(e.expiry,0));
  const af=[...ae];
  if(lm>0&&isActive(led,0))af.push({name:'貸款還款',day:lpd,amount:lm,expiry:led});
  if(sg>0)af.push({name:'儲蓄預留',day:si.length?si[si.length-1].day:1,amount:sg,expiry:''});
  const tf=af.reduce((s,e)=>s+e.amount,0);
  const rcc=findPayment(creditCards,ms,tm,tb);

  // Per-card payments
  const cp=creditCards.map(c=>{const r=tcb>0?c.balance/tcb:(1/(creditCards.length||1));return{...c,payment:Math.round(rcc*r)};});
  const ps=cp.reduce((s,p)=>s+p.payment,0);if(cp.length>0)cp[0].payment+=(rcc-ps);
  const disp=mi-tf-rcc;

  // Events
  const ev=[];
  si.forEach(inc=>ev.push({day:inc.day,label:inc.name,amount:inc.amount,type:'income'}));
  af.forEach(e=>ev.push({day:e.day,label:e.name,amount:-e.amount,type:e.name==='儲蓄預留'?'savings':'expense'}));
  cp.forEach(c=>ev.push({day:c.payDay,label:`${c.name} 還款`,amount:-c.payment,type:'payment'}));
  ev.sort((a,b)=>a.day-b.day||(a.amount<0?1:-1));

  // ── Smart CC allocation across incomes ──
  const iDays=si.map(i=>i.day);
  const alloc=si.map(inc=>({...inc,items:[],totalOut:0,ccAlloc:0}));
  // Fixed expenses → by due date
  af.forEach(e=>{if(!alloc.length)return;const idx=getIncomeIdx(e.day,iDays);alloc[idx].items.push({...e});alloc[idx].totalOut+=e.amount;});
  // CC payments → distribute proportionally across ALL incomes
  if(rcc>0&&alloc.length>0){
    let ccLeft=rcc;
    alloc.forEach((al,i)=>{
      const share=i<alloc.length-1?Math.round(rcc*al.amount/mi):ccLeft;
      al.ccAlloc=share;al.items.push({name:'信用卡還款配額',day:al.day,amount:share});al.totalOut+=share;ccLeft-=share;
    });
  }

  // Cash flow sim
  let cash=ic,minC=ic,minD=0;
  for(let d=1;d<=31;d++){ev.filter(e=>e.day===d).forEach(e=>{cash+=e.amount;});if(cash<minC){minC=cash;minD=d;}}

  // Projections
  const proj=[];let rb=tcb,ci=0;
  const wr=tcb>0?creditCards.reduce((s,c)=>s+c.balance*(c.rate/100/12),0)/tcb:0;
  for(let m=1;m<=tm;m++){
    const sb=rb,ws=sb+ms,int=Math.round(ws*wr);ci+=int;
    const eb=Math.max(0,ws+int-rcc);
    // Check active expenses for this month (for future: variable fixed costs)
    const aeM=expenses.filter(e=>e.amount>0&&isActive(e.expiry,m-1));
    const lmActive=lm>0&&isActive(led,m-1);
    const tfM=aeM.reduce((s,e)=>s+e.amount,0)+(lmActive?lm:0)+sg;
    proj.push({month:m,startBal:sb,spend:ms,interest:int,payment:rcc,endBal:eb,cumInt:ci,fixedCost:tfM});
    rb=eb;
  }

  const m1i=proj.length?proj[0].interest:0;
  const fm=proj[proj.length-1]||{endBal:0,cumInt:0};
  const ot=fm.endBal<=tb;

  lastReportData={si,mi,tcb,tf,rcc,disp,ms,m1i,cp,alloc,ev,ic,minC,minD,proj,fm,ot,tm,tb,wr,sg,led,lm};

  // ══ BUILD HTML ══
  let h='';
  // 1. Overview
  h+=`<section class="report-section"><h3>📋 基本概覽</h3>
  <div class="summary-bar"><div class="summary-item"><div class="label">每月總收入</div><div class="value green">${fmt(mi)}</div></div>
  <div class="summary-item"><div class="label">信用卡總餘額</div><div class="value red">${fmt(tcb)}</div></div></div>
  <div class="summary-bar tri"><div class="summary-item"><div class="label">每月固定支出</div><div class="value amber">${fmt(tf)}</div></div>
  <div class="summary-item"><div class="label">需月還信用卡</div><div class="value blue">${fmt(rcc)}</div></div>
  <div class="summary-item"><div class="label">月結餘可支配</div><div class="value ${disp>=0?'green':'red'}">${fmt(disp)}</div></div></div>
  <div class="summary-bar"><div class="summary-item"><div class="label">每月新增刷卡消費</div><div class="value amber">${fmt(ms)}</div></div>
  <div class="summary-item"><div class="label">首月預估利息</div><div class="value red">${fmt(m1i)}</div></div></div></section>`;

  // 2. Month 1
  h+=`<section class="report-section"><h3>📅 第 1 個月還款計畫</h3>`;
  if(cp.length>0){
    h+=`<table class="report-table"><thead><tr><th>卡片</th><th class="num">起始餘額</th><th class="num">繳款日</th><th class="num">年利率</th><th class="num">＋新增消費</th><th class="num">本月還款</th></tr></thead><tbody>`;
    cp.forEach(c=>{
      const ratio=tcb>0?c.balance/tcb:1/cp.length;
      const cardSpend=Math.round(ms*ratio);
      h+=`<tr><td>${c.name}</td><td class="num">${fmt(c.balance)}</td><td class="num">${c.payDay}日</td><td class="num">${c.rate}%</td><td class="num" style="color:var(--accent-amber)">+${fmt(cardSpend)}</td><td class="num" style="color:var(--accent-green)">${fmt(c.payment)}</td></tr>`;
    });
    h+=`</tbody></table>`;
  }

  // Allocation
  if(alloc.length>0){
    h+=`<h4 style="font-size:0.85rem;margin-top:1.4rem;margin-bottom:0.6rem;color:var(--text-secondary)">💵 收入分配明細（信用卡還款已自動分配至各收入）</h4>`;
    alloc.forEach(al=>{
      h+=`<div class="alloc-block"><h5>📌 ${al.day}日 ${al.name}：<span style="color:var(--accent-green)">${fmt(al.amount)}</span></h5>`;
      al.items.sort((a,b)=>a.day-b.day).forEach(it=>{
        const isCC=it.name==='信用卡還款配額';
        h+=`<div class="alloc-row"><span class="ar-label">${it.name}<span class="ar-day">(${it.day}日)</span></span><span class="ar-amount neg" ${isCC?'style="color:var(--accent-amber)"':''}>-${fmt(it.amount)}</span></div>`;
      });
      const rem=al.amount-al.totalOut;
      h+=`<div class="alloc-row total-row"><span class="ar-label">期間餘額</span><span class="ar-amount ${rem>=0?'pos':'neg'}">${fmt(rem)}</span></div></div>`;
    });
  }

  // Timeline
  h+=`<h4 style="font-size:0.85rem;margin-top:1.4rem;margin-bottom:0.5rem;color:var(--text-secondary)">月度現金流時間線</h4><div class="timeline">`;
  ev.forEach(e=>{
    const cls=e.amount>=0?'positive':(e.type==='payment'?'warning':'negative');
    h+=`<div class="timeline-item ${e.type}"><div class="tl-left"><span class="tl-day">${e.day}日</span><span class="tl-label">${e.label}</span></div><span class="tl-amount ${cls}">${e.amount>=0?'+':''}${fmt(e.amount)}</span></div>`;
  });
  h+=`</div><div class="cashflow-alert ${minC<0?'danger':'safe'}"><span class="cfa-icon">${minC<0?'⚠️':'✅'}</span><span class="cfa-text">現金最低點：第 ${minD} 日</span><span class="cfa-val">${fmt(Math.round(minC))}</span></div></section>`;

  // 3. Predictions
  if(proj.length>0&&tcb>0){
    h+=`<section class="report-section"><h3>📈 還款預測</h3>`;
    const m24=proj.find(p=>p.month===24);
    if(m24){const pct=Math.max(0,Math.min(100,Math.round((1-m24.endBal/tcb)*100)));
      h+=`<h4 style="font-size:0.85rem;margin-bottom:0.5rem;color:var(--text-secondary)">第 24 個月</h4>
      <div class="summary-bar"><div class="summary-item"><div class="label">預測餘額</div><div class="value ${m24.endBal<=tb?'green':'amber'}">${fmt(m24.endBal)}</div></div>
      <div class="summary-item"><div class="label">已償還</div><div class="value blue">${pct}%</div></div></div>
      <div class="progress-wrap"><div class="progress-label"><span>起始 ${fmt(tcb)}</span><span>目標 ${fmt(tb)}</span></div><div class="progress-bar"><div class="progress-fill ${pct>=60?'on-track':'behind'}" style="width:${pct}%"></div></div></div>`;}
    const pf=Math.max(0,Math.min(100,Math.round((1-fm.endBal/tcb)*100)));
    h+=`<h4 style="font-size:0.85rem;margin-top:1.2rem;margin-bottom:0.5rem;color:var(--text-secondary)">第 ${tm} 個月（目標月）</h4>
    <div class="summary-bar"><div class="summary-item"><div class="label">預測餘額</div><div class="value ${ot?'green':'red'}">${fmt(fm.endBal)}</div></div>
    <div class="summary-item"><div class="label">達標狀態</div><div class="value"><span class="badge ${ot?'success':'danger'}">${ot?'✓ 達標':'✗ 未達標'}</span></div></div></div>
    <div class="progress-wrap"><div class="progress-label"><span>起始 ${fmt(tcb)}</span><span>目標 ${fmt(tb)}</span></div><div class="progress-bar"><div class="progress-fill ${ot?'on-track':'behind'}" style="width:${pf}%"></div></div></div>`;
    if(fm.cumInt>0){const ip=rcc*tm>0?Math.round(fm.cumInt/(rcc*tm)*100):0;
      h+=`<div class="interest-stat"><div class="interest-stat-item"><div class="is-label">累計利息支出</div><div class="is-value">${fmt(fm.cumInt)}</div></div>
      <div class="interest-stat-item"><div class="is-label">利息佔總還款</div><div class="is-value">${ip}%</div></div></div>`;}
    h+=`</section>`;
  }

  // 4. Monthly table
  if(proj.length>0){
    h+=`<section class="report-section"><h3>📊 逐月預測表</h3><div class="projection-scroll"><table class="report-table"><thead><tr><th>月份</th><th class="num">月初餘額</th><th class="num">＋新增消費</th><th class="num">＋利息</th><th class="num">－還款</th><th class="num">月底餘額</th></tr></thead><tbody>`;
    proj.forEach(p=>{
      const hl=p.month===24?'background:rgba(56,132,244,0.08);':'';
      h+=`<tr style="${hl}"><td>${p.month}</td><td class="num">${fmt(p.startBal)}</td><td class="num" style="color:var(--accent-red)">+${fmt(p.spend)}</td><td class="num" style="color:var(--accent-amber)">+${fmt(p.interest)}</td><td class="num" style="color:var(--accent-green)">-${fmt(p.payment)}</td><td class="num" style="font-weight:600">${fmt(p.endBal)}</td></tr>`;
    });
    h+=`</tbody></table></div></section>`;
  }

  $('reportOutput').innerHTML=h;
  $('reportOutput').classList.remove('hidden');
  $('exportBar').classList.remove('hidden');
  $('reportOutput').scrollIntoView({behavior:'smooth',block:'start'});
}

// ── MD Export ──
$('exportMdBtn').addEventListener('click',()=>{
  if(!lastReportData)return;const d=lastReportData;
  let md=`# FINCALANCE 還款報告\n\n生成日期：${now.toLocaleDateString('zh-TW')}\n\n`;
  md+=`## 📋 基本概覽\n\n| 項目 | 金額 |\n|---|---:|\n`;
  md+=`| 每月總收入 | ${fmt(d.mi)} |\n| 信用卡總餘額 | ${fmt(d.tcb)} |\n| 每月固定支出 | ${fmt(d.tf)} |\n| 需月還信用卡 | ${fmt(d.rcc)} |\n| 月結餘可支配 | ${fmt(d.disp)} |\n| 每月新增刷卡消費 | ${fmt(d.ms)} |\n| 首月預估利息 | ${fmt(d.m1i)} |\n\n`;
  if(d.cp.length>0){
    md+=`## 📅 第 1 個月還款計畫\n\n| 卡片 | 起始餘額 | 繳款日 | 年利率 | 本月還款 |\n|---|---:|---:|---:|---:|\n`;
    d.cp.forEach(c=>{md+=`| ${c.name} | ${fmt(c.balance)} | ${c.payDay}日 | ${c.rate}% | ${fmt(c.payment)} |\n`;});md+=`\n`;
  }
  if(d.alloc.length>0){
    md+=`### 💵 收入分配明細\n\n`;
    d.alloc.forEach(al=>{
      md+=`**${al.day}日 ${al.name}：${fmt(al.amount)}**\n\n| 項目 | 日期 | 金額 |\n|---|---:|---:|\n`;
      al.items.forEach(it=>{md+=`| ${it.name} | ${it.day}日 | -${fmt(it.amount)} |\n`;});
      md+=`| **期間餘額** | | **${fmt(al.amount-al.totalOut)}** |\n\n`;
    });
  }
  md+=`### 現金最低點\n\n第 ${d.minD} 日：${fmt(Math.round(d.minC))}\n\n`;
  if(d.proj.length>0&&d.tcb>0){
    md+=`## 📈 還款預測\n\n| 月份 | 預測餘額 | 達標 |\n|---|---:|---:|\n`;
    const m24=d.proj.find(p=>p.month===24);if(m24)md+=`| 第 24 個月 | ${fmt(m24.endBal)} | ${m24.endBal<=d.tb?'✓':'✗'} |\n`;
    md+=`| 第 ${d.tm} 個月 | ${fmt(d.fm.endBal)} | ${d.ot?'✓ 達標':'✗ 未達標'} |\n\n`;
    if(d.fm.cumInt>0)md+=`累計利息支出：${fmt(d.fm.cumInt)}\n\n`;
  }
  if(d.proj.length>0){
    md+=`## 📊 逐月預測表\n\n| 月份 | 月初餘額 | ＋新增消費 | ＋利息 | －還款 | 月底餘額 |\n|---|---:|---:|---:|---:|---:|\n`;
    d.proj.forEach(p=>{md+=`| ${p.month} | ${fmt(p.startBal)} | +${fmt(p.spend)} | +${fmt(p.interest)} | -${fmt(p.payment)} | ${fmt(p.endBal)} |\n`;});
  }
  md+=`\n---\n*FINCALANCE © 2026 — 僅供數字分析參考，不構成財務建議*\n`;
  const blob=new Blob([md],{type:'text/markdown;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download=`FINCALANCE_報告_${now.toISOString().slice(0,10)}.md`;a.click();URL.revokeObjectURL(a.href);
});

// ── PDF Export ──
$('exportPdfBtn').addEventListener('click',()=>{
  const el=$('reportOutput');if(el.classList.contains('hidden'))return;
  html2pdf().set({margin:[10,10,10,10],filename:`FINCALANCE_報告_${now.toISOString().slice(0,10)}.pdf`,
    image:{type:'jpeg',quality:0.98},html2canvas:{scale:2,backgroundColor:'#0b0e14',useCORS:true},
    jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}}).from(el).save();
});

renderIncomes();renderCards();renderExpenses();
});
