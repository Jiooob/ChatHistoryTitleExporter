# 适配 Gemini 历史记录导出工具 (Gemini History Exporter)

![Version](https://img.shields.io/badge/version-9.5-blue) ![License](https://img.shields.io/badge/license-MIT-green)

一个用于 Google Gemini 网页版的 Tampermonkey 脚本。在同时打开搜索界面和侧边栏时，可以抓取历史记录标题并按日期分组导出为 Markdown 文件

此脚本旨在为那些每天有事没事就找gemini聊几句或者聊一些话题的用户和此脚本作者，帮助他们回顾自己聊了什么做了什么聊了什么奇妙的话题

## 功能特点

- **双容器架构**：自动检测并同步侧边栏与搜索界面的数据。
- **智能滚动**：自动滚动加载历史记录，直至达到指定日期范围。
- **格式化导出**：生成清晰的 Markdown 文档，支持按日期分组。
- **隐私安全**：所有数据处理均在**本地浏览器**完成，不经过任何第三方服务器。
- **UI 交互**：提供可拖拽的控制面板/悬浮球，支持自定义日期范围和导出数量限制。

## 安装

[👉 点击此处直接安装脚本 (v9.5)](https://github.com/Jiooob/ChatHistoryTitleExporter/raw/refs/heads/main/HistoryTitleExporter.user.js)

*如果点击无反应，请确保已安装 Tampermonkey 扩展。*

## 使用指南

1. 打开 [Google Gemini](https://gemini.google.com/)。
2. 确保**侧边栏**已展开。
3. 点击顶部的**搜索图标**（放大镜），打开搜索历史界面。
4. 脚本会自动检测容器，并在页面左下角显示控制面板。
5. 选择起始日期、结束日期，点击 **"开始滚动并导出"**。

## 免责声明

- 本脚本与 Google 公司无关。
- 脚本依赖 Gemini 网页版当前的 DOM 结构。如果 Google 更新了网页代码，脚本可能会失效。欢迎提交 Issue 或 PR 进行修复。

## License

MIT License
