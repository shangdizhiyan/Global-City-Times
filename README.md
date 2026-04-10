# Global City Times

Global City Times 是一个面向外贸、市场开发和多时区协作场景的城市时间与市场信息工具。

项目当前包含两个独立系统：
- `Web` 端：城市查询与浏览
- `Windows Desktop` 端：桌面工作台

## 当前能力

- 按城市搜索、筛选、浏览
- 查看城市实时时间、时差、工作状态
- 北京时间联系窗口
- 城市级资料
  - 城市人口
  - 城市定位
  - 主要产业
  - 交通角色
  - 开发备注
  - 邮编
  - 社交沟通偏好
  - 主流社交平台
  - 主流广告平台
  - 主流电商平台
  - 主流搜索引擎
- 国家维度的城市目录
  - 每个国家最多保留 9 个主要城市
  - 少于 9 个则保留真实数量

## 技术栈

- `React 18`
- `Vite 5`
- `Electron`
- `electron-builder`
- `Node.js`

## 项目结构

```text
src/
  AppWeb.jsx            Web 主界面
  AppDesktop.jsx        Desktop 主界面
  data/                 国家、城市、城市详情数据
server/
  index.js              本地 API 入口
desktop/
  electron/main.js      Electron 主进程
assets/
  app-icon.*            应用图标
docs/
  使用说明和设计文档
```

## 本地开发

安装依赖：

```bash
npm install
```

启动本地 API：

```bash
npm run api
```

启动 Web 开发环境：

```bash
npm run dev:web
```

构建前端：

```bash
npm run build
```

启动桌面端：

```bash
npm run desktop
```

打包 Windows 安装包：

```bash
npm run desktop:pack
```

## 版本

当前正式版本：

- `1.0.0`

安装包命名：

- `Global-City-Times-1.0.0-Setup.exe`

## 说明

- `release/`、`dist/`、`node_modules/` 已加入 `.gitignore`
- 仓库默认只提交源码、配置和文档
- 安装包需要本地执行打包命令生成
