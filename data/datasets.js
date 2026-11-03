// ============================================================
// BUNDLED DATASETS (deterministic, seeded) - generated to match
// scripts/generateDatasets.js expected-answer keys.
// Loaded by the Lab Engine as global DATA.
// ============================================================

// Mulberry32 PRNG for reproducibility
function _mulberry32(seed){return function(){let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}

const DATA = (() => {
  const rnd = _mulberry32(20261103);
  const pick = a => a[Math.floor(rnd()*a.length)];
  const ri = (lo,hi)=>lo+Math.floor(rnd()*(hi-lo+1));

  // ---- EVENTS (Module 1 lab) ----
  const CHANNELS = ['email','paid_social','search','display','organic'];
  const BADCH = ['sms','affiliate','influencer'];
  const EVENTS = [];
  for (let i=0;i<6000;i++){
    const dup = rnd()<0.021;                       // ~2.1% duplicate event_ids
    const ev = dup ? EVENTS[ri(0,EVENTS.length-1)] : null;
    let row;
    if (dup && ev){ row = {...ev}; }
    else{
      const badCh = rnd()<0.048;                  // ~4.8% invalid channel
      row = {
        event_id: 'EVT'+String(i).padStart(5,'0'),
        user_id: rnd()<0.06 ? null : 'U'+ri(1,3200),
        channel: badCh ? pick(BADCH) : pick(CHANNELS),
        event: pick(['view','click','add_to_cart','purchase','purchase','view']),
        ts: '2025-'+String(ri(1,6)).padStart(2,'0')+'-'+String(ri(1,28)).padStart(2,'0'),
        revenue: rnd()<0.012 ? -ri(1,40) : (rnd()<0.35 ? +(rnd()*180).toFixed(2) : 0)
      };
    }
    EVENTS.push(row);
  }

  // ---- ORDERS (Module 2 lab) ----
  const ORDERS = [];
  for(let i=0;i<4000;i++){
    const m = ri(1,12), d = ri(1,28);
    ORDERS.push({ user_id:'U'+ri(1,1500), order_date:`2025-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`, revenue:+(15+rnd()*240).toFixed(2)});
  }

  // ---- SCORED (Module 3 lab) ----
  const SCORED = [];
  for(let i=0;i<5000;i++){
    const prob = +rnd().toFixed(4);
    const converted = rnd() < (0.02 + prob*0.28) ? 1 : 0;   // model has real signal
    SCORED.push({ user_id:'U'+i, prob, converted, cost:1.2 });
  }

  // ---- SPEND series (Module 4 lab) ----
  const SPEND = [12.5,14.2,11.8,16.4,18.1,15.3,20.7,22.4,19.8,24.6,26.1,23.9];

  // ---- USERS CLV table (Module 5 lab) ----
  const USERS = [];
  for(let i=0;i<2200;i++){
    USERS.push({
      user_id:'U'+i,
      p_alive:+(0.15+rnd()*0.8).toFixed(3),
      e_freq:+(0.4+rnd()*5.2).toFixed(2),
      avg_margin:+(8+rnd()*44).toFixed(2)
    });
  }

  // ---- EVAL rows (Module 6 lab) ----
  const EVALROWS = [];
  for(let i=0;i<300;i++){
    const tp = ri(0,4), fp = rnd()<0.3?ri(1,2):0, fn = rnd()<0.35?ri(1,2):0;
    EVALROWS.push({tp,fp,fn});
  }

  return { EVENTS, ORDERS, SCORED, SPEND, USERS, EVAL: EVALROWS, CHANNELS_VALID: CHANNELS };
})();

// Expected answers computed deterministically from the bundled DATA
const LAB_ANSWERS = (() => {
  const E = DATA.EVENTS, N = E.length;
  const completeness_pct = +(100*E.filter(r=>r.user_id!=null&&r.channel&&r.revenue!=null).length/N).toFixed(1);
  const seen=new Set(); let dups=0; for(const r of E){ if(seen.has(r.event_id)) dups++; else seen.add(r.event_id);}
  const dup_rate_pct = +(100*dups/N).toFixed(1);
  const bad_channel_pct = +(100*E.filter(r=>!DATA.CHANNELS_VALID.includes(r.channel)).length/N).toFixed(1);
  const negative_rev = E.filter(r=>r.revenue<0).length;

  const CUTOFF='2025-06-30';
  const byUser={};
  for(const o of DATA.ORDERS){ if(o.order_date<CUTOFF){ (byUser[o.user_id] ||= []).push(o); } }
  const users_used = Object.keys(byUser).length;
  let recSum=0, monSum=0;
  for(const u in byUser){
    const last = byUser[u].reduce((m,o)=>o.order_date>m?o.order_date:m,'');
    recSum += Math.round((new Date(CUTOFF)-new Date(last))/86400000);
    monSum += Math.log1p(byUser[u].reduce((s,o)=>s+o.revenue,0));
  }
  const avg_recency = +(recSum/users_used).toFixed(1);
  const avg_monetary = +(monSum/users_used).toFixed(2);

  const S=[...DATA.SCORED].sort((a,b)=>b.prob-a.prob);
  const base_rate = +(100*DATA.SCORED.filter(r=>r.converted).length/DATA.SCORED.length).toFixed(2);
  const decile = S.slice(0, Math.floor(S.length*0.1));
  const top_decile_rate = +(100*decile.filter(r=>r.converted).length/decile.length).toFixed(2);
  const lift = +(top_decile_rate/base_rate).toFixed(2);
  const net_value = Math.round(decile.filter(r=>r.converted).length*42 - decile.length*1.2);

  const sp = DATA.SPEND, alpha=0.5; const ad=[]; let acc=0;
  sp.forEach((v,i)=>{ acc = i===0 ? v : v + alpha*acc; ad.push(acc); });
  const adstock_total = +ad.reduce((a,b)=>a+b,0).toFixed(1);
  const sorted=[...sp].sort((a,b)=>a-b); const K=(sorted[5]+sorted[6])/2;
  const sat = ad.map(a=>a*K/(a+K));
  const sat_mean = +(sat.reduce((a,b)=>a+b,0)/sat.length).toFixed(2);
  const last_week_val = +sat[sat.length-1].toFixed(2);

  const U=DATA.USERS, DS=8.2;
  const clv = U.map(u=>u.p_alive*u.e_freq*u.avg_margin*DS);
  const total_clv = Math.round(clv.reduce((a,b)=>a+b,0));
  const desc=[...clv].sort((a,b)=>b-a);
  const topN=desc.slice(0,Math.floor(desc.length*0.1));
  const top10_share_pct = +(100*topN.reduce((a,b)=>a+b,0)/clv.reduce((a,b)=>a+b,0)).toFixed(1);
  const mean_p_alive = +(U.reduce((a,u)=>a+u.p_alive,0)/U.length).toFixed(3);

  const EV=DATA.EVAL;
  const tp=EV.reduce((a,r)=>a+r.tp,0), fp=EV.reduce((a,r)=>a+r.fp,0), fn=EV.reduce((a,r)=>a+r.fn,0);
  const precision=+(tp/(tp+fp)).toFixed(3), recall=+(tp/(tp+fn)).toFixed(3);
  const f1=+((2*precision*recall)/(precision+recall)).toFixed(3);

  // Lab 7: difference-of-proportions email test
  const p1=0.05, p2=0.058, n=9000, za=1.96, zb=0.84, mde=0.008;
  const se = Math.sqrt((p1*(1-p1)+p2*(1-p2))/n);
  const zstat = +(((p2-p1)/se)).toFixed(2);
  const erf = x => { const s=x<0?-1:1; x=Math.abs(x); const t=1/(1+0.3275911*x);
    const y=1-((((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x)); return s*y; };
  const normCdf = x => 0.5*(1+erf(x/Math.SQRT2));
  const p_value = +(2*(1-normCdf((p2-p1)/se))).toFixed(4); // uses same erf approx as helper
  const n_per_arm = Math.ceil(((za+zb)**2*(p1*(1-p1)+p2*(1-p2)))/(mde*mde));

  return {
    'lab-m1': {completeness_pct,dup_rate_pct,bad_channel_pct,negative_rev},
    'lab-m2': {users_used,avg_recency,avg_monetary},
    'lab-m3': {base_rate,top_decile_rate,lift,net_value},
    'lab-m4': {adstock_total,sat_mean,last_week_val},
    'lab-m5': {total_clv,top10_share_pct,mean_p_alive},
    'lab-m6': {precision,recall,f1},
    'lab-m7': {se:+se.toFixed(4),zstat,p_value,n_per_arm}
  };
})();
