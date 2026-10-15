/* Sequential, cancellable story reading. Personal inputs are never queued. */
let readingVersion=0;
let readingTimer=null;
let readingWake=null;
let activeReading=null;
function stopReading(){readingVersion++;if(readingTimer!==null)clearTimeout(readingTimer);readingTimer=null;if(readingWake){readingWake(false);readingWake=null;}activeReading=null;}
function readingDelay(ms,token){return new Promise(resolve=>{if(token!==readingVersion){resolve(false);return;}readingWake=resolve;readingTimer=setTimeout(()=>{readingTimer=null;readingWake=null;resolve(token===readingVersion);},ms);});}
function speechLine(text,{speaker='',sequence=true,effect='',cls=''}={}){
 const actor=speaker||((text.match(/^(林小禾|小禾|你|同学|老师)[：:]/)||[])[1]||'旁白');
 const content=speaker?text:text.replace(/^(林小禾|小禾|你|同学|老师)[：:]\s*/, '');
 return `<div class="dialogue-line chat-line ${cls}" data-speaker="${escapeText(actor==='林小禾'?'小禾':actor)}" ${sequence?'data-sequence="line" hidden':''} ${effect?`data-effect="${effect}"`:''}>${actor!=='旁白'?`<span class="speech-name">${escapeText(actor)}</span>`:''}<span class="sr-only">${escapeText(content)}</span><span class="typed-line speech-text" aria-hidden="true" data-full="${escapeText(content)}">${sequence?'':escapeText(content)}</span></div>`;
}
function storySpeech(lines,{sequence=true}={}){return lines.map((text,i)=>speechLine(text,{sequence,effect:text.includes('撤回了一条消息')?'withdraw':''})).join('');}
function stageReveal(html,cls='',order=null){return `<div class="after-reading ${cls}" data-sequence="reveal" ${order===null?'':`data-read-order="${Number(order)}"`} hidden>${html}</div>`;}
function applyReadingEffect(node){if(node.dataset.effect==='withdraw'){const first=node.parentElement.querySelector('.chat-line[data-speaker="小禾"]');if(first)first.classList.add('withdrawn');}}
function showReadingNode(node){node.hidden=false;applyReadingEffect(node);}
function finishReading(){
 if(!activeReading)return;
 const current=activeReading;stopReading();
 if(!current.root.isConnected)return;
 for(const node of current.nodes){showReadingNode(node);node.classList.remove('speaking');if(node.dataset.sequence==='line'){const target=node.querySelector('.speech-text');if(target)target.textContent=target.dataset.full||'';}}
 state.readDone[current.key]=true;
 const control=byId('reading-complete');if(control)control.hidden=true;
 const status=byId('reading-status');if(status)status.textContent='这一段说完了，接下来由你决定。';
}
function startReading(root,key){
 stopReading();const nodes=[...root.querySelectorAll('[data-sequence]')].map((node,index)=>({node,order:node.dataset.readOrder===undefined?index:Number(node.dataset.readOrder)})).sort((a,b)=>a.order-b.order).map(x=>x.node);
 activeReading={root,key,nodes};
 if(!nodes.length||state.readDone[key]||!state.motion||state.readSpeed==='instant'){finishReading();return;}
 const token=readingVersion;byId('reading-complete').hidden=false;byId('reading-status').textContent='正在慢慢说…';
 const pace={slow:130,natural:95,quick:55}[state.readSpeed]||95;
 (async()=>{
  for(const node of nodes){
   if(token!==readingVersion||!root.isConnected)return;
   showReadingNode(node);
   if(node.dataset.sequence==='line'){
    node.classList.add('speaking');
    const target=node.querySelector('.speech-text');const full=target?.dataset.full||'';
    const chars=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('zh',{granularity:'grapheme'}).segment(full)].map(x=>x.segment):Array.from(full);
    for(const char of chars){if(!await readingDelay(pace,token))return;target.textContent+=char;const punctuation=/[。！？!?]/.test(char)?360:/[，、；：,:;]/.test(char)?180:0;if(punctuation&&!await readingDelay(punctuation,token))return;}
    node.classList.remove('speaking');if(!await readingDelay(520,token))return;
   }else if(!await readingDelay(170,token))return;
  }
  if(token!==readingVersion)return;
  state.readDone[key]=true;activeReading=null;byId('reading-complete').hidden=true;byId('reading-status').textContent='这一段说完了，接下来由你决定。';
 })();
}
