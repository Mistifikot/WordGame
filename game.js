/* ===================== КОНФИГ / СОСТОЯНИЕ ===================== */
const CATEGORIES = ['all','medicine','emotion','nature','resource','social','abstract'];
const CATEGORY_NAMES = { all:'ВСЕ', medicine:'МЕДИЦИНА', emotion:'ЭМОЦИИ', nature:'ПРИРОДА', resource:'РЕСУРСЫ', social:'ОБЩЕСТВО', abstract:'АБСТРАКТ' };

const DEFAULT_STATS = { health:65, food:55, safety:45, morale:50, trust:45 };
const STAT_EMOJIS = { health:'❤️', food:'🌾', safety:'🛡️', morale:'💚', trust:'🤝' };

let gameState = {
  mode:'campaign',
  day:1,
  stats:{...DEFAULT_STATS},
  currentVisitor:null,
  selectedWord:null,
  visitorsQueue:[],
  usedWords:new Set(),
  journal:[],
  canCreateNeologism:2,
  discoveredWords:[],
  roguelikeScore:0,
  ended:false,
  nightDecay:3,
  crisisFlags:{ epidemic:false, famine:false, unrest:false },
  wordsUsedToday:[],
  snapshot:{},
  pendingEvent:null,
  dayPhase:'idle',
  phaseTimeout:null,
  lastSummary:null
};

/* ===================== БАЗА СЛОВ ===================== */
const wordsDatabase = [
  { text:"Лекарство", category:"medicine", id:"med1", tooltip:"Универсальное средство" },
  { text:"Исцеление", category:"medicine", id:"med2", tooltip:"Магическое восстановление" },
  { text:"Травы", category:"medicine", id:"med3", tooltip:"Природные средства" },
  { text:"Перевязка", category:"medicine", id:"med4", tooltip:"Остановка крови" },
  { text:"Антидот", category:"medicine", id:"med5", tooltip:"Противоядие" },
  { text:"Карантин", category:"medicine", id:"med6", tooltip:"Изоляция больных" },

  { text:"Мужество", category:"emotion", id:"emo1", tooltip:"Храбрость" },
  { text:"Надежда", category:"emotion", id:"emo2", tooltip:"Вера в лучшее" },
  { text:"Покой", category:"emotion", id:"emo3", tooltip:"Умиротворение" },
  { text:"Гнев", category:"emotion", id:"emo4", tooltip:"Ярость" },
  { text:"Радость", category:"emotion", id:"emo5", tooltip:"Счастье" },
  { text:"Любовь", category:"emotion", id:"emo6", tooltip:"Привязанность" },
  { text:"Страх", category:"emotion", id:"emo7", tooltip:"Ужас" },
  { text:"Отчаяние", category:"emotion", id:"emo8", tooltip:"Безнадежность" },

  { text:"Дождь", category:"nature", id:"nat1", tooltip:"Вода с небес" },
  { text:"Огонь", category:"nature", id:"nat2", tooltip:"Пламя" },
  { text:"Вода", category:"nature", id:"nat3", tooltip:"Источник жизни" },
  { text:"Ветер", category:"nature", id:"nat4", tooltip:"Движение воздуха" },
  { text:"Солнце", category:"nature", id:"nat5", tooltip:"Свет и тепло" },
  { text:"Земля", category:"nature", id:"nat6", tooltip:"Почва" },
  { text:"Лёд", category:"nature", id:"nat7", tooltip:"Холод" },
  { text:"Туман", category:"nature", id:"nat8", tooltip:"Сокрытие" },

  { text:"Хлеб", category:"resource", id:"res1", tooltip:"Основная пища" },
  { text:"Зерно", category:"resource", id:"res2", tooltip:"Семена" },
  { text:"Урожай", category:"resource", id:"res3", tooltip:"Плоды труда" },
  { text:"Инструмент", category:"resource", id:"res4", tooltip:"Орудия" },
  { text:"Убежище", category:"resource", id:"res5", tooltip:"Защита" },
  { text:"Оружие", category:"resource", id:"res6", tooltip:"Средство обороны" },

  { text:"Мир", category:"social", id:"soc1", tooltip:"Согласие" },
  { text:"Справедливость", category:"social", id:"soc2", tooltip:"Честность" },
  { text:"Закон", category:"social", id:"soc3", tooltip:"Порядок" },
  { text:"Единство", category:"social", id:"soc4", tooltip:"Сплоченность" },
  { text:"Знание", category:"social", id:"soc5", tooltip:"Мудрость" },
  { text:"Правда", category:"social", id:"soc6", tooltip:"Истина" },

  { text:"Время", category:"abstract", id:"abs1", tooltip:"Течение событий" },
  { text:"Тишина", category:"abstract", id:"abs2", tooltip:"Отсутствие звука" },
  { text:"Свет", category:"abstract", id:"abs3", tooltip:"Сияние" },
  { text:"Судьба", category:"abstract", id:"abs4", tooltip:"Предначертание" },
  { text:"Память", category:"abstract", id:"abs5", tooltip:"Воспоминания" }
];

/* ===================== КАМПАНИЯ / СОБЫТИЯ ===================== */
const campaignEvents = {
  1:{ visitors:[
    { name:"Знахарка Марфа", portrait:"👵", problem:"Болезнь", description:"В деревне началась <span class='problem-keyword'>Болезнь</span>. Люди слабеют.", solutions:{
      "med1":{health:12,trust:5,message:"Лекарство помогает больным."},
      "med2":{health:18,trust:8,message:"Исцеление спасает многих!"},
      "med3":{health:6,message:"Травы облегчают симптомы."},
      "med6":{health:10,safety:5,message:"Карантин сдерживает заразу."},
      "nat2":{health:-8,safety:-5,message:"Огонь?! Паника!"},
      "default":{health:-5,trust:-3,message:"Болезнь распространяется..."}
    }},
    { name:"Голодный ребёнок", portrait:"👦", problem:"Голод", description:"Пожалуйста, есть нечего. <span class='problem-keyword'>Голод</span> мучает.", solutions:{
      "res1":{food:8,morale:5,message:"Хлеб утоляет голод."},
      "res2":{food:5,message:"Зерно даст кашу."},
      "nat3":{food:2,health:2,message:"Вода помогает немного."},
      "default":{food:-4,morale:-3,message:"Голод усиливается..."}
    }}
  ]},
  2:{ visitors:[
    { name:"Фермер Иван", portrait:"👨‍🌾", problem:"Засуха", description:"Поля гибнут! <span class='problem-keyword'>Засуха</span> уничтожает урожай!", solutions:{
      "nat1":{food:15,morale:8,trust:8,message:"Дождь спасает поля!"},
      "nat3":{food:8,trust:4,message:"Вода помогает частично."},
      "res3":{food:12,message:"Урожай чудесно созревает."},
      "nat2":{food:-12,safety:-8,message:"Огонь сжигает остатки!"},
      "default":{food:-6,morale:-4,message:"Засуха продолжается..."}
    }},
    { name:"Испуганная мать", portrait:"👩", problem:"Страх", description:"Дети боятся темноты. <span class='problem-keyword'>Страх</span> не даёт спать.", solutions:{
      "emo1":{morale:10,trust:6,message:"Мужество вселяет силу."},
      "emo3":{morale:8,health:3,message:"Покой успокаивает."},
      "abs3":{morale:6,safety:2,message:"Свет прогоняет тьму."},
      "emo7":{morale:-10,health:-5,message:"Страх усиливает страх!"},
      "default":{morale:-4,message:"Страх остаётся..."}
    }},
    { name:"Стражник", portrait:"💂", problem:"Угроза", description:"Бандиты рядом! <span class='problem-keyword'>Угроза</span> нападения!", solutions:{
      "res6":{safety:15,trust:8,message:"Оружие отпугивает врагов."},
      "soc4":{safety:10,morale:8,message:"Единство укрепляет защиту."},
      "nat8":{safety:8,message:"Туман скрывает поселение."},
      "emo7":{safety:-12,morale:-10,message:"Страх вызывает панику!"},
      "default":{safety:-8,morale:-4,message:"Угроза растёт..."}
    }}
  ],
  event:{ type:"discovery", title:"Найден свиток", description:"В руинах найдены слова:", words:["Щит","Молот","Ключ"], choose:1 } },
  3:{ visitors:[
    { name:"Старейшина", portrait:"👴", problem:"Раздор", description:"Люди ссорятся из-за воды. <span class='problem-keyword'>Раздор</span> разрывает общину.", solutions:{
      "soc1":{safety:18,morale:12,trust:12,message:"Мир восстановлен!"},
      "soc2":{safety:14,trust:10,message:"Справедливость торжествует."},
      "soc3":{safety:12,trust:8,message:"Закон наводит порядок."},
      "nat2":{safety:-15,health:-10,message:"Огонь! Хаос!"},
      "default":{safety:-8,morale:-6,message:"Раздор усиливается..."}
    }},
    { name:"Больная женщина", portrait:"🤒", problem:"Лихорадка", description:"Жар не спадает. <span class='problem-keyword'>Лихорадка</span> убивает.", solutions:{
      "med1":{health:10,trust:6,message:"Лекарство снижает жар."},
      "med2":{health:15,trust:10,message:"Исцеление спасает жизнь!"},
      "nat7":{health:4,message:"Лёд облегчает жар."},
      "default":{health:-8,trust:-4,message:"Лихорадка усиливается..."}
    }},
    { name:"Торговец", portrait:"🧔", problem:"Обман", description:"Меня обвиняют в <span class='problem-keyword'>Обмане</span>. Это ложь!", solutions:{
      "soc6":{trust:12,morale:8,message:"Правда раскрыта!"},
      "soc2":{trust:10,safety:5,message:"Справедливость восторжествовала."},
      "emo4":{trust:-8,safety:-10,message:"Гнев разжигает конфликт!"},
      "default":{trust:-6,morale:-4,message:"Подозрения остаются..."}
    }},
    { name:"Беженцы", portrait:"👨‍👩‍👧", problem:"Изгнание", description:"Нас прогнали. <span class='problem-keyword'>Изгнание</span> — наша судьба.", solutions:{
      "res5":{safety:8,morale:10,trust:8,message:"Убежище даёт приют."},
      "emo6":{morale:12,trust:10,message:"Любовь принимает всех."},
      "soc4":{morale:10,safety:6,message:"Единство объединяет."},
      "default":{morale:-6,trust:-4,message:"Беженцы уходят..."}
    }}
  ]},
  4:{ visitors:[
    { name:"Пророк", portrait:"🔮", problem:"Предсказание", description:"Вижу тьму впереди. <span class='problem-keyword'>Предсказание</span> мрачно.", solutions:{
      "abs4":{morale:-5,trust:8,message:"Судьба принята с достоинством."},
      "emo2":{morale:12,trust:10,message:"Надежда побеждает мрак!"},
      "abs2":{morale:-15,health:-8,message:"Тишина усиливает страх..."},
      "default":{morale:-8,trust:-4,message:"Мрачные предчувствия..."}
    }},
    { name:"Раненый воин", portrait:"🤕", problem:"Рана", description:"Глубокая <span class='problem-keyword'>Рана</span>. Кровь не останавливается.", solutions:{
      "med4":{health:12,trust:8,message:"Перевязка спасает жизнь."},
      "med2":{health:18,trust:12,message:"Исцеление закрывает рану!"},
      "nat7":{health:4,message:"Лёд замедляет кровь."},
      "nat2":{health:-10,trust:-8,message:"Огонь?! Агония!"},
      "default":{health:-10,message:"Рана кровоточит..."}
    }},
    { name:"Культист", portrait:"👤", problem:"Ересь", description:"Слова должны исчезнуть! <span class='problem-keyword'>Ересь</span> — это спасение!", solutions:{
      "soc5":{trust:15,morale:10,message:"Знание развеивает ложь."},
      "soc6":{trust:12,safety:8,message:"Правда разоблачает культ."},
      "abs2":{trust:-20,morale:-15,message:"Тишина... Культист торжествует!"},
      "default":{trust:-8,safety:-6,message:"Ересь распространяется..."}
    }},
    { name:"Умирающий старик", portrait:"👴", problem:"Забвение", description:"Память уходит. <span class='problem-keyword'>Забвение</span> близко.", solutions:{
      "abs5":{morale:15,trust:12,message:"Память возвращается!"},
      "soc5":{morale:12,trust:10,message:"Знание сохраняет разум."},
      "abs1":{morale:8,message:"Время даёт покой."},
      "default":{morale:-8,trust:-4,message:"Забвение побеждает..."}
    }}
  ],
  event:{ type:"discovery", title:"Тайник", description:"В подвале найдены слова:", words:["Врата","Клинок","Печать"], choose:2 } },
  5:{ visitors:[
    { name:"Пророк Безмолвия", portrait:"⚫", problem:"Конец", description:"Пришёл час. <span class='problem-keyword'>Конец</span> всех слов.", solutions:{
      "soc5":{health:25,food:25,safety:25,morale:25,trust:30,message:"Знание побеждает тьму! Мир спасён!"},
      "emo2":{morale:20,trust:15,message:"Надежда создаёт барьер!"},
      "emo6":{health:15,morale:20,trust:15,message:"Любовь защищает!"},
      "abs2":{health:-40,food:-40,safety:-40,morale:-40,trust:-40,message:"Тишина... Конец всего..."},
      "nat2":{safety:-25,health:-20,message:"Огонь уничтожает библиотеку!"},
      "default":{health:-20,food:-20,safety:-20,morale:-20,trust:-20,message:"Тьма поглощает мир..."}
    }},
    { name:"Последние выжившие", portrait:"👥", problem:"Отчаяние", description:"Всё кончено. <span class='problem-keyword'>Отчаяние</span> в сердцах.", solutions:{
      "emo2":{morale:18,trust:12,message:"Надежда возрождается!"},
      "emo5":{morale:15,health:8,message:"Радость возвращает силы."},
      "emo8":{morale:-20,health:-15,message:"Отчаяние усиливает отчаяние!"},
      "default":{morale:-12,health:-8,message:"Отчаяние растёт..."}
    }}
  ]},
  6:{ visitors:[
    { name:"Эпидемия", portrait:"☠️", problem:"Чума", description:"Чёрная смерть. <span class='problem-keyword'>Чума</span> косит всех.", solutions:{
      "med6":{health:15,safety:10,message:"Карантин сдерживает чуму."},
      "med2":{health:20,trust:15,message:"Исцеление спасает многих!"},
      "nat2":{health:-30,safety:-20,message:"Огонь?! Катастрофа!"},
      "default":{health:-15,trust:-8,message:"Чума распространяется..."}
    }}
  ]}
};

/* ===================== УТИЛИТЫ СЕЙВОВ ===================== */
function hasSave(){ return !!localStorage.getItem('librarian_save'); }
function saveGame(){
  const save = {
    mode:gameState.mode, day:gameState.day, stats:gameState.stats,
    usedWords:[...gameState.usedWords], discoveredWords:gameState.discoveredWords,
    canCreateNeologism:gameState.canCreateNeologism, roguelikeScore:gameState.roguelikeScore
  };
  localStorage.setItem('librarian_save', JSON.stringify(save));
}
function continueGame(){
  const raw = localStorage.getItem('librarian_save'); if (!raw) return;
  const data = JSON.parse(raw);
  resetGame();
  Object.assign(gameState, {
    mode:data.mode||'campaign', day:data.day||1, stats:data.stats||{...DEFAULT_STATS},
    usedWords:new Set(data.usedWords||[]), discoveredWords:data.discoveredWords||[],
    canCreateNeologism: data.canCreateNeologism ?? 2, roguelikeScore:data.roguelikeScore||0
  });
  gameState.snapshot = JSON.parse(JSON.stringify(gameState.stats));
  gameState.wordsUsedToday = [];
  gameState.pendingEvent = null;
  gameState.dayPhase = 'idle';
  gameState.phaseTimeout = null;
  gameState.lastSummary = null;
  enterGame(); startDay();
}

/* ===================== ИНИЦИАЛИЗАЦИЯ ===================== */
function init(){
  createParticles();
  if (hasSave()) document.getElementById('continue-btn').style.display='block';
  document.getElementById('word-search').addEventListener('input', e=>{
    const active = document.querySelector('.category-tab.active')?.dataset.category || 'all';
    renderWords(active, e.target.value);
  });
  document.addEventListener('keydown', e=>{
    if (e.key==='Escape') closeModal();
    if (e.key>='1' && e.key<='7'){ const idx=parseInt(e.key)-1; if (CATEGORIES[idx]) filterByCategory(CATEGORIES[idx]); }
    if (e.key==='Enter'){
      const btn = document.getElementById('give-word-btn');
      if (btn && !btn.disabled) giveWord();
    }
  });
}
window.addEventListener('DOMContentLoaded', init);

function createParticles(){
  for (let i=0;i<15;i++){
    const p=document.createElement('div'); p.className='ash-particle';
    p.style.left = Math.random()*100 + '%';
    p.style.animationDelay = Math.random()*12 + 's';
    p.style.animationDuration = (10 + Math.random()*8) + 's';
    document.body.appendChild(p);
  }
}

/* ===================== СТАРТ / СБРОС ===================== */
function startCampaign(){ resetGame(); gameState.mode='campaign'; enterGame(); startDay(); }
function startRoguelike(){ resetGame(); gameState.mode='roguelike'; gameState.nightDecay=5; enterGame(); startDay(); }
function resetGame(){
  gameState = {
    mode:'campaign', day:1, stats:{...DEFAULT_STATS}, currentVisitor:null, selectedWord:null,
    visitorsQueue:[], usedWords:new Set(), journal:[], canCreateNeologism:2, discoveredWords:[],
    roguelikeScore:0, ended:false, nightDecay:3, crisisFlags:{epidemic:false,famine:false,unrest:false},
    wordsUsedToday:[], snapshot:{},
    pendingEvent:null, dayPhase:'idle', phaseTimeout:null, lastSummary:null
  };
}
function enterGame(){
  document.getElementById('main-menu').style.opacity='0';
  setTimeout(()=>{
    document.getElementById('main-menu').style.display='none';
    document.getElementById('game-container').classList.add('visible');
    renderCategories(); renderWords(); updateStats(); updateWordCount();
  }, 1000);
}

/* ===================== ДЕНЬ / КРИЗИСЫ ===================== */
function clearPhaseTimer(){
  if (gameState.phaseTimeout){
    clearTimeout(gameState.phaseTimeout);
    gameState.phaseTimeout = null;
  }
}

function startDay(){
  clearPhaseTimer();
  gameState.dayPhase = 'morning';
  gameState.currentVisitor = null;
  gameState.selectedWord = null;
  gameState.pendingEvent = null;
  gameState.visitorsQueue = [];
  updateQueueIndicator();
  const box = document.getElementById('visitor-content');
  if (box) box.innerHTML = '';
  const eveningScreen = document.getElementById('evening-summary-screen');
  if (eveningScreen) eveningScreen.classList.remove('active');
  const eveningText = document.getElementById('evening-summary-text');
  if (eveningText) eveningText.textContent = '';
  const eveningMetrics = document.getElementById('evening-summary-metrics');
  if (eveningMetrics) eveningMetrics.innerHTML = '';
  const nextBtn = document.getElementById('next-day-btn');
  if (nextBtn) nextBtn.style.display = 'none';
  checkCanGiveWord();
  morningBriefing();
}

function morningBriefing(){
  const screen = document.getElementById('morning-briefing');
  const textEl = document.getElementById('morning-briefing-text');
  const metricsEl = document.getElementById('morning-briefing-metrics');
  const button = document.getElementById('begin-triage-btn');

  if (!screen || !textEl || !metricsEl || !button){
    triageQueue();
    return;
  }

  screen.classList.add('active');
  button.disabled = false;
  button.textContent = 'НАЧАТЬ ПРИЁМ';
  button.onclick = ()=>{
    button.disabled = true;
    triageQueue();
  };

  gameState.snapshot = JSON.parse(JSON.stringify(gameState.stats));
  gameState.wordsUsedToday = [];

  if (gameState.day>1) applyNightDecay();
  checkCrises();
  updateStats();
  updateDayInfo();

  const lines = [];
  const last = gameState.lastSummary;
  if (last){
    const deltaLine = last.deltaParts && last.deltaParts.length ? last.deltaParts.join(' • ') : '—';
    const wordsLine = last.wordsUsed && last.wordsUsed.length ? last.wordsUsed.join(', ') : '—';
    lines.push(`📊 Вчера: ${deltaLine}`);
    lines.push(`📝 Слова: <span>${last.wordsUsed.length}</span>${wordsLine==='—' ? '' : ' — ' + wordsLine}`);
  } else {
    lines.push('📝 Пока нет отчётов прошлых дней.');
  }

  const crisisNames = [];
  if (gameState.crisisFlags.epidemic) crisisNames.push('Эпидемия');
  if (gameState.crisisFlags.famine) crisisNames.push('Голод');
  if (gameState.crisisFlags.unrest) crisisNames.push('Беспорядки');
  lines.push(`⚠️ Кризисы: ${crisisNames.length ? `<span>${crisisNames.join(' • ')}</span>` : '—'}`);

  const statSummary = Object.keys(gameState.stats).map(stat=>`${STAT_EMOJIS[stat]||''} ${gameState.stats[stat]}`).join(' • ');
  lines.push(`📈 Показатели: ${statSummary}`);

  metricsEl.innerHTML = lines.map(line=>`<div>${line}</div>`).join('');
  textEl.innerHTML = `День ${gameState.day} начинается. Проверьте показатели и подготовьтесь к приёму посетителей.`;
}

function triageQueue(){
  clearPhaseTimer();
  gameState.dayPhase = 'triage';
  const screen = document.getElementById('morning-briefing');
  const textEl = document.getElementById('morning-briefing-text');
  const metricsEl = document.getElementById('morning-briefing-metrics');
  const button = document.getElementById('begin-triage-btn');

  if (button){
    button.textContent = 'ПОДГОТОВКА...';
    button.disabled = true;
  }
  if (textEl) textEl.textContent = 'Составляем очередь посетителей...';
  if (metricsEl) metricsEl.innerHTML = '';

  gameState.visitorsQueue = [];
  gameState.currentVisitor = null;
  gameState.pendingEvent = null;

  const notes = [];
  let queueCount = 0;

  if (gameState.mode==='campaign'){
    const dayData = campaignEvents[gameState.day];
    if (!dayData){
      if (screen) screen.classList.remove('active');
      victory();
      return;
    }
    gameState.visitorsQueue = [...dayData.visitors];
    gameState.pendingEvent = dayData.event || null;
    queueCount = gameState.visitorsQueue.length;

    if (gameState.crisisFlags.epidemic){
      gameState.visitorsQueue.push({ name:"Больные", portrait:"🤢", problem:"Эпидемия", description:"<span class='problem-keyword'>Эпидемия</span> не отступает!", solutions:{
        "med6":{health:10,message:"Карантин помогает."}, "med2":{health:15,message:"Исцеление спасает больных."}, "default":{health:-8,message:"Болезнь распространяется..."}
      }});
      notes.push('🤢 Эпидемия привела новых больных.');
    }
    if (gameState.crisisFlags.famine){
      gameState.visitorsQueue.push({ name:"Голодающие", portrait:"🍞", problem:"Голод", description:"Массовый <span class='problem-keyword'>Голод</span>!", solutions:{
        "res1":{food:10,message:"Хлеб спасает от голода."}, "res3":{food:15,message:"Урожай кормит всех."}, "default":{food:-8,morale:-5,message:"Голод усиливается..."}
      }});
      notes.push('🍞 Голодящие требуют помощи.');
    }
    if (gameState.crisisFlags.unrest){
      gameState.visitorsQueue.push({ name:"Недовольные", portrait:"🗣️", problem:"Беспорядки", description:"Ссоры и драки усиливаются!", solutions:{
        "soc1":{safety:12,morale:8,trust:6,message:"Миротворцы успокаивают спор."}, "soc2":{safety:10,trust:6,message:"Справедливое решение принято."}, "default":{safety:-6,morale:-4,message:"Ругань не смолкает..."}
      }});
      notes.push('🗣️ Усилены меры против беспорядков.');
    }
    queueCount = gameState.visitorsQueue.length;
    updateDayInfo();
  } else {
    generateRoguelikeDay(false);
    queueCount = gameState.visitorsQueue.length;
    notes.push('🎲 Рогаликовый день приносит случайных испытаний.');
  }

  updateQueueIndicator();
  checkCanGiveWord();

  if (metricsEl){
    const lines = [`👥 Посетителей: <span>${queueCount}</span>`];
    notes.forEach(note=>lines.push(note));
    metricsEl.innerHTML = lines.map(line=>`<div>${line}</div>`).join('');
  }

  gameState.phaseTimeout = setTimeout(()=>{
    if (screen) screen.classList.remove('active');
    interactionPhase();
  }, 1200);
}

function interactionPhase(){
  clearPhaseTimer();
  gameState.dayPhase = 'interaction';
  const morningScreen = document.getElementById('morning-briefing');
  if (morningScreen) morningScreen.classList.remove('active');

  const eveningScreen = document.getElementById('evening-summary-screen');
  if (eveningScreen) eveningScreen.classList.remove('active');

  const nextBtn = document.getElementById('next-day-btn');
  if (nextBtn) nextBtn.style.display = 'none';

  const eveningText = document.getElementById('evening-summary-text');
  if (eveningText) eveningText.textContent = '';
  const eveningMetrics = document.getElementById('evening-summary-metrics');
  if (eveningMetrics) eveningMetrics.innerHTML = '';

  const box = document.getElementById('visitor-content');
  if (box) box.innerHTML = '';

  if (gameState.mode==='campaign'){
    const dayData = campaignEvents[gameState.day];
    if (!dayData){ victory(); return; }
    updateDayInfo();
    if (gameState.pendingEvent){
      showDiscoveryModal(gameState.pendingEvent);
      gameState.pendingEvent = null;
    } else {
      showNextVisitor();
    }
  } else {
    if (!gameState.visitorsQueue.length){
      generateRoguelikeDay(false);
    }
    updateDayInfo();
    showNextVisitor();
  }
}

function calculateDayDelta(){
  const snapshot = gameState.snapshot || {};
  const delta = {};
  Object.keys(gameState.stats).forEach(stat=>{
    delta[stat] = (gameState.stats[stat]||0) - (snapshot[stat]||0);
  });
  const deltaParts = Object.keys(delta).map(stat=>{
    const value = delta[stat];
    if (!value) return '';
    const icon = STAT_EMOJIS[stat] || '';
    return `${icon} ${value>0?'+':''}${value}`;
  }).filter(Boolean);
  return { delta, deltaParts };
}

function eveningSummary(){
  clearPhaseTimer();
  gameState.dayPhase = 'evening';
  gameState.currentVisitor = null;
  gameState.visitorsQueue = [];
  updateQueueIndicator();
  checkCanGiveWord();

  const { delta, deltaParts } = calculateDayDelta();
  const wordsUsed = [...gameState.wordsUsedToday];
  const wordsLine = wordsUsed.length ? wordsUsed.join(', ') : '';

  const summaryText = document.getElementById('evening-summary-text');
  if (summaryText) summaryText.innerHTML = `День ${gameState.day} завершён.`;

  const metricsEl = document.getElementById('evening-summary-metrics');
  if (metricsEl){
    const lines = [
      `📊 Изменения: ${deltaParts.length ? deltaParts.join(' • ') : '—'}`,
      `📝 Потрачено слов: <span>${wordsUsed.length}</span>${wordsLine ? ' — ' + wordsLine : ''}`
    ];
    if (gameState.mode==='roguelike'){
      lines.push(`🎯 Счёт: <span>${gameState.roguelikeScore}</span>`);
    }
    metricsEl.innerHTML = lines.map(line=>`<div>${line}</div>`).join('');
  }

  const nextBtn = document.getElementById('next-day-btn');
  if (nextBtn){
    nextBtn.style.display = 'inline-block';
    nextBtn.textContent = `К ДНЮ ${gameState.day+1}`;
  }

  const eveningScreen = document.getElementById('evening-summary-screen');
  if (eveningScreen) eveningScreen.classList.add('active');

  const box = document.getElementById('visitor-content');
  if (box) box.innerHTML = '';

  gameState.lastSummary = {
    day: gameState.day,
    delta,
    deltaParts,
    wordsUsed,
    roguelikeScore: gameState.roguelikeScore
  };

  saveGame();
}


function applyNightDecay(){
  Object.keys(gameState.stats).forEach(stat=>{
    const decay = Math.floor(Math.random()*gameState.nightDecay)+1;
    gameState.stats[stat] = Math.max(0, gameState.stats[stat]-decay);
  });
  addToJournal(`Ночь прошла тревожно. Поселение ослабло.`);
  updateStats();
  showNotification("Ночные потери: все параметры снижены");
}
function checkCrises(){
  if (gameState.stats.health < 40 && !gameState.crisisFlags.epidemic){ gameState.crisisFlags.epidemic = true; showNotification("⚠️ ЭПИДЕМИЯ началась в поселении!"); }
  if (gameState.stats.food   < 35 && !gameState.crisisFlags.famine)  { gameState.crisisFlags.famine  = true; showNotification("⚠️ ГОЛОД охватил поселение!"); }
  if (gameState.stats.safety < 35 && !gameState.crisisFlags.unrest)  { gameState.crisisFlags.unrest  = true; showNotification("⚠️ БЕСПОРЯДКИ начались!"); }
}
function showNotification(text){
  const n=document.createElement('div'); n.className='event-notification'; n.textContent=text; document.body.appendChild(n); setTimeout(()=>n.remove(), 3000);
}

/* ===================== РОГАЛИК ===================== */
function generateRoguelikeDay(autoStart=true){
  const count = Math.min(2 + Math.floor(gameState.day/2), 5);
  gameState.visitorsQueue = [];
  const problems = [
    { name:"Больной", portrait:"🤒", problem:"Болезнь", stat:"health" },
    { name:"Голодный", portrait:"😔", problem:"Голод",   stat:"food" },
    { name:"Испуганный", portrait:"😰", problem:"Страх", stat:"morale" },
    { name:"Раненый", portrait:"🩸", problem:"Рана",     stat:"health" },
    { name:"Спорщик", portrait:"😤", problem:"Спор",     stat:"safety" }
  ];
  for (let i=0;i<count;i++){
    const p = problems[Math.floor(Math.random()*problems.length)];
    gameState.visitorsQueue.push({
      ...p, description:`Проблема: <span class='problem-keyword'>${p.problem}</span>`, solutions: generateRoguelikeSolutions(p.stat)
    });
  }
  updateDayInfo();
  if (autoStart) showNextVisitor();
}
function generateRoguelikeSolutions(mainStat){
  const solutions = {};
  const availableWords = [...wordsDatabase, ...gameState.discoveredWords].filter(w=>!gameState.usedWords.has(w.id));
  const picks = availableWords.slice(0, Math.min(5, availableWords.length));
  picks.forEach(word=>{
    const eff = {};
    if (word.category==='medicine' && mainStat==='health') eff.health = 10 + Math.floor(Math.random()*8);
    else if (word.category==='resource' && mainStat==='food') eff.food = 10 + Math.floor(Math.random()*8);
    else if (word.category==='social' && mainStat==='safety') eff.safety = 10 + Math.floor(Math.random()*8);
    else if (word.category==='emotion' && mainStat==='morale') eff.morale = 10 + Math.floor(Math.random()*8);
    else eff[mainStat] = 3 + Math.floor(Math.random()*5);
    eff.message = "Слово помогает.";
    solutions[word.id] = eff;
  });
  solutions.default = { [mainStat]: -5 - Math.floor(Math.random()*5), message:"Проблема усугубляется..." };
  return solutions;
}

/* ===================== UI: ДЕНЬ / ПОСЕТИТЕЛИ ===================== */
function updateDayInfo(){
  document.getElementById('day-number').textContent = gameState.day;
  if (gameState.mode==='roguelike') document.getElementById('day-description').textContent = `Счёт: ${gameState.roguelikeScore}`;
  else {
    const desc = {1:"Первые просители у порога...",2:"Беды множатся, слова тают...",3:"Кризис углубляется...",4:"Тени сгущаются над поселением...",5:"Финальное испытание...",6:"Последняя битва за выживание..."};
    document.getElementById('day-description').textContent = desc[gameState.day] || "История продолжается...";
  }
}
function updateStats(){
  Object.keys(gameState.stats).forEach(stat=>{
    const value = gameState.stats[stat];
    document.getElementById(`${stat}-value`).textContent = value;
    const el = document.querySelector(`[data-stat="${stat}"]`);
    el.querySelector('.stat-fill').style.width = `${value}%`;
    if (value<=10){ el.classList.add('critical'); el.classList.add('warning'); }
    else if (value<=25){ el.classList.remove('critical'); el.classList.add('warning'); }
    else { el.classList.remove('critical'); el.classList.remove('warning'); }
    if (value<=0 && !gameState.ended){ gameOver(stat); }
  });
}
function updateWordCount(){
  const total = wordsDatabase.length + gameState.discoveredWords.length;
  const available = total - gameState.usedWords.size;
  document.getElementById('word-count').textContent = `Доступно: ${available} из ${total}`;
  document.getElementById('neo-count').textContent = gameState.canCreateNeologism;
}

function showNextVisitor(){
  updateQueueIndicator();
  if (gameState.visitorsQueue.length===0){ endDay(); return; }
  const v = gameState.visitorsQueue.shift();
  gameState.currentVisitor = v;

  const box = document.getElementById('visitor-content');
  box.innerHTML = `
    <div class="visitor">
      <div class="visitor-portrait" id="visitor-portrait" onclick="selectVisitor()">${v.portrait}</div>
      <div class="visitor-name">${v.name}</div>
      <div class="visitor-problem">${v.description}</div>
    </div>
  `;

  const portrait = document.getElementById('visitor-portrait');
  portrait.addEventListener('dragover', e=>{ e.preventDefault(); portrait.classList.add('selected'); });
  portrait.addEventListener('drop', e=>{
    e.preventDefault();
    const wordId = e.dataTransfer.getData('text/plain');
    const word = [...wordsDatabase, ...gameState.discoveredWords].find(w=>w.id===wordId);
    if (word && !gameState.usedWords.has(wordId)){
      gameState.selectedWord = word; portrait.classList.add('selected'); giveWord();
    }
  });
  checkCanGiveWord();
}
function selectVisitor(){ document.getElementById('visitor-portrait').classList.add('selected'); checkCanGiveWord(); }
function updateQueueIndicator(){
  const q=document.getElementById('visitors-queue'); q.innerHTML='';
  const total = gameState.visitorsQueue.length + (gameState.currentVisitor?1:0);
  for (let i=0;i<total;i++){ const d=document.createElement('div'); d.className='queue-indicator'; if (i===0 && gameState.currentVisitor) d.classList.add('active'); q.appendChild(d); }
}

/* ===================== UI: СЛОВА ===================== */
function renderCategories(){
  const c=document.getElementById('word-categories'); c.innerHTML='';
  CATEGORIES.forEach(cat=>{
    const tab=document.createElement('div'); tab.className='category-tab'; if (cat==='all') tab.classList.add('active');
    tab.dataset.category = cat; tab.textContent = CATEGORY_NAMES[cat]; tab.onclick = ()=>filterByCategory(cat);
    if (cat!=='all'){ const count=getAvailableWordsInCategory(cat); if (count>0){ const b=document.createElement('span'); b.className='category-count'; b.textContent=count; tab.appendChild(b);} }
    c.appendChild(tab);
  });
}
function getAvailableWordsInCategory(category){
  const all=[...wordsDatabase, ...gameState.discoveredWords];
  return all.filter(w=>w.category===category && !gameState.usedWords.has(w.id)).length;
}
function filterByCategory(category){
  document.querySelectorAll('.category-tab').forEach(t=>t.classList.remove('active'));
  document.querySelector(`[data-category="${category}"]`).classList.add('active');
  renderWords(category);
}
function renderWords(category='all', search=''){
  const container = document.getElementById('words-container');
  const s = (search || document.getElementById('word-search').value || '').toLowerCase();
  let words = [...wordsDatabase, ...gameState.discoveredWords];
  if (category!=='all') words = words.filter(w=>w.category===category);
  if (s) words = words.filter(w=>w.text.toLowerCase().includes(s));
  container.innerHTML = '';
  words.forEach(word=>{
    const el=document.createElement('div'); el.className='word'; el.textContent=word.text; el.dataset.id=word.id;
    if (gameState.discoveredWords.includes(word)) el.classList.add('neologism');
    if (word.tooltip){ const tip=document.createElement('div'); tip.className='word-tooltip'; tip.textContent=word.tooltip; el.appendChild(tip); }
    if (gameState.usedWords.has(word.id)) el.classList.add('used');
    else {
      el.onclick = ()=>selectWord(word);
      el.draggable = true;
      el.addEventListener('dragstart', e=>{ e.dataTransfer.setData('text/plain', word.id); });
    }
    container.appendChild(el);
  });
}
function selectWord(word){
  if (gameState.usedWords.has(word.id)) return;
  document.querySelectorAll('.word').forEach(w=>w.classList.remove('selected'));
  document.querySelector(`.word[data-id="${word.id}"]`)?.classList.add('selected');
  gameState.selectedWord = word; checkCanGiveWord();
}
function checkCanGiveWord(){
  const hasVisitor = !!document.getElementById('visitor-portrait')?.classList.contains('selected');
  const hasWord = !!gameState.selectedWord;
  document.getElementById('give-word-btn').disabled = !(hasVisitor && hasWord);
}

/* ===================== ВЫДАЧА СЛОВА ===================== */
function giveWord(){
  if (!gameState.selectedWord || !gameState.currentVisitor) return;
  const word = gameState.selectedWord;
  const visitor = gameState.currentVisitor;

  createWordEffect(word.text);
  gameState.usedWords.add(word.id);
  gameState.wordsUsedToday.push(word.text);

  const result = (visitor.solutions && (visitor.solutions[word.id] || visitor.solutions.default)) || { health:-3, message:"Слово не помогает..." };
  applyEffects(result);
  showResult(word.text, result.message, result);
  addToJournal(`День ${gameState.day}: "${word.text}" → ${visitor.name}`);

  if (gameState.mode==='roguelike'){
    const positives = Object.keys(result).filter(k=>k!=='message' && result[k]>0).length;
    gameState.roguelikeScore += positives * 10;
  }

  gameState.selectedWord = null; gameState.currentVisitor = null;
  document.getElementById('give-word-btn').disabled = true;
  renderCategories(); renderWords(); updateWordCount();

  setTimeout(()=>showNextVisitor(), 2000);
}
function createWordEffect(text){
  const d=document.createElement('div'); d.className='word-effect'; d.textContent=text; document.body.appendChild(d); setTimeout(()=>d.remove(), 3000);
}
function applyEffects(result){
  Object.keys(gameState.stats).forEach(stat=>{
    if (result[stat]) gameState.stats[stat] = Math.max(0, Math.min(100, gameState.stats[stat] + result[stat]));
  });
  updateStats();
}
function showResult(word, message, effects){
  const div=document.createElement('div'); div.className='result-message';
  const em = {health:'❤️', food:'🌾', safety:'🛡️', morale:'💚', trust:'🤝'};
  let statsHtml = '<div class="stat-changes">';
  Object.keys(effects).forEach(k=>{
    if (k==='message' || !effects[k]) return;
    const cls = effects[k]>0 ? 'positive' : 'negative';
    statsHtml += `<span class="stat-change ${cls}">${em[k]||''} ${effects[k]>0?'+':''}${effects[k]}</span>`;
  });
  statsHtml += '</div>';
  div.innerHTML = `<h3>Использовано: "${word}"</h3><p>${message||''}</p>${statsHtml}`;
  document.body.appendChild(div);
  setTimeout(()=>div.remove(), 2500);
}

/* ===================== ДНЕВНИК / МОДАЛКИ ===================== */
function addToJournal(text){
  gameState.journal.push(text);
  const cont=document.getElementById('journal-content');
  const e=document.createElement('div'); e.className='journal-entry'; e.textContent=text; cont.appendChild(e); cont.scrollTop = cont.scrollHeight;
}
function closeModal(){ document.querySelector('.modal')?.remove(); }

/* ===================== DISCOVERY (находки) ===================== */
let selectedDiscoveries = [];
function showDiscoveryModal(event){
  selectedDiscoveries = [];
  const modal=document.createElement('div'); modal.className='modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>${event.title}</h3>
      <p>${event.description}</p>
      <div class="word-selector">
        ${event.words.map(w=>`<div class="word-option" onclick="selectDiscoveredWord(this,'${w}')">${w}</div>`).join('')}
      </div>
      <p>Выберите <b>${event.choose}</b> слов(а)</p>
      <div class="action-buttons" style="margin-top:10px">
        <button class="action-button" onclick="confirmDiscovery(${event.choose})">Подтвердить</button>
        <button class="action-button" onclick="closeModal()">Отмена</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}
function selectDiscoveredWord(el, word){
  const i = selectedDiscoveries.indexOf(word);
  if (i>-1){ selectedDiscoveries.splice(i,1); el.classList.remove('selected'); }
  else {
    el.classList.add('selected');
    selectedDiscoveries.push(word);
  }
}
function confirmDiscovery(maxCount){
  if (selectedDiscoveries.length !== maxCount){ alert(`Нужно выбрать ровно ${maxCount} слов(а)`); return; }
  selectedDiscoveries.forEach(word=>{
    const newWord = { text:word, category:'abstract', id:'disc_'+Date.now()+'_'+word, tooltip:'Найденное слово' };
    gameState.discoveredWords.push(newWord);
    addToJournal(`Найдено слово: "${word}"`);
  });
  closeModal();
  renderWords(); updateWordCount(); showNextVisitor();
}

/* ===================== НЕОЛОГИЗМЫ ===================== */
let neoSelected = [];
function openNeologismModal(){
  if (gameState.canCreateNeologism<=0){ showResult('','Вы исчерпали силу создания слов',{ }); return; }
  neoSelected = [];
  const available = [...wordsDatabase, ...gameState.discoveredWords].filter(w=>!gameState.usedWords.has(w.id));
  const modal=document.createElement('div'); modal.className='modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Создание неологизма</h3>
      <p>Выберите <b>2–3</b> слова-основы, затем введите название:</p>
      <div class="word-selector">
        ${available.map(w=>`<div class="word-option" onclick="toggleNeoWord(this,'${w.id}')">${w.text}</div>`).join('')}
      </div>
      <input type="text" class="word-search" placeholder="Название нового слова..." id="neo-name" style="margin-top:10px;">
      <div class="action-buttons" style="margin-top:10px">
        <button class="action-button" onclick="createNeologism()">Создать</button>
        <button class="action-button" onclick="closeModal()">Отмена</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}
function toggleNeoWord(el, id){
  const pool = [...wordsDatabase, ...gameState.discoveredWords];
  const w = pool.find(x=>x.id===id);
  const i = neoSelected.findIndex(x=>x.id===id);
  if (i>-1){ neoSelected.splice(i,1); el.classList.remove('selected'); }
  else { if (neoSelected.length>=3) return; neoSelected.push(w); el.classList.add('selected'); }
}
function createNeologism(){
  const name = document.getElementById('neo-name').value.trim();
  if (!name){ alert('Введите название нового слова'); return; }
  if (neoSelected.length<2){ alert('Выберите минимум 2 слова-основы'); return; }

  // сжечь исходники
  neoSelected.forEach(w=> gameState.usedWords.add(w.id));
  // составить подсказку
  const tooltip = `Создано из: ${neoSelected.map(w=>w.text).join(' + ')}`;
  const newWord = { text:name, category:'abstract', id:'neo_'+Date.now(), tooltip };
  gameState.discoveredWords.push(newWord);
  gameState.canCreateNeologism--;

  closeModal();
  addToJournal(`Создан неологизм: "${name}" (${tooltip})`);
  renderCategories(); renderWords(); updateWordCount();
  showResult(name, `Новое слово «${name}» добавлено в книгу!`, { trust:5 });
}

/* ===================== КОНЕЦ ДНЯ / КОНЦОВКИ ===================== */
function endDay(){
  if (gameState.ended) return;
  eveningSummary();
}

function nextDay(){
  clearPhaseTimer();
  const nextBtn = document.getElementById('next-day-btn');
  if (nextBtn) nextBtn.style.display='none';
  const eveningScreen = document.getElementById('evening-summary-screen');
  if (eveningScreen) eveningScreen.classList.remove('active');
  const eveningText = document.getElementById('evening-summary-text');
  if (eveningText) eveningText.textContent = '';
  const eveningMetrics = document.getElementById('evening-summary-metrics');
  if (eveningMetrics) eveningMetrics.innerHTML = '';
  gameState.day++;
  gameState.pendingEvent = null;
  gameState.currentVisitor = null;
  gameState.visitorsQueue = [];
  if (gameState.mode==='roguelike'){
    Object.keys(gameState.stats).forEach(k=>{
      gameState.stats[k] = Math.max(0, gameState.stats[k] - Math.floor(Math.random()*4));
    });
    updateStats();
  }
  startDay();
}

function gameOver(failedStat){
  if (gameState.ended) return; gameState.ended=true;
  const text = { health:"Эпидемия уничтожила поселение…", food:"Голод погубил последних выживших…", safety:"Хаос разрушил общину…", morale:"Люди потеряли волю к жизни…", trust:"Жители изгнали библиотекаря…" }[failedStat] || 'Провал…';
  const d=document.createElement('div'); d.className='game-over';
  d.innerHTML = `
    <div class="game-over-content">
      <h1 class="defeat">КОНЕЦ</h1>
      <p style="font-size:1.2em; margin-bottom:16px;">${text}</p>
      <p>Прожито дней: ${gameState.day}</p>
      <p>Потрачено слов: ${gameState.usedWords.size}</p>
      ${gameState.mode==='roguelike' ? `<p>Счёт: ${gameState.roguelikeScore}</p>` : ''}
      <div class="action-buttons" style="margin-top:14px;">
        <button class="action-button" onclick="location.reload()">НАЧАТЬ ЗАНОВО</button>
      </div>
    </div>`;
  document.body.appendChild(d);
}
function victory(){
  const remaining = wordsDatabase.length + gameState.discoveredWords.length - gameState.usedWords.size;
  let cls='neutral', msg='Поселение выжило…';
  if (remaining>30) { cls='victory'; msg='Вы спасли людей и сохранили язык!'; }
  else if (remaining<10){ cls='defeat'; msg='Выжили, но язык почти утрачен…'; }
  const d=document.createElement('div'); d.className='game-over';
  d.innerHTML = `
    <div class="game-over-content">
      <h1 class="${cls}">${cls==='victory'?'ПОБЕДА!':'КОНЕЦ ИСТОРИИ'}</h1>
      <p style="font-size:1.2em; margin-bottom:16px;">${msg}</p>
      <p>Пройдено дней: ${gameState.day}</p>
      <p>Сохранено слов: ${remaining}</p>
      <div class="action-buttons" style="margin-top:14px;">
        <button class="action-button" onclick="location.reload()">НОВАЯ ИГРА</button>
      </div>
    </div>`;
  document.body.appendChild(d);
}
