/**
 * 欣宝小宠 - 趣味功能扩展模块
 * 包含：盲盒扭蛋机 / 藏宝图挖宝 / 宠物奥运会 / 宠物往事回忆 / 昆虫旅馆
 *
 * 仅创建新文件，不修改任何现有文件。
 * 通过 window.FeatureFunInit 初始化，所有新增状态统一存于 S.featureFun。
 * 所有样式类前缀 ff-，定义于 css/feature_fun.css。
 */
(function () {
  'use strict';

  // 防止重复初始化（模块级标记，每次页面加载重置）
  if (window.__featureFunLoaded) return;
  window.__featureFunLoaded = true;

  var _ffInited = false;          // 是否已注册定时器等
  var _pendingDigRewards = null;  // 挖宝临时奖品（不持久化）

  // ============ 工具函数 ============

  // 初始化 S.featureFun 默认结构（幂等）
  function ensureState() {
    if (!S.featureFun) S.featureFun = {};
    var ff = S.featureFun;
    if (!ff.gacha) ff.gacha = { totalRolls: 0, dailyRolls: 0, dailyDate: '' };
    if (!ff.treasure) ff.treasure = { fragments: { up: 0, down: 0, left: 0, right: 0 }, maps: 0, dugToday: '' };
    if (!ff.olympics) ff.olympics = { month: '', participated: false, scores: {}, reward: 0 };
    if (!ff.petMemories) ff.petMemories = {};
    if (!ff.bugHotel) ff.bugHotel = { owned: false, guests: [], lastCheck: 0 };

    // 扭蛋每日次数重置
    var today = Storage.todayStr();
    if (ff.gacha.dailyDate !== today) {
      ff.gacha.dailyDate = today;
      ff.gacha.dailyRolls = 0;
    }
    // 昆虫旅馆时间戳兜底
    if (ff.bugHotel.owned && !ff.bugHotel.lastCheck) {
      ff.bugHotel.lastCheck = Date.now();
    }
  }

  function saveFF() { Storage.save(); }

  function formatFFTime(ts) {
    var d = new Date(ts);
    return (d.getMonth() + 1) + '/' + d.getDate();
  }

  // 是否有弹窗/全屏打开（避免回忆等打扰）
  function isOverlayOpen() {
    var mask = document.getElementById('modalMask');
    var fs = document.getElementById('fullscreen');
    if (mask && !mask.classList.contains('hidden')) return true;
    if (fs && !fs.classList.contains('hidden')) return true;
    return false;
  }

  // 给背包加物品
  function invAdd(id, n) {
    n = n || 1;
    S.inventory[id] = (S.inventory[id] || 0) + n;
  }

  // ============ 功能1：盲盒扭蛋机 ============

  function injectShopGachaEntry() {
    var shopPage = document.getElementById('page-shop');
    var shopList = document.getElementById('shopList');
    if (!shopPage || !shopList) return;
    if (document.getElementById('ff-gacha-entry')) return;
    var card = document.createElement('div');
    card.id = 'ff-gacha-entry';
    card.className = 'ff-gacha-entry';
    card.innerHTML =
      '<div class="ff-gacha-emoji">🎰</div>' +
      '<div class="ff-gacha-info">' +
        '<div class="ff-gacha-title">神秘扭蛋机</div>' +
        '<div class="ff-gacha-sub">100金币/次，拼手气赢稀有奖品！</div>' +
      '</div>' +
      '<button class="ff-gacha-go" type="button">去扭蛋</button>';
    card.addEventListener('click', openGacha);
    shopPage.insertBefore(card, shopList);
  }

  function openGacha() {
    ensureState();
    var g = S.featureFun.gacha;
    var html =
      '<div class="ff-fs-header">' +
        '<button class="ff-back-btn" type="button" onclick="closeFullscreen()">← 返回</button>' +
        '<span class="ff-fs-title">🎰 神秘扭蛋机</span>' +
        '<span style="width:54px"></span>' +
      '</div>' +
      '<div class="ff-gacha-body">' +
        '<div class="ff-gacha-machine">' +
          '<div class="ff-gacha-ball" id="ffGachaBall">🎰</div>' +
        '</div>' +
        '<div class="ff-gacha-prize" id="ffGachaPrize"></div>' +
        '<div class="ff-gacha-stats">' +
          '<div>今日已扭：<b id="ffGachaDaily">' + g.dailyRolls + '</b> 次</div>' +
          '<div>累计扭蛋：<b>' + g.totalRolls + '</b> 次</div>' +
        '</div>' +
        '<div class="ff-gacha-pool">' +
          '<div class="ff-pool-row"><span class="ff-tag ff-tag-n">普通 70%</span>食物/20-50金/互动券</div>' +
          '<div class="ff-pool-row"><span class="ff-tag ff-tag-r">稀有 25%</span>饰品/100金/蜂蜜罐</div>' +
          '<div class="ff-pool-row"><span class="ff-tag ff-tag-h">隐藏 5%</span>👑皇冠/200金/神秘油桶</div>' +
        '</div>' +
        '<button class="ff-gacha-roll-btn" id="ffGachaBtn" type="button" onclick="ffRollGacha()">扭一次 (100🪙)</button>' +
      '</div>';
    openFullscreen(html);
  }

  // 抽奖：先定稀有度，再在该稀有度内随机奖品
  function rollGacha() {
    var r = Math.random() * 100;
    var rarity, prize;
    if (r < 5) { // 隐藏 5%
      rarity = 'hidden';
      var hideOpts = [
        { type: 'item', id: 'crown', count: 1, emoji: '👑', name: '皇冠' },
        { type: 'coin', amount: 200, emoji: '🪙', name: '200 金币' },
        { type: 'item', id: 'oil_barrel', count: 1, emoji: '🛢️', name: '神秘油桶' }
      ];
      prize = hideOpts[Math.floor(Math.random() * hideOpts.length)];
    } else if (r < 30) { // 稀有 25%
      rarity = 'rare';
      var rareOpts = [
        { type: 'accessory', emoji: '🎀', name: '随机饰品' },
        { type: 'coin', amount: 100, emoji: '🪙', name: '100 金币' },
        { type: 'item', id: 'honey', count: 1, emoji: '🍯', name: '蜂蜜罐' }
      ];
      prize = rareOpts[Math.floor(Math.random() * rareOpts.length)];
      if (prize.type === 'accessory') {
        var a = D.ACCESSORY_DEFS[Math.floor(Math.random() * D.ACCESSORY_DEFS.length)];
        prize.id = a.id; prize.emoji = a.emoji; prize.name = a.name;
      }
    } else { // 普通 70%
      rarity = 'normal';
      var normOpts = [
        { type: 'food', emoji: '🍖', name: '随机食物' },
        { type: 'coin', amount: 0, emoji: '🪙', name: '金币' },
        { type: 'item', id: 'coupon_interact', count: 1, emoji: '🎟️', name: '互动券' }
      ];
      prize = normOpts[Math.floor(Math.random() * normOpts.length)];
      if (prize.type === 'food') {
        var f = D.FOOD_DEFS[Math.floor(Math.random() * D.FOOD_DEFS.length)];
        prize.id = f.id; prize.emoji = f.emoji; prize.name = f.name;
        prize.count = 1 + Math.floor(Math.random() * 3); // 1-3
      } else if (prize.type === 'coin') {
        prize.amount = 20 + Math.floor(Math.random() * 31); // 20-50
      }
    }
    return { rarity: rarity, prize: prize };
  }

  function applyGachaPrize(prize) {
    if (prize.type === 'coin') {
      addCoin(prize.amount);
    } else {
      invAdd(prize.id, prize.count || 1);
      saveFF();
    }
  }

  window.ffRollGacha = function () {
    ensureState();
    var g = S.featureFun.gacha;
    var btn = document.getElementById('ffGachaBtn');
    var ball = document.getElementById('ffGachaBall');
    var prizeEl = document.getElementById('ffGachaPrize');
    if (!btn || btn.disabled) return;
    if (!spendCoin(100)) return;
    btn.disabled = true;
    if (ball) { ball.classList.remove('pop'); ball.classList.add('shaking'); }
    if (prizeEl) prizeEl.innerHTML = '';
    Sound.play('click');

    setTimeout(function () {
      if (ball) { ball.classList.remove('shaking'); ball.classList.add('pop'); }
      var res = rollGacha();
      applyGachaPrize(res.prize);
      g.totalRolls++;
      g.dailyRolls++;
      saveFF();

      var rarityName = res.rarity === 'hidden' ? '🎉 隐藏大奖！'
                     : (res.rarity === 'rare' ? '✨ 稀有！' : '普通');
      var cardHtml =
        '<div class="ff-prize-card ff-prize-' + res.rarity + '">' +
          '<div class="ff-prize-rarity">' + rarityName + '</div>' +
          '<div class="ff-prize-emoji">' + res.prize.emoji + '</div>' +
          '<div class="ff-prize-name">' + res.prize.name +
            (res.prize.count > 1 ? ' ×' + res.prize.count : '') + '</div>' +
        '</div>';
      if (prizeEl) prizeEl.innerHTML = cardHtml;

      Sound.play(res.rarity === 'hidden' ? 'levelup' : (res.rarity === 'rare' ? 'success' : 'coin'));

      var dailyEl = document.getElementById('ffGachaDaily');
      if (dailyEl) dailyEl.textContent = g.dailyRolls;
      btn.disabled = false;
      toast('获得 ' + res.prize.emoji + res.prize.name +
        (res.prize.count > 1 ? ' ×' + res.prize.count : ''), 2200);
    }, 2000);
  };

  // ============ 功能2：藏宝图与挖宝 ============

  var FRAG_EMOJI = { up: '⬆️', down: '⬇️', left: '⬅️', right: '➡️' };
  var FRAG_DIRS = ['up', 'down', 'left', 'right'];

  // 全局函数：完成任务时可调用，有概率掉落1块碎片
  window.checkTreasureDrop = function () {
    ensureState();
    if (Math.random() < 0.25) {
      dropTreasureFragment();
    }
  };

  // 暴露给"更多"页面调用
  window.openBugHotel = openBugHotel;
  window.openTreasureMap = openTreasureMap;

  // 每日登录 30% 概率掉落1块碎片
  function dailyTreasureDropCheck() {
    ensureState();
    var ff = S.featureFun.treasure;
    var today = Storage.todayStr();
    if (ff._lastDropDate === today) return;
    ff._lastDropDate = today;
    saveFF();
    if (Math.random() < 0.3) {
      dropTreasureFragment();
    }
  }

  function dropTreasureFragment() {
    ensureState();
    var ff = S.featureFun.treasure;
    var dir = FRAG_DIRS[Math.floor(Math.random() * 4)];
    ff.fragments[dir] = (ff.fragments[dir] || 0) + 1;
    toast('🗺️ 捡到一块藏宝图碎片！' + FRAG_EMOJI[dir], 2200);
    Sound.play('success');
    tryMergeTreasureMap();
    saveFF();
    refreshHomeIcons();
  }

  function tryMergeTreasureMap() {
    var ff = S.featureFun.treasure;
    if (ff.fragments.up > 0 && ff.fragments.down > 0 &&
        ff.fragments.left > 0 && ff.fragments.right > 0) {
      ff.fragments.up--; ff.fragments.down--; ff.fragments.left--; ff.fragments.right--;
      ff.maps = (ff.maps || 0) + 1;
      saveFF();
      setTimeout(function () {
        showModal('🗺️ 藏宝图合成！', `
          <div style="text-align:center;padding:14px">
            <div style="font-size:48px;margin-bottom:8px">🗺️</div>
            <div style="font-size:15px;color:#5a6a7c;margin-bottom:8px">集齐4块碎片，合成了一张完整藏宝图！</div>
            <div style="font-size:13px;color:#FF9800">快去主页点击藏宝图挖宝吧~</div>
          </div>
        `, `<button class="btn-primary" onclick="closeModal()">去挖宝</button>`);
        Sound.play('levelup');
      }, 500);
      return true;
    }
    return false;
  }

  function openTreasureMap() {
    ensureState();
    var ff = S.featureFun.treasure;
    if (ff.maps <= 0) {
      showModal('🗺️ 藏宝图碎片', `
        <div style="text-align:center;padding:14px">
          <div style="font-size:36px;margin-bottom:8px">🗺️</div>
          <div style="font-size:14px;color:#5a6a7c;margin-bottom:10px">集齐4块碎片可合成藏宝图</div>
          <div style="display:flex;justify-content:center;gap:10px;font-size:24px;margin-bottom:10px;flex-wrap:wrap">
            <div>⬆️×${ff.fragments.up}</div>
            <div>⬇️×${ff.fragments.down}</div>
            <div>⬅️×${ff.fragments.left}</div>
            <div>➡️×${ff.fragments.right}</div>
          </div>
          <div style="font-size:12px;color:#8aa5b8">每天登录有30%概率捡到碎片<br>完成任务也可能掉落哦~</div>
        </div>
      `, `<button class="btn-primary" onclick="closeModal()">好的</button>`);
      return;
    }
    var today = Storage.todayStr();
    if (ff.dugToday === today) {
      toast('今天已经挖过啦，明天再来~');
      return;
    }
    // 随机生成9格奖励：50%金币 / 30%道具 / 20%空气
    var rewards = [];
    for (var i = 0; i < 9; i++) {
      var r = Math.random();
      if (r < 0.5) {
        rewards.push({ type: 'coin', amount: 50 + Math.floor(Math.random() * 151) }); // 50-200
      } else if (r < 0.8) {
        var f = D.FOOD_DEFS[Math.floor(Math.random() * D.FOOD_DEFS.length)];
        rewards.push({ type: 'item', id: f.id, emoji: f.emoji, name: f.name });
      } else {
        rewards.push({ type: 'empty' });
      }
    }
    _pendingDigRewards = rewards;
    var cellsHtml = '';
    for (var k = 0; k < 9; k++) {
      cellsHtml += '<div class="ff-treasure-cell" data-i="' + k + '" onclick="ffDigTreasure(' + k + ')">❓</div>';
    }
    var html =
      '<div class="ff-fs-header">' +
        '<button class="ff-back-btn" type="button" onclick="closeFullscreen()">← 返回</button>' +
        '<span class="ff-fs-title">🗺️ 挖宝</span>' +
        '<span style="width:54px"></span>' +
      '</div>' +
      '<div class="ff-treasure-body">' +
        '<div class="ff-treasure-tip">选一个格子挖宝！（每天1次）</div>' +
        '<div class="ff-treasure-grid" id="ffTreasureGrid">' + cellsHtml + '</div>' +
        '<div class="ff-treasure-result" id="ffTreasureResult"></div>' +
      '</div>';
    openFullscreen(html);
  }

  window.ffDigTreasure = function (i) {
    if (!_pendingDigRewards) return;
    var rewards = _pendingDigRewards;
    var rw = rewards[i];
    var grid = document.getElementById('ffTreasureGrid');
    if (grid) {
      Array.prototype.forEach.call(grid.children, function (c, idx) {
        c.onclick = null;
        c.classList.add('dug');
        var r = rewards[idx];
        if (r.type === 'coin') c.innerHTML = '🪙';
        else if (r.type === 'item') c.innerHTML = r.emoji;
        else c.innerHTML = '💨';
        if (idx === i) c.classList.add('picked');
      });
    }
    var resultEl = document.getElementById('ffTreasureResult');
    var text = '';
    if (rw.type === 'coin') {
      addCoin(rw.amount);
      text = '🎉 挖到 ' + rw.amount + ' 金币！';
      Sound.play('coin');
    } else if (rw.type === 'item') {
      invAdd(rw.id, 1);
      saveFF();
      text = '🎁 挖到 ' + rw.emoji + ' ' + rw.name + '！';
      Sound.play('success');
    } else {
      text = '💨 这格什么也没有...明天再试试吧~';
      Sound.play('fail');
    }
    // 消耗藏宝图
    ensureState();
    var ff = S.featureFun.treasure;
    ff.maps = Math.max(0, (ff.maps || 0) - 1);
    ff.dugToday = Storage.todayStr();
    _pendingDigRewards = null;
    saveFF();
    refreshHomeIcons();
    if (resultEl) {
      resultEl.innerHTML =
        '<div class="ff-dig-result">' + text + '</div>' +
        '<button class="ff-result-btn" type="button" onclick="closeFullscreen()">完成</button>';
    }
  };

  // ============ 功能3：宠物奥运会 ============

  // 每月1-3号开放
  function olympicsActive() {
    var d = new Date().getDate();
    return d >= 1 && d <= 3;
  }

  function checkOlympicsBanner() {
    ensureState();
    var ff = S.featureFun.olympics;
    var month = Storage.monthStr();
    if (ff.month !== month) {
      ff.month = month;
      ff.participated = false;
      ff.scores = {};
      ff.reward = 0;
      ff.total = 0;
      saveFF();
    }
    var home = document.getElementById('page-home');
    if (!home) return;
    var banner = document.getElementById('ff-olympics-banner');
    if (olympicsActive()) {
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'ff-olympics-banner';
        banner.className = 'ff-olympics-banner';
        banner.innerHTML =
          '<span class="ff-olympics-emoji">🏆</span>' +
          '<span class="ff-olympics-text">宠物奥运会开幕！</span>' +
          '<span class="ff-olympics-go">参加 ▸</span>';
        banner.addEventListener('click', openOlympics);
        home.insertBefore(banner, home.firstChild);
      }
    } else {
      if (banner) banner.remove();
    }
  }

  function openOlympics() {
    ensureState();
    var ff = S.featureFun.olympics;
    var pet = getActivePet();
    if (!pet) { toast('先领养一只宠物吧~'); return; }
    var def = D.PET_DEFS[pet.defId];
    var html =
      '<div class="ff-fs-header">' +
        '<button class="ff-back-btn" type="button" onclick="closeFullscreen()">← 返回</button>' +
        '<span class="ff-fs-title">🏆 宠物奥运会</span>' +
        '<span style="width:54px"></span>' +
      '</div>' +
      '<div class="ff-olympics-body" id="ffOlyBody">' +
        '<div class="ff-olympics-intro">' +
          '<div class="ff-olympics-pet">' + def.emoji + '</div>' +
          '<div class="ff-olympics-name">' + pet.name + ' 准备出战！</div>' +
          '<div class="ff-olympics-tip">参加3个项目，赢取金币和奖杯</div>' +
        '</div>' +
        '<div class="ff-olympics-events">' +
          '<div class="ff-olympics-event">' +
            '<div class="ff-evt-icon">🏃</div>' +
            '<div class="ff-evt-name">赛跑</div>' +
            '<div class="ff-evt-status" id="ffStatus-sprint">未开始</div>' +
          '</div>' +
          '<div class="ff-olympics-event">' +
            '<div class="ff-evt-icon">🍖</div>' +
            '<div class="ff-evt-name">吃东西大赛</div>' +
            '<div class="ff-evt-status" id="ffStatus-eating">未开始</div>' +
          '</div>' +
          '<div class="ff-olympics-event">' +
            '<div class="ff-evt-icon">🥺</div>' +
            '<div class="ff-evt-name">卖萌大赛</div>' +
            '<div class="ff-evt-status" id="ffStatus-cute">未开始</div>' +
          '</div>' +
        '</div>' +
        '<button class="ff-olympics-start" id="ffOlyStart" type="button" onclick="ffStartOlympics()">开始比赛</button>' +
      '</div>';
    openFullscreen(html);
    if (ff.participated) renderOlympicsResult();
  }

  window.ffStartOlympics = function () {
    ensureState();
    var ff = S.featureFun.olympics;
    if (ff.participated) { toast('本月已参赛~'); return; }
    var pet = getActivePet();
    if (!pet) return;
    var startBtn = document.getElementById('ffOlyStart');
    if (startBtn) startBtn.style.display = 'none';

    var events = [
      { id: 'sprint', name: '赛跑', stat: pet.mood },
      { id: 'eating', name: '吃东西大赛', stat: pet.hunger },
      { id: 'cute', name: '卖萌大赛', stat: Math.min(100, Math.floor(pet.intimacy / 10)) }
    ];
    var scores = {};
    var delay = 0;
    events.forEach(function (ev) {
      setTimeout(function () {
        var score = computeOlympicScore(ev.stat);
        scores[ev.id] = score;
        animateOlympicEvent(ev, score);
      }, delay);
      delay += 2500;
    });
    setTimeout(function () {
      ff.scores = scores;
      finalizeOlympics(scores);
    }, delay + 400);
  };

  function computeOlympicScore(stat) {
    // 基于属性 0-100，加 ±10 随机
    var base = stat + Math.floor(Math.random() * 21) - 10;
    return Math.max(10, Math.min(100, base));
  }

  function animateOlympicEvent(ev, score) {
    var statusEl = document.getElementById('ffStatus-' + ev.id);
    if (!statusEl) return;
    statusEl.innerHTML =
      '<div class="ff-progress"><div class="ff-progress-fill" style="width:0%"></div></div>' +
      '<div class="ff-score">' + score + ' 分</div>';
    setTimeout(function () {
      var fill = statusEl.querySelector('.ff-progress-fill');
      if (fill) fill.style.width = score + '%';
    }, 60);
    Sound.play('click');
  }

  function finalizeOlympics(scores) {
    ensureState();
    var ff = S.featureFun.olympics;
    var pet = getActivePet();
    var def = pet ? D.PET_DEFS[pet.defId] : null;
    var total = (scores.sprint || 0) + (scores.eating || 0) + (scores.cute || 0);
    ff.participated = true;
    ff.total = total;
    var reward = Math.floor(total * 0.5);
    ff.reward = reward;

    // 3个AI对手
    var aiScores = [
      100 + Math.floor(Math.random() * 150),
      100 + Math.floor(Math.random() * 150),
      100 + Math.floor(Math.random() * 150)
    ];
    var rank = 1;
    aiScores.forEach(function (s) { if (s > total) rank++; });

    // 奖杯/奖牌
    var trophyId, trophyName, trophyEmoji;
    if (rank === 1) { trophyId = 'trophy_olympic_gold'; trophyName = '奥运冠军奖杯'; trophyEmoji = '🏆'; }
    else if (rank === 2) { trophyId = 'trophy_olympic_silver'; trophyName = '奥运亚军奖杯'; trophyEmoji = '🥈'; }
    else if (rank === 3) { trophyId = 'trophy_olympic_bronze'; trophyName = '奥运季军奖杯'; trophyEmoji = '🥉'; }
    else { trophyId = 'trophy_olympic_join'; trophyName = '奥运参与奖牌'; trophyEmoji = '🎖️'; }
    invAdd(trophyId, 1);

    addCoin(reward);
    saveFF();

    var body = document.getElementById('ffOlyBody');
    if (body) {
      body.innerHTML =
        '<div class="ff-olympics-result">' +
          '<div class="ff-result-emoji">' + (rank <= 3 ? '🏆' : '🎖️') + '</div>' +
          '<div class="ff-result-title">比赛结束！</div>' +
          '<div class="ff-result-scores">' +
            '<div>🏃 赛跑：' + (scores.sprint || 0) + ' 分</div>' +
            '<div>🍖 吃东西：' + (scores.eating || 0) + ' 分</div>' +
            '<div>🥺 卖萌：' + (scores.cute || 0) + ' 分</div>' +
            '<div class="ff-total">总分：' + total + ' / 300</div>' +
          '</div>' +
          '<div class="ff-result-rank">排名第 ' + rank + ' 名</div>' +
          '<div class="ff-result-reward">' +
            '<div>💰 金币 +' + reward + '</div>' +
            '<div>' + trophyEmoji + ' ' + trophyName + ' ×1（已放入背包）</div>' +
          '</div>' +
          (def ? '<div class="ff-result-pet">' + def.emoji + pet.name + ' 真棒！</div>' : '') +
          '<button class="ff-result-btn" type="button" onclick="closeFullscreen()">太棒了！</button>' +
        '</div>';
    }
    Sound.play('levelup');
  }

  function renderOlympicsResult() {
    var ff = S.featureFun.olympics;
    var body = document.getElementById('ffOlyBody');
    if (!body) return;
    var s = ff.scores || {};
    var total = ff.total || ((s.sprint || 0) + (s.eating || 0) + (s.cute || 0));
    body.innerHTML =
      '<div class="ff-olympics-result">' +
        '<div class="ff-result-emoji">🏅</div>' +
        '<div class="ff-result-title">本月已参赛</div>' +
        '<div class="ff-result-scores">' +
          '<div>🏃 赛跑：' + (s.sprint || 0) + ' 分</div>' +
          '<div>🍖 吃东西：' + (s.eating || 0) + ' 分</div>' +
          '<div>🥺 卖萌：' + (s.cute || 0) + ' 分</div>' +
          '<div class="ff-total">总分：' + total + ' / 300</div>' +
        '</div>' +
        '<div class="ff-result-rank">已获金币奖励：' + (ff.reward || 0) + '</div>' +
        '<button class="ff-result-btn" type="button" onclick="closeFullscreen()">关闭</button>' +
      '</div>';
  }

  // ============ 功能4：宠物往事回忆 ============

  var PET_MEMORIES = [
    {
      level: 600,
      emoji: '🌸',
      story: '在来到这个家之前，我住在一个大大的花园里。那里有很多蝴蝶，但我总是追不上它们...直到有一天，你出现了！'
    },
    {
      level: 800,
      emoji: '☁️',
      story: '你知道吗？在你不在的时候，我会偷偷看着窗外的云朵。每一朵云，我都想象成你的笑脸。能遇见你，是我最幸运的事。'
    }
  ];

  function checkPetMemories() {
    ensureState();
    var ff = S.featureFun.petMemories;
    var pet = getActivePet();
    if (!pet) return;
    if (isOverlayOpen()) return;
    for (var i = 0; i < PET_MEMORIES.length; i++) {
      var m = PET_MEMORIES[i];
      var key = pet.id + '_' + m.level;
      if (pet.intimacy >= m.level && !ff[key]) {
        ff[key] = true;
        saveFF();
        showPetMemory(pet, m);
        return; // 一次只弹一个
      }
    }
  }

  function showPetMemory(pet, m) {
    var def = D.PET_DEFS[pet.defId];
    showModal('💝 宠物往事', `
      <div style="text-align:center;padding:14px">
        <div style="font-size:48px;margin-bottom:8px">${def.emoji}</div>
        <div style="font-size:13px;color:#8aa5b8;margin-bottom:10px">${pet.name} 悄悄对你说（亲密度 ${m.level}）</div>
        <div style="font-size:14px;color:#3a4a5c;line-height:1.7;margin-bottom:12px">${m.story}</div>
        <div style="font-size:30px">${m.emoji}</div>
      </div>
    `, `<button class="btn-primary" onclick="closeModal()">抱抱 ${pet.name}</button>`);
    Sound.play('success');
  }

  // ============ 功能5：昆虫旅馆 ============

  var BUG_DEFS = [
    { id: 'ladybug', name: '瓢虫', emoji: '🐞' },
    { id: 'bee', name: '蜜蜂', emoji: '🐝' },
    { id: 'firefly', name: '萤火虫', emoji: '🦟' },
    { id: 'butterfly', name: '蝴蝶', emoji: '🦋' },
    { id: 'grasshopper', name: '蚂蚱', emoji: '🦗' }
  ];
  var BUG_MAP = {};
  BUG_DEFS.forEach(function (g) { BUG_MAP[g.id] = g; });
  var SIX_HOURS = 6 * 3600 * 1000;

  function openBugHotel() {
    ensureState();
    var ff = S.featureFun.bugHotel;
    if (!ff.owned) {
      showModal('🏨 昆虫旅馆', `
        <div style="text-align:center;padding:14px">
          <div style="font-size:48px;margin-bottom:8px">🏨</div>
          <div style="font-size:14px;color:#5a6a7c;margin-bottom:10px">建造一座昆虫旅馆，吸引可爱的小虫子入住！</div>
          <div style="font-size:13px;color:#8aa5b8;margin-bottom:8px;line-height:1.6">
            • 每6小时吸引一个新房客<br>
            • 新房客入住奖励 10-20 金币<br>
            • 收集5种小昆虫图鉴
          </div>
          <div style="font-size:15px;color:#FF9800;font-weight:bold;margin-top:6px">建造费用：100🪙</div>
        </div>
      `, `<button class="btn-cancel" onclick="closeModal()">再想想</button>
          <button class="btn-primary" onclick="ffBuyBugHotel()">建造 (100🪙)</button>`);
      return;
    }
    var now = Date.now();
    var elapsed = now - ff.lastCheck;
    var remain = Math.max(0, SIX_HOURS - elapsed);
    var remainH = Math.floor(remain / 3600000);
    var remainM = Math.floor((remain % 3600000) / 60000);

    var guestsHtml;
    if (ff.guests.length === 0) {
      guestsHtml = '<div class="ff-bug-empty">还没有房客入住，耐心等待吧~</div>';
    } else {
      guestsHtml = ff.guests.map(function (g) {
        var d = BUG_MAP[g.id] || { emoji: '🐛', name: g.id };
        return '<div class="ff-bug-guest">' +
          '<span class="ff-bug-g-emoji">' + d.emoji + '</span>' +
          '<span class="ff-bug-g-name">' + d.name + '</span>' +
          '<span class="ff-bug-g-time">' + formatFFTime(g.time) + '</span>' +
        '</div>';
      }).join('');
    }

    var html =
      '<div class="ff-fs-header">' +
        '<button class="ff-back-btn" type="button" onclick="closeFullscreen()">← 返回</button>' +
        '<span class="ff-fs-title">🏨 昆虫旅馆</span>' +
        '<span style="width:54px"></span>' +
      '</div>' +
      '<div class="ff-bug-body">' +
        '<div class="ff-bug-header">' +
          '<div class="ff-bug-emoji">🏨</div>' +
          '<div class="ff-bug-count">房客 ' + ff.guests.length + ' / 5</div>' +
          '<div class="ff-bug-timer">下一位房客：' + remainH + '时' + remainM + '分后</div>' +
        '</div>' +
        '<div class="ff-bug-list">' + guestsHtml + '</div>' +
      '</div>';
    openFullscreen(html);
  }

  window.ffBuyBugHotel = function () {
    ensureState();
    var ff = S.featureFun.bugHotel;
    if (ff.owned) { closeModal(); return; }
    if (!spendCoin(100)) return;
    ff.owned = true;
    ff.lastCheck = Date.now();
    ff.guests = [];
    saveFF();
    closeModal();
    toast('🏨 昆虫旅馆建造成功！');
    Sound.play('success');
    setTimeout(openBugHotel, 300);
  };

  function checkBugHotelGuest() {
    ensureState();
    var ff = S.featureFun.bugHotel;
    if (!ff.owned) return;
    var now = Date.now();
    if (now - ff.lastCheck >= SIX_HOURS && ff.guests.length < 5) {
      var existing = {};
      ff.guests.forEach(function (g) { existing[g.id] = true; });
      var available = BUG_DEFS.filter(function (g) { return !existing[g.id]; });
      var pool = available.length > 0 ? available : BUG_DEFS;
      var pick = pool[Math.floor(Math.random() * pool.length)];
      ff.guests.push({ id: pick.id, time: now });
      var reward = 10 + Math.floor(Math.random() * 11); // 10-20
      addCoin(reward);
      toast('🏨 新房客 ' + pick.emoji + ' ' + pick.name + ' 入住！+ ' + reward + ' 金币', 2500);
      Sound.play('coin');
      ff.lastCheck += SIX_HOURS; // 按周期推进，长时间离线可累积多个
      saveFF();
    } else if (now - ff.lastCheck >= SIX_HOURS && ff.guests.length >= 5) {
      // 旅馆满员，重置计时避免反复触发
      ff.lastCheck = now;
      saveFF();
    }
  }

  // ============ DOM 注入：更多页面卡片（避免主页home-func拥挤） ============

  function FF_addMoreCard(id, icon, name, desc, onclickFn) {
    var page = document.getElementById('page-more');
    var grid = page ? page.querySelector('.more-grid') : null;
    if (!grid) return;
    if (document.getElementById(id)) return;
    var el = document.createElement('div');
    el.id = id;
    el.className = 'more-card';
    el.onclick = onclickFn;
    el.innerHTML =
      '<div class="more-card-icon"><span class="ff-card-icon">' + icon + '</span>' +
        '<span class="ff-more-badge" style="display:none;position:absolute;margin-left:-8px;margin-top:-4px;background:#FF8A65;color:#fff;font-size:10px;border-radius:50%;width:16px;height:16px;align-items:center;justify-content:center"></span>' +
      '</div>' +
      '<div class="more-card-name">' + name + '</div>' +
      '<div class="more-card-desc">' + desc + '</div>';
    grid.appendChild(el);
  }

  function injectHomeIcons() {
    // 藏宝图卡片已移至"更多"页面，不再在主页home-func拥挤
    FF_addMoreCard('ff-treasure-card', '🗺️', '藏宝图挖宝', '集齐碎片挖宝，金币道具等你来拿',
      function () { openTreasureMap(); });
    refreshHomeIcons();
  }

  function refreshHomeIcons() {
    ensureState();
    var ff = S.featureFun.treasure;
    var card = document.getElementById('ff-treasure-card');
    if (card) {
      var badge = card.querySelector('.ff-more-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'ff-more-badge';
        badge.style.cssText = 'display:none;position:absolute;margin-left:-8px;margin-top:-4px;background:#FF8A65;color:#fff;font-size:10px;border-radius:50%;width:16px;height:16px;align-items:center;justify-content:center';
        var iconBox = card.querySelector('.more-card-icon');
        if (iconBox) iconBox.appendChild(badge);
      }
      var total = ff.fragments.up + ff.fragments.down + ff.fragments.left + ff.fragments.right;
      var showNum = '';
      if (ff.maps > 0) showNum = '!';
      else if (total > 0) showNum = String(total);
      if (showNum) {
        badge.textContent = showNum;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  // ============ 定时器 ============

  function startOlympicsCheck() {
    checkOlympicsBanner();
    setInterval(checkOlympicsBanner, 60000);
  }

  function startPetMemoryCheck() {
    checkPetMemories();
    setInterval(checkPetMemories, 5000);
  }

  function startBugHotelCheck() {
    checkBugHotelGuest();
    setInterval(checkBugHotelGuest, 60000); // 每分钟检查
  }

  // 轻量周期刷新：确保图标/入口存在且角标最新
  function startIconRefresh() {
    setInterval(function () {
      injectHomeIcons();
      refreshHomeIcons();
      if (document.getElementById('page-shop') &&
          document.getElementById('page-shop').classList.contains('active')) {
        injectShopGachaEntry();
      }
      checkOlympicsBanner();
    }, 3000);
  }

  // ============ 对外初始化入口 ============

  window.FeatureFunInit = function () {
    if (typeof S === 'undefined' || !S || !window.Storage) {
      // 状态未就绪，返回 false 供自动重试
      return false;
    }
    ensureState();
    if (!_ffInited) {
      _ffInited = true;
      injectShopGachaEntry();
      injectHomeIcons();
      startOlympicsCheck();
      startPetMemoryCheck();
      startBugHotelCheck();
      startIconRefresh();
      dailyTreasureDropCheck();
      // 监听更多页重渲染，重新注入藏宝图卡片
      window.addEventListener('morepage:rendered', function () { injectHomeIcons(); });
    } else {
      injectShopGachaEntry();
      injectHomeIcons();
      refreshHomeIcons();
    }
    return true;
  };

  // 自动初始化：等待 app.js 的 S 就绪后调用 FeatureFunInit
  function autoInit() {
    if (window.FeatureFunInit && window.FeatureFunInit()) return;
    setTimeout(autoInit, 200);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(autoInit, 200); });
  } else {
    setTimeout(autoInit, 200);
  }
})();
