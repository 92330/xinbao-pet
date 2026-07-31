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
  renderPetDisplay();
  renderPetStatus();
  renderInteractions();
  renderPetSwitcher();
  renderFurnitureLayer();
  checkAchievements();
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
        ${pet.house==='livingroom' && S.pets.length>1 ? `<button class="btn-success" style="width:100%;margin-top:8px;padding:12px;border-radius:12px" onclick="buyStable()">🏠 购买独立小窝 (500金)</button>`:''}
      </div>
    </div>
  `);
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
  getActivePet().name = name;
  Storage.save();
  closeModal();
  openPetDetail();
  toast('改名成功！');
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
  let html = '<div style="display:flex;flex-direction:column;gap:10px;margin:10px 0">';
  for (let lv=3; lv<=9; lv+=2) {
    const sk = D.SKILL_DEFS[lv];
    const unlocked = pet.level >= lv;
    html += `<button class="skill-choose-btn ${unlocked?'':'disabled'}" ${unlocked?`onclick="useSkill(${lv})"`:''}>
      <div style="font-size:28px">${sk.emoji}</div>
      <div style="font-weight:bold">${sk.name}</div>
      <div style="font-size:12px;color:#8aa5b8">心情+${sk.mood} ${unlocked?'':`(需${lv}级)`}</div>
    </button>`;
  }
  html += '</div>';
  showModal('🎯 选择技能', html, `<button class="btn-cancel" onclick="closeModal()">关闭</button>`);
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
function startQuiz() {
  // 选择教材
  const opt = D.QUESTION_OPTIONS;
  showModal('📝 答题赚金币', `
    <div style="margin-bottom:12px">
      <div style="font-size:13px;color:#6a7a8c;margin-bottom:6px">教材版本</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap" id="qVersion">
        ${opt.versions.map((v,i)=>`<button class="quiz-opt-btn" data-v="${v}" style="padding:8px 14px;border-radius:10px;background:${i===0?'#5B9BD5':'#EAF6FF'};color:${i===0?'#fff':'#5a6a7c'};font-size:13px">${v}</button>`).join('')}
      </div>
    </div>
    <div style="margin-bottom:12px">
      <div style="font-size:13px;color:#6a7a8c;margin-bottom:6px">年级</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap" id="qGrade">
        ${opt.grades.map((g,i)=>`<button class="quiz-opt-btn" data-g="${g}" style="padding:8px 14px;border-radius:10px;background:${i===0?'#5B9BD5':'#EAF6FF'};color:${i===0?'#fff':'#5a6a7c'};font-size:13px">${g}年级</button>`).join('')}
      </div>
    </div>
    <div style="margin-bottom:12px">
      <div style="font-size:13px;color:#6a7a8c;margin-bottom:6px">科目</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap" id="qSubject">
        ${opt.subjects.map((s,i)=>`<button class="quiz-opt-btn" data-s="${s}" style="padding:8px 14px;border-radius:10px;background:${i===0?'#5B9BD5':'#EAF6FF'};color:${i===0?'#fff':'#5a6a7c'};font-size:13px">${s}</button>`).join('')}
      </div>
    </div>
    <div style="font-size:12px;color:#8aa5b8;text-align:center">每日最多200金币 · 答对+10 · 满分+20</div>
  `, `<button class="btn-cancel" onclick="closeModal()">取消</button>
      <button class="btn-primary" onclick="beginQuiz()">开始答题</button>`);
  // 选项点击切换
  ['qVersion','qGrade','qSubject'].forEach(id=>{
    $('#'+id).addEventListener('click', e=>{
      if (e.target.dataset.v!==undefined || e.target.dataset.g!==undefined || e.target.dataset.s!==undefined) {
        $$('#'+id+' button').forEach(b=>{b.style.background='#EAF6FF';b.style.color='#5a6a7c';});
        e.target.style.background='#5B9BD5'; e.target.style.color='#fff';
      }
    });
  });
}

function beginQuiz() {
  const version = $('#qVersion .quiz-opt-btn[style*="5B9BD5"]')?.dataset.v || '人教版';
  const grade = parseInt($('#qGrade .quiz-opt-btn[style*="5B9BD5"]')?.dataset.g || 1);
  const subject = $('#qSubject .quiz-opt-btn[style*="5B9BD5"]')?.dataset.s || '数学';
  closeModal();
  // 筛选题目
  let pool = D.QUESTION_BANK.filter(q=>q.version===version && q.grade===grade && q.subject===subject);
  if (pool.length < 10) {
    // 不足则补充同年级同科目
    pool = pool.concat(D.QUESTION_BANK.filter(q=>q.grade===grade && q.subject===subject));
  }
  if (pool.length < 10) {
    pool = pool.concat(D.QUESTION_BANK.filter(q=>q.subject===subject));
  }
  // 打乱取10题
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
      const autoDiaries = S.diaries.filter(d=>d.author==='pet' || d.auto);
      const userDiaries = S.diaries.filter(d=>d.author==='小欣' || (!d.auto && d.author!=='pet'));
      
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
  }
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
  $('#btnPlayAll').addEventListener('click', btnPlayAll);
  $('#petDisplay').addEventListener('click', (e)=>{
    // 双击进详情
    if (e.detail === 2) openPetDetail();
  });
  // 任务页按钮
  $('#btnAnswer').addEventListener('click', startQuiz);
  $('#btnAddTask').addEventListener('click', addTask);
}

// ============ 初始化 ============
function init() {
  S = Storage.load();
  $('#coinNum').textContent = S.coin;
  dailyRefresh();
  autoGenerateDiary();
  checkFestival();
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
