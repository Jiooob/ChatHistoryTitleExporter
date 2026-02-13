// ==UserScript==
// @name         适配Gemini 历史记录标题 日期分组 可选带url 导出 (双容器架构 v9.5)
// @namespace    http://tampermonkey.net/
// @version      9.5
// @description  在同时打开搜索界面和侧边栏的时候，导出按日期分组的历史记录标题，便于个人管理或回顾自己聊了些干了些什么
// @author       Jiooob
// @match        https://gemini.google.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 样式定义
    const STYLES = `
        #gemini-ui-container {
            position: fixed; z-index: 99999;
            font-family: 'Google Sans', Roboto, system-ui, -apple-system, sans-serif;
            font-size: 13px; color: #1f2937;
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.18);
            backdrop-filter: blur(8px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden; user-select: none;
        }

        /* 面板模式 */
        .mode-panel {
            width: 280px;
            border-radius: 16px;
            display: flex;
            flex-direction: column;
        }

        /* 圆形按钮模式 */
        .mode-ball {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
            color: white;
            box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4), 0 4px 12px rgba(139, 92, 246, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.2);
        }
        .mode-ball:hover {
            transform: scale(1.1) translateY(-2px);
            box-shadow: 0 12px 32px rgba(139, 92, 246, 0.5), 0 6px 16px rgba(139, 92, 246, 0.3);
        }

        /* 左侧停靠样式 */
        .docked-left {
            left: -20px !important;
            top: 50% !important;
            transform: translateY(-50%);
            width: 48px !important;
            height: 80px !important;
            border-radius: 0 12px 12px 0 !important;
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
            box-shadow: 2px 0 16px rgba(139, 92, 246, 0.3);
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            cursor: pointer !important;
            border: none !important;
            animation: slideInLeft 0.3s ease-out;
        }

        /* 右侧停靠书签样式 */
        .docked-right {
            right: -20px !important;
            top: 50% !important;
            transform: translateY(-50%);
            width: 48px !important;
            height: 80px !important;
            border-radius: 12px 0 0 12px !important;
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
            box-shadow: -2px 0 16px rgba(139, 92, 246, 0.3);
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            cursor: pointer !important;
            border: none !important;
            animation: slideInRight 0.3s ease-out;
        }

        @keyframes slideInLeft {
            from { left: -60px; opacity: 0; }
            to { left: -20px; opacity: 1; }
        }

        @keyframes slideInRight {
            from { right: -60px; opacity: 0; }
            to { right: -20px; opacity: 1; }
        }

        /* 标题栏 */
        .ui-header {
            padding: 16px 20px;
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            border-bottom: 1px solid rgba(148, 163, 184, 0.2);
            cursor: move;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 16px 16px 0 0;
        }
        .ui-header span:first-child {
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 600;
            font-size: 14px;
        }

        /* 内容区域 */
        .ui-content {
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border-radius: 0 0 16px 16px;
        }

        /* 最小化按钮 */
        .ui-btn-min {
            cursor: pointer;
            font-weight: 600;
            color: #64748b;
            padding: 6px 10px;
            border-radius: 8px;
            transition: all 0.2s ease;
            background: rgba(148, 163, 184, 0.1);
        }
        .ui-btn-min:hover {
            background: rgba(139, 92, 246, 0.1);
            color: #8b5cf6;
            transform: scale(1.05);
        }

        /* 工具类 */
        .hidden { display: none !important; }
        .is-dragging { transition: none !important; cursor: grabbing !important; }

        /* 表单元素 */
        .date-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 8px 0;
        }
        .date-row label {
            font-weight: 500;
            color: #374151;
            min-width: 24px;
        }
        .date-input {
            flex: 1;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 12px;
            transition: all 0.2s ease;
            background: #ffffff;
            color: #1f2937 !important;
        }
        .date-input:focus {
            outline: none;
            border-color: #8b5cf6;
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }
        .date-input::-webkit-calendar-picker-indicator {
            background-color: #8b5cf6;
            border-radius: 3px;
            cursor: pointer;
            padding: 2px;
            filter: invert(0);
        }
        .date-input::-webkit-calendar-picker-indicator:hover {
            background-color: #7c3aed;
        }

        .checkbox-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 8px;
            flex-wrap: wrap;
        }
        .checkbox-row input[type="checkbox"] {
            width: 16px;
            height: 16px;
            accent-color: #8b5cf6;
        }
        .checkbox-row label {
            cursor: pointer;
            font-size: 12px;
            color: #374151;
            font-weight: 500;
        }

        /* 限制输入框 */
        input[type="number"] {
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 6px 8px;
            text-align: center;
            width: 60px;
            background: #ffffff;
            transition: all 0.2s ease;
            color: #1f2937 !important;
            font-weight: 500;
        }
        input[type="number"]:focus {
            outline: none;
            border-color: #8b5cf6;
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            width: 16px;
            height: 16px;
            border-radius: 2px;
            cursor: pointer;
            position: relative;
        }
        input[type="number"] {
            -moz-appearance: textfield;
        }
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
            opacity: 1;
            height: 20px;
            background: #8b5cf6;
            border-radius: 3px;
            cursor: pointer;
        }
        input[type="number"]::-webkit-outer-spin-button:hover,
        input[type="number"]::-webkit-inner-spin-button:hover {
            background: #7c3aed;
        }

        /* 状态显示 */
        #g-status {
            font-size: 12px;
            color: #6b7280;
            min-height: 20px;
            padding: 8px 12px;
            background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            border-radius: 8px;
            border-left: 3px solid #8b5cf6;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        /* 主按钮 */
        #g-btn {
            padding: 12px 20px;
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: white;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            font-weight: 600;
            font-size: 13px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }
        #g-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        }
        #g-btn:active {
            transform: translateY(0);
        }
        #g-btn:disabled {
            background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        /* 警告提示 */
        .warning-text {
            font-size: 11px;
            color: #dc2626;
            margin-bottom: 12px;
            padding: 8px 12px;
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            border-radius: 8px;
            border-left: 3px solid #dc2626;
        }

        /* 限制数输入区 */
        .limit-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 8px;
            padding: 8px 0;
        }
        .limit-row label {
            font-weight: 500;
            color: #374151;
        }
    `;

    // 状态管理
    const state = { isPanel: true, isDocked: false, x: 20, y: window.innerHeight - 500 };

    // 日期解析函数
    function parseGeminiDate(dateStr) {
        if (!dateStr) return null;

        try {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const cleanStr = dateStr.trim();

            // 处理相对日期
            if (cleanStr.match(/today|今天/i)) return today;
            if (cleanStr.match(/yesterday|昨天/i)) {
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);
                return yesterday;
            }

            // 处理 "Jan 1", "Feb 15" 等格式
            const monthDayMatch = cleanStr.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})$/i);
            if (monthDayMatch) {
                const monthNames = {
                    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
                };
                const month = monthNames[monthDayMatch[1]];
                const day = parseInt(monthDayMatch[2]);

                // 年份计算
                let year = now.getFullYear();
                const date = new Date(year, month, day);
                if (date > now) {
                    year--;
                    return new Date(year, month, day);
                }
                return date;
            }

            // 处理完整日期格式
            const fullDate = new Date(cleanStr);
            if (!isNaN(fullDate.getTime())) {
                return fullDate;
            }

            return null;
        } catch (error) {
            console.warn("[Gemini Exporter] 日期解析出错:", dateStr, error);
            return null;
        }
    }

    // 双容器检测
    function findContainers() {
        try {
            const sidebarContainer = document.querySelector('infinite-scroller');
            const searchContainer = document.querySelector('.recent-conversations-container');

            if (!sidebarContainer) {
                throw new Error("未找到侧边栏容器 infinite-scroller");
            }
            if (!searchContainer) {
                throw new Error("未找到搜索界面容器 .recent-conversations-container");
            }

            console.log("[Gemini Exporter] 成功检测到双容器系统");
            console.log("[Gemini Exporter] 侧边栏容器:", sidebarContainer);
            console.log("[Gemini Exporter] 搜索容器:", searchContainer);
            return { sidebarContainer, searchContainer };
        } catch (error) {
            console.error("[Gemini Exporter] 容器检测失败:", error);
            throw error;
        }
    }

    // 等待侧边栏加载
    async function waitForSidebarLoad(sidebarContainer) {
        try {
            let spinner = sidebarContainer.querySelector('mat-progress-spinner');
            let waitTime = 0;
            const maxWait = 5000;

            while (spinner && waitTime < maxWait) {
                await new Promise(r => setTimeout(r, 200));
                waitTime += 200;
                spinner = sidebarContainer.querySelector('mat-progress-spinner');
            }

            // 短暂等待确保DOM更新
            await new Promise(r => setTimeout(r, 300));
        } catch (error) {
            console.warn("[Gemini Exporter] 等待加载时出错:", error);
        }
    }

    // 从搜索容器获取最早日期
    function getEarliestDateFromSearch(searchContainer) {
        try {
            const dateElements = searchContainer.querySelectorAll('.right-content-container.gds-body-m.date');
            if (dateElements.length === 0) return null;

            let earliestDate = null;
            let earliestParsed = null;

            dateElements.forEach(el => {
                const dateText = el.innerText.trim();
                const parsed = parseGeminiDate(dateText);
                if (parsed && (!earliestParsed || parsed < earliestParsed)) {
                    earliestDate = dateText;
                    earliestParsed = parsed;
                }
            });

            return earliestDate;
        } catch (error) {
            console.warn("[Gemini Exporter] 获取最早日期时出错:", error);
            return null;
        }
    }

    // 智能滚动到目标日期
    async function smartScrollToDate(containers, targetStartDate, statusDiv) {
        try {
            const { sidebarContainer, searchContainer } = containers;
            const targetDate = new Date(targetStartDate);
            const dayBefore = new Date(targetDate.getTime() - 24 * 60 * 60 * 1000);

            let iterations = 0;
            let foundTargetDate = false;

            while (!foundTargetDate && iterations < 100) {
                iterations++;

                // 滚动侧边栏加载更多历史记录
                sidebarContainer.scrollTop = sidebarContainer.scrollHeight;

                // 等待加载完成
                await waitForSidebarLoad(sidebarContainer);

                // 检查搜索容器中的最早日期
                const earliestDate = getEarliestDateFromSearch(searchContainer);

                statusDiv.innerText = `正在加载历史记录... 当前最早: ${earliestDate || '加载中'} 目标: 确保${targetDate.toLocaleDateString()}完整 (第${iterations}次)`;

                // 判断是否已加载到目标日期的前一天或更早
                if (earliestDate && parseGeminiDate(earliestDate) <= dayBefore) {
                    foundTargetDate = true;
                    statusDiv.innerText = `✅ 已确保目标日期记录完整，开始提取数据...`;
                    break;
                }

                // 防止无限循环的保护措施
                if (iterations > 50) {
                    const currentEarliest = parseGeminiDate(earliestDate);
                    const isCloseEnough = currentEarliest && Math.abs(currentEarliest - dayBefore) < 7 * 24 * 60 * 60 * 1000;
                    if (isCloseEnough) {
                        console.warn("[Gemini Exporter] 已接近目标日期，提前结束滚动");
                        foundTargetDate = true;
                        break;
                    }
                }

                await new Promise(r => setTimeout(r, 1200));
            }

            if (!foundTargetDate) {
                console.warn('[Gemini Exporter] 未能加载到目标日期前一天，使用当前已加载的记录');
                statusDiv.innerText = '⚠️ 未完全确保目标日期完整，使用当前数据...';
            }

            return foundTargetDate;
        } catch (error) {
            console.error("[Gemini Exporter] 智能滚动时出错:", error);
            statusDiv.innerText = `❌ 滚动出错: ${error.message}`;
            return false;
        }
    }

    // 从搜索容器提取数据
    function extractDataFromSearchContainer(searchContainer, startDate, endDate) {
        try {
            // 处理日期边界
            const startTime = new Date(startDate + 'T00:00:00');
            const endTime = new Date(endDate + 'T23:59:59');
            const validData = [];

            console.log(`[Gemini Exporter] 日期筛选范围: ${startTime.toLocaleDateString()} 到 ${endTime.toLocaleDateString()}`);

            // 提取所有对话项
            const conversationElements = searchContainer.querySelectorAll('.conversation-container');
            console.log(`[Gemini Exporter] 在搜索容器中找到 ${conversationElements.length} 个对话`);

            conversationElements.forEach((conv, index) => {
                try {
                    const titleElement = conv.querySelector('.title');
                    const dateElement = conv.querySelector('.right-content-container.gds-body-m.date');

                    if (!titleElement || !dateElement) {
                        console.warn(`[Gemini Exporter] 对话 ${index} 缺少标题或日期元素`);
                        return;
                    }

                    const title = titleElement.innerText.trim();
                    const dateText = dateElement.innerText.trim();
                    const convDate = parseGeminiDate(dateText);

                    if (convDate) {
                        // 日期比较
                        const convDateStart = new Date(convDate.getFullYear(), convDate.getMonth(), convDate.getDate());
                        const startDateOnly = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate());
                        const endDateOnly = new Date(endTime.getFullYear(), endTime.getMonth(), endTime.getDate());

                        if (convDateStart >= startDateOnly && convDateStart <= endDateOnly) {
                            console.log(`[Gemini Exporter] 包含对话: ${title} (${dateText})`);

                            // 找到对应的链接
                            const matchingLink = findMatchingLinkInSidebar(title);

                            validData.push({
                                title: title,
                                url: matchingLink || '#',
                                dateKey: dateText,
                                rawDate: convDate,
                                index: index
                            });
                        } else {
                            console.log(`[Gemini Exporter] 跳过对话: ${title} (${dateText}) - 不在日期范围内`);
                        }
                    }
                } catch (error) {
                    console.warn(`[Gemini Exporter] 处理对话 ${index} 时出错:`, error);
                }
            });

            console.log(`[Gemini Exporter] 成功提取 ${validData.length} 条有效数据`);
            return groupByDate(validData);
        } catch (error) {
            console.error("[Gemini Exporter] 数据提取失败:", error);
            return {};
        }
    }

    // 在侧边栏中寻找匹配的链接
    function findMatchingLinkInSidebar(title) {
        try {
            const sidebarLinks = document.querySelectorAll('infinite-scroller a[href*="/app/"]');

            for (let link of sidebarLinks) {
                // 多种方式获取链接标题
                let linkTitle = '';

                const titleEl = link.querySelector('.conversation-title');
                if (titleEl) {
                    linkTitle = titleEl.innerText?.trim();
                } else {
                    // 获取第一行文本
                    linkTitle = link.innerText.split('\n')[0].trim();
                }

                if (linkTitle === title) {
                    return link.href;
                }
            }
            return null;
        } catch (error) {
            console.warn("[Gemini Exporter] 查找匹配链接时出错:", error);
            return null;
        }
    }

    // 按日期分组
    function groupByDate(validData) {
        try {
            const grouped = {};

            validData.forEach(item => {
                const key = item.dateKey || '未分类';
                if (!grouped[key]) {
                    grouped[key] = [];
                }
                grouped[key].push(item);
            });

            // 按日期排序分组
            const sortedGroups = {};
            const sortedKeys = Object.keys(grouped).sort((a, b) => {
                const dateA = parseGeminiDate(a);
                const dateB = parseGeminiDate(b);

                if (!dateA && !dateB) return a.localeCompare(b);
                if (!dateA) return 1;
                if (!dateB) return -1;

                return dateB - dateA;
            });

            sortedKeys.forEach(key => {
                sortedGroups[key] = grouped[key];
            });

            return sortedGroups;
        } catch (error) {
            console.error("[Gemini Exporter] 分组时出错:", error);
            return { '未分类': validData || [] };
        }
    }

    // 初始化界面
    function init() {
        try {
            if (document.getElementById('gemini-ui-container')) return;

            const styleEl = document.createElement('style');
            styleEl.innerHTML = STYLES;
            document.head.appendChild(styleEl);

            const container = document.createElement('div');
            container.id = 'gemini-ui-container';
            container.className = 'mode-panel';
            container.style.left = state.x + 'px';
            container.style.top = state.y + 'px';

            const header = document.createElement('div');
            header.className = 'ui-header';
            header.innerHTML = `<span>📅 Gemini 历史导出 (v9.5)</span><span class="ui-btn-min">×</span>`;
            header.querySelector('.ui-btn-min').addEventListener('click', (e) => {
                e.stopPropagation();
                toggleMode(container, false);
            });

            const content = document.createElement('div');
            content.className = 'ui-content';
            const todayStr = new Date().toISOString().split('T')[0];
            const firstDayStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

            content.innerHTML = `
                <div class="warning-text">⚠️ 必须打开左侧侧边栏和搜索界面才能正常工作</div>
                <div class="date-row">
                    <label>从:</label>
                    <input type="date" id="g-date-start" class="date-input" value="${firstDayStr}">
                </div>
                <div class="date-row">
                    <label>到:</label>
                    <input type="date" id="g-date-end" class="date-input" value="${todayStr}">
                </div>
                <div class="limit-row">
                    <label>最大扫描数:</label>
                    <input type="number" id="g-limit" value="300" min="50" max="1000">
                </div>
                <div class="checkbox-row">
                    <input type="checkbox" id="g-url" checked>
                    <label for="g-url">包含链接</label>
                    <input type="checkbox" id="g-group" checked>
                    <label for="g-group">按日期分组</label>
                </div>
                <div id="g-status">🚀 准备就绪，可以开始导出</div>
                <button id="g-btn">开始滚动并导出</button>
            `;

            const ballIcon = document.createElement('div');
            ballIcon.className = 'ball-content hidden';
            ballIcon.innerHTML = `<span style="font-size:24px; transform: rotate(10deg); display: block;">📅</span>`;

            container.appendChild(header);
            container.appendChild(content);
            container.appendChild(ballIcon);
            document.body.appendChild(container);

            content.querySelector('#g-btn').onclick = () => {
                const startDate = document.getElementById('g-date-start').value;
                const endDate = document.getElementById('g-date-end').value;
                const limit = document.getElementById('g-limit').value;
                const includeUrl = document.getElementById('g-url').checked;
                const groupDate = document.getElementById('g-group').checked;
                runExport(startDate, endDate, limit, includeUrl, groupDate, document.getElementById('g-status'), document.getElementById('g-btn'));
            };

            makeDraggable(container, header);
        } catch (error) {
            console.error("[Gemini Exporter] 初始化失败:", error);
        }
    }

    // 核心导出逻辑
    async function runExport(startStr, endStr, limitStr, includeUrl, groupDate, statusDiv, btnElement) {
        try {
            // 检测双容器系统
            const containers = findContainers();

            const limit = parseInt(limitStr) || 300;
            const originalBtnText = btnElement.innerText;
            btnElement.disabled = true;
            btnElement.innerText = "⏳ 检测容器中...";

            // 智能滚动到目标日期
            await smartScrollToDate(containers, startStr, statusDiv);

            // 提取数据
            btnElement.innerText = "📊 提取数据中...";
            const groupedData = extractDataFromSearchContainer(containers.searchContainer, startStr, endStr);

            // 生成 Markdown
            btnElement.innerText = "📝 生成文件中...";
            const totalCount = Object.values(groupedData).reduce((sum, items) => sum + items.length, 0);
            downloadMarkdown(groupedData, groupDate, totalCount, startStr, endStr, includeUrl);

            statusDiv.innerText = `✅ 完成: ${totalCount} 条记录已导出`;
            btnElement.disabled = false;
            btnElement.innerText = originalBtnText;

        } catch (error) {
            console.error("[Gemini Exporter] 导出失败:", error);
            statusDiv.innerText = `❌ 导出失败: ${error.message}`;
            btnElement.disabled = false;
            btnElement.innerText = btnElement.innerText.includes("滚动并导出") ? "重新导出" : "开始滚动并导出";
        }
    }

    // Markdown 生成
    function downloadMarkdown(groupedData, useGrouping, totalCount, startStr, endStr, includeUrl) {
        try {
            const now = new Date();
            let content = `# Gemini 历史记录导出\n`;
            content += `> 导出时间: ${now.toLocaleString()}\n`;
            content += `> 日期范围: ${startStr} 至 ${endStr}\n`;
            content += `> 总条数: ${totalCount}\n\n`;
            content += `---\n\n`;

            if (useGrouping && Object.keys(groupedData).length > 1) {
                // 按日期分组显示
                Object.keys(groupedData).forEach(dateKey => {
                    const items = groupedData[dateKey];
                    content += `## ${dateKey} (${items.length} 条)\n\n`;

                    items.forEach((item, index) => {
                        const linkFormat = (includeUrl && item.url && item.url !== '#')
                            ? `[${item.title}](${item.url})`
                            : item.title;
                        content += `${index + 1}. ${linkFormat}\n`;
                    });
                    content += `\n`;
                });
            } else {
                // 简单列表显示
                content += `## 对话列表\n\n`;
                let itemIndex = 1;
                Object.values(groupedData).forEach(items => {
                    items.forEach(item => {
                        const linkFormat = (includeUrl && item.url && item.url !== '#')
                            ? `[${item.title}](${item.url})`
                            : item.title;
                        content += `${itemIndex}. ${linkFormat}\n`;
                        itemIndex++;
                    });
                });
            }

            // 创建并下载文件
            const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Gemini_History_${startStr}_to_${endStr}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("[Gemini Exporter] Markdown 生成失败:", error);
        }
    }

    // UI 拖拽逻辑
    function toggleMode(container, toPanel) {
        try {
            state.isPanel = toPanel;
            const header = container.querySelector('.ui-header');
            const content = container.querySelector('.ui-content');
            const ball = container.querySelector('.ball-content');

            if (toPanel) {
                // 切换到面板模式
                state.isDocked = false;
                container.className = 'mode-panel';
                header.classList.remove('hidden');
                content.classList.remove('hidden');
                ball.classList.add('hidden');

                // 清除样式
                container.style.left = state.x + 'px';
                container.style.top = state.y + 'px';
                container.style.right = '';
                container.style.transform = '';
                container.style.width = '';
                container.style.height = '';

            } else {
                // 切换到球形模式
                container.className = 'mode-ball';
                header.classList.add('hidden');
                content.classList.add('hidden');
                ball.classList.remove('hidden');

                // 设置位置
                container.style.left = state.x + 'px';
                container.style.top = state.y + 'px';
                container.style.right = '';
                container.style.transform = '';
                container.style.width = '';
                container.style.height = '';
            }
        } catch (error) {
            console.error("[Gemini Exporter] 模式切换失败:", error);
        }
    }

    function makeDraggable(el, handle) {
        let isDragging = false, startX, startY, iLeft, iTop, hasMoved = false;

        const down = (e) => {
            try {
                if (state.isPanel && !state.isDocked && e.target !== handle && !handle.contains(e.target)) return;

                isDragging = true;
                hasMoved = false;
                el.classList.add('is-dragging');

                if (state.isDocked) {
                    const r = el.getBoundingClientRect();
                    state.x = r.left;
                    state.y = r.top;
                    el.className = state.isPanel ? 'mode-panel' : 'mode-ball';
                    el.style.left = state.x + 'px';
                    el.style.top = state.y + 'px';
                    el.style.right = '';

                    if (state.isPanel) {
                        el.querySelector('.ui-header').classList.remove('hidden');
                        el.querySelector('.ui-content').classList.remove('hidden');
                        el.querySelector('.ball-content').classList.add('hidden');
                    }
                    state.isDocked = false;
                }

                startX = e.clientX;
                startY = e.clientY;
                const rect = el.getBoundingClientRect();
                iLeft = rect.left;
                iTop = rect.top;

                document.addEventListener('mousemove', move);
                document.addEventListener('mouseup', up);
                e.preventDefault();
            } catch (error) {
                console.error("[Gemini Exporter] 拖拽开始失败:", error);
            }
        };

        const move = (e) => {
            if (!isDragging) return;

            try {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;

                if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved = true;

                let nl = Math.max(0, Math.min(iLeft + dx, window.innerWidth - el.offsetWidth));
                let nt = Math.max(0, Math.min(iTop + dy, window.innerHeight - el.offsetHeight));

                el.style.left = nl + 'px';
                el.style.top = nt + 'px';
                state.x = nl;
                state.y = nt;
            } catch (error) {
                console.error("[Gemini Exporter] 拖拽移动失败:", error);
            }
        };

        const up = (e) => {
            try {
                if (!isDragging) return;

                isDragging = false;
                el.classList.remove('is-dragging');
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', up);

                if (!hasMoved) {
                    if (!state.isPanel || state.isDocked) toggleMode(el, true);
                    return;
                }

                const r = el.getBoundingClientRect();

                // 检查是否要停靠到左侧
                if (r.left < 50) {
                    state.isDocked = true;
                    state.isPanel = false;

                    // 清除定位样式
                    el.style.left = '';
                    el.style.top = '';
                    el.style.right = '';
                    el.style.transform = '';
                    el.style.width = '';
                    el.style.height = '';

                    el.className = 'docked-left';
                    el.querySelector('.ui-header').classList.add('hidden');
                    el.querySelector('.ui-content').classList.add('hidden');
                    el.querySelector('.ball-content').classList.remove('hidden');

                } else if (r.right > window.innerWidth - 50) {
                    // 检查右侧停靠
                    state.isDocked = true;
                    state.isPanel = false;

                    // 清除定位样式
                    el.style.left = '';
                    el.style.top = '';
                    el.style.right = '';
                    el.style.transform = '';
                    el.style.width = '';
                    el.style.height = '';

                    el.className = 'docked-right';
                    el.querySelector('.ui-header').classList.add('hidden');
                    el.querySelector('.ui-content').classList.add('hidden');
                    el.querySelector('.ball-content').classList.remove('hidden');
                }
            } catch (error) {
                console.error("[Gemini Exporter] 拖拽结束失败:", error);
            }
        };

        el.addEventListener('mousedown', down);
    }

    // 智能初始化
    function smartInit() {
        try {
            // 检查页面是否准备就绪
            if (document.readyState === 'complete') {
                init();
            } else {
                // 等待页面完全加载
                window.addEventListener('load', init);
            }
        } catch (error) {
            console.error("[Gemini Exporter] 智能初始化失败:", error);
            // 降级到延迟初始化
            setTimeout(init, 3000);
        }
    }

    // 启动脚本
    smartInit();
})();