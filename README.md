# Go Game (Browser)

一个可直接在浏览器运行的围棋小游戏，支持三档 AI 难度：

- 简单：随机+邻近落子
- 中等：局部攻防评估
- 困难：候选筛选 + 一步对手应对预测

## 本地运行

这是纯静态项目，直接打开 `index.html` 即可运行。

## 项目路径规则

这个项目现在遵守统一的 `projects/ + data/` 结构：

- 项目代码目录：`projects/Go`
- 项目数据目录：`data/Go`
- 默认输入目录：`data/Go/input`
- 默认输出目录：`data/Go/output`
- 默认临时目录：`data/Go/temp`
- active docs 中，`Codex-Game` 内路径应统一使用 `projects/...`、`data/...` 这类 workspace-relative 写法
- 如需引用用户 home 下的路径，优先使用 `~/...` 或变量，不写绑定用户名的绝对路径

如果旧顶层路径 `Go` 仍然可访问，应将其视为兼容链接，而不是项目的 source of truth。

## 跨项目变更通知协议

这个项目和其他 Codex 管理项目是协作关系。

如果其他项目或组合层治理需要改动 Go 项目的默认路径、运行规则或文档约定，必须：

1. 先通知 Go 项目会改什么和为什么
2. 直接更新 Go 项目自身文档，不只改全局文档
3. 在 Go 的 `PROJECT_LOG.md` 与 `WORK_LOG.md` 中记录这次变更

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
├── README.md
├── PROJECT_LOG.md
└── WORK_LOG.md
```
