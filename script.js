/* App PWA + localStorage logic
   Chaves: 'app_horas', 'app_revisitas', 'app_estudos'
*/
const qs = s=>document.querySelector(s);
const qsa = s=>document.querySelectorAll(s);

const screens = { menu: qs('#menu'), horas: qs('#horas'), revisitas: qs('#revisitas'), estudos: qs('#estudos') };
function show(name){
  Object.values(screens).forEach(s=>s.classList.add('hidden'));
  screens[name].classList.remove('hidden');
  window.scrollTo(0,0);
}

qsa('.menu-btn').forEach(b=>b.addEventListener('click',e=>show(e.currentTarget.dataset.target)));
qsa('.back').forEach(b=>b.addEventListener('click',e=>show(e.currentTarget.dataset.target)));

// storage helpers
const storage = {
  get(key){ try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e){ return []; } },
  set(key,val){ localStorage.setItem(key, JSON.stringify(val)); }
};

// HORAS
const HKEY='app_horas';
const horaInput = qs('#horaInput');
const addHora = qs('#addHora');
const horaList = qs('#horaList');
const totalDisplay = qs('#totalDisplay');
const totalHorasBtn = qs('#totalHoras');
const limparHorasBtn = qs('#limparHoras');

function renderHoras(){
  horaList.innerHTML='';
  const arr = storage.get(HKEY);
  arr.forEach((h,idx)=>{
    const li=document.createElement('li');
    li.className='item';
    li.innerHTML = `<div class="meta">${h}</div>
      <div class="actions">
        <button class="action-btn" data-act="edit" data-i="${idx}">Editar</button>
        <button class="action-btn" data-act="del" data-i="${idx}">Excluir</button>
      </div>`;
    horaList.appendChild(li);
  });
  displayTotal();
}
addHora.addEventListener('click',()=>{
  if(!horaInput.value) return;
  const val = horaInput.value; // "HH:MM"
  const arr = storage.get(HKEY);
  arr.push(val);
  storage.set(HKEY,arr);
  horaInput.value = '01:00';
  renderHoras();
});

horaList.addEventListener('click', (e)=>{
  const btn = e.target.closest('button');
  if(!btn) return;
  const idx = Number(btn.dataset.i);
  const act = btn.dataset.act;
  const arr = storage.get(HKEY);
  if(act==='del'){ arr.splice(idx,1); storage.set(HKEY,arr); renderHoras(); return; }
  if(act==='edit'){
    const old = arr[idx];
    const newv = prompt('Edite a hora (HH:MM)', old);
    if(newv && /^\d{1,2}:\d{2}$/.test(newv)){
      arr[idx]=newv; storage.set(HKEY,arr); renderHoras();
    } else alert('Formato inválido. Use HH:MM');
  }
});

function minutesFromHHMM(s){
  const [hh,mm]=s.split(':').map(Number);
  return hh*60 + mm;
}
function hhmmFromMinutes(m){
  const hh = Math.floor(m/60);
  const mm = m%60;
  return `${hh}:${String(mm).padStart(2,'0')}`;
}
function displayTotal(){
  const arr = storage.get(HKEY);
  const totalMin = arr.reduce((acc,v)=>acc + (v?minutesFromHHMM(v):0),0);
  totalDisplay.textContent = 'Total: ' + hhmmFromMinutes(totalMin);
}

totalHorasBtn.addEventListener('click', displayTotal);
limparHorasBtn.addEventListener('click', ()=>{
  if(confirm('Remover todos os registros de horas?')){ storage.set(HKEY,[]); renderHoras(); }
});

renderHoras();

// REVISITAS
const RKEY='app_revisitas';
const revNome = qs('#revNome');
const revTexto = qs('#revTexto');
const addRev = qs('#addRev');
const revList = qs('#revList');
const clearRevAll = qs('#clearRevAll');

function renderRevisitas(){
  revList.innerHTML='';
  const arr = storage.get(RKEY);
  arr.forEach((r,idx)=>{
    const li=document.createElement('li');
    li.className='item';
    li.innerHTML = `<div class="meta"><strong>${escapeHtml(r.nome)}</strong><div>${escapeHtml(r.text)}</div></div>
      <div class="actions">
        <button class="action-btn" data-act="edit" data-i="${idx}">Editar</button>
        <button class="action-btn" data-act="del" data-i="${idx}">Excluir</button>
      </div>`;
    revList.appendChild(li);
  });
}
addRev.addEventListener('click', ()=>{
  const nome = revNome.value.trim() || 'Sem nome';
  const text = revTexto.value.trim();
  if(text.length>700) { alert('Máx 700 caracteres'); return; }
  const arr = storage.get(RKEY);
  arr.push({nome,text});
  storage.set(RKEY,arr);
  revNome.value=''; revTexto.value='';
  renderRevisitas();
});

revList.addEventListener('click', (e)=>{
  const btn = e.target.closest('button');
  if(!btn) return;
  const idx = Number(btn.dataset.i);
  const act = btn.dataset.act;
  const arr = storage.get(RKEY);
  if(act==='del'){ if(confirm('Excluir registro?')){ arr.splice(idx,1); storage.set(RKEY,arr); renderRevisitas(); } return; }
  if(act==='edit'){
    const item = arr[idx];
    const nome = prompt('Editar nome', item.nome);
    if(nome===null) return;
    const text = prompt('Editar texto (máx 700)', item.text);
    if(text===null) return;
    if(text.length>700){ alert('Máx 700 caracteres'); return; }
    arr[idx] = {nome: nome.trim() || 'Sem nome', text};
    storage.set(RKEY,arr); renderRevisitas();
  }
});

clearRevAll.addEventListener('click', ()=>{
  if(confirm('Remover todas as revisitas?')){ storage.set(RKEY,[]); renderRevisitas(); }
});
renderRevisitas();

// ESTUDOS
const EKEY='app_estudos';
const newEstudoBtn = qs('#newEstudo');
const estList = qs('#estList');
const estEditor = qs('#estEditor');
const estNome = qs('#estNome');
const estTexto = qs('#estTexto');
const saveEst = qs('#saveEst');
const cancelEst = qs('#cancelEst');
const clearEstAll = qs('#clearEstAll');

let editingIndex = null;

function renderEstudos(){
  estList.innerHTML='';
  const arr = storage.get(EKEY);
  arr.forEach((e,idx)=>{
    const li=document.createElement('li');
    li.className='item';
    li.innerHTML = `<div class="meta"><strong>${escapeHtml(e.nome)}</strong></div>
      <div class="actions">
        <button class="action-btn" data-act="open" data-i="${idx}">Abrir</button>
        <button class="action-btn" data-act="del" data-i="${idx}">Excluir</button>
      </div>`;
    estList.appendChild(li);
  });
}

newEstudoBtn.addEventListener('click', ()=>{
  editingIndex = null;
  estNome.value=''; estTexto.value='';
  estEditor.classList.remove('hidden');
});

estList.addEventListener('click', (e)=>{
  const btn = e.target.closest('button');
  if(!btn) return;
  const idx = Number(btn.dataset.i);
  const act = btn.dataset.act;
  const arr = storage.get(EKEY);
  if(act==='del'){ if(confirm('Excluir estudo?')){ arr.splice(idx,1); storage.set(EKEY,arr); renderEstudos(); } return; }
  if(act==='open'){
    editingIndex = idx;
    const item = arr[idx];
    estNome.value = item.nome;
    estTexto.value = item.text;
    estEditor.classList.remove('hidden');
  }
});

saveEst.addEventListener('click', ()=>{
  const nome = estNome.value.trim() || 'Sem nome';
  const text = estTexto.value.trim();
  if(text.length>700){ alert('Máx 700 caracteres'); return; }
  const arr = storage.get(EKEY);
  if(editingIndex==null){
    arr.push({nome,text});
  } else {
    arr[editingIndex] = {nome,text};
  }
  storage.set(EKEY,arr);
  estEditor.classList.add('hidden');
  renderEstudos();
});

cancelEst.addEventListener('click', ()=>{
  estEditor.classList.add('hidden');
  editingIndex = null;
});

clearEstAll.addEventListener('click', ()=>{
  if(confirm('Remover todos os estudos?')){ storage.set(EKEY,[]); renderEstudos(); }
});

renderEstudos();

// small helpers
function escapeHtml(s){ return (s+'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// register service worker
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=> {
    navigator.serviceWorker.register('/sw.js').catch(err=>console.warn('SW failed',err));
  });
}
