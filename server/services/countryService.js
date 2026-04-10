import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { countries as baseCountries, continents } from "../../src/data/countries.js";
import { countryMeta as localMeta } from "../../src/data/countryMeta.js";
import { getCitiesByCountry } from "../../src/data/cities.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const runtimeDir = process.env.TRADE_RUNTIME_DIR || path.resolve(process.cwd(), ".trade-runtime");
const cacheDir = path.join(runtimeDir, "cache");
const cacheFile = path.join(cacheDir, "country-directory.json");
const refreshIntervalMs = 24 * 60 * 60 * 1000;

const state = {
  directory: null,
  refreshPromise: null
};

export async function getCountryDirectory({ refresh = false } = {}) {
  await ensureDirectory();

  if (refresh) {
    await refreshDirectory({ reason: "manual" });
  } else if (shouldRefresh(state.directory?.sync)) {
    void refreshDirectory({ reason: "scheduled" });
  }

  return state.directory;
}

export async function refreshDirectory({ reason = "manual" } = {}) {
  if (state.refreshPromise) {
    return state.refreshPromise;
  }

  state.refreshPromise = (async () => {
    const startedAt = new Date().toISOString();
    const fallbackDirectory = state.directory || buildFallbackDirectory();

    try {
      const liveCountries = await fetchRestCountries();
      const countries = baseCountries.map((country) => mergeCountry(country, liveCountries.get(country.code)));
      const directory = {
        continents,
        countries,
        sync: {
          status: "live",
          reason,
          sourceLabel: "REST Countries + local trade defaults",
          lastUpdatedAt: new Date().toISOString(),
          lastAttemptAt: startedAt,
          lastError: null,
          policy: {
            realtime: ["时间", "时差", "工作状态", "北京时间联系窗口"],
            autoRefresh: ["国旗", "首都", "人口", "面积", "语言", "货币", "区号", "域名后缀"],
            reference: ["市场洞察", "成交风格", "价格敏感度", "品牌敏感度", "产业判断"]
          }
        }
      };

      state.directory = directory;
      await persistDirectory(directory);
      return directory;
    } catch (error) {
      const directory = {
        ...fallbackDirectory,
        sync: {
          ...(fallbackDirectory.sync || {}),
          status: fallbackDirectory.sync?.lastUpdatedAt ? "stale-fallback" : "fallback",
          reason,
          sourceLabel: "Local trade defaults",
          lastAttemptAt: startedAt,
          lastError: error instanceof Error ? error.message : String(error),
          policy: fallbackDirectory.sync?.policy || {
            realtime: ["时间", "时差", "工作状态", "北京时间联系窗口"],
            autoRefresh: ["国旗", "首都", "人口", "面积", "语言", "货币", "区号", "域名后缀"],
            reference: ["市场洞察", "成交风格", "价格敏感度", "品牌敏感度", "产业判断"]
          }
        }
      };

      state.directory = directory;
      await persistDirectory(directory);
      return directory;
    } finally {
      state.refreshPromise = null;
    }
  })();

  return state.refreshPromise;
}

async function ensureDirectory() {
  if (state.directory) {
    return;
  }

  state.directory = await readCachedDirectory();

  if (!state.directory) {
    state.directory = buildFallbackDirectory();
    await persistDirectory(state.directory);
  }
}

async function readCachedDirectory() {
  try {
    const raw = await readFile(cacheFile, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function persistDirectory(directory) {
  await mkdir(cacheDir, { recursive: true });
  await writeFile(cacheFile, JSON.stringify(directory, null, 2), "utf8");
}

function buildFallbackDirectory() {
  return {
    continents,
    countries: baseCountries.map((country) => mergeCountry(country, null)),
    sync: {
      status: "fallback",
      reason: "bootstrap",
      sourceLabel: "Local trade defaults",
      lastUpdatedAt: new Date().toISOString(),
      lastAttemptAt: null,
      lastError: null,
      policy: {
        realtime: ["时间", "时差", "工作状态", "北京时间联系窗口"],
        autoRefresh: ["国旗", "首都", "人口", "面积", "语言", "货币", "区号", "域名后缀"],
        reference: ["市场洞察", "成交风格", "价格敏感度", "品牌敏感度", "产业判断"]
      }
    }
  };
}

function shouldRefresh(sync) {
  if (!sync?.lastUpdatedAt) {
    return true;
  }

  const age = Date.now() - new Date(sync.lastUpdatedAt).getTime();
  return age > refreshIntervalMs;
}

async function fetchRestCountries() {
  const codes = baseCountries.map((country) => country.code.toLowerCase()).join(",");
  const url = `https://restcountries.com/v3.1/alpha?codes=${codes}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "global-trade-clockboard/0.2"
    }
  });

  if (!response.ok) {
    throw new Error(`REST Countries request failed: ${response.status}`);
  }

  const payload = await response.json();
  return new Map(
    payload
      .filter((item) => item?.cca2)
      .map((item) => [String(item.cca2).toUpperCase(), item])
  );
}

function mergeCountry(baseCountry, liveCountry) {
  const local = localMeta[baseCountry.code] || {};
  const meta = {
    flag: liveCountry?.flag || local.flag || getFlagEmoji(baseCountry.code),
    flagEmoji: liveCountry?.flag || local.flag || getFlagEmoji(baseCountry.code),
    flagSvg: liveCountry?.flags?.svg || `https://flagcdn.com/${String(baseCountry.code || "").toLowerCase()}.svg`,
    flagPng: liveCountry?.flags?.png || `https://flagcdn.com/w80/${String(baseCountry.code || "").toLowerCase()}.png`,
    capital: arrayToText(liveCountry?.capital) || local.capital || "待补充",
    continent: baseCountry.continent,
    population: formatPopulation(liveCountry?.population) || local.population || "待补充",
    area: formatArea(liveCountry?.area) || local.area || "待补充",
    majorCities: local.majorCities || [],
    languages: objectValues(liveCountry?.languages) || local.languages || [],
    currencyName: getCurrencyName(liveCountry) || local.currencyName || "待补充",
    currencyCode: getCurrencyCode(liveCountry) || local.currencyCode || "待补充",
    dialingCode: formatDialingCode(liveCountry?.idd) || local.dialingCode || "待补充",
    drivingSide: mapDrivingSide(liveCountry?.car?.side) || local.drivingSide || "待补充",
    dateFormat: local.dateFormat || "待补充",
    measurementStyle: local.measurementStyle || "待补充",
    powerStandard: local.powerStandard || "待补充",
    domainSuffix: arrayToText(liveCountry?.tld) || local.domainSuffix || "待补充",
    religion: local.religion || "待补充",
    isoCode: liveCountry?.cca2 || local.isoCode || baseCountry.code,
    gdp: local.gdp || "待同步",
    gdpPerCapita: local.gdpPerCapita || "待同步",
    economicType: local.economicType || "待同步",
    mainIndustries: local.mainIndustries || [],
    importDependency: local.importDependency || "待同步",
    exportAdvantage: local.exportAdvantage || [],
    middleClassScale: local.middleClassScale || "待同步",
    consumptionLevel: local.consumptionLevel || "待同步",
    urbanizationRate: local.urbanizationRate || "待同步",
    youthPopulationShare: local.youthPopulationShare || "待同步",
    priceSensitivity: local.priceSensitivity || "待同步",
    brandSensitivity: local.brandSensitivity || "待同步",
    relationshipDriven: local.relationshipDriven || "待同步",
    ecommercePenetration: local.ecommercePenetration || "待同步",
    mobileInternetPenetration: local.mobileInternetPenetration || "待同步",
    cities: getCitiesByCountry(baseCountry.code)
  };

  return {
    ...baseCountry,
    nameEn: liveCountry?.name?.common || baseCountry.nameEn,
    timezones: liveCountry?.timezones?.length ? liveCountry.timezones : baseCountry.timezones,
    meta,
    sources: {
      foundation: liveCountry ? "REST Countries" : "Local fallback",
      tradeProfile: "Local trade defaults"
    }
  };
}

function objectValues(value) {
  if (!value || typeof value !== "object") {
    return null;
  }
  return Object.values(value);
}

function arrayToText(value) {
  if (!Array.isArray(value) || !value.length) {
    return "";
  }
  return value.join(" / ");
}

function getCurrencyName(country) {
  const first = getFirstCurrency(country);
  return first?.name || "";
}

function getCurrencyCode(country) {
  const entries = Object.entries(country?.currencies || {});
  return entries[0]?.[0] || "";
}

function getFirstCurrency(country) {
  const entries = Object.values(country?.currencies || {});
  return entries[0] || null;
}

function formatDialingCode(idd) {
  if (!idd?.root) {
    return "";
  }

  const suffixes = Array.isArray(idd.suffixes) && idd.suffixes.length ? idd.suffixes : [""];
  return suffixes.slice(0, 3).map((suffix) => `${idd.root}${suffix}`).join(" / ");
}

function mapDrivingSide(side) {
  if (side === "left") {
    return "左侧通行";
  }
  if (side === "right") {
    return "右侧通行";
  }
  return "";
}

function formatPopulation(value) {
  if (!Number.isFinite(value)) {
    return "";
  }
  return `${new Intl.NumberFormat("zh-CN").format(value)} 人`;
}

function formatArea(value) {
  if (!Number.isFinite(value)) {
    return "";
  }
  return `${new Intl.NumberFormat("zh-CN").format(Math.round(value))} km²`;
}

function getFlagEmoji(code) {
  const normalized = String(code || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) {
    return "🌍";
  }

  return [...normalized]
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}
