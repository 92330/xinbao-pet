/**
 * 欣宝小宠 - 静态数据层
 * 包含：宠物、饰品、家具、食物、地图、礼包、成就、题库
 */

// ============ 宠物定义 ============
const PET_DEFS = {
  dog:      { id:'dog',      name:'小奶狗', emoji:'🐶', price:0,    desc:'默认伙伴可可', color:'#C8924A' },
  cat:      { id:'cat',      name:'小奶猫', emoji:'🐱', price:1200, desc:'软糯爱撒娇',   color:'#E8E1D5' },
  hamster:  { id:'hamster',  name:'小仓鼠', emoji:'🐹', price:1100, desc:'圆滚滚小可爱', color:'#E5C99A' },
  rabbit:   { id:'rabbit',   name:'垂耳兔', emoji:'🐰', price:1500, desc:'长耳朵软萌',   color:'#F0E4DC' },
  raccoon:  { id:'raccoon',  name:'小浣熊', emoji:'🦝', price:3000, desc:'爱干净的小偷', color:'#9C9C9C' },
  fox:      { id:'fox',      name:'小狐狸', emoji:'🦊', price:1800, desc:'机灵又漂亮',   color:'#E07B3E' },
  koala:    { id:'koala',    name:'小考拉', emoji:'🐨', price:2800, desc:'抱树小懒虫',   color:'#B0B0B0' },
  panda:    { id:'panda',    name:'小熊猫', emoji:'🐼', price:2200, desc:'国宝小团子',   color:'#F5F5F5' },
  hedgehog: { id:'hedgehog', name:'小刺猬', emoji:'🦔', price:1900, desc:'尖刺软心肠',   color:'#A0826D' },
  penguin:  { id:'penguin',  name:'小企鹅', emoji:'🐧', price:2500, desc:'摇摇摆摆走',   color:'#3A3A3A' },
  deer:     { id:'deer',     name:'小鹿',   emoji:'🦌', price:3200, desc:'林间小精灵',   color:'#A0744A' },
  squirrel: { id:'squirrel', name:'小松鼠', emoji:'🐿️', price:1600, desc:'爱藏小松果',   color:'#C8804A' },
  corgi:    { id:'corgi',    name:'小柯基', emoji:'🐾', price:2000, desc:'小短腿大屁屁', color:'#E5A865' },
};

// ============ 食物定义 ============
const FOOD_DEFS = [
  { id:'f_food',  name:'口粮',     emoji:'🍖', price:30,  effect:{hunger:30},                 desc:'恢复30饱腹度' },
  { id:'f_snack', name:'小零食',   emoji:'🍪', price:20,  effect:{hunger:10, mood:5},         desc:'饱腹+10 心情+5' },
  { id:'cake',    name:'小蛋糕',   emoji:'🍰', price:60,  effect:{hunger:20, mood:15},        desc:'饱腹+20 心情+15' },
  { id:'fish',    name:'小鱼干',   emoji:'🐟', price:40,  effect:{hunger:15, mood:8},         desc:'饱腹+15 心情+8' },
  { id:'milk',    name:'牛奶',     emoji:'🥛', price:35,  effect:{hunger:12, mood:6},         desc:'饱腹+12 心情+6' },
  { id:'bone',    name:'大骨头',   emoji:'🦴', price:50,  effect:{hunger:25},                 desc:'恢复25饱腹度' },
  { id:'carrot',  name:'胡萝卜',   emoji:'🥕', price:25,  effect:{hunger:10, mood:3},         desc:'饱腹+10 心情+3' },
  { id:'apple',   name:'红苹果',   emoji:'🍎', price:20,  effect:{hunger:8, mood:5},          desc:'饱腹+8 心情+5' },
  { id:'banana',  name:'香蕉',     emoji:'🍌', price:20,  effect:{hunger:8, mood:5},          desc:'饱腹+8 心情+5' },
  { id:'honey',   name:'蜂蜜罐',   emoji:'🍯', price:80,  effect:{hunger:15, mood:25},        desc:'心情大补+25' },
  { id:'icecream',name:'冰淇淋',   emoji:'🍦', price:70,  effect:{hunger:10, mood:20},        desc:'心情+20' },
  { id:'medicine',name:'感冒药',   emoji:'💊', price:50,  effect:{cure:true},                 desc:'治愈生病宠物' },
];

// ============ 饰品定义（图层叠加） ============
// slot: head 头部 / body 身体 / face 脸部 / back 背部
const ACCESSORY_DEFS = [
  { id:'bow_red',    name:'蝴蝶结(红)', emoji:'🎀', price:80,  slot:'head', mood:10, desc:'心情+10' },
  { id:'bow_pink',   name:'蝴蝶结(粉)', emoji:'🎀', price:80,  slot:'head', mood:10, desc:'心情+10' },
  { id:'bow_blue',   name:'蝴蝶结(蓝)', emoji:'🎀', price:80,  slot:'head', mood:10, desc:'心情+10' },
  { id:'crown',      name:'小皇冠',     emoji:'👑', price:200, slot:'head', mood:20, desc:'心情+20' },
  { id:'helmet',     name:'小头盔',     emoji:'⛑️', price:120, slot:'head', mood:8,  desc:'心情+8' },
  { id:'shirt_y',    name:'小T恤(黄)',  emoji:'👕', price:100, slot:'body', mood:12, desc:'心情+12' },
  { id:'shirt_p',    name:'小T恤(粉)',  emoji:'👚', price:100, slot:'body', mood:12, desc:'心情+12' },
  { id:'scarf',      name:'小围巾',     emoji:'🧣', price:90,  slot:'body', mood:8,  desc:'心情+8' },
  { id:'glasses',    name:'小墨镜',     emoji:'🕶️', price:110, slot:'face', mood:10, desc:'心情+10' },
  { id:'bag',        name:'小书包',     emoji:'🎒', price:130, slot:'back', mood:10, desc:'心情+10' },
];

// ============ 家具定义 ============
// size: [w, h] 占用网格
const FURNITURE_DEFS = [
  { id:'bed_small',  name:'温馨小窝',   emoji:'🛏️', price:200, size:[2,2], buff:'亲密恢复×1.5', desc:'亲密+10' },
  { id:'bed_big',    name:'豪华大别墅', emoji:'🏠', price:500, size:[3,3], buff:'亲密恢复×2',   desc:'亲密+25' },
  { id:'plush',      name:'毛绒玩具',   emoji:'🧸', price:120, size:[1,1], buff:'心情+1/小时',  desc:'心情光环' },
  { id:'frisbee',    name:'飞盘',       emoji:'🥏', price:150, size:[1,1], buff:'飞盘+5亲密',   desc:'飞盘加成' },
  { id:'yarn',       name:'毛线球',     emoji:'🧶', price:150, size:[1,1], buff:'逗猫+5亲密',   desc:'逗猫加成' },
  { id:'bath',       name:'宠物浴缸',   emoji:'🛁', price:250, size:[2,2], buff:'洗澡+5亲密',   desc:'洗澡加成' },
  { id:'fence',      name:'小栅栏',     emoji:'🚧', price:150, size:[1,3], buff:'美化',         desc:'装饰' },
  { id:'flower',     name:'花坛',       emoji:'🌷', price:200, size:[2,2], buff:'美化',         desc:'装饰' },
  { id:'flag',       name:'彩旗串',     emoji:'🎏', price:180, size:[3,1], buff:'心情+3/小时',  desc:'心情光环' },
  { id:'swing',      name:'大树秋千',   emoji:'🌳', price:300, size:[2,2], buff:'秋千心情+5',   desc:'互动' },
  { id:'fountain',   name:'小喷泉',     emoji:'⛲', price:350, size:[2,2], buff:'心情+2/小时',  desc:'心情光环' },
];

// ============ 地图定义 ============
const MAP_DEFS = [
  {
    id:'park', name:'公园', icon:'🏞️', price:2000, needIntimacy:200, needPets:0,
    bg:'#C8E6C9', dailyReward:'散步捡10-50金币',
    elements:[
      { id:'tree',   emoji:'🌳', x:15, y:30, reward:{coin:5},  label:'摇树' },
      { id:'bench',  emoji:'🪑', x:60, y:50, reward:{mood:3},  label:'长椅' },
      { id:'flower', emoji:'🌸', x:80, y:70, reward:{mood:2},  label:'赏花' },
    ]
  },
  {
    id:'forest', name:'森林', icon:'🌳', price:4000, needIntimacy:350, needPets:0,
    bg:'#A5D6A7', dailyReward:'采摘得随机食物',
    elements:[
      { id:'mushroom', emoji:'🍄', x:20, y:40, reward:{mood:5},       label:'蘑菇' },
      { id:'butterfly',emoji:'🦋', x:55, y:25, reward:{mood:5},       label:'蝴蝶' },
      { id:'hole',     emoji:'🕳️', x:75, y:60, reward:{coin:6},       label:'树洞' },
    ]
  },
  {
    id:'beach', name:'海滩', icon:'🏖️', price:3500, needIntimacy:500, needPets:0,
    bg:'#FFE0B2', dailyReward:'贝壳宝箱开30-80金',
    elements:[
      { id:'coconut',emoji:'🥥', x:15, y:30, reward:{coin:10}, label:'椰子' },
      { id:'crab',   emoji:'🦀', x:50, y:55, reward:{mood:5},  label:'螃蟹' },
      { id:'wave',   emoji:'🌊', x:78, y:70, reward:{mood:10}, label:'海浪' },
    ]
  },
  {
    id:'spa', name:'温泉', icon:'♨️', price:4500, needIntimacy:600, needPets:0,
    bg:'#B2DFDB', dailyReward:'所有宠物心情+20',
    elements:[
      { id:'bamboo', emoji:'🎋', x:18, y:35, reward:{coin:5},  label:'竹筒' },
      { id:'stone',  emoji:'🪨', x:55, y:55, reward:{coin:10}, label:'石头' },
      { id:'cup',    emoji:'🍵', x:78, y:30, reward:{mood:5},  label:'茶杯' },
    ]
  },
  {
    id:'snow', name:'雪山', icon:'🏔️', price:5000, needIntimacy:800, needPets:0,
    bg:'#E1F5FE', dailyReward:'滑雪赢双倍金币卡',
    elements:[
      { id:'snowflake', emoji:'❄️', x:20, y:30, reward:{coin:2},  label:'雪花' },
      { id:'sled',      emoji:'🛷', x:55, y:55, reward:{mood:8},  label:'雪橇' },
      { id:'pine',      emoji:'🌲', x:78, y:65, reward:{coin:5},  label:'松树' },
    ]
  },
  {
    id:'castle', name:'城堡', icon:'🏰', price:8000, needIntimacy:0, needPets:3,
    bg:'#F8BBD0', dailyReward:'签到领100-200金+道具',
    elements:[
      { id:'flag',   emoji:'🚩', x:18, y:30, reward:{coin:5},  label:'旗帜' },
      { id:'garden', emoji:'🌹', x:50, y:60, reward:{coin:3},  label:'花园' },
      { id:'gate',   emoji:'🏰', x:75, y:45, reward:{coin:30}, label:'城门' },
    ]
  },
  {
    id:'magic', name:'魔法学院', icon:'🌌', price:10000, needIntimacy:0, needPets:5,
    bg:'#7B1FA2', dailyReward:'当日答题双倍金币',
    elements:[
      { id:'star',    emoji:'⭐', x:18, y:30, reward:{coin:5},  label:'星星' },
      { id:'broom',   emoji:'🧹', x:50, y:55, reward:{mood:10}, label:'扫帚' },
      { id:'book',    emoji:'📖', x:78, y:35, reward:{item:'random'}, label:'魔法书' },
      { id:'crystal', emoji:'🔮', x:40, y:75, reward:{luck:true}, label:'水晶球' },
    ]
  },
];

// ============ 礼包/道具 ============
const PACKAGE_DEFS = [
  { id:'coupon_interact', name:'互动券×5',   emoji:'🎟️', price:80,  desc:'抵扣5次互动金币', type:'coupon', count:5 },
  { id:'coupon_food',     name:'食物礼包',   emoji:'🎁', price:200, desc:'随机5个食物',     type:'food_pack' },
  { id:'double_coin',     name:'双倍金币卡', emoji:'💳', price:300, desc:'任务金币×2 一天', type:'buff' },
  { id:'month_card',      name:'月卡',       emoji:'💎', price:1000,desc:'每日领100金 30天',type:'month_card' },
  { id:'mystery_box',     name:'神秘礼盒',   emoji:'🎈', price:500, desc:'随机大奖',       type:'mystery' },
];

// ============ 互动动作 ============
const INTERACTIONS = [
  { id:'pet',    name:'摸摸头', emoji:'🤚', intimacy:5,  anim:'happy' },
  { id:'bath',   name:'洗澡',   emoji:'🛁', intimacy:8,  anim:'bubble' },
  { id:'frisbee',name:'玩飞盘', emoji:'🥏', intimacy:10, anim:'run' },
  { id:'lift',   name:'举高高', emoji:'🙌', intimacy:6,  anim:'jump' },
  { id:'comb',   name:'梳毛',   emoji:'🪮', intimacy:7,  anim:'shine' },
];

// ============ 技能解锁 ============
const SKILL_DEFS = {
  3: { id:'spin',    name:'转圈圈', mood:3,  emoji:'🔄' },
  5: { id:'roll',    name:'翻跟头', mood:5,  emoji:'🤸' },
  7: { id:'dance',   name:'跳舞',   mood:8,  emoji:'💃' },
  9: { id:'cute',    name:'卖萌',   mood:10, emoji:'🥺' },
};

// ============ 成就 ============
const ACHIEVEMENTS = [
  { id:'rich_10k',    name:'攒够10000金币', reward:'限定金色背景',  check:(s)=>s.coin>=10000 },
  { id:'pets_5',      name:'拥有5只宠物',   reward:'限定彩虹背景',  check:(s)=>s.pets.length>=5 },
  { id:'intimacy_max',name:'亲密度满级',    reward:'限定爱心背景',  check:(s)=>s.pets.some(p=>p.intimacy>=1000) },
  { id:'maps_all',    name:'解锁全部地图',  reward:'限定传说背景',  check:(s)=>s.unlockedMaps.length>=7 },
  { id:'sign_7',      name:'连续签到7天',   reward:'神秘礼盒×1',    check:(s)=>s.signStreak>=7 },
];

// ============ 随机事件库 ============
const RANDOM_EVENTS = [
  { id:'rain',    text:'🌧️ 下雨啦，宠物们凉爽开心~', effect:{mood:10} },
  { id:'sunny',   text:'☀️ 阳光明媚，心情大好！',    effect:{mood:15} },
  { id:'parcel',  text:'📦 收到一个神秘包裹！',       effect:{coin:20} },
  { id:'bird',    text:'🐦 小鸟来串门啦~',            effect:{mood:10} },
  { id:'lucky',   text:'🍀 走好运啦！',                effect:{coin:30} },
  { id:'chest',   text:'🗝️ 捡到一个宝箱，获得食物！', effect:{item:'f_snack'} },
];

// ============ 每日运势 ============
const FORTUNES = [
  { id:'task_double', text:'今日任务双倍金币',  effect:'task_double' },
  { id:'interact_boost', text:'今日互动亲密+50%', effect:'interact_boost' },
];

// ============ 预设任务 ============
const DEFAULT_TASKS = [
  { id:'t_math',   name:'口算10题',     reward:20, done:false },
  { id:'t_read',   name:'阅读短文',     reward:25, done:false },
  { id:'t_piano',  name:'练琴30分钟',   reward:30, done:false },
  { id:'t_bag',    name:'整理书包',     reward:10, done:false },
];

// ============ 示例题库 ============
// 结构: { version, grade, subject, question, options:[4], answer:0-3 }
const QUESTION_BANK = [
  // ===== 一年级 数学 =====
  { version:'人教版', grade:1, subject:'数学', question:'3 + 5 = ?', options:['6','7','8','9'], answer:2 },
  { version:'人教版', grade:1, subject:'数学', question:'9 - 4 = ?', options:['3','4','5','6'], answer:2 },
  { version:'人教版', grade:1, subject:'数学', question:'比5大3的数是？', options:['7','8','9','6'], answer:1 },
  { version:'人教版', grade:1, subject:'数学', question:'10里面有()个一', options:['1','10','100','5'], answer:1 },
  { version:'人教版', grade:1, subject:'数学', question:'7 + 2 = ?', options:['8','9','10','7'], answer:1 },
  { version:'人教版', grade:1, subject:'数学', question:'哪个数最大？', options:['8','6','9','7'], answer:2 },
  { version:'人教版', grade:1, subject:'数学', question:'15 - 5 = ?', options:['5','10','15','20'], answer:1 },
  { version:'人教版', grade:1, subject:'数学', question:'2 + 8 = ?', options:['9','10','11','8'], answer:1 },
  { version:'人教版', grade:1, subject:'数学', question:'比10小1的数是？', options:['8','9','11','7'], answer:1 },
  { version:'人教版', grade:1, subject:'数学', question:'6 + 6 = ?', options:['10','11','12','13'], answer:2 },

  // ===== 一年级 语文 =====
  { version:'人教版', grade:1, subject:'语文', question:'"天"字共有几笔？', options:['2','3','4','5'], answer:2 },
  { version:'人教版', grade:1, subject:'语文', question:'"上"的反义词是？', options:['下','左','右','前'], answer:0 },
  { version:'人教版', grade:1, subject:'语文', question:'"一"的笔画是？', options:['横','竖','撇','捺'], answer:0 },
  { version:'人教版', grade:1, subject:'语文', question:'"大"的反义词是？', options:['小','多','高','长'], answer:0 },
  { version:'人教版', grade:1, subject:'语文', question:'哪个是正确的笔顺"口"？', options:['先竖后横','先横后竖','先撇后捺','随便'], answer:1 },
  { version:'人教版', grade:1, subject:'语文', question:'"日"字有几笔？', options:['3','4','5','6'], answer:1 },
  { version:'人教版', grade:1, subject:'语文', question:'"水"的反义词是？', options:['火','山','土','风'], answer:0 },
  { version:'人教版', grade:1, subject:'语文', question:'"月"是几笔？', options:['3','4','5','6'], answer:1 },
  { version:'人教版', grade:1, subject:'语文', question:'"山"字像什么？', options:['山','水','火','木'], answer:0 },
  { version:'人教版', grade:1, subject:'语文', question:'"木"加一笔是？', options:['本','禾','末','以上都是'], answer:3 },

  // ===== 一年级 英语 =====
  { version:'人教版', grade:1, subject:'英语', question:'apple 是什么？', options:['香蕉','苹果','橘子','梨'], answer:1 },
  { version:'人教版', grade:1, subject:'英语', question:'cat 是？', options:['狗','猫','鸟','鱼'], answer:1 },
  { version:'人教版', grade:1, subject:'英语', question:'"红色"的英文是？', options:['red','blue','green','yellow'], answer:0 },
  { version:'人教版', grade:1, subject:'英语', question:'one 的意思是？', options:['一','二','三','四'], answer:0 },
  { version:'人教版', grade:1, subject:'英语', question:'hello 表示？', options:['再见','你好','谢谢','对不起'], answer:1 },
  { version:'人教版', grade:1, subject:'英语', question:'dog 是？', options:['猫','狗','鸟','鱼'], answer:1 },
  { version:'人教版', grade:1, subject:'英语', question:'"蓝色"的英文是？', options:['red','blue','green','yellow'], answer:1 },
  { version:'人教版', grade:1, subject:'英语', question:'three 表示？', options:['一','二','三','四'], answer:2 },
  { version:'人教版', grade:1, subject:'英语', question:'sun 是？', options:['月亮','太阳','星星','云'], answer:1 },
  { version:'人教版', grade:1, subject:'英语', question:'thank you 是？', options:['你好','谢谢','再见','对不起'], answer:1 },

  // ===== 二年级 数学 =====
  { version:'人教版', grade:2, subject:'数学', question:'23 + 15 = ?', options:['35','38','37','40'], answer:1 },
  { version:'人教版', grade:2, subject:'数学', question:'50 - 18 = ?', options:['32','33','31','30'], answer:0 },
  { version:'人教版', grade:2, subject:'数学', question:'3 × 4 = ?', options:['7','12','14','16'], answer:1 },
  { version:'人教版', grade:2, subject:'数学', question:'15 ÷ 3 = ?', options:['3','4','5','6'], answer:2 },
  { version:'人教版', grade:2, subject:'数学', question:'1米 = ()厘米', options:['10','100','1000','50'], answer:1 },
  { version:'人教版', grade:2, subject:'数学', question:'6 × 7 = ?', options:['36','42','48','40'], answer:1 },
  { version:'人教版', grade:2, subject:'数学', question:'24 ÷ 6 = ?', options:['3','4','5','6'], answer:1 },
  { version:'人教版', grade:2, subject:'数学', question:'1小时 = ()分', options:['30','60','100','24'], answer:1 },
  { version:'人教版', grade:2, subject:'数学', question:'8 × 9 = ?', options:['64','72','81','72'], answer:1 },
  { version:'人教版', grade:2, subject:'数学', question:'35 + 27 = ?', options:['52','62','61','72'], answer:1 },
  { version:'人教版', grade:2, subject:'数学', question:'7 × 8 = ?', options:['54','56','58','64'], answer:1 },
  { version:'人教版', grade:2, subject:'数学', question:'45 - 19 = ?', options:['16','26','36','25'], answer:1 },
  { version:'人教版', grade:2, subject:'数学', question:'9 × 5 = ?', options:['40','45','50','55'], answer:1 },
  { version:'人教版', grade:2, subject:'数学', question:'36 ÷ 4 = ?', options:['8','9','7','6'], answer:1 },
  { version:'人教版', grade:2, subject:'数学', question:'1分米 = ()厘米', options:['1','10','100','5'], answer:1 },
  { version:'人教版', grade:2, subject:'数学', question:'4 × 6 = ?', options:['20','24','28','30'], answer:1 },
  { version:'人教版', grade:2, subject:'数学', question:'72 ÷ 8 = ?', options:['8','9','7','10'], answer:1 },
  { version:'人教版', grade:2, subject:'数学', question:'56 + 28 = ?', options:['74','84','94','78'], answer:1 },
  { version:'人教版', grade:2, subject:'数学', question:'3 × 9 = ?', options:['21','27','24','30'], answer:1 },
  { version:'人教版', grade:2, subject:'数学', question:'100 - 37 = ?', options:['53','63','73','60'], answer:1 },

  // ===== 二年级 语文 =====
  { version:'人教版', grade:2, subject:'语文', question:'"美丽"的近义词是？', options:['丑陋','漂亮','高大','矮小'], answer:1 },
  { version:'人教版', grade:2, subject:'语文', question:'"快"的反义词是？', options:['慢','高','大','远'], answer:0 },
  { version:'人教版', grade:2, subject:'语文', question:'"草"是()结构', options:['上下','左右','半包围','全包围'], answer:0 },
  { version:'人教版', grade:2, subject:'语文', question:'"明"由哪两字组成？', options:['日和月','日和星','水和月','山和月'], answer:0 },
  { version:'人教版', grade:2, subject:'语文', question:'"高兴"的反义词是？', options:['开心','悲伤','快乐','兴奋'], answer:1 },
  { version:'人教版', grade:2, subject:'语文', question:'"湖"的偏旁是？', options:['氵','木','日','口'], answer:0 },
  { version:'人教版', grade:2, subject:'语文', question:'"大树"的量词是？', options:['棵','个','条','只'], answer:0 },
  { version:'人教版', grade:2, subject:'语文', question:'"星星"是()结构', options:['上下','左右','半包围','全包围'], answer:0 },
  { version:'人教版', grade:2, subject:'语文', question:'"小"的反义词是？', options:['大','多','高','远'], answer:0 },
  { version:'人教版', grade:2, subject:'语文', question:'"春暖花开"形容哪个季节？', options:['春','夏','秋','冬'], answer:0 },
  { version:'人教版', grade:2, subject:'语文', question:'"树"的偏旁是？', options:['木','氵','日','口'], answer:0 },
  { version:'人教版', grade:2, subject:'语文', question:'"鸡"的偏旁是？', options:['鸟','木','氵','日'], answer:0 },
  { version:'人教版', grade:2, subject:'语文', question:'"看"是()结构', options:['上下','左右','半包围','全包围'], answer:0 },
  { version:'人教版', grade:2, subject:'语文', question:'"安静"的反义词是？', options:['吵闹','平静','舒适','干净'], answer:0 },
  { version:'人教版', grade:2, subject:'语文', question:'"红"的反义词是？', options:['绿','白','黑','黄'], answer:0 },
  { version:'人教版', grade:2, subject:'语文', question:'"早上"的反义词是？', options:['中午','晚上','下午','黎明'], answer:1 },
  { version:'人教版', grade:2, subject:'语文', question:'"远"的反义词是？', options:['近','长','高','大'], answer:0 },
  { version:'人教版', grade:2, subject:'语文', question:'"一()花"填量词', options:['朵','只','条','棵'], answer:0 },
  { version:'人教版', grade:2, subject:'语文', question:'"河"的偏旁是？', options:['氵','木','日','土'], answer:0 },
  { version:'人教版', grade:2, subject:'语文', question:'"明"是()结构', options:['左右','上下','半包围','全包围'], answer:0 },

  // ===== 二年级 英语 =====
  { version:'人教版', grade:2, subject:'英语', question:'banana 是？', options:['苹果','香蕉','橘子','葡萄'], answer:1 },
  { version:'人教版', grade:2, subject:'英语', question:'"星期一"是？', options:['Monday','Sunday','Friday','Tuesday'], answer:0 },
  { version:'人教版', grade:2, subject:'英语', question:'five + three = ?', options:['six','seven','eight','nine'], answer:2 },
  { version:'人教版', grade:2, subject:'英语', question:'teacher 是？', options:['学生','老师','医生','工人'], answer:1 },
  { version:'人教版', grade:2, subject:'英语', question:'"绿色"是？', options:['red','blue','green','yellow'], answer:2 },
  { version:'人教版', grade:2, subject:'英语', question:'book 是？', options:['笔','书','桌','椅'], answer:1 },
  { version:'人教版', grade:2, subject:'英语', question:'"妈妈"是？', options:['father','mother','sister','brother'], answer:1 },
  { version:'人教版', grade:2, subject:'英语', question:'water 是？', options:['火','水','土','风'], answer:1 },
  { version:'人教版', grade:2, subject:'英语', question:'"夏天"是？', options:['spring','summer','autumn','winter'], answer:1 },
  { version:'人教版', grade:2, subject:'英语', question:'happy 是？', options:['伤心','开心','生气','害怕'], answer:1 },
  { version:'人教版', grade:2, subject:'英语', question:'"爸爸"是？', options:['father','mother','sister','brother'], answer:0 },
  { version:'人教版', grade:2, subject:'英语', question:'cat 是？', options:['猫','狗','鸟','鱼'], answer:0 },
  { version:'人教版', grade:2, subject:'英语', question:'"红色"是？', options:['red','blue','green','yellow'], answer:0 },
  { version:'人教版', grade:2, subject:'英语', question:'school 是？', options:['家','学校','公园','医院'], answer:1 },
  { version:'人教版', grade:2, subject:'英语', question:'"冬天"是？', options:['spring','summer','autumn','winter'], answer:3 },
  { version:'人教版', grade:2, subject:'英语', question:'six + two = ?', options:['seven','eight','nine','ten'], answer:1 },
  { version:'人教版', grade:2, subject:'英语', question:'pen 是？', options:['铅笔','钢笔','橡皮','尺子'], answer:1 },
  { version:'人教版', grade:2, subject:'英语', question:'"你好"是？', options:['hello','bye','sorry','thanks'], answer:0 },
  { version:'人教版', grade:2, subject:'英语', question:'star 是？', options:['月亮','太阳','星星','云'], answer:2 },
  { version:'人教版', grade:2, subject:'英语', question:'"春天"是？', options:['spring','summer','autumn','winter'], answer:0 },

  // ===== 三年级 数学 =====
  { version:'人教版', grade:3, subject:'数学', question:'125 × 4 = ?', options:['400','500','600','450'], answer:1 },
  { version:'人教版', grade:3, subject:'数学', question:'72 ÷ 8 = ?', options:['8','9','7','10'], answer:1 },
  { version:'人教版', grade:3, subject:'数学', question:'1千米 = ()米', options:['100','1000','10000','10'], answer:1 },
  { version:'人教版', grade:3, subject:'数学', question:'长方形周长公式？', options:['长×宽','(长+宽)×2','长+宽','长×2'], answer:1 },
  { version:'人教版', grade:3, subject:'数学', question:'0.5 = ()', options:['1/2','1/5','5/10','5'], answer:0 },
  { version:'人教版', grade:3, subject:'数学', question:'1吨 = ()千克', options:['100','1000','10000','10'], answer:1 },
  { version:'人教版', grade:3, subject:'数学', question:'360 ÷ 6 = ?', options:['50','60','70','80'], answer:1 },
  { version:'人教版', grade:3, subject:'数学', question:'25 × 40 = ?', options:['100','1000','10000','400'], answer:1 },
  { version:'人教版', grade:3, subject:'数学', question:'1元 = ()角', options:['1','10','100','5'], answer:1 },
  { version:'人教版', grade:3, subject:'数学', question:'正方形有()条边', options:['3','4','5','6'], answer:1 },

  // ===== 三年级 语文 =====
  { version:'人教版', grade:3, subject:'语文', question:'"守株待兔"告诉我们？', options:['要努力','等运气','要勇敢','要聪明'], answer:0 },
  { version:'人教版', grade:3, subject:'语文', question:'"芬芳"形容？', options:['颜色','香味','声音','形状'], answer:1 },
  { version:'人教版', grade:3, subject:'语文', question:'"鸦雀无声"形容？', options:['很吵','很安静','很多鸟','没食物'], answer:1 },
  { version:'人教版', grade:3, subject:'语文', question:'"春"的偏旁是？', options:['日','艹','木','氵'], answer:0 },
  { version:'人教版', grade:3, subject:'语文', question:'"美丽"和"漂亮"是？', options:['反义词','近义词','同音词','无关'], answer:1 },
  { version:'人教版', grade:3, subject:'语文', question:'"金秋"指哪个季节？', options:['春','夏','秋','冬'], answer:2 },
  { version:'人教版', grade:3, subject:'语文', question:'"高"的反义词是？', options:['低','大','远','长'], answer:0 },
  { version:'人教版', grade:3, subject:'语文', question:'"一()小船"填量词', options:['只','艘','叶','艘或叶都对'], answer:3 },
  { version:'人教版', grade:3, subject:'语文', question:'"安静的图书馆"是？', options:['比喻','拟人','夸张','形容'], answer:3 },
  { version:'人教版', grade:3, subject:'语文', question:'"花"的部首是？', options:['艹','木','日','氵'], answer:0 },

  // ===== 三年级 英语 =====
  { version:'人教版', grade:3, subject:'英语', question:'Monday 后面是？', options:['Sunday','Tuesday','Friday','Saturday'], answer:1 },
  { version:'人教版', grade:3, subject:'英语', question:'"12"用英文是？', options:['twelve','twenty','two','twelfth'], answer:0 },
  { version:'人教版', grade:3, subject:'英语', question:'I ___ a student.', options:['is','am','are','be'], answer:1 },
  { version:'人教版', grade:3, subject:'英语', question:'"颜色"是？', options:['colour','size','shape','light'], answer:0 },
  { version:'人教版', grade:3, subject:'英语', question:'she 是？', options:['他','她','它','我们'], answer:1 },
  { version:'人教版', grade:3, subject:'英语', question:'"周日"是？', options:['Monday','Sunday','Saturday','Friday'], answer:1 },
  { version:'人教版', grade:3, subject:'英语', question:'This is ___ apple.', options:['a','an','the','/'], answer:1 },
  { version:'人教版', grade:3, subject:'英语', question:'"书包"是？', options:['bag','desk','pen','book'], answer:0 },
  { version:'人教版', grade:3, subject:'英语', question:'How ___ you?', options:['is','am','are','be'], answer:2 },
  { version:'人教版', grade:3, subject:'英语', question:'"白色"是？', options:['white','black','red','blue'], answer:0 },

  // ===== 四年级 数学 =====
  { version:'人教版', grade:4, subject:'数学', question:'9999 + 1 = ?', options:['10000','1000','10001','9999'], answer:0 },
  { version:'人教版', grade:4, subject:'数学', question:'25 × 25 = ?', options:['600','625','650','525'], answer:1 },
  { version:'人教版', grade:4, subject:'数学', question:'1/2 + 1/4 = ?', options:['1/4','3/4','2/4','1/6'], answer:1 },
  { version:'人教版', grade:4, subject:'数学', question:'360° 是()角', options:['锐','直','平','周'], answer:3 },
  { version:'人教版', grade:4, subject:'数学', question:'小数0.3 = ()', options:['3/10','3/100','1/3','3'], answer:0 },
  { version:'人教版', grade:4, subject:'数学', question:'长方形面积 = ?', options:['长+宽','长×宽','(长+宽)×2','长×2'], answer:1 },
  { version:'人教版', grade:4, subject:'数学', question:'1平方米 = ()平方分米', options:['10','100','1000','10000'], answer:1 },
  { version:'人教版', grade:4, subject:'数学', question:'999 × 0 = ?', options:['999','0','1','99'], answer:1 },
  { version:'人教版', grade:4, subject:'数学', question:'直角 = ()度', options:['45','60','90','180'], answer:2 },
  { version:'人教版', grade:4, subject:'数学', question:'1/2 和 1/3 哪个大？', options:['1/2','1/3','相等','无法比较'], answer:0 },

  // ===== 四年级 语文 =====
  { version:'人教版', grade:4, subject:'语文', question:'"画蛇添足"意思是？', options:['多此一举','认真画','努力做','快做事'], answer:0 },
  { version:'人教版', grade:4, subject:'语文', question:'"风和日丽"形容？', options:['天气好','风大','雨大','天黑'], answer:0 },
  { version:'人教版', grade:4, subject:'语文', question:'"鹤立鸡群"形容？', options:['很普通','很突出','很矮小','很胆小'], answer:1 },
  { version:'人教版', grade:4, subject:'语文', question:'"骄傲"的反义词是？', options:['自豪','谦虚','自豪','得意'], answer:1 },
  { version:'人教版', grade:4, subject:'语文', question:'"清澈"形容什么？', options:['声音','水','颜色','风'], answer:1 },
  { version:'人教版', grade:4, subject:'语文', question:'"敏捷"的反义词是？', options:['灵活','迟钝','快速','聪明'], answer:1 },
  { version:'人教版', grade:4, subject:'语文', question:'"春华秋实"中"实"指？', options:['果实','实际','真实','结实'], answer:0 },
  { version:'人教版', grade:4, subject:'语文', question:'"狼吞虎咽"形容？', options:['吃相','走路','说话','睡觉'], answer:0 },
  { version:'人教版', grade:4, subject:'语文', question:'"洁白"的近义词是？', options:['黑暗','雪白','灰暗','彩色'], answer:1 },
  { version:'人教版', grade:4, subject:'语文', question:'"山清水秀"形容？', options:['风景美','人多','天热','风大'], answer:0 },

  // ===== 四年级 英语 =====
  { version:'人教版', grade:4, subject:'英语', question:'I have ___ English book.', options:['a','an','the','/'], answer:1 },
  { version:'人教版', grade:4, subject:'英语', question:'"星期三"是？', options:['Wednesday','Tuesday','Thursday','Friday'], answer:0 },
  { version:'人教版', grade:4, subject:'英语', question:'He ___ playing football.', options:['is','are','am','be'], answer:0 },
  { version:'人教版', grade:4, subject:'英语', question:'"医生"是？', options:['teacher','doctor','nurse','farmer'], answer:1 },
  { version:'人教版', grade:4, subject:'英语', question:'What ___ this?', options:['is','are','am','be'], answer:0 },
  { version:'人教版', grade:4, subject:'英语', question:'"冬天"是？', options:['spring','summer','autumn','winter'], answer:3 },
  { version:'人教版', grade:4, subject:'英语', question:'These ___ my books.', options:['is','are','am','be'], answer:1 },
  { version:'人教版', grade:4, subject:'英语', question:'"跑步"是？', options:['run','jump','swim','fly'], answer:0 },
  { version:'人教版', grade:4, subject:'英语', question:'Can you ___?', options:['swim','swims','swimming','swam'], answer:0 },
  { version:'人教版', grade:4, subject:'英语', question:'"漂亮的"是？', options:['beautiful','ugly','bad','small'], answer:0 },

  // ===== 五年级 数学 =====
  { version:'人教版', grade:5, subject:'数学', question:'1/3 + 1/6 = ?', options:['1/2','1/3','2/6','1/6'], answer:0 },
  { version:'人教版', grade:5, subject:'数学', question:'3.5 × 2 = ?', options:['6.5','7','7.5','8'], answer:1 },
  { version:'人教版', grade:5, subject:'数学', question:'12的因数有()个', options:['4','5','6','7'], answer:2 },
  { version:'人教版', grade:5, subject:'数学', question:'0.25 = ()', options:['1/4','1/25','25/100','1/2'], answer:0 },
  { version:'人教版', grade:5, subject:'数学', question:'圆周率π≈', options:['3.14','3.41','3.15','3.1'], answer:0 },
  { version:'人教版', grade:5, subject:'数学', question:'2/3 × 3 = ?', options:['2','3','6','1'], answer:0 },
  { version:'人教版', grade:5, subject:'数学', question:'1 = ()/4', options:['1','2','3','4'], answer:3 },
  { version:'人教版', grade:5, subject:'数学', question:'1.5 - 0.7 = ?', options:['0.7','0.8','0.9','1.0'], answer:1 },
  { version:'人教版', grade:5, subject:'数学', question:'质数有()个因数', options:['1','2','3','4'], answer:1 },
  { version:'人教版', grade:5, subject:'数学', question:'6/8 = ()/4', options:['2','3','4','5'], answer:1 },

  // ===== 五年级 语文 =====
  { version:'人教版', grade:5, subject:'语文', question:'"鞠躬尽瘁"形容谁？', options:['诸葛亮','李白','杜甫','孔子'], answer:0 },
  { version:'人教版', grade:5, subject:'语文', question:'"卧薪尝胆"的主人公？', options:['勾践','项羽','刘邦','曹操'], answer:0 },
  { version:'人教版', grade:5, subject:'语文', question:'"廉颇老矣"出自？', options:['辛弃疾','李白','杜甫','苏轼'], answer:0 },
  { version:'人教版', grade:5, subject:'语文', question:'"草原"作者？', options:['老舍','巴金','鲁迅','冰心'], answer:0 },
  { version:'人教版', grade:5, subject:'语文', question:'"将相和"讲谁的故事？', options:['廉颇蔺相如','管仲鲍叔牙','刘备关羽','伯牙子期'], answer:0 },
  { version:'人教版', grade:5, subject:'语文', question:'"珍惜"的近义词？', options:['浪费','爱护','糟蹋','挥霍'], answer:1 },
  { version:'人教版', grade:5, subject:'语文', question:'"峥嵘岁月"形容？', options:['平凡日子','不平凡岁月','美好时光','短暂时光'], answer:1 },
  { version:'人教版', grade:5, subject:'语文', question:'"画龙点睛"意思是？', options:['关键处点明','画得好','看清楚','说话快'], answer:0 },
  { version:'人教版', grade:5, subject:'语文', question:'"骄傲"是()词', options:['褒义','贬义','中性','感叹'], answer:2 },
  { version:'人教版', grade:5, subject:'语文', question:'"狼牙山五壮士"是？', options:['神话','真实故事','寓言','童话'], answer:1 },

  // ===== 五年级 英语 =====
  { version:'人教版', grade:5, subject:'英语', question:'I ___ to school every day.', options:['go','goes','going','went'], answer:0 },
  { version:'人教版', grade:5, subject:'英语', question:'"图书馆"是？', options:['library','lab','classroom','office'], answer:0 },
  { version:'人教版', grade:5, subject:'英语', question:'She ___ a teacher.', options:['is','are','am','be'], answer:0 },
  { version:'人教版', grade:5, subject:'英语', question:'"星期六"是？', options:['Saturday','Sunday','Monday','Friday'], answer:0 },
  { version:'人教版', grade:5, subject:'英语', question:'There ___ a book on the desk.', options:['is','are','am','be'], answer:0 },
  { version:'人教版', grade:5, subject:'英语', question:'"游泳"是？', options:['swim','run','jump','walk'], answer:0 },
  { version:'人教版', grade:5, subject:'英语', question:'What ___ you doing?', options:['are','is','am','be'], answer:0 },
  { version:'人教版', grade:5, subject:'英语', question:'"鸟"是？', options:['bird','dog','cat','fish'], answer:0 },
  { version:'人教版', grade:5, subject:'英语', question:'I like ___ music.', options:['listening to','listen','listened','listens'], answer:0 },
  { version:'人教版', grade:5, subject:'英语', question:'"医院"是？', options:['hospital','school','park','shop'], answer:0 },

  // ===== 六年级 数学 =====
  { version:'人教版', grade:6, subject:'数学', question:'圆的面积公式？', options:['πr','πr²','2πr','πd'], answer:1 },
  { version:'人教版', grade:6, subject:'数学', question:'1/2 = ()%', options:['25%','50%','75%','100%'], answer:1 },
  { version:'人教版', grade:6, subject:'数学', question:'2:3 = ()/9', options:['4','5','6','7'], answer:2 },
  { version:'人教版', grade:6, subject:'数学', question:'(-3) + 5 = ?', options:['2','-2','8','-8'], answer:0 },
  { version:'人教版', grade:6, subject:'数学', question:'20% of 50 = ?', options:['5','10','15','20'], answer:1 },
  { version:'人教版', grade:6, subject:'数学', question:'圆的周长公式？', options:['πr','2πr','πr²','πd²'], answer:1 },
  { version:'人教版', grade:6, subject:'数学', question:'3/4 ÷ 1/2 = ?', options:['3/8','3/2','2/3','1/2'], answer:1 },
  { version:'人教版', grade:6, subject:'数学', question:'0.75 = ()%', options:['25%','50%','75%','100%'], answer:2 },
  { version:'人教版', grade:6, subject:'数学', question:'正方体有()条棱', options:['8','10','12','6'], answer:2 },
  { version:'人教版', grade:6, subject:'数学', question:'1/5 = ()%', options:['10%','15%','20%','25%'], answer:2 },

  // ===== 六年级 语文 =====
  { version:'人教版', grade:6, subject:'语文', question:'《匆匆》作者？', options:['朱自清','老舍','巴金','鲁迅'], answer:0 },
  { version:'人教版', grade:6, subject:'语文', question:'《卖火柴的小女孩》出自？', options:['安徒生童话','格林童话','伊索寓言','一千零一夜'], answer:0 },
  { version:'人教版', grade:6, subject:'语文', question:'"舍本逐末"意思是？', options:['抓重点','主次颠倒','认真做事','半途而废'], answer:1 },
  { version:'人教版', grade:6, subject:'语文', question:'《少年闰土》作者？', options:['鲁迅','老舍','巴金','冰心'], answer:0 },
  { version:'人教版', grade:6, subject:'语文', question:'"白雪公主"是()童话', options:['安徒生','格林','伊索','中国'], answer:1 },
  { version:'人教版', grade:6, subject:'语文', question:'"五彩缤纷"的近义词？', options:['色彩单一','五颜六色','黑白分明','暗淡无光'], answer:1 },
  { version:'人教版', grade:6, subject:'语文', question:'"粉骨碎身浑不怕"出自？', options:['石灰吟','静夜思','春晓','望庐山瀑布'], answer:0 },
  { version:'人教版', grade:6, subject:'语文', question:'"伯牙绝弦"讲什么？', options:['友情','爱情','亲情','师徒'], answer:0 },
  { version:'人教版', grade:6, subject:'语文', question:'"匆匆"是()文', options:['记叙','散文','诗歌','小说'], answer:1 },
  { version:'人教版', grade:6, subject:'语文', question:'"百川东到海"下一句？', options:['何时复西归','奔流到海不复回','一片孤城万仞山','孤帆远影碧空尽'], answer:0 },

  // ===== 六年级 英语 =====
  { version:'人教版', grade:6, subject:'英语', question:'I ___ my homework now.', options:['am doing','do','did','doing'], answer:0 },
  { version:'人教版', grade:6, subject:'英语', question:'"昨天"是？', options:['today','tomorrow','yesterday','now'], answer:2 },
  { version:'人教版', grade:6, subject:'英语', question:'She ___ to Beijing last week.', options:['go','goes','went','going'], answer:2 },
  { version:'人教版', grade:6, subject:'英语', question:'"教师"是？', options:['teacher','student','doctor','worker'], answer:0 },
  { version:'人教版', grade:6, subject:'英语', question:'I will ___ you tomorrow.', options:['see','saw','seeing','seen'], answer:0 },
  { version:'人教版', grade:6, subject:'英语', question:'"幸福的"是？', options:['happy','sad','angry','tired'], answer:0 },
  { version:'人教版', grade:6, subject:'英语', question:'He ___ TV every evening.', options:['watches','watch','watching','watched'], answer:0 },
  { version:'人教版', grade:6, subject:'英语', question:'"朋友"是？', options:['friend','family','teacher','student'], answer:0 },
  { version:'人教版', grade:6, subject:'英语', question:'There are 12 ___ in a year.', options:['month','months','day','days'], answer:1 },
  { version:'人教版', grade:6, subject:'英语', question:'"旅行"是？', options:['travel','work','study','play'], answer:0 },
];

// 题库扩展：北师大版 & 苏教版（复用人教版题目，保证每个版本都有充足题目）
function expandQuestionBank() {
  const extra = [];
  ['北师大版','苏教版'].forEach(ver => {
    QUESTION_BANK.forEach(q => {
      // 排除已经是该版本的题
      if (q.version !== ver) {
        extra.push({ ...q, version: ver });
      }
    });
  });
  QUESTION_BANK.push(...extra);
}
expandQuestionBank();

// 教材版本/年级/科目选项
const QUESTION_OPTIONS = {
  versions: ['人教版','北师大版','苏教版'],
  grades: [1,2,3,4,5,6],
  subjects: ['语文','数学','英语'],
};

// ============ 英语学习教材（外研版 二升三） ============
// 每单元包含若干单词/句子，学习后获金币奖励
const ENGLISH_LESSONS = [
  {
    unit: 1, title: '问候与自我介绍',
    words: [
      { en: 'hello', cn: '你好', example: 'Hello, I am Mingming.' },
      { en: 'hi', cn: '嗨', example: 'Hi, Sam!' },
      { en: 'goodbye', cn: '再见', example: 'Goodbye, Ms Smart.' },
      { en: 'bye', cn: '再见', example: 'Bye-bye!' },
      { en: 'I', cn: '我', example: 'I am a boy.' },
      { en: 'am', cn: '是', example: 'I am fine.' },
      { en: 'name', cn: '名字', example: 'My name is Amy.' },
      { en: 'my', cn: '我的', example: 'This is my book.' },
    ],
    sentence: 'Hello, my name is Amy. What\'s your name?',
  },
  {
    unit: 2, title: '数字1-10',
    words: [
      { en: 'one', cn: '一', example: 'I have one pen.' },
      { en: 'two', cn: '二', example: 'Two cats.' },
      { en: 'three', cn: '三', example: 'Three dogs.' },
      { en: 'four', cn: '四', example: 'Four birds.' },
      { en: 'five', cn: '五', example: 'Five books.' },
      { en: 'six', cn: '六', example: 'Six pencils.' },
      { en: 'seven', cn: '七', example: 'Seven apples.' },
      { en: 'eight', cn: '八', example: 'Eight oranges.' },
      { en: 'nine', cn: '九', example: 'Nine birds.' },
      { en: 'ten', cn: '十', example: 'Ten flowers.' },
    ],
    sentence: 'How many? One, two, three... ten!',
  },
  {
    unit: 3, title: '颜色',
    words: [
      { en: 'red', cn: '红色', example: 'It is red.' },
      { en: 'blue', cn: '蓝色', example: 'The sky is blue.' },
      { en: 'yellow', cn: '黄色', example: 'A yellow banana.' },
      { en: 'green', cn: '绿色', example: 'Green tree.' },
      { en: 'black', cn: '黑色', example: 'Black cat.' },
      { en: 'white', cn: '白色', example: 'White cloud.' },
      { en: 'pink', cn: '粉色', example: 'A pink flower.' },
      { en: 'orange', cn: '橙色', example: 'An orange orange.' },
    ],
    sentence: 'What colour is it? It is red and blue.',
  },
  {
    unit: 4, title: '家庭成员',
    words: [
      { en: 'mother', cn: '妈妈', example: 'This is my mother.' },
      { en: 'father', cn: '爸爸', example: 'My father is tall.' },
      { en: 'sister', cn: '姐妹', example: 'I have a sister.' },
      { en: 'brother', cn: '兄弟', example: 'My brother is little.' },
      { en: 'grandma', cn: '奶奶/外婆', example: 'Grandma is kind.' },
      { en: 'grandpa', cn: '爷爷/外公', example: 'Grandpa tells stories.' },
      { en: 'family', cn: '家庭', example: 'I love my family.' },
      { en: 'baby', cn: '宝宝', example: 'The baby is cute.' },
    ],
    sentence: 'This is my mother. This is my father.',
  },
  {
    unit: 5, title: '动物',
    words: [
      { en: 'cat', cn: '猫', example: 'I have a cat.' },
      { en: 'dog', cn: '狗', example: 'The dog is big.' },
      { en: 'bird', cn: '鸟', example: 'A bird can fly.' },
      { en: 'fish', cn: '鱼', example: 'Fish swim.' },
      { en: 'rabbit', cn: '兔子', example: 'A white rabbit.' },
      { en: 'pig', cn: '猪', example: 'The pig is pink.' },
      { en: 'duck', cn: '鸭子', example: 'A yellow duck.' },
      { en: 'cow', cn: '牛', example: 'The cow says moo.' },
    ],
    sentence: 'What is it? It is a cat. It is a dog.',
  },
  {
    unit: 6, title: '食物与饮料',
    words: [
      { en: 'apple', cn: '苹果', example: 'I like apples.' },
      { en: 'banana', cn: '香蕉', example: 'A yellow banana.' },
      { en: 'orange', cn: '橘子', example: 'An orange is sweet.' },
      { en: 'milk', cn: '牛奶', example: 'Drink milk every day.' },
      { en: 'water', cn: '水', example: 'I want water.' },
      { en: 'cake', cn: '蛋糕', example: 'A birthday cake.' },
      { en: 'bread', cn: '面包', example: 'Bread for breakfast.' },
      { en: 'rice', cn: '米饭', example: 'I eat rice.' },
    ],
    sentence: 'I like apples and bananas. Do you like milk?',
  },
  {
    unit: 7, title: '学校用品',
    words: [
      { en: 'book', cn: '书', example: 'Open your book.' },
      { en: 'pen', cn: '钢笔', example: 'This is my pen.' },
      { en: 'pencil', cn: '铅笔', example: 'A red pencil.' },
      { en: 'bag', cn: '书包', example: 'My school bag.' },
      { en: 'ruler', cn: '尺子', example: 'A long ruler.' },
      { en: 'eraser', cn: '橡皮', example: 'A white eraser.' },
      { en: 'desk', cn: '桌子', example: 'My desk is clean.' },
      { en: 'chair', cn: '椅子', example: 'Sit on the chair.' },
    ],
    sentence: 'What is in your bag? A book, a pen and a pencil.',
  },
  {
    unit: 8, title: '身体部位',
    words: [
      { en: 'head', cn: '头', example: 'Touch your head.' },
      { en: 'eye', cn: '眼睛', example: 'I have two eyes.' },
      { en: 'ear', cn: '耳朵', example: 'I have two ears.' },
      { en: 'nose', cn: '鼻子', example: 'Touch your nose.' },
      { en: 'mouth', cn: '嘴', example: 'Open your mouth.' },
      { en: 'hand', cn: '手', example: 'Wash your hands.' },
      { en: 'foot', cn: '脚', example: 'I have two feet.' },
      { en: 'face', cn: '脸', example: 'Wash your face.' },
    ],
    sentence: 'Touch your head. Touch your nose. Touch your eyes.',
  },
];

// 节日活动配置
const FESTIVALS = [
  { id:'halloween', name:'万圣节', date:'10-31', rule:'答题双倍金币', emoji:'🎃' },
  { id:'christmas', name:'圣诞节', date:'12-25', rule:'签到送礼盒',   emoji:'🎄' },
  { id:'spring',    name:'春节',   date:'02-10', rule:'领红包',       emoji:'🧧' },
  { id:'birthday',  name:'宠物生日',date:'05-20', rule:'亲密×3',       emoji:'🎂' },
];

// 月份挑战
const MONTHLY_CHALLENGES = [
  { id:'m1', name:'本月签到15天',  target:15, reward:'神秘礼盒×1' },
  { id:'m2', name:'本月答对50题',  target:50, reward:'月卡3天' },
  { id:'m3', name:'本月完成30任务',target:30, reward:'双倍金币卡' },
];

// 悄悄话库
const PET_TALKS = {
  hungry:  ['我好饿呀~','主人快喂我~','肚子咕咕叫了','想吃小蛋糕！'],
  happy:   ['今天真开心！','最喜欢主人啦~','一起玩好不好？','心情超棒！'],
  love:    ['我最爱你了！','永远在一起~','你是最好的主人','贴贴~'],
  sick:    ['主人我不舒服...','呜呜好难受','想休息一下','头好晕啊...'],
  normal:  ['今天也要加油哦~','抱抱我嘛','想出去玩','看看我新饰品~'],
};

window.GAME_DATA = {
  PET_DEFS, FOOD_DEFS, ACCESSORY_DEFS, FURNITURE_DEFS, MAP_DEFS,
  PACKAGE_DEFS, INTERACTIONS, SKILL_DEFS, ACHIEVEMENTS, RANDOM_EVENTS,
  FORTUNES, DEFAULT_TASKS, QUESTION_BANK, QUESTION_OPTIONS,
  FESTIVALS, MONTHLY_CHALLENGES, PET_TALKS, ENGLISH_LESSONS,
};
