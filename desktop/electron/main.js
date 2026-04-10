import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { app, BrowserWindow, dialog } from "electron";
import { getApiServerBaseUrl, startApiServer, stopApiServer } from "../../server/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appIconPath = path.resolve(__dirname, "../../assets/app-icon.png");

let splashWindow = null;
let splashShownAt = 0;
const MIN_SPLASH_MS = 3200;

app.disableHardwareAcceleration();
app.commandLine.appendSwitch("no-sandbox");
app.commandLine.appendSwitch("disable-gpu");
app.setName("Global Trade Clockboard");

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
}

function writeDesktopLog(message, error) {
  try {
    const userData = app.getPath("userData");
    fs.mkdirSync(userData, { recursive: true });
    const logPath = path.join(userData, "desktop-error.log");
    const details = error instanceof Error ? error.stack || error.message : String(error || "");
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n${details}\n\n`, "utf8");
  } catch {
    // Best-effort logging only.
  }
}

function createSplashWindow() {
  splashShownAt = Date.now();
  splashWindow = new BrowserWindow({
    width: 620,
    height: 420,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    frame: false,
    alwaysOnTop: true,
    center: true,
    backgroundColor: "#0c242b",
    title: "Global Trade Clockboard",
    icon: fs.existsSync(appIconPath) ? appIconPath : undefined,
    webPreferences: {
      contextIsolation: true,
      sandbox: false
    }
  });

  splashWindow.on("closed", () => {
    splashWindow = null;
  });

  const iconUrl = fs.existsSync(appIconPath) ? pathToFileURL(appIconPath).toString() : "";
  const splashHtml = `<!doctype html>
  <html lang="zh-CN">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' data:" />
      <title>Global Trade Clockboard</title>
      <style>
        * { box-sizing: border-box; }
        body {
          margin: 0;
          min-height: 100vh;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at 18% 18%, rgba(116, 234, 205, 0.28), transparent 28%),
            radial-gradient(circle at 82% 22%, rgba(109, 169, 255, 0.22), transparent 30%),
            radial-gradient(circle at 50% 100%, rgba(236, 195, 120, 0.18), transparent 36%),
            linear-gradient(145deg, #091c22 0%, #0f3139 42%, #0b2329 100%);
          color: #f4f8f5;
          font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
        }
        .shell {
          position: relative;
          width: 520px;
          padding: 34px 34px 26px;
          border-radius: 30px;
          background:
            linear-gradient(160deg, rgba(255,255,255,0.16), rgba(255,255,255,0.08)),
            rgba(8, 33, 38, 0.36);
          border: 1px solid rgba(255,255,255,0.16);
          box-shadow: 0 24px 70px rgba(2, 12, 16, 0.42);
          backdrop-filter: blur(18px);
        }
        .shell::before {
          content: "";
          position: absolute;
          inset: -120px auto auto -90px;
          width: 220px;
          height: 220px;
          background: radial-gradient(circle, rgba(140, 243, 217, 0.38), transparent 70%);
          filter: blur(8px);
          pointer-events: none;
        }
        .shell::after {
          content: "";
          position: absolute;
          right: -70px;
          bottom: -100px;
          width: 240px;
          height: 240px;
          background: radial-gradient(circle, rgba(117, 178, 255, 0.22), transparent 70%);
          filter: blur(10px);
          pointer-events: none;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 18px;
        }
        .brand img {
          width: 72px;
          height: 72px;
          border-radius: 22px;
          box-shadow: 0 18px 32px rgba(0, 0, 0, 0.22);
        }
        .eyebrow {
          margin: 0 0 6px;
          color: rgba(224, 239, 235, 0.7);
          font-size: 11px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
        }
        h1 {
          margin: 0;
          font-size: 31px;
          line-height: 1.08;
          font-weight: 700;
        }
        .sub {
          margin: 18px 0 0;
          font-size: 15px;
          line-height: 1.75;
          color: rgba(241, 246, 244, 0.82);
        }
        .progress-panel {
          margin-top: 28px;
          padding: 18px 18px 16px;
          border-radius: 22px;
          background: linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
          border: 1px solid rgba(255,255,255,0.1);
        }
        .track {
          height: 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.12);
          overflow: hidden;
          position: relative;
        }
        .bar {
          position: absolute;
          inset: 0 auto 0 0;
          width: 40%;
          border-radius: inherit;
          background: linear-gradient(90deg, #9ef0da 0%, #82d5ff 52%, #f2d49a 100%);
          box-shadow: 0 0 22px rgba(130, 213, 255, 0.42);
          animation: slide 1.75s cubic-bezier(.4,0,.2,1) infinite;
        }
        .steps {
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .step {
          padding: 12px 12px 10px;
          border-radius: 16px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .step strong {
          display: block;
          margin-bottom: 6px;
          color: #f3f7f4;
          font-size: 13px;
          font-weight: 600;
        }
        .step span {
          color: rgba(232, 241, 238, 0.68);
          font-size: 12px;
          line-height: 1.45;
        }
        .footer {
          margin-top: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          color: rgba(233, 241, 239, 0.66);
          font-size: 12px;
        }
        .pulse {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #97ecd7;
          box-shadow: 0 0 16px rgba(151, 236, 215, 0.52);
          animation: pulse 1.4s ease-in-out infinite;
        }
        @keyframes slide {
          0% { transform: translateX(-110%); }
          55% { transform: translateX(170%); }
          100% { transform: translateX(170%); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(0.85); opacity: 0.72; }
          50% { transform: scale(1.15); opacity: 1; }
        }
      </style>
    </head>
    <body>
      <div class="shell">
        <div class="brand">
          <img src="${iconUrl}" alt="App icon" />
          <div>
            <p class="eyebrow">Desktop Workspace</p>
            <h1>Global Trade Clockboard</h1>
          </div>
        </div>
        <p class="sub">正在准备全球时间对照、国家资料与市场洞察工作台。桌面服务启动完成后将自动进入主界面。</p>
        <div class="progress-panel">
          <div class="track"><div class="bar"></div></div>
          <div class="steps">
            <div class="step">
              <strong>初始化服务</strong>
              <span>启动本地 API 与缓存运行环境</span>
            </div>
            <div class="step">
              <strong>载入资料</strong>
              <span>连接国家时间、市场与客户工作区</span>
            </div>
            <div class="step">
              <strong>打开主界面</strong>
              <span>主窗口就绪后自动完成切换</span>
            </div>
          </div>
        </div>
        <div class="footer">
          <span class="pulse"><i class="dot"></i>Starting desktop workspace…</span>
          <span>Built for fast foreign-trade execution</span>
        </div>
      </div>
    </body>
  </html>`;

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHtml)}`);
}

function waitForMinimumSplashTime() {
  const elapsed = Date.now() - splashShownAt;
  const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);

  if (!remaining) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    setTimeout(resolve, remaining);
  });
}

function closeSplashWindow() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
  }
  splashWindow = null;
}

async function createWindow() {
  createSplashWindow();
  await startApiServer({ port: 0 });

  const window = new BrowserWindow({
    show: false,
    width: 1500,
    height: 980,
    minWidth: 1200,
    minHeight: 760,
    backgroundColor: "#f3efe5",
    title: "Global Trade Clockboard",
    icon: fs.existsSync(appIconPath) ? appIconPath : undefined,
    webPreferences: {
      contextIsolation: true,
      sandbox: false
    }
  });

  window.once("ready-to-show", async () => {
    await waitForMinimumSplashTime();
    closeSplashWindow();
    window.show();
  });

  window.webContents.on("did-fail-load", (_event, code, description, validatedURL) => {
    writeDesktopLog(`did-fail-load ${validatedURL}`, `${code} ${description}`);
    closeSplashWindow();
    dialog.showErrorBox("页面加载失败", `${description}\n${validatedURL}`);
  });

  window.webContents.on("render-process-gone", (_event, details) => {
    writeDesktopLog("Render process gone", JSON.stringify(details));
    closeSplashWindow();
    dialog.showErrorBox("渲染进程退出", details.reason);
  });

  if (!app.isPackaged && process.env.TRADE_DESKTOP_START_URL) {
    await window.loadURL(process.env.TRADE_DESKTOP_START_URL);
    return;
  }

  const target = path.resolve(__dirname, "../../dist/desktop.html");
  const targetUrl = pathToFileURL(target);
  const apiBaseUrl = getApiServerBaseUrl();

  if (apiBaseUrl) {
    targetUrl.searchParams.set("apiBaseUrl", apiBaseUrl);
  }

  await window.loadURL(targetUrl.toString());
}

app.on("second-instance", () => {
  const existingWindow = BrowserWindow.getAllWindows()[0];
  if (!existingWindow) {
    return;
  }

  if (existingWindow.isMinimized()) {
    existingWindow.restore();
  }
  existingWindow.focus();
});

app.whenReady()
  .then(async () => {
    await createWindow();
  })
  .catch((error) => {
    writeDesktopLog("Desktop bootstrap failed", error);
    closeSplashWindow();
    dialog.showErrorBox("桌面版启动失败", error instanceof Error ? error.message : String(error));
    app.quit();
  });

app.on("window-all-closed", async () => {
  try {
    await stopApiServer();
  } catch (error) {
    writeDesktopLog("API shutdown failed", error);
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    try {
      await createWindow();
    } catch (error) {
      writeDesktopLog("Window recreation failed", error);
      closeSplashWindow();
      dialog.showErrorBox("窗口创建失败", error instanceof Error ? error.message : String(error));
    }
  }
});

process.on("uncaughtException", (error) => {
  writeDesktopLog("Uncaught exception", error);
});

process.on("unhandledRejection", (error) => {
  writeDesktopLog("Unhandled rejection", error);
});
