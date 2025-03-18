# Page Collector 页面收藏器

一个基于WXT和React开发的浏览器扩展，用于便捷地收藏网页内容并同步到飞书多维表格。

## 功能特性

- 🚀 一键收藏页面内容
- 📊 自动同步到飞书多维表格
- 🔧 简单易用的配置界面
- 🎨 美观的Material Design风格UI
- 🔒 安全的数据存储机制

## 安装

1. 克隆项目到本地：
```bash
git clone [your-repository-url]
cd collector
```

2. 安装依赖：
```bash
pnpm install
```

3. 开发模式运行：
```bash
pnpm dev
```

4. 构建生产版本：
```bash
pnpm build
```

## 使用说明

1. 首次使用时，需要配置飞书相关信息：
   - App ID和App Secret：从[飞书开放平台](https://open.feishu.cn/app)获取
   - 表格token：从飞书多维表格URL中获取
   - 表格ID：从飞书多维表格URL中获取

2. 配置完成后，在需要收藏的页面点击扩展图标，使用"收藏内容"按钮即可将页面内容同步到飞书表格。

## 技术栈

- WXT - 现代化的浏览器扩展开发框架
- React - 用户界面构建
- TailwindCSS - 样式设计
- TypeScript - 类型安全
- 飞书开放API - 数据同步

## 开发

- `pnpm dev` - 启动开发服务器
- `pnpm build` - 构建生产版本
- `pnpm dev:firefox` - Firefox浏览器开发模式
- `pnpm build:firefox` - 构建Firefox版本

## 许可证

GPL-3.0 License
