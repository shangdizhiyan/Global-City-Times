import { useEffect, useMemo, useState } from "react";
import { fetchCountryDirectory } from "./api/client";
import { cityContactMetaById } from "./data/cityContactMetaById";
import { cityMetaById } from "./data/cityMetaById";
import {
  BEIJING_TZ,
  formatTime,
  getDeltaText,
  getFormatter,
  getWorkStatus,
  getZonedParts
} from "./utils/time";

const fallbackContinents = [
  { key: "all", nameZh: "全部", description: "浏览所有重点开发城市" },
  { key: "Asia", nameZh: "亚洲", description: "东亚、东南亚、南亚和中东城市" },
  { key: "Europe", nameZh: "欧洲", description: "西欧、中欧、北欧和南欧城市" },
  { key: "North America", nameZh: "北美洲", description: "北美、中美洲与加勒比市场" },
  { key: "South America", nameZh: "南美洲", description: "拉美南美重点开发城市" },
  { key: "Africa", nameZh: "非洲", description: "北非、西非、东非和南部非洲" },
  { key: "Oceania", nameZh: "大洋洲", description: "澳新与太平洋重点城市" }
];

const statusOptions = [
  { key: "all", label: "全部状态" },
  { key: "working", label: "工作中" },
  { key: "upcoming", label: "即将上班" },
  { key: "break", label: "午休中" },
  { key: "off", label: "已下班" }
];

export default function AppWeb() {
  const [now, setNow] = useState(() => new Date());
  const [query, setQuery] = useState("");
  const [activeContinent, setActiveContinent] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [directory, setDirectory] = useState({ continents: fallbackContinents.slice(1), countries: [], sync: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    void loadDirectory();
  }, []);

  async function loadDirectory() {
    setLoading(true);
    try {
      const nextDirectory = await fetchCountryDirectory({ refresh: true });
      setDirectory(nextDirectory);
      setError("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "数据加载失败");
    } finally {
      setLoading(false);
    }
  }

  const countries = useMemo(
    () => directory.countries.map((country) => enrichCountry(country, now)),
    [directory.countries, now]
  );

  const cityCards = useMemo(
    () => countries.flatMap((country) => (country.meta.cities || []).map((city) => enrichCity(city, country, now))),
    [countries, now]
  );

  const industryOptions = useMemo(() => {
    const values = cityCards.map((city) => city.industry).filter(Boolean);
    return ["all", ...new Set(values)];
  }, [cityCards]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredCities = cityCards
    .filter((city) => (activeContinent === "all" ? true : city.continent === activeContinent))
    .filter((city) => (statusFilter === "all" ? true : city.status.kind === statusFilter))
    .filter((city) => (industryFilter === "all" ? true : city.industry === industryFilter));

  const countryMatchedCities = normalizedQuery
    ? filteredCities.filter((city) => matchesCountry(city, normalizedQuery))
    : [];

  const visibleCities = (countryMatchedCities.length
    ? countryMatchedCities
    : filteredCities.filter((city) => matchesCity(city, normalizedQuery)))
    .sort(sortCities)
    .slice(0, normalizedQuery ? 9 : filteredCities.length);

  const groupedCities = fallbackContinents
    .filter((item) => item.key !== "all")
    .map((continent) => ({
      ...continent,
      cities: cityCards.filter((city) => city.continent === continent.key).sort(sortCities)
    }));

  const selectedCity = cityCards.find((city) => city.id === selectedCityId) || null;


  return (
    <div className="page-shell web-page-shell">
      <header className="hero web-hero">
        <div className="hero-copy web-hero-copy">
          <p className="eyebrow">Web City Explorer</p>
          <h1>全球城市开发浏览系统</h1>
          <p className="hero-text">
            先按城市看当地时间、行业方向和北京时间联系窗口。这一版只服务 Web，
            更适合浏览、筛选、市场摸排和日常开发查询。
          </p>

          <div className="search-card glass-card gradient-search web-search-box">
            <label className="field-label" htmlFor="webSearchInput">搜索城市 / 国家 / 国家代码</label>
            <div className="search-shell">
              <input
                id="webSearchInput"
                className="search-input search-input-fancy"
                type="text"
                placeholder="例如：Tokyo / Japan / JP / Dubai / Berlin"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>

          <div className="web-filter-row">
            {fallbackContinents.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`web-filter-chip ${activeContinent === item.key ? "is-active" : ""}`}
                onClick={() => setActiveContinent(item.key)}
              >
                {item.nameZh}
              </button>
            ))}
          </div>

          <div className="web-toolbar">
            <label className="web-select-field">
              <span>工作状态</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                {statusOptions.map((item) => (
                  <option key={item.key} value={item.key}>{item.label}</option>
                ))}
              </select>
            </label>

            <label className="web-select-field">
              <span>行业方向</span>
              <select value={industryFilter} onChange={(event) => setIndustryFilter(event.target.value)}>
                {industryOptions.map((item) => (
                  <option key={item} value={item}>{item === "all" ? "全部行业" : item}</option>
                ))}
              </select>
            </label>
          </div>

          {error ? <div className="inline-error">{error}</div> : null}
        </div>

      </header>

      <main className="layout web-main-layout">
        <section className="search-results-panel glass-card web-section">
          <div className="section-heading compact">
            <div>
              <p className="section-kicker">{normalizedQuery ? "Search Results" : "City Board"}</p>
              <h2>{normalizedQuery ? "搜索结果" : `${fallbackContinents.find((item) => item.key === activeContinent)?.nameZh || "全部"}城市看板`}</h2>
            </div>
            <p className="section-note">
              当前显示 {visibleCities.length} 个城市{industryFilter !== "all" ? ` / ${industryFilter}` : ""}
            </p>
          </div>

          <div className="city-grid">
            {visibleCities.length ? (
              visibleCities.map((city) => (
                <WebCityCard key={city.id} city={city} onOpen={() => setSelectedCityId(city.id)} />
              ))
            ) : (
              <div className="empty-state">当前筛选下没有城市结果，请调整关键词、洲别、状态或行业。</div>
            )}
          </div>
        </section>

        {!normalizedQuery && activeContinent === "all"
          ? groupedCities.map((group) => (
              <section key={group.key} className="section-block web-section">
                <div className="section-heading">
                  <div>
                    <p className="section-kicker">{group.key}</p>
                    <h2>{group.nameZh}</h2>
                  </div>
                  <p className="section-note">{group.description}</p>
                </div>

                <div className="city-grid">
                  {group.cities.map((city) => (
                    <WebCityCard key={city.id} city={city} onOpen={() => setSelectedCityId(city.id)} />
                  ))}
                </div>
              </section>
            ))
          : null}
      </main>

      {selectedCity ? <CityDetailDrawer city={selectedCity} onClose={() => setSelectedCityId(null)} /> : null}
      {loading ? <div className="web-loading">正在加载城市数据...</div> : null}
    </div>
  );
}

function WebCityCard({ city, onOpen }) {
  return (
    <article
      className={`city-card glass-card ${getSearchGradientClass(city.id)} web-city-card`}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => event.key === "Enter" && onOpen()}
    >
      <div className="city-card-top">
        <div>
          <div className="city-code-row">
            <CodeBadge code={city.countryCode} />
            {city.isPrimary ? <span className="city-primary-tag">City Focus</span> : null}
          </div>
          <p className="country-region">{city.countryNameEn}</p>
          <h3 className="country-name">{city.nameZh}</h3>
          <p className="country-en">{city.nameEn}</p>
        </div>
        <div className={`status-badge ${city.status.kind}`}>{city.status.label}</div>
      </div>

      <div className="city-grid-meta">
        <div className="city-info-card">
          <p className="meta-label">当地时间</p>
          <div className="time-value compact">{city.localTimeText}</div>
        </div>
        <div className="city-info-card">
          <p className="meta-label">时差</p>
          <div className="delta-value">{city.deltaText}</div>
        </div>
        <div className="city-info-card">
          <p className="meta-label">行业方向</p>
          <p>{city.industry}</p>
        </div>
        <div className="city-info-card">
          <p className="meta-label">北京时间联系</p>
          <p>{city.contactWindowBeijing}</p>
        </div>
      </div>
    </article>
  );
}

function CityDetailDrawer({ city, onClose }) {
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="detail-drawer city-detail-drawer" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <p className="eyebrow">City Brief</p>
            <h2>{city.nameZh}</h2>
            <p className="drawer-subtitle">{city.nameEn} / {city.countryNameZh}</p>
          </div>
          <button type="button" className="close-button" onClick={onClose}>关闭</button>
        </div>

        <div className="drawer-grid">
          <div className="drawer-card">
            <p className="meta-label">当前状态</p>
            <div className={`task-status ${city.status.kind}`}>{city.status.label}</div>
            <div className="drawer-time">{city.localTimeText}</div>
          </div>
          <div className="drawer-card">
            <p className="meta-label">北京时间联系窗口</p>
            <div className="drawer-time city-contact-window">{city.contactWindowBeijing}</div>
          </div>
        </div>

        <div className="detail-section-head">
          <div>
            <p className="section-kicker">City Data</p>
            <h3>城市数据</h3>
          </div>
          <p className="section-note">这一组只显示城市级信息，时间类会实时变化。</p>
        </div>

        <div className="detail-subgroup">
          <div className="detail-subgroup-head">
            <p className="section-kicker">City Basics</p>
            <h4>基础信息</h4>
          </div>
          <div className="detail-meta-grid">
            <MetaTile label="城市名称" value={city.nameZh} />
            <MetaTile label="英文名称" value={city.nameEn} />
            <MetaTile label="所属国家" value={city.countryNameZh} />
            <MetaTile label="所属大洲" value={city.continent} />
            <MetaTile label="城市时区" value={city.timezone} />
            <MetaTile label="时差" value={city.deltaText} />
            <MetaTile label="城市人口" value={city.cityPopulation} />
            <MetaTile label="城市邮编" value={city.postalCode} />
            <MetaTile label="交通枢纽" value={city.transportRole} />
          </div>
        </div>

        <div className="detail-subgroup">
          <div className="detail-subgroup-head detail-subgroup-head-market">
            <p className="section-kicker">Market Focus</p>
            <h4>市场与渠道</h4>
          </div>
          <div className="detail-meta-grid">
            <MetaTile label="行业方向" value={city.industry} />
            <MetaTile label="城市定位" value={city.cityRole} />
            <MetaTile label="主要产业" value={city.primaryIndustries} />
            <MetaTile label="主流社交平台" value={city.socialPlatforms} />
            <MetaTile label="主流广告平台" value={city.adPlatforms} />
            <MetaTile label="主流电商平台" value={city.ecommercePlatforms} />
            <MetaTile label="主流搜索引擎" value={city.searchEngines} />
          </div>
        </div>

        <div className="detail-subgroup">
          <div className="detail-subgroup-head detail-subgroup-head-action">
            <p className="section-kicker">Execution</p>
            <h4>联系与执行</h4>
          </div>
          <div className="detail-meta-grid">
            <MetaTile label="社交沟通偏好" value={city.socialMessaging} />
            <MetaTile label="开发备注" value={city.cityNotes} />
          </div>
        </div>

        <div className="detail-section-head detail-section-head-alt">
          <div>
            <p className="section-kicker">Country Reference</p>
            <h3>国家参考</h3>
          </div>
          <p className="section-note">这一组是国家级资料，不是城市实时数据。</p>
        </div>

        <div className="detail-meta-grid detail-meta-grid-country">
          <MetaTile label="国家代码" value={city.countryCode} />
          <MetaTile label="首都" value={city.countryMeta.capital} />
          <MetaTile label="货币代码" value={city.countryMeta.currencyCode} />
          <MetaTile label="语言" value={joinValue(city.countryMeta.languages)} />
          <MetaTile label="电话区号" value={city.countryMeta.dialingCode} />
          <MetaTile label="域名后缀" value={city.countryMeta.domainSuffix} />
          <MetaTile label="国家人口" value={city.countryMeta.population} />
          <MetaTile label="国土面积" value={city.countryMeta.area} />
          <MetaTile label="电商渗透率" value={city.countryMeta.ecommercePenetration} />
          <MetaTile label="手机/互联网普及率" value={city.countryMeta.mobileInternetPenetration} />
          <MetaTile label="价格敏感度" value={city.countryMeta.priceSensitivity} />
          <MetaTile label="品牌敏感度" value={city.countryMeta.brandSensitivity} />
          <MetaTile label="关系型成交" value={city.countryMeta.relationshipDriven} />
        </div>
      </aside>
    </div>
  );
}

function CodeBadge({ code }) {
  return (
    <div className="code-badge small">
      <span>{code}</span>
    </div>
  );
}

function MetaTile({ label, value }) {
  return (
    <div className="meta-tile">
      <p className="meta-label">{label}</p>
      <p>{value || "待补充"}</p>
    </div>
  );
}

function enrichCountry(country, now) {
  const localParts = getZonedParts(now, country.timezone);
  const status = getWorkStatus(localParts, country.businessHours);

  return {
    ...country,
    status,
    localTimeText: formatTime(localParts.hour, localParts.minute, localParts.second)
  };
}

function enrichCity(city, country, now) {
  const localParts = getZonedParts(now, city.timezone);
  const status = getWorkStatus(localParts, country.businessHours);
  const cityMeta = cityMetaById[city.id] || {};
  const cityContactMeta = cityContactMetaById[city.id] || {};

  return {
    ...city,
    ...cityMeta,
    ...cityContactMeta,
    countryCode: country.code,
    countryNameZh: country.nameZh,
    countryNameEn: country.nameEn,
    continent: country.continent,
    countryMeta: country.meta,
    cityPopulation: cityMeta.cityPopulation || city.cityPopulation || "待补充",
    cityRole: cityMeta.cityRole || city.cityRole || "待补充",
    primaryIndustries: joinValue(cityMeta.primaryIndustries || city.primaryIndustries || city.industry),
    postalCode: cityContactMeta.postalCode || city.postalCode || "待补充",
    socialMessaging: cityContactMeta.socialMessaging || city.socialMessaging || "待补充",
    socialPlatforms: cityContactMeta.socialPlatforms || getDefaultSocialPlatforms(country.code),
    adPlatforms: cityContactMeta.adPlatforms || getDefaultAdPlatforms(country.code),
    ecommercePlatforms: cityContactMeta.ecommercePlatforms || getDefaultEcommercePlatforms(country.code),
    searchEngines: cityContactMeta.searchEngines || getDefaultSearchEngines(country.code),
    transportRole: cityMeta.transportRole || city.transportRole || "待补充",
    cityNotes: cityMeta.cityNotes || city.cityNotes || "待补充",
    localTimeText: formatTime(localParts.hour, localParts.minute, localParts.second),
    deltaText: getDeltaText(now, city.timezone),
    status
  };
}

function matchesCity(city, query) {
  if (!query) {
    return true;
  }
  return [
    city.nameZh,
    city.nameEn,
    city.countryNameZh,
    city.countryNameEn,
    city.countryCode,
    city.industry
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(query));
}

function matchesCountry(city, query) {
  if (!query) {
    return false;
  }

  return [city.countryNameZh, city.countryNameEn, city.countryCode]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(query));
}

function sortCities(a, b) {
  if (a.isPrimary && !b.isPrimary) {
    return -1;
  }
  if (!a.isPrimary && b.isPrimary) {
    return 1;
  }
  if (a.status.kind === "working" && b.status.kind !== "working") {
    return -1;
  }
  if (a.status.kind !== "working" && b.status.kind === "working") {
    return 1;
  }
  return a.nameEn.localeCompare(b.nameEn);
}

function joinValue(value) {
  if (Array.isArray(value)) {
    return value.length ? value.join(" / ") : "待补充";
  }
  return value || "待补充";
}

function getDefaultSocialPlatforms(countryCode) {
  const map = {
    JP: "LINE / X / Instagram / YouTube",
    KR: "KakaoTalk / Instagram / YouTube / Naver Blog",
    TW: "LINE / Facebook / Instagram / YouTube",
    HK: "WhatsApp / Facebook / Instagram / LinkedIn",
    SG: "WhatsApp / LinkedIn / Facebook / Instagram",
    MY: "WhatsApp / Facebook / Instagram / TikTok",
    TH: "LINE / Facebook / Instagram / TikTok",
    VN: "Zalo / Facebook / TikTok / YouTube",
    ID: "WhatsApp / Instagram / TikTok / Facebook",
    PH: "Facebook / Messenger / TikTok / Instagram",
    AE: "WhatsApp / Instagram / LinkedIn / Snapchat",
    SA: "WhatsApp / Instagram / Snapchat / TikTok",
    IL: "WhatsApp / LinkedIn / Facebook / Instagram",
    TR: "WhatsApp / Instagram / Facebook / TikTok",
    DE: "WhatsApp / LinkedIn / Instagram / X",
    FR: "WhatsApp / LinkedIn / Instagram / Facebook",
    GB: "WhatsApp / LinkedIn / Instagram / Facebook",
    IT: "WhatsApp / Instagram / Facebook / LinkedIn",
    ES: "WhatsApp / Instagram / Facebook / LinkedIn",
    NL: "WhatsApp / LinkedIn / Instagram / Facebook",
    PL: "WhatsApp / Facebook / Instagram / LinkedIn",
    US: "LinkedIn / Instagram / Facebook / X",
    CA: "LinkedIn / Instagram / Facebook / X",
    MX: "WhatsApp / Facebook / Instagram / TikTok",
    BR: "WhatsApp / Instagram / Facebook / LinkedIn",
    AR: "WhatsApp / Instagram / Facebook / LinkedIn",
    CL: "WhatsApp / Instagram / LinkedIn / Facebook",
    CO: "WhatsApp / Facebook / Instagram / TikTok",
    PE: "WhatsApp / Facebook / Instagram / TikTok",
    CN: "微信 / 企业微信 / 抖音 / 小红书",
    IN: "WhatsApp / Instagram / LinkedIn / YouTube",
    PK: "WhatsApp / Facebook / Instagram / LinkedIn",
    BD: "WhatsApp / Facebook / YouTube / LinkedIn",
    AU: "LinkedIn / Facebook / Instagram / X",
    NZ: "LinkedIn / Facebook / Instagram / X",
    ZA: "WhatsApp / Facebook / Instagram / LinkedIn",
    EG: "WhatsApp / Facebook / Instagram / TikTok",
    NG: "WhatsApp / Instagram / Facebook / LinkedIn",
    KE: "WhatsApp / Facebook / Instagram / LinkedIn"
  };

  return map[countryCode] || "WhatsApp / LinkedIn / Facebook / Instagram";
}

function getDefaultAdPlatforms(countryCode) {
  const map = {
    JP: "Google Ads / Yahoo Japan Ads / LINE Ads / Meta Ads",
    KR: "Naver Ads / Kakao Ads / Google Ads / Meta Ads",
    TW: "Google Ads / Meta Ads / LINE Ads / YouTube Ads",
    HK: "Google Ads / Meta Ads / LinkedIn Ads",
    SG: "Google Ads / Meta Ads / LinkedIn Ads / TikTok Ads",
    MY: "Google Ads / Meta Ads / TikTok Ads / Shopee Ads",
    TH: "Google Ads / Meta Ads / LINE Ads / TikTok Ads",
    VN: "Google Ads / Facebook Ads / TikTok Ads / Zalo Ads",
    ID: "Google Ads / Meta Ads / TikTok Ads / Tokopedia Ads",
    PH: "Google Ads / Meta Ads / TikTok Ads / Lazada Ads",
    AE: "Google Ads / Meta Ads / LinkedIn Ads / TikTok Ads",
    SA: "Google Ads / Meta Ads / Snapchat Ads / TikTok Ads",
    IL: "Google Ads / Meta Ads / LinkedIn Ads",
    TR: "Google Ads / Meta Ads / Instagram Ads / TikTok Ads",
    DE: "Google Ads / Meta Ads / LinkedIn Ads / Amazon Ads",
    FR: "Google Ads / Meta Ads / LinkedIn Ads / TikTok Ads",
    GB: "Google Ads / Meta Ads / LinkedIn Ads / Amazon Ads",
    IT: "Google Ads / Meta Ads / Instagram Ads / Amazon Ads",
    ES: "Google Ads / Meta Ads / Instagram Ads / TikTok Ads",
    NL: "Google Ads / Meta Ads / LinkedIn Ads / Bol Ads",
    PL: "Google Ads / Meta Ads / Allegro Ads / LinkedIn Ads",
    US: "Google Ads / Meta Ads / LinkedIn Ads / Amazon Ads",
    CA: "Google Ads / Meta Ads / LinkedIn Ads / Amazon Ads",
    MX: "Google Ads / Meta Ads / TikTok Ads / Mercado Libre Ads",
    BR: "Google Ads / Meta Ads / TikTok Ads / Mercado Ads",
    AR: "Google Ads / Meta Ads / Instagram Ads / Mercado Ads",
    CL: "Google Ads / Meta Ads / LinkedIn Ads",
    CO: "Google Ads / Meta Ads / TikTok Ads / Mercado Ads",
    PE: "Google Ads / Meta Ads / TikTok Ads",
    CN: "百度推广 / 腾讯广告 / 巨量引擎 / 小红书广告",
    IN: "Google Ads / Meta Ads / LinkedIn Ads / Amazon Ads",
    PK: "Google Ads / Meta Ads / TikTok Ads",
    BD: "Google Ads / Meta Ads / Facebook Ads",
    AU: "Google Ads / Meta Ads / LinkedIn Ads / Amazon Ads",
    NZ: "Google Ads / Meta Ads / LinkedIn Ads",
    ZA: "Google Ads / Meta Ads / TikTok Ads",
    EG: "Google Ads / Meta Ads / TikTok Ads",
    NG: "Google Ads / Meta Ads / Instagram Ads / TikTok Ads",
    KE: "Google Ads / Meta Ads / Instagram Ads"
  };

  return map[countryCode] || "Google Ads / Meta Ads / LinkedIn Ads";
}

function getDefaultEcommercePlatforms(countryCode) {
  const map = {
    JP: "Amazon Japan / Rakuten / Yahoo Shopping",
    KR: "Coupang / Naver Shopping / 11st",
    TW: "Shopee / Momo / PChome",
    HK: "HKTVmall / Carousell / Amazon",
    SG: "Shopee / Lazada / Amazon",
    MY: "Shopee / Lazada / TikTok Shop",
    TH: "Shopee / Lazada / TikTok Shop",
    VN: "Shopee / Lazada / Tiki",
    ID: "Tokopedia / Shopee / Lazada",
    PH: "Shopee / Lazada / TikTok Shop",
    AE: "Noon / Amazon.ae / Carrefour",
    SA: "Noon / Amazon.sa / Jarir",
    IL: "Amazon / Zap / KSP",
    TR: "Trendyol / Hepsiburada / N11",
    DE: "Amazon / Otto / Zalando",
    FR: "Amazon / Cdiscount / Fnac",
    GB: "Amazon / eBay / Argos",
    IT: "Amazon / ePrice / Zalando",
    ES: "Amazon / El Corte Ingles / PcComponentes",
    NL: "Bol / Amazon / Coolblue",
    PL: "Allegro / Amazon / Empik",
    US: "Amazon / Walmart / eBay",
    CA: "Amazon / Walmart / Best Buy",
    MX: "Mercado Libre / Amazon / Liverpool",
    BR: "Mercado Livre / Amazon / Magazine Luiza",
    AR: "Mercado Libre / Fravega / Coto",
    CL: "Mercado Libre / Falabella / Paris",
    CO: "Mercado Libre / Falabella / Exito",
    PE: "Mercado Libre / Falabella / Ripley",
    CN: "1688 / 淘宝 / 京东 / 拼多多",
    IN: "Amazon / Flipkart / Meesho",
    PK: "Daraz / OLX / PriceOye",
    BD: "Daraz / Pickaboo / Ajkerdeal",
    AU: "Amazon / eBay / Catch",
    NZ: "Trade Me / Amazon / TheMarket",
    ZA: "Takealot / Makro / Superbalist",
    EG: "Jumia / Amazon.eg / Noon",
    NG: "Jumia / Konga / Jiji",
    KE: "Jumia / Kilimall / Sky.Garden"
  };

  return map[countryCode] || "Amazon / eBay / Local Marketplace";
}

function getDefaultSearchEngines(countryCode) {
  const map = {
    JP: "Google / Yahoo Japan",
    KR: "Naver / Google / Daum",
    TW: "Google / Yahoo",
    HK: "Google / Yahoo",
    SG: "Google / Bing",
    MY: "Google / Bing",
    TH: "Google / Bing",
    VN: "Google / Cốc Cốc / Bing",
    ID: "Google / Bing",
    PH: "Google / Bing",
    AE: "Google / Bing",
    SA: "Google / Bing",
    IL: "Google / Bing",
    TR: "Google / Yandex",
    DE: "Google / Bing",
    FR: "Google / Bing / Qwant",
    GB: "Google / Bing",
    IT: "Google / Bing",
    ES: "Google / Bing",
    NL: "Google / Bing",
    PL: "Google / Bing",
    US: "Google / Bing",
    CA: "Google / Bing",
    MX: "Google / Bing",
    BR: "Google / Bing",
    AR: "Google / Bing",
    CL: "Google / Bing",
    CO: "Google / Bing",
    PE: "Google / Bing",
    CN: "百度 / 搜狗 / 360搜索",
    IN: "Google / Bing",
    PK: "Google / Bing",
    BD: "Google / Bing",
    AU: "Google / Bing",
    NZ: "Google / Bing",
    ZA: "Google / Bing",
    EG: "Google / Bing",
    NG: "Google / Bing",
    KE: "Google / Bing"
  };

  return map[countryCode] || "Google / Bing";
}

function getSearchGradientClass(key) {
  const palettes = [
    "search-palette-a",
    "search-palette-b",
    "search-palette-c",
    "search-palette-d",
    "search-palette-e",
    "search-palette-f",
    "search-palette-g",
    "search-palette-h"
  ];

  const normalized = String(key || "");
  const sum = [...normalized].reduce((total, char) => total + char.charCodeAt(0), 0);
  return palettes[sum % palettes.length];
}

function getSyncLabel(status) {
  if (status === "live") {
    return "实时同步";
  }
  if (status === "stale-fallback") {
    return "缓存兜底";
  }
  return "本地兜底";
}

function formatStamp(value) {
  if (!value) {
    return "未同步";
  }
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(new Date(value));
  } catch {
    return value;
  }
}
