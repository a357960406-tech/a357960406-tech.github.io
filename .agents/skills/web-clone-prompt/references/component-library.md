# 组件库 · motionsites.ai 复刻提示词反复出现的「招牌零件」

> 这是从 11 个真实复刻提示词里抽离出来的**可复用组件 / CSS 目录**。
> 生成一份复刻 prompt 时，如果识别出页面用到了下面任何一个「招牌效果」，**直接把对应小节的代码原样写进 prompt**（或写「使用本库的 X 组件」并附代码），不要每次重新口头描述——这些数值就是让 AI 1:1 复刻的关键。
>
> 用法：在生成的复刻 prompt 里，把命中的组件放进「Custom CSS Utilities」或「Custom Components」区块。

---

## 0. 这套设计系统的 DNA（先建立直觉）

motionsites.ai 上的页面有极强的家族脸：

- **暗色电影感** + **全屏背景视频**（CloudFront `.mp4`，`autoPlay muted loop playsInline object-cover`），**视频上不加暗色蒙版**——靠玻璃拟态 UI 自己造对比。
- **Liquid Glass（液态玻璃）拟态**：几乎透明的填充 + 用 CSS mask 做的渐变描边。这是最高频的招牌。
- **斜体衬线标题字**（Instrument Serif / Playfair Display）+ **干净无衬线正文**（Barlow / Inter / Geist），大标题一律**负字距**（`tracking-[-4px]` 之类）。
- **逐字/逐词 blur-in 入场动画**（BlurText / StaggeredFade / ScrambleIn）。
- **玻璃胶囊**承载导航、徽章、标签（`rounded-full` pill）。

识别截图时只要看到这些信号，就大概率属于这套系统，可直接复用下方零件。

---

## 1. Liquid Glass（液态玻璃）★ 最高频

出现于范例 2/6/8/11（以及 7 的玻璃拟态变体）。两个变体：`.liquid-glass`（细腻，用于导航/标签/卡片）和 `.liquid-glass-strong`（重模糊，用于主 CTA）。

```css
.liquid-glass {
  background: rgba(255, 255, 255, 0.01); /* 深色玻璃则用 rgba(0,0,0,0.4) */
  background-blend-mode: luminosity;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: none;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}
.liquid-glass::before {            /* 渐变描边：靠 mask 只留 1.4px 边 */
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.4px;
  background: linear-gradient(180deg,
    rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 20%,
    rgba(255,255,255,0)   40%, rgba(255,255,255,0)   60%,
    rgba(255,255,255,0.15) 80%, rgba(255,255,255,0.45) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
.liquid-glass:hover  { background: rgba(255,255,255,0.04); box-shadow: inset 0 1px 2px rgba(255,255,255,0.15); }
.liquid-glass:active { transform: scale(0.98); }

.liquid-glass-strong {            /* 同结构，仅以下不同 */
  backdrop-filter: blur(50px);
  -webkit-backdrop-filter: blur(50px);
  box-shadow: 4px 4px 4px rgba(0,0,0,0.05), inset 0 1px 1px rgba(255,255,255,0.15);
}
/* .liquid-glass-strong::before 的渐变停点改为 0.5 / 0.2 / 0 / 0 / 0.2 / 0.5 */
```

**变体（范例 6/7 的轻玻璃）**：当截图里的玻璃更「实」、有可见边框时，用更简单的：
```css
background: rgba(10,10,10,0.7); backdrop-filter: blur(20px);
border: 1px solid rgba(255,255,255,0.08);
box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
```
或纯 Tailwind：`bg-black/20 backdrop-blur-md rounded-2xl border border-white/10`。

**默认圆角变药丸**（范例 2）：Tailwind config 里 `borderRadius.DEFAULT: "9999px"`，让裸 `rounded` 直接成胶囊。

---

## 2. FadingVideo · rAF 手写视频淡入淡出

出现于范例 2/11。比 CSS transition 更顺滑，循环时首尾交叉淡化，**不要用 `loop` 属性**（手动在 `ended` 里重置）。

- props：`src`（`string | string[]`，数组则循环切换）、`className`、`style`
- 起始 `opacity: 0`；`<video autoPlay muted playsInline preload="auto">`
- 常量：`FADE_MS = 500`，`FADE_OUT_LEAD = 0.55s`
- `fadeTo(target, duration)` 用 `requestAnimationFrame`，**从 `video.style.opacity` 当前值续接**；每次开始前 `cancelAnimationFrame` 掉上一个 id
- `loadeddata` → opacity 0 → `play()` → `fadeTo(1)`
- `timeupdate` → 若未在淡出且 `duration - currentTime <= 0.55 && > 0` → 翻转 ref、`fadeTo(0)`
- `ended` → opacity 0 → `setTimeout(100ms)` 后 `currentTime=0`、`play()`、清 ref、`fadeTo(1)`；数组源则前进到下一个 index
- 卸载清理：cancel rAF + 移除监听
- 常配排版：`absolute left-1/2 top-0 -translate-x-1/2 object-cover object-top z-0`，inline `width:120% height:120%`（焦点在画面顶部时）

---

## 3. 文字入场动画家族 ★ 高频

按截图里标题的「入场感」选一个。即使是静态截图，也应**默认**给大标题配一个逐词/逐字入场（这套系统几乎必有）。

### 3a. BlurText — 逐词 blur-in（范例 2/11）
- `IntersectionObserver` 阈值 0.1 触发；按空格切词，每词一个 `motion.span`
- `initial: { filter:'blur(10px)', opacity:0, y:50 }`
- 关键帧 → `{ filter:'blur(5px)', opacity:0.5, y:-5 }` → `{ filter:'blur(0px)', opacity:1, y:0 }`
- `duration:0.7`，`times:[0,0.5,1]`，`ease:'easeOut'`，每词 `delay = i*100ms`
- 词 span：`display:inline-block; marginRight:0.28em`（负字距会吃掉 nbsp，所以用 margin）
- 父容器：`display:flex; flexWrap:wrap; justifyContent:center; rowGap:0.1em`

### 3b. StaggeredFade — 逐字淡入（范例 6）
- 按字符切，每字 `motion.span`；`useInView({ once:true })` 触发
- variants：`hidden = {opacity:0}` → `show = {opacity:1, y:0, delay: i*0.07}`

### 3c. WordsPullUp / WordsPullUpMultiStyle — 逐词上拉（范例 1）
- 按空格切词，每词 `motion.span` 从 `y:20 → 0`，stagger `0.08s`，`useInView({ once:true })`
- MultiStyle 版：传 `{text, className}[]` 段落数组，逐词保留各自 className（用于「正常 + 斜体衬线 + 正常」混排标题）
- 可选 `showAsterisk`：末词末字后加上标 `*`

### 3d. ScrambleIn / ScrambleText — 乱码归位（范例 5，科技/赛博风）
- 字符集：`ABC…XYZabc…xyz0-9!@#$%^&*()_+~|}{[]:;?><`
- ScrambleIn（入场）：延迟后每 25ms 一帧，从左到右以 0.5 字/帧揭示；未揭示处显示随机字符（领先光标 ≤3 个），更远为空；空格恒为空格；未触发时渲染 `&nbsp;`
- ScrambleText（hover）：悬停时全部打乱再从左到右 4 帧/字（25ms 间隔）揭示；离开立即复原

### 3e. AnimatedText — 滚动驱动逐字透明度（范例 1/4）
- 每字从 `opacity 0.2 → 1`，由滚动进度驱动；`useScroll` target 段落，`offset: ['start 0.8','end 0.2']`
- `charProgress = index/totalChars`，区间 `[charProgress-0.1, charProgress+0.05]`
- 实现：不可见占位字符 + 绝对定位的动画 span 叠加

### 3f. AnimatedHeading — 逐字横移入场（范例 8，纯 CSS transition 版）
- 按 `\n` 切行，再按字切；每字 `inline-block <span>`，CSS transition `opacity` + `transform: translateX`
- 起始 `opacity:0, translateX(-18px)` → `opacity:1, translateX(0)`
- 每字延迟 `(lineIndex*lineLength + charIndex) * 30ms`，整体起始延迟 `200ms`，单字 `500ms`
- 空格渲染为 ` `

---

## 4. FadeIn · 通用延迟淡入包装（范例 4/8）

两种实现，按页面用没用 framer-motion 选：

- **Framer 版**（范例 4）：`whileInView` + `viewport={{ once:true, margin:"50px", amount:0 }}`；props `delay / duration(默认0.7) / x(默认0) / y(默认30)`；ease `[0.25,0.1,0.25,1]`；用 `motion.create()` 支持动态元素类型
- **纯 state 版**（范例 8）：起始 `opacity:0`，`setTimeout(delay)` 后置 `opacity:1`；inline `transitionDuration` + Tailwind `transition-opacity`

---

## 5. Magnet · 磁吸悬停（范例 4）

- 跟踪鼠标相对元素中心的位移，`translate3d` 除以 `strength` 系数
- 当光标进入元素边缘 `padding` 距离内激活
- 进入过渡 `transform 0.3s ease-out`，离开 `transform 0.6s ease-in-out`，`willChange:'transform'`
- 典型参数：`padding 150, strength 3`

---

## 6. RevealLayer · 光标聚光揭示第二张图（范例 3）★ 招牌机关

底图之上盖一张「揭示图」，只在跟随光标的柔光圆里可见。

- 父层：`SPOTLIGHT_R = 260`；refs `mouse`(原始) / `smooth`(缓动) / `rafRef`；state `cursorPos`(初始 `{x:-999,y:-999}`)
- `mousemove` 存原始坐标；rAF 循环 `smooth.x += (mouse.x - smooth.x) * 0.1`（y 同），再 `setCursorPos`
- `RevealLayer({ image, cursorX, cursorY })`：
  - 隐藏 `<canvas>`（`display:none`，尺寸 = 窗口宽高，mount + resize 时设）
  - 揭示 `<div>`：`absolute inset-0 bg-center bg-cover z-30 pointer-events-none`，背景为揭示图
  - 每次渲染：清 canvas → 在 `(cursorX,cursorY)` 画 0→`SPOTLIGHT_R` 的径向渐变，停点 `0:1 / 0.4:1 / 0.6:0.75 / 0.75:0.4 / 0.88:0.12 / 1:0` → 填圆 → `canvas.toDataURL()` 作为揭示 div 的 `maskImage`/`webkitMaskImage`，`maskSize:'100% 100%'`

---

## 7. ScaledDashboard · 等比缩放装进容器（范例 9）

用于「浏览器 chrome + 仪表盘 mockup」按固定设计宽度渲染再缩放塞进容器。

- `ResizeObserver` 监听外层宽度
- 内层按固定设计宽度（如 **896px**）渲染，CSS `transform: scale()` 缩小，`transformOrigin:'top left'`
- 外层 div 高度设为 `inner.offsetHeight * scale`，防止溢出

---

## 8. SquashHamburger · 动画汉堡（范例 5）

- 3 条横杠（`absolute` 定位 `span`）
- 桌面容器 18×12px、杠高 1.5px；移动 15×10px、杠高 1.2px
- 打开：上杠 `rotate 45deg` 下移到中；中杠淡出+缩没；下杠 `rotate -45deg` 上移到中
- 弹簧：`stiffness 300, damping 20`
- 简单版（多数范例）：lucide-react `Menu` / `X` 图标切换 + `AnimatePresence` 下拉

---

## 9. CSS Keyframes 库（纯 CSS 入场，范例 9/3）

```css
@keyframes fade-up   { from{opacity:0; transform:translateY(24px); filter:blur(6px)} to{opacity:1; transform:translateY(0); filter:blur(0)} }
@keyframes fade-down { from{opacity:0; transform:translateY(-16px)}                  to{opacity:1; transform:translateY(0)} }
@keyframes hero-rise { from{opacity:0; transform:translateY(64px) scale(0.97)}       to{opacity:1; transform:translateY(0) scale(1)} }
.animate-fade-up   { animation: fade-up   0.9s cubic-bezier(0.22,1,0.36,1) both; }
.animate-fade-down { animation: fade-down 0.7s cubic-bezier(0.22,1,0.36,1) both; }
.animate-hero-rise { animation: hero-rise 1.1s cubic-bezier(0.22,1,0.36,1) both; }

/* Ken Burns / 标题揭示（范例 3） */
@keyframes heroReveal { 0%{opacity:0; transform:translateY(28px); filter:blur(12px)} 100%{opacity:1; transform:translateY(0); filter:blur(0)} }
@keyframes heroZoom   { 0%{transform:scale(1.12)} 100%{transform:scale(1)} }
.hero-anim  { opacity:0; animation-fill-mode:forwards; animation-timing-function:cubic-bezier(0.16,1,0.3,1); }
.hero-reveal{ animation-name:heroReveal; animation-duration:1.1s; }
.hero-zoom  { animation:heroZoom 1.8s cubic-bezier(0.16,1,0.3,1) forwards; }
```
- 交错延迟用内联 Tailwind 任意值 `[animation-delay:Xms]`（如行 1 无延迟、行 2 `100ms`、搜索框 `220ms`…）
- **必须**加 `@media (prefers-reduced-motion: reduce){ ... animation:none; opacity:1; }`

---

## 10. 渐变文字 / 噪点 / 点阵 等氛围工具

- **渐变标题字**（范例 4）：`background: linear-gradient(180deg,#646973 0%,#BBCCD7 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent;`
- **噪点纹理**（范例 1）：内联 SVG `feTurbulence`，`.noise-overlay`（baseFrequency 0.85, octaves 3，叠在 hero 视频上 `opacity-[0.7] mix-blend-overlay`）、`.bg-noise`（0.9 / 4，section 背景 `opacity-[0.15]`）
- **点阵叠层**（范例 5）：`radial-gradient(#fff 1px, transparent 1px)`，24×24px，`opacity 0.05`，`pointer-events-none`
- **巨型水印字**（范例 5）：Anton SC 字体，`clamp(120px,30vw,521px)`，`opacity 0.10`，用 `radial-gradient + background-clip:text` 上色

---

## 11. 自定义 SVG Logo 模式（范例 3/5/7/9/11）

这套页面几乎不用现成 logo，而是内联一个 4 折对称/抽象几何 SVG，`fill="currentColor"` 继承文字色，`viewBox="0 0 256 256"`。识别截图时若 logo 是简单几何形，就：

1. 描述其几何（如「4 瓣风车 / 4 折旋转对称 / 抽象棱角块」）
2. 直接给一个可用的近似 `path`/`polygon`，并标注 `[drawn approximation]`；不要要求用户补真实 logo path

范例可参考 examples 里 03/04 的 path 写法。lucide-react 的图标（`ArrowUpRight / Play / Menu / X / Check / ChevronDown / Sparkles / ArrowUp`）则直接点名即可。

---

## 速查：截图信号 → 命中组件

| 截图里看到 | 大概率用了 |
|---|---|
| 半透明带细亮边的导航/胶囊/卡片 | §1 Liquid Glass |
| 全屏背景视频、首尾很顺地循环 | §2 FadingVideo（或简单 `autoPlay muted loop`） |
| 大标题逐词/逐字「糊→清」出现 | §3a BlurText / §3b StaggeredFade |
| 标题里夹一段斜体衬线 | §3c WordsPullUpMultiStyle |
| 乱码字符归位、科技感 | §3d ScrambleIn |
| 滚动时正文逐字变亮 | §3e AnimatedText |
| 头像/按钮随鼠标轻微吸附 | §5 Magnet |
| 鼠标划过露出另一张图的柔光圈 | §6 RevealLayer |
| 嵌着一个产品/仪表盘截图 mockup | §7 ScaledDashboard |
| 渐变色的大标题文字 | §10 渐变文字 |
