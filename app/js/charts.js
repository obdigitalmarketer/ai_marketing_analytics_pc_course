// ============================================================
// OFFLINE CHARTS - pure SVG mini charting (no CDN dependency).
// Supports: line, bar, scatter with axes + tooltips-ish labels.
// Used by Dashboard & lesson visualizations.
// ============================================================

const MiniCharts = {
  palette: ['#58a6ff','#3fb950','#d29922','#f778ba','#8b5cf6','#f85149'],

  line(el, series, opts={}){
    // series: [{name, color?, points:[y,...]}] x = index or opts.xs
    const W = el.clientWidth || 640, H = opts.h || 240, P = 34;
    const all = series.flatMap(s=>s.points);
    const minY = opts.minY ?? Math.min(...all), maxY = opts.maxY ?? Math.max(...all);
    const xs = opts.xs || null;
    const nMax = Math.max(...series.map(s=>s.points.length));
    const X = i => P + (W-2*P) * (nMax===1?0.5:i/(nMax-1));
    const Y = v => H-P - (H-2*P) * ((v-minY)/((maxY-minY)||1));
    let svg = `<svg width="${W}" height="${H}" class="mc">`;
    svg += this._axes(W,H,P,minY,maxY,nMax,xs);
    series.forEach((s,si)=>{
      const c = s.color || this.palette[si%this.palette.length];
      const d = s.points.map((v,i)=>`${i?'L':'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
      svg += `<path d="${d}" fill="none" stroke="${c}" stroke-width="2"/>`;
      s.points.forEach((v,i)=>{ svg+=`<circle cx="${X(i)}" cy="${Y(v)}" r="3" fill="${c}"><title>${s.name}: ${v}</title></circle>`; });
    });
    svg += this._legend(series, W);
    svg += '</svg>'; el.innerHTML = svg;
  },

  bar(el, labels, values, opts={}){
    const W = el.clientWidth||640, H = opts.h||240, P=34;
    const maxV = Math.max(...values, 0.0001);
    const bw = (W-2*P)/values.length*0.7;
    let svg = `<svg width="${W}" height="${H}" class="mc">`;
    svg += this._gridLines(W,H,P,maxV);
    values.forEach((v,i)=>{
      const x = P + (W-2*P)*(i+0.5)/values.length - bw/2;
      const h = (H-2*P)*v/maxV;
      const c = opts.color || this.palette[i%this.palette.length];
      svg += `<rect x="${x}" y="${H-P-h}" width="${bw}" height="${h}" rx="3" fill="${c}"><title>${labels[i]}: ${v}</title></rect>`;
      if(labels.length<=14) svg += `<text x="${x+bw/2}" y="${H-P+14}" class="lbl" text-anchor="middle">${labels[i]}</text>`;
    });
    svg += '</svg>'; el.innerHTML = svg;
  },

  scatter(el, pts, opts={}){
    // pts: [{x,y,label,color}]
    const W=el.clientWidth||640,H=opts.h||260,P=34;
    const xs=pts.map(p=>p.x), ys=pts.map(p=>p.y);
    const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
    const X=v=>P+(W-2*P)*(v-minX)/((maxX-minX)||1);
    const Y=v=>H-P-(H-2*P)*(v-minY)/((maxY-minY)||1);
    let svg=`<svg width="${W}" height="${H}" class="mc">`;
    svg+=this._axes(W,H,P,minY,maxY,pts.length,{label:'x'});
    pts.forEach(p=>{ svg+=`<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="4" fill="${p.color||'#58a6ff'}" opacity=".8"><title>${p.label||''} (${p.x}, ${p.y})</title></circle>`; });
    svg+='</svg>'; el.innerHTML=svg;
  },

  _axes(W,H,P,minY,maxY,n){
    let s=this._gridLines(W,H,P,maxY);
    for(let i=0;i<n;i++){ if(n<=8||i%(Math.ceil(n/8))===0){ const x=P+(W-2*P)*(n===1?0.5:i/(n-1));
      s+=`<line x1="${x}" y1="${H-P}" x2="${x}" y2="${H-P+4}" stroke="#30363d"/>`; } }
    return s;
  },
  _gridLines(W,H,P,maxV){
    let s='';
    for(let g=0;g<=4;g++){ const y=H-P-(H-2*P)*g/4; const v=(maxV*g/4).toFixed(maxV<10?1:0);
      s+=`<line x1="${P}" y1="${y}" x2="${W-P}" y2="${y}" stroke="#21262d"/><text x="${P-6}" y="${y+3}" class="lbl" text-anchor="end">${v}</text>`; }
    s+=`<line x1="${P}" y1="${H-P}" x2="${W-P}" y2="${H-P}" stroke="#30363d"/>`;
    return s;
  },
  _legend(series,W){
    let x=W-120,s='';
    series.slice(0,4).forEach((se,i)=>{ const c=se.color||this.palette[i%6];
      s+=`<rect x="${x}" y="${8+i*16}" width="10" height="10" fill="${c}"/><text x="${x+14}" y="${17+i*16}" class="lbl">${se.name}</text>`;});
    return s;
  }
};
