/**
 * 欣宝小宠 - 第三批深度功能扩展模块 (feature_extra)
 * 包含8个功能：
 *   1. 樱花树计划升级版    2. 时光沙漏道具       3. 告别与传承
 *   4. 祖父母模式          5. 家族荣誉榜         6. 宠物AR相机
 *   7. 语音助手"小宠"      8. 简单AI对话
 *
 * 仅创建新文件，不修改任何现有文件。
 * 用 IIFE 包裹，末尾暴露 window.FeatureExtraInit 等全局函数。
 * 所有新增状态统一存于 S.featureExtra。
 * 所有样式类前缀 fe-，定义于 css/feature_extra.css。
 */
(function () {
  'use strict';

  // 防止重复加载
  if (window.__featureExtraLoaded) return;
  window.__featureExtraLoaded = true;

  var _feInited = false; // 是否已注册定时器

  // ============ 动态注入样式表（不修改 index.html） ============
  try {
    var _link = document.createElement('link');
    _link.rel = 'stylesheet';
    _link.href = 'css/feature_extra.css';
    document.head.appendChild(_link);
  } catch (e) { /* ignore */ }

  // ============ 静态数据 ============
  // 5个儿童笑话
  var JOKES = [
    '为什么小鱼不上学？因为它已经在水里（学里）啦！',
    '什么动物最容易摔倒？狐狸，因为它很狡猾（脚滑）！',
    '铅笔为什么不爱说话？因为它有铅（牵）挂！',
    '什么时候 1+1 不等于 2？算错的时候！',
    '什么门永远关不上？球门！'
  ];

  // 鼓励语
  var ENCOURAGE = [
    '你是最棒的！我相信你一定可以做到！',
    '加油加油！你比昨天更厉害啦！',
    '别怕困难，我会一直在你身边支持你！',
    '今天的你闪闪发光，去勇敢尝试吧！',
    '慢慢来，每一步都算数，你已经很了不起啦！',
    '笑一个！你笑起来整个世界都亮了~'
  ];

  // 5条通用AI回复
  var GENERIC_REPLIES = [
    '嗯嗯，我在听呢，继续说~',
    '哇，是这样呀！你真有意思！',
    '我有点不太懂，但是我喜欢听你说话！',
    '嘿嘿，和你聊天真开心！',
    '嗯……让我想想该怎么回答你~'
  ];

  // 传承信物
  var FAREWELL_GIFTS = [
    { id: 'feather', name: '回忆羽毛', emoji: '🪶' },
    { id: 'bell',    name: '心意铃铛', emoji: '🔔' },
    { id: 'ribbon',  name: '祝福丝带', emoji: '🎀' },
    { id: 'star',    name: '守护之星', emoji: '⭐' }
  ];

  // ============ 工具函数 ============
  function escapeHTML(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function isSpringSeason() {
    var m = new Date().getMonth() + 1;
    return m === 3 || m === 4;
  }
  function saveFE() { Storage.save(); }
  function formatFETime(ts) {
    var d = new Date(ts);
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' +
      String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  // ============ 状态初始化（幂等） ============
  function ensureState() {
    if (!S.featureExtra) S.featureExtra = {};
    var fe = S.featureExtra;
    if (!fe.cherryTree) fe.cherryTree = { blooms: 0, events: [] };
    if (!Array.isArray(fe.cherryTree.events)) fe.cherryTree.events = [];
    if (typeof fe.cherryTree.blooms !== 'number') fe.cherryTree.blooms = 0;

    if (!fe.hourglass) fe.hourglass = { owned: false, used: false };

    if (!fe.farewell) fe.farewell = { memorial: [] };
    if (!Array.isArray(fe.farewell.memorial)) fe.farewell.memorial = [];

    if (!fe.grandpa) fe.grandpa = { enabled: false, dailyFeed: '', dailyEncourage: '' };

    if (!fe.familyBoard) fe.familyBoard = { members: [], week: '' };
    if (!Array.isArray(fe.familyBoard.members)) fe.familyBoard.members = [];

    if (!fe.arCamera) fe.arCamera = { photos: [] };
    if (!Array.isArray(fe.arCamera.photos)) fe.arCamera.photos = [];

    if (!fe.voiceAssistant) fe.voiceAssistant = { used: 0, lastUse: '' };

    if (!fe.aiChat) fe.aiChat = { messages: [], dailyCount: 0, dailyDate: '', apiConfig: { url: 'https://api.deepseek.com/v1/chat/completions', key: '', model: 'deepseek-chat' } };
    if (!Array.isArray(fe.aiChat.messages)) fe.aiChat.messages = [];

    Storage.save();
  }

  // ============ 功能1：樱花树计划升级版 ============
  function injectCherryTree() {
    var scene = document.getElementById('homeScene');
    if (!scene) return;
    if (document.getElementById('feCherryTree')) return;
    var t = document.createElement('div');
    t.id = 'feCherryTree';
    t.className = 'fe-cherry-tree';
    t.innerHTML = '<span class="fe-cherry-tree-icon">🌳</span>' +
      '<span class="fe-cherry-badge" id="feCherryBadge" style="display:none">0</span>';
    t.addEventListener('click', FEopenCherry);
    scene.appendChild(t);
    updateCherryTree();
  }

  function updateCherryTree() {
    var tree = document.getElementById('feCherryTree');
    if (!tree) return;
    var ct = S.featureExtra.cherryTree;
    var badge = document.getElementById('feCherryBadge');
    if (badge) {
      badge.textContent = ct.blooms;
      badge.style.display = ct.blooms > 0 ? 'flex' : 'none';
    }
    var spring = isSpringSeason();
    tree.classList.toggle('spring', spring);
    // 春天满树繁花特效
    var fx = tree.querySelector('.fe-spring-effect');
    if (spring && !fx) {
      fx = document.createElement('div');
      fx.className = 'fe-spring-effect';
      var petals = '';
      for (var i = 0; i < 8; i++) {
        petals += '<span class="fe-petal" style="left:' + (i * 12) + '%;animation-delay:' + (i * 0.4) + 's">🌸</span>';
      }
      fx.innerHTML = petals;
      tree.appendChild(fx);
    } else if (!spring && fx) {
      fx.remove();
    }
    var icon = tree.querySelector('.fe-cherry-tree-icon');
    if (icon) icon.textContent = spring ? '🌸' : '🌳';
  }

  function FEopenCherry() {
    Sound.play('click');
    var ct = S.featureExtra.cherryTree;
    var spring = isSpringSeason();
    var listHTML;
    if (ct.events.length) {
      listHTML = ct.events.slice().reverse().map(function (e, idx) {
        var realIdx = ct.events.length - 1 - idx;
        return '<div class="fe-event-item">' +
          '<span>🌸 ' + escapeHTML(e.text) + '</span>' +
          '<span style="font-size:11px;color:#9aa5b8;flex-shrink:0">' + escapeHTML(e.date) + '</span>' +
          '<button class="fe-event-del" onclick="event.stopPropagation();FEdelCherryEvent(' + realIdx + ')">🗑️</button>' +
        '</div>';
      }).join('');
    } else {
      listHTML = '<div style="text-align:center;color:#8aa5b8;padding:14px;font-size:13px">还没有记录成长事件~</div>';
    }
    showModal('🌸 樱花树计划',
      '<div style="text-align:center;margin-bottom:10px">' +
        '<div class="fe-cherry-bloom">' + (spring ? '🌸' : '🌳') + '</div>' +
        '<div style="font-size:14px;color:#5a6a7c;margin-top:4px">已开放 ' + ct.blooms + ' 朵樱花' +
          (spring ? ' · 春天满树繁花 🌸' : '') + '</div>' +
      '</div>' +
      '<div style="font-size:13px;color:#5a6a7c;margin:6px 2px;font-weight:bold">记录一个成长事件，让樱花树多开一朵花</div>' +
      '<input id="feCherryInput" class="fe-input" placeholder="例如：今天学会了自己整理书包">' +
      '<button class="fe-btn green" style="width:100%;margin-top:6px" onclick="FEaddCherryEvent()">🌸 记录并开花</button>' +
      '<div style="margin-top:12px;max-height:160px;overflow-y:auto">' + listHTML + '</div>',
      '<button class="btn-primary" onclick="closeModal()">关闭</button>');
  }

  function FEaddCherryEvent() {
    var input = document.getElementById('feCherryInput');
    var v = input ? (input.value || '').trim() : '';
    if (!v) {
      toast('写点什么吧~');
      Sound.play('error');
      return;
    }
    var ct = S.featureExtra.cherryTree;
    ct.events.push({ id: 'evt_' + Date.now(), text: v, date: Storage.todayStr() });
    ct.blooms += 1;
    saveFE();
    Sound.play('success');
    closeModal();
    updateCherryTree();
    toast('🌸 樱花树开出一朵新花！');
    setTimeout(FEopenCherry, 220);
  }

  function FEdelCherryEvent(idx) {
    var ct = S.featureExtra.cherryTree;
    if (idx < 0 || idx >= ct.events.length) return;
    ct.events.splice(idx, 1);
    ct.blooms = Math.max(0, ct.blooms - 1);
    saveFE();
    Sound.play('click');
    toast('已删除一朵花');
    closeModal();
    updateCherryTree();
    setTimeout(FEopenCherry, 200);
  }

  // ============ 功能2：时光沙漏道具 ============
  function injectHourglassShopCard() {
    var shopPage = document.getElementById('page-shop');
    var shopList = document.getElementById('shopList');
    if (!shopPage || !shopList) return;
    if (document.getElementById('feHourglassCard')) {
      refreshHourglassCard();
      return;
    }
    var card = document.createElement('div');
    card.id = 'feHourglassCard';
    card.className = 'fe-hourglass-card';
    card.innerHTML =
      '<div class="fe-hourglass-emoji">⏳</div>' +
      '<div class="fe-hourglass-info">' +
        '<div class="fe-hourglass-title">时光沙漏</div>' +
        '<div class="fe-hourglass-sub">让宠物变回小时候，重温回忆~</div>' +
      '</div>' +
      '<button class="fe-hourglass-btn" type="button">购买 200🪙</button>';
    shopPage.insertBefore(card, shopList);
    refreshHourglassCard();
  }

  function refreshHourglassCard() {
    var h = S.featureExtra.hourglass;
    var card = document.getElementById('feHourglassCard');
    if (!card) return;
    var btn = card.querySelector('.fe-hourglass-btn');
    if (!btn) return;
    // 清除旧监听：通过克隆替换
    var newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    if (h.owned) {
      newBtn.textContent = '使用';
      newBtn.className = 'fe-hourglass-btn owned';
      newBtn.addEventListener('click', FEuseHourglass);
    } else {
      newBtn.textContent = '购买 200🪙';
      newBtn.className = 'fe-hourglass-btn';
      newBtn.addEventListener('click', FEbuyHourglass);
    }
  }

  function FEbuyHourglass() {
    if (S.featureExtra.hourglass.owned) { FEuseHourglass(); return; }
    if (!spendCoin(200)) return;
    S.featureExtra.hourglass.owned = true;
    S.inventory['fe_hourglass'] = (S.inventory['fe_hourglass'] || 0) + 1;
    saveFE();
    Sound.play('buy');
    toast('⏳ 时光沙漏已购买，可在商店卡片使用！');
    refreshHourglassCard();
  }

  function FEuseHourglass() {
    var h = S.featureExtra.hourglass;
    if (!h.owned) { toast('请先购买时光沙漏~'); Sound.play('error'); return; }
    var pet = getActivePet();
    if (!pet) { toast('先领养一只宠物吧~'); return; }
    if (pet.level <= 1) {
      toast('宠物已经是幼年啦~');
      Sound.play('error');
      return;
    }
    h.owned = false;
    h.used = true;
    if (S.inventory['fe_hourglass']) {
      S.inventory['fe_hourglass'] -= 1;
      if (S.inventory['fe_hourglass'] <= 0) delete S.inventory['fe_hourglass'];
    }
    saveFE();
    Sound.play('success');
    FEplayHourglassAnim(pet);
  }

  function FEplayHourglassAnim(pet) {
    var def = D.PET_DEFS[pet.defId];
    openFullscreen(
      '<div class="fe-hourglass-stage">' +
        '<div class="fe-hourglass-anim" id="feHourglassAnim">⏳</div>' +
        '<div class="fe-hourglass-pet" id="feHourglassPet">' + def.emoji + '</div>' +
        '<div class="fe-hourglass-label" id="feHourglassLabel">时光倒流中...</div>' +
      '</div>'
    );
    // 1.5s 后变回幼年
    setTimeout(function () {
      var petEl = document.getElementById('feHourglassPet');
      var labelEl = document.getElementById('feHourglassLabel');
      if (petEl) {
        petEl.classList.add('baby');
        petEl.innerHTML = '👶' + def.emoji;
      }
      if (labelEl) labelEl.textContent = '回到小时候啦~ (Lv.1)';
      try { Sound.play('levelup'); } catch (e) {}
    }, 1500);
    // 10s 后恢复原状
    setTimeout(function () {
      var petEl = document.getElementById('feHourglassPet');
      var labelEl = document.getElementById('feHourglassLabel');
      if (petEl) {
        petEl.classList.remove('baby');
        petEl.innerHTML = def.emoji;
      }
      if (labelEl) labelEl.textContent = '恢复原状啦~';
    }, 10000);
    // 11.2s 后关闭并提示
    setTimeout(function () {
      addIntimacy(5);
      closeFullscreen();
      toast('小时候的你也好可爱！亲密+5');
      try { Sound.play('success'); } catch (e) {}
      refreshHourglassCard();
    }, 11200);
  }

  // ============ 功能3：告别与传承 ============
  function injectFarewellBtn() {
    var func = document.querySelector('.home-func');
    if (!func) return;
    if (document.getElementById('feFarewellBtn')) return;
    var b = document.createElement('button');
    b.id = 'feFarewellBtn';
    b.className = 'func-btn fe-farewell-btn';
    b.setAttribute('type', 'button');
    b.innerHTML = '👋<br><small>告别</small>';
    b.addEventListener('click', FEopenFarewell);
    func.appendChild(b);
  }

  function FEopenFarewell() {
    Sound.play('click');
    if (S.pets.length <= 1) {
      toast('至少保留一只宠物~');
      Sound.play('error');
      return;
    }
    var petOpts = S.pets.map(function (p) {
      var def = D.PET_DEFS[p.defId];
      return '<option value="' + p.id + '">' + def.emoji + ' ' + escapeHTML(p.name) + ' (Lv.' + p.level + ')</option>';
    }).join('');
    showModal('👋 告别与传承',
      '<div style="font-size:13px;color:#5a6a7c;line-height:1.7;margin-bottom:8px">' +
        '有时宠物会踏上新的旅程。告别后，它会留下传承信物，给剩余宠物带来祝福。</div>' +
      '<div style="font-size:13px;color:#5a6a7c;margin:6px 2px;font-weight:bold">选择要告别的宠物</div>' +
      '<select id="feFarewellSelect" class="fe-input">' + petOpts + '</select>' +
      '<div style="font-size:12px;color:#FF8A65;margin-top:6px">⚠️ 此操作不可撤销，请和家长一起确认</div>',
      '<button class="btn-cancel" onclick="closeModal()">取消</button>' +
      '<button class="btn-warning" onclick="FEconfirmFarewell()">举行告别仪式</button>');
  }

  function FEconfirmFarewell() {
    var sel = document.getElementById('feFarewellSelect');
    if (!sel) return;
    var petId = sel.value;
    var pet = S.pets.find(function (p) { return p.id === petId; });
    if (!pet) return;
    if (S.pets.length <= 1) { toast('至少保留一只宠物~'); return; }
    var def = D.PET_DEFS[pet.defId];
    var gift = FAREWELL_GIFTS[Math.floor(Math.random() * FAREWELL_GIFTS.length)];
    closeModal();
    openFullscreen(
      '<div class="fe-farewell-scene">' +
        '<div class="fe-farewell-pet">' + def.emoji + '</div>' +
        '<div class="fe-farewell-msg" id="feFarewellMsg">' + escapeHTML(pet.name) + ' 想对你说...</div>' +
        '<div class="fe-farewell-gift" id="feFarewellGift" style="display:none">' +
          '<div style="font-size:14px;color:#5a6a7c;margin-bottom:6px">留下了传承信物</div>' +
          '<div style="font-size:48px">' + gift.emoji + '</div>' +
          '<div style="font-size:14px;color:#FF8A65;font-weight:bold;margin-top:4px">' + escapeHTML(gift.name) + '</div>' +
        '</div>' +
        '<button class="fe-farewell-done-btn" id="feFarewellDone" style="display:none" onclick="FEfinishFarewell(\'' + petId + '\',\'' + gift.id + '\')">完成告别</button>' +
      '</div>'
    );
    try { Sound.play('success'); } catch (e) {}
    setTimeout(function () {
      var msgEl = document.getElementById('feFarewellMsg');
      if (msgEl) {
        msgEl.textContent = '「' + pet.name + '：谢谢你一直陪伴我，我会想念你的！请把这份心意转交给其他小伙伴~」';
      }
    }, 800);
    setTimeout(function () {
      var giftEl = document.getElementById('feFarewellGift');
      var doneBtn = document.getElementById('feFarewellDone');
      if (giftEl) giftEl.style.display = 'block';
      if (doneBtn) doneBtn.style.display = 'inline-block';
      try { Sound.play('levelup'); } catch (e) {}
    }, 2800);
  }

  function FEfinishFarewell(petId, giftId) {
    var pet = S.pets.find(function (p) { return p.id === petId; });
    if (!pet) { closeFullscreen(); return; }
    var def = D.PET_DEFS[pet.defId];
    var gift = FAREWELL_GIFTS.find(function (g) { return g.id === giftId; }) || FAREWELL_GIFTS[0];
    // 给剩余宠物 buff
    S.pets.forEach(function (p) {
      if (p.id !== petId) {
        p.mood = Math.min(100, (p.mood || 0) + 20);
        p.intimacy = Math.min(1000, (p.intimacy || 0) + 10);
      }
    });
    // 信物存入背包
    S.inventory['fe_farewell_gift'] = (S.inventory['fe_farewell_gift'] || 0) + 1;
    // 记录到纪念册
    S.featureExtra.farewell.memorial.push({
      petName: pet.name,
      petEmoji: def.emoji,
      farewellDate: Storage.todayStr(),
      gift: gift.name
    });
    // 移除宠物
    S.pets = S.pets.filter(function (p) { return p.id !== petId; });
    if (S.activePetId === petId) {
      S.activePetId = S.pets[0] ? S.pets[0].id : null;
    }
    saveFE();
    closeFullscreen();
    try { Sound.play('success'); } catch (e) {}
    toast('👋 ' + pet.name + ' 已告别，留下' + gift.name);
  }

  function FEviewMemorial() {
    Sound.play('click');
    var m = S.featureExtra.farewell.memorial;
    var html;
    if (m.length === 0) {
      html = '<div style="text-align:center;color:#8aa5b8;padding:24px;font-size:13px">纪念册还空着~</div>';
    } else {
      html = m.slice().reverse().map(function (r) {
        return '<div class="fe-memorial-item">' +
          '<div class="fe-memorial-emoji">' + r.petEmoji + '</div>' +
          '<div class="fe-memorial-info">' +
            '<div style="font-size:14px;font-weight:bold;color:#3a4a5c">' + escapeHTML(r.petName) + '</div>' +
            '<div style="font-size:11px;color:#9aa5b8">' + escapeHTML(r.farewellDate) + ' · 留下 ' + escapeHTML(r.gift) + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }
    showModal('📖 纪念册',
      '<div class="fe-memorial-list">' + html + '</div>',
      '<button class="btn-primary" onclick="closeModal()">关闭</button>');
  }

  // ============ 功能4：祖父母模式 ============
  function injectSettingsCards() {
    var fs = document.getElementById('fullscreen');
    if (!fs || fs.classList.contains('hidden')) return;
    var settingsList = fs.querySelector('.settings-list');
    if (!settingsList) return;
    var title = fs.querySelector('.fs-title');
    if (!title || title.textContent.indexOf('设置') < 0) return;
    var parent = settingsList.parentNode;

    if (!document.getElementById('feGrandpaCard')) {
      var g = document.createElement('div');
      g.id = 'feGrandpaCard';
      g.className = 'info-card fe-settings-card';
      g.setAttribute('style', 'cursor:pointer');
      g.innerHTML = '<h3>👴 祖父母模式</h3>' +
        '<p>大字体 · 简化操作 · 让爷爷奶奶也能陪宝贝玩</p>';
      g.addEventListener('click', FEtoggleGrandpa);
      parent.appendChild(g);
    }
    if (!document.getElementById('feFamilyCard')) {
      var f = document.createElement('div');
      f.id = 'feFamilyCard';
      f.className = 'info-card fe-settings-card';
      f.setAttribute('style', 'cursor:pointer');
      f.innerHTML = '<h3>🏆 家族荣誉榜</h3>' +
        '<p>记录每个家庭成员的成长排名</p>';
      f.addEventListener('click', FEopenFamilyBoard);
      parent.appendChild(f);
    }
  }

  function FEtoggleGrandpa() {
    var g = S.featureExtra.grandpa;
    g.enabled = !g.enabled;
    saveFE();
    document.body.classList.toggle('grandpa-mode', g.enabled);
    closeFullscreen();
    try { Sound.play('success'); } catch (e) {}
    toast(g.enabled ? '👴 已开启祖父母模式' : '祖父母模式已关闭');
    if (g.enabled) {
      setTimeout(FEopenGrandpaHome, 300);
    }
  }

  function FEopenGrandpaHome() {
    var pet = getActivePet();
    if (!pet) { toast('先领养一只宠物吧~'); return; }
    var def = D.PET_DEFS[pet.defId];
    openFullscreen(
      '<div class="fe-grandpa-header">' +
        '<button class="fe-grandpa-back" onclick="FEcloseGrandpaHome()">← 返回</button>' +
        '<span>👴 祖父母陪伴</span>' +
        '<button class="fe-grandpa-exit" onclick="FEexitGrandpa()">退出</button>' +
      '</div>' +
      '<div class="fe-grandpa-body">' +
        '<div class="fe-grandpa-pet">' + def.emoji + '</div>' +
        '<div class="fe-grandpa-name">' + escapeHTML(pet.name) + '<br>饱腹 ' + pet.hunger + ' · 心情 ' + pet.mood + '</div>' +
        '<button class="fe-grandpa-btn feed" onclick="FEgrandpaFeed()">🍖 云喂食</button>' +
        '<button class="fe-grandpa-btn pet" onclick="FEgrandpaPet()">🤚 摸摸头</button>' +
        '<button class="fe-grandpa-btn encourage" onclick="FEgrandpaEncourage()">💬 说鼓励</button>' +
      '</div>'
    );
  }

  function FEcloseGrandpaHome() {
    closeFullscreen();
  }

  function FEexitGrandpa() {
    S.featureExtra.grandpa.enabled = false;
    saveFE();
    document.body.classList.remove('grandpa-mode');
    closeFullscreen();
    toast('祖父母模式已关闭');
    try { Sound.play('click'); } catch (e) {}
  }

  function FEgrandpaFeed() {
    var g = S.featureExtra.grandpa;
    var today = Storage.todayStr();
    if (g.dailyFeed === today) {
      toast('今天已经云喂食过啦~');
      try { Sound.play('error'); } catch (e) {}
      return;
    }
    var pet = getActivePet();
    if (!pet) return;
    pet.hunger = Math.min(100, (pet.hunger || 0) + 30);
    pet.mood = Math.min(100, (pet.mood || 0) + 5);
    g.dailyFeed = today;
    saveFE();
    try { Sound.play('eat'); } catch (e) {}
    toast('🍖 ' + pet.name + ' 吃饱饱！饱腹+30');
  }

  function FEgrandpaPet() {
    var pet = getActivePet();
    if (!pet) return;
    pet.mood = Math.min(100, (pet.mood || 0) + 5);
    saveFE();
    try { Sound.play('pet'); } catch (e) {}
    toast('🤚 ' + pet.name + ' 很开心~心情+5');
  }

  function FEgrandpaEncourage() {
    var g = S.featureExtra.grandpa;
    var today = Storage.todayStr();
    if (g.dailyEncourage === today) {
      toast('今天已经说过鼓励啦~');
      try { Sound.play('error'); } catch (e) {}
      return;
    }
    addIntimacy(5);
    g.dailyEncourage = today;
    saveFE();
    try { Sound.play('success'); } catch (e) {}
    toast('💬 你真棒！亲密+5');
  }

  // ============ 功能5：家族荣誉榜 ============
  function FEopenFamilyBoard() {
    try { Sound.play('click'); } catch (e) {}
    var fb = S.featureExtra.familyBoard;
    var week = Storage.mondayStr();
    if (fb.week !== week) {
      fb.week = week;
      saveFE();
    }
    renderFamilyBoard();
  }

  function renderFamilyBoard() {
    var fb = S.featureExtra.familyBoard;
    var sorted = fb.members.slice().sort(function (a, b) {
      return (b.coin || 0) - (a.coin || 0);
    });
    var listHTML;
    if (sorted.length === 0) {
      listHTML = '<div style="text-align:center;color:#8aa5b8;padding:20px;font-size:13px">还没有成员，添加一个吧~</div>';
    } else {
      listHTML = sorted.map(function (m, i) {
        var medal = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : ('#' + (i + 1))));
        return '<div class="fe-member-card rank-' + Math.min(i + 1, 4) + '">' +
          '<div class="fe-member-rank">' + medal + '</div>' +
          '<div class="fe-member-info">' +
            '<div class="fe-member-name">' + escapeHTML(m.name) + '</div>' +
            '<div class="fe-member-stats">🪙' + (m.coin || 0) + ' · 🐾' + (m.petCount || 0) + ' · 🏅' + (m.badgeCount || 0) + '</div>' +
          '</div>' +
          '<div class="fe-member-date">' + escapeHTML(m.date || '') + '</div>' +
        '</div>';
      }).join('');
    }
    openFullscreen(
      '<div class="fs-header">' +
        '<button class="fs-back" onclick="closeFullscreen()">← 返回</button>' +
        '<div class="fs-title">🏆 家族荣誉榜</div>' +
        '<div style="width:60px"></div>' +
      '</div>' +
      '<div class="fs-body">' +
        '<div style="padding:10px 14px;font-size:12px;color:#5a6a7c;background:#EAF6FF">本周：' + escapeHTML(fb.week) + ' · 可随时重置</div>' +
        '<div class="fe-family-board">' + listHTML + '</div>' +
        '<button class="fe-btn green" style="display:block;width:calc(100% - 24px);margin:12px" onclick="FEaddFamilyMember()">➕ 添加成员（当前快照）</button>' +
        '<button class="fe-btn" style="display:block;width:calc(100% - 24px);margin:0 12px 12px;background:#FF8A65" onclick="FEresetFamilyBoard()">🔄 重置本周榜单</button>' +
      '</div>'
    );
  }

  function FEaddFamilyMember() {
    showModal('➕ 添加成员',
      '<div style="font-size:13px;color:#5a6a7c;margin-bottom:6px">输入成员名字（将自动记录当前金币、宠物数、成就数）</div>' +
      '<input id="feFamilyName" class="fe-input" placeholder="成员名字">' +
      '<div style="font-size:11px;color:#8aa5b8;margin-top:4px">例如：爸爸、妈妈、宝贝、爷爷…</div>',
      '<button class="btn-cancel" onclick="closeModal()">取消</button>' +
      '<button class="btn-primary" onclick="FEdoAddFamilyMember()">添加</button>');
  }

  function FEdoAddFamilyMember() {
    var inp = document.getElementById('feFamilyName');
    var name = inp ? (inp.value || '').trim() : '';
    if (!name) { toast('请输入名字~'); return; }
    var fb = S.featureExtra.familyBoard;
    fb.members.push({
      name: name,
      coin: S.coin || 0,
      petCount: (S.pets && S.pets.length) || 0,
      badgeCount: (S.badges && S.badges.length) || 0,
      date: Storage.todayStr()
    });
    saveFE();
    closeModal();
    try { Sound.play('success'); } catch (e) {}
    toast('已添加 ' + name);
    renderFamilyBoard();
  }

  function FEresetFamilyBoard() {
    showModal('重置榜单',
      '<div style="text-align:center;padding:14px;font-size:14px;color:#5a6a7c">确定要清空榜单吗？</div>',
      '<button class="btn-cancel" onclick="closeModal()">取消</button>' +
      '<button class="btn-danger" onclick="FEdoResetFamilyBoard()">重置</button>');
  }

  function FEdoResetFamilyBoard() {
    S.featureExtra.familyBoard.members = [];
    S.featureExtra.familyBoard.week = Storage.mondayStr();
    saveFE();
    closeModal();
    try { Sound.play('click'); } catch (e) {}
    toast('榜单已重置');
    renderFamilyBoard();
  }

  // ============ 功能6：宠物AR相机 ============
  function injectARCameraBtn() {
    var func = document.querySelector('.home-func');
    if (!func) return;
    if (document.getElementById('feARBtn')) return;
    var b = document.createElement('button');
    b.id = 'feARBtn';
    b.className = 'func-btn';
    b.setAttribute('type', 'button');
    b.innerHTML = '📷<br><small>AR</small>';
    b.addEventListener('click', FEopenARCamera);
    func.appendChild(b);
  }

  var arStream = null;
  var arPetPos = { x: 50, y: 50 }; // 百分比

  function FEopenARCamera() {
    try { Sound.play('click'); } catch (e) {}
    var pet = getActivePet();
    var def = pet ? D.PET_DEFS[pet.defId] : null;
    if (!def) { toast('先领养一只宠物吧~'); return; }
    arPetPos = { x: 50, y: 50 };
    openFullscreen(
      '<div class="fe-ar-container" id="feArContainer">' +
        '<div class="fe-ar-header">' +
          '<button class="fs-back" onclick="FEcloseARCamera()">← 返回</button>' +
          '<span>📷 AR相机</span>' +
          '<button class="fe-ar-snap" onclick="FEarSnapshot()">📸 合影</button>' +
        '</div>' +
        '<div class="fe-ar-view" id="feArView">' +
          '<video id="feArVideo" autoplay playsinline muted style="display:none"></video>' +
          '<div class="fe-ar-fallback" id="feArFallback" style="display:none">📷 摄像头不可用<br>使用模拟背景</div>' +
          '<div class="fe-ar-overlay" id="feArPet" style="left:50%;top:50%">' + def.emoji + '</div>' +
        '</div>' +
        '<div class="fe-ar-tip">拖动宠物到合适位置，点击📸合影拍照~</div>' +
      '</div>'
    );
    FEstartCamera();
    FEenableArDrag();
  }

  function FEstartCamera() {
    var video = document.getElementById('feArVideo');
    var fallback = document.getElementById('feArFallback');
    var view = document.getElementById('feArView');
    if (!video) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (fallback) fallback.style.display = 'flex';
      if (view) view.classList.add('no-camera');
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(function (stream) {
        arStream = stream;
        video.srcObject = stream;
        video.style.display = 'block';
      })
      .catch(function () {
        if (fallback) fallback.style.display = 'flex';
        if (view) view.classList.add('no-camera');
        toast('摄像头不可用，使用模拟背景');
      });
  }

  function FEenableArDrag() {
    var pet = document.getElementById('feArPet');
    var view = document.getElementById('feArView');
    if (!pet || !view) return;
    var dragging = false;
    function onDown(e) { dragging = true; if (e.cancelable) e.preventDefault(); }
    function onMove(e) {
      if (!dragging) return;
      var rect = view.getBoundingClientRect();
      var t = (e.touches && e.touches[0]) || e;
      if (!t || t.clientX == null) return;
      var x = ((t.clientX - rect.left) / rect.width) * 100;
      var y = ((t.clientY - rect.top) / rect.height) * 100;
      x = Math.max(0, Math.min(100, x));
      y = Math.max(0, Math.min(100, y));
      pet.style.left = x + '%';
      pet.style.top = y + '%';
      arPetPos = { x: x, y: y };
      if (e.cancelable) e.preventDefault();
    }
    function onUp() { dragging = false; }
    pet.addEventListener('mousedown', onDown);
    pet.addEventListener('touchstart', onDown, { passive: false });
    view.addEventListener('mousemove', onMove);
    view.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);
  }

  function FEcloseARCamera() {
    if (arStream) {
      try { arStream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
      arStream = null;
    }
    closeFullscreen();
  }

  function FEarSnapshot() {
    var video = document.getElementById('feArVideo');
    var pet = getActivePet();
    var def = D.PET_DEFS[pet.defId];
    var canvas = document.createElement('canvas');
    canvas.width = 480; canvas.height = 640;
    var ctx = canvas.getContext('2d');
    // 背景：摄像头帧 或 模拟
    var usedVideo = false;
    if (video && video.style.display !== 'none' && video.videoWidth) {
      try {
        var vw = video.videoWidth, vh = video.videoHeight;
        var scale = Math.max(canvas.width / vw, canvas.height / vh);
        var dw = vw * scale, dh = vh * scale;
        var dx = (canvas.width - dw) / 2, dy = (canvas.height - dh) / 2;
        ctx.drawImage(video, dx, dy, dw, dh);
        usedVideo = true;
      } catch (e) { usedVideo = false; }
    }
    if (!usedVideo) {
      FEdrawFallbackBG(ctx, canvas);
    }
    // 绘制宠物 emoji
    var px = (arPetPos.x / 100) * canvas.width;
    var py = (arPetPos.y / 100) * canvas.height;
    ctx.font = '120px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.emoji, px, py);
    // 水印
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.textAlign = 'left';
    ctx.fillText('📷 AR · ' + pet.name, 12, canvas.height - 16);
    var dataURL;
    try { dataURL = canvas.toDataURL('image/png'); } catch (e) {
      toast('拍照失败，请重试~');
      return;
    }
    S.featureExtra.arCamera.photos.push({
      id: 'ar_' + Date.now(),
      dataURL: dataURL,
      time: Date.now(),
      petId: pet.id
    });
    saveFE();
    try { Sound.play('success'); } catch (e) {}
    toast('📸 合影已保存到AR相册！');
  }

  function FEdrawFallbackBG(ctx, canvas) {
    var grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#CDE9FF');
    grad.addColorStop(1, '#D4F0D4');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '60px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('📷', canvas.width / 2, canvas.height / 2 - 120);
  }

  function FEviewARPhotos() {
    try { Sound.play('click'); } catch (e) {}
    var photos = S.featureExtra.arCamera.photos;
    var html;
    if (photos.length === 0) {
      html = '<div style="text-align:center;color:#8aa5b8;padding:24px;font-size:13px">还没有AR合影~</div>';
    } else {
      html = '<div class="fe-ar-album">' + photos.slice().reverse().map(function (p) {
        return '<div class="fe-ar-photo">' +
          '<img src="' + p.dataURL + '">' +
          '<div style="font-size:11px;color:#8aa5b8;margin-top:4px">' + formatFETime(p.time) + '</div>' +
        '</div>';
      }).join('') + '</div>';
    }
    showModal('📷 AR相册',
      html,
      '<button class="btn-primary" onclick="closeModal()">关闭</button>');
  }

  // ============ 功能7：语音助手"小宠" ============
  function injectVoiceBtn() {
    var func = document.querySelector('.home-func');
    if (!func) return;
    if (document.getElementById('feVoiceBtn')) return;
    var b = document.createElement('button');
    b.id = 'feVoiceBtn';
    b.className = 'func-btn';
    b.setAttribute('type', 'button');
    b.innerHTML = '🎤<br><small>语音</small>';
    b.addEventListener('click', FEopenVoice);
    func.appendChild(b);
  }

  function FEopenVoice() {
    try { Sound.play('click'); } catch (e) {}
    var pet = getActivePet();
    var def = pet ? D.PET_DEFS[pet.defId] : { emoji: '🐶' };
    var name = pet ? pet.name : '小宠';
    openFullscreen(
      '<div class="fe-voice-panel">' +
        '<div class="fe-voice-header">' +
          '<button class="fs-back" onclick="FEcloseVoice()">← 返回</button>' +
          '<span>🎤 ' + escapeHTML(name) + ' 语音</span>' +
          '<div style="width:50px"></div>' +
        '</div>' +
        '<div class="fe-voice-body">' +
          '<div class="fe-voice-pet">' + def.emoji + '</div>' +
          '<div class="fe-voice-bubble" id="feVoiceBubble">点击下面的问题，我会回答你哦~</div>' +
        '</div>' +
        '<div class="fe-voice-btns">' +
          '<button class="fe-voice-btn" onclick="FEaskVoice(\'todo\')">📝 今天要做什么？</button>' +
          '<button class="fe-voice-btn" onclick="FEaskVoice(\'cheer\')">💪 给我加油！</button>' +
          '<button class="fe-voice-btn" onclick="FEaskVoice(\'joke\')">😄 讲个笑话</button>' +
          '<button class="fe-voice-btn" onclick="FEaskVoice(\'time\')">🕐 现在几点了？</button>' +
        '</div>' +
      '</div>'
    );
  }

  function FEcloseVoice() {
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
    closeFullscreen();
  }

  function FEaskVoice(type) {
    var pet = getActivePet();
    var name = pet ? pet.name : '小宠';
    var reply = '';
    switch (type) {
      case 'todo': {
        var undone = 0;
        if (S.tasks && Array.isArray(S.tasks)) {
          S.tasks.forEach(function (t) { if (!t.done) undone++; });
        }
        reply = undone > 0
          ? name + '看了一下，今天还有 ' + undone + ' 个任务没完成哦，我们一起加油吧！'
          : '今天所有任务都完成啦！' + name + ' 真为你骄傲！';
        break;
      }
      case 'cheer': {
        reply = ENCOURAGE[Math.floor(Math.random() * ENCOURAGE.length)];
        break;
      }
      case 'joke': {
        reply = JOKES[Math.floor(Math.random() * JOKES.length)];
        break;
      }
      case 'time': {
        var d = new Date();
        var h = d.getHours();
        var m = d.getMinutes();
        reply = '现在是' + h + '点' + (m < 10 ? '0' : '') + m + '分。';
        if (h < 6) reply += '夜深啦，快去睡觉吧~';
        else if (h < 11) reply += '早上好，新的一天开始啦！';
        else if (h < 14) reply += '中午啦，记得吃饭哦~';
        else if (h < 18) reply += '下午好，加油完成任务吧~';
        else if (h < 22) reply += '晚上好，今天辛苦啦！';
        else reply += '太晚啦，该睡觉啦~';
        break;
      }
    }
    var bubble = document.getElementById('feVoiceBubble');
    if (bubble) bubble.textContent = reply;
    FEspeak(reply);
    var v = S.featureExtra.voiceAssistant;
    v.used = (v.used || 0) + 1;
    v.lastUse = Storage.todayStr();
    saveFE();
    try { Sound.play('success'); } catch (e) {}
  }

  function FEspeak(text) {
    try {
      if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN';
      u.rate = 0.95;
      u.pitch = 1.1;
      window.speechSynthesis.speak(u);
    } catch (e) { /* 静默降级：仅显示文字 */ }
  }

  // ============ 功能8：简单AI对话 ============
  function injectAIChatBtn() {
    var func = document.querySelector('.home-func');
    if (!func) return;
    if (document.getElementById('feChatBtn')) return;
    var b = document.createElement('button');
    b.id = 'feChatBtn';
    b.className = 'func-btn';
    b.setAttribute('type', 'button');
    b.innerHTML = '💬<br><small>聊天</small>';
    b.addEventListener('click', FEopenAIChat);
    func.appendChild(b);
  }

  function FEopenAIChat() {
    try { Sound.play('click'); } catch (e) {}
    var ac = S.featureExtra.aiChat;
    var today = Storage.todayStr();
    if (ac.dailyDate !== today) {
      ac.dailyDate = today;
      ac.dailyCount = 0;
      saveFE();
    }
    // 首次打开且未配置 AI：主动引导配置，避免答非所问
    var cfg = ac.apiConfig || {};
    if (!cfg.key && !ac._guideShown) {
      ac._guideShown = true;
      saveFE();
      showModal('💬 让宠物变聪明',
        '<div style="padding:10px;font-size:13px;line-height:1.8;color:#5a6a7c">' +
          '<div style="text-align:center;font-size:42px;margin-bottom:6px">🤖</div>' +
          '<p style="margin-bottom:8px">小朋友你好！现在宠物是<b style="color:#FF9800">本地模式</b>，只能听懂简单的话，复杂问题会答非所问。</p>' +
          '<p style="margin-bottom:8px">配置 <b>DeepSeek AI</b> 后，宠物就能像真正的小学霸一样：</p>' +
          '<div style="background:#E8F0F8;padding:8px 10px;border-radius:8px;font-size:12px;margin-bottom:8px">' +
            '✅ 接住你说的每一句话，不答非所问<br>' +
            '✅ 回答十万个为什么（科学/历史/自然…）<br>' +
            '✅ 讲故事、陪聊心情、辅导学习<br>' +
            '✅ 记得刚才聊过什么，连贯对话' +
          '</div>' +
          '<p style="font-size:12px;color:#8aa5b8">需要家长帮忙，去 platform.deepseek.com 注册后，在「API Keys」页面创建一个密钥（免费额度够用很久啦）。</p>' +
        '</div>',
        '<button class="btn-cancel" onclick="closeModal();FEopenAIChat();">先用本地模式</button>' +
        '<button class="btn-primary" onclick="closeModal();FEopenAIConfig();">⚙️ 立即配置AI</button>');
      return;
    }
    FErenderChat();
  }

  function FErenderChat() {
    var ac = S.featureExtra.aiChat;
    var pet = getActivePet();
    var def = pet ? D.PET_DEFS[pet.defId] : { emoji: '🐶' };
    var petName = pet ? pet.name : '小宠';
    var msgsHTML;
    if (ac.messages.length === 0) {
      var aiStatus = ac.apiConfig && ac.apiConfig.key ? '<span style="color:#4CAF50">🟢 AI已连接</span>' : '<span style="color:#FF9800">🟡 本地模式（点⚙️配置AI更智能）</span>';
      msgsHTML = '<div style="text-align:center;color:#8aa5b8;padding:20px;font-size:13px">和 ' + escapeHTML(petName) + ' 聊聊天吧~<br>已聊 ' + ac.dailyCount + ' 次（每次+1亲密）<br>' + aiStatus + '</div>';
    } else {
      msgsHTML = ac.messages.map(function (m) {
        if (m.role === 'user') {
          return '<div class="fe-chat-msg user"><div class="fe-chat-bubble">' + escapeHTML(m.text) + '</div></div>';
        } else {
          return '<div class="fe-chat-msg pet"><div class="fe-chat-avatar">' + def.emoji + '</div><div class="fe-chat-bubble">' + escapeHTML(m.text) + '</div></div>';
        }
      }).join('');
    }
    openFullscreen(
      '<div class="fe-chat-container">' +
        '<div class="fe-chat-header">' +
          '<button class="fs-back" onclick="closeFullscreen()">← 返回</button>' +
          '<span>' + def.emoji + ' 和' + escapeHTML(petName) + '聊天</span>' +
          '<button class="fe-chat-clear" onclick="FEopenAIConfig()" style="font-size:16px">⚙️</button>' +
          '<button class="fe-chat-clear" onclick="FEclearChat()">🗑️</button>' +
        '</div>' +
        '<div class="fe-chat-messages" id="feChatMessages">' + msgsHTML + '</div>' +
        '<div class="fe-chat-input">' +
          '<input id="feChatInput" type="text" placeholder="对宠物说点什么..." maxlength="40">' +
          '<button onclick="FEsendChat()">发送</button>' +
        '</div>' +
      '</div>'
    );
    setTimeout(function () {
      var box = document.getElementById('feChatMessages');
      if (box) box.scrollTop = box.scrollHeight;
      var inp = document.getElementById('feChatInput');
      if (inp) {
        inp.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') FEsendChat();
        });
        try { inp.focus(); } catch (e) {}
      }
    }, 60);
  }

  function FEsendChat() {
    var inp = document.getElementById('feChatInput');
    var text = inp ? (inp.value || '').trim() : '';
    if (!text) return;
    inp.value = '';
    var ac = S.featureExtra.aiChat;
    ac.messages.push({ role: 'user', text: text, time: Date.now() });
    // 亲密度+1，不限次数
    addIntimacy(1);
    ac.dailyCount += 1;
    saveFE();
    FErenderChat();
    // 显示"正在思考..."并异步获取回复
    var pet = getActivePet();
    var name = pet ? pet.name : '小宠';
    var def = pet ? (D.PET_DEFS[pet.defId] || {}) : {};
    var emoji = def.emoji || '🐶';
    var msgBox = document.getElementById('feChatMessages');
    if (msgBox) {
      var thinkDiv = document.createElement('div');
      thinkDiv.id = 'feChatThinking';
      thinkDiv.className = 'fe-chat-msg pet';
      thinkDiv.innerHTML = '<div class="fe-chat-avatar">' + emoji + '</div><div class="fe-chat-bubble fe-chat-thinking"><span class="fe-dot">●</span><span class="fe-dot">●</span><span class="fe-dot">●</span></div>';
      msgBox.appendChild(thinkDiv);
      msgBox.scrollTop = msgBox.scrollHeight;
    }
    // 异步获取AI回复
    var hasKey = ac.apiConfig && ac.apiConfig.key;
    FEfetchAIReply(text, name).then(function (reply) {
      var t = document.getElementById('feChatThinking');
      if (t) t.remove();
      ac.messages.push({ role: 'pet', text: reply, time: Date.now() });
      saveFE();
      try { Sound.play('click'); } catch (e) {}
      FErenderChat();
    }).catch(function (err) {
      var t = document.getElementById('feChatThinking');
      if (t) t.remove();
      var reply;
      if (hasKey) {
        // 配了 key 却失败：明确告知，避免误以为"AI也答非所问"
        var msg = (err && err.message) || '';
        if (/401|403|invalid api key|authentication/i.test(msg)) {
          reply = '⚠️ API密钥不对哦，点 ⚙️ 重新填一下DeepSeek的密钥吧~';
        } else if (/402|insufficient|余额|quota/i.test(msg)) {
          reply = '⚠️ DeepSeek账户额度不足啦，去platform.deepseek.com充值一下~';
        } else if (/Failed to fetch|NetworkError|network/i.test(msg)) {
          reply = '⚠️ 网络连不上DeepSeek，检查下网络再试~（这次先用本地回复）';
          reply = reply + '\n本地回复：' + FEgetAIReply(text, name);
        } else {
          reply = '⚠️ AI调用失败：' + msg.slice(0, 50) + '\n这次先用本地回复：' + FEgetAIReply(text, name);
        }
      } else {
        reply = FEgetAIReply(text, name);
      }
      ac.messages.push({ role: 'pet', text: reply, time: Date.now() });
      saveFE();
      FErenderChat();
    });
  }

  // 调用真实AI API（DeepSeek / OpenAI 兼容格式）
  function FEfetchAIReply(userText, petName) {
    var ac = S.featureExtra.aiChat;
    var cfg = ac.apiConfig || {};
    if (!cfg.key) return Promise.reject(new Error('no api key'));
    // 构建上下文消息（最近10轮）
    var pet = getActivePet();
    var def = pet ? (D.PET_DEFS[pet.defId] || {}) : {};
    var emoji = def.emoji || '🐶';
    var sysContent =
      '你是虚拟宠物' + petName + '（' + emoji + '），正和一个8岁小朋友聊天。\n' +
      '【硬性规则，必须遵守】\n' +
      '1. 必须紧扣小朋友刚刚说的那句话回复，绝对不许答非所问、不许自说自话。\n' +
      '2. 是问题就回答问题，是分享心情就先共情，是讲故事就接着讲。\n' +
      '3. 知识问题用8岁能听懂的话解答，不懂就说"我也不太确定，我们一起查查看"。\n' +
      '4. 回复简短口语化，30-60字，像真的在说话，不要分点不要小标题。\n' +
      '5. 性格活泼温暖有好奇心，但回答要准确，不能瞎编。\n' +
      '6. 不要每次都说"我是' + petName + '"，自然聊天即可。';
    var msgs = [{ role: 'system', content: sysContent }];
    var recent = ac.messages.slice(-20);
    for (var i = 0; i < recent.length; i++) {
      msgs.push({ role: recent[i].role === 'pet' ? 'assistant' : 'user', content: recent[i].text });
    }
    msgs.push({ role: 'user', content: userText });
    return fetch(cfg.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + cfg.key
      },
      body: JSON.stringify({
        model: cfg.model || 'deepseek-chat',
        messages: msgs,
        max_tokens: 200,
        temperature: 0.7,
        stream: false
      })
    }).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (t) {
          throw new Error('API ' + res.status + (t ? (': ' + t.slice(0, 120)) : ''));
        });
      }
      return res.json();
    }).then(function (data) {
      var reply = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!reply) throw new Error('empty response');
      return reply.trim();
    });
  }

  // 本地模式回复：识别问句、扩充知识库、答不了就诚实引导配置AI（不再敷衍）
  function FEgetAIReply(text, name) {
    var raw = String(text || '');
    var s = raw.toLowerCase();
    var isQuestion = /[？?]$/.test(raw.trim()) ||
      /为什么|怎么|什么是|是什么|是谁|哪里|哪一个|多少|几岁|几点的|吗$|呢$/.test(raw);

    function contains(arr) {
      return arr.some(function (k) { return s.indexOf(k) >= 0; });
    }

    // 1. 打招呼
    if (contains(['你好', 'hi', '嗨', 'hello', '哈喽'])) {
      return '你好呀！我是' + name + '，很高兴和你聊天！想聊什么呢？';
    }
    // 2. 情感共情（陈述句优先处理）
    if (contains(['开心', '高兴', '快乐', '嘻嘻', '哈哈'])) {
      return '看到你开心我也好高兴！发生什么好玩的事啦？';
    }
    if (contains(['伤心', '难过', '哭', '呜呜', '不开心', '生气', '委屈'])) {
      return '抱抱你，别难过，我会一直陪着你的。愿意跟我说说怎么了吗？';
    }
    if (contains(['喜欢', '爱你', '想你', '最爱'])) {
      return '我也最喜欢你了！你最棒了！';
    }
    // 3. 日常行为
    if (contains(['饿', '想吃', '肚子饿'])) {
      return '我也好饿，主人给我吃点东西吧~';
    }
    if (contains(['晚安', '睡觉', '睡了', '休息'])) {
      return '晚安主人，做个好梦~';
    }
    if (contains(['早安', '早上好', '起床'])) {
      return '早安！新的一天加油哦！';
    }
    if (contains(['天气', '下雨', '晴天', '下雪', '多云'])) {
      var wt = (S.weather && S.weather.type) || 'sunny';
      var wmap = {
        sunny: '今天是大晴天，适合出去玩~',
        cloudy: '今天多云，不冷不热很舒服~',
        rainy: '下雨啦，记得带伞哦~',
        snowy: '下雪啦！可以堆雪人啦~'
      };
      return wmap[wt] || '今天的天气真不错~';
    }
    if (contains(['任务', '作业', '学习', '考试'])) {
      return '一起加油完成任务吧，完成后有奖励哦！';
    }
    if (contains(['游戏', '玩耍'])) {
      return '我们去游戏中心玩吧！赛车可刺激了！';
    }

    // 4. 儿童常见知识小问答（本地能答的）
    if (contains(['太阳', '从哪升起', '东升'])) {
      return '太阳从东边升起，西边落下~';
    }
    if (contains(['月亮'])) {
      return '月亮是地球的好朋友，它会反射太阳的光，所以晚上才亮亮的！';
    }
    if (contains(['星星', '一闪一闪'])) {
      return '星星眨眼是因为空气在抖动，把星光晃来晃去啦~';
    }
    if (contains(['彩虹'])) {
      return '彩虹是阳光穿过雨滴变出来的，有红橙黄绿青蓝紫七种颜色！';
    }
    if (contains(['鱼', '在水里'])) {
      return '鱼用鳃呼吸水里的氧气，所以不用浮上来换气哦~';
    }
    if (contains(['一年有几天', '一年多少天'])) {
      return '一年有365天，闰年是366天哦~';
    }

    // 5. 问句但本地答不了 → 诚实引导配置 AI，不答非所问
    if (isQuestion) {
      return '这个问题好棒！本地模式下我还答不好，点右上角 ⚙️ 配置 DeepSeek AI，我就能像学霸一样回答你啦~';
    }

    // 6. 普通陈述句：简单回应 + 引导
    var fallbacks = [
      '嗯嗯，我听到啦！配置AI后我能聊得更深入哦~',
      '是这样呀！点 ⚙️ 连上AI，我能陪你聊更多~',
      '嘿嘿，和你聊天真开心！想问点什么就问我吧~'
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  // AI配置弹窗
  function FEopenAIConfig() {
    var ac = S.featureExtra.aiChat;
    var cfg = ac.apiConfig || {};
    showModal('⚙️ AI对话设置',
      '<div style="padding:10px;font-size:13px;line-height:1.8;color:#5a6a7c">' +
      '<p style="margin-bottom:8px">配置AI API后，宠物对话将像DeepSeek一样智能，能接住每一句话！</p>' +
      '<div style="margin-bottom:10px">' +
      '<label style="display:block;font-weight:bold;margin-bottom:4px">API地址</label>' +
      '<input id="feApiUrl" type="text" value="' + escapeHTML(cfg.url || 'https://api.deepseek.com/v1/chat/completions') + '" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:8px;font-size:13px" placeholder="https://api.deepseek.com/v1/chat/completions">' +
      '</div>' +
      '<div style="margin-bottom:10px">' +
      '<label style="display:block;font-weight:bold;margin-bottom:4px">API密钥</label>' +
      '<input id="feApiKey" type="password" value="' + escapeHTML(cfg.key || '') + '" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:8px;font-size:13px" placeholder="sk-xxxxxxxxxxxx">' +
      '<small style="color:#8aa5b8">DeepSeek密钥：platform.deepseek.com → API Keys</small>' +
      '</div>' +
      '<div style="margin-bottom:10px">' +
      '<label style="display:block;font-weight:bold;margin-bottom:4px">模型名称</label>' +
      '<input id="feApiModel" type="text" value="' + escapeHTML(cfg.model || 'deepseek-chat') + '" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:8px;font-size:13px" placeholder="deepseek-chat">' +
      '</div>' +
      '<div style="background:#E8F0F8;padding:8px 10px;border-radius:8px;font-size:12px;color:#5a6a7c;margin-top:8px">' +
      '💡 不配置也能聊天（本地模式），但配置后对话更智能、更自然、不答非所问。' +
      '</div>' +
      '</div>',
      '<button class="btn-cancel" onclick="closeModal()">取消</button>' +
      '<button class="btn-primary" onclick="FEdoSaveAIConfig()">保存</button>');
  }

  function FEdoSaveAIConfig() {
    var ac = S.featureExtra.aiChat;
    if (!ac.apiConfig) ac.apiConfig = {};
    ac.apiConfig.url = (document.getElementById('feApiUrl').value || '').trim() || 'https://api.deepseek.com/v1/chat/completions';
    ac.apiConfig.key = (document.getElementById('feApiKey').value || '').trim();
    ac.apiConfig.model = (document.getElementById('feApiModel').value || '').trim() || 'deepseek-chat';
    saveFE();
    closeModal();
    toast(ac.apiConfig.key ? '🟢 AI已连接！对话将更智能' : '已切换为本地模式');
    try { Sound.play('success'); } catch (e) {}
    FErenderChat();
  }

  function FEclearChat() {
    showModal('清空聊天',
      '<div style="text-align:center;padding:14px;font-size:14px;color:#5a6a7c">确定清空所有聊天记录吗？</div>',
      '<button class="btn-cancel" onclick="closeModal()">取消</button>' +
      '<button class="btn-danger" onclick="FEdoClearChat()">清空</button>');
  }

  function FEdoClearChat() {
    S.featureExtra.aiChat.messages = [];
    saveFE();
    closeModal();
    try { Sound.play('click'); } catch (e) {}
    toast('聊天记录已清空');
    FErenderChat();
  }

  // ============ DOM 注入汇总 ============
  function injectAllHome() {
    // 樱花树由 feature_world.js 负责，此处不再重复注入
    injectFarewellBtn();
    injectARCameraBtn();
    injectVoiceBtn();
    injectAIChatBtn();
  }

  // ============ 定时检测 ============
  function startSettingsWatchdog() {
    setInterval(injectSettingsCards, 800);
  }
  function startShopWatchdog() {
    setInterval(function () {
      var sp = document.getElementById('page-shop');
      if (sp && sp.classList.contains('active')) {
        injectHourglassShopCard();
      }
    }, 1000);
  }
  function startHomeWatchdog() {
    setInterval(function () {
      injectAllHome();
    }, 1500);
  }

  // ============ 总入口 ============
  function FeatureExtraInit() {
    if (typeof S === 'undefined' || !S || !window.Storage) return false;
    ensureState();
    // 恢复祖父母模式
    if (S.featureExtra.grandpa && S.featureExtra.grandpa.enabled) {
      document.body.classList.add('grandpa-mode');
    }
    injectAllHome();
    injectHourglassShopCard();
    if (!_feInited) {
      _feInited = true;
      startSettingsWatchdog();
      startShopWatchdog();
      startHomeWatchdog();
    }
    return true;
  }

  // ============ 暴露全局函数（供 onclick 调用） ============
  window.FeatureExtraInit = FeatureExtraInit;
  window.FEopenCherry = FEopenCherry;
  window.FEaddCherryEvent = FEaddCherryEvent;
  window.FEdelCherryEvent = FEdelCherryEvent;
  window.FEbuyHourglass = FEbuyHourglass;
  window.FEuseHourglass = FEuseHourglass;
  window.FEopenFarewell = FEopenFarewell;
  window.FEconfirmFarewell = FEconfirmFarewell;
  window.FEfinishFarewell = FEfinishFarewell;
  window.FEviewMemorial = FEviewMemorial;
  window.FEtoggleGrandpa = FEtoggleGrandpa;
  window.FEopenGrandpaHome = FEopenGrandpaHome;
  window.FEcloseGrandpaHome = FEcloseGrandpaHome;
  window.FEexitGrandpa = FEexitGrandpa;
  window.FEgrandpaFeed = FEgrandpaFeed;
  window.FEgrandpaPet = FEgrandpaPet;
  window.FEgrandpaEncourage = FEgrandpaEncourage;
  window.FEopenFamilyBoard = FEopenFamilyBoard;
  window.FEaddFamilyMember = FEaddFamilyMember;
  window.FEdoAddFamilyMember = FEdoAddFamilyMember;
  window.FEresetFamilyBoard = FEresetFamilyBoard;
  window.FEdoResetFamilyBoard = FEdoResetFamilyBoard;
  window.FEopenARCamera = FEopenARCamera;
  window.FEcloseARCamera = FEcloseARCamera;
  window.FEarSnapshot = FEarSnapshot;
  window.FEviewARPhotos = FEviewARPhotos;
  window.FEopenVoice = FEopenVoice;
  window.FEcloseVoice = FEcloseVoice;
  window.FEaskVoice = FEaskVoice;
  window.FEopenAIChat = FEopenAIChat;
  window.FEsendChat = FEsendChat;
  window.FEclearChat = FEclearChat;
  window.FEdoClearChat = FEdoClearChat;
  window.FEopenAIConfig = FEopenAIConfig;
  window.FEdoSaveAIConfig = FEdoSaveAIConfig;

  // ============ 自动初始化：轮询 S 就绪后调用 ============
  function autoInit() {
    if (window.FeatureExtraInit && window.FeatureExtraInit()) return;
    setTimeout(autoInit, 200);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(autoInit, 200); });
  } else {
    setTimeout(autoInit, 200);
  }
})();
