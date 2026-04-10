import { useEffect, useMemo, useState } from "react";
import { fetchCountryDirectory } from "./api/client";
import {
  BEIJING_TZ,
  formatBusinessHours,
  formatTime,
  getBeijingWindowText,
  getContactTip,
  getDeltaText,
  getFormatter,
  getWorkStatus,
  getZonedParts
} from "./utils/time";

const defaultFavorites = ["US", "GB", "DE", "AE", "AU"];
const fallbackContinents = [
  { key: "Asia", nameZh: "亚洲", nameEn: "Asia", description: "东亚、东南亚、南亚和中东重点市场" },
  { key: "Europe", nameZh: "欧洲", nameEn: "Europe", description: "西欧、中欧、北欧和南欧主要国家" },
  { key: "North America", nameZh: "北美洲", nameEn: "North America", description: "北美、中美洲与加勒比市场" },
  { key: "South America", nameZh: "南美洲", nameEn: "South America", description: "拉美南美开发区" },
  { key: "Africa", nameZh: "非洲", nameEn: "Africa", description: "北非、西非、东非和南部非洲" },
  { key: "Oceania", nameZh: "大洋洲", nameEn: "Oceania", description: "澳新与太平洋岛国市场" },
  { key: "Antarctica", nameZh: "南极洲", nameEn: "Antarctica", description: "无常驻主权国家，仅保留说明板块" }
];

export default function AppRuntime() {
  const [now, setNow] = useState(() => new Date());
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState(() => loadFavorites());
  const [preferences, setPreferences] = useState(() => loadPreferences());
  const [clients, setClients] = useState(() => loadClients());
  const [clientDraft, setClientDraft] = useState({ name: "", countryCode: "US", cityId: "", note: "", status: "follow_up" });
  const [selectedCode, setSelectedCode] = useState(null);
  const [directory, setDirectory] = useState({ continents: fallbackContinents, countries: [], sync: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem("trade-time-favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("trade-time-preferences", JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem("trade-time-clients", JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    void loadDirectory();
  }, []);

  const cards = useMemo(
    () => directory.countries.map((country) => enrichCountry(country, now, favorites, preferences[country.code])),
    [directory.countries, now, favorites, preferences]
  );
  const cityCards = useMemo(
    () => cards.flatMap((country) => (country.meta.cities || []).map((city) => enrichCity(city, country, now))),
    [cards, now]
  );

  const favoriteCards = cards.filter((item) => item.isFavorite).sort(sortCards);
  const matchedCards = cards.filter((card) => matchesCountryQuery(card, query));
  const matchedCityCards = cityCards.filter((city) => matchesCityQuery(city, query));
  const priorityCityCards = cityCards.filter((city) => city.isPrimary).sort(sortCityCards).slice(0, 12);
  const hasQuery = Boolean(query.trim());
  const todayTasks = getTodayTasks(clients, cards, cityCards).slice(0, 8);
  const clientSummary = getClientSummary(clients);
  const clientCityOptions = cards.find((card) => card.code === clientDraft.countryCode)?.meta?.cities || [];
  const groupedCards = (directory.continents?.length ? directory.continents : fallbackContinents).map((continent) => ({
    ...continent,
    cards: matchedCards.filter((card) => card.continent === continent.key).sort(sortCards)
  }));

  const selectedCard = cards.find((item) => item.code === selectedCode) || null;
  const workingCount = cards.filter((item) => item.status.kind === "working").length;
  const upcomingCount = cards.filter((item) => item.status.kind === "upcoming").length;

  const beijingTime = getFormatter(BEIJING_TZ, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(now);

  const beijingDate = getFormatter(BEIJING_TZ, {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(now);

  async function loadDirectory({ refresh = false } = {}) {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const nextDirectory = await fetchCountryDirectory({ refresh });
      setDirectory(nextDirectory);
      setError("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "数据加载失败");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  return (
    <div className="page-shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Global Trade Clockboard</p>
          <h1>外贸开发国家时间对照台</h1>
          <p className="hero-text">
            时间按秒更新，国家基础资料自动同步，市场洞察作为稳定参考。Web 端和桌面端共用同一套数据层。
          </p>

          <div className="data-status-bar">
            <div className={`sync-pill ${directory.sync?.status || "fallback"}`}>
              {getSyncLabel(directory.sync?.status)}
            </div>
            <div className="sync-meta">
              <strong>数据源</strong>
              <span>{directory.sync?.sourceLabel || "本地缓存"}</span>
            </div>
            <div className="sync-meta">
              <strong>最近更新</strong>
              <span>{formatStamp(directory.sync?.lastUpdatedAt)}</span>
            </div>
            <button className="refresh-button" type="button" onClick={() => loadDirectory({ refresh: true })} disabled={refreshing}>
              {refreshing ? "同步中..." : "立即同步"}
            </button>
          </div>

          {error ? <div className="inline-error">{error}</div> : null}

          <div className="policy-strip">
            <PolicyChip title="实时" items={directory.sync?.policy?.realtime} tone="live" />
            <PolicyChip title="自动更新" items={directory.sync?.policy?.autoRefresh} tone="auto" />
            <PolicyChip title="参考资料" items={directory.sync?.policy?.reference} tone="ref" />
          </div>
        </div>

        <section className="beijing-panel" aria-label="北京时间">
          <p className="panel-label">北京时间</p>
          <div className="beijing-time">{beijingTime}</div>
          <div className="panel-subtitle">{beijingDate}</div>
          <div className="timezone-chip">Asia/Shanghai</div>
        </section>
      </header>

      <main className="layout">
        <section className="control-panel grouped-panel">
          <div className="search-card glass-card gradient-search">
            <label className="field-label" htmlFor="searchInput">搜索国家 / 英文 / 简称</label>
            <div className="search-shell">
              <input
                id="searchInput"
                className="search-input search-input-fancy"
                type="text"
                placeholder="例如：Germany、Brazil、UAE、Japan"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>

          <div className="stats-grid">
            <article className="stat-card glass-card gradient-stat-a">
              <p className="stat-label">重点国家</p>
              <strong className="stat-value">{favoriteCards.length}</strong>
            </article>
            <article className="stat-card glass-card gradient-stat-b">
              <p className="stat-label">当前工作中</p>
              <strong className="stat-value">{workingCount}</strong>
            </article>
            <article className="stat-card glass-card gradient-stat-c">
              <p className="stat-label">即将可联系</p>
              <strong className="stat-value">{upcomingCount}</strong>
            </article>
          </div>
        </section>

        {hasQuery ? (
          <section className="search-results-panel glass-card">
            <div className="section-heading compact">
              <div>
                <p className="section-kicker">Search Results</p>
                <h2>搜索结果</h2>
              </div>
              <p className="section-note">已匹配 {matchedCityCards.length} 个城市、{matchedCards.length} 个国家，结果直接显示在搜索框下方。</p>
            </div>

            <div className="search-stack">
              <div>
                <p className="result-kicker">City Matches</p>
                <div className="cards-grid search-results-grid city-results-grid">
                  <CityGrid
                    cards={matchedCityCards}
                    emptyText="没有匹配到城市，试试输入城市名、国家名或国家代码。"
                    onSelectCountry={setSelectedCode}
                    variant="search"
                  />
                </div>
              </div>

              <div>
                <p className="result-kicker">Country Matches</p>
                <div className="cards-grid search-results-grid">
                  <CountryGrid
                    cards={matchedCards}
                    emptyText="没有匹配到国家，请换国家中文名、英文名、简称或国家代码。"
                    favorites={favorites}
                    onToggleFavorite={setFavorites}
                    onSelect={setSelectedCode}
                    variant="search"
                  />
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {!hasQuery ? (
          <section className="glass-card city-workbench">
            <div className="section-heading compact">
              <div>
                <p className="section-kicker">City Desk</p>
                <h2>重点城市工作台</h2>
              </div>
              <p className="section-note">国家负责判断市场，城市负责实际开发动作。先把常用主城市放在首页，直接看当地时间、推荐联系窗口和行业方向。</p>
            </div>

            <div className="city-grid">
              <CityGrid
                cards={priorityCityCards}
                emptyText="城市数据还在准备中。"
                onSelectCountry={setSelectedCode}
              />
            </div>
          </section>
        ) : null}

        <section className="dashboard-strip">
          <article className="dashboard-card glass-card">
            <div className="insight-heading">
              <div>
                <p className="section-kicker">Today Tasks</p>
                <h2>今日任务面板</h2>
              </div>
              <p className="section-note">优先把正在上班或即将上班的客户排在前面。</p>
            </div>

            <div className="task-list">
              {todayTasks.length ? (
                todayTasks.map((task) => (
                  <button
                    key={task.id}
                    className="task-item"
                    type="button"
                    onClick={() => setSelectedCode(task.countryCode)}
                  >
                    <CodeBadge code={task.countryCode} size="small" />
                    <div className="task-copy">
                      <strong>{task.name}</strong>
                      <span>{task.countryName} / {task.localTimeText}</span>
                    </div>
                    <div className={`task-status ${task.statusKind}`}>{task.statusLabel}</div>
                  </button>
                ))
              ) : (
                <div className="empty-state">还没有需要处理的客户任务。</div>
              )}
            </div>
          </article>

          <article className="dashboard-card glass-card">
            <div className="insight-heading">
              <div>
                <p className="section-kicker">Client Status</p>
                <h2>客户状态分组</h2>
              </div>
              <p className="section-note">把客户按跟进阶段分组，页面更像工作台而不是信息列表。</p>
            </div>

            <div className="status-summary-grid">
              {clientSummary.map((item) => (
                <div key={item.key} className={`status-summary-card ${item.key}`}>
                  <strong>{item.label}</strong>
                  <span>{item.count} 个客户</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="glass-card client-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Client Desk</p>
              <h2>客户管理</h2>
            </div>
            <p className="section-note">先做最小可用版，把客户与国家绑定，后续就能按国家直接跟进。</p>
          </div>

          <div className="client-layout">
            <form
              className="client-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (!clientDraft.name.trim()) {
                  return;
                }

                setClients((current) => [
                  {
                    id: crypto.randomUUID(),
                    name: clientDraft.name.trim(),
                    countryCode: clientDraft.countryCode,
                    cityId: clientDraft.cityId || "",
                    note: clientDraft.note.trim(),
                    status: clientDraft.status
                  },
                  ...current
                ]);
                setClientDraft((current) => ({ ...current, name: "", note: "" }));
              }}
            >
              <label className="drawer-field">
                <span>客户名称</span>
                <input
                  type="text"
                  value={clientDraft.name}
                  onChange={(event) => setClientDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="例如：ABC Trading"
                />
              </label>

              <label className="drawer-field">
                <span>绑定国家</span>
                <select
                  value={clientDraft.countryCode}
                  onChange={(event) => {
                    const nextCountryCode = event.target.value;
                    const nextCities = cards.find((card) => card.code === nextCountryCode)?.meta?.cities || [];
                    setClientDraft((current) => ({
                      ...current,
                      countryCode: nextCountryCode,
                      cityId: nextCities.find((item) => item.isPrimary)?.id || nextCities[0]?.id || ""
                    }));
                  }}
                >
                  {cards.map((card) => (
                    <option key={card.code} value={card.code}>
                      {card.code} - {card.nameZh}
                    </option>
                  ))}
                </select>
              </label>

              <label className="drawer-field">
                <span>开发城市</span>
                <select
                  value={clientDraft.cityId}
                  onChange={(event) => setClientDraft((current) => ({ ...current, cityId: event.target.value }))}
                >
                  <option value="">先按国家跟进</option>
                  {clientCityOptions.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.nameZh} / {city.nameEn}
                    </option>
                  ))}
                </select>
              </label>

              <label className="drawer-field">
                <span>备注</span>
                <input
                  type="text"
                  value={clientDraft.note}
                  onChange={(event) => setClientDraft((current) => ({ ...current, note: event.target.value }))}
                  placeholder="例如：偏邮件沟通 / 主做批发"
                />
              </label>

              <label className="drawer-field">
                <span>客户状态</span>
                <select
                  value={clientDraft.status}
                  onChange={(event) => setClientDraft((current) => ({ ...current, status: event.target.value }))}
                >
                  <option value="follow_up">跟进中</option>
                  <option value="quoted">已报价</option>
                  <option value="waiting_reply">待回复</option>
                  <option value="key_account">重点客户</option>
                </select>
              </label>

              <button className="refresh-button" type="submit">添加客户</button>
            </form>

            <div className="client-list">
              {clients.length ? (
                clients.map((client) => {
                  const card = cards.find((item) => item.code === client.countryCode);
                  const city = cityCards.find((item) => item.id === client.cityId);
                  return (
                    <article key={client.id} className="client-item">
                      <div>
                        <strong>{client.name}</strong>
                        <p>{client.countryCode} / {card?.nameZh || "未匹配国家"}</p>
                        <p>{city ? `${city.nameZh} / ${city.nameEn}` : "未指定城市"}</p>
                        <p>{getClientStatusLabel(client.status)}</p>
                        <p>{client.note || "无备注"}</p>
                      </div>
                      <div className="client-actions">
                        <button className="window-tag" type="button" onClick={() => setSelectedCode(client.countryCode)}>
                          查看国家
                        </button>
                        <button
                          className="window-tag danger"
                          type="button"
                          onClick={() => setClients((current) => current.filter((item) => item.id !== client.id))}
                        >
                          删除
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="empty-state">还没有客户，先添加几个你正在开发的客户。</div>
              )}
            </div>
          </div>
        </section>

        {!hasQuery ? (
          <>
            <SectionBlock kicker="Priority Markets" title="重点国家" note="保留你最常开发的市场，下面按七大洲继续浏览。">
              <div className="cards-grid">
                <CountryGrid
                  cards={favoriteCards}
                  emptyText={loading ? "正在加载重点国家..." : "还没有收藏重点国家。"}
                  favorites={favorites}
                  onToggleFavorite={setFavorites}
                  onSelect={setSelectedCode}
                  variant="default"
                />
              </div>
            </SectionBlock>

            {groupedCards.map((continent) => (
              <SectionBlock
                key={continent.key}
                kicker={continent.nameEn}
                title={continent.nameZh}
                note={
                  continent.key === "Antarctica"
                    ? continent.description
                    : `${continent.description}，当前匹配 ${continent.cards.length} 个国家`
                }
                sectionKey={continent.key}
              >
                {continent.key === "Antarctica" ? (
                  <div className="empty-state continent-note">南极洲没有常驻主权国家，因此保留为说明板块。</div>
                ) : (
                  <div className="cards-grid">
                    <CountryGrid
                      cards={continent.cards}
                      emptyText={loading ? "数据加载中..." : `${continent.nameZh}当前没有匹配国家。`}
                      favorites={favorites}
                      onToggleFavorite={setFavorites}
                      onSelect={setSelectedCode}
                      variant="default"
                    />
                  </div>
                )}
              </SectionBlock>
            ))}
          </>
        ) : null}
      </main>

      {selectedCard ? (
        <DetailDrawer
          card={selectedCard}
          sync={directory.sync}
          preference={preferences[selectedCard.code]}
          onClose={() => setSelectedCode(null)}
          onUpdate={(next) => setPreferences((current) => ({ ...current, [selectedCard.code]: next }))}
          onReset={() => {
            setPreferences((current) => {
              const next = { ...current };
              delete next[selectedCard.code];
              return next;
            });
          }}
        />
      ) : null}
    </div>
  );
}

function DetailDrawer({ card, sync, preference, onClose, onUpdate, onReset }) {
  const activeTimezone = preference?.timezone || card.timezone;
  const activeHours = preference?.businessHours || card.businessHours;

  return (
    <aside className="detail-drawer" role="dialog" aria-modal="true">
      <div className="detail-overlay" onClick={onClose} />
      <div className="detail-panel">
        <button className="drawer-close" type="button" onClick={onClose}>关闭</button>
        <div className="detail-hero">
          <div>
            <CodeBadge code={card.code} size="large" />
            <h2>{card.nameZh}</h2>
            <p className="detail-subtitle">{card.nameEn}</p>
          </div>
          <div className="detail-sync-box">
            <span className={`sync-pill small ${sync?.status || "fallback"}`}>{getSyncLabel(sync?.status)}</span>
            <span>{formatStamp(sync?.lastUpdatedAt)}</span>
          </div>
        </div>

        <div className="detail-meta-grid">
          <MetaTile label="首都" value={card.meta.capital} />
          <MetaTile label="所属大洲" value={card.meta.continent} />
          <MetaTile label="人口" value={card.meta.population} />
          <MetaTile label="国土面积" value={card.meta.area} />
          <MetaTile label="语言" value={joinValue(card.meta.languages)} />
          <MetaTile label="主要城市" value={joinValue(card.meta.majorCities)} />
          <MetaTile label="时区" value={activeTimezone} />
          <MetaTile label="国家代码" value={card.meta.isoCode} />
          <MetaTile label="电话区号" value={card.meta.dialingCode} />
          <MetaTile label="货币名称" value={card.meta.currencyName} />
          <MetaTile label="货币代码" value={card.meta.currencyCode} />
          <MetaTile label="驾驶方向" value={card.meta.drivingSide} />
          <MetaTile label="日期格式" value={card.meta.dateFormat} />
          <MetaTile label="数字/计量习惯" value={card.meta.measurementStyle} />
          <MetaTile label="电压与插头" value={card.meta.powerStandard} />
          <MetaTile label="国家域名后缀" value={card.meta.domainSuffix} />
          <MetaTile label="宗教" value={card.meta.religion} />
          <MetaTile label="资料来源" value={`${card.sources.foundation} / ${card.sources.tradeProfile}`} />
        </div>

        {Array.isArray(card.meta.cities) && card.meta.cities.length ? (
          <section className="city-detail-section">
            <div className="market-intelligence-head">
              <div>
                <p className="section-kicker">City Focus</p>
                <h3>重点城市</h3>
              </div>
              <p className="section-note">先按城市做开发动作。这里保留每个国家最常用的城市、行业方向和北京时间联系窗口。</p>
            </div>

            <div className="detail-city-grid">
              {card.meta.cities.map((city) => (
                <div key={city.id} className="detail-city-card">
                  <div className="detail-city-head">
                    <strong>{city.nameZh}</strong>
                    <span>{city.nameEn}</span>
                  </div>
                  <p><span>时区</span>{city.timezone}</p>
                  <p><span>行业</span>{city.industry}</p>
                  <p><span>北京时间联系</span>{city.contactWindowBeijing}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="market-intelligence">
          <div className="market-intelligence-head">
            <div>
              <p className="section-kicker">Market Intelligence</p>
              <h3>市场洞察</h3>
            </div>
            <p className="section-note">这部分用于外贸判断市场成熟度、成交偏好和消费能力，属于参考资料，不追求实时更新。</p>
          </div>

          <div className="market-grid">
            <MetaTile label="GDP" value={card.meta.gdp} />
            <MetaTile label="人均GDP" value={card.meta.gdpPerCapita} />
            <MetaTile label="经济类型" value={card.meta.economicType} />
            <MetaTile label="主要产业" value={joinValue(card.meta.mainIndustries)} />
            <MetaTile label="进口依赖程度" value={card.meta.importDependency} />
            <MetaTile label="出口优势产业" value={joinValue(card.meta.exportAdvantage)} />
            <MetaTile label="中产阶级规模" value={card.meta.middleClassScale} />
            <MetaTile label="消费水平" value={card.meta.consumptionLevel} />
            <MetaTile label="城市化率" value={card.meta.urbanizationRate} />
            <MetaTile label="年轻人口占比" value={card.meta.youthPopulationShare} />
            <MetaTile label="价格敏感度" value={card.meta.priceSensitivity} />
            <MetaTile label="品牌敏感度" value={card.meta.brandSensitivity} />
            <MetaTile label="关系型成交倾向" value={card.meta.relationshipDriven} />
            <MetaTile label="电商渗透率" value={card.meta.ecommercePenetration} />
            <MetaTile label="手机/互联网普及率" value={card.meta.mobileInternetPenetration} />
          </div>
        </div>

        <div className="market-intelligence social-intelligence">
          <div className="market-intelligence-head">
            <div>
              <p className="section-kicker">Digital Channels</p>
              <h3>社媒与广告渠道</h3>
            </div>
            <p className="section-note">用于判断该国家更适合做内容运营、广告投放，还是更偏商务型触达，方便你选 LinkedIn、Meta、TikTok 或本地主流平台。</p>
          </div>

          <div className="market-grid">
            <MetaTile label="主流社交平台" value={joinValue(card.meta.mainSocialPlatforms)} />
            <MetaTile label="主流广告平台" value={joinValue(card.meta.mainAdPlatforms)} />
            <MetaTile label="LinkedIn活跃度" value={card.meta.linkedinActivity} />
            <MetaTile label="Facebook活跃度" value={card.meta.facebookActivity} />
            <MetaTile label="Instagram活跃度" value={card.meta.instagramActivity} />
            <MetaTile label="TikTok活跃度" value={card.meta.tiktokActivity} />
          </div>
        </div>

        <div className="detail-two-col">
          <div className="detail-card">
            <h3>联系判断</h3>
            <p>当前状态：{card.status.label}</p>
            <p>北京时间建议联系窗口：{card.beijingWindowText}</p>
            <p>{card.contactTip}</p>
          </div>

          <div className="detail-card">
            <h3>工作规则</h3>
            <TimezonePicker card={card} preference={preference} onUpdate={onUpdate} />
            <WorkingHoursEditor activeHours={activeHours} onUpdate={onUpdate} preference={preference} />
            <div className="drawer-actions">
              <button className="secondary-button" type="button" onClick={onReset}>恢复默认</button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function TimezonePicker({ card, preference, onUpdate }) {
  return (
    <label className="drawer-field">
      <span>业务时区</span>
      <select
        value={preference?.timezone || card.timezone}
        onChange={(event) =>
          onUpdate({
            ...(preference || {}),
            timezone: event.target.value,
            businessHours: preference?.businessHours || card.businessHours
          })
        }
      >
        {card.timezones.map((timezone) => (
          <option key={timezone} value={timezone}>
            {timezone}
          </option>
        ))}
      </select>
    </label>
  );
}

function WorkingHoursEditor({ activeHours, onUpdate, preference }) {
  function updateField(field, value) {
    onUpdate({
      ...(preference || {}),
      businessHours: {
        ...activeHours,
        [field]: value
      }
    });
  }

  return (
    <div className="drawer-stack">
      <label className="drawer-field">
        <span>上班时间</span>
        <input type="time" value={activeHours.start} onChange={(event) => updateField("start", event.target.value)} />
      </label>
      <label className="drawer-field">
        <span>下班时间</span>
        <input type="time" value={activeHours.end} onChange={(event) => updateField("end", event.target.value)} />
      </label>
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

function SectionBlock({ kicker, title, note, children, sectionKey }) {
  const sectionClass = getSectionClass(sectionKey || title);
  return (
    <section className={`section-block ${sectionClass}`}>
      <div className="section-heading">
        <div>
          <p className="section-kicker">{kicker}</p>
          <h2>{title}</h2>
        </div>
        <p className="section-note">{note}</p>
      </div>
      {children}
    </section>
  );
}

function CountryGrid({ cards, emptyText, favorites, onToggleFavorite, onSelect, variant = "default" }) {
  if (!cards.length) {
    return <div className="empty-state">{emptyText}</div>;
  }

  return cards.map((card) => (
    <CountryCard
      key={card.code}
      card={card}
      isFavorite={favorites.includes(card.code)}
      onToggleFavorite={() => toggleFavorite(card.code, favorites, onToggleFavorite)}
      onSelect={() => onSelect(card.code)}
      variant={variant}
    />
  ));
}

function CountryCard({ card, isFavorite, onToggleFavorite, onSelect, variant = "default" }) {
  const isSearch = variant === "search";
  const searchPaletteClass = isSearch ? getSearchGradientClass(card.code) : "";

  return (
    <article
      className={`country-card glass-card ${isSearch ? `search-card-layout ${searchPaletteClass}` : getRegionGradientClass(card.continent)}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => event.key === "Enter" && onSelect()}
    >
      <button
        className={`favorite-toggle ${isFavorite ? "is-favorite" : ""}`}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggleFavorite();
        }}
        aria-label="切换收藏"
      >
        {isFavorite ? "★" : "☆"}
      </button>

      <div className="card-top">
        <div>
          <CodeBadge code={card.code} size="small" />
          <p className="country-region">{card.region}</p>
          <h3 className="country-name">{card.nameZh}</h3>
          <p className="country-en">{card.nameEn}</p>
        </div>
        <div className={`status-badge ${card.status.kind}`}>{card.status.label}</div>
      </div>

      <div className={`time-strip ${isSearch ? "search-time-grid" : ""}`}>
        <div>
          <p className="meta-label">当地时间</p>
          <div className="time-value">{card.localTimeText}</div>
        </div>
        <div>
          <p className="meta-label">时差</p>
          <div className="delta-value">{card.deltaText}</div>
        </div>
      </div>

      <div className={`meta-grid ${isSearch ? "search-meta-grid" : ""}`}>
        <div>
          <p className="meta-label">业务时区</p>
          <p>{card.timezone}</p>
        </div>
        <div>
          <p className="meta-label">工作时段</p>
          <p>{card.workingHoursText}</p>
        </div>
        <div>
          <p className="meta-label">首都</p>
          <p>{card.meta.capital}</p>
        </div>
        <div>
          <p className="meta-label">货币</p>
          <p>{card.meta.currencyCode}</p>
        </div>
        <div>
          <p className="meta-label">电话区号</p>
          <p>{card.meta.dialingCode}</p>
        </div>
        <div>
          <p className="meta-label">域名后缀</p>
          <p>{card.meta.domainSuffix}</p>
        </div>
        <div>
          <p className="meta-label">语言</p>
          <p>{joinValue(card.meta.languages)}</p>
        </div>
        <div>
          <p className="meta-label">人口</p>
          <p>{card.meta.population}</p>
        </div>
        <div>
          <p className="meta-label">国土面积</p>
          <p>{card.meta.area}</p>
        </div>
        <div>
          <p className="meta-label">驾驶方向</p>
          <p>{card.meta.drivingSide}</p>
        </div>
      </div>

      <div className={`quick-insight-grid ${isSearch ? "search-insight-grid" : ""}`}>
        <div className="quick-insight">
          <p className="meta-label">经济类型</p>
          <p>{card.meta.economicType}</p>
        </div>
        <div className="quick-insight">
          <p className="meta-label">消费水平</p>
          <p>{card.meta.consumptionLevel}</p>
        </div>
        <div className="quick-insight">
          <p className="meta-label">价格敏感度</p>
          <p>{card.meta.priceSensitivity}</p>
        </div>
        <div className="quick-insight">
          <p className="meta-label">品牌敏感度</p>
          <p>{card.meta.brandSensitivity}</p>
        </div>
        <div className="quick-insight">
          <p className="meta-label">关系型成交</p>
          <p>{card.meta.relationshipDriven}</p>
        </div>
        <div className="quick-insight">
          <p className="meta-label">电商渗透率</p>
          <p>{card.meta.ecommercePenetration}</p>
        </div>
        <div className="quick-insight">
          <p className="meta-label">主流社媒</p>
          <p>{joinValue(card.meta.mainSocialPlatforms)}</p>
        </div>
        <div className="quick-insight">
          <p className="meta-label">主流广告</p>
          <p>{joinValue(card.meta.mainAdPlatforms)}</p>
        </div>
        <div className="quick-insight">
          <p className="meta-label">LinkedIn</p>
          <p>{card.meta.linkedinActivity || "待补充"}</p>
        </div>
        <div className="quick-insight">
          <p className="meta-label">Facebook</p>
          <p>{card.meta.facebookActivity || "待补充"}</p>
        </div>
        <div className="quick-insight">
          <p className="meta-label">Instagram</p>
          <p>{card.meta.instagramActivity || "待补充"}</p>
        </div>
        <div className="quick-insight">
          <p className="meta-label">TikTok</p>
          <p>{card.meta.tiktokActivity || "待补充"}</p>
        </div>
      </div>
    </article>
  );
}

function CityGrid({ cards, emptyText, onSelectCountry, variant = "default" }) {
  if (!cards.length) {
    return <div className="empty-state">{emptyText}</div>;
  }

  return cards.map((card) => (
    <CityCard
      key={card.id}
      card={card}
      onSelect={() => onSelectCountry(card.countryCode)}
      variant={variant}
    />
  ));
}

function CityCard({ card, onSelect, variant = "default" }) {
  const isSearch = variant === "search";
  const paletteClass = getSearchGradientClass(card.countryCode);

  return (
    <article
      className={`city-card glass-card ${paletteClass} ${isSearch ? "city-card-search" : ""}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => event.key === "Enter" && onSelect()}
    >
      <div className="city-card-top">
        <div>
          <div className="city-code-row">
            <CodeBadge code={card.countryCode} size="small" />
            {card.isPrimary ? <span className="city-primary-tag">Primary</span> : null}
          </div>
          <p className="country-region">{card.countryNameEn}</p>
          <h3 className="country-name">{card.nameZh}</h3>
          <p className="country-en">{card.nameEn}</p>
        </div>
        <div className={`status-badge ${card.status.kind}`}>{card.status.label}</div>
      </div>

      <div className="city-grid-meta">
        <div className="city-info-card">
          <p className="meta-label">当地时间</p>
          <div className="time-value compact">{card.localTimeText}</div>
        </div>
        <div className="city-info-card">
          <p className="meta-label">时差</p>
          <div className="delta-value">{card.deltaText}</div>
        </div>
        <div className="city-info-card">
          <p className="meta-label">所属国家</p>
          <p>{card.countryNameZh}</p>
        </div>
        <div className="city-info-card">
          <p className="meta-label">行业方向</p>
          <p>{card.industry}</p>
        </div>
        <div className="city-info-card">
          <p className="meta-label">城市时区</p>
          <p>{card.timezone}</p>
        </div>
        <div className="city-info-card">
          <p className="meta-label">北京时间联系</p>
          <p>{card.contactWindowBeijing}</p>
        </div>
      </div>
    </article>
  );
}

function CodeBadge({ code, size = "small" }) {
  return (
    <div className={`code-badge ${size}`}>
      <span>{code}</span>
    </div>
  );
}

function PolicyChip({ title, items, tone }) {
  return (
    <div className={`policy-chip ${tone}`}>
      <strong>{title}</strong>
      <span>{Array.isArray(items) && items.length ? items.join(" / ") : "待配置"}</span>
    </div>
  );
}

function enrichCountry(country, now, favorites, preference) {
  const timezone = preference?.timezone || country.timezone;
  const businessHours = preference?.businessHours || country.businessHours;
  const localParts = getZonedParts(now, timezone);
  const status = getWorkStatus(localParts, businessHours);

  return {
    ...country,
    timezone,
    businessHours,
    isFavorite: favorites.includes(country.code),
    status,
    localTimeText: formatTime(localParts.hour, localParts.minute, localParts.second),
    deltaText: getDeltaText(now, timezone),
    workingHoursText: formatBusinessHours(businessHours),
    beijingWindowText: getBeijingWindowText({ timezone, businessHours }, localParts),
    contactTip: getContactTip(status)
  };
}

function enrichCity(city, country, now) {
  const localParts = getZonedParts(now, city.timezone);
  const status = getWorkStatus(localParts, country.businessHours);

  return {
    ...city,
    countryCode: country.code,
    countryNameZh: country.nameZh,
    countryNameEn: country.nameEn,
    continent: country.continent,
    status,
    localTimeText: formatTime(localParts.hour, localParts.minute, localParts.second),
    deltaText: getDeltaText(now, city.timezone)
  };
}

function matchesCountryQuery(card, query) {
  if (!query.trim()) {
    return true;
  }
  const normalized = query.trim().toLowerCase();
  return [
    card.nameZh,
    card.nameEn,
    card.code,
    card.region,
    card.meta.capital,
    card.meta.currencyCode,
    ...(card.aliases || [])
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalized));
}

function matchesCityQuery(card, query) {
  if (!query.trim()) {
    return true;
  }
  const normalized = query.trim().toLowerCase();
  return [
    card.nameZh,
    card.nameEn,
    card.countryCode,
    card.countryNameZh,
    card.countryNameEn,
    card.industry,
    card.timezone
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalized));
}

function sortCards(a, b) {
  if (a.status.kind === "working" && b.status.kind !== "working") {
    return -1;
  }
  if (a.status.kind !== "working" && b.status.kind === "working") {
    return 1;
  }
  return a.nameEn.localeCompare(b.nameEn);
}

function sortCityCards(a, b) {
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

function toggleFavorite(code, favorites, setFavorites) {
  if (favorites.includes(code)) {
    setFavorites(favorites.filter((item) => item !== code));
    return;
  }
  setFavorites([...favorites, code]);
}

function loadFavorites() {
  try {
    const stored = JSON.parse(localStorage.getItem("trade-time-favorites") || "null");
    return Array.isArray(stored) ? stored : defaultFavorites;
  } catch {
    return defaultFavorites;
  }
}

function loadPreferences() {
  try {
    const stored = JSON.parse(localStorage.getItem("trade-time-preferences") || "null");
    return stored && typeof stored === "object" ? stored : {};
  } catch {
    return {};
  }
}

function loadClients() {
  try {
    const stored = JSON.parse(localStorage.getItem("trade-time-clients") || "null");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function getTodayTasks(clients, cards, cityCards) {
  const weights = { working: 0, upcoming: 1, break: 2, off: 3 };

  return clients
    .map((client) => {
      const card = cards.find((item) => item.code === client.countryCode);
      const city = cityCards.find((item) => item.id === client.cityId);
      if (!card) {
        return null;
      }

      return {
        id: client.id,
        name: client.name,
        countryCode: client.countryCode,
        countryName: card.nameZh,
        localTimeText: city?.localTimeText || card.localTimeText,
        statusKind: city?.status.kind || card.status.kind,
        statusLabel: city?.status.label || card.status.label,
        weight: weights[city?.status.kind || card.status.kind] ?? 9
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.weight - b.weight || a.name.localeCompare(b.name));
}

function getClientSummary(clients) {
  const groups = [
    { key: "key_account", label: "重点客户" },
    { key: "follow_up", label: "跟进中" },
    { key: "quoted", label: "已报价" },
    { key: "waiting_reply", label: "待回复" }
  ];

  return groups.map((group) => ({
    ...group,
    count: clients.filter((client) => client.status === group.key).length
  }));
}

function getClientStatusLabel(status) {
  const mapping = {
    key_account: "重点客户",
    follow_up: "跟进中",
    quoted: "已报价",
    waiting_reply: "待回复"
  };
  return mapping[status] || "未分类";
}

function joinValue(value) {
  if (Array.isArray(value)) {
    return value.length ? value.join(" / ") : "待补充";
  }
  return value || "待补充";
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
      second: "2-digit",
      hour12: false
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getSectionClass(sectionKey) {
  return `section-${String(sectionKey).toLowerCase().replace(/\s+/g, "-")}`;
}

function getRegionGradientClass(continent) {
  const mapping = {
    Asia: "region-asia",
    Europe: "region-europe",
    "North America": "region-north-america",
    "South America": "region-south-america",
    Africa: "region-africa",
    Oceania: "region-oceania"
  };
  return mapping[continent] || "region-default";
}

function getSearchGradientClass(code) {
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

  const normalized = String(code || "");
  const sum = [...normalized].reduce((total, char) => total + char.charCodeAt(0), 0);
  return palettes[sum % palettes.length];
}
