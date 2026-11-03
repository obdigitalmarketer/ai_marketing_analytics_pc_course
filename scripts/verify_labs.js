// scripts/verify_labs.js - integrity check for grader vs datasets.
// Usage: node scripts/verify_labs.js
const fs = require('fs');
const path = require('path');

const dsSrc   = fs.readFileSync(path.join(__dirname,'../data/datasets.js'),'utf8');
const course  = fs.readFileSync(path.join(__dirname,'../app/js/courseData.js'),'utf8');
const engine  = fs.readFileSync(path.join(__dirname,'../app/js/labEngine.js'),'utf8');

// Load the three browser scripts (they use top-level const, which eval scoping
// would hide between calls) by concatenating into one script that attaches
// everything we need to globalThis.
const bridge = `
globalThis.DATA = DATA; globalThis.LAB_ANSWERS = LAB_ANSWERS;
globalThis.MODULES = MODULES; globalThis.COURSE_META = COURSE_META;
globalThis.LabEngine = LabEngine;
`;
new Function(dsSrc + '\n' + course + '\n' + engine + '\n' + bridge)();

const solutions = {
 'lab-m1': `const r=rows();return{completeness_pct:pct(x=>x.user_id!=null&&x.channel&&x.revenue!=null),dup_rate_pct:(()=>{const seen=new Set();let d=0;r.forEach(x=>{if(seen.has(x.event_id))d++;else seen.add(x.event_id)});return +(100*d/r.length).toFixed(1)})(),bad_channel_pct:pct(x=>!['email','paid_social','search','display','organic'].includes(x.channel)),negative_rev:count(x=>x.revenue<0)};`,
 'lab-m2': `const os=orders().filter(o=>o.order_date<CUTOFF);const by={};os.forEach(o=>{(by[o.user_id]||=[]).push(o)});const us=Object.keys(by);let rs=0,ms=0;us.forEach(u=>{const last=by[u].reduce((m,o)=>o.order_date>m?o.order_date:m,'');rs+=(new Date(CUTOFF)-new Date(last))/86400000;ms+=Math.log1p(by[u].reduce((s,o)=>s+o.revenue,0))});return{users_used:us.length,avg_recency:+(rs/us.length).toFixed(1),avg_monetary:+(ms/us.length).toFixed(2)};`,
 'lab-m3': `const s=scored();const base=+(100*s.filter(r=>r.converted).length/s.length).toFixed(2);const top=[...s].sort((a,b)=>b.prob-a.prob).slice(0,Math.floor(s.length*0.1));const tr=+(100*top.filter(r=>r.converted).length/top.length).toFixed(2);return{base_rate:base,top_decile_rate:tr,lift:+(tr/base).toFixed(2),net_value:Math.round(top.filter(r=>r.converted).length*42-top.length*1.2)};`,
 'lab-m4': `const sp=spend();let acc=0;const ad=sp.map((v,i)=>{acc=i?v+0.5*acc:v;return acc;});const sorted=[...sp].sort((a,b)=>a-b);const K=(sorted[5]+sorted[6])/2;const sat=ad.map(a=>a*K/(a+K));return{adstock_total:+ad.reduce((x,y)=>x+y,0).toFixed(1),sat_mean:+(sat.reduce((x,y)=>x+y,0)/sat.length).toFixed(2),last_week_val:+sat[sat.length-1].toFixed(2)};`,
 'lab-m5': `const u=users();const c=u.map(x=>x.p_alive*x.e_freq*x.avg_margin*DISCOUNT_SUM);const tot=c.reduce((a,b)=>a+b,0);const d=[...c].sort((a,b)=>b-a).slice(0,Math.floor(c.length*0.1));return{total_clv:Math.round(tot),top10_share_pct:+(100*d.reduce((a,b)=>a+b,0)/tot).toFixed(1),mean_p_alive:+(u.reduce((a,x)=>a+x.p_alive,0)/u.length).toFixed(3)};`,
 'lab-m6': `const e=eval_rows();const tp=e.reduce((a,r)=>a+r.tp,0),fp=e.reduce((a,r)=>a+r.fp,0),fn=e.reduce((a,r)=>a+r.fn,0);const p=tp/(tp+fp),rc=tp/(tp+fn);return{precision:+p.toFixed(3),recall:+rc.toFixed(3),f1:+(2*p*rc/(p+rc)).toFixed(3)};`,
 'lab-m7': `const p1=0.05,p2=0.058,n=9000;const se=Math.sqrt((p1*(1-p1)+p2*(1-p2))/n);const z=(p2-p1)/se;return{se:+se.toFixed(4),zstat:+z.toFixed(2),p_value:+(2*(1-normCdf(z)).toFixed(4)),n_per_arm:Math.ceil(((1.96+0.84)**2*(p1*(1-p1)+p2*(1-p2)))/(0.008**2))};`
};

let allPass = true;
for (const [labId, code] of Object.entries(solutions)) {
  const { result, error } = LabEngine.run(labId, code);
  if (error) { console.log(`FAIL ${labId}: runtime error ${error}`); allPass=false; continue; }
  const grade = globalThis.LabEngine.grade(labId, result);
  const bad = grade.rows.filter(r=>!r.ok);
  if (grade.passed) console.log(`PASS ${labId} (${grade.rows.length}/${grade.rows.length}) ->`, JSON.stringify(result));
  else { allPass=false; console.log(`FAIL ${labId}:`, JSON.stringify(bad), 'got', JSON.stringify(result)); }
}
process.exit(allPass ? 0 : 1);
