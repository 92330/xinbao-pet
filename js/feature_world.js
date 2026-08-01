/**
 * 欣宝小宠 - 扩展功能模块 (feature_world)
 * 包含5个功能：宠物花园 / 世界探索 / 故事书工坊 / 樱花树计划 / 云朵收集家
 * 用 IIFE 包裹，末尾暴露 window.FeatureWorldInit 等全局函数
 * 所有新增状态统一存于 S.featureWorld
 *
 * 依赖（在 app.js 中已定义，可直接调用）：
 *   S / D / Storage / currentPage / $ / $$ / toast / showModal / closeModal
 *   openFullscreen / closeFullscreen / addCoin / spendCoin / getActivePet
 *   addIntimacy / gainExp / Sound / switchPage
 */
(function () {
  'use strict';

  // ============ 动态注入样式表（不修改 index.html） ============
  try {
    const _link = document.createElement('link');
    _link.rel = 'stylesheet';
    _link.href = 'css/feature_world.css';
    document.head.appendChild(_link);
  } catch (e) { /* ignore */ }

  // ============ 静态数据 ============

  // 世界探索：10个国家/地区
  const WORLD_COUNTRIES = [
    { id: 'china',     name: '中国',     emoji: '🇨🇳', capital: '北京',     animal: '🐼大熊猫', food: '🥟饺子',     building: '🏰长城',         fact: '长城是世界上最长的墙，从东到西有上万公里！' },
    { id: 'japan',     name: '日本',     emoji: '🇯🇵', capital: '东京',     animal: '🐻小熊',   food: '🍣寿司',     building: '⛩️鸟居',         fact: '富士山是日本最高的山，山顶常年覆盖着白雪。' },
    { id: 'france',    name: '法国',     emoji: '🇫🇷', capital: '巴黎',     animal: '🐓高卢鸡', food: '🥐牛角包',   building: '🗼埃菲尔铁塔',   fact: '埃菲尔铁塔高324米，是用铁建成的哦。' },
    { id: 'egypt',     name: '埃及',     emoji: '🇪🇬', capital: '开罗',     animal: '🐫骆驼',   food: '🫓面饼',     building: '🏔️金字塔',       fact: '金字塔是几千年前国王的陵墓，非常巨大。' },
    { id: 'brazil',    name: '巴西',     emoji: '🇧🇷', capital: '巴西利亚', animal: '🦜鹦鹉',   food: '🍖烤肉',     building: '⛪救世基督像',   fact: '亚马逊雨林在巴西，是地球上最大的森林。' },
    { id: 'australia', name: '澳大利亚', emoji: '🇦🇺', capital: '堪培拉',   animal: '🦘袋鼠',   food: '🥧肉派',     building: '🏛️悉尼歌剧院',   fact: '袋鼠妈妈有个大口袋，里面装着小袋鼠宝宝。' },
    { id: 'usa',       name: '美国',     emoji: '🇺🇸', capital: '华盛顿',   animal: '🦅白头鹰', food: '🍔汉堡',     building: '🗽自由女神像',   fact: '自由女神像是法国送给美国的礼物。' },
    { id: 'india',     name: '印度',     emoji: '🇮🇳', capital: '新德里',   animal: '🐘大象',   food: '🍛咖喱',     building: '🕌泰姬陵',       fact: '泰姬陵是用白色大理石建成的，非常美丽。' },
    { id: 'uk',        name: '英国',     emoji: '🇬🇧', capital: '伦敦',     animal: '🦊红狐',   food: '🍵下午茶',   building: '🎡大本钟',       fact: '大本钟是伦敦最大的钟，每小时都会报时。' },
    { id: 'russia',    name: '俄罗斯',   emoji: '🇷🇺', capital: '莫斯科',   animal: '🐻棕熊',   food: '🥟饺子',     building: '🏰克里姆林宫',   fact: '俄罗斯是世界上面积最大的国家。' }
  ];

  // 花园种子配置
  const GARDEN_SEEDS = [
    { id: 'flower',    name: '花种',   price: 10, harvestEmoji: '🌸', harvestName: '鲜花(心情+15)' },
    { id: 'vegetable', name: '蔬菜种', price: 15, harvestEmoji: '🥬', harvestName: '蔬菜(饱腹食物)' },
    { id: 'fruit',     name: '果树种', price: 30, harvestEmoji: '🍎', harvestName: '果子(金币+30)' }
  ];
  const GARDEN_PLOT_COUNT = 9;

  // 故事书场景
  const STORY_SCENES = [
    { id: 'home',   name: '家园', emoji: '🏡' },
    { id: 'forest', name: '森林', emoji: '🌲' },
    { id: 'star',   name: '星空', emoji: '✨' }
  ];

  // 云朵类型
  const CLOUD_TYPES = [
    { id: 'heart',  emoji: '💕', name: '心形云' },
    { id: 'bone',   emoji: '🦴', name: '骨头云' },
    { id: 'fish',   emoji: '🐟', name: '鱼形云' },
    { id: 'star',   emoji: '⭐', name: '星形云' },
    { id: 'flower', emoji: '🌸', name: '花形云' }
  ];

  // 临时状态
  let cloudTimer = null;       // 云朵生成定时器
  let storyDraft = { petId: null, scene: 'home' }; // 故事创作草稿

  // ============ 工具函数 ============
  function escapeHTML(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function isSpringSeason() {
    const m = new Date().getMonth() + 1;
    return m === 3 || m === 4;
  }

  // ============ 状态初始化 ============
  function ensureState() {
    if (!S.featureWorld) S.featureWorld = {};
    const fw = S.featureWorld;

    // 花园
    if (!fw.garden) fw.garden = { plots: [] };
    if (!Array.isArray(fw.garden.plots)) fw.garden.plots = [];
    while (fw.garden.plots.length < GARDEN_PLOT_COUNT) {
      const i = fw.garden.plots.length;
      fw.garden.plots.push({ id: 'plot_' + i, type: null, plantedDate: null, wateredDates: [], mature: false, harvested: false });
    }

    // 世界探索
    if (!fw.worldExplore) fw.worldExplore = { unlocked: ['china'], learnedCount: 0 };
    if (!Array.isArray(fw.worldExplore.unlocked)) fw.worldExplore.unlocked = ['china'];
    if (typeof fw.worldExplore.learnedCount !== 'number') fw.worldExplore.learnedCount = 0;

    // 故事书
    if (!Array.isArray(fw.storybooks)) fw.storybooks = [];

    // 樱花树
    if (!fw.cherryTree) fw.cherryTree = { blooms: 0, events: [] };
    if (!Array.isArray(fw.cherryTree.events)) fw.cherryTree.events = [];
    if (typeof fw.cherryTree.blooms !== 'number') fw.cherryTree.blooms = 0;

    // 云朵收集
    if (!fw.cloudCollect) fw.cloudCollect = { collected: {}, totalCollect: 0, claimedDoll: false };
    if (!fw.cloudCollect.collected) fw.cloudCollect.collected = {};
    CLOUD_TYPES.forEach(function (t) {
      if (typeof fw.cloudCollect.collected[t.id] !== 'number') fw.cloudCollect.collected[t.id] = 0;
    });
    if (typeof fw.cloudCollect.totalCollect !== 'number') fw.cloudCollect.totalCollect = 0;
    if (typeof fw.cloudCollect.claimedDoll !== 'boolean') fw.cloudCollect.claimedDoll = false;

    Storage.save();
  }

  // ============ DOM 注入（移至"更多"页，避免主页home-func拥挤） ============
  function FW_addMoreCard(id, icon, name, desc, onclickFn) {
    const page = document.getElementById('page-more');
    const grid = page ? page.querySelector('.more-grid') : null;
    if (!grid) return;
    if (document.getElementById(id)) return;
    const el = document.createElement('div');
    el.id = id;
    el.className = 'more-card';
    el.onclick = onclickFn;
    el.innerHTML =
      '<div class="more-card-icon">' + icon + '</div>' +
      '<div class="more-card-name">' + name + '</div>' +
      '<div class="more-card-desc">' + desc + '</div>';
    grid.appendChild(el);
  }

  function injectHomeButtons() {
    FW_addMoreCard('fwGardenCard', '🌷', '宠物花园', '种花养草，吸引蝴蝶来访',
      function () { FWopenGarden(); });
    FW_addMoreCard('fwWorldCard', '🌍', '世界探索', '环游10个国家，学习世界知识',
      function () { FWopenWorld(); });
  }

  function injectCherryTree() {
    const scene = document.getElementById('homeScene');
    if (!scene) return;
    if (document.getElementById('fwCherryTree')) return;
    const t = document.createElement('div');
    t.id = 'fwCherryTree';
    t.className = 'fw-cherry-tree';
    t.innerHTML = '<span class="fw-cherry-tree-icon">🌳</span>' +
      '<span class="fw-cherry-badge" id="fwCherryBadge" style="display:none">0</span>';
    t.addEventListener('click', FWopenCherry);
    scene.appendChild(t);
  }

  function injectCloudCollector() {
    const scene = document.getElementById('homeScene');
    if (!scene) return;
    if (document.getElementById('fwCloudBookBtn')) return;
    const b = document.createElement('div');
    b.id = 'fwCloudBookBtn';
    b.className = 'fw-cloud-book-btn';
    b.innerHTML = '<span>☁️</span><span id="fwCloudCount">0</span>';
    b.addEventListener('click', FWopenCloudBook);
    scene.appendChild(b);
  }

  function injectStorybookTab() {
    const tabs = document.getElementById('albumTabs');
    if (!tabs) return;
    if (document.getElementById('fwStorybookTab')) return;

    const btn = document.createElement('button');
    btn.id = 'fwStorybookTab';
    btn.className = 'album-tab';
    btn.dataset.tab = 'storybook';
    btn.textContent = '📖故事书';
    tabs.appendChild(btn);

    // 注入独立内容区，紧跟在 albumContent 之后
    const ac = document.getElementById('albumContent');
    const content = document.createElement('div');
    content.id = 'fwStorybookContent';
    content.className = 'album-content hidden';
    if (ac && ac.parentNode) {
      ac.parentNode.insertBefore(content, ac.nextSibling);
    }

    // 自己管理 tab 激活状态
    btn.addEventListener('click', FWopenStorybookTab);
    // 已有 tab 点击时，隐藏故事书内容、显示原内容
    document.querySelectorAll('#albumTabs .album-tab').forEach(function (t) {
      if (t.dataset.tab !== 'storybook') {
        t.addEventListener('click', function () {
          const fw2 = document.getElementById('fwStorybookContent');
          const ac2 = document.getElementById('albumContent');
          if (fw2) fw2.classList.add('hidden');
          if (ac2) ac2.classList.remove('hidden');
        });
      }
    });
  }

  // ============ 功能1：宠物花园 ============
  function FWopenGarden() {
    Sound.play('click');
    renderGardenFS();
  }

  function renderGardenFS() {
    const plots = S.featureWorld.garden.plots;
    const today = Storage.todayStr();
    const plotsHTML = plots.map(function (p, i) {
      return renderPlot(p, i, today);
    }).join('');

    openFullscreen(
      '<div class="fs-header">' +
        '<button class="fs-back" onclick="closeFullscreen()">← 返回家园</button>' +
        '<div class="fs-title">🌷 宠物花园</div>' +
        '<div style="width:60px"></div>' +
      '</div>' +
      '<div class="fs-body">' +
        '<div style="padding:10px 14px;font-size:12px;color:#5a6a7c;background:#EAF6FF">' +
          '🌱 种下种子，每天浇水一次，3天后就能成熟收获啦~' +
        '</div>' +
        '<div class="fw-garden-grid">' + plotsHTML + '</div>' +
      '</div>'
    );
  }

  function renderPlot(p, i, today) {
    if (!p.type) {
      return '<div class="fw-garden-plot empty" onclick="FWplantMenu(' + i + ')">' +
        '<div class="fw-plot-emoji">🟫</div>' +
        '<div class="fw-plot-label">空地<br><small>点击种植</small></div>' +
      '</div>';
    }
    const seed = GARDEN_SEEDS.find(function (s) { return s.id === p.type; });
    const stage = p.wateredDates.length;
    const mature = stage >= 3;
    const wateredToday = p.wateredDates.indexOf(today) >= 0;

    let emoji = '🌱';
    if (p.type === 'flower') {
      emoji = mature ? '🌸' : (stage >= 2 ? '🌷' : (stage >= 1 ? '🌿' : '🌱'));
    } else if (p.type === 'vegetable') {
      emoji = mature ? '🥬' : (stage >= 2 ? '🌾' : (stage >= 1 ? '🌿' : '🌱'));
    } else {
      emoji = mature ? '🍎' : (stage >= 2 ? '🌳' : (stage >= 1 ? '🌿' : '🌱'));
    }

    let btn;
    if (mature) {
      btn = '<button class="fw-plot-btn harvest" onclick="FWharvest(' + i + ')">🎁收获</button>';
    } else if (wateredToday) {
      btn = '<button class="fw-plot-btn" disabled>已浇水</button>';
    } else {
      btn = '<button class="fw-plot-btn water" onclick="FWwater(' + i + ')">💧浇水</button>';
    }

    return '<div class="fw-garden-plot ' + (mature ? 'mature' : '') + '">' +
      '<div class="fw-plot-emoji">' + emoji + '</div>' +
      '<div class="fw-plot-label">' + seed.name + '<br><small>' +
        (mature ? '已成熟!' : (stage + '/3 浇水')) + '</small></div>' +
      '<div class="fw-plot-actions">' + btn + '</div>' +
    '</div>';
  }

  function FWplantMenu(idx) {
    Sound.play('click');
    const cards = GARDEN_SEEDS.map(function (s) {
      return '<div class="fw-seed-card" onclick="FWplant(' + idx + ',\'' + s.id + '\')">' +
        '<div style="font-size:32px">' + s.harvestEmoji + '</div>' +
        '<div style="font-size:13px;font-weight:bold;margin-top:4px">' + s.name + '</div>' +
        '<div style="font-size:11px;color:#8aa5b8;margin-top:2px">' + s.harvestName + '</div>' +
        '<div style="font-size:13px;color:#FF9800;font-weight:bold;margin-top:4px">🪙 ' + s.price + '</div>' +
      '</div>';
    }).join('');
    showModal('🌱 选择种子',
      '<div class="fw-seed-menu">' + cards + '</div>' +
      '<div style="font-size:11px;color:#8aa5b8;text-align:center;margin-top:6px">花→心情+15 · 蔬菜→饱腹食物 · 果树→金币+30</div>',
      '<button class="btn-cancel" onclick="closeModal()">取消</button>');
  }

  function FWplant(idx, seedId) {
    const seed = GARDEN_SEEDS.find(function (s) { return s.id === seedId; });
    if (!seed) return;
    if (!spendCoin(seed.price)) { closeModal(); return; }
    const p = S.featureWorld.garden.plots[idx];
    p.type = seedId;
    p.plantedDate = Storage.todayStr();
    p.wateredDates = [];
    p.mature = false;
    p.harvested = false;
    Storage.save();
    Sound.play('buy');
    closeModal();
    toast('🌱 种下了' + seed.name + '！');
    renderGardenFS();
  }

  function FWwater(idx) {
    const p = S.featureWorld.garden.plots[idx];
    if (!p.type) return;
    const today = Storage.todayStr();
    if (p.wateredDates.indexOf(today) >= 0) {
      toast('今天已经浇过水啦~');
      Sound.play('error');
      return;
    }
    p.wateredDates.push(today);
    if (p.wateredDates.length >= 3) p.mature = true;
    Storage.save();
    Sound.play('success');
    toast('💧 浇水成功，小芽在长高~');
    renderGardenFS();
  }

  function FWharvest(idx) {
    const p = S.featureWorld.garden.plots[idx];
    if (!p.type || p.wateredDates.length < 3) {
      toast('还没成熟哦~');
      return;
    }
    const pet = getActivePet();
    if (p.type === 'flower') {
      pet.mood = Math.min(100, (pet.mood || 0) + 15);
      gainExp(pet, 5);
      toast('🌸 花开了！心情+15');
    } else if (p.type === 'vegetable') {
      S.inventory['vegetable'] = (S.inventory['vegetable'] || 0) + 1;
      toast('🥬 收获蔬菜×1，已存入背包！');
    } else if (p.type === 'fruit') {
      addCoin(30);
      toast('🍎 果树结果！金币+30');
    }
    Sound.play('coin');
    // 收获后重置为空地，可再次种植
    p.type = null;
    p.plantedDate = null;
    p.wateredDates = [];
    p.mature = false;
    p.harvested = true;
    Storage.save();
    renderGardenFS();
  }

  // ============ 功能2：世界探索 ============
  function refreshWorldUnlock() {
    const we = S.featureWorld.worldExplore;
    if (typeof we.lastWeekTasks !== 'number') we.lastWeekTasks = S.stats.weekTasks || 0;
    const cur = S.stats.weekTasks || 0;
    const delta = cur - we.lastWeekTasks;
    if (delta > 0) we.learnedCount += delta;
    we.lastWeekTasks = cur;
    const unlockCount = Math.min(WORLD_COUNTRIES.length, 1 + Math.floor(we.learnedCount / 5));
    we.unlocked = WORLD_COUNTRIES.slice(0, unlockCount).map(function (c) { return c.id; });
    Storage.save();
  }

  function FWopenWorld() {
    Sound.play('click');
    refreshWorldUnlock();
    const we = S.featureWorld.worldExplore;

    const cards = WORLD_COUNTRIES.map(function (c) {
      const unlocked = we.unlocked.indexOf(c.id) >= 0;
      return '<div class="fw-world-card ' + (unlocked ? 'unlocked' : 'locked') + '" ' +
        (unlocked ? 'onclick="FWshowCountry(\'' + c.id + '\')"' : '') + '>' +
        '<div class="fw-world-flag">' + (unlocked ? c.emoji : '🔒') + '</div>' +
        '<div class="fw-world-name">' + (unlocked ? c.name : '???') + '</div>' +
        (unlocked ? '' : '<div class="fw-world-tip">完成更多任务解锁</div>') +
      '</div>';
    }).join('');

    let tip;
    if (we.unlocked.length < WORLD_COUNTRIES.length) {
      const remain = 5 - (we.learnedCount % 5);
      tip = '已解锁 ' + we.unlocked.length + '/' + WORLD_COUNTRIES.length +
        ' · 再完成 ' + remain + ' 个任务解锁下一个';
    } else {
      tip = '🎉 已解锁全部 ' + WORLD_COUNTRIES.length + ' 个国家！';
    }

    openFullscreen(
      '<div class="fs-header">' +
        '<button class="fs-back" onclick="closeFullscreen()">← 返回家园</button>' +
        '<div class="fs-title">🌍 世界探索</div>' +
        '<div style="width:60px"></div>' +
      '</div>' +
      '<div class="fs-body">' +
        '<div style="padding:10px 14px;font-size:12px;color:#5a6a7c;background:#EAF6FF">' + tip + '</div>' +
        '<div class="fw-world-grid">' + cards + '</div>' +
      '</div>'
    );
  }

  function FWshowCountry(id) {
    const c = WORLD_COUNTRIES.find(function (x) { return x.id === id; });
    if (!c) return;
    Sound.play('success');
    showModal(c.emoji + ' ' + c.name,
      '<div class="fw-country-detail">' +
        '<div class="fw-country-flag">' + c.emoji + '</div>' +
        '<div class="fw-country-name">' + c.name + '</div>' +
        '<div class="fw-country-row">🏛️ 首都：<b>' + c.capital + '</b></div>' +
        '<div class="fw-country-row">🐾 代表动物：' + c.animal + '</div>' +
        '<div class="fw-country-row">🍽️ 特色美食：' + c.food + '</div>' +
        '<div class="fw-country-row">🏯 标志建筑：' + c.building + '</div>' +
        '<div class="fw-country-fact">💡 小知识：' + c.fact + '</div>' +
      '</div>',
      '<button class="btn-primary" onclick="closeModal()">知道了</button>');
  }

  // ============ 功能3：故事书工坊 ============
  function FWopenStorybookTab() {
    document.querySelectorAll('#albumTabs .album-tab').forEach(function (x) {
      x.classList.remove('active');
    });
    const tab = document.getElementById('fwStorybookTab');
    if (tab) tab.classList.add('active');
    const ac = document.getElementById('albumContent');
    const fc = document.getElementById('fwStorybookContent');
    if (ac) ac.classList.add('hidden');
    if (fc) fc.classList.remove('hidden');
    renderStorybookList();
    Sound.play('click');
  }

  function renderStorybookList() {
    const c = document.getElementById('fwStorybookContent');
    if (!c) return;
    const books = S.featureWorld.storybooks;
    let html = '<button class="add-btn" onclick="FWnewStory()">📖 创作新故事</button>';
    if (!books.length) {
      html += '<div class="fw-story-empty">📖 还没有故事书<br>点击上方按钮，和宠物一起创作绘本吧~</div>';
    } else {
      html += '<div class="fw-storybook-list">';
      books.slice().reverse().forEach(function (b) {
        html += '<div class="fw-storybook-cover fw-scene-' + b.scene + '" onclick="FWviewStory(\'' + b.id + '\')">' +
          '<span class="fw-storybook-del" onclick="event.stopPropagation();FWdeleteStory(\'' + b.id + '\')">🗑️</span>' +
          '<div class="fw-storybook-cover-emoji">' + b.petEmoji + '</div>' +
          '<div class="fw-storybook-cover-title">' + escapeHTML(b.title) + '</div>' +
        '</div>';
      });
      html += '</div>';
    }
    c.innerHTML = html;
  }

  function FWnewStory() {
    const pet = getActivePet();
    storyDraft = { petId: pet.id, scene: 'home' };

    const petChips = S.pets.map(function (p) {
      const def = D.PET_DEFS[p.defId];
      return '<div class="fw-scene-btn ' + (p.id === pet.id ? 'active' : '') + '" data-pid="' + p.id + '" ' +
        'onclick="FWselectPet(\'' + p.id + '\')">' + def.emoji + ' ' + escapeHTML(p.name) + '</div>';
    }).join('');

    const sceneChips = STORY_SCENES.map(function (s) {
      return '<div class="fw-scene-btn ' + (s.id === 'home' ? 'active' : '') + '" data-sid="' + s.id + '" ' +
        'onclick="FWselectScene(\'' + s.id + '\')">' + s.emoji + ' ' + s.name + '</div>';
    }).join('');

    showModal('📖 创作新故事',
      '<div style="font-size:13px;color:#5a6a7c;margin:6px 0 4px;font-weight:bold">① 选择主角</div>' +
      '<div id="fwPetChips" style="display:flex;gap:6px;flex-wrap:wrap">' + petChips + '</div>' +
      '<div style="font-size:13px;color:#5a6a7c;margin:12px 0 4px;font-weight:bold">② 选择场景</div>' +
      '<div id="fwSceneChips" style="display:flex;gap:6px">' + sceneChips + '</div>' +
      '<div style="font-size:13px;color:#5a6a7c;margin:12px 0 4px;font-weight:bold">③ 故事标题</div>' +
      '<input id="fwStoryTitle" class="fw-input" placeholder="给故事起个名字（可空）">' +
      '<div style="font-size:13px;color:#5a6a7c;margin:6px 0 4px;font-weight:bold">④ 故事内容</div>' +
      '<textarea id="fwStoryContent" class="fw-textarea" placeholder="写下你的小故事吧..."></textarea>',
      '<button class="btn-cancel" onclick="closeModal()">取消</button>' +
      '<button class="btn-primary" onclick="FWcreateStory()">生成绘本</button>');
  }

  function FWselectPet(id) {
    storyDraft.petId = id;
    document.querySelectorAll('#fwPetChips .fw-scene-btn').forEach(function (c) {
      c.classList.toggle('active', c.dataset.pid === id);
    });
    Sound.play('click');
  }

  function FWselectScene(id) {
    storyDraft.scene = id;
    document.querySelectorAll('#fwSceneChips .fw-scene-btn').forEach(function (c) {
      c.classList.toggle('active', c.dataset.sid === id);
    });
    Sound.play('click');
  }

  function FWcreateStory() {
    const pet = S.pets.find(function (p) { return p.id === storyDraft.petId; }) || getActivePet();
    const def = D.PET_DEFS[pet.defId];
    const titleInput = document.getElementById('fwStoryTitle');
    const contentInput = document.getElementById('fwStoryContent');
    let title = titleInput ? (titleInput.value || '').trim() : '';
    const content = contentInput ? (contentInput.value || '').trim() : '';

    if (!content) {
      toast('请写下故事内容~');
      Sound.play('error');
      return;
    }
    if (!title) {
      const sceneName = (STORY_SCENES.find(function (s) { return s.id === storyDraft.scene; }) || {}).name || '冒险';
      title = pet.name + '的' + sceneName + '冒险';
    }

    const book = {
      id: 'story_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      petName: pet.name,
      petEmoji: def.emoji,
      scene: storyDraft.scene,
      title: title,
      content: content,
      createdDate: Date.now()
    };
    S.featureWorld.storybooks.push(book);
    Storage.save();
    Sound.play('success');
    closeModal();
    renderStorybookList();
    toast('📖 故事书已保存到相册！');
  }

  function FWviewStory(id) {
    const b = S.featureWorld.storybooks.find(function (x) { return x.id === id; });
    if (!b) return;
    Sound.play('click');
    openFullscreen(
      '<div class="fs-header">' +
        '<button class="fs-back" onclick="closeFullscreen()">← 返回</button>' +
        '<div class="fs-title">📖 ' + escapeHTML(b.title) + '</div>' +
        '<div style="width:60px"></div>' +
      '</div>' +
      '<div class="fw-book-view fw-scene-' + b.scene + '">' +
        '<div class="fw-book-title">' + escapeHTML(b.title) + '</div>' +
        '<div class="fw-book-pet">' + b.petEmoji + '</div>' +
        '<div class="fw-book-content">' + escapeHTML(b.content) + '</div>' +
        '<div style="font-size:11px;color:' + (b.scene === 'star' ? 'rgba(255,255,255,0.85)' : '#6a7a8c') + ';margin-top:14px">' +
          '主角：' + escapeHTML(b.petName) + ' · ' + formatTime(b.createdDate) +
        '</div>' +
      '</div>'
    );
  }

  function FWdeleteStory(id) {
    showModal('删除故事书',
      '<div style="text-align:center;padding:14px;font-size:14px;color:#5a6a7c">确定要删除这本故事书吗？</div>',
      '<button class="btn-cancel" onclick="closeModal()">取消</button>' +
      '<button class="btn-danger" onclick="FWdoDeleteStory(\'' + id + '\')">删除</button>');
  }

  function FWdoDeleteStory(id) {
    S.featureWorld.storybooks = S.featureWorld.storybooks.filter(function (b) { return b.id !== id; });
    Storage.save();
    closeModal();
    renderStorybookList();
    toast('已删除');
    Sound.play('click');
  }

  // ============ 功能4：樱花树计划 ============
  function updateCherryTree() {
    const tree = document.getElementById('fwCherryTree');
    const badge = document.getElementById('fwCherryBadge');
    if (!tree) return;
    const ct = S.featureWorld.cherryTree;
    if (badge) {
      badge.textContent = ct.blooms;
      badge.style.display = ct.blooms > 0 ? 'flex' : 'none';
    }
    const spring = isSpringSeason();
    tree.classList.toggle('spring', spring);
    const icon = tree.querySelector('.fw-cherry-tree-icon');
    if (icon) icon.textContent = spring ? '🌸' : '🌳';
  }

  function FWopenCherry() {
    Sound.play('click');
    const ct = S.featureWorld.cherryTree;
    const spring = isSpringSeason();

    let listHTML;
    if (ct.events.length) {
      listHTML = ct.events.slice().reverse().map(function (e) {
        return '<div class="fw-event-item">' +
          '<span>🌸 ' + escapeHTML(e.text) + '</span>' +
          '<span style="font-size:11px;color:#9aa5b8;flex-shrink:0">' + escapeHTML(e.date) + '</span>' +
        '</div>';
      }).join('');
    } else {
      listHTML = '<div style="text-align:center;color:#8aa5b8;padding:14px;font-size:13px">还没有记录成长事件~</div>';
    }

    showModal('🌸 樱花树计划',
      '<div style="text-align:center;margin-bottom:10px">' +
        '<div style="font-size:56px">' + (spring ? '🌸' : '🌳') + '</div>' +
        '<div style="font-size:14px;color:#5a6a7c;margin-top:4px">已开放 ' + ct.blooms + ' 朵樱花' +
          (spring ? ' · 春天满树繁花 🌸' : '') + '</div>' +
      '</div>' +
      '<div style="font-size:13px;color:#5a6a7c;margin:6px 2px;font-weight:bold">记录一个成长事件，让樱花树多开一朵花</div>' +
      '<input id="fwCherryInput" class="fw-input" placeholder="例如：今天学会了自己整理书包">' +
      '<button class="fw-btn green" style="width:100%;margin-top:6px" onclick="FWaddCherryEvent()">🌸 记录并开花</button>' +
      '<div style="margin-top:12px;max-height:160px;overflow-y:auto">' + listHTML + '</div>',
      '<button class="btn-primary" onclick="closeModal()">关闭</button>');
  }

  function FWaddCherryEvent() {
    const input = document.getElementById('fwCherryInput');
    const v = input ? (input.value || '').trim() : '';
    if (!v) {
      toast('写点什么吧~');
      Sound.play('error');
      return;
    }
    const ct = S.featureWorld.cherryTree;
    ct.events.push({ text: v, date: Storage.todayStr() });
    ct.blooms += 1;
    Storage.save();
    Sound.play('success');
    closeModal();
    updateCherryTree();
    toast('🌸 樱花树开出一朵新花！');
    setTimeout(FWopenCherry, 220);
  }

  // ============ 功能5：云朵收集家 ============
  function updateCloudBadge() {
    const el = document.getElementById('fwCloudCount');
    if (el) el.textContent = S.featureWorld.cloudCollect.totalCollect;
  }

  function startCloudSpawner() {
    if (cloudTimer) clearTimeout(cloudTimer);
    // 首朵云稍快出现
    setTimeout(function () { if (currentPage === 'home') spawnCloud(); }, 4000);
    scheduleNextCloud();
  }

  function scheduleNextCloud() {
    const delay = 10000 + Math.random() * 5000; // 10-15秒
    cloudTimer = setTimeout(function () {
      if (currentPage === 'home') spawnCloud();
      scheduleNextCloud();
    }, delay);
  }

  function spawnCloud() {
    const scene = document.getElementById('homeScene');
    if (!scene) return;
    if (currentPage !== 'home') return;
    // 限制同屏云朵数量
    if (scene.querySelectorAll('.fw-cloud').length >= 3) return;

    const t = CLOUD_TYPES[Math.floor(Math.random() * CLOUD_TYPES.length)];
    const el = document.createElement('div');
    el.className = 'fw-cloud';
    el.textContent = t.emoji;
    el.dataset.type = t.id;
    el.style.top = (30 + Math.random() * 120) + 'px';
    el.style.animationDuration = (8 + Math.random() * 5) + 's';
    el.addEventListener('click', function () { collectCloud(el, t.id); });
    scene.appendChild(el);
    el.addEventListener('animationend', function () {
      if (el.parentNode) el.remove();
    });
  }

  function collectCloud(el, typeId) {
    if (el.dataset.collected) return;
    el.dataset.collected = '1';
    const cc = S.featureWorld.cloudCollect;
    cc.collected[typeId] = (cc.collected[typeId] || 0) + 1;
    cc.totalCollect += 1;
    Storage.save();
    Sound.play('success');
    const name = (CLOUD_TYPES.find(function (x) { return x.id === typeId; }) || {}).name || '云朵';
    toast('☁️ 收集到一朵' + name + '！');
    el.classList.add('caught');
    setTimeout(function () { if (el.parentNode) el.remove(); }, 300);
    updateCloudBadge();
  }

  function FWopenCloudBook() {
    Sound.play('click');
    const cc = S.featureWorld.cloudCollect;
    const canClaim = cc.totalCollect >= 10 && !cc.claimedDoll;

    const grid = CLOUD_TYPES.map(function (t) {
      const n = cc.collected[t.id] || 0;
      return '<div class="fw-cloud-card ' + (n > 0 ? '' : 'uncollected') + '">' +
        '<div class="fw-cloud-card-emoji">' + (n > 0 ? t.emoji : '❓') + '</div>' +
        '<div class="fw-cloud-card-name">' + (n > 0 ? t.name : '???') + '</div>' +
        '<div class="fw-cloud-card-count">×' + n + '</div>' +
      '</div>';
    }).join('');

    const progress = cc.claimedDoll
      ? '☀️ 已兑换晴天娃娃'
      : ('再收集 ' + Math.max(0, 10 - cc.totalCollect) + ' 朵可兑换晴天娃娃');

    let footer;
    if (cc.claimedDoll) {
      footer = '<button class="btn-primary" onclick="closeModal()">关闭</button>';
    } else if (canClaim) {
      footer = '<button class="btn-cancel" onclick="closeModal()">关闭</button>' +
        '<button class="btn-success" onclick="FWclaimDoll()">☀️ 兑换晴天娃娃</button>';
    } else {
      footer = '<button class="btn-primary" onclick="closeModal()">关闭</button>';
    }

    showModal('☁️ 云朵图鉴',
      '<div style="text-align:center;font-size:13px;color:#5a6a7c;margin-bottom:6px">已收集 ' +
        cc.totalCollect + ' 朵云 · ' + progress + '</div>' +
      '<div class="fw-cloud-book-grid">' + grid + '</div>' +
      '<div style="text-align:center;font-size:12px;color:#8aa5b8;margin-top:6px">点击主页飘过的云朵就能收集啦~</div>',
      footer);
  }

  function FWclaimDoll() {
    const cc = S.featureWorld.cloudCollect;
    if (cc.totalCollect < 10 || cc.claimedDoll) return;
    cc.claimedDoll = true;
    Storage.save();
    addCoin(50);
    Sound.play('levelup');
    closeModal();
    toast('☀️ 兑换成功！获得晴天娃娃 +50 金币！');
  }

  // ============ 总入口 ============
  function FeatureWorldInit() {
    // S 由 app.js 初始化，未就绪则跳过（安全保护）
    if (!S) return;
    ensureState();
    injectHomeButtons();
    injectCherryTree();
    injectCloudCollector();
    injectStorybookTab();
    refreshWorldUnlock();
    updateCherryTree();
    updateCloudBadge();
    startCloudSpawner();
    // 监听更多页重渲染，重新注入卡片
    window.addEventListener('morepage:rendered', function () { injectHomeButtons(); });
  }

  // ============ 暴露全局函数（供 onclick 调用） ============
  window.FeatureWorldInit = FeatureWorldInit;
  window.FWopenGarden = FWopenGarden;
  window.FWplantMenu = FWplantMenu;
  window.FWplant = FWplant;
  window.FWwater = FWwater;
  window.FWharvest = FWharvest;
  window.FWopenWorld = FWopenWorld;
  window.FWshowCountry = FWshowCountry;
  window.FWopenStorybookTab = FWopenStorybookTab;
  window.FWnewStory = FWnewStory;
  window.FWselectPet = FWselectPet;
  window.FWselectScene = FWselectScene;
  window.FWcreateStory = FWcreateStory;
  window.FWviewStory = FWviewStory;
  window.FWdeleteStory = FWdeleteStory;
  window.FWdoDeleteStory = FWdoDeleteStory;
  window.FWopenCherry = FWopenCherry;
  window.FWaddCherryEvent = FWaddCherryEvent;
  window.FWopenCloudBook = FWopenCloudBook;
  window.FWclaimDoll = FWclaimDoll;

  // ============ 启动：在 app.js 的 init() 之后执行 ============
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { FeatureWorldInit(); });
  } else {
    FeatureWorldInit();
  }
})();
