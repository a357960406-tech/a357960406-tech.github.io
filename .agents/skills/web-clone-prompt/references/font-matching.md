# 字体匹配 · 截图字形 → 具体可加载字款（🔴 硬规则 1）

> 我们做的是**复刻**，不是原创。字体**必须**落到一个**真实存在、能直接加载**的字款，并给出**真实加载地址**。**绝不**写 `[inferred, swap]`、`a serif font`、`system-ui` 这种让用户自己补字体的占位——那等于没复刻。
>
> 三步：**① 分类**（看字形归到某一类）→ **② 识别**（必要时联网定到具体字款）→ **③ 解析加载地址**（按优先级链给出真实 URL）。
> ⚠️ 西里尔/中文等非拉丁字符集**不是每个字款都有**——给俄文/中文站选字体时必须确认字符集（见下方陷阱）。

---

## ① 分类：看字形归类 → 候选字款（含西里尔标注）

| 看到的字形特征 | 首选字款（+替代） | 来源 | 西里尔 |
|---|---|---|---|
| **高对比度 didone / 时装感衬线**（极细发丝、强烈粗细对比、Vogue/香水感）——高端站最常见标题脸 | **Playfair Display**（替代：Prata 最纯正、Cormorant / Cormorant Garamond 偏 Garamond、Bodoni Moda、DM Serif Display） | Google Fonts | ✅ |
| **花体 swash / 手写脚本**（连写大写、书法花饰——精品/婚庆/烈酒 logo）——**只用于字标/几个词** | **Great Vibes**（连写脚本，有西里尔）；想要"带花饰的大写衬线"而非草书 → **Cormorant SC + swash 集**。拉丁专用：Pinyon Script / Italianno / Tangerine | Google Fonts | Great Vibes/Cormorant SC ✅；其余 Latin-only |
| **干净几何/grotesque 无衬线**（UI+正文，中性现代 SaaS，色彩均匀，x-height 高） | **Inter**（现代 UI 默认）/ Manrope / Montserrat（几何）/ Jost / Roboto。高级感：Satoshi / General Sans / Switzer | Google（Inter/Manrope/Montserrat/Jost）；Fontshare（Satoshi 等） | Google 系 ✅；Fontshare 系 ❌ Latin-only |
| **压缩重型展示字**（高瘦紧、加粗全大写 hero 标题——运动/汽车/agency） | **Oswald**（压缩，有西里尔）/ Anton（超粗）/ Bebas Neue（纯大写）/ **Unbounded**（圆润重型，西里尔）/ **Russo One**（方正重型，RU 站超常见） | Google Fonts | Oswald/Unbounded/Russo One ✅；Anton/Bebas ❌ |
| **等宽技术感**（代码块/终端/数据/"工程"感） | **JetBrains Mono** / IBM Plex Mono / Fira Code（连字）/ Space Mono / Roboto Mono | Google Fonts | JetBrains/IBM Plex/Fira ✅ |
| **优雅过渡体/书籍衬线**（长正文或低调标题，文学、可信，不如 didone 张扬） | **Lora** / PT Serif / Source Serif 4 / Spectral / Merriweather；罗马大写展示 → Forum / Marcellus | Google Fonts | Lora/PT Serif/Source Serif/Spectral/Merriweather/Forum ✅；Marcellus ❌ |

**俄文/西里尔站常见**（看到俄文先从这里挑）：标题衬线 **Prata / Playfair Display / Cormorant / Forum / Yeseva One / Russo One**；正文无衬线 **Inter / Manrope / Golos Text（RU 原生 UI）/ Montserrat / PT Sans / Rubik / Jost**。

---

## ② 识别：把未知字款定到具体名字

- **URL 模式（有 live 页面）→ 跳过图像识别**：直接 DevTools `Computed → font-family` 看标题/正文，或 grep 页面 CSS / `@font-face` / network 里的 `.woff2` URL——这是 ground truth，往往连文件地址都拿到了。
- **截图模式 → 跑字体识别站**（同一张紧致裁切**跑 2–3 个取交集**，重复出现的那个几乎就是对的）：
  - **WhatTheFont**（myfonts.com/pages/whatthefont）— 库最大，印刷体/无衬线/衬线/logo 最好
  - **Fontspring Matcherator**（fontspring.com/matcherator）— 独立字厂，可框单个字形，异形展示字好用
  - **WhatFontIs**（whatfontis.com）— 百万级免费+商业库，会让你逐字确认
  - **Adobe Fonts Visual Search**（fonts.adobe.com/fonts/vs/upload）— Adobe 生态字体；⚠️ **仅拉丁，不匹配西里尔/脚本**
- **裁切要点**：抠一个干净单词/单行、深字浅底、摆正、放大——所有识别器的准确率都取决于此。
- **识别不到/是专有字 → 按 ① 的同类免费替代**（未知时装衬线 → Playfair/Prata；未知几何 UI 无衬线 → Inter/Manrope）；俄文站只选元数据含 `cyrillic` 子集的字款。

---

## ③ 解析加载地址：优先级链（每一档都给真实 URL）

按顺序往下找，命中即用：

**a) Google Fonts**（首选，免费/OFL，多数含西里尔）
```
https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap
```

**b) Fontshare**（api.fontshare.com）— Satoshi / Clash Display / General Sans / Switzer / Cabinet Grotesk / Boska 等现代 SaaS 展示+无衬线，免费商用。**⚠️ 基本只有拉丁，俄文站别用。**
```
https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap
```

**c) Bunny Fonts**（fonts.bunny.net）— 隐私版 Google Fonts，**API 100% 兼容**（同名同子集，含西里尔），换个 host 即可。要西里尔加 `&subset=cyrillic`。
```
https://fonts.bunny.net/css?family=prata:400&subset=cyrillic
```

**d) Fontsource via jsDelivr**（cdn.jsdelivr.net/npm/@fontsource/…）— npm 打包的开源字体，可锁版本、按子集取。
```
按子集 CSS（绝对地址，可直接用）：https://cdn.jsdelivr.net/npm/@fontsource/montserrat@5.2.8/cyrillic.css
直接文件：https://cdn.jsdelivr.net/npm/@fontsource/montserrat@5.2.8/files/montserrat-cyrillic-400-normal.woff2
```
> ⚠️ `index.css` 用的是**相对** `url(./files/…)`，纯 CDN 引会 404——要么用按子集的 `*.css`（如 `cyrillic.css`，里面是绝对地址），要么自己写 `@font-face` 指向上面的直接文件 URL。版本/文件名查 `https://data.jsdelivr.com/v1/packages/npm/@fontsource/<family>`。

**e) onlinewebfonts.com**（db.onlinewebfonts.com）— **最后兜底**：截图里那种专有奢侈脚本字、别处都没有免费版时。
```
样式表：<link href="https://db.onlinewebfonts.com/c/<hash>?family=<Family+Name>" rel="stylesheet">
直接文件：src: url(https://db.onlinewebfonts.com/t/<hash>.woff2) format('woff2')
```
> ⚠️ `<hash>` **每个字一个、不可编造**（瞎写的 hash 会 404）——必须去 onlinewebfonts.com 搜到该字、复制它给的 embed 代码拿真实 hash。这些是自动转换的常含专有字体，**仅原型/复刻 demo 可用，勿用于生产/再分发**。

---

## 花体字标（wordmark）专项

奢侈品牌的花体字标（连写大写 + 花饰，如 "Regal Crest" 那种）**几乎不在 Google Fonts**。处理：
- **带花饰的大写衬线**（不是草书）→ **Cormorant SC**（有西里尔）配它的 OpenType swash 集；或 Playfair Display 的大写。
- **草书连写脚本**：**Great Vibes**（有西里尔，是覆盖俄文的最佳免费奢侈脚本）；拉丁专用 Pinyon Script / Italianno / Tangerine；RU 手写感 Marck Script。
- 预算够/有 Adobe → **Bookmania**（680+ swash，衬线字标黄金标准）。
- 实在要那个专有字 → onlinewebfonts 兜底（见上，仅原型）。
- **只给字标/几个 hero 词用脚本字**，正文绝不用；很多 swash 字形要靠 OpenType（`swsh`/`calt`）才触发，词中花饰会糊。

---

## 在复刻 prompt 里怎么写「字体块」

每个角色一行：`family + 字重 + 真实加载 URL + 角色`，并永远带 `font-display:swap` + 同类 CSS 兜底栈：
```
FONTS — load in index.html:
- Headings/wordmark: "Playfair Display" (wght 400;600;700; ital 400) —
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
- Body/UI: "Manrope" (wght 300;400;500;600) —
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600&display=swap" rel="stylesheet">
tailwind.config → fontFamily: { serif:['"Playfair Display"','Times New Roman',serif], sans:['Manrope','system-ui',sans-serif] }
CSS fallback stacks included so it renders before webfont loads / if CDN blocked.
```

---

## 陷阱清单（务必内化）

- **永不输出模糊占位**：哪怕没把握，也要按优先级链给出"具体字款 + 能用的 URL"。
- **西里尔不是通用的**：Cinzel / Cinzel Decorative / Italianno / Pinyon Script / Work Sans / Anton / Bebas Neue / Marcellus 等**只有拉丁**。给俄文用这些 = 一堆豆腐块（tofu）。确认字款含 `cyrillic` 子集（或 Bunny 上加 `&subset=cyrillic`）。
- **Fontshare 系基本无西里尔**（Satoshi/Clash/General Sans/Switzer…）——西方 SaaS 复刻很好，俄文站换 Google（Inter/Manrope/Golos Text）。
- **Fontsource `index.css` 是相对路径**——纯 CDN 引会丢字；用按子集 `*.css` 或自写 `@font-face` 指直接文件。
- **onlinewebfonts 的 hash 不可编造**，必须查真实 embed；且许可"脏"，仅原型。
- **Adobe Visual Search 仅拉丁**，西里尔/脚本靠 WhatTheFont/WhatFontIs 交叉验证，或直接读 live 站 `@font-face`。
- **别用单次 `curl | grep cyrillic` 判断 Google 是否支持西里尔**（Google 按 UA 发不同子集，会假阴性）；以官方 `google/fonts METADATA.pb` 的 subset 列表为准。
- **始终 `font-display:swap` + 同类兜底栈**，CDN 被墙也能优雅降级。
