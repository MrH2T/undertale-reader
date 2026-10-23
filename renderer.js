// Generated from the local viewer; run scripts/build_reader.py to refresh.
(function(){
'use strict';
const params=new URLSearchParams();
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function applyBox(node,bbox,page){const [w,h]=page.reference_size;node.style.left=bbox[0]*w+'px';node.style.top=bbox[1]*h+'px';node.style.width=(bbox[2]-bbox[0])*w+'px';node.style.height=(bbox[3]-bbox[1])*h+'px';}
function inlineText(node,text,japaneseList=false,keepPhrases=[]){
  if(keepPhrases.length){
    let start=0;
    while(start<text.length){
      const matches=keepPhrases.map(phrase=>({phrase,index:text.indexOf(phrase,start)})).filter(m=>m.index>=0).sort((a,b)=>a.index-b.index);
      if(!matches.length){inlineText(node,text.slice(start));break;}
      const m=matches[0];inlineText(node,text.slice(start,m.index));
      const phrase=el('span','keep-together');inlineText(phrase,m.phrase);node.append(phrase);start=m.index+m.phrase.length;
    }
    return;
  }
  // Keep language runs inline: quoted phrases can wrap at words, punctuation
  // still participates in the browser's Chinese/Japanese line-break rules.
  const pattern=japaneseList?/^(?:びぼう|ビボウ|美貌|美ぼう|美ボウ|び貌|ビ貌)/g:/([\u3040-\u30ff]+(?:[ \u3000]+[\u3040-\u30ff]+)*|[A-Za-z0-9][A-Za-z0-9ōŌ’'\-]*)/g;let start=0;
  for(const match of text.matchAll(pattern)){
    node.append(document.createTextNode(text.slice(start,match.index)));
    const ja=japaneseList||/[\u3040-\u30ff]/.test(match[0]);
    const italic=!ja&&/^(Undertale|ikashita|kōgeki|bibō)$/.test(match[0]);
    const run=el(italic?'em':'span','',match[0]);run.lang=ja?'ja':'en';
    node.append(run);start=match.index+match[0].length;
  }
  node.append(document.createTextNode(text.slice(start)));
}
function spanSlice(spans,start,end){return spans.filter(s=>s.end>start&&s.start<end).map(s=>({...s,start:Math.max(0,s.start-start),end:Math.min(end-start,s.end-start)}));}
function formattedInline(node,text,spans,keep=[]){
  if(keep.length){let start=0;while(start<text.length){const m=keep.map(phrase=>({phrase,index:text.indexOf(phrase,start)})).filter(m=>m.index>=0).sort((a,b)=>a.index-b.index)[0];if(!m){formattedInline(node,text.slice(start),spanSlice(spans,start,text.length));break;}formattedInline(node,text.slice(start,m.index),spanSlice(spans,start,m.index));const holder=el('span','keep-together');formattedInline(holder,m.phrase,spanSlice(spans,m.index,m.index+m.phrase.length));node.append(holder);start=m.index+m.phrase.length;}return;}
  const tokens=BookComposition.tokenize(text,spans);
  tokens.forEach((token,i)=>{if(i&&BookComposition.boundary(tokens,i)&&!tokens[i-1].space&&!token.space&&!/[\r\n]/.test(tokens[i-1].text+token.text))node.append(el('wbr'));const run=el(token.italic?'em':'span','',token.text);if(token.lang!=='zh')run.lang=token.lang;node.append(run);});
}

function fillTranslation(node,b,page){
  node.classList.remove('composed');node.removeAttribute('role');node.removeAttribute('aria-label');node.replaceChildren();
  if(['paragraph','quote'].includes(b.kind)&&(!b.layout.text_align||b.layout.text_align==='justify')&&params.get('composition')!=='native'&&BookComposition.render(node,b.translation.text,{fontSize:b.layout.font_size,weight:b.layout.font_weight||400,width:(b.layout.bbox[2]-b.layout.bbox[0])*page.reference_size[0],spans:b.translation.spans}))return;
  if(b.kind==='list'){let offset=0;const rows=b.translation.text.split('\n'),leftCount=Math.ceil(rows.length/2);rows.forEach((line,i)=>{const item=el('div');item.style.gridColumn=String(i<leftCount?1:2);item.style.gridRow=String(i<leftCount?i+1:i-leftCount+1);if(b.translation.spans!==undefined){const spans=spanSlice(b.translation.spans,offset,offset+line.length),prefix=line.match(/^(?:びぼう|ビボウ|美貌|美ぼう|美ボウ|び貌|ビ貌)/)?.[0];if(prefix&&!spans.some(s=>s.start<prefix.length))spans.unshift({start:0,end:prefix.length,lang:'ja'});formattedInline(item,line,spans);}else inlineText(item,line,true);offset+=line.length+1;node.append(item);});}
  else if(b.translation.spans!==undefined){const text=b.translation.text,after=b.layout.break_after,index=after?text.indexOf(after):-1;if(index>=0){const end=index+after.length;formattedInline(node,text.slice(0,end),spanSlice(b.translation.spans,0,end));node.append(el('br'));formattedInline(node,text.slice(end),spanSlice(b.translation.spans,end,text.length));}else formattedInline(node,text,b.translation.spans,b.layout.keep_phrases||[]);node.setAttribute('role','group');node.setAttribute('aria-label',b.translation.text);for(const child of node.children)child.setAttribute('aria-hidden','true');}
  else{const text=b.translation.text,after=b.layout.break_after,index=after?text.indexOf(after):-1;if(index>=0){const end=index+after.length;inlineText(node,text.slice(0,end));node.append(el('br'));inlineText(node,text.slice(end));}else inlineText(node,text,false,b.layout.keep_phrases||[]);}
}
function makeTranslation(b,page){
  const box=el('div','translation-box '+b.kind+(b.layout.style==='chapter-heading'?' chapter-heading':''));box.dataset.block=b.id;applyBox(box,b.layout.bbox,page);box.style.fontSize=b.layout.font_size+'px';box.style.lineHeight=b.layout.line_height;box.style.fontWeight=b.layout.font_weight||(['heading','subheading'].includes(b.kind)?700:400);if(b.layout.column_gap)box.style.columnGap=b.layout.column_gap+'px';if(b.layout.text_align)box.style.textAlign=b.layout.text_align;if(b.layout.color)box.style.color=b.layout.color;fillTranslation(box,b,page);return box;
}

function arrangeBoxes(host,page){
  const nodes=new Map(Array.from(host.children).filter(n=>n.dataset.block).map(n=>[n.dataset.block,n])),blocks=new Map(page.blocks.map(b=>[b.id,b])),done=new Set(),pending=new Set();
  for(const [id,node]of nodes){const height=node.style.height;node.style.height='auto';node.dataset.naturalHeight=parseFloat(getComputedStyle(node).height)||0;node.style.height=blocks.get(id).layout.auto_height?'auto':height;}
  function place(id){if(done.has(id))return;if(pending.has(id))throw Error('段落接排形成循环');pending.add(id);const b=blocks.get(id),node=nodes.get(id);if(b.layout.flow_after&&nodes.has(b.layout.flow_after)){place(b.layout.flow_after);const prev=nodes.get(b.layout.flow_after);node.style.top=(parseFloat(prev.style.top)+Number(prev.dataset.naturalHeight)+(b.layout.gap_before??12))+'px';}
    const bottom=parseFloat(node.style.top)+parseFloat(getComputedStyle(node).height);node.dataset.limitOverflow=b.layout.auto_height&&bottom>(b.layout.limit_bottom??b.layout.bbox[3])*page.reference_size[1]+1?'true':'false';pending.delete(id);done.add(id);}
  for(const id of nodes.keys())place(id);
}
function renderedBox(node,page){const [w,h]=page.reference_size,x=parseFloat(node.style.left),y=parseFloat(node.style.top);return [x/w,y/h,(x+parseFloat(node.style.width))/w,(y+parseFloat(getComputedStyle(node).height))/h];}
function renderQuoteMarks(host,page){
  const [w,h]=page.reference_size;
  for(const b of page.blocks){
    const mark=b.source.quote_mark;if(!mark)continue;
    const box=host.querySelector('[data-block="'+b.id+'"]');if(!box)continue;
    const [x0,y0,x1,y1]=mark.bbox,icon=el('div','quote-mark');
    icon.setAttribute('aria-hidden','true');icon.dataset.quoteFor=b.id;
    Object.assign(icon.style,{position:'absolute',pointerEvents:'none',left:(parseFloat(box.style.left)+mark.offset[0])+'px',top:(parseFloat(box.style.top)+mark.offset[1])+'px',width:((x1-x0)*w)+'px',height:((y1-y0)*h)+'px',backgroundImage:'url("'+page.image_url+'")',backgroundRepeat:'no-repeat',backgroundSize:w+'px '+h+'px',backgroundPosition:(-x0*w)+'px '+(-y0*h)+'px'});
    host.append(icon);
  }
}

function render(page,{mode,masks,overlay,onSelect}){
  masks.replaceChildren();overlay.replaceChildren();
  for(const [i,b] of page.blocks.entries()){
    if(mode==='source'){
      const hit=el('button','source-hit');hit.id='source-'+b.id;hit.dataset.block=b.id;
      applyBox(hit,b.source.bbox,page);hit.setAttribute('aria-label','第 '+(i+1)+' 段：'+b.source.text.slice(0,60));hit.addEventListener('click',()=>onSelect(b.id));overlay.append(hit);continue;
    }
    const mask=el('div','source-mask');applyBox(mask,b.source.mask_bbox||b.source.bbox,page);mask.style.background=b.layout.mask_color||'#fff';masks.append(mask);
    if(b.source.quote_mark){const iconMask=el('div','source-mask');applyBox(iconMask,b.source.quote_mark.bbox,page);iconMask.style.background=b.layout.mask_color||'#fff';masks.append(iconMask);}
    const box=makeTranslation(b,page);box.id='translation-'+b.id;box.tabIndex=0;
    box.addEventListener('click',()=>{if(!getSelection()?.toString())onSelect(b.id);});
    box.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();onSelect(b.id);}});overlay.append(box);
  }
  if(mode==='source')return;
  if(page.erase_regions?.length||page.vector_shapes?.length){
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),[w,h]=page.reference_size;
    svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.setAttribute('width',w);svg.setAttribute('height',h);svg.style.cssText='position:absolute;inset:0;pointer-events:none';
    for(const s of [...(page.erase_regions||[]),...(page.vector_shapes||[])]){
      if(!['rect','line'].includes(s.type))continue;
      const shape=document.createElementNS(ns,s.type);
      if(s.type==='rect'){const [x0,y0,x1,y1]=s.bbox;for(const [k,v] of Object.entries({x:x0,y:y0,width:x1-x0,height:y1-y0,fill:s.fill||'#fff'}))shape.setAttribute(k,v);}
      else{const [[x1,y1],[x2,y2]]=s.points;for(const [k,v] of Object.entries({x1,y1,x2,y2,stroke:s.stroke||'#555','stroke-width':s.stroke_width||1}))shape.setAttribute(k,v);}
      svg.append(shape);
    }
    masks.append(svg);
  }
  arrangeBoxes(overlay,page);renderQuoteMarks(overlay,page);
}
window.BookRenderer={render,formattedInline};
})();
