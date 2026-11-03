// ============================================================
// APP - navigation, rendering, progress state (localStorage),
// quiz engine, lab console, dashboard charts, certificate.
// ============================================================

const LS_KEY = 'amap_progress_v1';

let state = loadState();

function loadState(){
  try{ return JSON.parse(localStorage.getItem(LS_KEY)) || defaultState(); }
  catch(e){ return defaultState(); }
}
function defaultState(){
  return { learner:{name:'',email:''}, modules:{}, quizzes:{}, labs:{}, checklist:{}, done:false, startedAt:null };
}
function save(){ localStorage.setItem(LS_KEY, JSON.stringify(state)); updateSidebarProgress(); }

function modState(id){ return state.modules[id] ||= { viewedLessons:[] }; }

// ---------- overall progress ----------
function overallPct(){
  const units = [];
  MODULES.forEach(m=>{
    m.lessons.forEach((_,i)=>units.push(modState(m.id).viewedLessons.includes(i)));
    if(m.quiz) units.push(!!state.quizzes[m.id]?.passed);
    if(m.lab && m.lab.tasks) units.push(!!state.labs[m.lab.id]?.passed);
    if(m.lab && m.lab.checklist) m.lab.checklist.forEach((_,i)=>units.push(!!state.checklist[`${m.id}-${i}`]));
  });
  return Math.round(100*units.filter(Boolean).length/units.length);
}
function gradeAvg(){
  const qs = Object.values(state.quizzes).filter(q=>q.best!=null);
  return qs.length ? Math.round(qs.reduce((a,q)=>a+q.best,0)/qs.length) : 0;
}

// ---------- routing ----------
const views = ['dashboard','course','lab','glossary','certificate'];
function go(view, arg){
  document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));
  document.getElementById('view-'+view).classList.remove('hidden');
  document.querySelectorAll('.navbtn').forEach(b=>b.classList.toggle('active', b.dataset.view===view));
  if(view==='dashboard') renderDashboard();
  if(view==='course') renderCourse(arg);
  if(view==='lab') renderLab(arg);
  if(view==='certificate') renderCertificate();
}

// ---------- sidebar ----------
function buildSidebar(){
  const nav = document.getElementById('modlist');
  nav.innerHTML = '';
  MODULES.forEach((m,idx)=>{
    const a = document.createElement('a');
    a.className='moditem'; a.href='#';
    a.innerHTML = `<span class="modnum">${idx+1}</span><span>${m.title}</span>`;
    a.onclick = e=>{e.preventDefault(); go('course', m.id);};
    nav.appendChild(a);
  });
}
function updateSidebarProgress(){
  document.getElementById('globalpct').textContent = overallPct()+'%';
  document.getElementById('globalbar').style.width = overallPct()+'%';
}

// ---------- dashboard ----------
function renderDashboard(){
  document.getElementById('d-name').textContent = state.learner.name ? ('Welcome back, '+state.learner.name) : 'Welcome — set your name in Certificate tab to personalize.';
  document.getElementById('d-pct').textContent = overallPct()+'%';
  document.getElementById('d-grade').textContent = gradeAvg()+'%';
  document.getElementById('d-hours').textContent = COURSE_META.hours+'h';
  const doneLabs = Object.values(state.labs).filter(l=>l.passed).length;
  document.getElementById('d-labs').textContent = doneLabs+'/7';

  // module completion bars
  const cont = document.getElementById('d-modules'); cont.innerHTML='';
  MODULES.forEach(m=>{
    const total = m.lessons.length + (m.quiz?1:0) + ((m.lab&&m.lab.tasks)?1:0) + ((m.lab&&m.lab.checklist)?m.lab.checklist.length:0);
    let done = modState(m.id).viewedLessons.length;
    if(m.quiz && state.quizzes[m.id]?.passed) done++;
    if(m.lab?.tasks && state.labs[m.lab.id]?.passed) done++;
    if(m.lab?.checklist) m.lab.checklist.forEach((_,i)=>{ if(state.checklist[`${m.id}-${i}`]) done++; });
    const pct = Math.round(100*done/total);
    cont.insertAdjacentHTML('beforeend',
      `<div class="rowcard"><div class="rc-left"><b>${m.title}</b><small>${m.minutes} min · ${m.summary}</small></div>
       <div class="rc-right"><div class="bar"><div style="width:${pct}%"></div></div><span>${pct}%</span>
       <button class="btn sm" onclick="go('course','${m.id}')">Open</button></div></div>`);
  });

  // charts: engagement curve + spend vs conversions demo
  MiniCharts.line(document.getElementById('chart-engagement'), [
    {name:'Email CTR %', points:[2.1,2.4,2.9,3.3,3.1,3.6,4.0,4.4,4.2,4.8]},
    {name:'Paid Social CTR %', points:[1.2,1.5,1.4,1.9,2.3,2.2,2.7,2.9,3.4,3.2]}
  ]);
  MiniCharts.bar(document.getElementById('chart-spend'),
    ['Wk1','Wk2','Wk3','Wk4','Wk5','Wk6','Wk7','Wk8'],
    [18.2,21.5,19.8,26.4,31.2,28.9,35.6,33.1], {color:'#58a6ff'});
}

// ---------- course view ----------
let currentModule=null;
function renderCourse(mid){
  currentModule = MODULES.find(m=>m.id===mid) || MODULES[0];
  const m = currentModule;
  document.getElementById('c-title').textContent = m.title;
  document.getElementById('c-meta').textContent = `~${m.minutes} min · ${m.lessons.length} lessons · ${m.quiz? m.quiz.length+'-question quiz':''}${m.lab?' · '+m.lab.title:''}`;
  const body = document.getElementById('c-body'); body.innerHTML='';

  m.lessons.forEach((l,i)=>{
    const viewed = modState(m.id).viewedLessons.includes(i);
    const card = document.createElement('div');
    card.className = 'lesson'+(viewed?' viewed':'');
    card.innerHTML = `<div class="lesson-head"><h3>${l.heading}</h3>
        <button class="btn sm ${viewed?'ghost':''}" data-i="${i}">${viewed?'✓ Completed':'Mark complete'}</button></div>
        <div class="lesson-body">${escapeHtml(l.body).replace(/\n/g,'<br>')}</div>`;
    card.querySelector('button').onclick = ()=>{
      const ms=modState(m.id);
      if(!ms.viewedLessons.includes(i)) ms.viewedLessons.push(i);
      else ms.viewedLessons = ms.viewedLessons.filter(x=>x!==i);
      save(); renderCourse(m.id);
    };
    body.appendChild(card);
  });

  if(m.quiz){ body.appendChild(buildQuiz(m)); }
  if(m.lab){
    if(m.lab.checklist){ body.appendChild(buildChecklist(m)); }
    else {
      const box=document.createElement('div'); box.className='labcta';
      const st = state.labs[m.lab.id];
      box.innerHTML = `<h3>${m.lab.title}</h3><p>${escapeHtml(m.lab.brief).replace(/\n/g,'<br>')}</p>
        <button class="btn primary" onclick="go('lab','${m.lab.id}')">Open Lab Console ${st?.passed?'(✓ passed)':''}</button>`;
      body.appendChild(box);
    }
  }
}

function buildQuiz(m){
  const el = document.createElement('div'); el.className='quiz';
  const prev = state.quizzes[m.id];
  el.innerHTML = `<h3>Knowledge Check</h3>`;
  m.quiz.forEach((q,qi)=>{
    el.insertAdjacentHTML('beforeend', `<div class="q"><p><b>Q${qi+1}.</b> ${escapeHtml(q.q)}</p>` +
      q.options.map((o,oi)=>`label class="opt"><input type="radio" name="q-${m.id}-${qi}" value="${oi}"> ${escapeHtml(o)}</label>`).join('').replace(/label /g,'<label ') + `</div>`);
  });
  el.insertAdjacentHTML('beforeend', `<button class="btn primary" id="submit-quiz">Submit answers</button>
     <span id="quiz-result">${prev?`Best score so far: ${prev.best}% ${prev.passed?'✓':''}`:''}</span>`);
  el.querySelector('#submit-quiz').onclick = ()=>{
    let correct=0;
    m.quiz.forEach((q,qi)=>{
      const sel = el.querySelector(`input[name="q-${m.id}-${qi}"]:checked`);
      if(sel && Number(sel.value)===q.answer) correct++;
    });
    const score = Math.round(100*correct/m.quiz.length);
    const passed = score>=75;
    const cur = state.quizzes[m.id] || {best:0,passed:false};
    state.quizzes[m.id] = { best: Math.max(cur.best,score), passed: cur.passed||passed };
    save();
    // color feedback
    el.querySelectorAll('.q').forEach((qel,qi)=>{
      qel.querySelectorAll('label').forEach((lab,oi)=>{
        lab.classList.remove('right','wrong');
        const inp = lab.querySelector('input');
        if(inp.checked){ lab.classList.add(oi===m.quiz[qi].answer?'right':'wrong'); }
        if(oi===m.quiz[qi].answer) lab.classList.add('answered-right');
      });
    });
    el.querySelector('#quiz-result').textContent = ` You scored ${score}% ${passed?'— PASS ✓':'— need 75%, retry!'}`;
    updateSidebarProgress();
  };
  return el;
}

function buildChecklist(m){
  const el=document.createElement('div'); el.className='checklist';
  el.innerHTML=`<h3>${m.lab.title}</h3>`;
  m.lab.checklist.forEach((c,i)=>{
    const key=`${m.id}-${i}`;
    el.insertAdjacentHTML('beforeend',
      `<label class="chk"><input type="checkbox" data-key="${key}" ${state.checklist[key]?'checked':''}> ${escapeHtml(c)}</label>`);
  });
  el.querySelectorAll('input').forEach(inp=>inp.onchange=e=>{
    state.checklist[e.target.dataset.key]=e.target.checked; save();
  });
  return el;
}

// ---------- lab console ----------
let currentLabId=null;
function renderLab(labId){
  currentLabId = labId || findLab(firstUnfinishedLab());
  const lab = findLab(currentLabId);
  if(!lab){ document.getElementById('lab-title').textContent='No lab selected'; return; }
  document.getElementById('lab-title').textContent = lab.title;
  document.getElementById('lab-brief').innerHTML = escapeHtml(lab.brief).replace(/\n/g,'<br>');
  const ta = document.getElementById('lab-code');
  if(ta.dataset.lab!==lab.id){ ta.value = lab.starter.replace(/\\n/g,'\n'); ta.dataset.lab=lab.id; }
  const out = document.getElementById('lab-output'); out.innerHTML='';
  lab.tasks.forEach(t=>out.insertAdjacentHTML('beforeend',`<li>${escapeHtml(t.prompt)}</li>`));
  renderLabTable(state.labs[lab.id]?.grade||null);
}
function firstUnfinishedLab(){
  for(const m of MODULES){ if(m.lab?.tasks && !state.labs[m.lab.id]?.passed) return m.lab.id; }
  return 'lab-m1';
}
function runLab(){
  const lab = findLab(currentLabId);
  const {result,error} = LabEngine.run(lab.id, document.getElementById('lab-code').value);
  const status = document.getElementById('lab-status');
  if(error){ status.textContent='⛔ Runtime error: '+error; status.className='status err'; return; }
  if(result==null){ status.textContent='⚠ Return an object with the required keys.'; status.className='status warn'; return; }
  const grade = LabEngine.grade(lab.id, result);
  const prev = state.labs[lab.id] || {best:0,passed:false};
  state.labs[lab.id] = { best: Math.max(prev.best, grade.score), passed: prev.passed||grade.passed, lastResult:result, grade };
  save();
  status.textContent = grade.passed ? '✅ All tasks correct — lab passed!' : `Partial: ${grade.score}% (${grade.rows.filter(r=>r.ok).length}/${grade.rows.length} tasks). Adjust and re-run.`;
  status.className = 'status '+(grade.passed?'ok':(grade.score>0?'warn':'err'));
  renderLabTable(grade);
  updateSidebarProgress();
}
function renderLabTable(grade){
  const t = document.getElementById('lab-table');
  if(!grade){ t.innerHTML='<tr><td colspan="4">Run your code to see grading.</td></tr>'; return; }
  t.innerHTML = '<tr><th>Task</th><th>Your answer</th><th>Expected</th><th>Status</th></tr>' +
    grade.rows.map(r=>`<tr><td>${r.key}</td><td>${r.got??'—'}</td><td>${r.expected}</td><td>${r.ok?'✅':'❌'}</td></tr>`).join('');
}
function showSolution(){
  const sols = {
    'lab-m1': `const r = rows();\nreturn {\n  completeness_pct: pct(x => x.user_id!=null && x.channel && x.revenue!=null),\n  dup_rate_pct: (()=>{const seen=new Set();let d=0;r.forEach(x=>{if(seen.has(x.event_id))d++;else seen.add(x.event_id)});return +(100*d/r.length).toFixed(1)})(),\n  bad_channel_pct: pct(x => !['email','paid_social','search','display','organic'].includes(x.channel)),\n  negative_rev: count(x => x.revenue < 0)\n};`,
    'lab-m2': `const os = orders().filter(o=>o.order_date<CUTOFF);\nconst by={};os.forEach(o=>{(by[o.user_id]||=[]).push(o)});\nconst us=Object.keys(by);let rs=0,ms=0;\nus.forEach(u=>{const last=by[u].reduce((m,o)=>o.order_date>m?o.order_date:m,'');rs+=(new Date(CUTOFF)-new Date(last))/86400000;ms+=Math.log1p(by[u].reduce((s,o)=>s+o.revenue,0))});\nreturn {users_used:us.length, avg_recency:+(rs/us.length).toFixed(1), avg_monetary:+(ms/us.length).toFixed(2)};`,
    'lab-m3': `const s=scored();const base=+(100*s.filter(r=>r.converted).length/s.length).toFixed(2);\nconst top=[...s].sort((a,b)=>b.prob-a.prob).slice(0,Math.floor(s.length*0.1));\nconst tr=+(100*top.filter(r=>r.converted).length/top.length).toFixed(2);\nreturn {base_rate:base, top_decile_rate:tr, lift:+(tr/base).toFixed(2), net_value:Math.round(top.filter(r=>r.converted).length*42-top.length*1.2)};`,
    'lab-m4': `const sp=spend();let acc=0;const ad=sp.map((v,i)=>{acc=i?v+0.5*acc:v;return acc;});\nconst sorted=[...sp].sort((a,b)=>a-b);const K=(sorted[5]+sorted[6])/2;\nconst sat=ad.map(a=>a*K/(a+K));\nreturn {adstock_total:+ad.reduce((x,y)=>x+y,0).toFixed(1), sat_mean:+(sat.reduce((x,y)=>x+y,0)/sat.length).toFixed(2), last_week_val:+sat[sat.length-1].toFixed(2)};`,
    'lab-m5': `const u=users();const c=u.map(x=>x.p_alive*x.e_freq*x.avg_margin*DISCOUNT_SUM);\nconst tot=c.reduce((a,b)=>a+b,0);const d=[...c].sort((a,b)=>b-a).slice(0,Math.floor(c.length*0.1));\nreturn {total_clv:Math.round(tot), top10_share_pct:+(100*d.reduce((a,b)=>a+b,0)/tot).toFixed(1), mean_p_alive:+(u.reduce((a,x)=>a+x.p_alive,0)/u.length).toFixed(3)};`,
    'lab-m6': `const e=eval_rows();const tp=e.reduce((a,r)=>a+r.tp,0),fp=e.reduce((a,r)=>a+r.fp,0),fn=e.reduce((a,r)=>a+r.fn,0);\nconst p=tp/(tp+fp),rc=tp/(tp+fn);\nreturn {precision:+p.toFixed(3), recall:+rc.toFixed(3), f1:+(2*p*rc/(p+rc)).toFixed(3)};`,
    'lab-m7': `const p1=0.05,p2=0.058,n=9000;const se=Math.sqrt((p1*(1-p1)+p2*(1-p2))/n);const z=(p2-p1)/se;return {se:+se.toFixed(4), zstat:+z.toFixed(2), p_value:+(2*(1-normCdf(z)).toFixed(4)), n_per_arm:Math.ceil(((1.96+0.84)**2*(p1*(1-p1)+p2*(1-p2)))/(0.008**2))};`
  };
  document.getElementById('lab-code').value = sols[currentLabId] || '// no solution available';
  document.getElementById('lab-status').textContent='Solution loaded — press Run & Grade to verify, then study how it works.';
  document.getElementById('lab-status').className='status warn';
}

// ---------- glossary ----------
const GLOSSARY = [
 ["Adstock","MMM transform modeling carryover effect of media spend across subsequent periods."],
 ["AUC-ROC","Probability a random positive ranks above a random negative; measures ranking, not calibration."],
 ["Brier score","Mean squared difference between predicted probability and actual outcome (lower is better)."],
 ["Calibration","Agreement between predicted probabilities and observed frequencies."],
 ["Cohort analysis","Grouping users by shared start period and tracking metrics over time."],
 ["Data-driven attribution","Credit assignment using counterfactual comparison of paths (often Shapley-based)."],
 ["Hill saturation","Curve modeling diminishing returns: response = a·Kᵞ/(aᵞ+Kᵞ)."],
 ["Incrementality","Causal lift measured via holdouts/experiments rather than correlation."],
 ["Lift","Ratio of response rate in targeted segment vs overall base rate."],
 ["MDE","Minimum detectable effect — smallest change an experiment can reliably detect."],
 ["Power","Probability a test detects an effect when one truly exists (target 80%)."],
 ["RFM","Recency, Frequency, Monetary customer value heuristic segmentation."],
 ["Switchback test","Time-randomized experiment used when units interfere (marketplaces)."],
 ["Target leakage","Feature construction that uses information from after the prediction moment."]
];
function renderGlossary(){
  const g=document.getElementById('glossary-list');
  g.innerHTML = GLOSSARY.map(([t,d])=>`<div class="term"><b>${t}</b><p>${d}</p></div>`).join('');
}

// ---------- certificate ----------
function bindLearner(){
  document.getElementById('in-name').oninput = e=>{state.learner.name=e.target.value;save();renderCertificate();};
  document.getElementById('in-email').oninput = e=>{state.learner.email=e.target.value;save();};
}
function renderCertificate(){
  const pct=overallPct(), gr=gradeAvg();
  const eligible = pct>=80 && gr>=COURSE_META.passingGrade;
  document.getElementById('cert-status').innerHTML =
    `Overall progress: <b>${pct}%</b> (need ≥80%) · Avg quiz grade: <b>${gr}%</b> (need ≥${COURSE_META.passingGrade}%)`;
  const cert = document.getElementById('cert-card');
  if(eligible){
    const name = state.learner.name || 'Anonymous Analyst';
    const date = new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
    const serial = 'AMAP-'+btoa(name+date).replace(/[^A-Z0-9]/gi,'').slice(0,10).toUpperCase();
    cert.style.display='block';
    cert.innerHTML = `<div class="cert-inner">
      <div class="cert-seal">◆</div>
      <h2>Certificate of Completion</h2>
      <p>This certifies that</p><h1>${escapeHtml(name)}</h1>
      <p>has successfully completed the offline intermediate program</p>
      <h3>${COURSE_META.title}</h3>
      <p>${COURSE_META.hours} hours · 8 modules · 7 graded labs · capstone sprint</p>
      <p class="cert-row"><span>Avg grade: ${gr}%</span><span>Issued: ${date}</span><span>Serial: ${serial}</span></p>
      <p class="sig">Analytics Forge Labs — AI Marketing Analytics Pro v${COURSE_META.version}</p>
      <button class="btn primary" onclick="window.print()">🖨 Print / Save as PDF</button></div>`;
    state.done = true; save();
  } else {
    cert.style.display='none';
  }
}

function escapeHtml(s){ return String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

// ---------- boot ----------
window.addEventListener('DOMContentLoaded', ()=>{
  buildSidebar();
  bindLearner();
  renderGlossary();
  updateSidebarProgress();
  go('dashboard');
});
