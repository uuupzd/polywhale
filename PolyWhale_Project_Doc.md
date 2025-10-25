# 🐋 PolyWhale — Polymarket Whale Trade Alert

> 实时监控 Polymarket 上的大额交易（鲸鱼行为），在大资金押注出现时立刻提示。  
> 免费、轻量、前端可视化警报工具。适合分析、观察、传播预测市场动向。

---

## 🧠 一、项目介绍｜价值与用户场景

### 📌 项目简介
**PolyWhale** 是一个实时监控 Polymarket 交易流的大额交易监控工具。  
系统定期（或实时）从 Polymarket 公共 API 获取最新交易数据，对超过指定金额（如 $1000）的交易进行识别与记录。  
用户可以实时查看“最新鲸鱼动向”，或订阅警报（例如 Telegram / Web 通知）。

---

### 💎 项目价值

| 维度 | 说明 |
|------|------|
| **信息价值** | 大额交易通常代表信心、内幕或趋势信号，跟踪鲸鱼动向有助于发现潜在行情。 |
| **传播价值** | 每条鲸鱼交易警报可在 X/Twitter 上形成讨论热点。 |
| **社区价值** | 为 Polymarket 用户和观察者提供公开、透明的数据参考。 |
| **研究价值** | 可长期分析鲸鱼账户行为模式、市场反应延迟等。 |

---

### 👥 用户价值与使用方式

#### 🎯 目标用户
- 预测市场交易者：想跟踪大资金进出、判断市场方向；  
- 数据观察者：想生成分析内容或社交媒体数据；  
- 内容创作者：想实时分享“谁刚刚在 Polymarket 押了大注”。

#### 💡 用户如何使用
1. 打开网页版 dashboard；  
2. 实时看到最近 50 笔大额交易（金额、方向、市场、时间）；  
3. 可选择：  
   - 筛选阈值（> \$500 / > \$1000 / > \$5000）；  
   - 筛选特定事件（如“Will Trump win 2028?”）；  
4. 点击“分享”生成截图，发布至 X；  
5. 后续版本支持 Telegram Bot / 邮件提醒订阅。

---

## ⚙️ 二、最小 MVP 开发计划（2～3 天验证）

### 🎯 MVP 目标
先验证「能否从 Polymarket 免费 API 拉到交易数据并筛选出大额交易」。  
只做最小可运行版本：**数据展示 + 简单过滤 + 实时刷新**。

### MVP 范围
| 功能 | 内容 | 技术说明 |
|------|------|----------|
| 🧩 数据抓取 | 从 `https://data-api.polymarket.com/trades` 获取最新交易 | 仅需 GET 请求 |
| 💰 金额筛选 | 仅显示 > \$1000 的交易 | 简单过滤逻辑 |
| ⏱️ 自动刷新 | 每 30 秒刷新一次 | SWR 或 setInterval |
| 💬 展示样式 | 表格模式：市场名 / 方向 / 金额 / 时间 | Tailwind + React Table |
| 🧾 记录限制 | 仅显示最近 50 条 | 限制内存消耗 |
| ⚙️ 可部署性 | 前端纯实现，可部署 Vercel 免费层 | 无需后端 |

### MVP 文件结构
```
/src
  /pages
    index.tsx           # 主页面：鲸鱼交易榜
  /hooks
    useWhaleTrades.ts   # 数据拉取 + 过滤逻辑
  /components
    TradeTable.tsx      # 表格组件
  /utils
    formatAmount.ts     # 格式化金额显示
    formatTime.ts       # 格式化时间
  /styles
    globals.css
```

### MVP 核心逻辑示例
```ts
// useWhaleTrades.ts
const API_URL = "https://data-api.polymarket.com/trades?limit=200";

export const useWhaleTrades = (threshold = 1000) => {
  const { data, error } = useSWR(API_URL, fetcher, { refreshInterval: 30000 });
  if (!data) return { trades: [], loading: true };

  const filtered = data.trades
    .filter(t => Number(t.usdcSize) >= threshold)
    .map(t => ({
      market: t.market.question,
      outcome: t.outcome,
      amount: t.usdcSize,
      side: t.side,
      time: new Date(t.created_at).toLocaleString(),
    }));

  return { trades: filtered, loading: false, error };
};
```

### 📅 MVP 时间表
| 阶段 | 内容 | 用时 |
|------|------|------|
| D1 | 验证 API 可访问 + 抓数据成功 | 0.5 天 |
| D2 | 实现筛选 + 表格渲染 | 1 天 |
| D3 | 样式优化 + 部署 Vercel | 0.5 天 |

---

## 🚀 三、完整开发计划（1～2 周）

| 模块 | 功能 | 说明 |
|------|------|------|
| 📊 仪表盘 | 实时大额交易榜单 | 按金额排序，展示趋势图 |
| 🔔 通知系统 | Telegram / 邮件 / Browser 通知 | 用户自定义阈值 |
| 📈 数据分析 | 统计过去 24h / 7d 鲸鱼交易次数和总额 | 用本地缓存或轻数据库 |
| 🧠 地址识别 | 识别鲸鱼地址 / 高频账户 | 基于历史交易分组分析 |
| 🕒 市场聚合 | 每个市场的 Whale Activity 图表 | 可视化趋势 |
| ⚙️ 参数控制 | 自定义刷新间隔 / 阈值 / 市场筛选 | 提升可用性 |
| 💾 数据存储 | 轻量后端（可选） | 保存历史鲸鱼记录用于回测 |
| 🎨 UI 优化 | 夜间模式 + 一键截图分享 | 社交传播用 |
| 📱 移动端支持 | 响应式布局 | X / Telegram 友好展示 |
| 🧩 开放 API | 输出 JSON 接口供其他人调用 | 扩展生态 |

---

## 🔮 延展方向
- Whale Heatmap（大户活跃热力图）  
- Market Pulse Radar（大额资金动向可视化）  
- Whale Rank（历史累计押注榜单）  

---

## ⚠️ 风险与注意事项
- 数据延迟约 15～30 秒，不可视为实时交易信号；  
- 警报仅展示公开链上交易，不代表内幕消息；  
- 请勿用于投机或金融建议。

---

## 📃 总结
**PolyWhale** 的目标是成为「预测市场的鲸鱼雷达」。  
它用最轻量的方式展示资金的真实流动，帮助普通用户也能“看到鲸鱼游动的方向”。  

> 简单、免费、有传播性。让每一笔大额交易，都能被社区第一时间看到。
