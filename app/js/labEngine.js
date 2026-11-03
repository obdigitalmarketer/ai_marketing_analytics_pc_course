// ============================================================
// LAB ENGINE - runs student JS in a sandboxed Function with
// dataset helpers, grades returned object against LAB_ANSWERS.
// ============================================================

const LabEngine = {
  // Build helper closures per lab id
  helpersFor(labId){
    const H = {};
    if(labId==='lab-m1'){
      H.rows = () => DATA.EVENTS;
      H.count = f => DATA.EVENTS.filter(f).length;
      H.pct = f => +(100*DATA.EVENTS.filter(f).length/DATA.EVENTS.length).toFixed(1);
    }
    if(labId==='lab-m2'){ H.orders = () => DATA.ORDERS; H.CUTOFF='2025-06-30'; }
    if(labId==='lab-m3'){ H.scored = () => DATA.SCORED; }
    if(labId==='lab-m4'){ H.spend = () => DATA.SPEND; }
    if(labId==='lab-m5'){ H.users = () => DATA.USERS; H.DISCOUNT_SUM = 8.2; }
    if(labId==='lab-m6'){ H.eval_rows = () => DATA.EVAL; }
    if(labId==='lab-m7'){
      H.normCdf = x => 0.5*(1+LabEngine._erf(x/Math.SQRT2));
    }
    return H;
  },

  // Numerical Recipes erf approximation (shared by grader + student helper)
  _erf(x){ const s=x<0?-1:1; x=Math.abs(x); const t=1/(1+0.3275911*x);
    const y=1-((((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x)); return s*y; },

  run(labId, code){
    const helpers = this.helpersFor(labId);
    const keys = Object.keys(helpers);
    const vals = keys.map(k=>helpers[k]);
    let result, error=null;
    try{
      // Sandbox-ish: no window/document/require exposure beyond globals we pass
      const fn = new Function(...keys, `"use strict";\n${code}`);
      result = fn(...vals);
    }catch(e){ error = e.message; }
    return { result, error };
  },

  grade(labId, result){
    const answers = LAB_ANSWERS[labId];
    if(!answers || typeof result!=='object' || result===null) return null;
    const tasks = findLab(labId)?.tasks || [];
    const rows = [];
    let pass=0;
    for(const t of tasks){
      const exp = answers[t.key];
      const got = Number(result[t.key]);
      const ok = Number.isFinite(got) && Math.abs(got-exp) <= (t.tol ?? 0.051);
      if(ok) pass++;
      rows.push({ key:t.key, expected:exp, got:Number.isFinite(got)?got:null, ok });
    }
    return { rows, score: Math.round(100*pass/tasks.length), passed: pass===tasks.length };
  }
};

function findLab(labId){
  for(const m of MODULES){ if(m.lab && m.lab.id===labId) return m.lab; }
  return null;
}
