# Go Game (Browser)

一个可直接在浏览器运行的围棋小游戏，支持三档 AI 难度：

- 简单：随机+邻近落子
- 中等：局部攻防评估
- 困难：候选筛选 + 一步对手应对预测

## 本地运行

这是纯静态项目，直接打开 `index.html` 即可运行。

也可以用本地服务器（推荐）：

```bash
python3 -m http.server 8080
```

然后访问：

```text
http://localhost:8080
```

## 规则实现说明

- 19x19 棋盘
- 自杀禁手
- 打劫限制（通过局面重复检测避免重复局面）
- 连续双方停一手后结束并进行简化数目估算（含白棋贴目 6.5）
- 支持悔棋

## GitHub 托管（GitHub Pages）

1. 新建仓库并推送代码。
2. 进入仓库 `Settings` -> `Pages`。
3. `Build and deployment` 选择：
   - Source: `Deploy from a branch`
   - Branch: `main`（或 `master`）/ `/ (root)`
4. 保存后等待部署完成，即可通过页面给出的 URL 访问。

## 目录结构

```text
.
├── index.html
├── style.css
├── script.js
└── README.md
```
