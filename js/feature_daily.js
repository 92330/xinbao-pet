'use strict';
(function () {
  // ============ 内容库 ============
  var PROPHECY_LIB = [
    '今天穿红色衣服会有好运哦！',
    '下午三点，记得看看天空~',
    '今天对家人说声谢谢，会有惊喜！',
    '记得多喝水，身体棒棒哒！',
    '今天会遇到一个微笑的小伙伴~',
    '把书包整理整齐，会有小幸运！',
    '今天尝试一件新事情，会很棒哦！',
    '对朋友说句鼓励的话，友谊更牢固~',
    '今天帮爸爸妈妈做一件小事吧！',
    '抬头数数星星，许个小心愿~',
    '今天记得早睡，明天精神满满！',
    '分享一颗糖，快乐会加倍哦！'
  ];

  var STORIES = [
    { title: '🌟 星星的约定', text: '森林里的小狐狸抬起头数星星，它对最亮的那颗说："今晚你要替我守护所有小朋友的梦哦。"星星眨眨眼，把柔光洒进每个熟睡的小窗。小狐狸安心地蜷起尾巴，沉沉睡去。' },
    { title: '🌙 月亮船', text: '夜空里飘来一艘月亮船，小兔子跳了上去。船儿摇啊摇，路过云朵做的棉花糖，路过会唱歌的小风铃。小兔子打了个哈欠，被月亮船轻轻送回了软软的被窝。' },
    { title: '🦊 森林小灯笼', text: '天黑了，小狐狸怕黑不敢回家。萤火虫飞过来，一只接一只排成发光的小路。"跟着光走就不会迷路啦。"小狐狸沿着灯笼路回到树洞，安心地闭上了眼。' },
    { title: '🐰 友谊小桥', text: '小兔和小熊隔着一道小溪。他们一起搬来石头，搭了一座友谊小桥。从此每天傍晚，他们都在桥上交换一颗糖果，再各自回家做甜甜的梦。' },
    { title: '✨ 流星的小心愿', text: '一颗流星划过夜空，落进小松鼠的窗台。"你的心愿是什么？"流星问。"希望朋友们都睡得香香的。"流星笑了，变成一盏小夜灯，守着小松鼠到天明。' },
    { title: '🐻 云朵摇篮', text: '小熊睡不着，一朵云飘进窗户，把他轻轻托起来。云朵摇啊摇，像妈妈的手。风讲着古老的故事，星星替他盖好被子。小熊在云朵摇篮里，做了一个蜂蜜味的梦。' },
    { title: '🦉 守夜的小猫头鹰', text: '小猫头鹰蹲在枝头守夜，看护着整片森林。"放心睡吧，我替你们看着。"它小声说。小动物们听到这话，都安心地翻了个身，进入了梦乡。' },
    { title: '🐿️ 星光音乐会', text: '夜深了，森林开起星光音乐会。蟋蟀拉琴，青蛙打鼓，星星在天上轻轻地和。小松鼠抱着松果当观众，听着听着，眼睛慢慢合上，嘴角还挂着笑。' },
    { title: '🐱 温暖的小毛线', text: '小猫找到一团会发光的毛线，它把毛线绕在朋友们的窗台上。一夜之间，整条街的窗都亮起暖暖的光。大家睡得特别香，梦里都是春天。' },
    { title: '🌌 银河小船', text: '小考拉爬上一艘银河小船，划过闪闪的星河。星星鱼跃出水面，溅起晶亮的水花。"晚安，小家伙。"星河轻声说，把他送回了桉树上的小床。' }
  ];

  var TIPS = [
    '蜂蜜是蜜蜂送给花朵的回礼~',
    '彩虹其实是圆形的，从飞机上能看到完整的圈！',
    '猫咪的鼻纹和人的指纹一样，每只都不同。',
    '森林里的树会通过树根互相传递养分，大家都是好朋友。',
    '月亮每天悄悄远离地球一点点，约每年3.8厘米。',
    '蜗牛可以一连睡上三年都不醒。',
    '海獭睡觉时会手牵手，怕被海浪冲散。',
    '彩虹有七种颜色：红橙黄绿青蓝紫。',
    '北极熊的毛其实是透明的，皮肤是黑色的。',
    '萤火虫发光是为了和好朋友说"我在这里呀"。'
  ];
  var THEME_COLORS = [
    { name: '天蓝', value: '#5B9BD5' },
    { name: '薄荷绿', value: '#66BB6A' },
    { name: '樱花粉', value: '#FF8A95' },
    { name: '薰衣草', value: '#AB93C9' },
    { name: '柠檬黄', value: '#FFD54F' },
    { name: '蜜桃橙', value: '#FFAB91' },
    { name: '天青', value: '#4DD0E1' },
    { name: '玫瑰红', value: '#EF5350' }
  ];

  var PERSONALITY_QUIZ = [
    { q: '遇到陌生的小猫咪，你会？', options: [
      { text: '好奇地跑过去打招呼', tag: '勇敢' },
      { text: '悄悄躲起来观察它', tag: '沉稳' },
      { text: '开心地蹦跳着想一起玩', tag: '活泼' },
      { text: '轻轻走过去陪它', tag: '温柔' } ] },
    { q: '下雨天不能出门，你会？', options: [
      { text: '在家搭个冒险堡垒', tag: '活泼' },
      { text: '安静地看书画画', tag: '沉稳' },
      { text: '帮家人做家务', tag: '温柔' },
      { text: '想去雨里踩水坑', tag: '勇敢' } ] },
    { q: '小伙伴摔倒了在哭，你会？', options: [
      { text: '马上跑过去扶起他', tag: '勇敢' },
      { text: '轻轻拍拍安慰他', tag: '温柔' },
      { text: '做鬼脸逗他笑', tag: '活泼' },
      { text: '去找大人帮忙', tag: '沉稳' } ] },
    { q: '看到一只迷路的小虫子，你会？', options: [
      { text: '小心翼翼送它回家', tag: '温柔' },
      { text: '仔细观察它长什么样', tag: '沉稳' },
      { text: '兴奋地喊朋友一起看', tag: '活泼' },
      { text: '直接帮它找到出口', tag: '勇敢' } ] },
    { q: '遇到没做过的新游戏，你会？', options: [
      { text: '第一个举手试试', tag: '勇敢' },
      { text: '先看别人怎么玩', tag: '沉稳' },
      { text: '开心地拉着大家开始', tag: '活泼' },
      { text: '鼓励不太敢的朋友一起', tag: '温柔' } ] }
  ];

  var PERSONALITY_DESC = {
    '勇敢': { emoji: '🦁', desc: '遇到困难也不怕，总是第一个冲上前保护小伙伴！' },
    '温柔': { emoji: '🐰', desc: '心思细腻，会用暖暖的陪伴治愈每个人~' },
    '活泼': { emoji: '🐶', desc: '元气满满，到哪里都是快乐的小太阳！' },
    '沉稳': { emoji: '🦉', desc: '冷静又可靠，是大家最信任的小帮手。' }
  };

  var FESTIVAL_NAMES = { hugDay: '抱抱日', snackDay: '零食日', pajamaDay: '睡衣日' };

  // ============ 工具 ============
  function fd() { return S && S.featureDaily; }
  function todayStr() { return Storage.todayStr(); }
  function mondayStr() { return Storage.mondayStr(); }
  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function escapeHTML(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function ensurePetFields(pet) {
    if (!pet) return;
    if (pet.signature === undefined) pet.signature = '';
    if (pet.personality === undefined) pet.personality = '';
  }
  function fdIsFestival(type) {
    var f = fd();
    return !!f && f.miniFestival.date === todayStr() && f.miniFestival.type === type;
  }
  // 返回主页辅助（避免内联 HTML 中出现转义引号）
  window.fdGoHome = function () { try { closeFullscreen(); } catch (e) {} try { switchPage('home'); } catch (e) {} };

  // 深度合并默认值到老存档
  function initState() {
    if (!S) return;
    if (!S.featureDaily) S.featureDaily = {};
    var d = S.featureDaily;
    var def = {
      dailyProphecy: { date: '', text: '' },
      bedtimeStory: { date: '', storyIdx: -1 },
      greeting: { date: '', type: '' },
      miniFestival: { date: '', type: '' },
      newspaper: { week: '', tasks: 0, answers: 0, coins: 0, tip: '' },
      timeCapsules: [],
      themeColor: '#5B9BD5',
      birthday: '',
      lastCheckDate: '',
      statsSnapshot: { tasks: 0, answers: 0, coins: 0, week: '' }
    };
    Object.keys(def).forEach(function (k) {
      if (d[k] === undefined) {
        d[k] = def[k];
      } else if (def[k] && typeof def[k] === 'object' && !Array.isArray(def[k])) {
        d[k] = Object.assign({}, def[k], d[k]);
      }
    });
    if (!Array.isArray(d.timeCapsules)) d.timeCapsules = [];
    (S.pets || []).forEach(ensurePetFields);
  }

  // ============ 宠物气泡（复用 #petTalk） ============
  var bubbleTimer = null;
  function showPetBubble(text, dur) {
    var t = $('#petTalk');
    if (!t) return;
    t.textContent = text;
    t.classList.remove('hidden');
    t.style.top = '8%';
    t.style.whiteSpace = 'normal';
    t.style.maxWidth = '78%';
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () {
      t.classList.add('hidden');
      t.style.whiteSpace = '';
      t.style.maxWidth = '';
    }, dur || 2500);
    try { Sound.play('pet'); } catch (e) {}
  }
  // ============ 1. 宠物预言家 ============
  function checkProphecy() {
    var d = fd().dailyProphecy;
    if (d.date === todayStr()) return;
    var text = rand(PROPHECY_LIB);
    d.date = todayStr();
    d.text = text;
    Storage.save();
    if (currentPage === 'home') showPetBubble('🔮 ' + text, 2200);
  }

  // ============ 2. 睡前故事电台 ============
  window.fdOpenBedtimeStory = function () {
    try { Sound.play('click'); } catch (e) {}
    var pet = getActivePet();
    var def = D.PET_DEFS[pet.defId];
    var b = fd().bedtimeStory;
    var idx;
    if (b.date !== todayStr() || b.storyIdx < 0 || b.storyIdx >= STORIES.length) {
      idx = Math.floor(Math.random() * STORIES.length);
      b.date = todayStr();
      b.storyIdx = idx;
      Storage.save();
    } else {
      idx = b.storyIdx;
    }
    renderStory(idx, pet, def);
  };
  function renderStory(idx, pet, def) {
    var story = STORIES[idx];
    openFullscreen(
      '<div class="fs-header">' +
      '<button class="fs-back" onclick="closeFullscreen()">← 返回</button>' +
      '<div class="fs-title">📻 睡前故事电台</div>' +
      '<div style="width:60px"></div>' +
      '</div>' +
      '<div class="fs-body">' +
      '<div class="fd-story">' +
      '<div class="fd-story-pet">' + (def ? def.emoji : '🐾') + ' ' + escapeHTML(pet.name) + ' 轻轻说：</div>' +
      '<h3 class="fd-story-title">' + escapeHTML(story.title) + '</h3>' +
      '<div class="fd-story-text">' + escapeHTML(story.text) + '</div>' +
      '<div class="fd-story-end">— 晚安，好梦 🌙 —</div>' +
      '<button class="btn-primary fd-story-btn" onclick="fdAnotherStory()">🔁 再讲一个</button>' +
      '</div>' +
      '</div>'
    );
  }
  window.fdAnotherStory = function () {
    var idx = Math.floor(Math.random() * STORIES.length);
    fd().bedtimeStory.storyIdx = idx;
    Storage.save();
    var pet = getActivePet();
    var def = D.PET_DEFS[pet.defId];
    try { Sound.play('click'); } catch (e) {}
    renderStory(idx, pet, def);
  };

  // ============ 3. 早安/晚安问候曲 ============
  function checkGreeting() {
    var g = fd().greeting;
    if (g.date === todayStr()) return;
    var h = new Date().getHours();
    var type = '';
    if (h >= 6 && h < 11) type = 'morning';
    else if (h >= 19 && h < 23) type = 'night';
    g.date = todayStr();
    g.type = type;
    Storage.save();
    if (type === 'morning') {
      toast('🌞 早安！新的一天，加油哦~');
      setTimeout(function () {
        showPetBubble(rand(['早安！今天也要开心哦！', '元气满满的一天开始啦！', '一起加油吧，小伙伴！']), 2500);
      }, 700);
    } else if (type === 'night') {
      toast('🌙 晚安~做个好梦~');
      setTimeout(function () {
        showPetBubble(rand(['晚安，好梦~', '乖乖睡觉，明天见！', '盖好小被子哦~']), 2500);
      }, 700);
    }
  }

  // ============ 4. 随机迷你节日 ============
  function rollMiniFestival() {
    var m = fd().miniFestival;
    if (m.date === todayStr()) return;
    m.date = todayStr();
    if (Math.random() < 0.2) {
      m.type = rand(['hugDay', 'snackDay', 'pajamaDay']);
      toast('🎉 今日迷你节日：' + (FESTIVAL_NAMES[m.type] || '') + '！');
    } else {
      m.type = '';
    }
    Storage.save();
  }
  function festivalBannerHTML(type) {
    if (type === 'hugDay') return '🤗 今日抱抱日：和宠物互动，亲密翻倍！';
    if (type === 'snackDay') return '🍪 今日零食日：商店食物半价！';
    if (type === 'pajamaDay') return '🌙 今日睡衣日：宠物换上小睡衣啦~';
    return '';
  }

  // 节日效果：包裹全局函数（抱抱日亲密翻倍 / 零食日食物半价）
  var effectsApplied = false;
  function applyFestivalEffects() {
    if (effectsApplied) return;
    effectsApplied = true;
    if (typeof window.addIntimacy === 'function') {
      var _add = window.addIntimacy;
      window.addIntimacy = function (n) {
        if (fdIsFestival('hugDay')) n = n * 2;
        return _add(n);
      };
    }
    if (typeof window.getItemPrice === 'function') {
      var _price = window.getItemPrice;
      window.getItemPrice = function (defItem) {
        var p = _price(defItem);
        if (fdIsFestival('snackDay') && window.GAME_DATA && window.GAME_DATA.FOOD_DEFS &&
          window.GAME_DATA.FOOD_DEFS.indexOf(defItem) !== -1) {
          p = Math.max(1, Math.floor(p * 0.5));
        }
        return p;
      };
    }
  }
  // ============ 5. 宠物小镇报纸 ============
  function checkNewspaper() {
    var today = new Date();
    var isMonday = today.getDay() === 1;
    var mon = mondayStr();
    var np = fd().newspaper;
    // 非周一时刻快照本周统计（供下周一出版使用，因 app.js 的 dailyRefresh 会在周一清零）
    if (!isMonday && S.stats) {
      fd().statsSnapshot = {
        tasks: S.stats.weekTasks || 0,
        answers: S.stats.weekAnswers || 0,
        coins: S.stats.weekCoins || 0,
        week: S.stats.weekStart || ''
      };
    }
    if (isMonday && np.week !== mon) {
      np.week = mon;
      var snap = fd().statsSnapshot || { tasks: 0, answers: 0, coins: 0 };
      np.tasks = snap.tasks || 0;
      np.answers = snap.answers || 0;
      np.coins = snap.coins || 0;
      np.tip = rand(TIPS);
      Storage.save();
      showNewspaper(np);
    }
  }
  window.fdOpenNewspaper = function () {
    try { Sound.play('click'); } catch (e) {}
    showNewspaper(fd().newspaper);
  };
  function showNewspaper(np) {
    var weather = rand(['☀️ 晴朗', '⛅ 多云', '🌧️ 小雨', '❄️ 飘雪', '🌈 彩虹']);
    showModal('📰 欣宝小镇周报',
      '<div class="fd-newspaper">' +
      '<div class="fd-news-date">周刊 · ' + escapeHTML(np.week || mondayStr()) + '</div>' +
      '<div class="fd-news-headline">📍 本周头条</div>' +
      '<div class="fd-news-item">完成 <b>' + (np.tasks || 0) + '</b> 个任务</div>' +
      '<div class="fd-news-item">答对 <b>' + (np.answers || 0) + '</b> 道题</div>' +
      '<div class="fd-news-item">赚取 <b>' + (np.coins || 0) + '</b> 金币</div>' +
      '<div class="fd-news-section">🌤️ 小镇天气预报</div>' +
      '<div class="fd-news-weather">' + weather + '</div>' +
      '<div class="fd-news-section">💡 趣味小知识</div>' +
      '<div class="fd-news-tip">' + escapeHTML(np.tip || rand(TIPS)) + '</div>' +
      '</div>',
      '<button class="btn-primary" onclick="closeModal()">真棒！</button>');
  }

  // ============ 6. 时光胶囊 ============
  window.fdOpenTimeCapsule = function () {
    try { Sound.play('click'); } catch (e) {}
    renderTimeCapsuleList();
  };
  function renderTimeCapsuleList() {
    var list = fd().timeCapsules;
    var now = Date.now();
    var itemsHTML = '';
    if (!list.length) {
      itemsHTML = '<div class="fd-empty">还没有时光胶囊，来封存一个吧~</div>';
    } else {
      list.forEach(function (c, i) {
        var mature = c.opened || now >= c.openDate;
        var d = new Date(c.openDate);
        itemsHTML +=
          '<div class="fd-capsule-card ' + (mature ? 'mature' : '') + '">' +
          '<div class="fd-capsule-date">📅 开启日期：' + d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + '</div>' +
          (mature
            ? '<div class="fd-capsule-text">' + escapeHTML(c.text) + '</div>'
            : '<div class="fd-capsule-text fd-locked">🔒 还在封存中...</div>') +
          '<button class="fd-mini-btn" onclick="fdDeleteCapsule(' + i + ')">🗑 删除</button>' +
          '</div>';
      });
    }
    var bd = fd().birthday;
    openFullscreen(
      '<div class="fs-header">' +
      '<button class="fs-back" onclick="closeFullscreen()">← 返回</button>' +
      '<div class="fs-title">⏳ 时光胶囊</div>' +
      '<div style="width:60px"></div>' +
      '</div>' +
      '<div class="fs-body">' +
      '<div class="fd-capsule-list">' + itemsHTML + '</div>' +
      '<div class="fd-capsule-create">' +
      '<h3>✉️ 写给未来的自己</h3>' +
      '<textarea id="fdCapsuleText" maxlength="80" class="fd-textarea" placeholder="写下想对未来的自己说的话（最多80字）"></textarea>' +
      '<div class="fd-capsule-opts">' +
      '<button class="fd-opt-btn" onclick="fdCreateCapsule(7)">7天后开启</button>' +
      '<button class="fd-opt-btn" onclick="fdCreateCapsule(30)">30天后开启</button>' +
      '<button class="fd-opt-btn" onclick="fdCreateCapsuleBirthday()">🎂 下个生日开启</button>' +
      '</div>' +
      '<div class="fd-birthday-set">' + (bd ? ('已设生日：' + escapeHTML(bd) + ' ') : '未设置生日 ') +
      '<span class="fd-link" onclick="fdSetBirthday()">去' + (bd ? '修改' : '设置') + '</span></div>' +
      '</div>' +
      '</div>'
    );
  }
  window.fdCreateCapsule = function (days) {
    var ta = document.getElementById('fdCapsuleText');
    var text = ta ? ta.value.trim() : '';
    if (!text) { toast('先写一句话再封存哦~'); try { Sound.play('error'); } catch (e) {} return; }
    fd().timeCapsules.push({
      id: 'cap_' + Date.now(),
      text: text,
      openDate: Date.now() + days * 24 * 3600 * 1000,
      createdDate: Date.now(),
      opened: false
    });
    Storage.save();
    try { Sound.play('success'); } catch (e) {}
    toast('时光胶囊已封存，到期会提醒你~');
    renderTimeCapsuleList();
  };
  window.fdCreateCapsuleBirthday = function () {
    var ta = document.getElementById('fdCapsuleText');
    var text = ta ? ta.value.trim() : '';
    if (!text) { toast('先写一句话再封存哦~'); try { Sound.play('error'); } catch (e) {} return; }
    if (!fd().birthday) { toast('请先设置生日~'); fdSetBirthday(); return; }
    fd().timeCapsules.push({
      id: 'cap_' + Date.now(),
      text: text,
      openDate: nextBirthdayTs(fd().birthday),
      createdDate: Date.now(),
      opened: false
    });
    Storage.save();
    try { Sound.play('success'); } catch (e) {}
    toast('时光胶囊已封存，生日当天开启~');
    renderTimeCapsuleList();
  };
  function nextBirthdayTs(mmdd) {
    var parts = String(mmdd).split('-');
    var m = parseInt(parts[0], 10);
    var d = parseInt(parts[1], 10);
    if (!m || !d) return Date.now() + 30 * 24 * 3600 * 1000;
    var now = new Date();
    var year = now.getFullYear();
    var bd = new Date(year, m - 1, d, 12, 0, 0);
    if (bd.getTime() <= now.getTime()) bd = new Date(year + 1, m - 1, d, 12, 0, 0);
    return bd.getTime();
  }
  window.fdSetBirthday = function () {
    var cur = fd().birthday || '';
    var cm = cur ? cur.split('-')[0] : '';
    var cd = cur ? cur.split('-')[1] : '';
    showModal('🎂 设置生日',
      '<div style="padding:10px;font-size:13px;color:#5a6a7c">设置宝贝的生日（月-日），用于"下个生日"时光胶囊</div>' +
      '<div style="display:flex;gap:6px;justify-content:center;align-items:center;margin:12px 0">' +
      '<input id="fdBirthM" type="number" min="1" max="12" placeholder="月" value="' + escapeHTML(cm) + '" class="fd-birth-input">' +
      '<span style="font-size:18px">-</span>' +
      '<input id="fdBirthD" type="number" min="1" max="31" placeholder="日" value="' + escapeHTML(cd) + '" class="fd-birth-input">' +
      '</div>',
      '<button class="btn-primary" onclick="fdSaveBirthday()">保存</button> <button class="btn-info" onclick="closeModal()">取消</button>');
  };
  window.fdSaveBirthday = function () {
    var m = parseInt(document.getElementById('fdBirthM').value, 10);
    var d = parseInt(document.getElementById('fdBirthD').value, 10);
    if (!m || !d || m < 1 || m > 12 || d < 1 || d > 31) {
      toast('请输入正确的日期~'); try { Sound.play('error'); } catch (e) {} return;
    }
    fd().birthday = m + '-' + d;
    Storage.save();
    closeModal();
    renderTimeCapsuleList();
  };
  window.fdDeleteCapsule = function (i) {
    if (!confirm('确定删除这个时光胶囊吗？')) return;
    fd().timeCapsules.splice(i, 1);
    Storage.save();
    renderTimeCapsuleList();
  };
  function checkTimeCapsules() {
    var list = fd().timeCapsules;
    if (!list || !list.length) return;
    var now = Date.now();
    var c = null;
    for (var i = 0; i < list.length; i++) {
      if (!list[i].opened && now >= list[i].openDate) { c = list[i]; break; }
    }
    if (!c) return;
    var mask = $('#modalMask');
    var fs = $('#fullscreen');
    if (mask && !mask.classList.contains('hidden')) return;
    if (fs && !fs.classList.contains('hidden')) return;
    c.opened = true;
    c.openedAt = now;
    Storage.save();
    showCapsuleReveal(c);
  }
  function showCapsuleReveal(c) {
    showModal('🎉 时光胶囊已成熟！',
      '<div class="fd-capsule-reveal">' +
      '<div class="fd-capsule-spark">✨</div>' +
      '<p class="fd-capsule-hint">这是你之前封存的话：</p>' +
      '<div class="fd-capsule-text reveal">' + escapeHTML(c.text) + '</div>' +
      '<p class="fd-capsule-foot">封存于 ' + formatTime(c.createdDate) + '</p>' +
      '</div>',
      '<button class="btn-primary" onclick="closeModal()">好开心~</button>');
    try { Sound.play('success'); } catch (e) {}
  }

  // ============ 7. 宠物签名档 ============
  window.fdOpenSignature = function () {
    try { Sound.play('click'); } catch (e) {}
    var pet = getActivePet();
    ensurePetFields(pet);
    showModal('✏️ 宠物签名',
      '<div style="padding:6px;font-size:13px;color:#5a6a7c">给 ' + escapeHTML(pet.name) + ' 设一句签名吧（如"最爱吃骨头和晒太阳"）</div>' +
      '<input id="fdSignInput" type="text" maxlength="16" class="fd-input" value="' + escapeHTML(pet.signature || '') + '" placeholder="最多16个字">',
      '<button class="btn-primary" onclick="fdSaveSignature()">保存</button> <button class="btn-info" onclick="closeModal()">取消</button>');
  };
  window.fdSaveSignature = function () {
    var pet = getActivePet();
    var v = document.getElementById('fdSignInput').value.trim();
    pet.signature = v;
    Storage.save();
    closeModal();
    toast('签名已保存~');
    try { Sound.play('success'); } catch (e) {}
    var ex = document.getElementById('fdPetExtra');
    if (ex) ex.remove();
  };
  // ============ 8. 自定义主题色 ============
  window.fdOpenThemeColor = function () {
    try { Sound.play('click'); } catch (e) {}
    var sw = '';
    THEME_COLORS.forEach(function (c, i) {
      sw += '<div class="fd-theme-swatch ' + (fd().themeColor === c.value ? 'sel' : '') + '" ' +
        'data-color="' + c.value + '" data-idx="' + i + '" style="background:' + c.value + '" ' +
        'onclick="fdPickTheme(' + i + ')" title="' + c.name + '"><span class="fd-theme-name">' + c.name + '</span></div>';
    });
    showModal('🎨 主题色',
      '<div style="padding:6px;font-size:13px;color:#5a6a7c">挑选一个喜欢的颜色~</div>' +
      '<div class="fd-theme-row">' + sw + '</div>',
      '<button class="btn-info" onclick="fdResetTheme()">恢复默认</button> <button class="btn-primary" onclick="closeModal()">完成</button>');
  };
  window.fdPickTheme = function (idx) {
    var c = THEME_COLORS[idx];
    if (!c) return;
    var color = c.value;
    fd().themeColor = color;
    Storage.save();
    applyTheme(color);
    var nodes = document.querySelectorAll('.fd-theme-swatch');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].classList.toggle('sel', nodes[i].getAttribute('data-color') === color);
    }
    try { Sound.play('click'); } catch (e) {}
  };
  window.fdResetTheme = function () {
    fd().themeColor = '#5B9BD5';
    Storage.save();
    applyTheme('#5B9BD5');
    try { Sound.play('click'); } catch (e) {}
  };
  function hexToRGBA(hex, a) {
    var h = String(hex).replace('#', '');
    var r = parseInt(h.substring(0, 2), 16);
    var g = parseInt(h.substring(2, 4), 16);
    var b = parseInt(h.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }
  function applyTheme(color) {
    document.documentElement.style.setProperty('--theme-color', color);
    var style = document.getElementById('fdThemeStyle');
    if (!style) {
      style = document.createElement('style');
      style.id = 'fdThemeStyle';
      document.head.appendChild(style);
    }
    var c = 'var(--theme-color)';
    style.textContent =
      '.btn-primary{background:' + c + '!important;}' +
      '.tab.active{color:' + c + '!important;}' +
      '.shop-tab.active{background:' + c + '!important;}' +
      '.album-tab.active{background:' + c + '!important;}' +
      '.add-btn{border-color:' + c + '!important;color:' + c + '!important;}' +
      '.sign-day.today{border-color:' + c + '!important;}' +
      '.color-pick.sel{border-color:' + c + '!important;}' +
      '.size-pick.sel{background:' + c + '!important;}' +
      '.account-cat-btn.sel{background:' + c + '!important;}' +
      '.english-speak-btn:active{background:' + c + '!important;}' +
      '.lock-key:active{background:' + c + '!important;}' +
      '.lock-dot.filled{background:' + c + '!important;}' +
      '.dec-item.selected{border-color:' + c + '!important;background:' + hexToRGBA(color, 0.15) + '!important;}' +
      '.summary-card.week{border-top-color:' + c + '!important;}' +
      '.fd-accent{background:' + c + '!important;}';
  }
  // ============ 9. 宠物性格测试 ============
  var quizState = { idx: 0, scores: {} };
  window.fdOpenPersonality = function () {
    try { Sound.play('click'); } catch (e) {}
    quizState = { idx: 0, scores: { '勇敢': 0, '温柔': 0, '活泼': 0, '沉稳': 0 } };
    renderQuiz();
  };
  function renderQuiz() {
    var q = PERSONALITY_QUIZ[quizState.idx];
    if (!q) { finishQuiz(); return; }
    var opts = '';
    q.options.forEach(function (o, i) {
      opts += '<button class="fd-quiz-opt" onclick="fdQuizAnswer(' + i + ')">' +
        '<span class="fd-quiz-opt-text">' + escapeHTML(o.text) + '</span>' +
        '<span class="fd-quiz-tag">→ ' + escapeHTML(o.tag) + '</span></button>';
    });
    openFullscreen(
      '<div class="fs-header">' +
      '<button class="fs-back" onclick="closeFullscreen()">← 返回</button>' +
      '<div class="fs-title">🧪 性格测试 · 第 ' + (quizState.idx + 1) + ' / ' + PERSONALITY_QUIZ.length + ' 题</div>' +
      '<div style="width:60px"></div>' +
      '</div>' +
      '<div class="fs-body">' +
      '<div class="fd-quiz">' +
      '<div class="fd-quiz-q">' + escapeHTML(q.q) + '</div>' +
      '<div class="fd-quiz-opts">' + opts + '</div>' +
      '</div>' +
      '</div>'
    );
  }
  window.fdQuizAnswer = function (i) {
    var q = PERSONALITY_QUIZ[quizState.idx];
    var tag = q.options[i].tag;
    quizState.scores[tag] = (quizState.scores[tag] || 0) + 1;
    try { Sound.play('click'); } catch (e) {}
    quizState.idx++;
    renderQuiz();
  };
  function finishQuiz() {
    var best = '温柔', max = -1;
    Object.keys(quizState.scores).forEach(function (k) {
      if (quizState.scores[k] > max) { max = quizState.scores[k]; best = k; }
    });
    var pet = getActivePet();
    ensurePetFields(pet);
    pet.personality = best;
    Storage.save();
    var desc = PERSONALITY_DESC[best] || PERSONALITY_DESC['温柔'];
    openFullscreen(
      '<div class="fs-header">' +
      '<button class="fs-back" onclick="closeFullscreen()">← 完成</button>' +
      '<div class="fs-title">🧪 测试结果</div>' +
      '<div style="width:60px"></div>' +
      '</div>' +
      '<div class="fs-body">' +
      '<div class="fd-quiz-result">' +
      '<div class="fd-result-emoji">' + desc.emoji + '</div>' +
      '<div class="fd-result-tag">' + escapeHTML(pet.name) + ' 是 <b>' + escapeHTML(best) + '</b> 型</div>' +
      '<div class="fd-result-desc">' + escapeHTML(desc.desc) + '</div>' +
      '<button class="btn-primary" onclick="fdGoHome()">回到主页看看</button>' +
      '</div>' +
      '</div>'
    );
    try { Sound.play('success'); } catch (e) {}
    var ex = document.getElementById('fdPetExtra');
    if (ex) ex.remove();
  }
  // ============ 每日触发汇总 ============
  function dailyCheck() {
    if (!S) return;
    initState();
    var t = todayStr();
    if (fd().lastCheckDate === t) return;
    fd().lastCheckDate = t;
    Storage.save();
    checkProphecy();
    checkGreeting();
    rollMiniFestival();
    checkNewspaper();
    checkTimeCapsules();
  }

  // ============ 设置页卡片注入（已移至"更多"页面，这里仅保留函数供其他地方调用） ============
  function injectSettingsCards() {
    // 周报/胶囊/签名/主题色/性格测试 已移至"更多"页面，不再注入设置页
    return;
  }

  // ============ 主页注入（电台图标/节日横幅/签名性格/睡衣） ============
  function injectHomeExtras() {
    if (currentPage !== 'home') return;
    var homeActive = $('#page-home');
    if (!homeActive || !homeActive.classList.contains('active')) return;

    // 睡前电台图标（19:00后出现）
    var scene = $('#homeScene');
    if (scene) {
      var hour = new Date().getHours();
      var radio = document.getElementById('fdRadioBtn');
      if (hour >= 19) {
        if (!radio) {
          var btn = document.createElement('button');
          btn.id = 'fdRadioBtn';
          btn.className = 'fd-radio-btn';
          btn.innerHTML = '📻<span class="fd-radio-label">电台</span>';
          btn.addEventListener('click', function () { window.fdOpenBedtimeStory(); });
          scene.appendChild(btn);
        }
      } else {
        if (radio) radio.remove();
      }
    }

    injectFestivalBanner();
    injectPetExtras();
    injectPajama();
  }
  function injectFestivalBanner() {
    var app = $('#app');
    if (!app) return;
    var type = fd() && fd().miniFestival.date === todayStr() ? fd().miniFestival.type : '';
    var existing = document.getElementById('fdFestivalBanner');
    if (!type) { if (existing) existing.remove(); return; }
    if (existing && existing.getAttribute('data-type') === type) return;
    if (existing) existing.remove();
    var banner = document.createElement('div');
    banner.id = 'fdFestivalBanner';
    banner.className = 'fd-festival-banner';
    banner.setAttribute('data-type', type);
    banner.textContent = festivalBannerHTML(type);
    var content = $('#content');
    if (content) app.insertBefore(banner, content);
    else app.insertBefore(banner, app.firstChild);
  }
  function injectPetExtras() {
    var display = $('#petDisplay');
    if (!display) return;
    var pet = getActivePet();
    if (!pet) return;
    ensurePetFields(pet);
    if (display.querySelector('#fdPetExtra')) return;
    var el = document.createElement('div');
    el.id = 'fdPetExtra';
    el.className = 'fd-pet-extra';
    var html = '<div class="fd-pet-name">' + escapeHTML(pet.name || '') + '</div>';
    if (pet.personality) html += '<span class="fd-personality-tag">' + escapeHTML(pet.personality) + '</span>';
    if (pet.signature) html += '<div class="fd-signature">✎ ' + escapeHTML(pet.signature) + '</div>';
    el.innerHTML = html;
    display.appendChild(el);
  }
  function injectPajama() {
    if (!fdIsFestival('pajamaDay')) return;
    var stage = $('#petDisplay .pet-stage');
    if (!stage) return;
    if (stage.querySelector('.fd-pajama')) return;
    var el = document.createElement('div');
    el.className = 'fd-pajama pet-acc';
    el.textContent = '💤';
    el.style.cssText = 'font-size:34px;top:-6px;right:-2px;left:auto;transform:none;';
    stage.appendChild(el);
  }

  // ============ 主循环 ============
  function tick() {
    if (!S || !fd()) return;
    injectSettingsCards();
    injectHomeExtras();
  }

  // ============ 初始化入口 ============
  var fdInited = false;
  var fdScheduled = false;
  function FeatureDailyInit() {
    if (fdInited || fdScheduled) return;
    if (typeof S === 'undefined' || !S || typeof window.Storage === 'undefined' ||
        typeof window.GAME_DATA === 'undefined') {
      fdScheduled = true;
      setTimeout(function () { fdScheduled = false; FeatureDailyInit(); }, 200);
      return;
    }
    fdInited = true;
    initState();
    applyFestivalEffects();
    applyTheme(fd().themeColor || '#5B9BD5');
    dailyCheck();
    // 30秒：跨天复检 + 时光胶囊成熟检测
    setInterval(function () {
      if (!fd()) return;
      if (fd().lastCheckDate !== todayStr()) {
        dailyCheck();
      } else {
        checkTimeCapsules();
      }
    }, 30000);
    // 1秒：UI注入
    setInterval(tick, 1000);
  }
  window.FeatureDailyInit = FeatureDailyInit;

  // 自动启动（脚本被加载后即生效，无需修改 index.html 的 init 顺序）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', FeatureDailyInit);
  } else {
    FeatureDailyInit();
  }
})();
