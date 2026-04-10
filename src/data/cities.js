import { cityDirectoryExtra } from "./cities.extra.js";

export const cityDirectory = {
  CN: [
    { id: "cn-shanghai", nameZh: "上海", nameEn: "Shanghai", timezone: "Asia/Shanghai", industry: "外贸 / 渠道 / 工业品", contactWindowBeijing: "09:00-12:00 / 14:00-18:00", isPrimary: true },
    { id: "cn-shenzhen", nameZh: "深圳", nameEn: "Shenzhen", timezone: "Asia/Shanghai", industry: "电子 / 跨境电商 / 制造", contactWindowBeijing: "09:00-12:00 / 14:00-18:00", isPrimary: true },
    { id: "cn-guangzhou", nameZh: "广州", nameEn: "Guangzhou", timezone: "Asia/Shanghai", industry: "批发 / 展会 / 外贸", contactWindowBeijing: "09:00-12:00 / 14:00-18:00", isPrimary: false }
  ],
  JP: [
    { id: "jp-tokyo", nameZh: "东京", nameEn: "Tokyo", timezone: "Asia/Tokyo", industry: "品牌 / 零售 / 综合贸易", contactWindowBeijing: "08:00-11:00 / 13:00-17:00", isPrimary: true },
    { id: "jp-osaka", nameZh: "大阪", nameEn: "Osaka", timezone: "Asia/Tokyo", industry: "分销 / 制造 / 消费品", contactWindowBeijing: "08:00-11:00 / 13:00-17:00", isPrimary: true },
    { id: "jp-nagoya", nameZh: "名古屋", nameEn: "Nagoya", timezone: "Asia/Tokyo", industry: "汽车配套 / 工业 / 机械", contactWindowBeijing: "08:00-11:00 / 13:00-17:00", isPrimary: false }
  ],
  KR: [
    { id: "kr-seoul", nameZh: "首尔", nameEn: "Seoul", timezone: "Asia/Seoul", industry: "品牌 / 电商 / 进口消费品", contactWindowBeijing: "08:00-11:00 / 13:00-17:00", isPrimary: true },
    { id: "kr-busan", nameZh: "釜山", nameEn: "Busan", timezone: "Asia/Seoul", industry: "港口 / 物流 / 工业贸易", contactWindowBeijing: "08:00-11:00 / 13:00-17:00", isPrimary: false }
  ],
  TW: [
    { id: "tw-taipei", nameZh: "台北", nameEn: "Taipei", timezone: "Asia/Taipei", industry: "电子 / 渠道 / 品牌分销", contactWindowBeijing: "09:00-12:00 / 14:00-18:00", isPrimary: true },
    { id: "tw-kaohsiung", nameZh: "高雄", nameEn: "Kaohsiung", timezone: "Asia/Taipei", industry: "港口 / 制造 / 工业贸易", contactWindowBeijing: "09:00-12:00 / 14:00-18:00", isPrimary: false }
  ],
  HK: [
    { id: "hk-hong-kong", nameZh: "香港", nameEn: "Hong Kong", timezone: "Asia/Hong_Kong", industry: "转口贸易 / 金融 / 渠道", contactWindowBeijing: "09:00-12:00 / 14:00-18:00", isPrimary: true }
  ],
  US: [
    { id: "us-new-york", nameZh: "纽约", nameEn: "New York", timezone: "America/New_York", industry: "金融 / 零售 / 进口贸易", contactWindowBeijing: "21:00-23:30 / 次日21:00后", isPrimary: true },
    { id: "us-los-angeles", nameZh: "洛杉矶", nameEn: "Los Angeles", timezone: "America/Los_Angeles", industry: "电商 / 娱乐 / 港口贸易", contactWindowBeijing: "00:00-03:00", isPrimary: true },
    { id: "us-chicago", nameZh: "芝加哥", nameEn: "Chicago", timezone: "America/Chicago", industry: "工业 / 批发 / 物流", contactWindowBeijing: "22:00-01:00", isPrimary: false }
  ],
  CA: [
    { id: "ca-toronto", nameZh: "多伦多", nameEn: "Toronto", timezone: "America/Toronto", industry: "零售 / 金融 / 批发", contactWindowBeijing: "21:00-23:00 / 次日21:00后", isPrimary: true },
    { id: "ca-vancouver", nameZh: "温哥华", nameEn: "Vancouver", timezone: "America/Vancouver", industry: "港口 / 电商 / 建材", contactWindowBeijing: "00:00-03:00", isPrimary: true }
  ],
  MX: [
    { id: "mx-mexico-city", nameZh: "墨西哥城", nameEn: "Mexico City", timezone: "America/Mexico_City", industry: "制造 / 批发 / 消费市场", contactWindowBeijing: "22:00-01:00", isPrimary: true },
    { id: "mx-monterrey", nameZh: "蒙特雷", nameEn: "Monterrey", timezone: "America/Monterrey", industry: "制造 / 工业配套", contactWindowBeijing: "22:00-01:00", isPrimary: false }
  ],
  BR: [
    { id: "br-sao-paulo", nameZh: "圣保罗", nameEn: "Sao Paulo", timezone: "America/Sao_Paulo", industry: "消费品 / 工业 / 电商", contactWindowBeijing: "19:00-22:00", isPrimary: true },
    { id: "br-rio", nameZh: "里约热内卢", nameEn: "Rio de Janeiro", timezone: "America/Sao_Paulo", industry: "消费市场 / 渠道贸易", contactWindowBeijing: "19:00-22:00", isPrimary: false }
  ],
  AR: [
    { id: "ar-buenos-aires", nameZh: "布宜诺斯艾利斯", nameEn: "Buenos Aires", timezone: "America/Argentina/Buenos_Aires", industry: "消费 / 批发 / 工业品", contactWindowBeijing: "20:00-22:30", isPrimary: true }
  ],
  CL: [
    { id: "cl-santiago", nameZh: "圣地亚哥", nameEn: "Santiago", timezone: "America/Santiago", industry: "零售 / 工程 / 进口贸易", contactWindowBeijing: "20:00-23:00", isPrimary: true }
  ],
  CO: [
    { id: "co-bogota", nameZh: "波哥大", nameEn: "Bogota", timezone: "America/Bogota", industry: "消费 / 分销 / 建材", contactWindowBeijing: "21:00-23:30", isPrimary: true }
  ],
  PE: [
    { id: "pe-lima", nameZh: "利马", nameEn: "Lima", timezone: "America/Lima", industry: "贸易 / 五金建材 / 消费品", contactWindowBeijing: "21:00-23:30", isPrimary: true }
  ],
  GB: [
    { id: "gb-london", nameZh: "伦敦", nameEn: "London", timezone: "Europe/London", industry: "贸易 / 金融 / 品牌渠道", contactWindowBeijing: "15:00-18:00 / 20:00-23:00", isPrimary: true },
    { id: "gb-manchester", nameZh: "曼彻斯特", nameEn: "Manchester", timezone: "Europe/London", industry: "批发 / 工业 / 电商", contactWindowBeijing: "15:00-18:00 / 20:00-23:00", isPrimary: false }
  ],
  DE: [
    { id: "de-berlin", nameZh: "柏林", nameEn: "Berlin", timezone: "Europe/Berlin", industry: "工业 / 电商 / 渠道", contactWindowBeijing: "14:30-17:30 / 19:30-22:30", isPrimary: true },
    { id: "de-hamburg", nameZh: "汉堡", nameEn: "Hamburg", timezone: "Europe/Berlin", industry: "港口 / 物流 / 进口贸易", contactWindowBeijing: "14:30-17:30 / 19:30-22:30", isPrimary: false },
    { id: "de-munich", nameZh: "慕尼黑", nameEn: "Munich", timezone: "Europe/Berlin", industry: "制造 / 工业设备", contactWindowBeijing: "14:30-17:30 / 19:30-22:30", isPrimary: false }
  ],
  FR: [
    { id: "fr-paris", nameZh: "巴黎", nameEn: "Paris", timezone: "Europe/Paris", industry: "品牌 / 零售 / 时尚", contactWindowBeijing: "15:00-18:00 / 20:00-22:30", isPrimary: true },
    { id: "fr-lyon", nameZh: "里昂", nameEn: "Lyon", timezone: "Europe/Paris", industry: "工业 / 医疗 / 分销", contactWindowBeijing: "15:00-18:00 / 20:00-22:30", isPrimary: false }
  ],
  IT: [
    { id: "it-milan", nameZh: "米兰", nameEn: "Milan", timezone: "Europe/Rome", industry: "时尚 / 家居 / 零售", contactWindowBeijing: "15:00-18:00 / 20:00-22:30", isPrimary: true },
    { id: "it-rome", nameZh: "罗马", nameEn: "Rome", timezone: "Europe/Rome", industry: "分销 / 建材 / 工程", contactWindowBeijing: "15:00-18:00 / 20:00-22:30", isPrimary: false }
  ],
  ES: [
    { id: "es-madrid", nameZh: "马德里", nameEn: "Madrid", timezone: "Europe/Madrid", industry: "消费 / 家居 / 渠道", contactWindowBeijing: "15:00-18:00 / 20:00-23:00", isPrimary: true },
    { id: "es-barcelona", nameZh: "巴塞罗那", nameEn: "Barcelona", timezone: "Europe/Madrid", industry: "零售 / 电商 / 港口贸易", contactWindowBeijing: "15:00-18:00 / 20:00-23:00", isPrimary: false }
  ],
  NL: [
    { id: "nl-amsterdam", nameZh: "阿姆斯特丹", nameEn: "Amsterdam", timezone: "Europe/Amsterdam", industry: "贸易 / 电商 / 分销", contactWindowBeijing: "14:30-17:30 / 19:30-22:30", isPrimary: true },
    { id: "nl-rotterdam", nameZh: "鹿特丹", nameEn: "Rotterdam", timezone: "Europe/Amsterdam", industry: "港口 / 物流 / 转运", contactWindowBeijing: "14:30-17:30 / 19:30-22:30", isPrimary: false }
  ],
  PL: [
    { id: "pl-warsaw", nameZh: "华沙", nameEn: "Warsaw", timezone: "Europe/Warsaw", industry: "分销 / 零售 / 工业品", contactWindowBeijing: "14:00-17:00 / 19:00-22:00", isPrimary: true }
  ],
  TR: [
    { id: "tr-istanbul", nameZh: "伊斯坦布尔", nameEn: "Istanbul", timezone: "Europe/Istanbul", industry: "批发 / 家居 / 中转贸易", contactWindowBeijing: "13:00-17:00", isPrimary: true }
  ],
  AE: [
    { id: "ae-dubai", nameZh: "迪拜", nameEn: "Dubai", timezone: "Asia/Dubai", industry: "转口贸易 / 渠道 / 零售", contactWindowBeijing: "13:00-17:00", isPrimary: true },
    { id: "ae-abu-dhabi", nameZh: "阿布扎比", nameEn: "Abu Dhabi", timezone: "Asia/Dubai", industry: "工程 / 能源 / 政企采购", contactWindowBeijing: "13:00-17:00", isPrimary: false }
  ],
  SA: [
    { id: "sa-riyadh", nameZh: "利雅得", nameEn: "Riyadh", timezone: "Asia/Riyadh", industry: "工程 / 建材 / 政企采购", contactWindowBeijing: "14:00-17:00", isPrimary: true },
    { id: "sa-jeddah", nameZh: "吉达", nameEn: "Jeddah", timezone: "Asia/Riyadh", industry: "港口 / 分销 / 进口贸易", contactWindowBeijing: "14:00-17:00", isPrimary: false }
  ],
  IL: [
    { id: "il-tel-aviv", nameZh: "特拉维夫", nameEn: "Tel Aviv", timezone: "Asia/Jerusalem", industry: "科技 / 医疗 / 创新渠道", contactWindowBeijing: "14:00-17:00", isPrimary: true }
  ],
  IN: [
    { id: "in-mumbai", nameZh: "孟买", nameEn: "Mumbai", timezone: "Asia/Kolkata", industry: "贸易 / 零售 / 分销", contactWindowBeijing: "11:30-14:30 / 16:30-19:30", isPrimary: true },
    { id: "in-delhi", nameZh: "新德里", nameEn: "New Delhi", timezone: "Asia/Kolkata", industry: "政企采购 / 分销 / 工业品", contactWindowBeijing: "11:30-14:30 / 16:30-19:30", isPrimary: false },
    { id: "in-bangalore", nameZh: "班加罗尔", nameEn: "Bangalore", timezone: "Asia/Kolkata", industry: "科技 / 电商 / 服务外包", contactWindowBeijing: "11:30-14:30 / 16:30-19:30", isPrimary: false }
  ],
  PK: [
    { id: "pk-karachi", nameZh: "卡拉奇", nameEn: "Karachi", timezone: "Asia/Karachi", industry: "港口 / 贸易 / 分销", contactWindowBeijing: "12:00-15:00 / 17:00-20:00", isPrimary: true }
  ],
  BD: [
    { id: "bd-dhaka", nameZh: "达卡", nameEn: "Dhaka", timezone: "Asia/Dhaka", industry: "纺织 / 成衣 / 贸易", contactWindowBeijing: "10:00-13:00 / 15:00-18:00", isPrimary: true }
  ],
  VN: [
    { id: "vn-ho-chi-minh", nameZh: "胡志明市", nameEn: "Ho Chi Minh City", timezone: "Asia/Ho_Chi_Minh", industry: "制造 / 外贸 / 电商", contactWindowBeijing: "09:00-12:00 / 14:00-17:00", isPrimary: true },
    { id: "vn-hanoi", nameZh: "河内", nameEn: "Hanoi", timezone: "Asia/Ho_Chi_Minh", industry: "分销 / 工业 / 采购", contactWindowBeijing: "09:00-12:00 / 14:00-17:00", isPrimary: false }
  ],
  TH: [
    { id: "th-bangkok", nameZh: "曼谷", nameEn: "Bangkok", timezone: "Asia/Bangkok", industry: "零售 / 电商 / 分销", contactWindowBeijing: "10:00-13:00 / 15:00-18:00", isPrimary: true }
  ],
  ID: [
    { id: "id-jakarta", nameZh: "雅加达", nameEn: "Jakarta", timezone: "Asia/Jakarta", industry: "消费市场 / 电商 / 分销", contactWindowBeijing: "10:00-13:00 / 15:00-18:00", isPrimary: true },
    { id: "id-surabaya", nameZh: "泗水", nameEn: "Surabaya", timezone: "Asia/Jakarta", industry: "港口 / 分销 / 工业", contactWindowBeijing: "10:00-13:00 / 15:00-18:00", isPrimary: false }
  ],
  MY: [
    { id: "my-kuala-lumpur", nameZh: "吉隆坡", nameEn: "Kuala Lumpur", timezone: "Asia/Kuala_Lumpur", industry: "渠道 / 零售 / 跨境电商", contactWindowBeijing: "09:00-12:00 / 14:00-18:00", isPrimary: true }
  ],
  PH: [
    { id: "ph-manila", nameZh: "马尼拉", nameEn: "Manila", timezone: "Asia/Manila", industry: "分销 / 零售 / 电商", contactWindowBeijing: "09:00-12:00 / 14:00-18:00", isPrimary: true }
  ],
  SG: [
    { id: "sg-singapore", nameZh: "新加坡", nameEn: "Singapore", timezone: "Asia/Singapore", industry: "贸易 / 金融 / 区域总部", contactWindowBeijing: "09:00-12:00 / 14:00-18:00", isPrimary: true }
  ],
  AU: [
    { id: "au-sydney", nameZh: "悉尼", nameEn: "Sydney", timezone: "Australia/Sydney", industry: "零售 / 建材 / 渠道", contactWindowBeijing: "07:00-10:00 / 12:00-15:00", isPrimary: true },
    { id: "au-melbourne", nameZh: "墨尔本", nameEn: "Melbourne", timezone: "Australia/Melbourne", industry: "消费 / 家居 / 分销", contactWindowBeijing: "07:00-10:00 / 12:00-15:00", isPrimary: false },
    { id: "au-perth", nameZh: "珀斯", nameEn: "Perth", timezone: "Australia/Perth", industry: "工程 / 矿业配套 / 贸易", contactWindowBeijing: "09:00-12:00 / 14:00-17:00", isPrimary: false }
  ],
  NZ: [
    { id: "nz-auckland", nameZh: "奥克兰", nameEn: "Auckland", timezone: "Pacific/Auckland", industry: "零售 / 分销 / 建材", contactWindowBeijing: "05:00-09:00 / 11:00-14:00", isPrimary: true }
  ],
  ZA: [
    { id: "za-johannesburg", nameZh: "约翰内斯堡", nameEn: "Johannesburg", timezone: "Africa/Johannesburg", industry: "分销 / 贸易 / 工业品", contactWindowBeijing: "14:00-17:00 / 19:00-22:00", isPrimary: true },
    { id: "za-cape-town", nameZh: "开普敦", nameEn: "Cape Town", timezone: "Africa/Johannesburg", industry: "港口 / 零售 / 渠道", contactWindowBeijing: "14:00-17:00 / 19:00-22:00", isPrimary: false }
  ],
  EG: [
    { id: "eg-cairo", nameZh: "开罗", nameEn: "Cairo", timezone: "Africa/Cairo", industry: "分销 / 建材 / 消费品", contactWindowBeijing: "14:00-17:00 / 19:00-22:00", isPrimary: true }
  ],
  NG: [
    { id: "ng-lagos", nameZh: "拉各斯", nameEn: "Lagos", timezone: "Africa/Lagos", industry: "消费 / 渠道 / 批发", contactWindowBeijing: "15:00-18:00 / 20:00-23:00", isPrimary: true }
  ],
  KE: [
    { id: "ke-nairobi", nameZh: "内罗毕", nameEn: "Nairobi", timezone: "Africa/Nairobi", industry: "东非分销 / 工程 / 消费品", contactWindowBeijing: "13:00-16:00 / 18:00-21:00", isPrimary: true }
  ]
};

export function getCitiesByCountry(countryCode) {
  const base = cityDirectory[countryCode] || [];
  const extra = cityDirectoryExtra[countryCode] || [];
  const merged = [...base, ...extra];
  const deduped = [];
  const seen = new Set();

  for (const city of merged) {
    if (!city || seen.has(city.id)) {
      continue;
    }
    seen.add(city.id);
    deduped.push(city);
  }

  return deduped.slice(0, 9);
}
