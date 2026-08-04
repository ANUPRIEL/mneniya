
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

const storageKey = "mneniya-prototype-v1";
const initial = {
  questions: SEED_DATA.questions,
  researches: SEED_DATA.researches,
  notifications: SEED_DATA.notifications,
  opinionsGiven: 12,
  publicationsHelped: 4,
  onboarded: false
};
let state = JSON.parse(localStorage.getItem(storageKey) || "null") || structuredClone(initial);
let currentFilter = "main";

function save(){ localStorage.setItem(storageKey, JSON.stringify(state)); }
function toast(text){
  const el=$("#toast"); el.textContent=text; el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"),2200);
}
function route(){
  const hash=location.hash || "#/feed";
  if(!state.onboarded && hash !== "#/onboarding"){ location.hash="#/onboarding"; return; }
  render(hash);
}
function navButton(label,hash){
  const active=(location.hash||"#/feed").startsWith(hash);
  return `<button class="nav-btn ${active?'active':''}" onclick="location.hash='${hash}'">${label}</button>`;
}
function shell(content){
  const unread=state.notifications.filter(n=>n.unread).length;
  $("#app").innerHTML=`
  <div class="shell">
    <header class="topbar">
      <div class="topbar-inner">
        <a class="logo" href="#/feed">Мнения</a>
        <nav class="nav">
          ${navButton("Вопросы","#/feed")}
          ${navButton("Исследования","#/researches")}
          ${navButton("Ваш вклад","#/contribution")}
          ${navButton(`Уведомления ${unread?`<span class="badge">${unread}</span>`:""}`,"#/notifications")}
        </nav>
        <button class="primary" onclick="location.hash='#/create-question'">Задать вопрос</button>
      </div>
    </header>
    <main>${content}</main>
    <nav class="mobile-nav">
      <button onclick="location.hash='#/feed'">Вопросы</button>
      <button onclick="location.hash='#/researches'">Работы</button>
      <button onclick="location.hash='#/contribution'">Вклад</button>
      <button onclick="location.hash='#/notifications'">События</button>
    </nav>
  </div>`;
}
function render(hash){
  if(hash==="#/onboarding") return renderOnboarding();
  if(hash.startsWith("#/question/")) return renderQuestion(hash.split("/")[2]);
  if(hash.startsWith("#/research/")) return renderResearch(hash.split("/")[2]);
  switch(hash){
    case "#/feed": return renderFeed();
    case "#/researches": return renderResearches();
    case "#/contribution": return renderContribution();
    case "#/notifications": return renderNotifications();
    case "#/create-question": return renderCreateQuestion();
    case "#/create-research": return renderCreateResearch();
    case "#/settings": return renderSettings();
    default: return render404();
  }
}
function renderOnboarding(){
  const steps=[
    {eyebrow:"Добро пожаловать",title:"Здесь собирают не правильные ответы, а разные мнения.",text:"Вам не нужно быть экспертом. Достаточно прочитать вопрос и честно написать, что вы думаете.",visual:"●  ●  ●"},
    {eyebrow:"Анонимность",title:"Автор вопроса никогда не узнает, кто именно ответил.",text:"Имя, профиль и личные данные скрыты. Исследователь получает только текст мнения и агрегированную статистику.",visual:"◯  ◯  ◯"},
    {eyebrow:"Результат",title:"Ваше мнение не должно исчезнуть бесследно.",text:"Когда автор публикует итоговую работу, участники получают ссылку. Если публикация невозможна — честную благодарность.",visual:"↗  →  ✓"}
  ];
  let step=Number(sessionStorage.getItem("onboardingStep")||0);
  const s=steps[step];
  $("#app").innerHTML=`<main class="onboarding">
    <div class="onboarding-card">
      <div class="eyebrow">${s.eyebrow}</div>
      <h1 class="page-title">${s.title}</h1>
      <p class="lead" style="margin:auto">${s.text}</p>
      <div class="onboarding-visual"><div class="people">${s.visual}</div></div>
      <div class="stepper" style="justify-content:center">${steps.map((_,i)=>`<span class="step ${i===step?'active':''}">${i+1}</span>`).join("")}</div>
      <button class="primary" id="nextOnboarding">${step===steps.length-1?"Перейти к вопросам":"Дальше"}</button>
    </div>
  </main>`;
  $("#nextOnboarding").onclick=()=>{
    if(step<steps.length-1){sessionStorage.setItem("onboardingStep",step+1);renderOnboarding()}
    else{state.onboarded=true;save();sessionStorage.removeItem("onboardingStep");location.hash="#/feed"}
  };
}
function questionCard(q){
  return `<article class="question-card">
    <div class="card-meta"><span class="tag">${q.area}</span><span>до ${q.deadline}</span></div>
    <h2 class="question-title">${q.question}</h2>
    <p class="question-desc">${q.description}</p>
    <div class="card-footer">
      <span class="muted small">${q.opinions===0?"Пока нет мнений":`${q.opinions} ${plural(q.opinions,"мнение","мнения","мнений")}`}</span>
      <div class="inline-actions">
        <button class="ghost" onclick="reportQuestion('${q.id}')">Пожаловаться</button>
        <button class="secondary" onclick="location.hash='#/question/${q.id}'">${q.opinions===0?"Ответить первым":"Поделиться мнением"}</button>
      </div>
    </div>
  </article>`;
}
function renderFeed(){
  let list=[...state.questions];
  if(currentFilter==="new") list=list.filter(q=>q.created==="сегодня");
  if(currentFilter==="unanswered") list=list.filter(q=>q.opinions===0);
  if(currentFilter==="random") list=list.sort(()=>Math.random()-.5).slice(0,10);
  shell(`
    <section class="hero">
      <div><div class="eyebrow">Место для разных точек зрения</div>
      <h1 class="display">Любой хороший вопрос заслуживает ответа.</h1>
      <p class="lead">Здесь не нужно быть экспертом. Достаточно иметь мнение и желание им поделиться.</p></div>
      <div class="hero-card"><strong>1 248</strong><span class="muted">мнений помогли создать исследования, статьи и учебные работы</span></div>
    </section>
    <div class="tabs">
      ${["main:Главная","new:Новые","unanswered:Без ответов","random:Случайные 10"].map(x=>{let [k,l]=x.split(":");return `<button class="tab ${currentFilter===k?'active':''}" onclick="setFilter('${k}')">${l}</button>`}).join("")}
    </div>
    <div class="layout">
      <div class="stack">
        ${list.slice(0,2).map(questionCard).join("")}
        <div class="stats-row">
          <div class="mini-stat"><strong>38</strong><span class="muted small">новых вопросов сегодня</span></div>
          <div class="mini-stat"><strong>214</strong><span class="muted small">мнений за день</span></div>
          <div class="mini-stat"><strong>7</strong><span class="muted small">работ опубликовано</span></div>
        </div>
        ${list.slice(2).map(questionCard).join("") || `<div class="empty">Здесь пока ничего нет.</div>`}
      </div>
      <aside class="sidebar">
        <div class="panel"><h3>У вас есть вопрос?</h3><p class="muted small">Сформулируйте одну мысль и расскажите, для чего будут использованы мнения.</p><button class="primary" onclick="location.hash='#/create-question'">Создать вопрос</button></div>
        <div class="panel"><h3>Почему ответы анонимны</h3><p class="muted small">Автор видит текст мнения и общую статистику, но не личность участника.</p></div>
      </aside>
    </div>`);
}
function setFilter(f){currentFilter=f;renderFeed()}
function renderQuestion(id){
  const q=state.questions.find(x=>x.id===id);
  if(!q)return render404();
  shell(`<div class="layout">
    <section>
      <button class="ghost" onclick="history.back()">← Назад</button>
      <div style="margin-top:28px" class="eyebrow">${q.area}</div>
      <h1 class="page-title">${q.question}</h1>
      <p class="lead">${q.description}</p>
      <div class="panel" style="margin-top:28px">
        <div class="card-meta"><span>${q.opinions} ${plural(q.opinions,"мнение","мнения","мнений")}</span><span>сбор до ${q.deadline}</span></div>
        <div class="field"><label>Что вы думаете?</label><textarea id="opinionText" placeholder="Пишите так, как сказали бы это человеку в разговоре."></textarea></div>
        <div class="helper">Мнение будет передано автору анонимно. После отправки его нельзя редактировать, но можно удалить, пока сбор открыт.</div>
        <div class="inline-actions" style="margin-top:18px">
          <button class="secondary" onclick="submitOpinion('${q.id}')">Отправить мнение</button>
          <button class="ghost" onclick="reportQuestion('${q.id}')">Пожаловаться на вопрос</button>
        </div>
      </div>
    </section>
    <aside class="sidebar">
      <div class="panel"><h3>О работе</h3><p class="muted small">Этот вопрос входит в исследование. После публикации результата участники получат уведомление.</p><button class="ghost" onclick="location.hash='#/research/${q.researchId}'">Открыть исследование</button></div>
      <div class="panel"><h3>Хороший ответ</h3><p class="muted small">Не обязан быть длинным или экспертным. Главное — чтобы он честно отражал вашу точку зрения.</p></div>
    </aside>
  </div>`);
}
function submitOpinion(id){
  const text=$("#opinionText").value.trim();
  if(text.length<8)return toast("Добавьте немного больше деталей");
  const q=state.questions.find(x=>x.id===id); q.opinions++; state.opinionsGiven++; save();
  toast("Мнение отправлено анонимно");
  setTimeout(()=>location.hash="#/contribution",700);
}
function reportQuestion(id){
  const reasons=["Вопрос слишком широкий","Вопрос подталкивает к определённому ответу","Оскорбления или разжигание ненависти","Реклама или спам","Персональные данные","Другое"];
  modal(`<div class="modal-head"><div><div class="eyebrow">Обратная связь</div><h2>Что не так с вопросом?</h2></div><button class="close" onclick="closeModal()">×</button></div>
    <div class="stack">${reasons.map(r=>`<button class="ghost" style="text-align:left" onclick="sendReport('${r}')">${r}</button>`).join("")}</div>`);
}
function sendReport(reason){closeModal();toast("Спасибо. Жалоба отправлена на модерацию")}
function renderCreateQuestion(){
  shell(`<div class="eyebrow">Новый вопрос</div><h1 class="page-title">О чём вы хотите спросить людей?</h1>
  <div class="form-card">
    <div class="form-row">
      <div class="field"><label>Тип работы</label><select id="qType"><option>Исследование</option><option>Студенческая работа</option></select></div>
      <div class="field"><label>Область</label><select id="qArea">${["Образование","Психология","HR","Маркетинг","Продажи","IT","Медицина","Политика","Финансы","Дизайн","Другое"].map(x=>`<option>${x}</option>`).join("")}</select></div>
    </div>
    <div class="field"><label>Вопрос</label><input id="qTitle" placeholder="Одна самостоятельная и понятная мысль"></div>
    <div class="field"><label>Контекст</label><textarea id="qDesc" placeholder="Зачем вы задаёте этот вопрос и во что превратятся собранные мнения?"></textarea></div>
    <div class="form-row">
      <div class="field"><label>Собирать мнения до</label><input id="qDeadline" type="date"></div>
      <div class="field"><label>Связь с исследованием</label><select id="qResearch"><option value="">Отдельный вопрос</option>${state.researches.map(r=>`<option value="${r.id}">${r.title}</option>`).join("")}</select></div>
    </div>
    <div class="helper">Проверьте: вопрос понятен с первого прочтения, не слишком широкий и не подталкивает к определённому ответу.</div>
    <div class="inline-actions" style="margin-top:20px"><button class="primary" onclick="publishQuestion()">Опубликовать</button><button class="ghost" onclick="toast('Черновик сохранён локально')">Сохранить черновик</button></div>
  </div>`);
}
function publishQuestion(){
  const title=$("#qTitle").value.trim(), desc=$("#qDesc").value.trim();
  if(title.length<12)return toast("Сформулируйте вопрос чуть подробнее");
  if(desc.length<20)return toast("Добавьте контекст для участников");
  const id="q"+Date.now();
  state.questions.unshift({id,area:$("#qArea").value,question:title,description:desc,deadline:$("#qDeadline").value||"не указано",opinions:0,created:"сегодня",researchId:$("#qResearch").value||null});
  save(); toast("Вопрос опубликован"); setTimeout(()=>location.hash="#/question/"+id,600);
}
function renderResearches(){
  shell(`<div class="eyebrow">Кабинет автора</div><h1 class="page-title">Ваши исследования</h1>
    <div class="inline-actions" style="margin-bottom:26px"><button class="primary" onclick="location.hash='#/create-research'">Создать исследование</button></div>
    <div class="grid-2">${state.researches.map(r=>`<article class="research-card">
      <div class="card-meta"><span class="tag">${r.area}</span><span class="status">${r.status}</span></div>
      <h2 class="question-title">${r.title}</h2><p class="muted">${r.type} · ${r.questions.length} ${plural(r.questions.length,"вопрос","вопроса","вопросов")}</p>
      <div class="progress"><span style="width:${r.progress}%"></span></div>
      <div class="card-footer"><span class="small muted">${r.deadline}</span><button class="ghost" onclick="location.hash='#/research/${r.id}'">Открыть</button></div>
    </article>`).join("")}</div>`);
}
function renderCreateResearch(){
  shell(`<div class="eyebrow">Новое исследование</div><h1 class="page-title">Соберите до трёх связанных вопросов.</h1>
  <div class="form-card">
    <div class="form-row">
      <div class="field"><label>Тип</label><select id="rType"><option>Исследование</option><option>Студенческая работа</option></select></div>
      <div class="field"><label>Область</label><select id="rArea">${["Образование","Психология","HR","Маркетинг","Продажи","IT","Медицина","Политика","Финансы","Дизайн","Другое"].map(x=>`<option>${x}</option>`).join("")}</select></div>
    </div>
    <div class="field"><label>Название исследования</label><input id="rTitle" placeholder="Короткое рабочее название"></div>
    <div class="field"><label>Зачем вы его проводите?</label><textarea id="rDesc" placeholder="Опишите цель и будущий результат"></textarea></div>
    <div class="helper">Для длинных анкет сервис порекомендует внешнюю форму. Внутри «Мнений» исследование объединяет не более трёх самостоятельных вопросов.</div>
    <button class="primary" style="margin-top:20px" onclick="createResearch()">Создать исследование</button>
  </div>`);
}
function createResearch(){
  const title=$("#rTitle").value.trim();
  if(title.length<6)return toast("Добавьте название исследования");
  const id="r"+Date.now();
  state.researches.unshift({id,title,type:$("#rType").value,area:$("#rArea").value,status:"Черновик",progress:0,questions:[],deadline:"срок не указан"});
  save();toast("Исследование создано");setTimeout(()=>location.hash="#/research/"+id,500);
}
function renderResearch(id){
  const r=state.researches.find(x=>x.id===id); if(!r)return render404();
  const questions=state.questions.filter(q=>r.questions.includes(q.id)||q.researchId===id);
  shell(`<div class="card-meta"><span class="tag">${r.area}</span><span class="status">${r.status}</span></div>
    <h1 class="page-title">${r.title}</h1><p class="lead">${r.type}. Здесь автор управляет вопросами, следит за сбором мнений и завершает работу публикацией результата.</p>
    <div class="grid-3" style="margin:28px 0">
      <div class="stat-card"><strong>${questions.length}</strong><p class="muted">вопросов в исследовании</p></div>
      <div class="stat-card"><strong>${questions.reduce((a,q)=>a+q.opinions,0)}</strong><p class="muted">мнений собрано</p></div>
      <div class="stat-card"><strong>${r.progress}%</strong><p class="muted">готовность сбора</p></div>
    </div>
    <div class="report-grid">
      <section class="panel"><h3>Вопросы исследования</h3><div class="stack">${questions.length?questions.map(questionCard).join(""):`<div class="empty">Пока нет вопросов.</div>`}</div>
      ${questions.length<3?`<button class="primary" style="margin-top:18px" onclick="location.hash='#/create-question'">Добавить вопрос</button>`:`<div class="helper" style="margin-top:18px">Достигнут лимит из трёх вопросов.</div>`}</section>
      <aside class="panel"><h3>Путь исследования</h3>
        ${["Сбор мнений","Анализ","Публикация результата","Завершение"].map((x,i)=>`<div class="answer-block"><strong>${i+1}. ${x}</strong><p class="muted small">${i===0?"Вопросы открыты для ответов.":i===1?"Автор скачивает ответы и готовит выводы.":i===2?"Добавляется ссылка на статью, диплом или другой результат.":"Участники получают публикацию или благодарность."}</p></div>`).join("")}
        <button class="secondary" onclick="finishResearch('${id}')">Завершить сбор</button>
      </aside>
    </div>`);
}
function finishResearch(id){
  modal(`<div class="modal-head"><div><div class="eyebrow">Следующий этап</div><h2>Как завершится работа?</h2></div><button class="close" onclick="closeModal()">×</button></div>
  <p class="muted">Завершение сбора не означает публикацию. Сначала вы анализируете ответы, а затем возвращаетесь с результатом.</p>
  <div class="stack">
    <button class="ghost" onclick="setResearchStatus('${id}','Анализ')">Перейти к анализу</button>
    <button class="ghost" onclick="publishResult('${id}')">Добавить ссылку на результат</button>
    <button class="ghost" onclick="completeWithoutPublication('${id}')">Публикация невозможна</button>
  </div>`);
}
function setResearchStatus(id,status){state.researches.find(r=>r.id===id).status=status;save();closeModal();toast("Статус обновлён");renderResearch(id)}
function publishResult(id){
  modal(`<div class="modal-head"><h2>Ссылка на итоговую работу</h2><button class="close" onclick="closeModal()">×</button></div>
    <div class="field"><label>Ссылка</label><input id="resultUrl" placeholder="https://..."></div>
    <div class="field"><label>Короткое сообщение участникам</label><textarea id="resultMessage">Спасибо, что поделились мнением. Работа готова — теперь вы можете увидеть результат.</textarea></div>
    <button class="primary" onclick="savePublication('${id}')">Опубликовать результат</button>`);
}
function savePublication(id){state.researches.find(r=>r.id===id).status="Опубликовано";state.publicationsHelped++;save();closeModal();toast("Участники получат ссылку на публикацию");renderResearch(id)}
function completeWithoutPublication(id){state.researches.find(r=>r.id===id).status="Завершено без публикации";save();closeModal();toast("Участникам отправлена благодарность");renderResearch(id)}
function renderContribution(){
  shell(`<div class="eyebrow">Ваш вклад</div><h1 class="display" style="max-width:900px">Ваши мнения уже стали частью чего-то большего.</h1>
    <div class="grid-2">
      <div class="stat-card"><strong>${state.opinionsGiven}</strong><p class="muted">вопросов удостоились вашего мнения</p></div>
      <div class="stat-card"><strong>${state.publicationsHelped}</strong><p class="muted">исследования опубликованы благодаря вашим ответам</p></div>
      <div class="stat-card"><strong>3</strong><p class="muted">темы, к которым вы возвращаетесь чаще всего</p></div>
      <div class="stat-card"><strong>100%</strong><p class="muted">ваших ответов переданы авторам анонимно</p></div>
    </div>
    <div class="panel" style="margin-top:24px"><h3>Как устроена анонимность</h3><p class="muted">Только вы видите собственный профиль. Исследователи получают мнения отдельно от демографических данных, а характеристики аудитории — только в агрегированном виде.</p></div>`);
}
function renderNotifications(){
  state.notifications.forEach(n=>n.unread=false);save();
  shell(`<div class="eyebrow">События</div><h1 class="page-title">Уведомления</h1>
    <div class="panel">${state.notifications.map(n=>`<div class="notification"><span class="dot"></span><div><strong>${n.title}</strong><p class="muted small">${n.text}</p></div><span class="muted small">${n.time}</span></div>`).join("")}</div>`);
}
function renderSettings(){
  shell(`<div class="eyebrow">Настройки</div><h1 class="page-title">Ваши данные и приватность</h1>
    <div class="form-card">
      <div class="field"><label>Возрастная группа</label><select><option>Не указано</option><option>18–24</option><option>25–34</option><option>35–44</option><option>45+</option></select></div>
      <div class="field"><label>Город</label><input placeholder="Необязательно"></div>
      <div class="field"><label>Образование</label><select><option>Не указано</option><option>Среднее</option><option>Высшее</option><option>Учусь сейчас</option></select></div>
      <div class="helper">Эти данные не связываются с конкретными ответами. Они используются только для агрегированных диаграмм.</div>
      <div class="inline-actions" style="margin-top:20px"><button class="primary" onclick="toast('Настройки сохранены')">Сохранить</button><button class="danger" onclick="resetPrototype()">Сбросить прототип</button></div>
    </div>`);
}
function resetPrototype(){localStorage.removeItem(storageKey);location.reload()}
function render404(){shell(`<div class="empty"><h1 class="page-title">Страница не найдена</h1><button class="primary" onclick="location.hash='#/feed'">Вернуться к вопросам</button></div>`)}
function modal(content){$("#modalRoot").innerHTML=`<div class="modal-backdrop" onclick="if(event.target===this)closeModal()"><div class="modal">${content}</div></div>`}
function closeModal(){$("#modalRoot").innerHTML=""}
function plural(n,one,few,many){const n10=n%10,n100=n%100;return n10===1&&n100!==11?one:n10>=2&&n10<=4&&(n100<12||n100>14)?few:many}
window.addEventListener("hashchange",route);
window.addEventListener("DOMContentLoaded",route);
