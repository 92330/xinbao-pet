/**
 * 欣宝小宠 - 行为惯性 & 习惯养成模块 (feature_habit)
 * 包含5大功能：
 *   1. 🔥 连续日火苗系统   2. 🏅 微成就今日份   3. 📊 行为周报
 *   4. ⏰ 再待一会儿       5. 📈 习惯成就 + 🎯 每日目标
 *
 * 仅创建新文件，不修改任何现有文件。
 * 用 IIFE 包裹，所有新增状态统一存于 S.featureHabit。
 * 所有样式类前缀 fh-，定义于 css/feature_habit.css（动态注入）。
 *
 * 设计原则：正向激励为主，断签/未完成不惩罚。
 */
(function () {
  'use strict';

  if (window.__featureHabitLoaded) return;
  window.__featureHabitLoaded = true;

  // 动态注入样式
  try {
    var _link = document.createElement('link');
    _link.rel = 'stylesheet';
    _link.href = 'css/feature_habit.css';
    document.head.appendChild(_link);
  } catch (e) {}

  var _inited = false;

  // ============ 工具 ============
  function escapeHTML(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function saveFH() { try { Storage.save(); } catch (e) {} }
  function todayStr() { try { return Storage.todayStr(); } catch (e) {
    var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }}
  function yesterdayStr() {
    var d = new Date(); d.setDate(d.getDate() - 1);
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function petName() {
    try { var p = getActivePet(); return p ? p.name : '小宠'; } catch (e) { return '小宠'; }
  }

  // ============ 状态初始化（幂等） ============
  function ensureState() {
    if (!S.featureHabit) S.featureHabit = {};
    var h = S.featureHabit;

    // 火苗系统
    if (typeof h.consecutiveDays !== 'number') h.consecutiveDays = 0;
    if (typeof h.maxConsecutiveDays !== 'number') h.maxConsecutiveDays = 0;
    if (typeof h.shieldUsed !== 'boolean') h.shieldUsed = false;
    if (h.lastCheckDate !== todayStr()) h.lastCheckDate = todayStr();

    // 微成就
    if (!h.dailyMissions) h.dailyMissions = [];
    if (h.missionDate !== todayStr()) h.dailyMissions = [];
    if (typeof h.flowerStickers !== 'number') h.flowerStickers = 0;
    if (h.lastFlowerDate !== todayStr()) h.lastFlowerDate = h.lastFlowerDate || '';

    // 行为周报数据采集（本周累计）
    if (!h.weekStats) h.weekStats = { weekStart: '', learning: 0, gaming: 0, caring: 0, creating: 0, exploring: 0 };
    if (!h.historyWeeklyStats) h.historyWeeklyStats = [];

    // 再待一会儿
    if (h.stayDate !== todayStr()) h.stayCountToday = 0;
    if (typeof h.stayCountToday !== 'number') h.stayCountToday = 0;

    // 每日目标
    if (!h.dailyGoal) h.dailyGoal = { date: '', text: '', completed: false, presetIdx: 0 };

    // 习惯成就追踪（连续完成天数）
    if (!h.habitTrack) h.habitTrack = { taskStreak: 0, careStreak: 0, lastTaskDate: '', lastCareDate: '', careCountToday: 0, careCountDate: '' };

    // 已发放的里程碑奖励（防止重复）
    if (!h.claimedMilestones) h.claimedMilestones = [];

    saveFH();
  }

  // ============ 功能1：🔥 连续日火苗系统 ============

  // 每日首次进入检查（由初始化调用）
  function checkDailyLogin() {
    var h = S.featureHabit;
    var today = todayStr();
    if (h._lastLoginCheck === today) return; // 今日已检查
    h._lastLoginCheck = today;

    var yStr = yesterdayStr();
    if (h.lastFireDate === yStr) {
      // 连续
      h.consecutiveDays += 1;
    } else if (h.lastFireDate === today) {
      // 今天已签到过（理论上不会到这里，但兜底）
    } else {
      // 断签
      if (!h.shieldUsed) {
        // 使用保护机会：保留当前天数+1（视为昨天来了）
        h.shieldUsed = true;
        h.consecutiveDays = (h.consecutiveDays || 0) + 1;
        setTimeout(function () {
          showModal('🛡️ 保护机会已用', 
            '<div style="text-align:center;padding:14px;font-size:14px;line-height:1.8;color:#5a6a7c">' +
              '<div style="font-size:48px;margin-bottom:8px">🛡️</div>' +
              '<p style="margin-bottom:6px">小欣帮你守住了一天！明天不要忘记来看我哦～</p>' +
              '<p style="font-size:12px;color:#8aa5b8">保护机会已用完，再断签天数会归零，但小欣不会生气哦~</p>' +
            '</div>',
            '<button class="btn-primary" onclick="closeModal()">知道啦</button>');
        }, 800);
      } else {
        // 保护已用，归零重新开始 + 鼓励
        h.consecutiveDays = 1;
        var encourage = [
          '从零开始，每一步都是新的冒险！',
          '昨天的没关系的，今天的你依然是最棒的！',
          '小欣永远不会生你的气，我们继续加油！',
          '每一段伟大的旅程，都始于重新出发。'
        ];
        var word = encourage[Math.floor(Math.random() * encourage.length)];
        setTimeout(function () {
          showModal('😊 重新出发',
            '<div style="text-align:center;padding:14px;font-size:14px;line-height:1.8;color:#5a6a7c">' +
              '<div style="font-size:48px;margin-bottom:8px">🌱</div>' +
              '<p style="margin-bottom:8px">' + escapeHTML(word) + '</p>' +
              '<div style="background:#E8F5E9;padding:8px 10px;border-radius:8px;font-size:13px;color:#2E7D32">🎁 重新出发礼包：20金币 + 心情恢复10点</div>' +
            '</div>',
            '<button class="btn-primary" onclick="closeModal()">谢谢小欣</button>');
          try { addCoin(20); Sound.play('coin'); } catch (e) {}
          try { var p = getActivePet(); if (p) { p.mood = Math.min(100, (p.mood||0) + 10); Storage.save(); } } catch (e) {}
        }, 800);
      }
    }
    h.lastFireDate = today;
    if (h.consecutiveDays > (h.maxConsecutiveDays || 0)) h.maxConsecutiveDays = h.consecutiveDays;
    saveFH();

    // 火苗激励反馈
    showFireReward(h.consecutiveDays);
    // 检查习惯成就
    checkHabitAchievements();
  }

  function showFireReward(days) {
    if (days === 1) {
      setTimeout(function () {
        toast('🔥 连续陪伴 ' + petName() + ' ' + days + ' 天啦！');
      }, 1200);
    } else if (days === 7) {
      setTimeout(function () {
        showModal('🎉 坚持一周啦！',
          '<div style="text-align:center;padding:14px;font-size:14px;line-height:1.8;color:#5a6a7c">' +
            '<div style="font-size:48px;margin-bottom:8px">🔥🔥</div>' +
            '<p style="margin-bottom:8px">' + petName() + '好感动！你坚持了一周！</p>' +
            '<div style="color:#FF9800;font-size:18px;font-weight:bold">+50 金币</div>' +
          '</div>',
          '<button class="btn-primary" onclick="closeModal()">领取</button>');
        try { addCoin(50); Sound.play('levelup'); spawnPetals(20); } catch (e) {}
      }, 1200);
    } else if (days === 30) {
      setTimeout(function () {
        showModal('🌟 坚持之星',
          '<div style="text-align:center;padding:14px;font-size:14px;line-height:1.8;color:#5a6a7c">' +
            '<div style="font-size:48px;margin-bottom:8px">🔥🔥🔥</div>' +
            '<p style="margin-bottom:8px">你是最棒的主人！' + petName() + '永远爱你！</p>' +
            '<div style="color:#FF9800;font-size:18px;font-weight:bold">+200 金币 + 限定勋章💪坚持之星</div>' +
          '</div>',
          '<button class="btn-primary" onclick="closeModal()">领取</button>');
        try { addCoin(200); Sound.play('levelup'); spawnPetals(60); } catch (e) {}
        try { if (S.badges && S.badges.indexOf('persist_star') < 0) { S.badges.push('persist_star'); Storage.save(); } } catch (e) {}
      }, 1200);
    } else if (days === 100) {
      setTimeout(function () {
        showModal('🏔️ 永恒星光',
          '<div style="text-align:center;padding:14px;font-size:14px;line-height:1.8;color:#5a6a7c">' +
            '<div style="font-size:48px;margin-bottom:8px">🌟</div>' +
            '<p style="margin-bottom:8px">100天！这是属于你和' + petName() + '的传奇~</p>' +
            '<div style="color:#FF9800;font-size:18px;font-weight:bold">+500 金币 + 限定背景🌟星光永恒</div>' +
          '</div>',
          '<button class="btn-primary" onclick="closeModal()">领取</button>');
        try { addCoin(500); Sound.play('levelup'); spawnPetals(100); } catch (e) {}
      }, 1200);
    } else if (days > 1) {
      setTimeout(function () {
        toast('🔥 已连续陪伴 ' + days + ' 天，加油！');
      }, 1200);
    }
  }

  // 火苗UI注入（主页顶部）
  function injectFireBadge() {
    var coinBox = document.querySelector('.coin-box');
    if (!coinBox) return;
    if (document.getElementById('fhFireBadge')) {
      updateFireBadge();
      return;
    }
    var el = document.createElement('div');
    el.id = 'fhFireBadge';
    el.className = 'fh-fire-badge';
    el.title = '连续陪伴天数';
    el.addEventListener('click', FHopenFirePanel);
    coinBox.parentNode.insertBefore(el, coinBox.nextSibling);
    updateFireBadge();
  }

  function updateFireBadge() {
    var el = document.getElementById('fhFireBadge');
    if (!el) return;
    var h = S.featureHabit;
    var days = h.consecutiveDays || 0;
    var cls = 'fh-fire-badge';
    var icon = '🔥';
    if (days >= 30) { cls += ' torch'; icon = '🔥🔥🔥'; }
    else if (days >= 7) { cls += ' flame'; icon = '🔥🔥'; }
    else if (days >= 1) { cls += ' spark'; icon = '🔥'; }
    else { cls += ' off'; icon = '🌱'; }
    el.className = cls;
    el.innerHTML = '<span class="fh-fire-icon">' + icon + '</span>' +
      '<span class="fh-fire-num">' + days + '</span>';
  }

  function FHopenFirePanel() {
    try { Sound.play('click'); } catch (e) {}
    var h = S.featureHabit;
    var days = h.consecutiveDays || 0;
    var max = h.maxConsecutiveDays || 0;
    var shieldText = h.shieldUsed ?
      '<span style="color:#999">🛡️ 保护机会已使用</span>' :
      '<span style="color:#4CAF50">🛡️ 保护机会可用（断签时自动生效）</span>';
    var nextReward = '';
    if (days < 7) nextReward = '再坚持 ' + (7 - days) + ' 天 → 50金币';
    else if (days < 30) nextReward = '再坚持 ' + (30 - days) + ' 天 → 200金币+勋章';
    else if (days < 100) nextReward = '再坚持 ' + (100 - days) + ' 天 → 500金币+限定背景';
    else nextReward = '你是传奇！继续保持~';

    showModal('🔥 火苗系统',
      '<div style="padding:14px;font-size:13px;line-height:1.8;color:#5a6a7c">' +
        '<div style="text-align:center;font-size:56px;margin-bottom:6px">' + (days >= 30 ? '🔥🔥🔥' : days >= 7 ? '🔥🔥' : days >= 1 ? '🔥' : '🌱') + '</div>' +
        '<div style="text-align:center;font-size:18px;font-weight:bold;color:#FF7043;margin-bottom:6px">连续陪伴 ' + days + ' 天</div>' +
        '<div style="text-align:center;font-size:12px;color:#8aa5b8;margin-bottom:12px">历史最高：' + max + ' 天</div>' +
        '<div style="background:#FFF3E0;padding:10px;border-radius:10px;margin-bottom:8px">' +
          '<div style="font-weight:bold;margin-bottom:4px">🎯 下一站奖励</div>' +
          '<div style="font-size:12px;color:#FF7043">' + nextReward + '</div>' +
        '</div>' +
        '<div style="background:#E8F0F8;padding:10px;border-radius:10px;margin-bottom:8px">' + shieldText + '</div>' +
        '<div style="font-size:12px;color:#8aa5b8">每天打开App即签到，断签归零但有1次保护机会。<br>所有断签都不惩罚，重新开始也很好~</div>' +
      '</div>',
      '<button class="btn-primary" onclick="closeModal()">关闭</button>');
  }

  // ============ 功能2：🏅 微成就今日份 ============

  var MISSION_POOL = [
    { id: 'pet_touch', cat: '互动', text: '点一下宠物', hint: '在主页点一下宠物就好~', check: function () { return (S.featureHabit._cntPetTouch || 0) >= 1; } },
    { id: 'pet_feed', cat: '照顾', text: '喂一次食', hint: '给宠物吃点东西~', check: function () { return (S.featureHabit._cntFeed || 0) >= 1; } },
    { id: 'pet_status', cat: '照顾', text: '看一眼宠物的状态', hint: '点宠物状态条查看~', check: function () { return (S.featureHabit._cntStatus || 0) >= 1; } },
    { id: 'open_shop', cat: '探索', text: '点开一次商店', hint: '底部Tab点商店~', check: function () { return (S.featureHabit._cntShop || 0) >= 1; } },
    { id: 'open_map', cat: '探索', text: '点开一次地图', hint: '主页点地图按钮~', check: function () { return (S.featureHabit._cntMap || 0) >= 1; } },
    { id: 'open_album', cat: '探索', text: '看一眼相册', hint: '底部Tab点相册~', check: function () { return (S.featureHabit._cntAlbum || 0) >= 1; } },
    { id: 'play_game', cat: '游戏', text: '玩一次小游戏', hint: '去游戏中心玩一下~', check: function () { return (S.featureHabit._cntGame || 0) >= 1; } },
    { id: 'answer_one', cat: '学习', text: '答1道题', hint: '任务页点答题~', check: function () { return (S.featureHabit._cntAnswer || 0) >= 1; } },
    { id: 'chat_pet', cat: '互动', text: '和宠物聊一句话', hint: '主页点聊天~', check: function () { return (S.featureHabit._cntChat || 0) >= 1; } },
    { id: 'task_one', cat: '学习', text: '完成1个任务', hint: '任务页勾选一个~', check: function () { return (S.featureHabit._cntTask || 0) >= 1; } }
  ];

  function ensureDailyMissions() {
    var h = S.featureHabit;
    if (h.missionDate === todayStr() && h.dailyMissions.length === 3) return;
    // 随机抽3条
    var pool = MISSION_POOL.slice();
    var picked = [];
    for (var i = 0; i < 3 && pool.length; i++) {
      var idx = Math.floor(Math.random() * pool.length);
      picked.push({ id: pool[idx].id, completed: false });
      pool.splice(idx, 1);
    }
    h.dailyMissions = picked;
    h.missionDate = todayStr();
    // 重置今日计数器
    h._cntPetTouch = 0; h._cntFeed = 0; h._cntStatus = 0; h._cntShop = 0;
    h._cntMap = 0; h._cntAlbum = 0; h._cntGame = 0; h._cntAnswer = 0; h._cntChat = 0; h._cntTask = 0;
    saveFH();
  }

  // 事件埋点：外部调用 FH_track('feed') 等
  window.FH_track = function (key) {
    var h = S.featureHabit;
    if (!h) return;
    var map = {
      pet_touch: '_cntPetTouch', feed: '_cntFeed', status: '_cntStatus',
      shop: '_cntShop', map: '_cntMap', album: '_cntAlbum', game: '_cntGame',
      answer: '_cntAnswer', chat: '_cntChat', task: '_cntTask'
    };
    var k = map[key];
    if (!k) return;
    h[k] = (h[k] || 0) + 1;
    // 检查微成就完成
    checkMissions();
    // 周报数据采集
    trackWeekly(key);
    // 习惯追踪
    if (key === 'task') updateHabitTrack('task');
    if (key === 'feed' || key === 'pet_touch') updateHabitTrack('care');
  };

  function checkMissions() {
    var h = S.featureHabit;
    var changed = false;
    var newlyCompleted = 0;
    h.dailyMissions.forEach(function (m) {
      if (m.completed) return;
      var def = MISSION_POOL.find(function (p) { return p.id === m.id; });
      if (def && def.check()) {
        m.completed = true;
        newlyCompleted++;
        changed = true;
      }
    });
    if (!changed) return;
    saveFH();

    var doneCount = h.dailyMissions.filter(function (m) { return m.completed; }).length;
    if (newlyCompleted > 0) {
      // 每完成1个 +5金币
      try { addCoin(5); Sound.play('coin'); } catch (e) {}
      if (doneCount === 3) {
        // 全部完成：+15金币 + 小花贴纸
        try { addCoin(15); Sound.play('levelup'); spawnPetals(30); } catch (e) {}
        h.flowerStickers = (h.flowerStickers || 0) + 1;
        h.lastFlowerDate = todayStr();
        saveFH();
        setTimeout(function () {
          showModal('🎉 今日份全部完成！',
            '<div style="text-align:center;padding:14px;font-size:14px;line-height:1.8;color:#5a6a7c">' +
              '<div style="font-size:48px;margin-bottom:8px">🌸</div>' +
              '<p style="margin-bottom:6px">你太棒啦！三个微成就全部完成！</p>' +
              '<div style="color:#FF9800;font-weight:bold;margin-bottom:6px">+15 金币 + 🌸今日小花贴纸 ×1</div>' +
              '<div style="font-size:12px;color:#8aa5b8">已集齐 ' + h.flowerStickers + ' 朵小花' +
                (h.flowerStickers >= 7 ? '（集齐7朵奖励50金币）' : '，集齐7朵有奖励哦~') + '</div>' +
            '</div>',
            '<button class="btn-primary" onclick="closeModal()">好开心！</button>');
        }, 300);
        // 集齐7朵奖励
        if (h.flowerStickers > 0 && h.flowerStickers % 7 === 0) {
          setTimeout(function () {
            try { addCoin(50); Sound.play('levelup'); } catch (e) {}
            toast('🌼 集齐7朵小花！+50金币');
          }, 1500);
        }
        // 集齐30朵解锁
        if (h.flowerStickers === 30) {
          setTimeout(function () {
            showModal('🌷 花之守护者',
              '<div style="text-align:center;padding:14px;font-size:14px;line-height:1.8;color:#5a6a7c">' +
                '<div style="font-size:48px;margin-bottom:8px">🌷</div>' +
                '<p>集齐30朵小花！解锁限定家园装饰"花环门"+成就"花之守护者"</p>' +
              '</div>',
              '<button class="btn-primary" onclick="closeModal()">领取</button>');
            try { if (S.badges && S.badges.indexOf('flower_guardian') < 0) { S.badges.push('flower_guardian'); Storage.save(); } } catch (e) {}
          }, 2500);
        }
        checkHabitAchievements();
      } else {
        toast('🌸 完成 ' + doneCount + '/3！继续加油！+5金币');
      }
    }
    updateMissionBadge();
  }

  // 微成就进度条注入（主页状态栏下方）
  function injectMissionBadge() {
    var bottom = document.querySelector('.home-bottom');
    if (!bottom) return;
    if (document.getElementById('fhMissionBar')) { updateMissionBadge(); return; }
    var el = document.createElement('div');
    el.id = 'fhMissionBar';
    el.className = 'fh-mission-bar';
    el.addEventListener('click', FHopenMissionPanel);
    bottom.insertBefore(el, bottom.firstChild);
    updateMissionBadge();
  }

  function updateMissionBadge() {
    var el = document.getElementById('fhMissionBar');
    if (!el) return;
    var h = S.featureHabit;
    var done = 0;
    if (h.dailyMissions && h.dailyMissions.length) {
      done = h.dailyMissions.filter(function (m) { return m.completed; }).length;
    }
    var html = '';
    for (var i = 0; i < 3; i++) {
      html += '<span class="fh-mission-dot ' + (i < done ? 'done' : '') + '">' + (i < done ? '🌸' : '🌱') + '</span>';
    }
    el.innerHTML = '<span class="fh-mission-label">🏅今日份</span>' + html + '<span class="fh-mission-num">' + done + '/3</span>';
  }

  function FHopenMissionPanel() {
    try { Sound.play('click'); } catch (e) {}
    var h = S.featureHabit;
    var listHTML = h.dailyMissions.map(function (m) {
      var def = MISSION_POOL.find(function (p) { return p.id === m.id; });
      var text = def ? def.text : m.id;
      var hint = def ? def.hint : '';
      return '<div class="fh-mission-item ' + (m.completed ? 'done' : '') + '">' +
        '<span class="fh-mission-check">' + (m.completed ? '✅' : '⬜') + '</span>' +
        '<div style="flex:1"><div style="font-weight:bold">' + escapeHTML(text) + '</div>' +
        '<div style="font-size:11px;color:#8aa5b8">' + escapeHTML(hint) + '</div></div>' +
      '</div>';
    }).join('');
    var doneCount = h.dailyMissions.filter(function (m) { return m.completed; }).length;
    showModal('🏅 今日份微成就',
      '<div style="padding:10px;font-size:13px;color:#5a6a7c">' +
        '<div style="text-align:center;margin-bottom:10px">' +
          '<div style="font-size:14px">已完成 <b style="color:#FF7043">' + doneCount + '/3</b></div>' +
          '<div style="font-size:12px;color:#8aa5b8">每完成1个+5金币，全部完成+15金币+小花贴纸</div>' +
        '</div>' +
        '<div style="max-height:240px;overflow-y:auto">' + listHTML + '</div>' +
        '<div style="background:#E8F5E9;padding:8px 10px;border-radius:8px;font-size:12px;margin-top:8px;color:#2E7D32">' +
          '🌼 已集齐 <b>' + (h.flowerStickers || 0) + '</b> 朵今日小花<br>' +
          '集齐7朵+50金币，集齐30朵解锁花环门装饰' +
        '</div>' +
      '</div>',
      '<button class="btn-primary" onclick="closeModal()">关闭</button>');
  }

  // ============ 功能3：📊 行为周报 ============

  function trackWeekly(key) {
    var h = S.featureHabit;
    var monday = getMondayStr();
    if (h.weekStats.weekStart !== monday) {
      // 新的一周：归档上周
      if (h.weekStats.weekStart && (h.weekStats.learning || h.weekStats.gaming || h.weekStats.caring || h.weekStats.creating || h.weekStats.exploring)) {
        h.historyWeeklyStats.push(JSON.parse(JSON.stringify(h.weekStats)));
        if (h.historyWeeklyStats.length > 12) h.historyWeeklyStats.shift();
      }
      h.weekStats = { weekStart: monday, learning: 0, gaming: 0, caring: 0, creating: 0, exploring: 0 };
    }
    var dimMap = {
      task: 'learning', answer: 'learning',
      game: 'gaming',
      feed: 'caring', pet_touch: 'caring',
      chat: 'creating',
      map: 'exploring', shop: 'exploring', album: 'exploring'
    };
    var dim = dimMap[key];
    if (dim) h.weekStats[dim] = (h.weekStats[dim] || 0) + 1;
    saveFH();
  }

  function getMondayStr() {
    var d = new Date();
    var day = d.getDay() || 7;
    if (day !== 1) d.setHours(-24 * (day - 1));
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function injectWeeklyTab() {
    var tabs = document.getElementById('albumTabs');
    if (!tabs) return;
    if (document.getElementById('fhWeeklyTab')) return;
    var btn = document.createElement('button');
    btn.id = 'fhWeeklyTab';
    btn.className = 'album-tab';
    btn.dataset.tab = 'weekly';
    btn.textContent = '📊周报';
    tabs.appendChild(btn);
    btn.addEventListener('click', function () {
      // 切换tab
      Array.prototype.forEach.call(tabs.querySelectorAll('.album-tab'), function (t) { t.classList.remove('active'); });
      btn.classList.add('active');
      FHopenWeeklyReport();
    });
  }

  function FHopenWeeklyReport() {
    try { Sound.play('click'); } catch (e) {}
    var h = S.featureHabit;
    var ws = h.weekStats || { learning: 0, gaming: 0, caring: 0, creating: 0, exploring: 0 };
    var max = Math.max(ws.learning, ws.gaming, ws.caring, ws.creating, ws.exploring, 1);
    var dims = [
      { key: 'learning', icon: '📚', name: '学习', val: ws.learning, pct: Math.round(ws.learning / max * 100) },
      { key: 'gaming', icon: '🎮', name: '游戏', val: ws.gaming, pct: Math.round(ws.gaming / max * 100) },
      { key: 'caring', icon: '❤️', name: '照顾', val: ws.caring, pct: Math.round(ws.caring / max * 100) },
      { key: 'creating', icon: '🎨', name: '创造', val: ws.creating, pct: Math.round(ws.creating / max * 100) },
      { key: 'exploring', icon: '🌍', name: '探索', val: ws.exploring, pct: Math.round(ws.exploring / max * 100) }
    ];
    // 找最高/最低
    var maxDim = dims[0], minDim = dims[0];
    dims.forEach(function (d) { if (d.val > maxDim.val) maxDim = d; if (d.val < minDim.val) minDim = d; });
    var petSay = '';
    if (maxDim.val === 0) {
      petSay = '主人这周还没怎么陪' + petName() + '呢，一起来玩吧~';
    } else {
      var sayMap = {
        learning: '你是最聪明的小主人！',
        gaming: '和你一起玩最开心了！',
        caring: '被你爱着好幸福！',
        creating: '你是个小艺术家！',
        exploring: '一起去冒险真有趣！'
      };
      petSay = '主人这周在' + maxDim.icon + maxDim.name + '上最棒了！' + sayMap[maxDim.key] + (minDim.val === 0 ? ' 下周多来陪陪我好不好？' : '');
    }

    // 简易雷达图（SVG五边形）
    var cx = 110, cy = 110, R = 80;
    var pts = [];
    dims.forEach(function (d, i) {
      var angle = -Math.PI / 2 + i * 2 * Math.PI / 5;
      var r = R * (d.val / max);
      pts.push((cx + r * Math.cos(angle)).toFixed(1) + ',' + (cy + r * Math.sin(angle)).toFixed(1));
    });
    var bgPts = [];
    [0.25, 0.5, 0.75, 1].forEach(function (s) {
      var p = [];
      for (var i = 0; i < 5; i++) {
        var angle = -Math.PI / 2 + i * 2 * Math.PI / 5;
        p.push((cx + R * s * Math.cos(angle)).toFixed(1) + ',' + (cy + R * s * Math.sin(angle)).toFixed(1));
      }
      bgPts.push(p.join(' '));
    });
    var labelPts = [];
    dims.forEach(function (d, i) {
      var angle = -Math.PI / 2 + i * 2 * Math.PI / 5;
      labelPts.push({ x: cx + (R + 16) * Math.cos(angle), y: cy + (R + 16) * Math.sin(angle), icon: d.icon });
    });

    var radar = '<svg width="220" height="220" viewBox="0 0 220 220" style="display:block;margin:0 auto">' +
      bgPts.map(function (p) { return '<polygon points="' + p + '" fill="none" stroke="#B0D4F1" stroke-width="1" opacity="0.6"/>'; }).join('') +
      '<polygon points="' + pts.join(' ') + '" fill="rgba(91,155,213,0.35)" stroke="#5B9BD5" stroke-width="2"/>' +
      pts.map(function (p) { var xy = p.split(','); return '<circle cx="' + xy[0] + '" cy="' + xy[1] + '" r="3" fill="#5B9BD5"/>'; }).join('') +
      labelPts.map(function (l) { return '<text x="' + l.x + '" y="' + l.y + '" text-anchor="middle" dominant-baseline="middle" font-size="14">' + l.icon + '</text>'; }).join('') +
      '</svg>';

    var dimList = dims.map(function (d) {
      return '<div class="fh-dim-row">' +
        '<span>' + d.icon + ' ' + d.name + '</span>' +
        '<div class="fh-dim-bar"><div class="fh-dim-fill" style="width:' + d.pct + '%"></div></div>' +
        '<span style="color:#5B9BD5;font-weight:bold">' + d.val + '</span>' +
      '</div>';
    }).join('');

    var content = document.getElementById('albumContent');
    if (content) {
      content.innerHTML =
        '<div style="padding:14px;font-size:13px;color:#5a6a7c">' +
          '<div style="text-align:center;font-size:15px;font-weight:bold;margin-bottom:4px">📊 第' + getWeekNum() + '周成长报告</div>' +
          '<div style="text-align:center;font-size:11px;color:#8aa5b8;margin-bottom:10px">' + h.weekStats.weekStart + ' 起</div>' +
          radar +
          '<div style="margin-top:10px">' + dimList + '</div>' +
          '<div style="background:#E8F0F8;padding:10px;border-radius:10px;margin-top:10px;font-size:12px;line-height:1.7">' +
            '💬 ' + petName() + '说：' + escapeHTML(petSay) +
          '</div>' +
          '<div style="font-size:11px;color:#8aa5b8;text-align:center;margin-top:8px">💡 这里只看投入分布，没有好坏之分哦~</div>' +
        '</div>';
    }
  }

  function getWeekNum() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (d.getDay() || 7) + 1);
    var onejan = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - onejan) / 86400000) + 1) / 7);
  }

  // ============ 功能4：⏰ 再待一会儿 ============

  var stayTimer = null;
  var staySecondsLeft = 0;

  // 暴露：供外部返回按钮调用
  window.FH_tryStayRetain = function (onExit) {
    var h = S.featureHabit;
    if (h.stayCountToday >= 2) { onExit && onExit(); return; }
    if (Math.random() > 0.3) { onExit && onExit(); return; }
    h.stayCountToday = (h.stayCountToday || 0) + 1;
    saveFH();
    var msgs = [
      '再陪我玩5分钟嘛～我一个人好无聊',
      '再待5分钟，我给你看个好东西！',
      '主人今天好像有点累，要不要坐在这里发会儿呆？',
      '我们再玩一局飞盘好不好？就一局！'
    ];
    var msg = msgs[Math.floor(Math.random() * msgs.length)];
    showModal('🥺 再待一会儿？',
      '<div style="text-align:center;padding:14px;font-size:14px;line-height:1.8;color:#5a6a7c">' +
        '<div style="font-size:48px;margin-bottom:8px">🥺</div>' +
        '<p style="margin-bottom:10px">' + escapeHTML(msg) + '</p>' +
        '<div style="font-size:12px;color:#8aa5b8">再待5分钟可获得 +10金币 + 心情+5</div>' +
      '</div>',
      '<button class="btn-cancel" onclick="closeModal();window.FH_exitNow && window.FH_exitNow();">下次吧</button>' +
      '<button class="btn-primary" onclick="closeModal();window.FH_startStay && window.FH_startStay();">再待一会儿</button>');
    window.FH_exitNow = function () {
      toast('好吧～那明天一定要来哦！');
      setTimeout(function () { onExit && onExit(); }, 600);
    };
  };

  window.FH_startStay = function () {
    staySecondsLeft = 300; // 5分钟
    var el = document.getElementById('fhStayTimer');
    if (!el) {
      el = document.createElement('div');
      el.id = 'fhStayTimer';
      el.className = 'fh-stay-timer';
      document.body.appendChild(el);
    }
    el.style.display = 'flex';
    updateStayDisplay();
    if (stayTimer) clearInterval(stayTimer);
    stayTimer = setInterval(function () {
      staySecondsLeft--;
      if (staySecondsLeft <= 0) {
        clearInterval(stayTimer);
        stayTimer = null;
        var t = document.getElementById('fhStayTimer');
        if (t) t.style.display = 'none';
        // 奖励
        try { addCoin(10); Sound.play('levelup'); } catch (e) {}
        try { var p = getActivePet(); if (p) { p.mood = Math.min(100, (p.mood || 0) + 5); Storage.save(); } } catch (e) {}
        showModal('🥰 谢谢主人陪我！',
          '<div style="text-align:center;padding:14px;font-size:14px;line-height:1.8;color:#5a6a7c">' +
            '<div style="font-size:48px;margin-bottom:8px">🥰</div>' +
            '<p>谢谢你陪我这么久！这是奖励~</p>' +
            '<div style="color:#FF9800;font-weight:bold">+10 金币 + 心情+5</div>' +
          '</div>',
          '<button class="btn-primary" onclick="closeModal()">开心！</button>');
      } else {
        updateStayDisplay();
      }
    }, 1000);
  };

  function updateStayDisplay() {
    var el = document.getElementById('fhStayTimer');
    if (!el) return;
    var m = Math.floor(staySecondsLeft / 60);
    var s = staySecondsLeft % 60;
    el.textContent = '⏳ ' + m + ':' + (s < 10 ? '0' + s : s);
  }

  // ============ 功能5：📈 习惯成就 + 🎯 每日目标 ============

  function updateHabitTrack(type) {
    var h = S.featureHabit;
    var t = h.habitTrack;
    var today = todayStr();
    if (type === 'task') {
      if (t.lastTaskDate === today) return; // 今日已计
      if (t.lastTaskDate === yesterdayStr()) t.taskStreak = (t.taskStreak || 0) + 1;
      else t.taskStreak = 1;
      t.lastTaskDate = today;
    } else if (type === 'care') {
      if (t.careCountDate !== today) { t.careCountDate = today; t.careCountToday = 0; }
      t.careCountToday = (t.careCountToday || 0) + 1;
      if (t.careCountToday === 1) {
        // 当天第一次互动才推进连续
        if (t.lastCareDate === yesterdayStr()) t.careStreak = (t.careStreak || 0) + 1;
        else t.careStreak = 1;
        t.lastCareDate = today;
      }
    }
    saveFH();
    checkHabitAchievements();
  }

  var HABIT_ACHIEVEMENTS = [
    { id: 'habit_sprout', name: '🌱 萌芽', cond: 3, type: 'sign', reward: 20, badge: '' },
    { id: 'habit_tree', name: '🌿 小树', cond: 7, type: 'sign', reward: 50, badge: 'persist_seedling' },
    { id: 'habit_big', name: '🌳 大树', cond: 15, type: 'sign', reward: 100, badge: '' },
    { id: 'habit_forest', name: '🌲 森林守护者', cond: 30, type: 'sign', reward: 200, badge: 'forest_guardian', title: 'forest_guardian' },
    { id: 'habit_peak', name: '🏔️ 不变的山峰', cond: 100, type: 'sign', reward: 500, badge: 'eternal_star' },
    { id: 'habit_learn', name: '📚 学习之星', cond: 7, type: 'task', reward: 50, badge: 'little_scholar' },
    { id: 'habit_care', name: '❤️ 照顾之星', cond: 7, type: 'care', reward: 50, badge: 'love_ambassador' }
  ];

  function checkHabitAchievements() {
    var h = S.featureHabit;
    HABIT_ACHIEVEMENTS.forEach(function (ach) {
      if (h.claimedMilestones.indexOf(ach.id) >= 0) return;
      var cur = 0;
      if (ach.type === 'sign') cur = h.consecutiveDays || 0;
      else if (ach.type === 'task') cur = (h.habitTrack && h.habitTrack.taskStreak) || 0;
      else if (ach.type === 'care') cur = (h.habitTrack && h.habitTrack.careStreak) || 0;
      if (cur >= ach.cond) {
        h.claimedMilestones.push(ach.id);
        saveFH();
        try { addCoin(ach.reward); Sound.play('levelup'); spawnPetals(40); } catch (e) {}
        if (ach.badge) { try { if (S.badges.indexOf(ach.badge) < 0) { S.badges.push(ach.badge); Storage.save(); } } catch (e) {} }
        setTimeout(function () {
          showModal('🏆 习惯成就达成！',
            '<div style="text-align:center;padding:14px;font-size:14px;line-height:1.8;color:#5a6a7c">' +
              '<div style="font-size:48px;margin-bottom:8px">🏆</div>' +
              '<div style="font-size:16px;font-weight:bold;margin-bottom:6px">' + ach.name + '</div>' +
              '<div style="color:#FF9800;font-weight:bold;margin-bottom:6px">+' + ach.reward + ' 金币' +
                (ach.badge ? ' + 徽章' : '') + (ach.title ? ' + 称号' : '') + '</div>' +
            '</div>',
            '<button class="btn-primary" onclick="closeModal()">领取</button>');
        }, 500);
      }
    });
  }

  // 每日目标
  var DAILY_GOAL_PRESETS = [
    '今天完成2个学习任务',
    '今天和宠物互动3次',
    '今天答对5道题',
    '今天去1个地图探索',
    '今天拍1张照片',
    '今天和宠物聊3句话',
    '今天玩1个小游戏'
  ];

  function ensureDailyGoal() {
    var h = S.featureHabit;
    if (h.dailyGoal.date === todayStr() && h.dailyGoal.text) return;
    // 家长预设优先
    var customGoal = '';
    try { customGoal = (S.parentSettings && S.parentSettings.customDailyGoal) || ''; } catch (e) {}
    var text = customGoal || DAILY_GOAL_PRESETS[Math.floor(Math.random() * DAILY_GOAL_PRESETS.length)];
    h.dailyGoal = { date: todayStr(), text: text, completed: false, presetIdx: h.dailyGoal.presetIdx || 0 };
    saveFH();
  }

  function injectDailyGoal() {
    var taskList = document.getElementById('taskList');
    if (!taskList) return;
    if (document.getElementById('fhDailyGoal')) { updateDailyGoalUI(); return; }
    var el = document.createElement('div');
    el.id = 'fhDailyGoal';
    el.className = 'fh-daily-goal';
    taskList.parentNode.insertBefore(el, taskList);
    updateDailyGoalUI();
  }

  function updateDailyGoalUI() {
    var el = document.getElementById('fhDailyGoal');
    if (!el) return;
    var g = S.featureHabit.dailyGoal;
    el.innerHTML =
      '<div class="fh-goal-head">' +
        '<span class="fh-goal-icon">🎯</span>' +
        '<span class="fh-goal-text">' + escapeHTML(g.text) + '</span>' +
        '<span class="fh-goal-status ' + (g.completed ? 'done' : '') + '">' + (g.completed ? '✅' : '⬜') + '</span>' +
      '</div>' +
      '<div style="font-size:11px;color:#8aa5b8">完成奖励 +30金币</div>';
  }

  function checkDailyGoal() {
    var h = S.featureHabit;
    if (h.dailyGoal.completed) return;
    var text = h.dailyGoal.text || '';
    var done = false;
    var c = h._cntTask || 0, a = h._cntAnswer || 0, t = (h._cntFeed || 0) + (h._cntPetTouch || 0);
    var chat = h._cntChat || 0, game = h._cntGame || 0, map = h._cntMap || 0;
    if (/2个学习任务/.test(text) && c >= 2) done = true;
    else if (/互动3次/.test(text) && t >= 3) done = true;
    else if (/答对5道题/.test(text) && a >= 5) done = true;
    else if (/地图探索/.test(text) && map >= 1) done = true;
    else if (/拍1张照片/.test(text)) { try { done = (S.photos && S.photos.filter(function(p){var d=new Date(p.time);return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()===todayStr();}).length > 0); } catch(e){} }
    else if (/聊3句话/.test(text) && chat >= 3) done = true;
    else if (/玩1个小游戏/.test(text) && game >= 1) done = true;
    else if (S.parentSettings && S.parentSettings.customDailyGoal) {
      // 家长自定义目标，无法自动判定，由家长确认
      return;
    }
    if (done) {
      h.dailyGoal.completed = true;
      saveFH();
      updateDailyGoalUI();
      try { addCoin(30); Sound.play('levelup'); spawnPetals(20); } catch (e) {}
      setTimeout(function () {
        showModal('🎯 目标达成！',
          '<div style="text-align:center;padding:14px;font-size:14px;line-height:1.8;color:#5a6a7c">' +
            '<div style="font-size:48px;margin-bottom:8px">🎯</div>' +
            '<p style="margin-bottom:6px">你做到了！今日目标完成~</p>' +
            '<div style="color:#FF9800;font-weight:bold">+30 金币</div>' +
          '</div>',
          '<button class="btn-primary" onclick="closeModal()">领取</button>');
      }, 300);
    }
  }

  // ============ 通用：撒花特效 ============
  function spawnPetals(n) {
    try {
      var layer = document.getElementById('fhPetalLayer');
      if (!layer) {
        layer = document.createElement('div');
        layer.id = 'fhPetalLayer';
        layer.className = 'fh-petal-layer';
        document.body.appendChild(layer);
      }
      var emojis = ['🌸', '🌼', '🌺', '🌷', '✨', '🎉'];
      for (var i = 0; i < (n || 20); i++) {
        var p = document.createElement('div');
        p.className = 'fh-petal';
        p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        p.style.left = Math.random() * 100 + 'vw';
        p.style.animationDelay = (Math.random() * 0.8) + 's';
        p.style.animationDuration = (2.5 + Math.random() * 2) + 's';
        p.style.fontSize = (16 + Math.random() * 16) + 'px';
        layer.appendChild(p);
        (function (el) { setTimeout(function () { if (el.parentNode) el.remove(); }, 5000); })(p);
      }
    } catch (e) {}
  }

  // ============ 自动初始化 ============
  function autoInit() {
    if (typeof S === 'undefined' || !S || !window.Storage) { setTimeout(autoInit, 200); return; }
    ensureState();
    if (!_inited) {
      _inited = true;
      // 每日登录检查
      checkDailyLogin();
      ensureDailyMissions();
      ensureDailyGoal();
      // 注入UI
      setTimeout(function () {
        injectFireBadge();
        injectMissionBadge();
        injectWeeklyTab();
        injectDailyGoal();
      }, 600);
      // 定时刷新
      setInterval(function () {
        injectFireBadge();
        injectMissionBadge();
        injectWeeklyTab();
        injectDailyGoal();
        checkMissions();
        checkDailyGoal();
      }, 2000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(autoInit, 300); });
  } else {
    setTimeout(autoInit, 300);
  }

  // 暴露给外部
  window.FHopenFirePanel = FHopenFirePanel;
  window.FHopenMissionPanel = FHopenMissionPanel;
  window.FHopenWeeklyReport = FHopenWeeklyReport;
})();
