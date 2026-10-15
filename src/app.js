const byId=id=>document.getElementById(id);
const escapeText=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const systemReduced=window.matchMedia('(prefers-reduced-motion: reduce)');
let state=freshState();
let transitionId=0;
function freshState(){return {page:0,explorations:{},parts:[],composeActive:null,quizActive:null,quizResult:null,quizSeen:[],quizAnswers:{},journal:'',reflection:'',saved:false,branch:'',journalSeen:[],include:false,recipient:'老师',opening:false,motion:!systemReduced.matches,readSpeed:systemReduced.matches?'instant':'natural',readDone:{}};}
function button(text,action,extra='',cls=''){return `<button type="button" class="${cls}" data-act="${action}" ${extra}>${escapeText(text)}</button>`;}
function sourceLinks(ids=[]){return ids.filter(id=>SOURCES[id]).map(id=>`<a href="${SOURCES[id].url}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">${escapeText(SOURCES[id].short)}</a>`).join(' · ');}
function paragraphs(text,cls=''){return String(text||'').split(/\n+/).filter(Boolean).map(t=>`<p class="${cls}">${escapeText(t)}</p>`).join('');}
function narrator(p,sequence=true){return `<div class="narrative">${storySpeech(p.text,{sequence})}</div>`;}
function innerVoice(title,text){return `<section class="inner-voice" data-sequence="reveal" hidden><span class="voice-label">${escapeText(title)}</span><div class="voice-lines">${String(text||'').split(/\n+/).filter(Boolean).map(t=>speechLine(t)).join('')}</div></section>`;}
function chatDevice(content,{person='林小禾',clock='校园里的一个片刻'}={}){return `<div class="chat-device"><div class="device-top"><span class="device-clock">${escapeText(clock)}</span><span class="device-person">${escapeText(person)}</span><span class="device-dot" aria-hidden="true"></span></div><div class="chat-timeline">${content}</div></div>`;}
function knowledgeContent(card,{showTopic=false,returnToStory=true}={}){return `<article class="knowledge-panel"><header class="knowledge-heading"><span class="knowledge-label">心理健康科普</span>${showTopic?`<h2 class="knowledge-topic">${escapeText(card.topic||card.title)}</h2>`:''}<p class="knowledge-subtitle">${escapeText(card.subtitle||card.title)}</p></header><p class="knowledge-intro">${escapeText(card.body)}</p>${knowledgeDiagram(card.diagram||'')}<div class="knowledge-sections">${(card.sections||[]).map((s,i)=>`<section><span class="knowledge-number">${String(i+1).padStart(2,'0')}</span><h3>${escapeText(s.title)}</h3>${paragraphs(s.body)}</section>`).join('')}</div><p class="source">资料依据：${sourceLinks(card.sources)}</p><p class="muted">${escapeText(card.boundary||'这些说明帮助理解概念，不能代替专业评估。感到困扰时可以寻求帮助。')}</p>${returnToStory?`<div class="row knowledge-return">${button(card.returnLabel||'回到故事','close-modal','','primary')}</div>`:''}</article>`;}
function knowledgeHook(p){if(!p.knowledge)return '';const card=p.knowledge;return `<section class="knowledge-hook" aria-label="${escapeText(card.topic||card.title)}"><span class="hook-kicker">心理健康科普</span><h2 class="knowledge-topic">${escapeText(card.topic||card.title)}</h2><p class="knowledge-subtitle">${escapeText(card.subtitle||card.title)}</p><p class="knowledge-teaser">${escapeText(card.teaser||card.body)}</p>${button(card.cta||card.title,'page-knowledge',`data-page="${p.id-1}" aria-label="${escapeText(card.cta||card.title)}"`,'knowledge-button')}</section>`;}
function exploreState(p){return state.explorations[p.id]||(state.explorations[p.id]={seen:[],active:null});}
function memory(p){return `<div class="scene-memory">${p.id===2?'课桌上的东西还在。你还想翻开哪一件？':p.id===4?'几种心声，还停留在考前的这一刻。':p.id===6?'纸条还摊在面前。还有几行，你想慢慢读。':p.id===8?'群聊还停在那句话。也可以看看另一种回应。':'刚才的片段还留在这里。你可以看看另一种可能。'}</div>`;}
function resultParts(c,p){
 let result=c.resultText||c.body||'';let explanation=c.explanation||'';
 if(!result&&c.feedback){const lines=c.feedback.split('\n');if(/^(小禾|林小禾|你|同学|老师)[：:]/.test(lines[0])){result=lines.shift();explanation=lines.join('\n');}else{result=c.feedback;}}
 const text=p.id===6?`<div class="paper-scene"><div class="paper-title">小禾递来的纸条</div><div class="paper-lines">${storySpeech(result.split(/\n+/).filter(Boolean))}</div></div>`:`<div class="spoken-result dialogue-outcome">${storySpeech(result.split(/\n+/).filter(Boolean))}</div>`;
 return `${text}${innerVoice('你在心里想',c.monologue||'我停了一下，想把刚才的话再听清楚。')}${explanation?stageReveal(`<div class="result-explanation">${paragraphs(explanation)}</div>`):''}`;
}
function objectOptions(p,entries,seen){
 const remain=entries.map((c,i)=>({c,i})).filter(x=>!seen.includes(x.i));
 if(p.id===2)return `<div class="desk-scene"><span class="desk-caption">点击课桌上的物件，翻开一段回忆</span><div class="desk-object-grid">${remain.map(({c,i})=>`<button type="button" class="desk-object ${['object-photo','object-form','object-book'][i]}" data-act="explore" data-choice="${i}"><span class="object-art" aria-hidden="true">${['<span class="mini-photo"><span class="mini-person"></span><span class="mini-person second"></span></span>','<span class="mini-form">校园摄影展<br>报名表</span>','<span class="mini-book">小禾的<br>涂鸦本</span>'][i]}</span><span class="object-label">${escapeText(c.label)}</span><span class="object-hint">轻轻翻开 ↗</span></button>`).join('')}</div></div>`;
 if(p.id===6)return `<div class="paper-scene"><div class="paper-title">得到她的允许后，你翻开这一页</div><div class="paper-tabs">${remain.map(({c,i})=>button(c.label,'explore',`data-choice="${i}"`,'paper-entry')).join('')}</div></div>`;
 if(p.id===4)return `<div class="thought-clouds">${remain.map(({c,i})=>`<button type="button" class="thought-button" data-act="explore" data-choice="${i}"><span class="thought-mark" aria-hidden="true">${['…','？','↘'][i]}</span><span>${escapeText(c.label)}</span></button>`).join('')}</div>`;
 if(p.id===8)return `<div class="bubble-options">${remain.map(({c,i})=>button(c.label,'explore',`data-choice="${i}"`,'chat-reply-option')).join('')}</div>`;
 return `<div class="options-grid">${remain.map(({c,i})=>`<button type="button" class="option-card" data-act="explore" data-choice="${i}"><span class="option-meta">${p.type==='choice'?'如果这样回应':'翻开这个片段'}</span><span class="option-label">${escapeText(c.label)}</span><span class="option-arrow" aria-hidden="true">↗</span></button>`).join('')}</div>`;
}
function traces(entries,seen,action='explore-seen'){return seen.length?`<details class="seen-traces"><summary>刚才打开的 ${seen.length} 个片段，还在这里</summary><div class="seen-chip-row">${seen.map(i=>button(entries[i].label,action,`data-choice="${i}"`,'seen-chip')).join('')}</div></details>`:'';}
function explorationView(p){
 const entries=p.cards||p.choices;const view=exploreState(p);const left=entries.length-view.seen.length;
 if(view.active!==null){const c=entries[view.active];let content=resultParts(c,p);if(p.id===2)content=`<div class="desk-scene"><span class="desk-caption">你翻开了：${escapeText(c.label)}</span>${content}</div>`;content+=stageReveal(`${knowledgeHook(p)}<div class="row result-actions">${button(left?`让其他${p.type==='choice'?'回应':'片段'}浮现 · 还剩 ${left} 个`:'回到这一刻，看看留下的片段','explore-back','','primary')}${button('继续故事','next','','ghost')}</div>`);return {html:p.id===8?chatDevice(content,{person:'班级群聊',clock:'课间 · 看看另一种可能'}):content,key:`p${p.id}:result:${view.active}`};}
 const head=view.seen.length?memory(p):narrator(p);let options=objectOptions(p,entries,view.seen);
 if(!left)options=`<div class="completion-note"><p>这些片段，已经慢慢展开。</p>${button('重新回看这一页','explore-reset','','ghost')}</div>`;
 const after=`${options}${traces(entries,view.seen)}${knowledgeHook(p)}${p.bridge?`<p class="bridge">${escapeText(p.bridge)}</p>`:''}`;
 const content=head+stageReveal(after);return {html:p.id===8?chatDevice(content,{person:'班级群聊',clock:'课间 · 一条待辨析的消息'}):content,key:`p${p.id}:intro${view.seen.length?':return':''}`};
}
function openingView(p){
 const messages=narrator(p,!state.opening);
 if(!state.opening)return {html:`${chatDevice(messages+stageReveal(`<div class="device-input"><span>怎么了？</span>${button('按下发送','opening','','device-send primary')}</div>`,'phone-composer',1000),{clock:'21:47',person:'林小禾'})}${innerVoice('你停在发送键前',p.openingMonologue||'我想问问她，又怕打扰。可那句话一直留在我心里。')}`,key:'p1:intro'};
 return {html:`${chatDevice(messages+storySpeech(p.feedback.split(/\n+/).filter(Boolean)),{clock:'21:48',person:'林小禾'})}${innerVoice('消息发出以后',p.afterSendMonologue||'她说没什么。我还是想，明天见面时多留意一下。')}${stageReveal(button('走进明天','next','','primary'))}`,key:'p1:sent'};
}
function composeView(p){
 const voices=['先写“想聊聊”吧。后面的话，我可以再慢慢补。','这句写出来了。原来，我可以从最近的感受开始说。','问清时间，再问问能不能请朋友陪我去。这样好像没那么难了。'];
 if(state.composeActive!==null){const i=state.composeActive;return {html:`${chatDevice(storySpeech([p.parts[i]],{sequence:true}),{person:'发给老师的草稿',clock:'只在这里准备，不会真实发送'})}${innerVoice('一句写下以后',voices[i])}${stageReveal(`<div class="row">${button(state.parts.length<3?`让下一句话浮现 · 还剩 ${3-state.parts.length} 句`:'看看准备好的消息','compose-back','','primary')}${button('继续故事','next','','ghost')}</div>`)}`,key:`p10:part:${i}`};}
 const head=state.parts.length?'<div class="scene-memory">草稿还在。下一句，你想写些什么？</div>':narrator(p);
 const remaining=p.parts.map((t,i)=>({t,i})).filter(x=>!state.parts.includes(x.i));
 let options=`<div class="device-input-options">${remaining.map(({t,i})=>button(t,'part',`data-choice="${i}"`,'chat-reply-option')).join('')}</div>`;
 if(state.parts.length)options=`<div class="chat-draft"><span class="draft-label">你们一起准备的消息</span>${paragraphs([...state.parts].sort().map(i=>p.parts[i]).join('\n'))}</div>`+options;
 if(!remaining.length)options+=`<p class="bridge">小禾看了看草稿，点点头：“这样写，好像就能开口了。”</p><p class="muted">在故事里，你们约好了第二天下午的时间。</p><div class="row">${button('重写这条草稿','compose-reset','','ghost')}${button('陪她去咨询室','next','','primary')}</div>`;
 return {html:chatDevice(head+stageReveal(options),{person:'消息草稿',clock:'一句一句，把需要说出来'}),key:`p10:intro${state.parts.length?':return':''}`};
}
function quizView(p){
 if(state.quizActive!==null){const i=state.quizActive,q=p.questions[i];
  if(state.quizResult!==null){const picked=state.quizResult;return {html:`<div class="dialogue-outcome">${storySpeech(String(q.resultTexts?.[picked]||'你停了一下，把刚才的回应又想了一遍。').split(/\n+/).filter(Boolean))}</div>${innerVoice('你的心声',q.monologues?.[picked]||'我想试试另一种说法。')}${stageReveal(`<div class="result-explanation">${paragraphs(q.feedback)}</div><div class="row">${button(state.quizSeen.length<3?`让其他情境浮现 · 还剩 ${3-state.quizSeen.length} 个`:'回到这些情境','quiz-back','','primary')}${button('看看这个情境的另一种回应','quiz-retry')}${button('走向结尾','next','','ghost')}</div>`)}`,key:`p14:${i}:answer:${picked}`};}
  return {html:`<div class="narrative">${storySpeech([q.question])}</div>${stageReveal(`<div class="options-grid">${q.options.map((o,j)=>button(o,'quiz-answer',`data-choice="${j}"`,'option-card')).join('')}</div>${button('先看其他情境','quiz-back','','ghost')}`)}`,key:`p14:${i}:options`};
 }
 const left=p.questions.map((q,i)=>({q,i})).filter(x=>!state.quizSeen.includes(x.i));
 let options=left.length?`<div class="paper-tabs">${left.map(({q,i})=>button(q.question,'quiz-open',`data-item="${i}"`,'paper-entry')).join('')}</div>`:`<p>这些理解，可以带回你自己的生活里。</p>${button('重新回看三个情境','quiz-reset','','ghost')}`;
 return {html:`${state.quizSeen.length?memory(p):narrator(p)}${stageReveal(`<div class="paper-scene">${options}</div>`)}`,key:`p14:intro${state.quizSeen.length?':return':''}`};
}
function talkTemplate(){return `${state.recipient}，你好。我最近有些难受，想找你聊聊。${state.include?'\n我想说的是：'+state.journal:''}\n你什么时候方便？如果需要，我也想一起寻找专业支持。`;}
function journalView(p){
 if(!state.saved)return {html:`${narrator(p)}${stageReveal(`<div class="paper-writing"><div class="paper-title">这一页，也留给你</div><label for="journal">${escapeText(p.prompt)}</label><textarea id="journal" maxlength="500" autocomplete="off" spellcheck="false" placeholder="${escapeText(p.placeholder)}">${escapeText(state.journal)}</textarea><div id="journal-count" class="counter">${state.journal.length} / 500</div></div><p id="journal-error" class="error" role="alert"></p><p class="privacy-line">${escapeText(p.privacy)}</p><div class="row">${button('把这句话留给自己','save-note','','primary')}${button('清空文字','clear-note','','ghost')}${button('不写也可以，继续故事','next','','ghost')}</div>`)}`,key:'p12:intro'};
 let html=`<div class="paper-writing"><div class="paper-title">你刚才写下的话</div><div class="private-note" id="private-note">${escapeText(state.journal)}</div></div><div class="row">${button('编辑这段话','edit-note','','ghost')}${button('清空所有私人文字','clear-note','','ghost')}</div>`;
 if(state.branch){const branch=p.journalChoices.find(c=>c.kind===state.branch);const voices={talk:'先想一个让我感到安全的人。我可以从一句话开始。',reflect:'我想慢慢理一理。最想让别人听懂的，是哪一部分呢？',keep:'先写到这里吧。下一步，我想等一等再决定。'};html+=innerVoice('也给自己一点时间',voices[state.branch]);let controls=paragraphs(branch.body);
  if(state.branch==='talk')controls+=`<label for="recipient">我想联系</label><select id="recipient">${['老师','可信任的家人','可靠的朋友'].map(x=>`<option ${state.recipient===x?'selected':''}>${x}</option>`).join('')}</select><label class="check"><input id="include" type="checkbox" ${state.include?'checked':''}><span>把刚才的私人文字加入下面的模板</span></label><div id="talk-template" class="template">${escapeText(talkTemplate())}</div><p class="muted">只预览，不真实发送。</p>`;
  if(state.branch==='reflect')controls+=`<label for="reflection">这件事里，我最希望别人理解的是什么？（可不写）</label><textarea id="reflection" maxlength="300" autocomplete="off" spellcheck="false" placeholder="再写一句就可以。">${escapeText(state.reflection)}</textarea><div id="reflection-count" class="counter">${state.reflection.length} / 300</div>`;
  controls+=`<div class="row">${button(state.journalSeen.length<3?`让其他方法浮现 · 还剩 ${3-state.journalSeen.length} 个`:'回看这些方法','journal-back','','primary')}${button('继续故事','next','','ghost')}</div>`;html+=stageReveal(controls);
 }else{const remaining=p.journalChoices.filter(c=>!state.journalSeen.includes(c.kind));html+=`<h2>接下来，你希望怎样对待它？</h2>${remaining.length?`<div class="paper-tabs">${remaining.map(c=>button(c.label,'journal-branch',`data-kind="${c.kind}"`,'paper-entry')).join('')}</div>`:`<p>不用现在做出更多决定。</p>${button('重新回看三种方法','journal-reset','','ghost')}`}`;}
 html+=`<p class="privacy-line">文字只留在当前网页内存里，不上传、不分析。翻页后可以返回编辑；刷新、关闭整个网页或重新开始会清除。</p>`;
 return {html,key:state.branch?`p12:method:${state.branch}`:'p12:methods'};
}
function pageClass(id){return [1,8,10,15].includes(id)?'page-phone':id===2?'page-desk':id===6?'page-paper':id===12?'page-journal':[3,4,7,14].includes(id)?'page-classroom':'page-corridor';}
function render(){
 stopReading();const p=PAGES[state.page];byId('position').textContent=`${String(p.id).padStart(2,'0')} / 15`;byId('progress-fill').style.width=`${p.id/15*100}%`;byId('progress').setAttribute('aria-valuenow',p.id);
 document.body.classList.remove('page-phone','page-desk','page-paper','page-journal','page-classroom','page-corridor');document.body.classList.add(pageClass(p.id));document.body.classList.toggle('motion-off',!state.motion);
 let result;
 if(['reveal','thoughts','choice'].includes(p.type))result=explorationView(p);
 else if(p.type==='opening')result=openingView(p);
 else if(p.type==='compose')result=composeView(p);
 else if(p.type==='journal')result=journalView(p);
 else if(p.type==='quiz')result=quizView(p);
 else if(p.type==='ending')result={html:`${chatDevice(narrator(p),{person:'林小禾',clock:'回到那天晚上 · 回忆'})}${stageReveal(`<div class="ending-quote">有些话很难开口。<br>我们可以从一句开始。</div><div class="stack">${button('把刚才的知识再读一遍','knowledge','','knowledge-button')}${button('给自己一个求助入口','help')}${button('参考资料与作品信息','sources','','ghost')}</div><div class="row">${button('回第12页，编辑或清空','goto','data-page="11"','ghost')}${button('重新开始','restart','','ghost')}</div>`)}`,key:'p15:intro'};
 else result={html:narrator(p),key:`p${p.id}:intro`};
 if(p.note&&[3,5,13].includes(p.id))result.html+=stageReveal(`<p class="note">${escapeText(p.note)}</p>`);
 byId('scene').classList.remove('page-enter');byId('scene').innerHTML=`<p class="eyebrow">${escapeText(p.chapter)}</p><h1 id="scene-title" tabindex="-1">${escapeText(p.title)}</h1><div class="reading-control"><span id="reading-status" class="reading-status" aria-live="polite">正在慢慢说…</span>${button('显示完整文字','finish-reading','id="reading-complete"','ghost')}</div><div class="scene-layout"><aside class="art-panel">${sceneArt(p.id)}</aside><div class="content-panel"><div id="story-stage" class="story-stage" tabindex="-1">${result.html}</div></div></div>`;
 byId('back').disabled=p.id===1;byId('next').hidden=p.id===15;byId('next').textContent=p.id===1?'走进明天 →':p.id===12?'继续故事（也可不写） →':p.id===14?'走向结尾 →':'继续故事 →';
 byId('scene').querySelectorAll('[data-effect]:not([data-sequence])').forEach(applyReadingEffect);
 startReading(byId('story-stage'),result.key);
}
async function transition(mutation,kind='result'){
 stopReading();const token=++transitionId;const target=byId(kind==='page'?'scene':'story-stage');
 if(state.motion&&target?.animate)await target.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-6px)'}],{duration:120,easing:'ease-in'}).finished.catch(()=>{});
 if(token!==transitionId)return false;mutation();render();const fresh=byId(kind==='page'?'scene':'story-stage');
 if(kind==='page'){fresh.classList.add('page-enter');window.scrollTo({top:0,behavior:'instant'});byId('scene-title').focus({preventScroll:true});}
 else fresh.focus({preventScroll:true});
 if(state.motion&&fresh?.animate)fresh.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:300,easing:'cubic-bezier(.2,.7,.2,1)'});return true;
}
function navigate(index){return transition(()=>{state.page=Math.max(0,Math.min(14,index));},'page');}
function openModal(title,body){byId('modal-title').textContent=title;byId('modal-body').innerHTML=body;if(!byId('modal').open)byId('modal').showModal();byId('modal').scrollTop=0;byId('modal-body').scrollTop=0;}
function helpBody(){return `<p>有些话可以慢慢说；有些时候，需要先得到身边的支持。</p><ol><li><strong>从安全、可信任的人开始：</strong>可靠的成年人、学校心理老师，或其他让你感到安全的支持者。</li><li><strong>需要进一步评估时：</strong>困扰持续、很强烈或影响日常生活，可以联系医疗机构的精神心理科或儿童青少年相关门诊。</li><li><strong>暂时没有合适回应：</strong>可以尝试其他支持者或医疗机构。</li></ol><div class="notice"><strong>若现在担心会伤害自己，或有即时人身危险：</strong>请先暂停体验，立即联系可信任的成年人、当地紧急服务或最近的急诊，获得现场支持。不必等文字说完，也不必等预约。</div><p class="muted">这里没有人员实时查看输入，不能接收紧急求助。校园预约信息需由团队向本校核实。</p><p class="source">${sourceLinks(['S1','S3'])}</p>`;}

document.addEventListener('click',async event=>{
 const b=event.target.closest('[data-act]');if(!b)return;const action=b.dataset.act;const choice=Number(b.dataset.choice);const item=Number(b.dataset.item);const p=PAGES[state.page];
 if(action==='finish-reading')finishReading();
 else if(action==='settings')openModal('按你的节奏阅读',`<label for="reading-speed">文字出现的节奏</label><select id="reading-speed">${[['slow','从容 · 多一点停顿'],['natural','自然 · 像慢慢对话'],['quick','轻快 · 读得快一些'],['instant','直接显示完整文字']].map(([value,label])=>`<option value="${value}" ${state.readSpeed===value?'selected':''}>${label}</option>`).join('')}</select><p class="muted">也可以随时点击“显示完整文字”，或继续下一页。</p>${button(state.motion?'减少动态':'开启动画','motion','','ghost')}<p class="muted">设置只用于当前体验，不改变系统设置。</p>`);
 else if(action==='next')await navigate(state.page+1);
 else if(action==='back')await navigate(state.page-1);
 else if(action==='goto'){if(byId('modal').open)byId('modal').close();await navigate(Number(b.dataset.page));}
 else if(action==='opening')await transition(()=>{state.opening=true;});
 else if(action==='explore')await transition(()=>{const view=exploreState(p);view.active=choice;if(!view.seen.includes(choice))view.seen.push(choice);});
 else if(action==='explore-seen')await transition(()=>{exploreState(p).active=choice;});
 else if(action==='explore-back')await transition(()=>{exploreState(p).active=null;});
 else if(action==='explore-reset')await transition(()=>{state.explorations[p.id]={seen:[],active:null};});
 else if(action==='part')await transition(()=>{if(!state.parts.includes(choice))state.parts.push(choice);state.composeActive=choice;});
 else if(action==='compose-back')await transition(()=>{state.composeActive=null;});
 else if(action==='compose-reset')await transition(()=>{state.parts=[];state.composeActive=null;});
 else if(action==='quiz-open')await transition(()=>{state.quizActive=item;state.quizResult=null;});
 else if(action==='quiz-answer')await transition(()=>{state.quizResult=choice;state.quizAnswers[state.quizActive]=choice;if(!state.quizSeen.includes(state.quizActive))state.quizSeen.push(state.quizActive);});
 else if(action==='quiz-back')await transition(()=>{state.quizActive=null;state.quizResult=null;});
 else if(action==='quiz-retry')await transition(()=>{state.quizResult=null;});
 else if(action==='quiz-reset')await transition(()=>{state.quizActive=null;state.quizResult=null;state.quizSeen=[];});
 else if(action==='save-note'){state.journal=byId('journal').value.slice(0,500);if(!state.journal.trim())byId('journal-error').textContent='可以写一句，也可以不写。空白不会生成便签。';else await transition(()=>{state.saved=true;state.branch='';state.journalSeen=[];});}
 else if(action==='edit-note'){const committed=await transition(()=>{state.saved=false;state.include=false;});if(committed)byId('journal')?.focus();}
 else if(action==='clear-note'){transitionId++;state.journal='';state.reflection='';state.saved=false;state.branch='';state.include=false;state.journalSeen=[];render();byId('journal-error').textContent='私人文字已清空。';}
 else if(action==='journal-branch')await transition(()=>{state.branch=b.dataset.kind;state.include=false;if(!state.journalSeen.includes(state.branch))state.journalSeen.push(state.branch);});
 else if(action==='journal-back')await transition(()=>{state.branch='';state.include=false;});
 else if(action==='journal-reset')await transition(()=>{state.branch='';state.journalSeen=[];state.include=false;});
 else if(action==='page-knowledge'){const kp=PAGES[Number(b.dataset.page)];openModal(kp.knowledge.topic||kp.knowledge.title,knowledgeContent(kp.knowledge));}
 else if(action==='help')openModal('需要帮助',helpBody());
 else if(action==='knowledge')openModal('把理解带回生活',PAGES.filter(p=>p.knowledge).map(p=>knowledgeContent(p.knowledge,{showTopic:true,returnToStory:false})).join('')+`<div class="row knowledge-return">${button('回到故事','close-modal','','primary')}</div>`);
 else if(action==='sources')openModal('参考资料与作品信息',`<p>《那条没发出去的消息》 · 青少年心理健康交互科普</p><p>故事对话版 v0.4。人物、情节、图案由本项目创作，部分制作使用AI辅助。没有复制资料中的图片。用户文字不上传、不分析、不长期保存。</p><p>资料核对日期：2026-10-14；专业审核：待完成。</p><ol>${Object.entries(SOURCES).map(([id,s])=>`<li><a href="${s.url}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">${escapeText(s.title)}</a><br><span class="muted">${id} · ${escapeText(s.publisher)} · ${escapeText(s.date)}</span></li>`).join('')}</ol><p class="muted">参考资料在新窗口打开，不会携带你的输入。团队及教师信息待正式参赛版本填写。</p>`);
 else if(action==='index')openModal('翻到故事的哪一页？',`<div class="index-grid">${PAGES.map((p,i)=>button(`${String(p.id).padStart(2,'0')} · ${p.title}`,'goto',`data-page="${i}"`)).join('')}</div>`);
 else if(action==='restart')openModal('再走一次这段故事',`<p>重新开始会清空私人文字与本次互动记录。</p><div class="row">${button('清空并重新开始','restart-confirm','','primary')}${button('保留，继续体验','close-modal')}</div>`);
 else if(action==='restart-confirm'){transitionId++;const motion=state.motion,speed=state.readSpeed;state=freshState();state.motion=motion;state.readSpeed=speed;byId('modal').close();render();window.scrollTo(0,0);}
 else if(action==='close-modal')byId('modal').close();
 else if(action==='motion'){finishReading();transitionId++;state.motion=!state.motion;document.getAnimations().forEach(a=>a.cancel());render();b.textContent=state.motion?'减少动态':'开启动画';}
});
document.addEventListener('input',event=>{
 if(event.target.id==='journal'){state.journal=event.target.value.slice(0,500);byId('journal-count').textContent=`${state.journal.length} / 500`;byId('journal-error').textContent='';}
 if(event.target.id==='reflection'){state.reflection=event.target.value.slice(0,300);byId('reflection-count').textContent=`${state.reflection.length} / 300`;}
});
document.addEventListener('change',event=>{
 if(event.target.id==='reading-speed'){finishReading();state.readSpeed=event.target.value;}
 if(event.target.id==='recipient'){state.recipient=event.target.value;byId('talk-template').textContent=talkTemplate();}
 if(event.target.id==='include'){state.include=event.target.checked;byId('talk-template').textContent=talkTemplate();}
});
systemReduced.addEventListener('change',event=>{if(event.matches){finishReading();state.motion=false;document.getAnimations().forEach(a=>a.cancel());document.body.classList.add('motion-off');}});
window.addEventListener('pagehide',()=>{stopReading();transitionId++;state=freshState();byId('scene').replaceChildren();byId('modal-body').replaceChildren();});
window.addEventListener('pageshow',event=>{if(event.persisted){state=freshState();if(byId('modal').open)byId('modal').close();render();}});
render();
byId('scene').classList.add('page-enter');


