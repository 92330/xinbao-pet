/**
 * 欣宝小宠 - 主应用逻辑
 * 包含全部游戏系统：宠物/任务/商店/背包/家具/地图/相册/签到/小游戏/家长控制
 */
'use strict';

// ============ 全局状态 ============
let S = null;           // 存档状态
const D = window.GAME_DATA; // 静态数据
let currentPage = 'home';
let toastTimer = null;

// ============ 工具函数 ============
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function toast(msg, duration=2000) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.add('hidden'), duration);
}

function floatReward(text, x, y) {
  const el = document.createElement('div');
  el.className = 'float-reward';
  el.textContent = text;
  el.style.left = (x||window.innerWidth/2) + 'px';
  el.style.top = (y||window.innerHeight/2) + 'px';
  $('#floatRewards').appendChild(el);
  setTimeout(()=>el.remove(), 1500);
}

function showModal(title, bodyHTML, footerHTML) {
  $('#modalTitle').textContent = title || '';
  $('#modalBody').innerHTML = bodyHTML || '';
  $('#modalFooter').innerHTML = footerHTML || '';
  $('#modalMask').classList.remove('hidden');
}
function closeModal() { $('#modalMask').classList.add('hidden'); }
$('#modalMask').addEventListener('click', (e)=>{ if(e.target.id==='modalMask') closeModal(); });

function openFullscreen(html) {
  $('#fullscreen').innerHTML = html;
  $('#fullscreen').classList.remove('hidden');
}
function closeFullscreen() {
  $('#fullscreen').classList.add('hidden');
  $('#fullscreen').innerHTML = '';
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.getMonth()+1 + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
}

// 加减金币
function addCoin(n) {
  S.coin += n;
  if (S.coin < 0) S.coin = 0;
  $('#coinNum').textContent = S.coin;
  Storage.save();
}
// 增加当前宠物的亲密度
function addIntimacy(n) {
  const pet = getActivePet();
  if (!pet) return;
  pet.intimacy = Math.min(1000, pet.intimacy + n);
  pet.mood = Math.min(100, pet.mood + Math.floor(n/2));
  gainExp(pet, n);
  Storage.save();
}
function spendCoin(n) {
  if (S.coin < n) { toast('金币不足~'); Sound.play('error'); return false; }
  S.coin -= n;
  $('#coinNum').textContent = S.coin;
  Storage.save();
  return true;
}

// 获取当前出战宠物
function getActivePet() {
  return S.pets.find(p => p.id === S.activePetId) || S.pets[0];
}
// 按defId查找宠物是否拥有
function hasPetDef(defId) {
  return S.pets.some(p => p.defId === defId);
}

// ============ 音效系统（WebAudio合成） ============
const Sound = {
  ctx: null,
  ensure() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext||window.webkitAudioContext)(); } catch(e){}
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  beep(freq=600, dur=0.08, type='sine', vol=0.15) {
    if (!S || !S.sound.effect) return;
    this.ensure();
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g); g.connect(this.ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.stop(this.ctx.currentTime + dur);
  },
  play(type) {
    if (!S || !S.sound.effect) return;
    switch(type) {
      case 'click': this.beep(800, 0.05, 'sine', 0.1); break;
      case 'coin':  this.beep(1200,0.08,'triangle',0.15); setTimeout(()=>this.beep(1600,0.1,'triangle',0.12),60); break;
      case 'eat':   this.beep(400, 0.15,'sawtooth',0.1); break;
      case 'pet':   this.beep(600, 0.12,'sine',0.12); break;
      case 'buy':   this.beep(900, 0.08); setTimeout(()=>this.beep(1300,0.1),80); break;
      case 'error': this.beep(200, 0.2,'square',0.12); break;
      case 'fail':  this.beep(250, 0.18,'sawtooth',0.12); setTimeout(()=>this.beep(180,0.15,'sawtooth',0.1),100); break;
      case 'levelup':[523,659,784,1047].forEach((f,i)=>setTimeout(()=>this.beep(f,0.15,'triangle',0.15),i*100)); break;
      case 'success':[659,784,1047].forEach((f,i)=>setTimeout(()=>this.beep(f,0.12,'sine',0.15),i*80)); break;
    }
  },
  bgm: null,
  startBGM() {
    if (!S || !S.sound.bgm) return;
    this.ensure();
    if (!this.ctx || this.bgm) return;
    // 简单循环旋律
    const notes = [523,587,659,784,659,587,523,440, 523,587,659,784,880,784,659,523];
    let i = 0;
    const playNote = () => {
      if (!S.sound.bgm || !this.ctx) return;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine'; o.frequency.value = notes[i%notes.length];
      g.gain.value = 0.04;
      o.connect(g); g.connect(this.ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      o.stop(this.ctx.currentTime + 0.5);
      i++;
    };
    this.bgm = setInterval(playNote, 500);
    playNote();
  },
  stopBGM() {
    if (this.bgm) { clearInterval(this.bgm); this.bgm = null; }
  }
};

// ============ 页面导航 ============
function switchPage(name) {
  currentPage = name;
  $$('.page').forEach(p => p.classList.remove('active'));
  $('#page-'+name).classList.add('active');
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.page===name));
  Sound.play('click');
  // 渲染对应页面
  if (name==='home') renderHome();
  else if (name==='task') renderTaskPage();
  else if (name==='shop') renderShop();
  else if (name==='album') renderAlbum();
  else if (name==='game') renderGameCenter();
}

// ============ 每日刷新 ============
function dailyRefresh() {
  const today = Storage.todayStr();
  const monday = Storage.mondayStr();
  const month = Storage.monthStr();
  let changed = false;

  // 每周一统计重置
  if (S.stats.weekStart !== monday) {
    S.stats.weekStart = monday;
    S.stats.weekTasks = 0;
    S.stats.weekAnswers = 0;
    S.stats.weekCoins = 0;
    S.stats.weekIntimacyStart = getActivePet().intimacy;
    changed = true;
  }
  // 月份挑战重置
  if (S.monthlyChallenge.month !== month) {
    S.monthlyChallenge = { month, signDays:0, answerRight:0, tasksDone:0, rewards:[] };
    changed = true;
  }
  // 新的一天：签到、运势、事件、任务重置
  if (S.lastOpenDate !== today) {
    S.lastOpenDate = today;
    // 任务重置
    S.tasks.forEach(t => t.done = false);
    // 答题次数重置
    S.dailyAnswer = { date:today, count:0 };
    // 随机事件重置
    S.dailyEvent = { date:today, triggered:false };
    // 小游戏次数重置
    S.dailyMiniGame = { date:today, frisbee:3, puzzle:1 };
    // 月卡每日
    if (S.monthCard.active && S.monthCard.daysLeft > 0) {
      if (S.monthCard.lastClaim !== today) {
        S.monthCard.daysLeft--;
        if (S.monthCard.daysLeft <= 0) S.monthCard.active = false;
        S.monthCard.lastClaim = today;
      }
    }
    changed = true;
    // 自动签到
    autoSign();
    // 随机运势
    rollFortune();
    // 随机事件
    rollRandomEvent();
  }

  // 宠物属性衰减（按小时计算）
  decayPets();

  if (changed) Storage.save();
}

// 自动签到
function autoSign() {
  const today = Storage.todayStr();
  if (S.lastSignDate === today) return;
  // 判断是否连续
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
  const yStr = yesterday.getFullYear()+'-'+(yesterday.getMonth()+1)+'-'+yesterday.getDate();
  if (S.lastSignDate === yStr) {
    S.signStreak = S.signStreak >= 7 ? 1 : S.signStreak + 1;
  } else {
    S.signStreak = 1;
  }
  S.lastSignDate = today;
  const reward = S.signStreak * 10;
  addCoin(reward);
  S.monthlyChallenge.signDays++;
  setTimeout(()=>{
    showModal('📅 每日签到', `
      <div style="text-align:center;padding:10px">
        <div style="font-size:48px;margin-bottom:10px">🎉</div>
        <div style="font-size:16px;margin-bottom:8px">连续签到第 ${S.signStreak} 天</div>
        <div style="color:#FF9800;font-size:18px;font-weight:bold">+${reward} 金币</div>
      </div>
    `, `<button class="btn-primary" onclick="closeModal()">领取</button>`);
    Sound.play('coin');
  }, 500);
}

// 每日运势
function rollFortune() {
  const today = Storage.todayStr();
  if (S.dailyFortune.date === today && S.dailyFortune.id) return;
  const f = D.FORTUNES[Math.floor(Math.random()*D.FORTUNES.length)];
  S.dailyFortune = { date:today, id:f.id, text:f.text, effect:f.effect };
}

// 随机事件
function rollRandomEvent() {
  if (S.dailyEvent.triggered) return;
  if (Math.random() > 0.3) return; // 30%概率
  const ev = D.RANDOM_EVENTS[Math.floor(Math.random()*D.RANDOM_EVENTS.length)];
  S.dailyEvent.triggered = true;
  setTimeout(()=>{
    let effectText = '';
    if (ev.effect.mood) {
      S.pets.forEach(p => p.mood = Math.min(100, p.mood + ev.effect.mood));
      effectText = `所有宠物心情+${ev.effect.mood}`;
    }
    if (ev.effect.coin) {
      addCoin(ev.effect.coin);
      effectText = `金币+${ev.effect.coin}`;
    }
    if (ev.effect.item) {
      S.inventory[ev.effect.item] = (S.inventory[ev.effect.item]||0) + 1;
      effectText = `获得 ${D.FOOD_DEFS.find(f=>f.id===ev.effect.item)?.name||'物品'}`;
    }
    Storage.save();
    showModal('✨ 今日惊喜', `
      <div style="text-align:center;padding:10px">
        <div style="font-size:18px;margin-bottom:10px">${ev.text}</div>
        <div style="color:#FF9800;font-size:16px;font-weight:bold">${effectText}</div>
      </div>
    `, `<button class="btn-primary" onclick="closeModal()">好耶！</button>`);
    Sound.play('success');
  }, 1200);
}

// 宠物属性衰减
function decayPets() {
  const now = Date.now();
  S.pets.forEach(p => {
    const hours = (now - p.lastUpdate) / 3600000;
    if (hours < 0.1) return;
    const hDecay = Math.floor(hours * 2);  // 饱腹每小时-2
    const mDecay = Math.floor(hours * 1);  // 心情每小时-1
    p.hunger = Math.max(0, p.hunger - hDecay);
    p.mood = Math.max(0, p.mood - mDecay);
    // 饱腹归零则生病
    if (p.hunger <= 0 && !p.sick) {
      p.sick = true;
    }
    // 生病每天额外-15亲密（按小时折算）
    if (p.sick) {
      p.intimacy = Math.max(0, p.intimacy - Math.floor(hours * 15 / 24));
    }
    p.lastUpdate = now;
  });
}

// ============ 主页渲染 ============
function renderHome() {
  updateWeather();
  renderPetDisplay();
  renderPetStatus();
  renderInteractions();
  renderPetSwitcher();
  renderFurnitureLayer();
  renderWeatherAndTraveler();
  checkAchievements();
  checkBadges();
  checkNewReplies();
}

// 渲染天气效果和旅行者图标
function renderWeatherAndTraveler() {
  const w = getWeatherInfo();
  const weatherBar = $('#weatherBar');
  if (weatherBar) {
    weatherBar.innerHTML = `<span style="font-size:18px">${w.emoji}</span><span style="font-size:12px;color:#5a6a7c">${w.name}</span>`;
  }
  const fxLayer = $('#weatherFx');
  if (fxLayer) {
    fxLayer.innerHTML = renderWeatherEffect();
  }
  // 旅行者图标
  const travelerBtn = $('#travelerBtn');
  if (travelerBtn) {
    if (S.travelers.current) {
      travelerBtn.style.display = 'flex';
      travelerBtn.innerHTML = `<span style="font-size:24px;animation:bounce 1s infinite">${S.travelers.current.emoji}</span>`;
    } else {
      travelerBtn.style.display = 'none';
    }
  }
  // 称号显示
  const titleEl = $('#userTitle');
  if (titleEl) {
    const tn = getCurrentTitleName();
    titleEl.textContent = tn ? '【'+tn+'】' : '';
  }
}

// 渲染宠物展示（图层叠加）
function renderPetDisplay() {
  const pet = getActivePet();
  const def = D.PET_DEFS[pet.defId];
  const display = $('#petDisplay');
  // 等级缩放
  const scale = 1 + (pet.level - 1) * 0.04;
  let accHTML = '';
  // body 饰品
  if (pet.wearings.body) {
    const a = D.ACCESSORY_DEFS.find(x=>x.id===pet.wearings.body);
    if (a) accHTML += `<div class="pet-acc body" style="font-size:${50*scale}px">${a.emoji}</div>`;
  }
  // 头部饰品
  if (pet.wearings.head) {
    const a = D.ACCESSORY_DEFS.find(x=>x.id===pet.wearings.head);
    if (a) accHTML += `<div class="pet-acc head" style="font-size:${42*scale}px">${a.emoji}</div>`;
  }
  // 脸部饰品
  if (pet.wearings.face) {
    const a = D.ACCESSORY_DEFS.find(x=>x.id===pet.wearings.face);
    if (a) accHTML += `<div class="pet-acc face" style="font-size:${32*scale}px">${a.emoji}</div>`;
  }
  // 背部饰品
  if (pet.wearings.back) {
    const a = D.ACCESSORY_DEFS.find(x=>x.id===pet.wearings.back);
    if (a) accHTML += `<div class="pet-acc back" style="font-size:${38*scale}px">${a.emoji}</div>`;
  }
  const sickIcon = pet.sick ? '<div class="pet-sick-icon">🤢</div>' : '';
  display.innerHTML = `
    <div class="pet-stage" onclick="petTalk()">
      <div class="pet-level-badge">Lv.${pet.level}</div>
      ${sickIcon}
      <div class="pet-body ${pet.sick?'sick':''}" style="font-size:${120*scale}px;transform:scale(${scale})">${def.emoji}</div>
      ${accHTML}
    </div>
  `;
}

// 渲染状态条
function renderPetStatus() {
  const pet = getActivePet();
  const needExp = pet.level * 100;
  $('#petStatus').innerHTML = `
    <div class="status-row">
      <span class="status-icon">🍖</span>
      <span class="status-label">饱腹</span>
      <div class="status-bar"><div class="status-fill hunger" style="width:${pet.hunger}%"></div></div>
      <span class="status-val">${pet.hunger}/100</span>
    </div>
    <div class="status-row">
      <span class="status-icon">😊</span>
      <span class="status-label">心情</span>
      <div class="status-bar"><div class="status-fill mood" style="width:${pet.mood}%"></div></div>
      <span class="status-val">${pet.mood}/100</span>
    </div>
    <div class="status-row">
      <span class="status-icon">💖</span>
      <span class="status-label">亲密</span>
      <div class="status-bar"><div class="status-fill intimacy" style="width:${Math.min(100,pet.intimacy/10)}%"></div></div>
      <span class="status-val">${pet.intimacy}/1000</span>
    </div>
    <div class="status-row" style="margin-top:4px">
      <span class="status-icon">⭐</span>
      <span class="status-label">经验</span>
      <div class="status-bar"><div class="status-fill" style="width:${(pet.exp/needExp)*100}%;background:linear-gradient(90deg,#90CAF9,#5B9BD5)"></div></div>
      <span class="status-val">${pet.exp}/${needExp}</span>
    </div>
  `;
}

// 渲染互动按钮
function renderInteractions() {
  const pet = getActivePet();
  const today = Storage.todayStr();
  if (!S.dailyInteract[today]) S.dailyInteract[today] = {};
  const row = $('#interactionRow');
  row.innerHTML = D.INTERACTIONS.map(act => {
    const key = pet.id + '_' + act.id;
    const isFree = !S.dailyInteract[today][key];
    return `<button class="interaction-btn ${isFree?'free':''}" onclick="doInteract('${act.id}')">
      <span class="ia-emoji">${act.emoji}</span>
      <span class="ia-name">${act.name}</span>
      <span class="ia-cost">${isFree?'免费':'-20金'}</span>
    </button>`;
  }).join('');
}

// 多宠切换器
function renderPetSwitcher() {
  const sw = $('#petSwitcher');
  if (S.pets.length <= 1) { sw.innerHTML = ''; return; }
  sw.innerHTML = S.pets.map(p => {
    const def = D.PET_DEFS[p.defId];
    return `<div class="pet-switch-item ${p.id===S.activePetId?'active':''} ${p.sick?'sick':''}"
              onclick="switchPet('${p.id}')" title="${p.name}">${def.emoji}</div>`;
  }).join('');
}

function switchPet(id) {
  S.activePetId = id;
  Storage.save();
  Sound.play('click');
  renderHome();
}

// 获取当前宠物的已放置家具列表
function getPlacedFurn() {
  const pet = getActivePet();
  if (!S.placedFurniture[pet.id]) S.placedFurniture[pet.id] = [];
  return S.placedFurniture[pet.id];
}

// 渲染已放置家具（主页背景）
function renderFurnitureLayer() {
  const layer = $('#furnitureLayer');
  layer.innerHTML = '';
  const scene = $('#homeScene');
  const w = scene.clientWidth || 360;
  const h = scene.clientHeight || 400;
  const cellSize = Math.min(w, h) / 7;
  const placed = getPlacedFurn();
  placed.forEach(f => {
    const def = D.FURNITURE_DEFS.find(x=>x.id===f.id);
    if (!def) return;
    const el = document.createElement('div');
    el.className = 'furniture-item';
    el.textContent = def.emoji;
    el.style.left = (f.x * cellSize) + 'px';
    el.style.top = (f.y * cellSize) + 'px';
    el.style.width = (def.size[0] * cellSize) + 'px';
    el.style.height = (def.size[1] * cellSize) + 'px';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    if (f.rotate) el.style.transform = `rotate(${f.rotate*90}deg)`;
    layer.appendChild(el);
  });
}

// 宠物悄悄话
function petTalk() {
  const pet = getActivePet();
  let category = 'normal';
  if (pet.sick) category = 'sick';
  else if (pet.hunger < 30) category = 'hungry';
  else if (pet.intimacy >= 500) category = 'love';
  else if (pet.mood >= 70) category = 'happy';
  const talks = D.PET_TALKS[category];
  const text = talks[Math.floor(Math.random()*talks.length)];
  const t = $('#petTalk');
  t.textContent = text;
  t.classList.remove('hidden');
  // 定位到宠物上方
  t.style.top = '8%';
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>t.classList.add('hidden'), 2500);
  Sound.play('pet');
}

// 互动
function doInteract(actId) {
  const pet = getActivePet();
  const act = D.INTERACTIONS.find(a=>a.id===actId);
  if (!act) return;
  if (pet.sick) { toast('宠物生病了，先治好它吧~'); return; }
  const today = Storage.todayStr();
  if (!S.dailyInteract[today]) S.dailyInteract[today] = {};
  const key = pet.id + '_' + act.id;
  const isFree = !S.dailyInteract[today][key];
  let cost = 0;
  if (!isFree) {
    // 检查互动券
    if ((S.inventory['coupon_interact']||0) > 0) {
      S.inventory['coupon_interact']--;
      toast('使用互动券抵扣~');
    } else {
      cost = 20;
      if (!spendCoin(cost)) return;
    }
  } else {
    S.dailyInteract[today][key] = true;
  }
  // 亲密加成
  let intimacy = act.intimacy;
  if (S.dailyFortune.effect === 'interact_boost') intimacy = Math.floor(intimacy * 1.5);
  // 家具加成
  if (act.id==='frisbee' && hasFurniture('frisbee')) intimacy += 5;
  if (act.id==='bath' && hasFurniture('bath')) intimacy += 5;
  pet.intimacy = Math.min(1000, pet.intimacy + intimacy);
  pet.mood = Math.min(100, pet.mood + Math.floor(intimacy/2));
  gainExp(pet, intimacy);
  S.dailyInteract[today] = S.dailyInteract[today] || {};
  Storage.save();
  Sound.play('pet');
  floatReward('💖+' + intimacy, window.innerWidth/2, window.innerHeight/2);
  playAnim(act.anim);
  renderHome();
}

function hasFurniture(fid) {
  return getPlacedFurn().some(f=>f.id===fid);
}

// 互动动画
function playAnim(anim) {
  const body = $('#petDisplay .pet-body');
  if (!body) return;
  const orig = body.style.transform;
  let keyframes = '';
  if (anim==='happy') keyframes = 'animHappy 0.6s';
  else if (anim==='bubble') keyframes = 'animBubble 0.8s';
  else if (anim==='run') keyframes = 'animRun 0.6s';
  else if (anim==='jump') keyframes = 'animJump 0.6s';
  else if (anim==='shine') keyframes = 'animShine 0.6s';
  // 注入临时动画
  const styleId = 'tempAnim';
  let st = document.getElementById(styleId);
  if (!st) { st = document.createElement('style'); st.id = styleId; document.head.appendChild(st); }
  st.textContent = `
    @keyframes animHappy{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-20px) rotate(-5deg)}}
    @keyframes animBubble{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
    @keyframes animRun{0%,100%{transform:translateX(0)}25%{transform:translateX(-15px)}75%{transform:translateX(15px)}}
    @keyframes animJump{0%,100%{transform:translateY(0)}50%{transform:translateY(-30px)}}
    @keyframes animShine{0%,100%{filter:brightness(1)}50%{filter:brightness(1.5) drop-shadow(0 0 10px gold)}}
  `;
  body.style.animation = keyframes;
  setTimeout(()=>{ body.style.animation = 'petBounce 2.5s ease-in-out infinite'; }, 700);
}

// 经验与升级
function gainExp(pet, exp) {
  pet.exp += exp;
  let needExp = pet.level * 100;
  while (pet.exp >= needExp && pet.level < 10) {
    pet.exp -= needExp;
    pet.level++;
    needExp = pet.level * 100;
    // 升级奖励
    toast(`🎉 ${pet.name} 升到 ${pet.level} 级！`);
    Sound.play('levelup');
    // 技能解锁提示
    if (D.SKILL_DEFS[pet.level]) {
      const sk = D.SKILL_DEFS[pet.level];
      setTimeout(()=>toast(`✨ 解锁技能：${sk.name}`), 800);
    }
  }
  if (pet.level >= 10) pet.exp = Math.min(pet.exp, needExp);
}

// 一起玩
function btnPlayAll() {
  if (S.pets.length < 2) { toast('只有1只宠物，无法一起玩~'); return; }
  const today = Storage.todayStr();
  if (S.dailyPlayAll.date !== today) S.dailyPlayAll = { date:today, count:0 };
  if (S.dailyPlayAll.count >= 2) { toast('今日一起玩次数已用完，明天再来吧~'); return; }
  if (!spendCoin(20)) return;
  S.dailyPlayAll.count++;
  S.pets.forEach(p => {
    if (!p.sick) p.mood = Math.min(100, p.mood + 5);
    gainExp(p, 2);
  });
  Storage.save();
  Sound.play('success');
  floatReward('所有宠物心情+5 🎉', window.innerWidth/2, window.innerHeight/2);
  // 追逐动画
  $$('.pet-switch-item').forEach((el,i)=>{
    el.style.transition = 'transform 0.6s';
    el.style.transform = `translateX(${i%2?20:-20}px)`;
    setTimeout(()=>el.style.transform='', 600);
  });
  renderHome();
}

// ============ 宠物详情页 ============
function openPetDetail() {
  const pet = getActivePet();
  const def = D.PET_DEFS[pet.defId];
  let skillsHTML = '';
  for (let lv=3; lv<=9; lv+=2) {
    const sk = D.SKILL_DEFS[lv];
    const unlocked = pet.level >= lv;
    skillsHTML += `<div class="skill-chip ${unlocked?'':'locked'}">${sk.emoji} ${sk.name} ${unlocked?'':'🔒'}</div>`;
  }
  let wearingsHTML = '';
  Object.entries(pet.wearings).forEach(([slot, id])=>{
    if (id) {
      const a = D.ACCESSORY_DEFS.find(x=>x.id===id);
      if (a) wearingsHTML += `<div class="wearing-chip" onclick="removeWearing('${slot}')">${a.emoji} ${a.name} ✖</div>`;
    }
  });
  if (!wearingsHTML) wearingsHTML = '<span style="color:#8aa5b8;font-size:13px">暂未佩戴饰品</span>';

  const scale = 1 + (pet.level - 1) * 0.04;
  let accHTML = '';
  if (pet.wearings.body){const a=D.ACCESSORY_DEFS.find(x=>x.id===pet.wearings.body);accHTML+=`<div class="pet-acc body" style="font-size:${50*scale}px">${a.emoji}</div>`;}
  if (pet.wearings.head){const a=D.ACCESSORY_DEFS.find(x=>x.id===pet.wearings.head);accHTML+=`<div class="pet-acc head" style="font-size:${42*scale}px">${a.emoji}</div>`;}
  if (pet.wearings.face){const a=D.ACCESSORY_DEFS.find(x=>x.id===pet.wearings.face);accHTML+=`<div class="pet-acc face" style="font-size:${32*scale}px">${a.emoji}</div>`;}
  if (pet.wearings.back){const a=D.ACCESSORY_DEFS.find(x=>x.id===pet.wearings.back);accHTML+=`<div class="pet-acc back" style="font-size:${38*scale}px">${a.emoji}</div>`;}

  openFullscreen(`
    <div class="fs-header">
      <button class="fs-back" onclick="closeFullscreen()">← 返回</button>
      <div class="fs-title">${pet.name} 的详情</div>
      <div style="width:60px"></div>
    </div>
    <div class="fs-body">
      <div class="detail-pet" onclick="selectSkill()">
        <div class="pet-stage" style="width:200px;height:200px">
          <div class="pet-level-badge">Lv.${pet.level}</div>
          ${pet.sick?'<div class="pet-sick-icon">🤢</div>':''}
          <div class="pet-body ${pet.sick?'sick':''}" style="font-size:${150*scale}px;transform:scale(${scale});line-height:200px">${def.emoji}</div>
          ${accHTML}
        </div>
        <div style="margin-top:12px;font-size:14px;color:#5a6a7c">${def.name} · ${pet.sick?'生病了🤢':'健康😊'}</div>
      </div>
      <div class="detail-info">
        <div class="detail-row"><span class="label">饱腹度</span><span class="value">${pet.hunger}/100</span></div>
        <div class="detail-row"><span class="label">心情值</span><span class="value">${pet.mood}/100</span></div>
        <div class="detail-row"><span class="label">亲密度</span><span class="value">${pet.intimacy}/1000</span></div>
        <div class="detail-row"><span class="label">等级</span><span class="value">Lv.${pet.level} (经验${pet.exp}/${pet.level*100})</span></div>
        <div class="detail-row"><span class="label">居住地</span><span class="value">${pet.house==='livingroom'?'大客厅':'独立小窝'}</span></div>
        <div class="detail-section">
          <h3>🎯 已解锁技能 (点击宠物选择使用)</h3>
          <div class="skill-list">${skillsHTML}</div>
        </div>
        <div class="detail-section">
          <h3>🎀 已佩戴饰品 (点击卸下)</h3>
          <div class="wearing-list">${wearingsHTML}</div>
        </div>
        <div style="display:flex;gap:8px;margin-top:16px">
          <button class="btn-warning" style="flex:1" onclick="renamePet()">✏️ 改名 (50金)</button>
          <button class="btn-primary" style="flex:1" onclick="takePhoto()">📷 拍照</button>
        </div>
        <button class="btn-info" style="width:100%;margin-top:8px;padding:12px;border-radius:12px" onclick="writeLetter()">✉️ 给${pet.name}写信</button>
        ${pet.house==='livingroom' && S.pets.length>1 ? `<button class="btn-success" style="width:100%;margin-top:8px;padding:12px;border-radius:12px" onclick="buyStable()">🏠 购买独立小窝 (500金)</button>`:''}
        ${renderLetterGallery(pet)}
        ${renderDrawingGallery(pet)}
      </div>
    </div>
  `);
}

// 渲染信件画廊
function renderLetterGallery(pet) {
  const letters = S.letters.filter(l=>l.petId===pet.id).slice(-3).reverse();
  if (!letters.length) return '';
  let html = '<div class="detail-section"><h3>✉️ 与'+pet.name+'的信件</h3><div class="letter-list">';
  letters.forEach(l => {
    const hasReply = l.reply;
    const replyReady = hasReply && Date.now() >= l.replyTime;
    html += `<div class="letter-card ${replyReady?'replied':'waiting'}" onclick="openLetter('${l.id}')">
      <div style="font-size:11px;color:#8aa5b8">${formatTime(l.time)}</div>
      <div style="font-size:13px;color:#3a4a5c;margin:4px 0">${l.content.length>20?l.content.slice(0,20)+'...':l.content}</div>
      ${replyReady ? `<div style="font-size:12px;color:#66BB6A">💌 ${l.reply.slice(0,15)}...</div>` : '<div style="font-size:12px;color:#FFA726">⏳ 等待回信中...</div>'}
    </div>`;
  });
  html += '</div></div>';
  return html;
}

// 渲染画作画廊
function renderDrawingGallery(pet) {
  const drawings = S.drawings.filter(d=>d.petId===pet.id).slice(-3).reverse();
  if (!drawings.length) return '';
  let html = '<div class="detail-section"><h3>🎨 给'+pet.name+'的画</h3><div class="drawing-gallery-grid">';
  drawings.forEach(d => {
    html += `<div class="drawing-thumb" onclick="viewDrawing('${d.id}')">
      <img src="${d.dataURL}" style="width:100%;height:100%;object-fit:cover;border-radius:8px">
    </div>`;
  });
  html += '</div></div>';
  return html;
}

// 卸下饰品
function removeWearing(slot) {
  const pet = getActivePet();
  const id = pet.wearings[slot];
  if (!id) return;
  pet.wearings[slot] = null;
  S.inventory[id] = (S.inventory[id]||0) + 1;
  Storage.save();
  Sound.play('click');
  openPetDetail();
  toast('已卸下饰品');
}

// 改名
function renamePet() {
  const pet = getActivePet();
  showModal('✏️ 修改名字', `
    <input id="newName" type="text" maxlength="6" value="${pet.name}" 
      style="width:100%;padding:12px;border:2px solid #D4ECFC;border-radius:10px;font-size:16px;margin-bottom:8px"
      placeholder="最多6个字">
    <div style="font-size:12px;color:#8aa5b8">改名消耗50金币</div>
  `, `<button class="btn-cancel" onclick="closeModal()">取消</button>
      <button class="btn-primary" onclick="confirmRename()">确认改名</button>`);
}
function confirmRename() {
  const name = $('#newName').value.trim();
  if (!name) { toast('请输入名字'); return; }
  if (name.length > 6) { toast('名字最多6个字'); return; }
  if (!spendCoin(50)) return;
  const pet = getActivePet();
  const oldName = pet.name;
  pet.name = name;
  // 同步更新该宠物的所有历史日记中的名字
  S.diaries.forEach(d => {
    if (d.petId === pet.id && d.petName === oldName) {
      d.petName = name;
    }
  });
  Storage.save();
  closeModal();
  openPetDetail();
  toast('改名成功！日记名字已同步更新~');
}

// 使用技能
function useSkill(level) {
  const pet = getActivePet();
  let used = null;
  if (level) {
    if (pet.level < level) { toast(`还没解锁哦~ 需要${level}级`); return; }
    used = D.SKILL_DEFS[level];
  } else {
    // 自动选最高级已解锁技能
    for (let lv=9; lv>=3; lv-=2) {
      if (pet.level >= lv) { used = D.SKILL_DEFS[lv]; break; }
    }
  }
  if (!used) { toast('还没有解锁技能哦~ 3级解锁第一个'); return; }
  pet.mood = Math.min(100, pet.mood + used.mood);
  Storage.save();
  Sound.play('success');
  floatReward(`${used.emoji} ${used.name}！心情+${used.mood}`, window.innerWidth/2, window.innerHeight/3);
  if (used.id === 'cute') {
    // 卖萌自动截图
    setTimeout(()=>{ takePhoto(); }, 600);
  }
  const body = $('#fullscreen .pet-body');
  if (body) {
    body.style.animation = 'animJump 0.6s';
    setTimeout(()=>body.style.animation='', 600);
  }
  openPetDetail();
}

// 选择技能弹窗
function selectSkill() {
  const pet = getActivePet();
  let html = '';
  let hasAny = false;
  for (let lv=3; lv<=9; lv+=2) {
    const sk = D.SKILL_DEFS[lv];
    const unlocked = pet.level >= lv;
    if (unlocked) hasAny = true;
    html += `<button class="skill-choose-btn ${unlocked?'':'disabled'}" ${unlocked?`onclick="useSkill(${lv})"`:''}>
      <div style="font-size:28px">${sk.emoji}</div>
      <div style="flex:1">
        <div style="font-weight:bold">${sk.name}</div>
        <div style="font-size:12px;color:#8aa5b8">心情+${sk.mood} ${unlocked?'':'(需'+lv+'级)'}</div>
      </div>
      ${unlocked?'<div style="font-size:20px">▶</div>':''}
    </button>`;
  }
  if (!hasAny) {
    html = '<div style="text-align:center;padding:20px;color:#8aa5b8"><div style="font-size:48px">🔒</div><div style="margin-top:10px">还没有解锁技能哦~</div><div style="font-size:12px;margin-top:4px">3级解锁第一个技能"转圈圈"<br>完成任务和互动可以获得经验升级</div></div>' + html;
  }
  showModal('🎯 选择技能', `<div style="display:flex;flex-direction:column;gap:10px;margin:10px 0">${html}</div>`, `<button class="btn-cancel" onclick="closeModal()">关闭</button>`);
}

// 购买独立小窝
function buyStable() {
  if (!spendCoin(500)) return;
  const pet = getActivePet();
  pet.house = 'stable_' + pet.id;
  Storage.save();
  Sound.play('buy');
  toast(`${pet.name} 搬进独立小窝啦！`);
  closeFullscreen();
  renderHome();
}

// ============ 任务页 ============
function renderTaskPage() {
  // 运势
  const fbox = $('#fortuneBox');
  if (S.dailyFortune.id) {
    fbox.innerHTML = `
      <div class="fortune-icon">🍀</div>
      <div class="fortune-text">今日运势：<strong>${S.dailyFortune.text}</strong></div>
    `;
  } else {
    fbox.innerHTML = '';
  }
  // 任务列表
  const list = $('#taskList');
  list.innerHTML = S.tasks.map((t,i)=>`
    <div class="task-item ${t.done?'done':''}">
      <div class="task-info">
        <div class="task-name">${t.done?'✅':''} ${t.name}</div>
        <div class="task-reward">🪙 +${t.reward} 金币</div>
      </div>
      <div class="task-actions">
        <button class="task-claim ${t.done?'claimed':''}" ${t.done?'disabled':''} onclick="claimTask(${i})">${t.done?'已领取':'领取'}</button>
        <button class="task-del" onclick="delTask(${i})">删</button>
      </div>
    </div>
  `).join('');
}

function claimTask(i) {
  const t = S.tasks[i];
  if (t.done) return;
  let reward = t.reward;
  if (S.dailyFortune.effect === 'task_double') reward *= 2;
  if (S.monthCard.active) reward = Math.floor(reward * 1.1);
  t.done = true;
  addCoin(reward);
  S.stats.weekTasks++;
  S.stats.weekCoins += reward;
  S.monthlyChallenge.tasksDone++;
  // 完成任务也给宠物经验
  const pet = getActivePet();
  gainExp(pet, t.reward);
  Storage.save();
  Sound.play('coin');
  floatReward(`🪙+${reward}`, window.innerWidth/2, window.innerHeight/2);
  renderTaskPage();
}

function delTask(i) {
  if (!confirm('删除这个任务？')) return;
  S.tasks.splice(i, 1);
  Storage.save();
  renderTaskPage();
}

function addTask() {
  // 检查家长锁
  if (S.parentPassword) {
    showParentLock(()=>showAddTaskForm());
  } else {
    showAddTaskForm();
  }
}
function showAddTaskForm() {
  showModal('➕ 添加任务', `
    <input id="taskName" type="text" maxlength="20" placeholder="任务名称（如：背20个单词）"
      style="width:100%;padding:12px;border:2px solid #D4ECFC;border-radius:10px;font-size:16px;margin-bottom:12px">
    <label style="font-size:13px;color:#6a7a8c">金币奖励： <span id="rewardVal" style="color:#FF9800;font-weight:bold">20</span> 金</label>
    <input id="taskReward" type="range" min="1" max="50" value="20" style="width:100%;margin-top:8px"
      oninput="document.getElementById('rewardVal').textContent=this.value">
  `, `<button class="btn-cancel" onclick="closeModal()">取消</button>
      <button class="btn-primary" onclick="confirmAddTask()">添加</button>`);
}
function confirmAddTask() {
  const name = $('#taskName').value.trim();
  const reward = parseInt($('#taskReward').value);
  if (!name) { toast('请输入任务名'); return; }
  S.tasks.push({ id:'t_'+Date.now(), name, reward, done:false });
  Storage.save();
  closeModal();
  Sound.play('success');
  renderTaskPage();
}

// ============ 答题器 ============
let quizState = null;
let quizSelected = { version:'人教版', grade:1, subject:'数学' };

function startQuiz() {
  // 选择教材
  const opt = D.QUESTION_OPTIONS;
  const renderOpts = (key, list, labelFn) => {
    return list.map((item, i) => {
      const sel = quizSelected[key] === item;
      return `<button class="quiz-opt-btn ${sel?'sel':''}" data-i="${i}" data-key="${key}" data-val="${typeof item==='number'?item:item}" style="padding:8px 14px;border-radius:10px;background:${sel?'#5B9BD5':'#EAF6FF'};color:${sel?'#fff':'#5a6a7c'};font-size:13px;border:none;font-family:inherit;cursor:pointer">${labelFn(item)}</button>`;
    }).join('');
  };
  showModal('📝 答题赚金币', `
    <div style="margin-bottom:12px">
      <div style="font-size:13px;color:#6a7a8c;margin-bottom:6px">教材版本</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap" id="qVersion">
        ${renderOpts('version', opt.versions, v=>v)}
      </div>
    </div>
    <div style="margin-bottom:12px">
      <div style="font-size:13px;color:#6a7a8c;margin-bottom:6px">年级</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap" id="qGrade">
        ${renderOpts('grade', opt.grades, g=>g+'年级')}
      </div>
    </div>
    <div style="margin-bottom:12px">
      <div style="font-size:13px;color:#6a7a8c;margin-bottom:6px">科目</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap" id="qSubject">
        ${renderOpts('subject', opt.subjects, s=>s)}
      </div>
    </div>
    <div style="font-size:12px;color:#8aa5b8;text-align:center">每日最多200金币 · 答对+10 · 满分+20</div>
  `, `<button class="btn-cancel" onclick="closeModal()">取消</button>
      <button class="btn-primary" onclick="beginQuiz()">开始答题</button>`);
  // 选项点击切换
  $$('.quiz-opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const val = btn.dataset.val;
      const parsed = key==='grade' ? parseInt(val) : val;
      quizSelected[key] = parsed;
      // 重新渲染弹窗
      startQuiz();
    });
  });
}

function beginQuiz() {
  const version = quizSelected.version;
  const grade = quizSelected.grade;
  const subject = quizSelected.subject;
  closeModal();
  // 筛选题目：优先同版本同年级同科目
  let pool = D.QUESTION_BANK.filter(q=>q.version===version && q.grade===grade && q.subject===subject);
  if (pool.length < 10) {
    // 不足则补充同年级同科目（任何版本）
    const extra = D.QUESTION_BANK.filter(q=>q.grade===grade && q.subject===subject && !pool.includes(q));
    pool = pool.concat(extra);
  }
  if (pool.length < 10) {
    // 再不足则补充同科目（任何版本任何年级）
    const extra2 = D.QUESTION_BANK.filter(q=>q.subject===subject && !pool.includes(q));
    pool = pool.concat(extra2);
  }
  // 去重并打乱取10题
  pool = pool.filter((q,i,arr)=>arr.indexOf(q)===i);
  pool.sort(()=>Math.random()-0.5);
  pool = pool.slice(0, 10);
  quizState = { questions:pool, idx:0, correct:0, version, grade, subject };
  showQuizQuestion();
}

function showQuizQuestion() {
  if (quizState.idx >= quizState.questions.length) { showQuizResult(); return; }
  const q = quizState.questions[quizState.idx];
  openFullscreen(`
    <div class="fs-header">
      <button class="fs-back" onclick="quitQuiz()">← 退出</button>
      <div class="fs-title">📝 答题 (${quizState.version}·${quizState.grade}年级·${quizState.subject})</div>
      <div style="width:60px"></div>
    </div>
    <div class="quiz-progress">
      <span>第 ${quizState.idx+1} / ${quizState.questions.length} 题</span>
      <span style="color:#66BB6A">✅ ${quizState.correct}</span>
    </div>
    <div class="quiz-question">${q.question}</div>
    <div class="quiz-options" id="quizOptions">
      ${q.options.map((o,i)=>`<button class="quiz-option" onclick="answerQuiz(${i})">${String.fromCharCode(65+i)}. ${o}</button>`).join('')}
    </div>
  `);
}

function answerQuiz(i) {
  const q = quizState.questions[quizState.idx];
  const opts = $$('#quizOptions .quiz-option');
  opts.forEach(o=>o.onclick=null);
  if (i === q.answer) {
    opts[i].classList.add('correct');
    quizState.correct++;
    Sound.play('success');
  } else {
    opts[i].classList.add('wrong');
    opts[q.answer].classList.add('correct');
    Sound.play('error');
  }
  setTimeout(()=>{
    quizState.idx++;
    showQuizQuestion();
  }, 1200);
}

function showQuizResult() {
  const correct = quizState.correct;
  let coin = correct * 10;
  if (correct === 10) coin += 20;
  // 双倍卡/魔法学院地图/节日
  if (S.dailyFortune.effect === 'task_double') coin *= 2;
  if (S.unlockedMaps.includes('magic')) coin *= 2;
  // 每日上限200
  const remain = 200 - (S.dailyAnswer.count || 0);
  if (coin > remain) coin = Math.max(0, remain);
  S.dailyAnswer.count = (S.dailyAnswer.count||0) + coin;
  addCoin(coin);
  S.stats.weekAnswers += correct;
  S.stats.weekCoins += coin;
  S.monthlyChallenge.answerRight += correct;
  // 答题也给宠物经验
  gainExp(getActivePet(), correct * 5);
  Storage.save();
  Sound.play('levelup');
  openFullscreen(`
    <div class="fs-header">
      <div class="fs-title">📝 答题结果</div>
      <div style="width:60px"></div>
    </div>
    <div class="quiz-result">
      <div class="result-emoji">${correct>=9?'🏆':correct>=6?'🌟':correct>=3?'😊':'💪'}</div>
      <div class="result-text">答对 ${correct} / 10 题</div>
      <div class="result-coin">🪙 +${coin} 金币</div>
      <button class="btn-primary" style="padding:12px 32px;border-radius:20px" onclick="closeFullscreen()">完成</button>
    </div>
  `);
  quizState = null;
}

function quitQuiz() {
  if (confirm('确定退出答题吗？')) { closeFullscreen(); quizState = null; }
}

// ============ 商店 ============
let shopCategory = 'food';
function renderShop() {
  // 今日特价
  const today = Storage.todayStr();
  // 基于日期生成稳定的特价商品
  const saleId = getDailySaleId();
  const saleDef = findItemById(saleId);
  $('#todaySale').innerHTML = saleDef ? `🔥今日特价：${saleDef.emoji}${saleDef.name} 8折` : '';
  renderShopList();
}

function getDailySaleId() {
  const today = Storage.todayStr();
  if (!S._saleCache || S._saleCache.date !== today) {
    const allItems = [...D.FOOD_DEFS, ...D.ACCESSORY_DEFS, ...D.FURNITURE_DEFS];
    const pick = allItems[Math.floor(Math.random()*allItems.length)];
    S._saleCache = { date:today, id:pick.id };
    Storage.save();
  }
  return S._saleCache.id;
}

function findItemById(id) {
  return D.FOOD_DEFS.find(x=>x.id===id) || D.ACCESSORY_DEFS.find(x=>x.id===id) ||
         D.FURNITURE_DEFS.find(x=>x.id===id) || D.PACKAGE_DEFS.find(x=>x.id===id);
}

function getItemPrice(def) {
  let price = def.price;
  // 今日特价8折
  if (def.id === getDailySaleId()) price = Math.floor(price * 0.8);
  // 周末食物9折
  const day = new Date().getDay();
  if ((day===0 || day===6) && D.FOOD_DEFS.includes(def)) price = Math.floor(price * 0.9);
  // 月底最后3天装扮类7折
  const d = new Date();
  const lastDay = new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
  if (d.getDate() >= lastDay-2 && D.ACCESSORY_DEFS.includes(def)) price = Math.floor(price * 0.7);
  return price;
}

function renderShopList() {
  const list = $('#shopList');
  let items = [];
  if (shopCategory==='food') items = D.FOOD_DEFS.map(d=>({...d, type:'food'}));
  else if (shopCategory==='accessory') items = D.ACCESSORY_DEFS.map(d=>({...d, type:'accessory'}));
  else if (shopCategory==='furniture') items = D.FURNITURE_DEFS.map(d=>({...d, type:'furniture'}));
  else if (shopCategory==='pet') items = Object.values(D.PET_DEFS).filter(d=>d.price>0).map(d=>({...d, type:'pet'}));
  else if (shopCategory==='map') items = D.MAP_DEFS.map(d=>({...d, type:'map'}));
  else if (shopCategory==='package') items = D.PACKAGE_DEFS.map(d=>({...d, type:'package'}));

  list.innerHTML = items.map(def=>{
    const price = getItemPrice(def);
    const isSale = price < def.price;
    let extra = '';
    let buyText = '购买';
    let buyDisabled = '';
    let buyOnClick = `buyItem('${def.type}','${def.id}')`;
    if (def.type==='pet') {
      const owned = hasPetDef(def.id);
      if (owned) { extra = 'owned'; buyText='已拥有'; buyDisabled='disabled'; buyOnClick=''; }
    } else if (def.type==='map') {
      const unlocked = S.unlockedMaps.includes(def.id);
      if (unlocked) { extra='owned'; buyText='已解锁'; buyDisabled='disabled'; buyOnClick=''; }
    }
    let lockTip = '';
    if (def.type==='map') {
      const ok = (def.needIntimacy ? getActivePet().intimacy >= def.needIntimacy : true) &&
                 (def.needPets ? S.pets.length >= def.needPets : true);
      if (!ok) {
        lockTip = `<div class="shop-locked-tip">${def.needIntimacy?`需亲密≥${def.needIntimacy}`:''} ${def.needPets?`需≥${def.needPets}只宠物`:''}</div>`;
        buyDisabled='disabled'; buyText='未解锁';
        buyOnClick='';
      }
    }
    return `<div class="shop-card ${isSale?'sale':''} ${extra}">
      <div class="shop-emoji">${def.emoji}</div>
      <div class="shop-name">${def.name}</div>
      <div class="shop-desc">${def.desc||def.buff||''}</div>
      <div class="shop-price">🪙 ${price}${isSale?`<span class="original">${def.price}</span>`:''}</div>
      ${lockTip}
      <button class="shop-buy" ${buyDisabled} onclick="${buyOnClick}">${buyText}</button>
    </div>`;
  }).join('');
}

function buyItem(type, id) {
  let def;
  if (type==='food') def = D.FOOD_DEFS.find(x=>x.id===id);
  else if (type==='accessory') def = D.ACCESSORY_DEFS.find(x=>x.id===id);
  else if (type==='furniture') def = D.FURNITURE_DEFS.find(x=>x.id===id);
  else if (type==='pet') def = D.PET_DEFS[id];
  else if (type==='map') def = D.MAP_DEFS.find(x=>x.id===id);
  else if (type==='package') def = D.PACKAGE_DEFS.find(x=>x.id===id);
  if (!def) return;
  const price = getItemPrice(def);
  if (!spendCoin(price)) return;
  Sound.play('buy');
  if (type==='food') {
    S.inventory[id] = (S.inventory[id]||0) + 1;
    toast(`购买 ${def.name} ×1`);
    askUseFood(id);
  } else if (type==='accessory') {
    S.inventory[id] = (S.inventory[id]||0) + 1;
    askWear(id);
  } else if (type==='furniture') {
    S.furniture[id] = (S.furniture[id]||0) + 1;
    toast(`购买 ${def.name}，去家园布置摆放吧~`);
  } else if (type==='pet') {
    // 弹窗命名
    askNameNewPet(id);
  } else if (type==='map') {
    S.unlockedMaps.push(id);
    toast(`解锁地图：${def.name}！`);
  } else if (type==='package') {
    usePackage(def);
  }
  Storage.save();
  renderShop();
}

function askUseFood(id) {
  const def = D.FOOD_DEFS.find(x=>x.id===id);
  showModal(`🍖 ${def.name}`, `
    <div style="text-align:center;padding:10px">
      <div style="font-size:48px;margin-bottom:8px">${def.emoji}</div>
      <div style="font-size:14px;color:#6a7a8c">${def.desc}</div>
      <div style="margin-top:8px;font-size:13px;color:#8aa5b8">背包中已有 ${S.inventory[id]||0} 个</div>
    </div>
  `, `<button class="btn-cancel" onclick="closeModal()">稍后</button>
      <button class="btn-primary" onclick="feedPet('${id}')">立即使用</button>`);
}

function feedPet(id) {
  const def = D.FOOD_DEFS.find(x=>x.id===id);
  const pet = getActivePet();
  if (!S.inventory[id] || S.inventory[id] <= 0) { toast('物品不足'); return; }
  S.inventory[id]--;
  if (def.effect.cure) {
    pet.sick = false;
    toast(`${pet.name} 病好了！`);
  } else {
    if (def.effect.hunger) pet.hunger = Math.min(100, pet.hunger + def.effect.hunger);
    if (def.effect.mood) pet.mood = Math.min(100, pet.mood + def.effect.mood);
  }
  gainExp(pet, 2);
  Storage.save();
  Sound.play('eat');
  closeModal();
  floatReward(`${def.emoji} 好吃！`, window.innerWidth/2, window.innerHeight/2);
  renderHome();
}

function askWear(id) {
  const def = D.ACCESSORY_DEFS.find(x=>x.id===id);
  const pet = getActivePet();
  showModal(`🎀 ${def.name}`, `
    <div style="text-align:center;padding:10px">
      <div style="font-size:48px;margin-bottom:8px">${def.emoji}</div>
      <div style="font-size:14px;color:#6a7a8c">${def.desc} · ${def.slot}部位</div>
    </div>
  `, `<button class="btn-cancel" onclick="closeModal()">稍后</button>
      <button class="btn-primary" onclick="wearAccessory('${id}')">立即佩戴</button>`);
}

function wearAccessory(id) {
  const def = D.ACCESSORY_DEFS.find(x=>x.id===id);
  const pet = getActivePet();
  if (!S.inventory[id] || S.inventory[id]<=0) { toast('饰品不足'); return; }
  // 同部位旧饰品退回背包
  const old = pet.wearings[def.slot];
  if (old) S.inventory[old] = (S.inventory[old]||0) + 1;
  S.inventory[id]--;
  pet.wearings[def.slot] = id;
  pet.mood = Math.min(100, pet.mood + def.mood);
  gainExp(pet, 1);
  Storage.save();
  Sound.play('success');
  closeModal();
  toast(`佩戴成功！心情+${def.mood}`);
  renderHome();
}

function askNameNewPet(defId) {
  const def = D.PET_DEFS[defId];
  showModal(`🎉 购买 ${def.name}`, `
    <div style="text-align:center;padding:10px">
      <div style="font-size:56px;margin-bottom:8px">${def.emoji}</div>
      <div style="font-size:14px;color:#6a7a8c;margin-bottom:12px">给它取个名字吧（最多6个字）</div>
      <input id="newPetName" type="text" maxlength="6" value="${def.name}" 
        style="width:100%;padding:12px;border:2px solid #D4ECFC;border-radius:10px;font-size:16px;text-align:center">
    </div>
  `, `<button class="btn-cancel" onclick="closeModal()">取消</button>
      <button class="btn-primary" onclick="confirmNewPet('${defId}')">确认</button>`);
}
function confirmNewPet(defId) {
  const name = $('#newPetName').value.trim() || D.PET_DEFS[defId].name;
  const pet = makePet(defId, name);
  S.pets.push(pet);
  S.activePetId = pet.id;
  Storage.save();
  closeModal();
  Sound.play('levelup');
  toast(`欢迎 ${name} 加入家庭！`);
  switchPage('home');
}

function usePackage(def) {
  if (def.type==='coupon') {
    S.inventory['coupon_interact'] = (S.inventory['coupon_interact']||0) + def.count;
    toast(`获得互动券 ×${def.count}`);
  } else if (def.type==='food_pack') {
    for (let i=0;i<5;i++) {
      const f = D.FOOD_DEFS[Math.floor(Math.random()*D.FOOD_DEFS.length)];
      S.inventory[f.id] = (S.inventory[f.id]||0) + 1;
    }
    toast('获得5个随机食物！');
  } else if (def.type==='buff') {
    S.dailyFortune = { date:Storage.todayStr(), id:'task_double', text:'双倍金币卡(任务×2)', effect:'task_double' };
    toast('今日任务金币×2！');
  } else if (def.type==='month_card') {
    S.monthCard = { active:true, daysLeft:30, lastClaim:'' };
    toast('月卡激活！每日可领100金');
  } else if (def.type==='mystery') {
    const r = Math.random();
    if (r < 0.4) { addCoin(500); toast('神秘礼盒：500金币！'); }
    else if (r < 0.7) {
      D.ACCESSORY_DEFS.forEach(a => S.inventory[a.id] = (S.inventory[a.id]||0)+1);
      toast('神秘礼盒：全套饰品！');
    } else if (r < 0.9) {
      S.inventory['coupon_interact'] = (S.inventory['coupon_interact']||0)+10;
      toast('神秘礼盒：互动券×10！');
    } else {
      addCoin(2000);
      toast('🎉 神秘礼盒大奖：2000金币！');
    }
  }
  Storage.save();
}

// ============ 相册/背包/日记 ============
let albumTab = 'photo';
function renderAlbum() {
  renderAlbumContent();
}
function renderAlbumContent() {
  const c = $('#albumContent');
  if (albumTab==='photo') {
    if (!S.photos.length) {
      c.innerHTML = '<div class="photo-empty">📷 还没有照片<br>点击主页相机按钮拍照吧~</div>';
      return;
    }
    c.innerHTML = '<div class="photo-grid">' + S.photos.slice().reverse().map(p=>`
      <div class="photo-item" onclick="viewPhoto('${p.id}')">
        <img src="${p.dataURL}" alt="">
        ${p.text?`<div class="photo-text">${p.text}</div>`:''}
      </div>
    `).join('') + '</div>';
  } else if (albumTab==='diary') {
    let html = '<div class="diary-list">';
    if (!S.diaries.length) {
      html += '<div class="photo-empty">📖 还没有日记<br>宠物每天会自动记录，你也可以写自己的日记~</div>';
    } else {
      // 按类型分组显示
      // 规则：author==='pet' 或 auto===true → 宠物日记；其余 → 小欣的日记
      const autoDiaries = S.diaries.filter(d=>d.author==='pet' || d.auto);
      const userDiaries = S.diaries.filter(d=>!(d.author==='pet' || d.auto));
      
      if (userDiaries.length) {
        html += '<div style="font-size:13px;color:#5a6a7c;margin:8px 4px;font-weight:bold">👧 小欣的日记</div>';
        html += userDiaries.slice().reverse().map(d=>`
          <div class="diary-item user">
            <div class="diary-head">
              <div class="diary-pet">👧 小欣</div>
              <div style="display:flex;gap:8px;align-items:center">
                <div class="diary-time">${formatTime(d.time)}</div>
                <span style="color:#e57373;font-size:16px;cursor:pointer" onclick="deleteDiary('${d.id}')">🗑️</span>
              </div>
            </div>
            <div class="diary-text">${d.text}</div>
          </div>
        `).join('');
      }
      
      if (autoDiaries.length) {
        html += '<div style="font-size:13px;color:#5a6a7c;margin:12px 4px 8px;font-weight:bold">🐾 宠物日记</div>';
        html += autoDiaries.slice().reverse().map(d=>`
          <div class="diary-item auto">
            <div class="diary-head">
              <div class="diary-pet">${d.petName||'宠物'} 🤖</div>
              <div style="display:flex;gap:8px;align-items:center">
                <div class="diary-time">${formatTime(d.time)}</div>
                <span style="color:#e57373;font-size:16px;cursor:pointer" onclick="deleteDiary('${d.id}')">🗑️</span>
              </div>
            </div>
            <div class="diary-text">${d.text}</div>
          </div>
        `).join('');
      }
    }
    html += `<button class="add-btn" onclick="addDiary()">+ 写日记</button></div>`;
    c.innerHTML = html;
  } else if (albumTab==='bag') {
    renderBag(c);
  } else if (albumTab==='draw') {
    renderAlbumDrawTab(c);
  } else if (albumTab==='letter') {
    renderAlbumLetterTab(c);
  }
}

// 相册页 - 悄悄画 Tab
function renderAlbumDrawTab(c) {
  const pet = getActivePet();
  let html = `<button class="add-btn" onclick="openDrawing()">🎨 画一幅给${pet.name}的画</button>`;
  const drawings = S.drawings.slice().reverse();
  if (!drawings.length) {
    html += '<div class="photo-empty">🎨 还没有画作<br>点击上方按钮开始涂鸦吧~</div>';
  } else {
    html += '<div class="photo-grid">';
    drawings.forEach(d => {
      html += `<div class="photo-item" onclick="viewDrawing('${d.id}','album')">
        <img src="${d.dataURL}" alt="">
        ${d.petName?`<div class="photo-text">🐾 ${d.petName}</div>`:''}
      </div>`;
    });
    html += '</div>';
  }
  c.innerHTML = html;
}

// 相册页 - 信件 Tab
function renderAlbumLetterTab(c) {
  const pet = getActivePet();
  let html = `<button class="add-btn" onclick="writeLetter()">✉️ 给${pet.name}写信</button>`;
  const letters = S.letters.slice().reverse();
  if (!letters.length) {
    html += '<div class="photo-empty">✉️ 还没有信件<br>给宠物写一句悄悄话吧~</div>';
  } else {
    html += '<div class="letter-list">';
    letters.forEach(l => {
      const replyReady = l.reply && Date.now() >= l.replyTime;
      const cls = replyReady ? 'replied' : 'waiting';
      const statusText = !l.reply ? '⏳ 路上' : (replyReady ? '💌 已回信' : '⏳ 回信中');
      const preview = l.content.length > 20 ? l.content.slice(0,20) + '…' : l.content;
      html += `<div class="letter-card ${cls}" onclick="openLetter('${l.id}','album')">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <span style="font-size:13px;font-weight:bold;color:#3a4a5c">👧 → 🐾 ${l.petName}</span>
          <span style="font-size:11px;color:#8aa5b8">${statusText}</span>
        </div>
        <div style="font-size:13px;color:#5a6a7c">${preview}</div>
        <div style="font-size:11px;color:#8aa5b8;margin-top:4px">${formatTime(l.time)}</div>
      </div>`;
    });
    html += '</div>';
  }
  c.innerHTML = html;
}

function renderBag(c) {
  let html = '';
  // 食物
  const foods = Object.entries(S.inventory).filter(([id,n])=>n>0 && D.FOOD_DEFS.find(f=>f.id===id));
  if (foods.length) {
    html += '<div class="bag-section"><h3>🍖 食物</h3><div class="bag-grid">';
    foods.forEach(([id,n])=>{
      const f = D.FOOD_DEFS.find(x=>x.id===id);
      html += `<div class="bag-card" onclick="useBagFood('${id}')">
        <div class="bag-emoji">${f.emoji}</div>
        <div class="bag-name">${f.name}</div>
        <div class="bag-count">${n}</div>
      </div>`;
    });
    html += '</div></div>';
  }
  // 饰品
  const accs = Object.entries(S.inventory).filter(([id,n])=>n>0 && D.ACCESSORY_DEFS.find(f=>f.id===id));
  const pet = getActivePet();
  if (accs.length) {
    html += '<div class="bag-section"><h3>🎀 饰品</h3><div class="bag-grid">';
    accs.forEach(([id,n])=>{
      const a = D.ACCESSORY_DEFS.find(x=>x.id===id);
      const wearing = Object.values(pet.wearings).includes(id);
      html += `<div class="bag-card ${wearing?'wearing':''}" onclick="useBagAcc('${id}')">
        <div class="bag-emoji">${a.emoji}</div>
        <div class="bag-name">${a.name}</div>
        <div class="bag-count">${n}</div>
      </div>`;
    });
    html += '</div></div>';
  }
  // 道具
  const coupon = S.inventory['coupon_interact']||0;
  if (coupon > 0) {
    html += `<div class="bag-section"><h3>🎟️ 道具</h3><div class="bag-grid">
      <div class="bag-card">
        <div class="bag-emoji">🎟️</div>
        <div class="bag-name">互动券</div>
        <div class="bag-count">${coupon}</div>
      </div>
    </div></div>`;
  }
  // 家具
  const furns = Object.entries(S.furniture).filter(([id,n])=>n>0);
  if (furns.length) {
    html += '<div class="bag-section"><h3>🪑 家具 (去主页布置摆放)</h3><div class="bag-grid">';
    furns.forEach(([id,n])=>{
      const f = D.FURNITURE_DEFS.find(x=>x.id===id);
      html += `<div class="bag-card">
        <div class="bag-emoji">${f.emoji}</div>
        <div class="bag-name">${f.name}</div>
        <div class="bag-count">${n}</div>
      </div>`;
    });
    html += '</div></div>';
  }
  if (!html) html = '<div class="photo-empty">🎒 背包空空如也<br>去商店买点东西吧~</div>';
  c.innerHTML = html;
}

function useBagFood(id) {
  const f = D.FOOD_DEFS.find(x=>x.id===id);
  showModal(`🍖 ${f.name}`, `<div style="text-align:center;padding:10px"><div style="font-size:48px">${f.emoji}</div><div style="font-size:13px;color:#6a7a8c;margin-top:6px">${f.desc}</div></div>`,
    `<button class="btn-danger" onclick="discardItem('${id}')">丢弃</button>
     <button class="btn-cancel" onclick="closeModal()">取消</button>
     <button class="btn-primary" onclick="feedPet('${id}')">使用</button>`);
}
function useBagAcc(id) {
  const a = D.ACCESSORY_DEFS.find(x=>x.id===id);
  const pet = getActivePet();
  const wearing = Object.values(pet.wearings).includes(id);
  let footer = '';
  if (wearing) {
    footer = `<button class="btn-danger" onclick="discardItem('${id}')">丢弃</button>
      <button class="btn-warning" onclick="unwearAcc('${id}')">卸下</button>`;
  } else {
    footer = `<button class="btn-danger" onclick="discardItem('${id}')">丢弃</button>
      <button class="btn-cancel" onclick="closeModal()">取消</button>
      <button class="btn-primary" onclick="wearAccessory('${id}')">佩戴</button>`;
  }
  showModal(`🎀 ${a.name}`, `<div style="text-align:center;padding:10px"><div style="font-size:48px">${a.emoji}</div><div style="font-size:13px;color:#6a7a8c;margin-top:6px">${a.desc} · ${a.slot}部位</div></div>`, footer);
}
function unwearAcc(id) {
  const a = D.ACCESSORY_DEFS.find(x=>x.id===id);
  const pet = getActivePet();
  pet.wearings[a.slot] = null;
  S.inventory[id] = (S.inventory[id]||0) + 1;
  Storage.save();
  closeModal();
  toast('已卸下');
  renderAlbumContent();
}
function discardItem(id) {
  if (!confirm('确定丢弃这个物品吗？')) return;
  S.inventory[id] = Math.max(0, (S.inventory[id]||0) - 1);
  Storage.save();
  closeModal();
  toast('已丢弃');
  renderAlbumContent();
}

function viewPhoto(id) {
  const p = S.photos.find(x=>x.id===id);
  if (!p) return;
  showModal('📷 照片', `
    <div style="text-align:center">
      <img src="${p.dataURL}" style="width:100%;border-radius:10px;margin-bottom:8px">
      <div style="font-size:13px;color:#5a6a7c">${p.text||''}</div>
      <div style="font-size:11px;color:#8aa5b8;margin-top:4px">${formatTime(p.time)}</div>
    </div>
  `, `<button class="btn-danger" onclick="delPhoto('${id}')">删除</button>
      <button class="btn-cancel" onclick="closeModal()">关闭</button>`);
}
function delPhoto(id) {
  if (!confirm('删除这张照片？')) return;
  S.photos = S.photos.filter(x=>x.id!==id);
  Storage.save();
  closeModal();
  renderAlbumContent();
}

function addDiary() {
  showModal('📖 写日记', `
    <div style="margin-bottom:8px;font-size:13px;color:#6a7a8c">以"小欣"的身份记录一件事~</div>
    <textarea id="diaryText" maxlength="100" placeholder="今天发生了什么有趣的事..."
      style="width:100%;height:80px;padding:12px;border:2px solid #D4ECFC;border-radius:10px;font-size:14px;resize:none"></textarea>
  `, `<button class="btn-cancel" onclick="closeModal()">取消</button>
      <button class="btn-primary" onclick="confirmAddDiary()">保存</button>`);
}
function confirmAddDiary() {
  const text = $('#diaryText').value.trim();
  if (!text) { toast('请输入内容'); return; }
  S.diaries.push({ id:'d_'+Date.now(), text, time:Date.now(), author:'小欣', auto:false });
  Storage.save();
  closeModal();
  toast('日记已保存~');
  renderAlbumContent();
}

// 删除日记
function deleteDiary(id) {
  if (!confirm('确定删除这篇日记？')) return;
  S.diaries = S.diaries.filter(d=>d.id !== id);
  Storage.save();
  toast('已删除');
  renderAlbumContent();
}

// 自动生成每日日记
function autoGenerateDiary() {
  const today = Storage.todayStr();
  if (S._lastDiaryDate === today) return;
  S._lastDiaryDate = today;
  const pet = getActivePet();
  const templates = [
    `今天和主人一起玩耍啦，心情${pet.mood>60?'超好':'一般'}~`,
    `饱腹度${pet.hunger}，${pet.hunger>50?'吃饱饱':'有点饿'}~`,
    `今天亲密度增加了，我好喜欢主人~`,
    `${pet.sick?'今天不太舒服，主人快帮帮我':'今天也是元气满满的一天'}~`,
    `偷偷告诉你，我最喜欢主人了~`,
    `今天玩了好多游戏，开心到转圈圈~`,
    `主人摸了我的头，感觉超幸福！`,
    `梦见了好多好吃的，肚子都饿扁了~`,
  ];
  const text = templates[Math.floor(Math.random()*templates.length)];
  S.diaries.push({ id:'d_'+Date.now(), text, time:Date.now(), petId:pet.id, petName:pet.name, author:'pet', auto:true });
  Storage.save();
}

// ============ 拍照 ============
function takePhoto() {
  // 用html2canvas替代：直接对宠物展示区截图（使用canvas绘制简化版）
  const pet = getActivePet();
  const def = D.PET_DEFS[pet.defId];
  const canvas = document.createElement('canvas');
  canvas.width = 320; canvas.height = 360;
  const ctx = canvas.getContext('2d');
  // 背景渐变
  const grad = ctx.createLinearGradient(0,0,0,360);
  grad.addColorStop(0,'#CDE9FF'); grad.addColorStop(1,'#D4F0D4');
  ctx.fillStyle = grad; ctx.fillRect(0,0,320,360);
  // 宠物emoji
  ctx.font = '180px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  const scale = 1 + (pet.level-1)*0.04;
  ctx.save(); ctx.translate(160, 200); ctx.scale(scale,scale);
  ctx.fillText(def.emoji, 0, 0); ctx.restore();
  // 饰品
  const drawAcc = (slot, emoji, x, y, size) => {
    if (!pet.wearings[slot]) return;
    ctx.font = size+'px sans-serif';
    ctx.fillText(emoji, x, y);
  };
  if (pet.wearings.body){const a=D.ACCESSORY_DEFS.find(x=>x.id===pet.wearings.body);drawAcc('body',a.emoji,160,210,75);}
  if (pet.wearings.head){const a=D.ACCESSORY_DEFS.find(x=>x.id===pet.wearings.head);drawAcc('head',a.emoji,160,90,60);}
  if (pet.wearings.face){const a=D.ACCESSORY_DEFS.find(x=>x.id===pet.wearings.face);drawAcc('face',a.emoji,160,180,48);}
  if (pet.wearings.back){const a=D.ACCESSORY_DEFS.find(x=>x.id===pet.wearings.back);drawAcc('back',a.emoji,240,130,55);}
  // 名字与等级
  ctx.font = 'bold 18px sans-serif'; ctx.fillStyle='#3a4a5c';
  ctx.fillText(`${pet.name} Lv.${pet.level}`, 160, 330);
  const dataURL = canvas.toDataURL('image/png');
  // 输入心情文字
  showModal('📷 拍照完成', `
    <div style="text-align:center">
      <img src="${dataURL}" style="width:100%;border-radius:10px;margin-bottom:10px">
      <input id="photoText" type="text" maxlength="20" placeholder="写点什么吧~(选填)"
        style="width:100%;padding:10px;border:2px solid #D4ECFC;border-radius:10px;font-size:14px">
    </div>
  `, `<button class="btn-cancel" onclick="closeModal()">放弃</button>
      <button class="btn-primary" onclick="savePhoto()">保存到相册</button>`);
  window._pendingPhoto = dataURL;
}
function savePhoto() {
  const text = $('#photoText').value.trim();
  const pet = getActivePet();
  S.photos.push({ id:'p_'+Date.now(), dataURL:window._pendingPhoto, text, time:Date.now(), petId:pet.id });
  Storage.save();
  closeModal();
  Sound.play('success');
  toast('照片已保存到时光相册~');
  // 尝试下载到本地
  try {
    const a = document.createElement('a');
    a.href = window._pendingPhoto;
    a.download = `欣宝小宠_${pet.name}_${Date.now()}.png`;
    a.click();
  } catch(e){}
  window._pendingPhoto = null;
}

// ============ 家园布置 ============
let decorateState = null;
function openDecorate() {
  decorateState = { selected:null };
  openFullscreen(`
    <div class="fs-header">
      <button class="fs-back" onclick="cancelDecorate()">← 取消</button>
      <div class="fs-title">🏠 布置家园</div>
      <button class="fs-back" onclick="finishDecorate()" style="background:#66BB6A;color:#fff">完成</button>
    </div>
    <div class="decorate-grid">
      <div class="grid-container" id="gridContainer"></div>
    </div>
    <div class="decorate-bottom">
      <div class="decorate-inventory" id="decInventory"></div>
      <div style="font-size:12px;color:#8aa5b8;text-align:center">点击家具选中，再点网格放置；长按已放置物品可移除</div>
    </div>
  `);
  renderGrid();
  renderDecInventory();
}

function renderGrid() {
  const gc = $('#gridContainer');
  gc.innerHTML = '';
  // 宠物固定占位 (居中偏下，2x2，即row 3-4, col 2-3)
  const petZone = [[3,2],[3,3],[4,2],[4,3]];
  for (let r=0;r<6;r++) {
    for (let c=0;c<6;c++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.dataset.r = r; cell.dataset.c = c;
      if (petZone.some(([pr,pc])=>pr===r&&pc===c)) cell.classList.add('pet-zone');
      cell.onclick = ()=>placeOnCell(r,c);
      gc.appendChild(cell);
    }
  }
  // 渲染已放置家具（当前宠物的）
  const placed = getPlacedFurn();
  placed.forEach(f => {
    const def = D.FURNITURE_DEFS.find(x=>x.id===f.id);
    if (!def) return;
    showPlacedOnGrid(f, def);
  });
}

function showPlacedOnGrid(f, def) {
  const gc = $('#gridContainer');
  const cells = gc.children;
  for (let dr=0; dr<def.size[1]; dr++) {
    for (let dc=0; dc<def.size[0]; dc++) {
      const r = f.y + dr, c = f.x + dc;
      const idx = r*6 + c;
      const cell = cells[idx];
      if (cell) cell.classList.add('occupied');
    }
  }
  // 在左上角格子放图标
  const idx = f.y*6 + f.x;
  const cell = cells[idx];
  if (cell) {
    const item = document.createElement('div');
    item.className = 'placed-item';
    item.textContent = def.emoji;
    item.style.width = def.size[0] + '00%';
    item.style.height = def.size[1] + '00%';
    item.style.position='absolute'; item.style.top='0'; item.style.left='0';
    if (f.rotate) item.style.transform = `rotate(${f.rotate*90}deg)`;
    item.onclick = (e)=>{ e.stopPropagation(); clickPlaced(f, def, item); };
    // 长按移除
    let pressTimer = null;
    item.addEventListener('touchstart', ()=>{ pressTimer = setTimeout(()=>removePlaced(f), 600); });
    item.addEventListener('touchend', ()=>clearTimeout(pressTimer));
    item.addEventListener('mousedown', ()=>{ pressTimer = setTimeout(()=>removePlaced(f), 600); });
    item.addEventListener('mouseup', ()=>clearTimeout(pressTimer));
    cell.style.position = 'relative';
    cell.appendChild(item);
  }
}

let pressTimer = null;
function clickPlaced(f, def, el) {
  // 单击：旋转
  f.rotate = ((f.rotate||0) + 1) % 4;
  el.style.transform = `rotate(${f.rotate*90}deg)`;
  Storage.save();
  Sound.play('click');
}
function removePlaced(f) {
  if (!confirm('移除这件家具？')) return;
  const placed = getPlacedFurn();
  const idx = placed.indexOf(f);
  if (idx >= 0) placed.splice(idx, 1);
  S.furniture[f.id] = (S.furniture[f.id]||0) + 1;
  Storage.save();
  Sound.play('click');
  renderGrid();
  renderDecInventory();
}

function renderDecInventory() {
  const inv = $('#decInventory');
  const items = Object.entries(S.furniture).filter(([id,n])=>n>0);
  if (!items.length) {
    inv.innerHTML = '<div style="color:#8aa5b8;font-size:13px;padding:10px">背包没有家具，去商店购买吧~</div>';
    return;
  }
  inv.innerHTML = items.map(([id,n])=>{
    const def = D.FURNITURE_DEFS.find(x=>x.id===id);
    return `<div class="dec-item ${decorateState?.selected===id?'selected':''}" onclick="selectDecItem('${id}')">
      <div class="dec-emoji">${def.emoji}</div>
      <div class="dec-count">${n}</div>
    </div>`;
  }).join('');
}

function selectDecItem(id) {
  decorateState.selected = (decorateState.selected === id) ? null : id;
  renderDecInventory();
  Sound.play('click');
}

function placeOnCell(r, c) {
  if (!decorateState.selected) { toast('请先选择家具'); return; }
  const def = D.FURNITURE_DEFS.find(x=>x.id===decorateState.selected);
  if (!def) return;
  // 检查边界
  if (c + def.size[0] > 6 || r + def.size[1] > 6) { toast('超出网格边界'); return; }
  // 检查冲突（含宠物区）
  const petZone = [[3,2],[3,3],[4,2],[4,3]];
  for (let dr=0; dr<def.size[1]; dr++) {
    for (let dc=0; dc<def.size[0]; dc++) {
      const rr=r+dr, cc=c+dc;
      if (petZone.some(([pr,pc])=>pr===rr&&pc===cc)) { toast('不能覆盖宠物位置'); return; }
      if (getPlacedFurn().some(f=>{
        const fd = D.FURNITURE_DEFS.find(x=>x.id===f.id);
        if (!fd) return false;
        for (let ddr=0;ddr<fd.size[1];ddr++) for (let ddc=0;ddr<fd.size[0];ddr++) {
          if (f.y+ddr===rr && f.x+ddc===cc) return true;
        }
        return false;
      })) { toast('格子已被占用'); return; }
    }
  }
  // 放置
  getPlacedFurn().push({ id:def.id, x:c, y:r, rotate:0 });
  S.furniture[def.id]--;
  if (S.furniture[def.id] <= 0) delete S.furniture[def.id];
  decorateState.selected = null;
  Storage.save();
  Sound.play('buy');
  renderGrid();
  renderDecInventory();
}

function cancelDecorate() {
  if (confirm('放弃布置并退出？')) { closeFullscreen(); decorateState=null; }
}
function finishDecorate() {
  closeFullscreen();
  decorateState = null;
  toast('布置已保存~');
  renderHome();
}

// ============ 地图系统 ============
function openMapList() {
  let html = '<div style="padding:12px">';
  D.MAP_DEFS.forEach(m=>{
    const unlocked = S.unlockedMaps.includes(m.id);
    const today = Storage.todayStr();
    const claimed = S.mapDailyReward[m.id] === today;
    let tip = '';
    if (!unlocked) {
      tip = (m.needIntimacy?`需亲密≥${m.needIntimacy} `:'') + (m.needPets?`需≥${m.needPets}只宠物`:'');
    }
    html += `<div class="info-card" style="${unlocked?'':'opacity:0.5'}">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="font-size:40px">${m.icon}</div>
        <div style="flex:1">
          <div style="font-size:16px;font-weight:bold">${m.name} ${unlocked?'':'🔒'}</div>
          <div style="font-size:12px;color:#8aa5b8">${m.dailyReward}</div>
          ${tip?`<div style="font-size:11px;color:#E57373">${tip}</div>`:''}
        </div>
        ${unlocked?`<button class="btn-primary" style="padding:8px 14px;border-radius:10px" onclick="enterMap('${m.id}')">进入</button>`:''}
      </div>
    </div>`;
  });
  html += '</div>';
  openFullscreen(`
    <div class="fs-header">
      <button class="fs-back" onclick="closeFullscreen()">← 返回家园</button>
      <div class="fs-title">📍 地图</div>
      <div style="width:60px"></div>
    </div>
    <div class="fs-body">${html}</div>
  `);
}

let currentMap = null;
function enterMap(mapId) {
  const m = D.MAP_DEFS.find(x=>x.id===mapId);
  if (!m) return;
  currentMap = m;
  const pet = getActivePet();
  const def = D.PET_DEFS[pet.defId];
  openFullscreen(`
    <div class="fs-header" style="background:${m.bg}">
      <button class="fs-back" onclick="closeFullscreen();currentMap=null">← 返回家园</button>
      <div class="fs-title">${m.icon} ${m.name}</div>
      <div style="width:60px"></div>
    </div>
    <div class="map-scene" id="mapScene" style="background:linear-gradient(180deg,${m.bg},#fff)">
      ${m.elements.map(e=>`
        <div class="map-element" style="left:${e.x}%;top:${e.y}%" onclick="clickMapElement('${e.id}')" title="${e.label}">${e.emoji}</div>
      `).join('')}
      <div class="map-pet">${def.emoji}</div>
      <button class="map-reward-btn" onclick="claimMapReward('${m.id}')">🎁 领取今日奖励</button>
    </div>
  `);
}

function clickMapElement(elId) {
  const m = currentMap;
  const e = m.elements.find(x=>x.id===elId);
  if (!e) return;
  const today = Storage.todayStr();
  const key = m.id+'_'+elId+'_'+today;
  if (!S._mapElemClaimed) S._mapElemClaimed = {};
  if (S._mapElemClaimed[key]) { toast('今天已经互动过了~'); return; }
  S._mapElemClaimed[key] = true;
  let text = '';
  if (e.reward.coin) { addCoin(e.reward.coin); text = `🪙+${e.reward.coin}`; Sound.play('coin'); }
  else if (e.reward.mood) { S.pets.forEach(p=>p.mood=Math.min(100,p.mood+e.reward.mood)); text=`所有宠物心情+${e.reward.mood}`; Sound.play('success'); }
  else if (e.reward.item === 'random') {
    const f = D.FOOD_DEFS[Math.floor(Math.random()*D.FOOD_DEFS.length)];
    S.inventory[f.id] = (S.inventory[f.id]||0)+1;
    text = `获得 ${f.emoji}${f.name}`;
    Sound.play('buy');
  } else if (e.reward.luck) {
    const fort = D.FORTUNES[Math.floor(Math.random()*D.FORTUNES.length)];
    S.dailyFortune = { date:today, id:fort.id, text:fort.text, effect:fort.effect };
    text = `🔮 获得运势：${fort.text}`;
    Sound.play('levelup');
  }
  Storage.save();
  floatReward(text, window.innerWidth/2, window.innerHeight/2);
  if (currentPage==='task') renderTaskPage();
}

function claimMapReward(mapId) {
  const today = Storage.todayStr();
  if (S.mapDailyReward[mapId] === today) { toast('今日奖励已领取~'); return; }
  S.mapDailyReward[mapId] = today;
  const m = D.MAP_DEFS.find(x=>x.id===mapId);
  let rewardText = '';
  switch(m.id) {
    case 'park': { const c = 10+Math.floor(Math.random()*41); addCoin(c); rewardText=`🪙+${c}`; break; }
    case 'forest': { const f=D.FOOD_DEFS[Math.floor(Math.random()*D.FOOD_DEFS.length)]; S.inventory[f.id]=(S.inventory[f.id]||0)+1; rewardText=`获得 ${f.emoji}${f.name}`; break; }
    case 'beach': { const c=30+Math.floor(Math.random()*51); addCoin(c); rewardText=`🪙+${c}`; break; }
    case 'spa': S.pets.forEach(p=>p.mood=Math.min(100,p.mood+20)); rewardText='所有宠物心情+20'; break;
    case 'snow': S.dailyFortune={date:today,id:'task_double',text:'双倍金币卡',effect:'task_double'}; rewardText='获得双倍金币卡！'; break;
    case 'castle': { const c=100+Math.floor(Math.random()*101); addCoin(c); const it=D.ACCESSORY_DEFS[Math.floor(Math.random()*D.ACCESSORY_DEFS.length)]; S.inventory[it.id]=(S.inventory[it.id]||0)+1; rewardText=`🪙+${c} + ${it.emoji}${it.name}`; break; }
    case 'magic': S.dailyFortune={date:today,id:'task_double',text:'答题双倍金币',effect:'task_double'}; rewardText='答题双倍金币！'; break;
  }
  Storage.save();
  Sound.play('levelup');
  floatReward(rewardText, window.innerWidth/2, window.innerHeight/2);
}

// ============ 签到日历 ============
function openSignCalendar() {
  let daysHTML = '';
  for (let i=1;i<=7;i++) {
    const signed = S.signStreak >= i;
    const isToday = S.signStreak === i;
    daysHTML += `<div class="sign-day ${signed?'signed':''} ${isToday?'today':''}">${i}<div class="day-reward">${i*10}金</div></div>`;
  }
  showModal('📅 签到日历', `
    <div style="text-align:center;font-size:14px;color:#6a7a8c;margin-bottom:8px">连续签到 ${S.signStreak} 天</div>
    <div class="sign-calendar">
      <div class="sign-days">${daysHTML}</div>
      <div style="font-size:12px;color:#8aa5b8;margin-top:24px">每日首次打开自动签到，第8天重置</div>
    </div>
  `, `<button class="btn-primary" onclick="closeModal()">知道了</button>`);
}

// ============ 成就墙 ============
function openAchievements() {
  let html = '<div class="achievement-grid">';
  D.ACHIEVEMENTS.forEach(a=>{
    const unlocked = S.achievements.includes(a.id);
    const done = a.check(S);
    if (done && !unlocked) { S.achievements.push(a.id); Storage.save(); }
    html += `<div class="achievement-card ${unlocked?'unlocked':'locked'}">
      <div class="ach-status">${unlocked?'✅':'🔒'}</div>
      <div class="ach-emoji">${unlocked?'🏆':'🎯'}</div>
      <div class="ach-name">${a.name}</div>
      <div class="ach-reward">${a.reward}</div>
    </div>`;
  });
  html += '</div>';
  openFullscreen(`
    <div class="fs-header">
      <button class="fs-back" onclick="closeFullscreen()">← 返回</button>
      <div class="fs-title">🏆 成就墙</div>
      <div style="width:60px"></div>
    </div>
    <div class="fs-body">${html}</div>
  `);
}

function checkAchievements() {
  D.ACHIEVEMENTS.forEach(a=>{
    if (!S.achievements.includes(a.id) && a.check(S)) {
      S.achievements.push(a.id);
      Storage.save();
      setTimeout(()=>showModal('🏆 成就解锁', `
        <div style="text-align:center;padding:10px">
          <div style="font-size:48px;margin-bottom:8px">🏆</div>
          <div style="font-size:16px;font-weight:bold;margin-bottom:6px">${a.name}</div>
          <div style="color:#FF9800">${a.reward}</div>
        </div>
      `, `<button class="btn-primary" onclick="closeModal()">好耶！</button>`), 500);
      Sound.play('levelup');
    }
  });
}

// ============ 小游戏 ============
function openMiniGameMenu() {
  const today = Storage.todayStr();
  if (S.dailyMiniGame.date !== today) S.dailyMiniGame = { date:today, frisbee:3, puzzle:1 };
  openFullscreen(`
    <div class="fs-header">
      <button class="fs-back" onclick="closeFullscreen()">← 返回</button>
      <div class="fs-title">🎮 小游戏</div>
      <div style="width:60px"></div>
    </div>
    <div class="fs-body">
      <div class="info-card" onclick="startFrisbee()">
        <h3>🥏 接飞盘</h3>
        <p>30秒内接住飞盘，每个+2金币<br>今日剩余 ${S.dailyMiniGame.frisbee} 次（上限30金/次）</p>
      </div>
      <div class="info-card" onclick="startPuzzle()">
        <h3>🧩 宠物拼图</h3>
        <p>4宫格拼图，完成+20金币+心情+5<br>今日剩余 ${S.dailyMiniGame.puzzle} 次</p>
      </div>
      <div class="info-card" onclick="openAchievements()">
        <h3>🏆 成就墙</h3>
        <p>查看已解锁成就</p>
      </div>
    </div>
  `);
}

// 接飞盘游戏
let frisbeeGame = null;
function startFrisbee() {
  if (S.dailyMiniGame.frisbee <= 0) { toast('今日次数已用完~'); return; }
  S.dailyMiniGame.frisbee--;
  Storage.save();
  openFullscreen(`
    <div class="fs-header">
      <button class="fs-back" onclick="quitFrisbee()">← 退出</button>
      <div class="fs-title">🥏 接飞盘</div>
      <div style="width:60px"></div>
    </div>
    <div class="game-area" id="frisbeeArea">
      <div class="game-score">接住：<span id="fsScore">0</span></div>
      <div class="game-time">⏱️ <span id="fsTime">30</span>s</div>
      <div class="game-pet" id="fsPet" style="left:45%">🐶</div>
    </div>
  `);
  frisbeeGame = { score:0, time:30, over:false, petX:45, frisbees:[] };
  // 触摸/鼠标控制
  const area = $('#frisbeeArea');
  const move = (clientX) => {
    const rect = area.getBoundingClientRect();
    const x = Math.max(0, Math.min(90, ((clientX-rect.left)/rect.width)*100 - 5));
    frisbeeGame.petX = x;
    const pet = $('#fsPet');
    if (pet) pet.style.left = x + '%';
  };
  area.addEventListener('touchmove', e=>{ e.preventDefault(); move(e.touches[0].clientX); });
  area.addEventListener('mousemove', e=>move(e.clientX));
  // 计时
  frisbeeGame.timer = setInterval(()=>{
    frisbeeGame.time--;
    const t = $('#fsTime'); if (t) t.textContent = frisbeeGame.time;
    if (frisbeeGame.time <= 0) endFrisbee();
  }, 1000);
  // 生成飞盘
  frisbeeGame.spawn = setInterval(()=>{
    if (frisbeeGame.over) return;
    const f = document.createElement('div');
    f.className = 'frisbee';
    f.textContent = '🥏';
    const x = Math.random()*90;
    f.style.left = x + '%';
    const dur = 2 + Math.random()*1.5;
    f.style.animationDuration = dur + 's';
    area.appendChild(f);
    frisbeeGame.frisbees.push({ el:f, x, start:Date.now(), dur:dur*1000 });
  }, 800);
  // 碰撞检测
  frisbeeGame.collide = setInterval(()=>{
    if (frisbeeGame.over) return;
    const now = Date.now();
    frisbeeGame.frisbees = frisbeeGame.frisbees.filter(fb=>{
      const elapsed = now - fb.start;
      const progress = elapsed / fb.dur;
      if (progress >= 1) { fb.el.remove(); return false; }
      // 在85%进度时检测接住
      if (progress > 0.8 && progress < 0.95 && !fb.caught) {
        if (Math.abs(fb.x - frisbeeGame.petX) < 12) {
          fb.caught = true;
          fb.el.remove();
          frisbeeGame.score++;
          const sc = $('#fsScore'); if (sc) sc.textContent = frisbeeGame.score;
          Sound.play('coin');
        }
      }
      return true;
    });
  }, 50);
}

function endFrisbee() {
  if (frisbeeGame.over) return;
  frisbeeGame.over = true;
  clearInterval(frisbeeGame.timer);
  clearInterval(frisbeeGame.spawn);
  clearInterval(frisbeeGame.collide);
  const coin = Math.min(30, frisbeeGame.score * 2);
  addCoin(coin);
  const pet = getActivePet();
  pet.mood = Math.min(100, pet.mood + 5);
  gainExp(pet, coin);
  Storage.save();
  Sound.play('levelup');
  openFullscreen(`
    <div class="fs-header"><div class="fs-title">🥏 游戏结束</div><div style="width:60px"></div></div>
    <div class="quiz-result">
      <div class="result-emoji">${frisbeeGame.score>=15?'🏆':frisbeeGame.score>=8?'🌟':'💪'}</div>
      <div class="result-text">接住 ${frisbeeGame.score} 个飞盘</div>
      <div class="result-coin">🪙 +${coin} · 心情+5</div>
      <button class="btn-primary" style="padding:12px 32px;border-radius:20px" onclick="closeFullscreen()">完成</button>
    </div>
  `);
  frisbeeGame = null;
}
function quitFrisbee() {
  if (frisbeeGame && !frisbeeGame.over) {
    if (confirm('退出游戏？')) endFrisbee();
  } else closeFullscreen();
}

// 拼图游戏
let puzzleGame = null;
function startPuzzle() {
  if (S.dailyMiniGame.puzzle <= 0) { toast('今日次数已用完~'); return; }
  S.dailyMiniGame.puzzle--;
  Storage.save();
  const emojis = ['🐶','🐱','🐰','🦊','🐼','🐧','🦄','🐯'];
  const target = emojis[Math.floor(Math.random()*emojis.length)];
  // 4宫格，正确顺序 0=左上, 1=右上, 2=左下, 3=右下
  const order = [0,1,2,3];
  // 打乱
  for (let i=order.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [order[i],order[j]]=[order[j],order[i]]; }
  // 确保不是已经完成的状态
  if (order.every((p,i)=>p===i)) [order[0],order[1]]=[order[1],order[0]];
  // 生成拼图块canvas
  const pieces = generatePuzzlePieces(target);
  puzzleGame = { target, order, selected:null, pieces };
  openFullscreen(`
    <div class="fs-header">
      <button class="fs-back" onclick="closeFullscreen()">← 退出</button>
      <div class="fs-title">🧩 拼图</div>
      <div style="width:60px"></div>
    </div>
    <div style="text-align:center;padding:16px;font-size:14px;color:#6a7a8c">目标：拼出 ${target}</div>
    <div class="puzzle-grid" id="puzzleGrid"></div>
    <div style="text-align:center;padding:12px;font-size:13px;color:#8aa5b8">点击两块交换位置</div>
  `);
  renderPuzzle();
}

// 用canvas生成拼图块（把一个emoji分成4象限）
function generatePuzzlePieces(emoji) {
  const size = 100;
  const fullCanvas = document.createElement('canvas');
  fullCanvas.width = size; fullCanvas.height = size;
  const ctx = fullCanvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, size, size);
  ctx.font = '80px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, size/2, size/2);
  const pieces = [];
  const half = size / 2;
  // piece 0: 左上, 1: 右上, 2: 左下, 3: 右下
  const sources = [
    { sx: 0, sy: 0 },           // 左上
    { sx: half, sy: 0 },        // 右上
    { sx: 0, sy: half },        // 左下
    { sx: half, sy: half },     // 右下
  ];
  for (let i = 0; i < 4; i++) {
    const c = document.createElement('canvas');
    c.width = half; c.height = half;
    const cx = c.getContext('2d');
    cx.fillStyle = '#fff';
    cx.fillRect(0, 0, half, half);
    cx.drawImage(fullCanvas, sources[i].sx, sources[i].sy, half, half, 0, 0, half, half);
    pieces.push(c.toDataURL());
  }
  return pieces;
}

function renderPuzzle() {
  const g = $('#puzzleGrid');
  if (!g) return;
  g.innerHTML = puzzleGame.order.map((pieceIdx, pos)=>{
    const correct = pieceIdx === pos;
    const imgSrc = puzzleGame.pieces[pieceIdx];
    return `<div class="puzzle-piece ${correct?'correct':''}" onclick="clickPuzzle(${pos})">
      <img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;pointer-events:none" draggable="false">
    </div>`;
  }).join('');
  // 检查完成
  if (puzzleGame.order.every((p,i)=>p===i)) {
    setTimeout(finishPuzzle, 500);
  }
}

function clickPuzzle(pos) {
  if (puzzleGame.selected === null) {
    puzzleGame.selected = pos;
  } else {
    const a = puzzleGame.selected, b = pos;
    [puzzleGame.order[a], puzzleGame.order[b]] = [puzzleGame.order[b], puzzleGame.order[a]];
    puzzleGame.selected = null;
    Sound.play('click');
    renderPuzzle();
  }
}

function finishPuzzle() {
  addCoin(20);
  const pet = getActivePet();
  pet.mood = Math.min(100, pet.mood + 5);
  gainExp(pet, 20);
  Storage.save();
  Sound.play('levelup');
  openFullscreen(`
    <div class="fs-header"><div class="fs-title">🧩 完成！</div><div style="width:60px"></div></div>
    <div class="quiz-result">
      <div class="result-emoji">🎉</div>
      <div class="result-text">拼图完成！</div>
      <div class="result-coin">🪙 +20 · 心情+5</div>
      <button class="btn-primary" style="padding:12px 32px;border-radius:20px" onclick="closeFullscreen()">完成</button>
    </div>
  `);
  puzzleGame = null;
}

// ============ 家长控制 ============
function showParentLock(onSuccess) {
  if (!S.parentPassword) {
    // 首次设置密码
    showModal('🔒 设置家长密码', `
      <div style="text-align:center;padding:10px">
        <div style="font-size:14px;color:#6a7a8c;margin-bottom:12px">请设置4位数字密码</div>
        <div class="lock-dots" id="pwdDots">
          <div class="lock-dot"></div><div class="lock-dot"></div>
          <div class="lock-dot"></div><div class="lock-dot"></div>
        </div>
        <div class="lock-keypad" id="pwdKeypad"></div>
      </div>
    `, '');
    let pwd = '';
    const keypad = $('#pwdKeypad');
    for (let i=1;i<=9;i++) keypad.innerHTML += `<button class="lock-key" onclick="inputPwd('${i}')">${i}</button>`;
    keypad.innerHTML += `<div></div><button class="lock-key" onclick="inputPwd('0')">0</button><button class="lock-key" onclick="inputPwd('del')">⌫</button>`;
    window._pwdInput = '';
    window._pwdMode = 'set';
    window._pwdOnSuccess = onSuccess;
    window.inputPwd = (k)=>{
      if (k==='del') window._pwdInput = window._pwdInput.slice(0,-1);
      else if (window._pwdInput.length < 4) window._pwdInput += k;
      const dots = $$('#pwdDots .lock-dot');
      dots.forEach((d,i)=>d.classList.toggle('filled', i<window._pwdInput.length));
      if (window._pwdInput.length === 4) {
        if (window._pwdMode === 'set') {
          S.parentPassword = window._pwdInput;
          Storage.save();
          closeModal();
          toast('密码已设置');
          onSuccess && onSuccess();
        } else {
          if (window._pwdInput === S.parentPassword) {
            closeModal();
            onSuccess && onSuccess();
          } else {
            toast('密码错误');
            window._pwdInput = '';
            dots.forEach(d=>d.classList.remove('filled'));
            Sound.play('error');
          }
        }
      }
    };
  } else {
    // 验证密码
    showModal('🔒 家长验证', `
      <div style="text-align:center;padding:10px">
        <div style="font-size:14px;color:#6a7a8c;margin-bottom:12px">请输入家长密码</div>
        <div class="lock-dots" id="pwdDots">
          <div class="lock-dot"></div><div class="lock-dot"></div>
          <div class="lock-dot"></div><div class="lock-dot"></div>
        </div>
        <div class="lock-keypad" id="pwdKeypad"></div>
      </div>
    `, '');
    let keypad = $('#pwdKeypad');
    for (let i=1;i<=9;i++) keypad.innerHTML += `<button class="lock-key" onclick="inputPwd('${i}')">${i}</button>`;
    keypad.innerHTML += `<div></div><button class="lock-key" onclick="inputPwd('0')">0</button><button class="lock-key" onclick="inputPwd('del')">⌫</button>`;
    window._pwdInput = '';
    window._pwdMode = 'verify';
    window._pwdOnSuccess = onSuccess;
    window.inputPwd = (k)=>{
      if (k==='del') window._pwdInput = window._pwdInput.slice(0,-1);
      else if (window._pwdInput.length < 4) window._pwdInput += k;
      const dots = $$('#pwdDots .lock-dot');
      dots.forEach((d,i)=>d.classList.toggle('filled', i<window._pwdInput.length));
      if (window._pwdInput.length === 4) {
        if (window._pwdMode === 'set') {
          S.parentPassword = window._pwdInput;
          Storage.save();
          closeModal();
          toast('密码已设置');
          onSuccess && onSuccess();
        } else {
          if (window._pwdInput === S.parentPassword) {
            closeModal();
            onSuccess && onSuccess();
          } else {
            toast('密码错误');
            window._pwdInput = '';
            dots.forEach(d=>d.classList.remove('filled'));
            Sound.play('error');
          }
        }
      }
    };
  }
}

function openParentPanel() {
  showParentLock(()=>showParentSettings());
}

function showParentSettings() {
  const ps = S.parentSettings;
  openFullscreen(`
    <div class="fs-header">
      <button class="fs-back" onclick="closeFullscreen()">← 返回</button>
      <div class="fs-title">⚙️ 家长控制</div>
      <div style="width:60px"></div>
    </div>
    <div class="fs-body">
      <div class="info-card">
        <h3>⏱️ 每日使用时长</h3>
        <p>当前：${ps.timeLimit===0?'不限':ps.timeLimit+'分钟'}</p>
        <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
          ${[0,30,45,60].map(m=>`<button class="shop-tab ${ps.timeLimit===m?'active':''}" onclick="setTimeLimit(${m})">${m===0?'不限':m+'分'}</button>`).join('')}
        </div>
      </div>
      <div class="info-card">
        <h3>🔔 学习提醒</h3>
        <p>设置提醒时间，到点弹窗提醒</p>
        <input type="time" value="${ps.remindTime||''}" onchange="setRemindTime(this.value)"
          style="margin-top:8px;padding:8px;border:2px solid #D4ECFC;border-radius:8px;font-size:14px">
      </div>
      <div class="info-card" onclick="showWeekReport()" style="cursor:pointer">
        <h3>📊 每周学习报告</h3>
        <p>点击查看本周完成情况</p>
      </div>
      <div class="info-card" onclick="resetPassword()" style="cursor:pointer">
        <h3>🔑 修改家长密码</h3>
        <p>重新设置4位数字密码</p>
      </div>
      <div class="info-card" onclick="Storage.reset()" style="cursor:pointer">
        <h3 style="color:#FF5252">⚠️ 重置全部数据</h3>
        <p style="color:#E57373">清除所有存档，重新开始</p>
      </div>
    </div>
  `);
}

function setTimeLimit(m) {
  S.parentSettings.timeLimit = m;
  Storage.save();
  showParentSettings();
  toast(m===0?'已取消时长限制':'已设置'+m+'分钟');
}
function setRemindTime(t) {
  S.parentSettings.remindTime = t;
  Storage.save();
  toast('提醒已设置');
}
function resetPassword() {
  if (confirm('确定重置家长密码？')) {
    S.parentPassword = '';
    Storage.save();
    closeFullscreen();
    toast('密码已重置，下次重新设置');
  }
}

function showWeekReport() {
  const st = S.stats;
  const intimacyChange = getActivePet().intimacy - st.weekIntimacyStart;
  openFullscreen(`
    <div class="fs-header">
      <button class="fs-back" onclick="closeFullscreen()">← 返回</button>
      <div class="fs-title">📊 本周学习报告</div>
      <div style="width:60px"></div>
    </div>
    <div class="fs-body">
      <div class="info-card"><h3>📝 完成任务</h3><p style="font-size:24px;color:#5B9BD5;font-weight:bold">${st.weekTasks} 个</p></div>
      <div class="info-card"><h3>✅ 答对题目</h3><p style="font-size:24px;color:#66BB6A;font-weight:bold">${st.weekAnswers} 题</p></div>
      <div class="info-card"><h3>🪙 赚取金币</h3><p style="font-size:24px;color:#FF9800;font-weight:bold">${st.weekCoins} 金</p></div>
      <div class="info-card"><h3>💖 亲密变化</h3><p style="font-size:24px;color:#EC407A;font-weight:bold">${intimacyChange>=0?'+':''}${intimacyChange}</p></div>
      <div class="info-card"><h3>🏆 月度挑战进度</h3>
        <p>签到 ${S.monthlyChallenge.signDays}天 · 答对 ${S.monthlyChallenge.answerRight}题 · 任务 ${S.monthlyChallenge.tasksDone}个</p>
      </div>
    </div>
  `);
}

// 使用时长检测
function checkTimeLimit() {
  const limit = S.parentSettings.timeLimit;
  if (limit === 0) return;
  const today = Storage.todayStr();
  if (S.useTimeToday.date !== today) S.useTimeToday = { date:today, seconds:0 };
  S.useTimeToday.seconds += 60; // 每分钟检测一次
  Storage.save();
  if (S.useTimeToday.seconds >= limit * 60) {
    showModal('😴 宠物困了', `
      <div style="text-align:center;padding:20px">
        <div style="font-size:64px;margin-bottom:12px">😴</div>
        <div style="font-size:16px;color:#5a6a7c">今天已经玩了${limit}分钟啦<br>宠物们要休息了，明天再来吧~</div>
      </div>
    `, `<button class="btn-primary" onclick="closeModal()">好的</button>`);
    document.body.style.filter = 'grayscale(1)';
    setTimeout(()=>document.body.style.filter='', 30000);
  }
}

// ============ 设置页 ============
function openSettings() {
  openFullscreen(`
    <div class="fs-header">
      <button class="fs-back" onclick="closeFullscreen()">← 返回</button>
      <div class="fs-title">⚙️ 设置</div>
      <div style="width:60px"></div>
    </div>
    <div class="fs-body">
      <div class="settings-list">
        <div class="settings-item">
          <span class="si-label">🎵 背景音乐</span>
          <div class="switch ${S.sound.bgm?'on':''}" onclick="toggleBGM(this)"></div>
        </div>
        <div class="settings-item">
          <span class="si-label">🔊 音效</span>
          <div class="switch ${S.sound.effect?'on':''}" onclick="toggleEffect(this)"></div>
        </div>
      </div>
      <div class="info-card" onclick="openParentPanel()" style="cursor:pointer">
        <h3>👨‍👩‍👧 家长控制</h3>
        <p>任务管理 · 时长限制 · 学习报告</p>
      </div>
      <div class="info-card" onclick="openAchievements()" style="cursor:pointer">
        <h3>🏆 成就墙</h3>
        <p>查看成就与奖励</p>
      </div>
      <div class="info-card" onclick="showAbout()" style="cursor:pointer">
        <h3>ℹ️ 关于</h3>
        <p>欣宝小宠 v1.0 · 给8岁宝贝的学习养成伙伴</p>
      </div>
    </div>
  `);
}
function toggleBGM(el) {
  S.sound.bgm = !S.sound.bgm;
  Storage.save();
  el.classList.toggle('on', S.sound.bgm);
  if (S.sound.bgm) Sound.startBGM(); else Sound.stopBGM();
}
function toggleEffect(el) {
  S.sound.effect = !S.sound.effect;
  Storage.save();
  el.classList.toggle('on', S.sound.effect);
  Sound.play('click');
}
function showAbout() {
  showModal('ℹ️ 关于欣宝小宠', `
    <div style="padding:10px;line-height:1.8;font-size:13px;color:#5a6a7c">
      <p style="text-align:center;font-size:32px;margin-bottom:10px">🐶</p>
      <p><b>欣宝小宠 v1.0</b></p>
      <p>给8岁宝贝的学习养成伙伴</p>
      <p>通过照顾虚拟宠物，培养孩子完成任务、答题学习的习惯</p>
      <p style="margin-top:12px;color:#8aa5b8">所有数据保存在本地，关闭不丢失</p>
    </div>
  `, `<button class="btn-primary" onclick="closeModal()">知道了</button>`);
}

// ============ 节日活动检测 ============
function checkFestival() {
  const d = new Date();
  const md = (d.getMonth()+1) + '-' + d.getDate();
  const f = D.FESTIVALS.find(x=>x.date===md);
  if (f) {
    const banner = document.createElement('div');
    banner.className = 'festival-banner';
    banner.textContent = `${f.emoji} ${f.name}活动：${f.rule}`;
    $('#app').insertBefore(banner, $('#content'));
  }
}

// ============ 事件绑定 ============
function bindEvents() {
  // 底部Tab
  $$('#tabbar .tab').forEach(t=>t.addEventListener('click', ()=>switchPage(t.dataset.page)));
  // 商店分类
  $$('#shopTabs .shop-tab').forEach(t=>t.addEventListener('click', ()=>{
    $$('#shopTabs .shop-tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    shopCategory = t.dataset.cat;
    renderShopList();
  }));
  // 相册Tab
  $$('#albumTabs .album-tab').forEach(t=>t.addEventListener('click', ()=>{
    $$('#albumTabs .album-tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    albumTab = t.dataset.tab;
    renderAlbumContent();
  }));
  // 顶部按钮
  $('#signBtn').addEventListener('click', openSignCalendar);
  $('#settingsBtn').addEventListener('click', openSettings);
  // 主页按钮
  $('#btnMap').addEventListener('click', openMapList);
  $('#btnDecorate').addEventListener('click', openDecorate);
  $('#btnCamera').addEventListener('click', takePhoto);
  $('#btnMiniGame').addEventListener('click', openMiniGameMenu);
  $('#btnBadges').addEventListener('click', openBadges);
  $('#btnPlayAll').addEventListener('click', btnPlayAll);
  $('#petDisplay').addEventListener('click', (e)=>{
    // 双击进详情
    if (e.detail === 2) openPetDetail();
  });
  // 任务页按钮
  $('#btnAnswer').addEventListener('click', startQuiz);
  $('#btnAddTask').addEventListener('click', addTask);
  $('#btnAccount').addEventListener('click', openAccount);
  $('#btnEnglish').addEventListener('click', openEnglish);
}

// ============ 初始化 ============
function init() {
  S = Storage.load();
  $('#coinNum').textContent = S.coin;
  dailyRefresh();
  autoGenerateDiary();
  checkFestival();
  maybeSpawnTraveler();
  bindEvents();
  switchPage('home');
  // 启动BGM
  setTimeout(()=>{ if (S.sound.bgm) Sound.startBGM(); }, 1000);
  // 使用时长检测
  setInterval(checkTimeLimit, 60000);
  // 宠物属性持续衰减（每分钟检测）
  setInterval(()=>{ decayPets(); Storage.save(); if (currentPage==='home') renderHome(); }, 60000);
  // 提醒时间检测
  setInterval(()=>{
    if (!S.parentSettings.remindTime) return;
    const now = new Date();
    const h = String(now.getHours()).padStart(2,'0');
    const m = String(now.getMinutes()).padStart(2,'0');
    if (h+':'+m === S.parentSettings.remindTime && !S._remindedToday) {
      S._remindedToday = true;
      setTimeout(()=>S._remindedToday=false, 60000);
      showModal('🔔 学习提醒', `
        <div style="text-align:center;padding:14px">
          <div style="font-size:48px;margin-bottom:8px">📚</div>
          <div style="font-size:15px;color:#5a6a7c">到学习时间啦！<br>快来完成任务，照顾宠物吧~</div>
        </div>
      `, `<button class="btn-primary" onclick="closeModal();switchPage('task')">去学习</button>`);
    }
  }, 30000);
}

// 启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ============ 记账功能 ============
const ACCOUNT_CATEGORIES_EXPENSE = [
  { id:'snack', name:'零食', emoji:'🍬', limit:5 },
  { id:'toy', name:'玩具', emoji:'🧸', limit:30 },
  { id:'stationery', name:'文具', emoji:'✏️', limit:10 },
  { id:'food', name:'吃饭', emoji:'🍚', limit:20 },
  { id:'other', name:'其他', emoji:'📦', limit:10 },
];
const ACCOUNT_CATEGORIES_INCOME = [
  { id:'redpacket', name:'红包', emoji:'🧧' },
  { id:'reward', name:'奖励', emoji:'🎁' },
  { id:'other_in', name:'其他', emoji:'💰' },
];

function openAccount() {
  const today = Storage.todayStr();
  const todayList = S.accounts.filter(a => {
    const d = new Date(a.time);
    return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate() === today;
  });
  const todayExpense = todayList.filter(a=>a.type==='expense').reduce((s,a)=>s+a.amount, 0);
  const todayIncome = todayList.filter(a=>a.type==='income').reduce((s,a)=>s+a.amount, 0);
  // 本周统计
  const monday = Storage.mondayStr();
  const weekList = S.accounts.filter(a => {
    const d = new Date(a.time);
    return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate() >= monday;
  });
  const weekExpense = weekList.filter(a=>a.type==='expense').reduce((s,a)=>s+a.amount, 0);

  let listHTML = '';
  if (!todayList.length) {
    listHTML = '<div style="text-align:center;color:#8aa5b8;padding:20px">今天还没有记账哦~</div>';
  } else {
    listHTML = todayList.slice().reverse().map(a => {
      const cats = a.type==='expense' ? ACCOUNT_CATEGORIES_EXPENSE : ACCOUNT_CATEGORIES_INCOME;
      const cat = cats.find(c=>c.id===a.category) || cats[cats.length-1];
      return `<div class="account-item ${a.type}">
        <div style="font-size:24px">${cat.emoji}</div>
        <div style="flex:1">
          <div style="font-weight:bold;color:#3a4a5c">${cat.name}${a.note?' · '+a.note:''}</div>
          <div style="font-size:11px;color:#8aa5b8">${formatTime(a.time)}</div>
        </div>
        <div style="font-weight:bold;color:${a.type==='expense'?'#e57373':'#66BB6A'}">${a.type==='expense'?'-':'+'}${a.amount}元</div>
        <span style="color:#e57373;font-size:16px;cursor:pointer;margin-left:6px" onclick="deleteAccount('${a.id}')">🗑️</span>
      </div>`;
    }).join('');
  }

  openFullscreen(`
    <div class="fs-header">
      <button class="fs-back" onclick="closeFullscreen()">← 返回</button>
      <div class="fs-title">💰 小记账本</div>
      <div style="width:60px"></div>
    </div>
    <div class="fs-body" style="padding:14px">
      <div class="account-summary">
        <div class="summary-card expense">
          <div style="font-size:12px;color:#8aa5b8">今日支出</div>
          <div style="font-size:20px;font-weight:bold;color:#e57373">${todayExpense}元</div>
        </div>
        <div class="summary-card income">
          <div style="font-size:12px;color:#8aa5b8">今日收入</div>
          <div style="font-size:20px;font-weight:bold;color:#66BB6A">${todayIncome}元</div>
        </div>
        <div class="summary-card week">
          <div style="font-size:12px;color:#8aa5b8">本周支出</div>
          <div style="font-size:20px;font-weight:bold;color:#5B9BD5">${weekExpense}元</div>
        </div>
      </div>
      <div class="account-tip">💡 小朋友，花钱要有计划哦！<br>每记一次账奖励5金币，每天最多5次</div>
      <div style="margin:12px 0">
        <div style="font-size:14px;font-weight:bold;color:#3a4a5c;margin-bottom:8px">今日记录</div>
        ${listHTML}
      </div>
    </div>
    <div style="padding:12px;display:flex;gap:8px">
      <button class="btn-warning" style="flex:1" onclick="addAccount('expense')">➕ 记支出</button>
      <button class="btn-success" style="flex:1" onclick="addAccount('income')">➕ 记收入</button>
    </div>
  `);
}

function addAccount(type) {
  const cats = type==='expense' ? ACCOUNT_CATEGORIES_EXPENSE : ACCOUNT_CATEGORIES_INCOME;
  const catHTML = cats.map((c,i)=>`<button class="account-cat-btn ${i===0?'sel':''}" data-cat="${c.id}" onclick="selectAccountCat(this)">${c.emoji} ${c.name}</button>`).join('');
  showModal(type==='expense'?'➕ 记支出':'➕ 记收入', `
    <div style="margin-bottom:10px">
      <div style="font-size:13px;color:#6a7a8c;margin-bottom:6px">分类</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap" id="accCats">${catHTML}</div>
    </div>
    <div style="margin-bottom:10px">
      <div style="font-size:13px;color:#6a7a8c;margin-bottom:6px">金额（元）</div>
      <input id="accAmount" type="number" min="0" step="0.5" placeholder="如 5" style="width:100%;padding:10px;border:2px solid #D4ECFC;border-radius:10px;font-size:16px">
    </div>
    <div style="margin-bottom:10px">
      <div style="font-size:13px;color:#6a7a8c;margin-bottom:6px">备注（选填）</div>
      <input id="accNote" type="text" maxlength="20" placeholder="如 买了小蛋糕" style="width:100%;padding:10px;border:2px solid #D4ECFC;border-radius:10px;font-size:14px">
    </div>
    ${type==='expense' ? '<div style="font-size:12px;color:#FFA726;background:#FFF8E1;padding:8px;border-radius:8px">💡 想一想：这个东西真的需要吗？<br>是不是已经有类似的了？</div>' : ''}
  `, `<button class="btn-cancel" onclick="closeModal()">取消</button>
      <button class="btn-primary" onclick="confirmAddAccount('${type}')">保存</button>`);
}

let _selectedAccCat = null;
function selectAccountCat(btn) {
  $$('#accCats .account-cat-btn').forEach(b=>b.classList.remove('sel'));
  btn.classList.add('sel');
  _selectedAccCat = btn.dataset.cat;
}

function confirmAddAccount(type) {
  const amount = parseFloat($('#accAmount').value);
  if (!amount || amount <= 0) { toast('请输入正确金额'); return; }
  const note = $('#accNote').value.trim();
  const category = _selectedAccCat || (type==='expense' ? ACCOUNT_CATEGORIES_EXPENSE[0].id : ACCOUNT_CATEGORIES_INCOME[0].id);
  S.accounts.push({ id:'a_'+Date.now(), type, category, amount, note, time:Date.now() });
  // 奖励金币（每日最多5次）
  const today = Storage.todayStr();
  if (S.dailyAccountReward.date !== today) S.dailyAccountReward = { date:today, count:0 };
  let reward = 0;
  if (S.dailyAccountReward.count < 5) {
    S.dailyAccountReward.count++;
    reward = 5;
    addCoin(reward);
  }
  Storage.save();
  closeModal();
  _selectedAccCat = null;
  // 理财小教育
  if (type==='expense' && amount >= 20) {
    setTimeout(()=>{
      toast('💡 大额支出要和爸爸妈妈商量哦~');
    }, 500);
  } else if (reward > 0) {
    toast(`记账成功！+${reward}金币 🎉`);
  } else {
    toast('记账成功~');
  }
  // 刷新记账页面
  openAccount();
}

function deleteAccount(id) {
  if (!confirm('删除这条记录？')) return;
  S.accounts = S.accounts.filter(a=>a.id !== id);
  Storage.save();
  toast('已删除');
  openAccount();
}

// ============ 英语学习功能（外研版 二升三） ============
let englishState = null;

function openEnglish() {
  const today = Storage.todayStr();
  if (S.englishProgress.date !== today) S.englishProgress = { date:today, learned:0, totalLearned:S.englishProgress.totalLearned||0 };
  const lessons = D.ENGLISH_LESSONS;
  let listHTML = lessons.map(l => {
    const done = (S.englishProgress.totalLearned||0) >= l.unit * 8;
    return `<div class="english-unit ${done?'done':''}" onclick="startEnglishLesson(${l.unit})">
      <div style="font-size:32px">${done?'✅':'📖'}</div>
      <div style="flex:1">
        <div style="font-weight:bold;color:#3a4a5c">Unit ${l.unit} · ${l.title}</div>
        <div style="font-size:12px;color:#8aa5b8">${l.words.length}个单词 · ${done?'已完成':'点击学习'}</div>
      </div>
      <div style="color:#5B9BD5;font-size:20px">▶</div>
    </div>`;
  }).join('');

  openFullscreen(`
    <div class="fs-header">
      <button class="fs-back" onclick="closeFullscreen()">← 返回</button>
      <div class="fs-title">🔤 英语学习</div>
      <div style="width:60px"></div>
    </div>
    <div class="fs-body" style="padding:14px">
      <div class="english-info">
        <div style="font-size:14px;color:#5a6a7c;margin-bottom:6px">📚 外研版（三年级起点）· 二升三衔接</div>
        <div style="font-size:13px;color:#8aa5b8">今日学习：${S.englishProgress.learned} 词 · 累计：${S.englishProgress.totalLearned} 词</div>
        <div style="font-size:12px;color:#66BB6A;margin-top:6px">🎁 每学完1个单元奖励20金币！</div>
      </div>
      <div style="margin-top:12px">${listHTML}</div>
    </div>
  `);
}

function startEnglishLesson(unit) {
  const lesson = D.ENGLISH_LESSONS.find(l=>l.unit===unit);
  if (!lesson) return;
  englishState = { lesson, idx:0, learned:0 };
  showEnglishWord();
}

function showEnglishWord() {
  if (!englishState) return;
  const { lesson, idx } = englishState;
  if (idx >= lesson.words.length) {
    // 学完本单元，显示句子并奖励
    finishEnglishLesson();
    return;
  }
  const w = lesson.words[idx];
  openFullscreen(`
    <div class="fs-header">
      <button class="fs-back" onclick="quitEnglish()">← 退出</button>
      <div class="fs-title">📖 Unit ${lesson.unit} · ${lesson.title}</div>
      <div style="width:60px"></div>
    </div>
    <div class="quiz-progress">
      <span>第 ${idx+1} / ${lesson.words.length} 个单词</span>
      <span style="color:#66BB6A">✅ ${englishState.learned}</span>
    </div>
    <div class="english-word-card">
      <div class="english-en">${w.en}</div>
      <div class="english-cn">${w.cn}</div>
      <div class="english-example">💬 ${w.example}</div>
      <button class="english-speak-btn" onclick="speakEnglish('${w.en}')">🔊 听发音</button>
    </div>
    <div style="padding:12px;display:flex;gap:8px">
      ${idx>0?'<button class="btn-cancel" style="flex:1" onclick="englishPrev()">← 上一个</button>':''}
      <button class="btn-primary" style="flex:2" onclick="englishNext()">我学会了 →</button>
    </div>
  `);
}

function englishNext() {
  englishState.learned++;
  englishState.idx++;
  Sound.play('success');
  showEnglishWord();
}

function englishPrev() {
  if (englishState.idx > 0) {
    englishState.idx--;
    showEnglishWord();
  }
}

function quitEnglish() {
  if (confirm('退出学习？已学的会保存进度')) {
    closeFullscreen();
    englishState = null;
  }
}

function finishEnglishLesson() {
  const { lesson } = englishState;
  const today = Storage.todayStr();
  if (S.englishProgress.date !== today) S.englishProgress = { date:today, learned:0, totalLearned:S.englishProgress.totalLearned||0 };
  // 判断是否首次完成该单元
  const wasComplete = (S.englishProgress.totalLearned||0) >= lesson.unit * 8;
  S.englishProgress.learned += lesson.words.length;
  S.englishProgress.totalLearned = (S.englishProgress.totalLearned||0) + lesson.words.length;
  let reward = 0;
  if (!wasComplete) {
    reward = 20;
    addCoin(reward);
  }
  Storage.save();
  Sound.play('levelup');
  openFullscreen(`
    <div class="fs-header"><div class="fs-title">🎉 学完啦！</div><div style="width:60px"></div></div>
    <div class="quiz-result">
      <div class="result-emoji">🎓</div>
      <div class="result-text">Unit ${lesson.unit} 完成！</div>
      <div style="margin:12px 0;padding:12px;background:#EAF6FF;border-radius:10px;font-size:14px;color:#3a4a5c">
        <div style="font-weight:bold;margin-bottom:6px">📝 本单元句子：</div>
        ${lesson.sentence}
      </div>
      ${reward>0?`<div class="result-coin">🪙 +${reward} 金币</div>`:'<div style="color:#8aa5b8;font-size:13px">重复学习不再奖励金币~</div>'}
      <div style="margin-top:10px;font-size:13px;color:#66BB6A">累计学习：${S.englishProgress.totalLearned} 个单词</div>
    </div>
    <div style="padding:12px;display:flex;gap:8px">
      <button class="btn-cancel" style="flex:1" onclick="openEnglish()">返回单元</button>
      <button class="btn-primary" style="flex:1" onclick="startEnglishQuiz(${lesson.unit})">🧪 来挑战检验！</button>
    </div>
  `);
  englishState = null;
}

// ============ 英语学习检验 ============
let englishQuizState = null;

function startEnglishQuiz(unit) {
  const lesson = D.ENGLISH_LESSONS.find(l=>l.unit===unit);
  if (!lesson) return;
  // 生成5道题：随机出英文选中文，或出中文选英文
  const words = lesson.words.slice();
  const questions = [];
  for (let i = 0; i < 5 && words.length > 0; i++) {
    const idx = Math.floor(Math.random() * words.length);
    const w = words.splice(idx, 1)[0];
    // 随机决定出题方向
    const askEn = Math.random() < 0.5;
    if (askEn) {
      // 出英文，选中文
      const wrongs = lesson.words.filter(x=>x.cn!==w.cn).sort(()=>Math.random()-0.5).slice(0,3).map(x=>x.cn);
      const options = [...wrongs, w.cn].sort(()=>Math.random()-0.5);
      questions.push({ q:`"${w.en}" 是什么意思？`, options, answer: options.indexOf(w.cn), word:w });
    } else {
      // 出中文，选英文
      const wrongs = lesson.words.filter(x=>x.en!==w.en).sort(()=>Math.random()-0.5).slice(0,3).map(x=>x.en);
      const options = [...wrongs, w.en].sort(()=>Math.random()-0.5);
      questions.push({ q:`"${w.cn}" 的英文是？`, options, answer: options.indexOf(w.en), word:w });
    }
  }
  englishQuizState = { questions, idx:0, correct:0, unit, reward:0 };
  showEnglishQuiz();
}

function showEnglishQuiz() {
  if (!englishQuizState) return;
  const { questions, idx, correct } = englishQuizState;
  if (idx >= questions.length) {
    finishEnglishQuiz();
    return;
  }
  const q = questions[idx];
  openFullscreen(`
    <div class="fs-header">
      <div class="fs-title">🧪 学习检验</div>
      <div style="width:60px"></div>
    </div>
    <div class="quiz-progress">
      <span>第 ${idx+1} / ${questions.length} 题</span>
      <span style="color:#66BB6A">✅ ${correct}</span>
    </div>
    <div class="quiz-question-box">
      <div class="quiz-q-text">${q.q}</div>
      <div class="quiz-options-vertical">
        ${q.options.map((o,i)=>`<button class="quiz-option-v" onclick="answerEnglishQuiz(${i})">${o}</button>`).join('')}
      </div>
    </div>
    <div style="text-align:center;font-size:12px;color:#8aa5b8;padding:8px">💡 答对越多，奖励越多！</div>
  `);
}

function answerEnglishQuiz(i) {
  const st = englishQuizState;
  const q = st.questions[st.idx];
  if (i === q.answer) {
    st.correct++;
    st.reward += 5;
    Sound.play('success');
  } else {
    Sound.play('fail');
  }
  st.idx++;
  setTimeout(showEnglishQuiz, 600);
}

function finishEnglishQuiz() {
  const { correct, questions, unit, reward } = englishQuizState;
  const total = questions.length;
  const allCorrect = correct === total;
  let bonus = 0;
  let bonusText = '';
  if (allCorrect) {
    bonus = 30;
    bonusText = '🏆 全对奖励 +30 金币';
  } else if (correct >= total - 1) {
    bonus = 15;
    bonusText = '⭐ 接近全对 +15 金币';
  }
  const totalReward = reward + bonus;
  if (totalReward > 0) addCoin(totalReward);
  Storage.save();
  Sound.play(allCorrect ? 'levelup' : 'success');
  const emoji = allCorrect ? '🏆' : (correct >= 3 ? '🎉' : '💪');
  openFullscreen(`
    <div class="fs-header"><div class="fs-title">🧪 检验结果</div><div style="width:60px"></div></div>
    <div class="quiz-result">
      <div class="result-emoji">${emoji}</div>
      <div class="result-text">答对 ${correct} / ${total} 题</div>
      <div style="margin:12px 0">
        ${correct > 0 ? `<div style="color:#66BB6A;font-size:15px">基础奖励 +${reward} 金币</div>` : ''}
        ${bonusText ? `<div style="color:#FFA726;font-size:15px;margin-top:4px">${bonusText}</div>` : ''}
        ${totalReward > 0 ? `<div class="result-coin">🪙 共 +${totalReward} 金币</div>` : '<div style="color:#8aa5b8">继续努力哦~</div>'}
      </div>
      ${allCorrect ? '<div style="font-size:13px;color:#1565C0;background:#E3F2FD;padding:10px;border-radius:10px;margin-top:8px">🌟 太棒了！你已经完全掌握这个单元啦！</div>' : ''}
    </div>
    <div style="padding:12px;display:flex;gap:8px">
      <button class="btn-cancel" style="flex:1" onclick="openEnglish()">返回单元</button>
      <button class="btn-primary" style="flex:1" onclick="closeFullscreen()">完成</button>
    </div>
  `);
  englishQuizState = null;
}

// 朗读英语（使用浏览器语音合成）
function speakEnglish(text) {
  if (!('speechSynthesis' in window)) { toast('浏览器不支持发音~'); return; }
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.8;
    window.speechSynthesis.speak(u);
  } catch(e) {
    toast('发音失败~');
  }
}

// ============ 写信与回信功能 ============
const LETTER_REPLY_DELAY = 5 * 60 * 1000; // 5分钟后回信（体验优化，避免等1小时）

function writeLetter() {
  const pet = getActivePet();
  showModal('✉️ 给' + pet.name + '写信', `
    <div style="font-size:13px;color:#6a7a8c;margin-bottom:6px">写一句想对${pet.name}说的话吧~</div>
    <textarea id="letterContent" maxlength="100" placeholder="比如：${pet.name}，今天在学校被表扬了！" style="width:100%;min-height:80px;padding:10px;border:2px solid #D4ECFC;border-radius:10px;font-size:14px;font-family:inherit;resize:none"></textarea>
    <div style="font-size:11px;color:#8aa5b8;margin-top:4px">💌 ${pet.name}会认真读你的信，并很快给你回信哦~</div>
  `, `<button class="btn-cancel" onclick="closeModal()">取消</button>
      <button class="btn-primary" onclick="sendLetter()">寄出</button>`);
}

function sendLetter() {
  const content = $('#letterContent').value.trim();
  if (!content) { toast('写点什么吧~'); return; }
  const pet = getActivePet();
  const reply = D.PET_REPLIES[Math.floor(Math.random()*D.PET_REPLIES.length)];
  const letter = {
    id: 'l_' + Date.now(),
    petId: pet.id,
    petName: pet.name,
    content,
    reply,
    replyTime: Date.now() + LETTER_REPLY_DELAY,
    time: Date.now(),
    read: false,
  };
  S.letters.push(letter);
  Storage.save();
  closeModal();
  Sound.play('success');
  toast('💌 信已寄出！' + pet.name + '会很快回信~');
  // 亲密+3
  addIntimacy(3);
  // 重新打开详情页
  setTimeout(openPetDetail, 300);
}

function openLetter(id, from) {
  const l = S.letters.find(x=>x.id===id);
  if (!l) return;
  const replyReady = l.reply && Date.now() >= l.replyTime;
  let replyHTML = '';
  if (!l.reply) {
    replyHTML = '<div class="letter-waiting">⏳ 信还在路上，请耐心等待~</div>';
  } else if (!replyReady) {
    const left = Math.ceil((l.replyTime - Date.now()) / 60000);
    replyHTML = `<div class="letter-waiting">⏳ ${l.petName}正在写回信，约还有${left}分钟~</div>`;
  } else {
    replyHTML = `<div class="letter-reply">
      <div style="font-size:13px;color:#66BB6A;font-weight:bold;margin-bottom:6px">💌 ${l.petName}的回信：</div>
      <div style="font-size:15px;color:#3a4a5c;line-height:1.6">${l.reply}</div>
    </div>`;
    if (!l.read) { l.read = true; Storage.save(); }
  }
  const backAction = from === 'album' ? 'closeFullscreen()' : 'openPetDetail()';
  openFullscreen(`
    <div class="fs-header">
      <button class="fs-back" onclick="${backAction}">← 返回</button>
      <div class="fs-title">✉️ 信件</div>
      <div style="width:60px"></div>
    </div>
    <div class="fs-body" style="padding:16px">
      <div class="letter-detail">
        <div class="letter-from">👧 小欣 → 🐾 ${l.petName}</div>
        <div style="font-size:11px;color:#8aa5b8;margin-bottom:8px">${formatTime(l.time)}</div>
        <div class="letter-content">${l.content}</div>
        ${replyHTML}
      </div>
    </div>
    <div style="padding:12px">
      <button class="btn-cancel" style="width:100%" onclick="${backAction}">返回</button>
    </div>
  `);
}

// 检查是否有新回信到达（用于主页提示）
function checkNewReplies() {
  const newReplies = S.letters.filter(l => l.reply && Date.now() >= l.replyTime && !l.read);
  if (newReplies.length > 0) {
    const l = newReplies[0];
    setTimeout(() => {
      toast(`💌 ${l.petName}给你回信啦！快去看看~`);
    }, 2000);
  }
}

// ============ 天气与四季系统 ============
function updateWeather() {
  const today = Storage.todayStr();
  if (S.weather.date !== today) {
    // 每天随机天气
    const types = D.WEATHER_TYPES;
    S.weather.type = types[Math.floor(Math.random()*types.length)].id;
    S.weather.date = today;
    // 根据月份设置季节
    const month = new Date().getMonth() + 1;
    if (month>=3 && month<=5) S.weather.season = 'spring';
    else if (month>=6 && month<=8) S.weather.season = 'summer';
    else if (month>=9 && month<=11) S.weather.season = 'autumn';
    else S.weather.season = 'winter';
    Storage.save();
  }
}

function getWeatherInfo() {
  return D.WEATHER_TYPES.find(w=>w.id===S.weather.type) || D.WEATHER_TYPES[0];
}

function renderWeatherEffect() {
  const w = getWeatherInfo();
  let particles = '';
  if (w.particle === 'rain') {
    // 雨滴
    for (let i=0; i<30; i++) {
      const left = Math.random()*100;
      const delay = Math.random()*2;
      const dur = 0.6 + Math.random()*0.4;
      particles += `<div class="rain-drop" style="left:${left}%;animation-delay:${delay}s;animation-duration:${dur}s"></div>`;
    }
  } else if (w.particle === 'snow') {
    // 雪花
    for (let i=0; i<20; i++) {
      const left = Math.random()*100;
      const delay = Math.random()*3;
      const dur = 4 + Math.random()*3;
      const size = 8 + Math.random()*8;
      particles += `<div class="snow-flake" style="left:${left}%;animation-delay:${delay}s;animation-duration:${dur}s;font-size:${size}px">❄</div>`;
    }
  } else if (w.particle === 'sun') {
    // 阳光斑点
    for (let i=0; i<8; i++) {
      const left = Math.random()*100;
      const top = Math.random()*60;
      const delay = Math.random()*3;
      particles += `<div class="sun-spot" style="left:${left}%;top:${top}%;animation-delay:${delay}s"></div>`;
    }
  } else if (w.particle === 'cloud') {
    // 云朵
    for (let i=0; i<3; i++) {
      const left = Math.random()*80;
      const delay = Math.random()*5;
      particles += `<div class="cloud-puff" style="left:${left}%;animation-delay:${delay}s">☁️</div>`;
    }
  }
  return `<div class="weather-effect weather-${w.id}">${particles}</div>`;
}

function getWeatherTalk() {
  const talks = D.WEATHER_TALKS[S.weather.type] || D.WEATHER_TALKS.sunny;
  return talks[Math.floor(Math.random()*talks.length)];
}

// ============ 旅行者系统 ============
function maybeSpawnTraveler() {
  // 每周1-2次，判断今天是否生成（基于周一日期）
  const today = Storage.todayStr();
  const monday = Storage.mondayStr();
  // 本周已生成过的旅行者记录在 travelers 里的 visitedWeek
  if (!S.travelers.visitedWeek || S.travelers.visitedWeek !== monday) {
    S.travelers.visitedWeek = monday;
    S.travelers.weekCount = 0;
  }
  if (S.travelers.lastDate === today) return; // 今天已生成
  if (S.travelers.weekCount >= 2) return; // 本周已达上限
  // 30% 概率生成
  if (Math.random() < 0.3) {
    const t = D.TRAVELERS[Math.floor(Math.random()*D.TRAVELERS.length)];
    S.travelers.current = t;
    S.travelers.lastDate = today;
    S.travelers.weekCount = (S.travelers.weekCount||0) + 1;
    Storage.save();
    setTimeout(()=>{
      toast(`🏕️ 一位${t.name}来访了！`);
    }, 3000);
  }
}

function showTraveler() {
  if (!S.travelers.current) {
    toast('今天没有旅行者来访~');
    return;
  }
  const t = S.travelers.current;
  const hasFood = (S.inventory[t.wantItemId] || 0) > 0;
  openFullscreen(`
    <div class="fs-header">
      <div class="fs-title">🏕️ 旅行者来访</div>
      <div style="width:60px"></div>
    </div>
    <div class="fs-body" style="padding:16px;text-align:center">
      <div style="font-size:80px;margin:16px 0">${t.emoji}</div>
      <div style="font-size:18px;font-weight:bold;color:#3a4a5c;margin-bottom:8px">${t.name}</div>
      <div style="background:#EAF6FF;padding:14px;border-radius:12px;font-size:15px;color:#3a4a5c;line-height:1.6;margin:12px 0">
        "你好呀，小朋友！我是来自远方的旅行者。<br>能给我一点${t.want}吗？我会送你一份远方礼物的~"
      </div>
      <div style="font-size:13px;color:#8aa5b8">你的背包里有${t.want}：${S.inventory[t.wantItemId]||0} 个</div>
    </div>
    <div style="padding:12px;display:flex;gap:8px">
      <button class="btn-cancel" style="flex:1" onclick="closeFullscreen()">下次再说</button>
      <button class="btn-primary" style="flex:1" ${hasFood?'':'disabled style="flex:1;opacity:0.5"'} onclick="helpTraveler()">给它${t.want}</button>
    </div>
  `);
}

function helpTraveler() {
  const t = S.travelers.current;
  if (!t) return;
  if ((S.inventory[t.wantItemId]||0) <= 0) { toast('背包里没有'+t.want+'~'); return; }
  S.inventory[t.wantItemId]--;
  S.travelers.helpedCount = (S.travelers.helpedCount||0) + 1;
  // 给礼物
  S.inventory[t.gift] = (S.inventory[t.gift]||0) + 1;
  const thanks = D.TRAVELER_THANKS[Math.floor(Math.random()*D.TRAVELER_THANKS.length)];
  // 帮助3次送地图碎片
  let extraMsg = '';
  if (S.travelers.helpedCount % 3 === 0) {
    S.travelers.mapFragments = (S.travelers.mapFragments||0) + 1;
    extraMsg = `\n🗺️ 额外赠送：神秘地图碎片 ×1（已有${S.travelers.mapFragments}/3）`;
    if (S.travelers.mapFragments >= 3 && !S.travelers.treasureClaimed) {
      S.travelers.treasureClaimed = true;
      addCoin(200);
      extraMsg += '\n🏆 集齐3张碎片合成藏宝图！挖出宝藏：+200金币！';
    }
  }
  Storage.save();
  S.travelers.current = null;
  Storage.save();
  Sound.play('success');
  closeFullscreen();
  // 亲密+5
  addIntimacy(5);
  setTimeout(()=>{
    openFullscreen(`
      <div class="fs-header"><div class="fs-title">🎁 旅行者的礼物</div><div style="width:60px"></div></div>
      <div class="fs-body" style="padding:20px;text-align:center">
        <div style="font-size:60px;margin:12px 0">${t.emoji}</div>
        <div style="background:#E8F5E9;padding:14px;border-radius:12px;font-size:15px;color:#2E7D32;line-height:1.8;margin:12px 0">"${thanks}"</div>
        <div style="background:#FFF8E1;padding:12px;border-radius:10px;font-size:14px;color:#FFA726;margin-top:8px">
          收到礼物：${t.gift} ×1
          ${extraMsg}
        </div>
      </div>
      <div style="padding:12px">
        <button class="btn-primary" style="width:100%" onclick="closeFullscreen()">好开心~</button>
      </div>
    `);
  }, 400);
}

// ============ 悄悄画（Canvas涂鸦） ============
let drawState = null;

function openDrawing() {
  const pet = getActivePet();
  drawState = { color:'#FF6B9D', size:6, isDrawing:false, sticker:null };
  openFullscreen(`
    <div class="fs-header">
      <button class="fs-back" onclick="closeFullscreen()">← 返回</button>
      <div class="fs-title">🎨 悄悄画给${pet.name}</div>
      <div style="width:60px"></div>
    </div>
    <div class="fs-body" style="padding:12px">
      <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;justify-content:center">
        ${['#FF6B9D','#5B9BD5','#66BB6A','#FFA726','#7E57C2','#000000'].map(c=>`<div class="color-pick ${c===drawState.color?'sel':''}" style="background:${c}" onclick="pickColor('${c}')"></div>`).join('')}
        <div class="size-pick" onclick="pickSize(4)">细</div>
        <div class="size-pick sel" onclick="pickSize(6)">中</div>
        <div class="size-pick" onclick="pickSize(12)">粗</div>
        <div class="size-pick" onclick="pickSize(20)">擦</div>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;justify-content:center">
        ${['🦴','🎀','⭐','💖','🌈','🌸'].map(s=>`<button class="sticker-btn" onclick="pickSticker('${s}')">${s}</button>`).join('')}
      </div>
      <canvas id="drawCanvas" width="320" height="320" style="background:#fff;border:2px solid #D4ECFC;border-radius:12px;display:block;margin:0 auto;touch-action:none;cursor:crosshair"></canvas>
    </div>
    <div style="padding:12px;display:flex;gap:8px">
      <button class="btn-cancel" style="flex:1" onclick="clearDrawing()">🗑️ 清空</button>
      <button class="btn-primary" style="flex:1" onclick="saveDrawing()">💾 送给${pet.name}</button>
    </div>
  `);
  // 初始化画板
  setTimeout(initCanvas, 100);
}

function initCanvas() {
  const canvas = $('#drawCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawState.ctx = ctx;
  drawState.canvas = canvas;

  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    return { x:(touch.clientX-rect.left)*sx, y:(touch.clientY-rect.top)*sy };
  };

  const start = (e) => {
    e.preventDefault();
    if (drawState.sticker) {
      // 贴贴纸
      const p = getPos(e);
      ctx.font = `${drawState.size*4}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(drawState.sticker, p.x, p.y);
      drawState.sticker = null;
      $$('.sticker-btn').forEach(b=>b.style.background='#EAF6FF');
      return;
    }
    drawState.isDrawing = true;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const move = (e) => {
    if (!drawState.isDrawing) return;
    e.preventDefault();
    const p = getPos(e);
    ctx.strokeStyle = drawState.size===20 ? '#fff' : drawState.color;
    ctx.lineWidth = drawState.size===20 ? 25 : drawState.size;
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };
  const end = () => { drawState.isDrawing = false; };

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  canvas.addEventListener('mouseup', end);
  canvas.addEventListener('mouseleave', end);
  canvas.addEventListener('touchstart', start, {passive:false});
  canvas.addEventListener('touchmove', move, {passive:false});
  canvas.addEventListener('touchend', end);
}

function pickColor(c) {
  drawState.color = c;
  $$('.color-pick').forEach(d=>d.classList.remove('sel'));
  event.target.classList.add('sel');
}
function pickSize(s) {
  drawState.size = s;
  $$('.size-pick').forEach(d=>d.classList.remove('sel'));
  event.target.classList.add('sel');
}
function pickSticker(s) {
  drawState.sticker = s;
  drawState.size = 6;
  $$('.sticker-btn').forEach(b=>b.style.background='#EAF6FF');
  event.target.style.background = '#5B9BD5';
}

function clearDrawing() {
  if (!drawState.ctx) return;
  drawState.ctx.fillStyle = '#fff';
  drawState.ctx.fillRect(0,0,drawState.canvas.width,drawState.canvas.height);
}

function saveDrawing() {
  if (!drawState.canvas) return;
  const pet = getActivePet();
  const dataURL = drawState.canvas.toDataURL('image/png');
  // 宠物反馈
  const comments = [
    '主人画的骨头看起来好好吃！',
    '哇！主人画得真棒！',
    '我喜欢这幅画！要珍藏起来~',
    '主人真有才华！',
    '这幅画让我心情好好~',
  ];
  const comment = comments[Math.floor(Math.random()*comments.length)];
  S.drawings.push({
    id:'d_'+Date.now(),
    petId:pet.id,
    petName:pet.name,
    dataURL,
    petComment:comment,
    time:Date.now(),
  });
  Storage.save();
  Sound.play('success');
  closeFullscreen();
  // 亲密+5
  addIntimacy(5);
  toast('🎨 画作已保存！'+pet.name+'：'+comment);
  drawState = null;
  setTimeout(openPetDetail, 300);
}

function viewDrawing(id, from) {
  const d = S.drawings.find(x=>x.id===id);
  if (!d) return;
  const backAction = from === 'album' ? 'closeFullscreen()' : 'openPetDetail()';
  openFullscreen(`
    <div class="fs-header">
      <button class="fs-back" onclick="${backAction}">← 返回</button>
      <div class="fs-title">🎨 画作</div>
      <div style="width:60px"></div>
    </div>
    <div class="fs-body" style="padding:16px;text-align:center">
      <img src="${d.dataURL}" style="max-width:100%;border-radius:12px;border:2px solid #D4ECFC">
      <div style="background:#E8F5E9;padding:12px;border-radius:10px;margin-top:12px;font-size:14px;color:#2E7D32">
        🐾 ${d.petName}：${d.petComment}
      </div>
      <div style="font-size:11px;color:#8aa5b8;margin-top:8px">${formatTime(d.time)}</div>
    </div>
    <div style="padding:12px;display:flex;gap:8px">
      <button class="btn-cancel" style="flex:1" onclick="deleteDrawing('${d.id}','${from||''}')">🗑️ 删除</button>
      <button class="btn-primary" style="flex:1" onclick="${backAction}">返回</button>
    </div>
  `);
}

function deleteDrawing(id, from) {
  if (!confirm('删除这幅画？')) return;
  S.drawings = S.drawings.filter(x=>x.id!==id);
  Storage.save();
  toast('已删除');
  if (from === 'album') {
    closeFullscreen();
    renderAlbumContent();
  } else {
    openPetDetail();
  }
}

// ============ 徽章墙与称号系统 ============
function checkBadges() {
  const earned = new Set(S.badges);
  const newBadges = [];
  const pets = S.pets;
  const totalIntimacy = pets.reduce((s,p)=>s+p.intimacy, 0);
  const maxIntimacy = pets.reduce((m,p)=>Math.max(m,p.intimacy), 0);

  const checks = [
    ['coin_master', S.coin >= 10000],
    ['pet_collector', pets.length >= 5],
    ['intimacy_max', maxIntimacy >= 1000],
    ['explorer', S.unlockedMaps && S.unlockedMaps.length >= 7],
    ['sign_7', (S.signDays||0) >= 7],
    ['breakfast_master', (S.stats && S.stats.feedCount||0) >= 10],
    ['frisbee_pro', (S.stats && S.stats.frisbeeCount||0) >= 10],
    ['bath_lover', (S.stats && S.stats.bathCount||0) >= 10],
    ['quiz_scholar', (S.stats && S.stats.totalQuizRight||0) >= 50],
    ['english_star', (S.englishProgress.totalLearned||0) >= 64],
    ['account_keeper', (S.accounts||[]).length >= 20],
    ['pen_pal', (S.letters||[]).length >= 5],
    ['artist', (S.drawings||[]).length >= 3],
    ['helper', (S.travelers && S.travelers.helpedCount||0) >= 3],
    // 游戏徽章
    ['race_rookie', S.gameStats.raceTotalScore >= 5000],
    ['race_king', S.gameStats.raceBestScore >= 2000],
    ['memory_clear', S.gameStats.memoryClears >= 1],
    ['rainbow_lover', S.gameStats.paintRainbows >= 10],
    ['game_master',
      (S.gameStats.racePlays >= 1) &&
      (S.gameStats.paintPlays >= 1) &&
      (S.gameStats.memoryPlays >= 1) &&
      ((S.gameStats.rhythmPlays||0) >= 1)],
  ];
  checks.forEach(([id, cond]) => {
    if (cond && !earned.has(id)) {
      earned.add(id);
      newBadges.push(id);
    }
  });
  if (newBadges.length) {
    S.badges = Array.from(earned);
    Storage.save();
    // 提示
    newBadges.forEach((id, i) => {
      const b = D.BADGES.find(x=>x.id===id);
      if (b) {
        setTimeout(()=>{
          toast(`🏅 获得新徽章：${b.icon} ${b.name}！`);
          Sound.play('levelup');
        }, 500 + i*1500);
      }
    });
  }
}

function openBadges() {
  checkBadges();
  let badgeHTML = D.BADGES.map(b => {
    const earned = S.badges.includes(b.id);
    return `<div class="badge-card ${earned?'earned':'locked'}">
      <div class="badge-icon" style="background:${earned?b.color:'#ccc'}">${b.icon}</div>
      <div class="badge-name">${b.name}</div>
      <div class="badge-desc">${b.desc}</div>
      ${earned?'<div class="badge-tag">已获得</div>':'<div class="badge-tag lock">未解锁</div>'}
    </div>`;
  }).join('');

  // 称号选择
  const availableTitles = D.TITLES.filter(t => checkTitleCond(t.id));
  let titleHTML = availableTitles.map(t => {
    const wearing = S.title === t.id;
    return `<button class="title-chip ${wearing?'wearing':''}" onclick="wearTitle('${t.id}')">${t.name} ${wearing?'✓':''}</button>`;
  }).join('');

  openFullscreen(`
    <div class="fs-header">
      <button class="fs-back" onclick="closeFullscreen()">← 返回</button>
      <div class="fs-title">🏅 徽章墙</div>
      <div style="width:60px"></div>
    </div>
    <div class="fs-body" style="padding:14px">
      <div class="badge-count">已获得 ${S.badges.length} / ${D.BADGES.length} 枚徽章</div>
      <div class="badge-grid">${badgeHTML}</div>
      ${availableTitles.length ? `
      <div class="detail-section" style="margin-top:16px">
        <h3>👑 称号（点击佩戴）</h3>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${titleHTML}</div>
      </div>` : ''}
    </div>
  `);
}

function checkTitleCond(id) {
  const pets = S.pets;
  const maxIntimacy = pets.reduce((m,p)=>Math.max(m,p.intimacy), 0);
  const unlockedMapCount = (S.unlockedMaps||[]).length;
  switch(id) {
    case 'new_friend': return pets.length >= 1;
    case 'pet_lover': return pets.length >= 3;
    case 'best_friend': return maxIntimacy >= 500;
    case 'soul_mate': return maxIntimacy >= 1000;
    case 'scholar': return (S.stats && S.stats.totalQuizRight||0) >= 100;
    case 'rich': return S.coin >= 5000;
    case 'sign_keeper': return (S.signDays||0) >= 7;
    case 'explorer_title': return unlockedMapCount >= 3;
    default: return false;
  }
}

function wearTitle(id) {
  if (!checkTitleCond(id)) { toast('称号未解锁~'); return; }
  S.title = (S.title === id) ? null : id;
  Storage.save();
  const t = D.TITLES.find(x=>x.id===id);
  toast(S.title ? `已佩戴称号：${t.name}` : '已取消称号');
  openBadges();
}

function getCurrentTitleName() {
  if (!S.title) return '';
  const t = D.TITLES.find(x=>x.id===S.title);
  return t ? t.name : '';
}

// ==================================================================
// 🎮 游戏中心（全新独立页面）
// ==================================================================

// 游戏疲劳检测：同一款"挑战性"游戏连续玩>3局，引导切换
function checkGameFatigue(type) {
  // type: 'race' | 'memory' | 'paint' | 'rhythm'
  const heavy = type === 'race' || type === 'memory';
  if (heavy) {
    if (S.gameStats.recentGameType === type) {
      S.gameStats.recentGameCount++;
      if (S.gameStats.recentGameCount >= 3) {
        const pet = getActivePet();
        setTimeout(() => {
          toast(`🥱 ${pet.name}打哈欠：主人，玩点安静的吧？试试云端小画家~`);
        }, 1200);
        S.gameStats.recentGameCount = 0;
      }
    } else {
      S.gameStats.recentGameType = type;
      S.gameStats.recentGameCount = 1;
    }
  } else {
    // 休闲游戏不统计疲劳，重置
    S.gameStats.recentGameType = type;
    S.gameStats.recentGameCount = 0;
  }
  Storage.save();
}

// 渲染游戏中心页面
function renderGameCenter() {
  const coinEl = $('#gameCoin');
  if (coinEl) coinEl.textContent = '🪙 ' + S.coin;
  const pet = getActivePet();
  const today = Storage.todayStr();
  if (S.gameStats.dailyRhythmDate !== today) {
    S.gameStats.dailyRhythmRewardCount = 0;
    S.gameStats.dailyRhythmDate = today;
  }
  const rhythmLeft = Math.max(0, 3 - S.gameStats.dailyRhythmRewardCount);

  const html = `
    <div class="game-welcome">
      <div class="game-welcome-emoji">🎮</div>
      <div class="game-welcome-text">
        <div class="game-welcome-title">欢迎来到游戏中心！</div>
        <div class="game-welcome-sub">完成任务赚金币，来这里放松一下吧~</div>
      </div>
    </div>

    <div class="game-list">
      <!-- 🏎️ 飞驰小爪 -->
      <div class="game-card race">
        <div class="game-card-icon">🏎️</div>
        <div class="game-card-info">
          <div class="game-card-name">飞驰小爪</div>
          <div class="game-card-desc">${pet.name}参加赛车，左右躲开障碍冲终点！</div>
          <div class="game-card-meta">
            <span class="game-tag pay">💰 报名费 50</span>
            <span class="game-tag mood">😊 心情好 速度快</span>
            <span class="game-tag hunger">🍖 饱腹<30 不能参赛</span>
          </div>
          <div class="game-card-stats">
            <span>最高分：${S.gameStats.raceBestScore}</span>
            <span>累计分：${S.gameStats.raceTotalScore}</span>
          </div>
        </div>
        <button class="game-card-btn" onclick="startRaceGame()">开始</button>
      </div>

      <!-- 🪁 云端小画家 -->
      <div class="game-card paint">
        <div class="game-card-icon">🪁</div>
        <div class="game-card-info">
          <div class="game-card-name">云端小画家</div>
          <div class="game-card-desc">在云朵上接彩色颜料，拼出彩虹！</div>
          <div class="game-card-meta">
            <span class="game-tag free">✨ 免费畅玩</span>
            <span class="game-tag reward">🌈 画彩虹 +心情</span>
          </div>
          <div class="game-card-stats">
            <span>累计彩虹：${S.gameStats.paintRainbows}</span>
          </div>
        </div>
        <button class="game-card-btn free" onclick="startPaintGame()">开始</button>
      </div>

      <!-- 🍽️ 记忆大厨 -->
      <div class="game-card memory">
        <div class="game-card-icon">🍽️</div>
        <div class="game-card-info">
          <div class="game-card-name">记忆大厨</div>
          <div class="game-card-desc">翻牌找出相同的宠物食物，赢取精致美食！</div>
          <div class="game-card-meta">
            <span class="game-tag pay">💰 报名费 20</span>
            <span class="game-tag reward">🍰 通关得食物</span>
          </div>
          <div class="game-card-stats">
            <span>通关：${S.gameStats.memoryClears}次</span>
          </div>
        </div>
        <button class="game-card-btn" onclick="startMemoryGame()">开始</button>
      </div>

      <!-- 🎵 节奏摇摆（简化版） -->
      <div class="game-card rhythm">
        <div class="game-card-icon">🎵</div>
        <div class="game-card-info">
          <div class="game-card-name">节奏摇摆</div>
          <div class="game-card-desc">跟随节奏点击音符，Perfect越多奖励越多！</div>
          <div class="game-card-meta">
            <span class="game-tag free">✨ 免费畅玩</span>
            <span class="game-tag reward">🪙 前3次得金币</span>
            <span class="game-tag daily">每日剩余：${rhythmLeft}</span>
          </div>
        </div>
        <button class="game-card-btn free" onclick="startRhythmGame()">开始</button>
      </div>
    </div>

    <!-- 旧小游戏入口 -->
    <div class="old-games-section">
      <div class="old-games-title">其他小游戏</div>
      <div class="old-games-list">
        <div class="old-game-card" onclick="closeFullscreen();openMiniGameMenuFromGame()">
          <div class="old-game-emoji">🥏🧩</div>
          <div class="old-game-name">接飞盘 / 宠物拼图</div>
        </div>
      </div>
    </div>
  `;
  $('#gameCenter').innerHTML = html;
}

// 兼容：从游戏中心跳转到旧的小游戏菜单
function openMiniGameMenuFromGame() {
  setTimeout(() => openMiniGameMenu(), 100);
}

// ============================================================
// 🏎️ Game 1: 飞驰小爪（赛车闯关）
// ============================================================
let raceState = null;

function startRaceGame() {
  const pet = getActivePet();
  if (pet.hunger < 30) { toast(pet.name + '饿肚子了，先喂饱它吧~'); return; }
  if (S.coin < 50) { toast('金币不足，报名费需要50金币~'); return; }
  if (!confirm('报名费：50金币，是否开始比赛？')) return;
  spendCoin(50);
  S.gameStats.racePlays++;
  checkGameFatigue('race');
  Storage.save();

  const petDef = D.PET_DEFS[pet.defId];
  // 速度加成：心情好+10%
  const moodBoost = pet.mood >= 70 ? 1.1 : 1.0;

  openFullscreen(`
    <div class="fs-header">
      <button class="fs-back" onclick="quitRace()">← 退出</button>
      <div class="fs-title">🏎️ 飞驰小爪</div>
      <div style="width:60px"></div>
    </div>
    <div class="race-container">
      <div class="race-hud">
        <span>🏁 <span id="raceScore">0</span>分</span>
        <span>❤️ <span id="raceHp">3</span></span>
        <span>⏱️ <span id="raceDist">0</span>m</span>
      </div>
      <div class="race-track" id="raceTrack">
        <div class="race-pet" id="racePet">${petDef.emoji}🏎️</div>
      </div>
      <div class="race-ctrl">
        <button class="race-btn left" id="raceBtnL">◀️</button>
        <div class="race-tip">左右滑动或点击按钮移动</div>
        <button class="race-btn right" id="raceBtnR">▶️</button>
      </div>
    </div>
  `);

  raceState = {
    score: 0,
    hp: 3,
    distance: 0,
    speed: 2 * moodBoost,
    petLane: 1, // 0,1,2 三车道
    obstacles: [],
    coins: [],
    over: false,
    tickTimer: null,
    spawnTimer: null,
  };

  // 初始位置
  const petEl = $('#racePet');
  petEl.style.left = (33 * raceState.petLane + 16) + '%';

  // 绑定按钮
  const moveLane = (delta) => {
    if (!raceState || raceState.over) return;
    raceState.petLane = Math.max(0, Math.min(2, raceState.petLane + delta));
    const pet = $('#racePet');
    if (pet) pet.style.left = (33 * raceState.petLane + 16) + '%';
    Sound.play('click');
  };
  $('#raceBtnL').addEventListener('click', () => moveLane(-1));
  $('#raceBtnR').addEventListener('click', () => moveLane(1));

  // 触摸滑动
  const track = $('#raceTrack');
  let touchStartX = 0;
  track.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', (e) => {
    const dx = (e.changedTouches[0].clientX - touchStartX);
    if (Math.abs(dx) > 30) moveLane(dx > 0 ? 1 : -1);
  }, { passive: true });
  // 键盘支持
  const keyHandler = (e) => {
    if (e.key === 'ArrowLeft') moveLane(-1);
    if (e.key === 'ArrowRight') moveLane(1);
  };
  document.addEventListener('keydown', keyHandler);
  raceState._keyHandler = keyHandler;

  // 主循环
  raceState.tickTimer = setInterval(raceTick, 30);
  raceState.spawnTimer = setInterval(raceSpawn, 800);
}

function raceTick() {
  if (!raceState || raceState.over) return;
  const st = raceState;
  const track = $('#raceTrack');
  if (!track) return;

  // 速度逐渐加快
  st.speed = Math.min(7, 2 + st.distance * 0.003);

  // 距离
  st.distance += st.speed;
  const distEl = $('#raceDist'); if (distEl) distEl.textContent = Math.floor(st.distance);

  // 金币分数
  st.score = Math.floor(st.distance);
  const scoreEl = $('#raceScore'); if (scoreEl) scoreEl.textContent = st.score;

  // 更新障碍物位置
  st.obstacles.forEach((o, i) => {
    o.y += st.speed;
    const el = document.getElementById('raceOb' + o.id);
    if (el) {
      el.style.top = o.y + '%';
      // 碰撞检测（和宠物同一车道且重叠）
      if (Math.abs(o.y - 80) < 8 && o.lane === st.petLane && !o.hit) {
        o.hit = true;
        st.hp--;
        Sound.play('fail');
        const hpEl = $('#raceHp'); if (hpEl) hpEl.textContent = st.hp;
        el.style.opacity = '0.3';
        if (st.hp <= 0) {
          setTimeout(endRaceGame, 200);
        }
      }
      // 移出屏幕删除
      if (o.y > 110) {
        if (el.parentNode) el.parentNode.removeChild(el);
        st.obstacles.splice(i, 1);
      }
    }
  });

  // 更新金币位置
  st.coins.forEach((c, i) => {
    c.y += st.speed;
    const el = document.getElementById('raceCoin' + c.id);
    if (el) {
      el.style.top = c.y + '%';
      if (Math.abs(c.y - 80) < 8 && c.lane === st.petLane && !c.collected) {
        c.collected = true;
        st.score += 50;
        Sound.play('success');
        el.style.transform = 'scale(1.5)';
        el.style.opacity = '0';
      }
      if (c.y > 110) {
        if (el.parentNode) el.parentNode.removeChild(el);
        st.coins.splice(i, 1);
      }
    }
  });
}

let _raceIdCounter = 0;
function raceSpawn() {
  if (!raceState || raceState.over) return;
  const st = raceState;
  const track = $('#raceTrack');
  if (!track) return;
  const lane = Math.floor(Math.random() * 3);
  const isCoin = Math.random() < 0.35;

  if (isCoin) {
    const id = ++_raceIdCounter;
    st.coins.push({ id, lane, y: -10, collected: false });
    const el = document.createElement('div');
    el.id = 'raceCoin' + id;
    el.className = 'race-coin';
    el.style.left = (33 * lane + 16) + '%';
    el.style.top = '-10%';
    el.textContent = '🪙';
    track.appendChild(el);
  } else {
    const id = ++_raceIdCounter;
    const obstacles = ['🧱','🚧','🪨','🌵'];
    const emoji = obstacles[Math.floor(Math.random()*obstacles.length)];
    st.obstacles.push({ id, lane, y: -10, hit: false });
    const el = document.createElement('div');
    el.id = 'raceOb' + id;
    el.className = 'race-ob';
    el.style.left = (33 * lane + 16) + '%';
    el.style.top = '-10%';
    el.textContent = emoji;
    track.appendChild(el);
  }
}

function quitRace() {
  if (raceState && !raceState.over) {
    raceState.over = true;
    if (confirm('退出比赛？当前分数将作为成绩结算')) {
      endRaceGame(true);
    } else {
      raceState.over = false;
    }
  }
}

function endRaceGame(early) {
  if (!raceState || raceState._ended) return;
  raceState._ended = true;
  raceState.over = true;
  if (raceState.tickTimer) clearInterval(raceState.tickTimer);
  if (raceState.spawnTimer) clearInterval(raceState.spawnTimer);
  if (raceState._keyHandler) document.removeEventListener('keydown', raceState._keyHandler);

  const finalScore = raceState.score;
  // 奖励：每100分=5金币，封顶150金币
  const reward = Math.min(150, Math.floor(finalScore / 20));
  // 更新记录
  S.gameStats.raceTotalScore += finalScore;
  S.gameStats.raceBestScore = Math.max(S.gameStats.raceBestScore, finalScore);
  Storage.save();
  if (reward > 0) addCoin(reward);
  Sound.play(finalScore > 1000 ? 'levelup' : 'success');
  checkBadges();

  openFullscreen(`
    <div class="fs-header"><div class="fs-title">🏁 比赛结束</div><div style="width:60px"></div></div>
    <div class="quiz-result">
      <div class="result-emoji">${finalScore > 1500 ? '🏆' : finalScore > 800 ? '🥇' : finalScore > 300 ? '🥈' : '🏎️'}</div>
      <div class="result-text">得分 ${finalScore}</div>
      <div style="margin:12px 0;font-size:14px;color:#5a6a7c">
        ${reward > 0 ? `<div class="result-coin">🪙 +${reward} 金币</div>` : '<div>继续努力，冲更高分！</div>'}
        <div style="margin-top:8px">📊 最高记录：${S.gameStats.raceBestScore} 分</div>
      </div>
    </div>
    <div style="padding:12px;display:flex;gap:8px">
      <button class="btn-cancel" style="flex:1" onclick="switchPage('game')">返回中心</button>
      <button class="btn-primary" style="flex:1" onclick="closeFullscreen();startRaceGame()">再来一局</button>
    </div>
  `);
  raceState = null;
}

// ============================================================
// 🪁 Game 2: 云端小画家（接颜色画彩虹）
// ============================================================
let paintState = null;

function startPaintGame() {
  S.gameStats.paintPlays++;
  checkGameFatigue('paint');
  Storage.save();

  openFullscreen(`
    <div class="fs-header">
      <button class="fs-back" onclick="quitPaint()">← 退出</button>
      <div class="fs-title">🪁 云端小画家</div>
      <div style="width:60px"></div>
    </div>
    <div class="paint-container">
      <div class="paint-hud">
        <span>🌈 已画 <span id="paintRainbow">0</span> 道</span>
        <span>🎨 接住 <span id="paintCombo">0</span> 个同色</span>
      </div>
      <div class="paint-track" id="paintTrack">
        <div class="paint-pet" id="paintPet">☁️🐾☁️</div>
      </div>
      <div class="paint-colors" id="paintColors">
        ${['🔴','🟡','🟢','🔵','🟣'].map(c=>`<span class="paint-dot" data-c="${c}" style="opacity:0.3">${c}</span>`).join('')}
      </div>
      <div class="race-ctrl">
        <button class="race-btn left" id="paintBtnL">◀️</button>
        <div class="race-tip">左右移动，接住3个相同颜色画彩虹！</div>
        <button class="race-btn right" id="paintBtnR">▶️</button>
      </div>
    </div>
  `);

  paintState = {
    rainbows: 0,
    lane: 2, // 0-4 五车道
    drops: [],
    combo: {}, // { '🔴': 0, '🟡': 0 ...}
    tickTimer: null,
    spawnTimer: null,
    over: false,
    lastColor: null,
    touchStartX: 0,
  };

  const petEl = $('#paintPet');
  petEl.style.left = (20 * paintState.lane + 10) + '%';

  const moveLane = (delta) => {
    if (!paintState || paintState.over) return;
    paintState.lane = Math.max(0, Math.min(4, paintState.lane + delta));
    const pet = $('#paintPet');
    if (pet) pet.style.left = (20 * paintState.lane + 10) + '%';
  };
  $('#paintBtnL').addEventListener('click', () => moveLane(-1));
  $('#paintBtnR').addEventListener('click', () => moveLane(1));
  const track = $('#paintTrack');
  track.addEventListener('touchstart', (e) => { paintState.touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', (e) => {
    const dx = (e.changedTouches[0].clientX - paintState.touchStartX);
    if (Math.abs(dx) > 25) moveLane(dx > 0 ? 1 : -1);
  }, { passive: true });

  paintState.tickTimer = setInterval(paintTick, 40);
  paintState.spawnTimer = setInterval(paintSpawn, 700);
}

let _paintIdCounter = 0;
function paintSpawn() {
  if (!paintState || paintState.over) return;
  const st = paintState;
  const track = $('#paintTrack');
  if (!track) return;
  const colors = ['🔴','🟡','🟢','🔵','🟣'];
  const color = colors[Math.floor(Math.random()*5)];
  const lane = Math.floor(Math.random() * 5);
  const id = ++_paintIdCounter;
  st.drops.push({ id, lane, y: -10, color, collected: false });
  const el = document.createElement('div');
  el.id = 'paintDrop' + id;
  el.className = 'paint-drop';
  el.style.left = (20 * lane + 10) + '%';
  el.style.top = '-10%';
  el.textContent = color;
  track.appendChild(el);
}

function paintTick() {
  if (!paintState || paintState.over) return;
  const st = paintState;
  const track = $('#paintTrack');
  if (!track) return;

  st.drops.forEach((d, i) => {
    d.y += 1.6;
    const el = document.getElementById('paintDrop' + d.id);
    if (el) {
      el.style.top = d.y + '%';
      if (Math.abs(d.y - 80) < 8 && d.lane === st.lane && !d.collected) {
        d.collected = true;
        Sound.play('pet');
        // 累计这个颜色
        st.combo[d.color] = (st.combo[d.color] || 0) + 1;
        st.lastColor = d.color;
        // 高亮
        const dotEl = document.querySelector('.paint-dot[data-c="'+d.color+'"]');
        if (dotEl) dotEl.style.opacity = String(Math.min(1, st.combo[d.color] / 3 + 0.3));

        $('#paintCombo').textContent = st.combo[d.color] || 0;
        // 达到3个，画一道彩虹
        if (st.combo[d.color] >= 3) {
          st.rainbows++;
          st.combo[d.color] = 0;
          $('#paintRainbow').textContent = st.rainbows;
          // 心情+2~5
          const moodGain = 2 + Math.floor(Math.random() * 4);
          const pet = getActivePet();
          pet.mood = Math.min(100, pet.mood + moodGain);
          Storage.save();
          Sound.play('levelup');
          toast(`🌈 画出一道彩虹！${pet.name}心情+${moodGain}`);
          S.gameStats.paintRainbows++;
          Storage.save();
          // 闪彩虹
          track.classList.add('rainbow-flash');
          setTimeout(() => track.classList.remove('rainbow-flash'), 1000);
          // 重置所有颜色高亮
          document.querySelectorAll('.paint-dot').forEach(d => d.style.opacity = '0.3');
          $('#paintCombo').textContent = 0;
        }
        el.style.transform = 'scale(1.8)';
        el.style.opacity = '0';
      }
      if (d.y > 110) {
        if (el.parentNode) el.parentNode.removeChild(el);
        st.drops.splice(i, 1);
      }
    }
  });
}

function quitPaint() {
  if (paintState && !paintState.over) {
    if (confirm('退出小画家？')) endPaintGame();
  }
}

function endPaintGame() {
  if (!paintState || paintState._ended) return;
  paintState._ended = true;
  paintState.over = true;
  if (paintState.tickTimer) clearInterval(paintState.tickTimer);
  if (paintState.spawnTimer) clearInterval(paintState.spawnTimer);
  const rainbows = paintState.rainbows;
  checkBadges();
  openFullscreen(`
    <div class="fs-header"><div class="fs-title">🪁 本轮结束</div><div style="width:60px"></div></div>
    <div class="quiz-result">
      <div class="result-emoji">${rainbows >= 5 ? '🌈🌈🌈' : rainbows >= 2 ? '🌈🌈' : '🌈'}</div>
      <div class="result-text">画了 ${rainbows} 道彩虹</div>
      <div style="margin:12px 0;font-size:14px;color:#5a6a7c">
        <div>😊 ${getActivePet().name}心情愉快~</div>
        <div style="margin-top:8px">📊 累计彩虹：${S.gameStats.paintRainbows} 道</div>
      </div>
    </div>
    <div style="padding:12px;display:flex;gap:8px">
      <button class="btn-cancel" style="flex:1" onclick="switchPage('game')">返回中心</button>
      <button class="btn-primary" style="flex:1" onclick="closeFullscreen();startPaintGame()">再画一局</button>
    </div>
  `);
  paintState = null;
}

// ============================================================
// 🍽️ Game 3: 记忆大厨（翻牌配对）
// ============================================================
let memoryState = null;

function startMemoryGame() {
  if (S.coin < 20) { toast('金币不足，报名费需要20金币~'); return; }
  if (!confirm('报名费：20金币，开始烹饪记忆挑战？')) return;
  spendCoin(20);
  S.gameStats.memoryPlays++;
  checkGameFatigue('memory');
  Storage.save();

  // 4x4 = 8对
  const foods = D.FOOD_DEFS.slice(0, 8);
  let cards = [];
  foods.forEach(f => {
    cards.push({ id: f.id + '_a', emoji: f.emoji, pair: f.id, flipped: false, matched: false });
    cards.push({ id: f.id + '_b', emoji: f.emoji, pair: f.id, flipped: false, matched: false });
  });
  // 洗牌
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  memoryState = {
    cards,
    selected: null, // {idx, card}
    matchedPairs: 0,
    moves: 0,
    lock: false,
    timer: 0,
    tickTimer: null,
    _ended: false,
  };

  openFullscreen(`
    <div class="fs-header">
      <button class="fs-back" onclick="quitMemory()">← 退出</button>
      <div class="fs-title">🍽️ 记忆大厨</div>
      <div style="width:60px"></div>
    </div>
    <div class="memory-container">
      <div class="memory-hud">
        <span>✅ 配对 <span id="memoryPairs">0</span>/8</span>
        <span>🔄 步数 <span id="memoryMoves">0</span></span>
        <span>⏱️ <span id="memoryTime">0</span>s</span>
      </div>
      <div class="memory-grid" id="memoryGrid"></div>
      <div style="text-align:center;padding:8px;font-size:12px;color:#8aa5b8">翻出相同的食物配对，全部通关得美食奖励！</div>
    </div>
  `);

  memoryState.tickTimer = setInterval(() => {
    if (!memoryState) return;
    memoryState.timer++;
    const t = $('#memoryTime'); if (t) t.textContent = memoryState.timer;
  }, 1000);

  renderMemoryGrid();
}

function renderMemoryGrid() {
  const grid = $('#memoryGrid');
  if (!grid) return;
  grid.innerHTML = memoryState.cards.map((c, i) => `
    <div class="memory-card ${c.flipped||c.matched?'flipped':''} ${c.matched?'matched':''}"
         onclick="flipMemoryCard(${i})">
      <div class="memory-face memory-back">🍽️</div>
      <div class="memory-face memory-front">${c.emoji}</div>
    </div>
  `).join('');
}

function flipMemoryCard(idx) {
  if (!memoryState || memoryState.lock || memoryState._ended) return;
  const st = memoryState;
  const c = st.cards[idx];
  if (c.flipped || c.matched) return;
  c.flipped = true;
  Sound.play('click');
  renderMemoryGrid();

  if (!st.selected) {
    st.selected = { idx, card: c };
  } else {
    st.moves++;
    $('#memoryMoves').textContent = st.moves;
    st.lock = true;
    const prev = st.selected;
    if (prev.card.pair === c.pair) {
      // 配对成功
      setTimeout(() => {
        prev.card.matched = true;
        c.matched = true;
        st.selected = null;
        st.matchedPairs++;
        $('#memoryPairs').textContent = st.matchedPairs;
        Sound.play('success');
        st.lock = false;
        renderMemoryGrid();
        if (st.matchedPairs >= 8) {
          setTimeout(endMemoryGame, 600);
        }
      }, 400);
    } else {
      // 配对失败
      setTimeout(() => {
        prev.card.flipped = false;
        c.flipped = false;
        st.selected = null;
        st.lock = false;
        Sound.play('fail');
        renderMemoryGrid();
      }, 800);
    }
  }
}

function quitMemory() {
  if (!memoryState || memoryState._ended) return;
  if (confirm('退出记忆大厨？')) endMemoryGame(true);
}

function endMemoryGame(quit) {
  if (!memoryState || memoryState._ended) return;
  memoryState._ended = true;
  if (memoryState.tickTimer) clearInterval(memoryState.tickTimer);

  const cleared = memoryState.matchedPairs >= 8;
  let reward = null;
  if (cleared) {
    // 奖励精致食物（随机小零食/蛋糕/牛奶/小鱼干/冰淇淋）
    const options = ['f_snack','cake','milk','fish','icecream'];
    const pickId = options[Math.floor(Math.random()*options.length)];
    S.inventory[pickId] = (S.inventory[pickId]||0) + 1;
    reward = D.FOOD_DEFS.find(f=>f.id===pickId);
    S.gameStats.memoryClears++;
    Storage.save();
    Sound.play('levelup');
  } else {
    Sound.play('fail');
  }
  Storage.save();
  checkBadges();

  const emoji = cleared ? '🏆' : (quit ? '🚪' : '💪');
  const title = cleared ? '🎉 通关成功' : (quit ? '已退出' : '继续加油');
  openFullscreen(`
    <div class="fs-header"><div class="fs-title">${title}</div><div style="width:60px"></div></div>
    <div class="quiz-result">
      <div class="result-emoji">${emoji}</div>
      <div class="result-text">配对 ${memoryState.matchedPairs}/8</div>
      <div style="margin:12px 0;font-size:14px;color:#5a6a7c">
        <div>🔄 步数：${memoryState.moves}</div>
        <div>⏱️ 用时：${memoryState.timer}秒</div>
        ${reward ? `<div style="margin-top:10px;padding:10px;background:#FFF8E1;border-radius:10px">🎁 通关奖励：<b>${reward.emoji}${reward.name}</b> ×1（已存入背包）</div>` : ''}
      </div>
    </div>
    <div style="padding:12px;display:flex;gap:8px">
      <button class="btn-cancel" style="flex:1" onclick="switchPage('game')">返回中心</button>
      ${!cleared ? '<button class="btn-primary" style="flex:1" onclick="closeFullscreen();startMemoryGame()">再来一局</button>' :
        '<button class="btn-primary" style="flex:1" onclick="switchPage(\'shop\')">去商店逛逛</button>'}
    </div>
  `);
  memoryState = null;
}

// ============================================================
// 🎵 Game 4: 节奏摇摆（简化版节奏游戏）
// ============================================================
let rhythmState = null;

function startRhythmGame() {
  S.gameStats.rhythmPlays = (S.gameStats.rhythmPlays || 0) + 1;
  checkGameFatigue('rhythm');
  Storage.save();

  openFullscreen(`
    <div class="fs-header">
      <button class="fs-back" onclick="quitRhythm()">← 退出</button>
      <div class="fs-title">🎵 节奏摇摆</div>
      <div style="width:60px"></div>
    </div>
    <div class="rhythm-container">
      <div class="rhythm-hud">
        <span>🎶 准确率 <span id="rhythmAcc">0%</span></span>
        <span>💯 得分 <span id="rhythmScore">0</span></span>
        <span>🔥 连击 <span id="rhythmCombo">0</span></span>
      </div>
      <div class="rhythm-track" id="rhythmTrack">
        <div class="rhythm-line"></div>
        <div class="rhythm-keys">
          <div class="rhythm-key" id="rk1" onclick="rhythmTap(0)"></div>
          <div class="rhythm-key" id="rk2" onclick="rhythmTap(1)"></div>
          <div class="rhythm-key" id="rk3" onclick="rhythmTap(2)"></div>
          <div class="rhythm-key" id="rk4" onclick="rhythmTap(3)"></div>
        </div>
      </div>
      <div class="rhythm-tip">✨ 音符落到判定线时点击对应按键</div>
    </div>
  `);

  const today = Storage.todayStr();
  if (S.gameStats.dailyRhythmDate !== today) {
    S.gameStats.dailyRhythmRewardCount = 0;
    S.gameStats.dailyRhythmDate = today;
  }
  const rewardLeft = S.gameStats.dailyRhythmRewardCount < 3;

  rhythmState = {
    total: 0,
    perfect: 0,
    good: 0,
    miss: 0,
    combo: 0,
    maxCombo: 0,
    score: 0,
    notes: [],
    tickTimer: null,
    spawnTimer: null,
    duration: 45,
    elapsed: 0,
    rewardLeft,
    _ended: false,
    perfect10Triggered: false,
  };

  rhythmState.tickTimer = setInterval(rhythmTick, 30);
  rhythmState.spawnTimer = setInterval(rhythmSpawn, 550);
}

let _rhythmIdCounter = 0;
function rhythmSpawn() {
  if (!rhythmState || rhythmState._ended) return;
  const st = rhythmState;
  if (st.elapsed > st.duration) return;
  const keyIdx = Math.floor(Math.random() * 4);
  const id = ++_rhythmIdCounter;
  st.notes.push({ id, lane: keyIdx, y: -10, hit: false, judged: false });
  const track = $('#rhythmTrack');
  if (!track) return;
  const el = document.createElement('div');
  el.id = 'rhNote' + id;
  el.className = 'rhythm-note';
  el.style.left = (25 * keyIdx + 12.5) + '%';
  el.style.top = '-10%';
  track.appendChild(el);
}

function rhythmTick() {
  if (!rhythmState || rhythmState._ended) return;
  const st = rhythmState;
  st.elapsed += 0.03;
  if (st.elapsed > st.duration) {
    setTimeout(endRhythmGame, 500);
    return;
  }
  st.notes.forEach((n, i) => {
    n.y += 1.1;
    const el = document.getElementById('rhNote' + n.id);
    if (el) {
      el.style.top = n.y + '%';
      // Miss判定：过了判定区
      if (n.y > 92 && !n.judged) {
        n.judged = true;
        n.hit = 'miss';
        st.miss++;
        st.combo = 0;
        Sound.play('fail');
        renderRhythmHud();
      }
      if (n.y > 110) {
        if (el.parentNode) el.parentNode.removeChild(el);
        st.notes.splice(i, 1);
      }
    }
  });
}

function rhythmTap(lane) {
  if (!rhythmState || rhythmState._ended) return;
  const st = rhythmState;
  // 找最近的音符
  let best = null, bestDist = Infinity;
  st.notes.forEach(n => {
    if (n.lane !== lane || n.judged) return;
    const dist = Math.abs(n.y - 80);
    if (dist < bestDist) { bestDist = dist; best = n; }
  });
  const key = document.getElementById('rk' + (lane+1));
  if (key) {
    key.classList.add('press');
    setTimeout(() => key.classList.remove('press'), 150);
  }

  if (best && bestDist < 14) {
    best.judged = true;
    st.total++;
    const label = $('#rhNote' + best.id);
    if (bestDist < 5) {
      // Perfect
      st.perfect++;
      st.score += 100;
      st.combo++;
      best.hit = 'perfect';
      if (label) label.textContent = 'Perfect!';
      Sound.play('success');
      // 10连Perfect成就
      if (st.combo >= 10 && !st.perfect10Triggered) {
        st.perfect10Triggered = true;
        S.gameStats.rhythmPerfect10++;
        Storage.save();
      }
    } else if (bestDist < 10) {
      // Good
      st.good++;
      st.score += 60;
      st.combo++;
      best.hit = 'good';
      if (label) label.textContent = 'Good';
      Sound.play('pet');
    } else {
      st.miss++;
      st.combo = 0;
      best.hit = 'miss';
      if (label) label.textContent = 'Miss';
      Sound.play('fail');
    }
    if (label) {
      label.style.fontSize = '16px';
      label.style.fontWeight = 'bold';
      label.style.transform = 'scale(1.3)';
      label.style.opacity = '0';
    }
    st.maxCombo = Math.max(st.maxCombo, st.combo);
    renderRhythmHud();
  }
}

function renderRhythmHud() {
  if (!rhythmState) return;
  const st = rhythmState;
  const total = st.perfect + st.good + st.miss;
  const acc = total === 0 ? 0 : Math.round((st.perfect + st.good * 0.6) / total * 100);
  $('#rhythmAcc').textContent = acc + '%';
  $('#rhythmScore').textContent = st.score;
  $('#rhythmCombo').textContent = st.combo;
}

function quitRhythm() {
  if (!rhythmState || rhythmState._ended) return;
  if (confirm('退出节奏摇摆？')) endRhythmGame(true);
}

function endRhythmGame(quit) {
  if (!rhythmState || rhythmState._ended) return;
  rhythmState._ended = true;
  const st = rhythmState;
  if (st.tickTimer) clearInterval(st.tickTimer);
  if (st.spawnTimer) clearInterval(st.spawnTimer);

  const total = st.perfect + st.good + st.miss;
  const acc = total === 0 ? 0 : Math.round((st.perfect + st.good * 0.6) / total * 100);
  // 奖励金币（前3次）
  let reward = 0;
  if (st.rewardLeft) {
    if (acc >= 90) reward = 50;
    else if (acc >= 70) reward = 30;
    else if (acc >= 50) reward = 20;
  }
  if (reward > 0) {
    S.gameStats.dailyRhythmRewardCount++;
    addCoin(reward);
    addIntimacy(2);
  }
  checkBadges();

  openFullscreen(`
    <div class="fs-header"><div class="fs-title">🎵 本轮结束</div><div style="width:60px"></div></div>
    <div class="quiz-result">
      <div class="result-emoji">${acc >= 90 ? '🏆' : acc >= 70 ? '🎉' : '🎶'}</div>
      <div class="result-text">得分 ${st.score}（准确率${acc}%）</div>
      <div style="margin:12px 0;font-size:14px;color:#5a6a7c">
        <div>Perfect: ${st.perfect} &nbsp; Good: ${st.good} &nbsp; Miss: ${st.miss}</div>
        <div>🔥 最大连击：${st.maxCombo}</div>
        ${reward > 0 ? `<div class="result-coin">🪙 +${reward} 金币 · 💖 亲密+2</div>` :
          (st.rewardLeft ? '<div style="color:#8aa5b8">继续努力，答对更多拿金币！</div>' :
           '<div style="color:#8aa5b8">今日奖励次数已用完，明天再来~</div>')}
      </div>
    </div>
    <div style="padding:12px;display:flex;gap:8px">
      <button class="btn-cancel" style="flex:1" onclick="switchPage('game')">返回中心</button>
      <button class="btn-primary" style="flex:1" onclick="closeFullscreen();startRhythmGame()">再来一局</button>
    </div>
  `);
  rhythmState = null;
}
