/**
 * 欣宝小宠 - 本地持久化存储层
 * 基于 localStorage，所有数据关闭重启不丢失
 */

const STORAGE_KEY = 'xinbao_pet_save_v1';

// 默认初始状态
function getDefaultState() {
  return {
    coin: 500,                    // 初始金币
    pets: [makePet('dog','可可')], // 拥有的宠物
    activePetId: 'dog_0',          // 当前出战宠物实例ID
    tasks: JSON.parse(JSON.stringify(window.GAME_DATA.DEFAULT_TASKS)),
    inventory: {},                 // 背包物品 {itemId: count}
    furniture: {},                 // 背包家具 {furnitureId: count}
    placedFurniture: {},          // 已放置家具 {petId: [{id, x, y, rotate}]}
    unlockedMaps: [],              // 已解锁地图ID
    mapDailyReward: {},            // 地图每日奖励领取记录 {mapId: dateStr}
    photos: [],                    // 时光相册 [{id, dataURL, text, time, petId}]
    diaries: [],                   // 宠物日记 [{id, text, time, petId, auto}]
    signStreak: 0,                 // 连续签到天数
    lastSignDate: '',              // 上次签到日期
    lastOpenDate: '',              // 上次打开日期
    dailyInteract: {},             // 每日免费互动记录 {date: {petId_action: true}}
    dailyAnswer: { date:'', count:0 }, // 每日答题次数 & 获得金币
    dailyFortune: { date:'', id:'' },  // 每日运势
    dailyEvent: { date:'', triggered:false }, // 随机事件
    achievements: [],              // 已解锁成就ID
    parentPassword: '',            // 家长密码
    parentSettings: {              // 家长设置
      timeLimit: 0,                // 0=不限, 30/45/60分钟
      remindTime: '',              // 提醒时间 HH:MM
      lastWeekReport: '',          // 上周报告日期
    },
    useTimeToday: { date:'', seconds:0 }, // 今日使用时长
    dailyMiniGame: { date:'', frisbee:3, puzzle:1 }, // 每日小游戏次数
    monthlyChallenge: { month:'', signDays:0, answerRight:0, tasksDone:0, rewards:[] }, // 月度挑战进度
    monthCard: { active:false, daysLeft:0, lastClaim:'' }, // 月卡
    dailyPlayAll: { date:'', count:0 }, // 一起玩每日次数
    accounts: [],                  // 记账记录 [{id, type:'income'|'expense', category, amount, note, time}]
    dailyAccountReward: { date:'', count:0 }, // 记账奖励每日次数
    englishProgress: { date:'', learned:0, totalLearned:0 }, // 英语学习进度
    letters: [],                   // 信件 [{id, petId, petName, fromUser, content, reply, replyTime, time, read}]
    weather: { date:'', type:'sunny', season:'spring' }, // 天气与季节
    travelers: { lastDate:'', helpedCount:0, mapFragments:0, treasureClaimed:false }, // 旅行者
    drawings: [],                  // 悄悄画 [{id, petId, dataURL, petComment, time}]
    badges: [],                    // 已获得徽章ID列表
    title: null,                   // 当前佩戴的称号ID
    gameStats: {                   // 游戏中心统计
      raceTotalScore: 0,           // 赛车累计得分
      raceBestScore: 0,            // 赛车最高分
      racePlays: 0,                // 赛车游玩次数
      paintRainbows: 0,            // 小画家累计彩虹数
      paintPlays: 0,               // 小画家游玩次数
      memoryClears: 0,             // 记忆大厨通关次数
      memoryPlays: 0,              // 记忆大厨游玩次数
      rhythmPlays: 0,              // 节奏摇摆游玩次数
      rhythmPerfect10: 0,          // 节奏10连Perfect次数
      recentGameType: '',          // 最近连续游玩的游戏类型
      recentGameCount: 0,          // 连续玩同一款游戏的次数
      dailyRhythmRewardCount: 0,   // 节奏摇摆今日奖励次数
      dailyRhythmDate: '',         // 节奏摇摆计数日期
    },
    sound: { bgm:true, effect:true }, // 音效开关
    stats: {                       // 统计数据（用于学习报告）
      weekStart: '',               // 周一日期
      weekTasks: 0,
      weekAnswers: 0,
      weekCoins: 0,
      weekIntimacyStart: 0,
    },
  };
}

// 创建一只宠物实例
function makePet(defId, name) {
  const def = window.GAME_DATA.PET_DEFS[defId];
  const id = defId + '_' + Date.now() + '_' + Math.floor(Math.random()*1000);
  return {
    id,
    defId,
    name: name || def.name,
    hunger: defId === 'dog' ? 80 : 50,
    mood: defId === 'dog' ? 80 : 50,
    intimacy: 0,
    level: 1,
    exp: 0,
    sick: false,
    wearings: { head:null, body:null, face:null, back:null }, // 佩戴的饰品itemId
    house: 'livingroom', // livingroom 大客厅 / 自己的独立小窝id
    lastUpdate: Date.now(),
  };
}

const Storage = {
  state: null,

  // 加载存档
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        // 合并默认值，避免新字段缺失
        const def = getDefaultState();
        this.state = Object.assign({}, def, saved);
        // 深度合并嵌套对象
        this.state.parentSettings = Object.assign({}, def.parentSettings, saved.parentSettings||{});
        this.state.useTimeToday = Object.assign({}, def.useTimeToday, saved.useTimeToday||{});
        this.state.dailyMiniGame = Object.assign({}, def.dailyMiniGame, saved.dailyMiniGame||{});
        this.state.monthCard = Object.assign({}, def.monthCard, saved.monthCard||{});
        this.state.monthlyChallenge = Object.assign({}, def.monthlyChallenge, saved.monthlyChallenge||{});
        this.state.sound = Object.assign({}, def.sound, saved.sound||{});
        this.state.dailyPlayAll = Object.assign({}, def.dailyPlayAll, saved.dailyPlayAll||{});
        this.state.dailyAccountReward = Object.assign({}, def.dailyAccountReward, saved.dailyAccountReward||{});
        this.state.englishProgress = Object.assign({}, def.englishProgress, saved.englishProgress||{});
        this.state.weather = Object.assign({}, def.weather, saved.weather||{});
        this.state.travelers = Object.assign({}, def.travelers, saved.travelers||{});
        this.state.letters = saved.letters || [];
        this.state.drawings = saved.drawings || [];
        this.state.badges = saved.badges || [];
        this.state.title = saved.title || null;
        this.state.gameStats = Object.assign({}, def.gameStats, saved.gameStats||{});
      } else {
        this.state = getDefaultState();
        this.save();
      }
    } catch (e) {
      console.error('加载存档失败', e);
      this.state = getDefaultState();
    }
    return this.state;
  },

  // 保存存档
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('保存失败', e);
      alert('存储空间不足，请清理部分照片');
    }
  },

  // 重置存档
  reset() {
    if (confirm('确定要重置所有数据吗？此操作不可恢复！')) {
      localStorage.removeItem(STORAGE_KEY);
      this.state = getDefaultState();
      this.save();
      location.reload();
    }
  },

  // 获取今天日期字符串
  todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
  },

  // 获取周一日期字符串
  mondayStr() {
    const d = new Date();
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1);
    return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
  },

  // 获取月份字符串
  monthStr() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth()+1);
  },
};

window.Storage = Storage;
window.makePet = makePet;
