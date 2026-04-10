import { useEffect, useMemo, useState } from "react";
import { fetchCountryDirectory } from "./api/client";
import { cityContactMetaById } from "./data/cityContactMetaById";
import { cityMetaById } from "./data/cityMetaById";
import { formatTime, getDeltaText, getWorkStatus, getZonedParts } from "./utils/time";
import appIcon from "../assets/app-icon.png";

const continents = [
  { key: "all", nameZh: "全部" },
  { key: "Asia", nameZh: "亚洲" },
  { key: "Europe", nameZh: "欧洲" },
  { key: "North America", nameZh: "北美洲" },
  { key: "South America", nameZh: "南美洲" },
  { key: "Africa", nameZh: "非洲" },
  { key: "Oceania", nameZh: "大洋洲" }
];

const statusOptions = [
  { key: "all", label: "全部状态" },
  { key: "working", label: "工作中" },
  { key: "upcoming", label: "即将上班" },
  { key: "break", label: "午休中" },
  { key: "off", label: "已下班" }
];

const FAVORITES_KEY = "desktop.favoriteCities";
const RECENT_KEY = "desktop.recentCities";

export default function AppDesktop() {
  const [now, setNow] = useState(() => new Date());
  const [query, setQuery] = useState("");
  const [activeContinent, setActiveContinent] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [directory, setDirectory] = useState({ countries: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favoriteCityIds, setFavoriteCityIds] = useState(() => readStorageArray(FAVORITES_KEY));
  const [recentCityIds, setRecentCityIds] = useState(() => readStorageArray(RECENT_KEY));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    void loadDirectory();
  }, []);

  useEffect(() => {
    writeStorageArray(FAVORITES_KEY, favoriteCityIds);
  }, [favoriteCityIds]);

  useEffect(() => {
    writeStorageArray(RECENT_KEY, recentCityIds);
  }, [recentCityIds]);

  async function loadDirectory() {
    setLoading(true);
    try {
      const nextDirectory = await fetchCountryDirectory({ refresh: true });
      setDirectory(nextDirectory);
      setError("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "桌面数据加载失败");
    } finally {
      setLoading(false);
    }
  }

  const countries = useMemo(
    () => directory.countries.map((country) => enrichCountry(country, now)),
    [directory.countries, now]
  );

  const cityCards = useMemo(
    () =>
      countries.flatMap((country) =>
        (country.meta.cities || []).map((city) =>
          enrichCity(city, country, now, {
            isFavorite: favoriteCityIds.includes(city.id),
            isRecent: recentCityIds.includes(city.id)
          })
        )
      ),
    [countries, now, favoriteCityIds, recentCityIds]
  );

  const normalizedQuery = query.trim().toLowerCase();
  const filteredCities = cityCards
    .filter((city) => (activeContinent === "all" ? true : city.continent === activeContinent))
    .filter((city) => (statusFilter === "all" ? true : city.status.kind === statusFilter));

  const visibleCities = filteredCities
    .filter((city) => matchesCity(city, normalizedQuery))
    .sort(sortCities)
    .slice(0, normalizedQuery ? 18 : 24);

  const selectedCity = cityCards.find((city) => city.id === selectedCityId) || visibleCities[0] || null;

  useEffect(() => {
    if (!selectedCity) {
      return;
    }
    setRecentCityIds((current) => {
      const next = [selectedCity.id, ...current.filter((item) => item !== selectedCity.id)];
      return next.slice(0, 8);
    });
  }, [selectedCity?.id]);

  const beijingParts = getZonedParts(now, "Asia/Shanghai");
  const beijingTime = formatTime(beijingParts.hour, beijingParts.minute, beijingParts.second);
  const beijingDate = `${beijingParts.month}月${beijingParts.day}日 星期${weekdayLabel(beijingParts.weekday)}`;
  const favoriteCities = favoriteCityIds.map((id) => cityCards.find((city) => city.id === id)).filter(Boolean);
  const recentCities = recentCityIds.map((id) => cityCards.find((city) => city.id === id)).filter(Boolean);
  const workingCount = cityCards.filter((item) => item.status.kind === "working").length;
  const upcomingCount = cityCards.filter((item) => item.status.kind === "upcoming").length;
  const favoriteCount = favoriteCities.length;
  const primaryCount = cityCards.filter((item) => item.isPrimary).length;

  function selectCity(cityId) {
    setSelectedCityId(cityId);
  }

  function toggleFavorite(cityId) {
    setFavoriteCityIds((current) =>
      current.includes(cityId) ? current.filter((item) => item !== cityId) : [cityId, ...current].slice(0, 12)
    );
  }

  return (
    <div className="desktop-shell">
      <aside className="desktop-sidebar glass-card">
        <div className="desktop-brand-block">
          <div className="desktop-brand-row">
            <img className="desktop-brand-icon" src={appIcon} alt="Global City Times" />
            <div className="desktop-brand-copy">
              <h1 className="desktop-title">
                <span>全球城市时间</span>
              </h1>
            </div>
          </div>
        </div>

        <div className="desktop-search-block">
          <label className="field-label" htmlFor="desktopSearchInput">搜索城市 / 国家 / 国家代码</label>
          <div className="search-shell">
            <input
              id="desktopSearchInput"
              className="search-input search-input-fancy"
              type="text"
              placeholder="例如：Bangkok / Japan / JP / Dubai"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        <div className="desktop-filter-stack">
          <div className="desktop-chip-row">
            {continents.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`desktop-chip ${activeContinent === item.key ? "is-active" : ""}`}
                onClick={() => setActiveContinent(item.key)}
              >
                {item.nameZh}
              </button>
            ))}
          </div>

          <label className="web-select-field">
            <span>工作状态</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {statusOptions.map((item) => (
                <option key={item.key} value={item.key}>{item.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="desktop-metrics">
          <article className="desktop-metric-card accent-cyan">
            <span>工作中城市</span>
            <strong>{workingCount}</strong>
          </article>
          <article className="desktop-metric-card accent-sand">
            <span>即将上班</span>
            <strong>{upcomingCount}</strong>
          </article>
          <article className="desktop-metric-card accent-rose">
            <span>重点城市</span>
            <strong>{primaryCount}</strong>
          </article>
        </div>

        <div className="desktop-side-section glass-subcard">
          <div className="desktop-side-head">
            <div>
              <p className="section-kicker">Favorites</p>
              <h3>收藏城市</h3>
            </div>
            <span className="desktop-side-count">{favoriteCount}</span>
          </div>
          <div className="desktop-mini-list">
            {favoriteCities.length ? (
              favoriteCities.map((city) => (
                <button key={city.id} type="button" className="desktop-mini-item" onClick={() => selectCity(city.id)}>
                  <div>
                    <strong>{city.nameZh}</strong>
                    <span>{city.countryNameZh}</span>
                  </div>
                  <span className={`mini-status ${city.status.kind}`}>{city.status.label}</span>
                </button>
              ))
            ) : (
              <div className="empty-state compact">还没有收藏城市。点卡片右上角星标即可收藏。</div>
            )}
          </div>
        </div>

        <div className="desktop-side-section glass-subcard">
          <div className="desktop-side-head">
            <div>
              <p className="section-kicker">Recent</p>
              <h3>常用城市</h3>
            </div>
            <span className="desktop-side-count">{recentCities.length}</span>
          </div>
          <div className="desktop-mini-list">
            {recentCities.length ? (
              recentCities.map((city) => (
                <button key={city.id} type="button" className="desktop-mini-item" onClick={() => selectCity(city.id)}>
                  <div>
                    <strong>{city.nameZh}</strong>
                    <span>{city.nameEn}</span>
                  </div>
                  <span className="desktop-mini-time">{city.localTimeText}</span>
                </button>
              ))
            ) : (
              <div className="empty-state compact">查看过的城市会自动进入这里，方便反复切换。</div>
            )}
          </div>
        </div>

        {error ? <div className="inline-error">{error}</div> : null}
      </aside>

      <section className="desktop-workspace">
        <div className="desktop-command-bar glass-card">
          <div className="desktop-command-clock">
            <span className="panel-label">北京时间</span>
            <strong>{beijingTime}</strong>
            <p>{beijingDate}</p>
          </div>
          <div className="desktop-command-stats">
            <div>
              <span>当前城市结果</span>
              <strong>{visibleCities.length}</strong>
            </div>
            <div>
              <span>收藏城市</span>
              <strong>{favoriteCount}</strong>
            </div>
            <div>
              <span>重点城市</span>
              <strong>{primaryCount}</strong>
            </div>
          </div>
        </div>

        <div className="desktop-workgrid">
          <div className="desktop-board glass-card">
            <div className="section-heading compact">
              <div>
                <p className="section-kicker">City Board</p>
                <h2>{normalizedQuery ? "搜索城市结果" : "桌面城市看板"}</h2>
              </div>
              <p className="section-note">当前显示 {visibleCities.length} 个城市</p>
            </div>

            <div className="city-grid desktop-city-grid">
              {visibleCities.length ? (
                visibleCities.map((city) => (
                  <DesktopCityCard
                    key={city.id}
                    city={city}
                    active={selectedCity?.id === city.id}
                    onOpen={() => selectCity(city.id)}
                    onToggleFavorite={() => toggleFavorite(city.id)}
                  />
                ))
              ) : (
                <div className="empty-state">当前筛选下没有城市结果，请调整关键词或筛选条件。</div>
              )}
            </div>
          </div>

          <div className={`desktop-detail-pane glass-card ${selectedCity ? `desktop-detail-theme ${getSearchGradientClass(selectedCity.id)}` : ""}`}>
            {selectedCity ? (
              <DesktopCityDetail
                city={selectedCity}
                isFavorite={favoriteCityIds.includes(selectedCity.id)}
                onToggleFavorite={() => toggleFavorite(selectedCity.id)}
              />
            ) : (
              <div className="empty-state">请选择一个城市查看详情。</div>
            )}
          </div>
        </div>
      </section>

      {loading ? <div className="web-loading">正在加载桌面城市数据...</div> : null}
    </div>
  );
}

function DesktopCityCard({ city, active, onOpen, onToggleFavorite }) {
  return (
    <article
      className={`city-card glass-card ${getSearchGradientClass(city.id)} desktop-city-card ${active ? "is-active" : ""}`}
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
        <div className="desktop-card-actions">
          <button
            type="button"
            className={`desktop-favorite-button ${city.isFavorite ? "is-active" : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite();
            }}
            aria-label={city.isFavorite ? "取消收藏城市" : "收藏城市"}
          >
            ★
          </button>
          <div className={`status-badge ${city.status.kind}`}>{city.status.label}</div>
        </div>
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

function DesktopCityDetail({
  city,
  isFavorite,
  onToggleFavorite
}) {
  return (
    <div className="desktop-detail-content">
      <div className="drawer-header desktop-detail-header">
        <div>
          <p className="eyebrow">City Brief</p>
          <h2>{city.nameZh}</h2>
          <p className="drawer-subtitle">{city.nameEn} / {city.countryNameZh}</p>
        </div>
        <button type="button" className={`desktop-detail-favorite ${isFavorite ? "is-active" : ""}`} onClick={onToggleFavorite}>
          {isFavorite ? "已收藏" : "收藏城市"}
        </button>
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

function enrichCity(city, country, now, flags) {
  const localParts = getZonedParts(now, city.timezone);
  const status = getWorkStatus(localParts, country.businessHours);
  const cityMeta = cityMetaById[city.id] || {};
  const cityContactMeta = cityContactMetaById[city.id] || {};

  return {
    ...city,
    ...cityMeta,
    ...cityContactMeta,
    ...flags,
    countryCode: country.code,
    countryNameZh: country.nameZh,
    countryNameEn: country.nameEn,
    continent: country.continent,
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

function sortCities(a, b) {
  if (a.isFavorite && !b.isFavorite) {
    return -1;
  }
  if (!a.isFavorite && b.isFavorite) {
    return 1;
  }
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

function weekdayLabel(weekday) {
  const map = {
    Monday: "一",
    Tuesday: "二",
    Wednesday: "三",
    Thursday: "四",
    Friday: "五",
    Saturday: "六",
    Sunday: "日"
  };
  return map[weekday] || "";
}

function readStorageArray(key) {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorageArray(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}
