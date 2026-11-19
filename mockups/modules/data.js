window.MODULE_DATA = {
  updatedAt: '17:08',
  road: {
    title: '北京往返崇礼',
    overall: {
      level: 'bad',
      label: '部分路段封闭',
      desc: '京礼高速北京方向 K72+300–K78+600 封闭；建议改走京藏 + 张承，或等 19:00 后恢复。',
      meta: '3 条主要路线 · 1 条封闭 · 2 条可通行'
    },
    routes: [
      {
        id: 'jingli',
        name: '京礼高速',
        code: 'S3801',
        meta: '北京六环 → 延庆 → 太子城 → 崇礼',
        distance: '约 220 km',
        duration: '2 小时 50 分',
        state: '部分封闭',
        stateKey: 'bad',
        segs: [
          { name: '北京六环', status: 'open', state: '畅通', sub: '昌平 · 四家庄桥' },
          { name: '延庆', status: 'slow', state: '缓行', sub: '康庄检查站车多 · 18 km/h' },
          { name: '大海陀', status: 'closed', state: '封闭', sub: 'K72+300–K78+600 北京方向' },
          { name: '太子城', status: 'slow', state: '缓行', sub: '山区段 · 能见度 1.2 km' },
          { name: '崇礼', status: 'open', state: '畅通', sub: '崇礼南出口 · 通行正常' }
        ],
        closure: {
          road: '京礼高速 · 北京方向',
          segment: 'K72+300–K78+600',
          reason: '交通事故（两车追尾）',
          started: '16:20',
          eta: '预计 19:00 恢复',
          detour: 'G6 京藏高速 → 张承高速，+35 km / +40 分钟',
          source: '河北高速交警',
          sourceTime: '17:02'
        },
        visibility: [
          { name: '延庆', vis: '6.0 km', temp: '-6°', icon: 'cloud' },
          { name: '大海陀', vis: '1.2 km', temp: '-9°', icon: 'fog' },
          { name: '太子城', vis: '3.5 km', temp: '-11°', icon: 'snow' },
          { name: '崇礼', vis: '8.0 km', temp: '-8°', icon: 'cloud' }
        ]
      },
      {
        id: 'g6',
        name: '京藏 + 张承',
        code: 'G6 + G95',
        meta: '北京 → 张家口 → 张承高速 → 崇礼',
        distance: '约 236 km',
        duration: '3 小时 20 分',
        state: '缓行',
        stateKey: 'slow',
        segs: [
          { name: '北京北五环', status: 'slow', state: '缓行', sub: '健翔桥—清河主线车多' },
          { name: '康庄', status: 'slow', state: '缓行', sub: '检查站排队约 20 分钟' },
          { name: '张家口', status: 'open', state: '畅通', sub: '转张承高速' },
          { name: '崇礼', status: 'open', state: '畅通', sub: '崇礼南出口' }
        ],
        closure: null,
        visibility: [
          { name: '康庄', vis: '5.0 km', temp: '-5°', icon: 'cloud' },
          { name: '张家口', vis: '9.0 km', temp: '-7°', icon: 'sun' },
          { name: '崇礼', vis: '8.0 km', temp: '-8°', icon: 'cloud' }
        ]
      },
      {
        id: 'g7',
        name: '京新 + 张承',
        code: 'G7 + G95',
        meta: '北京 → 张家口 → 张承高速 → 崇礼',
        distance: '约 245 km',
        duration: '3 小时 35 分',
        state: '畅通',
        stateKey: 'good',
        segs: [
          { name: '北京北六环', status: 'open', state: '畅通', sub: '京新高速入口' },
          { name: '张家口', status: 'open', state: '畅通', sub: '车流较少' },
          { name: '崇礼', status: 'open', state: '畅通', sub: '崇礼北出口' }
        ],
        closure: null,
        visibility: [
          { name: '北京', vis: '10 km', temp: '-4°', icon: 'sun' },
          { name: '张家口', vis: '9.0 km', temp: '-7°', icon: 'sun' },
          { name: '崇礼', vis: '8.0 km', temp: '-8°', icon: 'cloud' }
        ]
      }
    ]
  },
  snow: {
    resort: '万龙滑雪场',
    short: '万龙',
    updatedAt: '17:08',
    open: 12,
    total: 32,
    liftsOpen: 3,
    liftsTotal: 7,
    expectedTomorrow: 2,
    source: '万龙滑雪场公众号',
    sourceTime: '16:40',
    trails: [
      { name: '长龙道', diff: 'green', level: '初级', status: 'open', eta: '已开放' },
      { name: '游龙道', diff: 'green', level: '初级', status: 'open', eta: '已开放' },
      { name: '腾龙道', diff: 'blue', level: '中级', status: 'open', eta: '已开放' },
      { name: '中华龙道', diff: 'blue', level: '中级', status: 'open', eta: '已开放' },
      { name: '玉龙道', diff: 'black', level: '高级', status: 'expected', eta: '预计 11/19' },
      { name: '银龙道', diff: 'black', level: '高级', status: 'expected', eta: '预计 11/19' },
      { name: '金龙道', diff: 'black', level: '高级', status: 'closed', eta: '造雪中' },
      { name: '大奔头', diff: 'double', level: '双黑', status: 'closed', eta: '待定' }
    ],
    timeline: [
      { time: '11/18 08:30', type: 'open', text: '<b>官方开板</b> · 开放 10 条雪道、3 条缆车', src: '万龙滑雪场公众号' },
      { time: '11/18 14:00', type: 'open', text: '新增 <b>腾龙道、游龙道</b>，累计 12 条', src: '雪场公告' },
      { time: '11/19 09:00', type: 'future', text: '预计开放 <b>玉龙道、银龙道</b>（造雪完成）', src: '官方预计' },
      { time: '11/20 09:00', type: 'future', text: '预计开放 <b>金龙道</b>，视天气与造雪进度', src: '官方预计' },
      { time: '11/21', type: 'future', text: '预计开放 <b>大奔头</b>，具体以当日公告为准', src: '待确认' }
    ]
  }
};
