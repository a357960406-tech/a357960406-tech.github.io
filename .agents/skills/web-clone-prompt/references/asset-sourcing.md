# 素材策略 · 让消费端 AI 自己把素材变出来（🔴 硬规则 2）

> 交付物是**一段可移植的纯文字 prompt**。目标不是让**用户**补素材，而是让拿到 prompt 的 **AI 自己完成素材闭环**：URL 模式能复用公开稳定源站资源就复用，截图模式或 URL 缺口才按生成简报生成——用户始终零负担。
>
> 关键区别：`REPLACE-ME` 是给**用户**留空（❌ 错）；**生成简报**是给 **AI** 留精确规格（✅ 对）。
>
> 很多消费端工具自带图像生成（具备 OpenAI image generation 权限的 Codex 环境、Gemini、v0、Lovable、bolt…），所以**截图模式默认**就是在 prompt 里把每个图/视频写成**生成简报**，让具备能力的消费端直接生成；没有生图权限时，保留 brief 或切到 `fetch-only`。**URL 模式默认**优先复用公开稳定的原站图片、视频、字体、SVG、Lottie/JSON；抓不到、不稳定、未授权上线复用时再写生成简报。`REPLACE-ME` / `placehold.co` 仍然禁用。

> 授权边界：原站 URL 和公开 CDN 资源可作为授权复刻、内部研究、本地回归的证据源。若用户要公开发布第三方站点的复刻页面，必须把第三方品牌、文案、商标、专有图片/视频/字体替换为用户自有或可授权素材；原站资源只能标注为 `internal reference only` 或 `replace before production`，不能写成生产可复用素材。

---

## 决策优先级（从最可移植往下退）

```
① URL 抽取【URL 模式默认】→ 授权/内部场景中，公开稳定的原站图片/视频/字体/SVG/Lottie/JSON 作为主资产写入 prompt；公开发布第三方复刻时标成 replace-before-production
② 生成简报【截图模式默认；URL 缺口/上线替换兜底】→ 在 prompt 里精确描述每个图/视频，让会生图的 AI 自己生成（纯文字、零附件）
③ stock 直链兜底【仅 fetch-only】→ 每个无法抽取/生成的素材附一条真实免费直链，兼容不会生图的工具（如纯 Claude Code）
④ 截图裁切【最后兜底】→ 截图模式必须复用原图像素时才裁切
   头像→DiceBear/Pravatar；图标→lucide-react / 内联 SVG
```
产物顶部放 **「素材清单」**：每个资源 = 授权/内部用稳定原站 URL、`replace before production` 原站参考，或一段生成简报（`fetch-only` 时才加兜底直链）。不允许出现 `REPLACE-ME`。

---

## ① URL 抽取（URL 模式默认 · 稳定原站资源优先）

当用户给 URL 时，素材不是靠猜：先抽取并验证公开稳定资源，再写入 prompt。这样 prompt 仍然是纯文字，但消费端 AI 可以在授权/内部研究范围内直接复用原站素材；公开发布第三方复刻时，把这些 URL 作为内部参考并要求替换为自有或授权素材。

- 抽取 `<img src/srcset>`、`<video>/<source src>`、CSS `background-image:url(...)`、`@font-face src`、inline SVG path、Lottie/JSON、公开 CDN 文件。
- 统一转成绝对 URL，保留 query string、空格编码、大小写和 hash；同源相对路径必须补齐域名。
- HEAD/GET 验证关键资源返回 200，且不是登录页、403、短期签名、blob/data URL、session URL。
- 视频写清 `autoplay muted loop playsinline`、尺寸语义、poster/fallback；图片写清最终 `object-fit`、`object-position`、裁切和层级。
- 如果资源可抓但语义上会导致复刻错误（例如截图中只有烤字图片、无法分离 live text），在 prompt 里说明如何分层：可直接复用整图，或改用生成简报生成无字底图再叠 live HTML。
- 抓不到、不稳定、跨域阻断、登录/付费、临时签名、素材缺失、或未授权上线复用时，回到下面的生成简报；不要要求用户手动下载。

写进 prompt 的样子：
```
target_asset_mode: url-extracted-assets-primary.
Use stable original assets first. If any original URL fails at implementation time,
generate the fallback brief under the same asset alias.

HERO_RING (original IMG): https://theunknown.tv/images/ring-DZI3XSya_yIGDA.webp
  Use exactly; object-fit: contain; object-position: center; layer z-index 2.
SERVICE_VIDEO_1 (original WEBM): https://theunknown.tv/videos/01%20-%20business%20marketing.webm
  autoplay muted loop playsinline; object-cover; rounded 6px.
```

## ② 生成简报（截图模式默认 · URL 缺口兜底）

为每个图/视频写一段**拍摄级、可生成**的描述。不能只写主题词；要像给摄影指导和图像模型同时下 brief。先从截图拆出这些维度，再写生成简报：

- **类型 & 用途 & 比例**：photoreal editorial photo / cinematic still / clean 3D render / illustration；用途是 `full-bleed hero`、`4:5 card`、`wide section image`；比例（16:9 / 4:5 / 9:16）和最终 CSS `object-fit/object-position`。
- **拍摄视角 & 镜头感**：top-down drone、high oblique aerial、eye-level editorial、macro close-up、over-the-shoulder；wide-angle / telephoto compression / shallow depth of field / tilt-shift feel。
- **构图骨架**：三分法/居中/对角线/环绕式；主体在第几象限；前景/中景/背景层次；哪里留给 live text；哪里需要低细节安全区；裁切边缘保留什么。
- **主体 & 主体细节**：主体是什么、数量、姿态、材质、边缘形状、服装/道具/纹理；不要只写 "golf course"，要写 fairway stripe direction、bunker shape、tree shadow、club head material、ball/cup relation。
- **色调对齐本页色板**🔑：明确写 hex + 色彩词，让生成图和设计融为一体（如 `#132807 deep forest green`, `#F6F0E5 warm ivory`, `#D8C7AA sand beige`; desaturated, no neon）。
- **光线 & 氛围**：柔光/逆光/黄金时刻/阴天；contrast level；shadow softness；mood 词（cinematic / serene / editorial / luxury）。
- **材质 & 画面处理**：film grain, matte contrast, soft haze, bokeh, crisp product edges, no HDR, no oversharpening。
- **硬约束**🔑：`no visible text, no watermark, no logo, no letters, no signage, no UI`（避免生成图里又冒出文字/水印，破坏复刻）。
- **代码落位**：`object-position: 52% 46%`、叠加何种 veil/noise、图片是否要和 live text 分层；摄影背景不要烤进任何按钮/标题。
- **视频/伪视频额外**：`seamless loop, subtle slow motion, autoplay muted loop playsinline, object-cover`；若只能生成静态图，必须指定代码微动效（slow pan/scale/rotate/parallax）来模拟视频感。
- **参考图锁定**：如果截图里已经有明确摄影/mockup图（电脑、手机、手持设备、产品卡、人物、空间），生成简报必须逐项锁定它的**取景比例、主体占画面比例、主体位置、视角、屏幕/道具内容、光影几何、裁切边界、最终在页面中的遮挡关系**。不要把这类位图主体改成 HTML/CSS 形状去“可控还原”；代码只负责 live overlay、裁切、滚动/入场和少量必须精确的文字。
- **屏幕内容不是默认留白**：只有原图本来是空屏，或你明确写了 live HTML 覆盖屏幕并给出坐标/透视时，才能要求 `blank screen`。如果参考图里的电脑/手机屏幕有可见界面，就要在 brief 里描述界面构图（例如大标题、右侧图片块、底部栏目、明暗关系）；小字可以近似，但不要让模型生成纯白屏。
- **遮挡图像要有双状态**：当生成图在最终截图里挡住大标题/字标/CTA 时，这通常是动效终态而不是首屏默认状态。brief 与实现提示要同时写：`initial state`（字标先完整可见、图像在下方/透明/缩放）和 `final captured state`（图像上移遮挡字标），并给出滚动或入场映射。

**写进 prompt 的样子**（每个素材一行/一段，放进对应 section 或顶部清单）：
```
[IMG hero-bg] Full-bleed cinematic aerial/top-down photo of a manicured golf course —
  fairways, organically-shaped sand bunkers, scattered trees, soft water reflections.
  Deep olive-green + warm cream palette, slightly desaturated, soft overcast light,
  editorial luxury mood. 16:9, focal interest lower-center. No text, no watermark, no logo.
  target_asset_mode=image-gen-capable: generate this image directly; no external file needed.
  target_asset_mode=fetch-only fallback: <verified stock URL>.

[VID hero-bg] Same subject as a 6–10s seamless looping drone clip, subtle slow push-in,
  autoplay muted loop playsinline, object-cover. No text/watermark.
```
> 让"色调对齐页面"成为习惯——这是生成素材与复刻设计"贴脸"的关键；否则生成图配色乱飞，复刻就垮了。

### Image generation brief 写法

消费端具备图像生成能力时，简报要写得像给图像模型的 art direction，而不是像给前端工程师的占位说明。若当前 Codex 环境没有可调用的图像生成工具/API 权限，仍保留这段 brief，或按 `fetch-only` 规则补一条已核验兜底 URL：

```
[IMG hero-bg | generate with available image tool | 16:9 landscape | CSS object-cover]
Medium: <<photoreal editorial photo / cinematic still / 3D render>> for <<exact page slot>>.
Camera: <<top-down drone / high oblique aerial / eye-level / macro close-up>>, <<wide-angle / telephoto / shallow-DOF>> lens feel.
Composition: <<subject placement, diagonal/center/rule-of-thirds structure, foreground/midground/background, crop, negative space for live HTML text, object-position>>.
Subject details: <<specific visible forms, textures, materials, pose, props, environment details; no generic nouns only>>.
Palette lock: match page tokens exactly: <<hex + color word>>, <<hex + color word>>, <<hex + color word>>;
desaturated tones only, avoid colors outside the palette.
Lighting: <<golden hour / overcast / soft studio / rim light>>, <<shadow softness/contrast/haze>>.
Texture/style: <<film grain / matte contrast / luxury editorial / clean product render>>, no HDR, no oversharpening.
Negative constraints: no visible text, no watermark, no logo, no letters, no signage, no UI, no captions, no extra badges.
Delivery: save as <<asset name>>, use with object-cover and object-position <<x% y%>>, overlay <<veil/noise if any>>.
Motion after generation: <<for hero/media backgrounds, CSS/Framer slow pan/scale/rotate/parallax values; none for static content cards>>.
```

**Image generation tuning rules:**
- Name the **medium** first (`photoreal editorial photo`, `clean 3D render`, `flat vector illustration`) so the model does not mix styles.
- Give a **single focal subject** and a clear crop; if live copy sits on top, request empty space exactly where the text goes.
- Copy the page palette into the brief as **hex + color words**; hex alone is useful to the coding agent, color words help the image model.
- Put all typography in live HTML/CSS. Image briefs must say `no visible text, no watermark, no logo, no UI`.
- Exception: if the reference image itself contains a device screen or printed material with visible UI/text, do **not** erase it into a blank surface. Ask for the screen/page composition to be visible and close to the reference; keep exact external page copy live, but let tiny in-screen text be approximate when it is not part of the page content.
- For repeating cards, generate a matched **set** with one shared style sentence and per-card subject deltas, not unrelated standalone images.
- If a transparent asset is needed, prefer inline SVG/CSS or generate on a flat matching background and mask in CSS; do not depend on transparent output.
- For screenshot cloning, derive each brief from the visible image grammar: if the screenshot uses top-down aerial golf imagery, every inferred course image should preserve the same aerial/editorial grammar unless the section clearly needs a different crop.
- For hero backgrounds that looked like video but are implemented with still images, add **perceptible** code motion in the prompt: `animate background image scale 1.04→1.18, rotate -1.8deg→1.8deg, translate -3%/-1.6%→3%/1.6%, duration 18–24s, ease-in-out, repeat mirror, transform-origin center`. For drone/aerial pages, verify the motion by comparing computed transforms or screenshots 3–5 seconds apart; if the result still looks static, increase translate before adding decorative effects.

### 从截图到生图 prompt 的拆解表

Before emitting an asset brief, fill this mini-table mentally and encode the answers in the brief:

| Dimension | Questions to answer | Bad | Good |
|---|---|---|---|
| Viewpoint | Is it top-down, eye-level, macro, oblique, device mockup? | "golf course" | "high oblique drone view, fairway diagonal from lower-left to upper-right" |
| Composition | Where is the focal mass and where does live text sit? | "nice background" | "dark low-detail center safe area for 104px cream wordmark; bunkers in upper-right and lower-right edges" |
| Subject details | Which forms make it recognizable? | "club life photo" | "cream golf bag, brushed steel irons, dark green grass blades, no readable brand marks" |
| Palette | Which page tokens must dominate? | "green and beige" | "`#132807` forest green 70%, `#F6F0E5` ivory highlights, `#D8C7AA` sand beige, desaturated" |
| Light | What time/contrast/shadows? | "beautiful light" | "soft golden-hour side light, long feathered tree shadows, low contrast haze" |
| Integration | How is it used in code? | "image card" | "4:5 card, object-position 48% 42%, dark bottom gradient for live Russian title; if rounded 16:9 media has excess sky/blank top, crop with h-[125%] and object-position 50% 68%" |

### 生图前 prompt 审查门禁

在真正调用生图之前，先用 30 秒把 brief 和参考图逐项对照。任一项不匹配就先改 prompt，不要直接生成：

1. **画幅/裁切**：目标是网页里的窄横幅、4:5卡片、手机竖图，还是完整产品照？不能把窄横幅写成通用 16:9 产品大片。
2. **主体比例**：主体在参考图里占画面多少？例如电脑只占下半区，不能写成几乎填满画面的居中产品照。
3. **内容状态**：屏幕/画框/纸张是空白、暗屏、还是有界面？参考里有内容就不能写 blank screen。
4. **光影几何**：阴影是左上三角、横向窗光、逆光剪影、还是柔光棚拍？必须写形状和方向。
5. **页面叠层**：这张图是否遮挡标题、贴着分区边界、被圆角裁切、或需要 live nav 覆盖？必须写 final placement 与 initial/final motion state。
6. **禁用误导词**：如果目标不是 catalog/product shot，就不要写 `single product centered`, `clean studio`, `blank screen`, `generous padding` 这类会把构图带偏的词。

If the original screenshot image is not reproducible enough from one brief, instruct the consuming agent to generate **2–3 variants internally and choose the closest** by these criteria: palette match first, composition second, subject details third. Do not ask the user to pick unless they explicitly want a review loop.

---

## ③ stock 直链兜底（可选 · 兼容不会生图的工具）

给纯 Claude Code 这类**不生图**但能 fetch 的工具留一条退路：每个素材附**一条**真实免费、可热链的直链。用 WebSearch / firecrawl 找主题匹配的，pin 真实直链（最好 fetch 一下确认能访问）。默认不附兜底；只有用户指定 `target_asset_mode=fetch-only` 或目标工具不会生图时才附。

### 图片

| 源 | 直链写法（已核验） | 主题定向 | 备注 |
|---|---|---|---|
| **Unsplash**（首选真实照片） | `https://images.unsplash.com/photo-<ID>?w=1600&q=80&auto=format&fit=crop` | ✅ 选定具体 photo-id → 主题可控且 URL 确定 | 官方**要求**热链 CDN；免费、无需署名。`<ID>` 从 `unsplash.com/photos/<slug>-<id>` 页的 og:image 取真实 `photo-…` |
| **Pexels** | `https://images.pexels.com/photos/<ID>/pexels-photo-<ID>.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1600&h=900` | ✅ 选定 id | 免费商用、可热链、无需署名 |
| **Picsum**（**仅占位/装饰**） | `https://picsum.photos/seed/<seed>/1600/900`（带 `/seed/` 才确定） | ❌ 无主题定向 | 不带 seed 每次变，别用 |
| **DiceBear**（生成头像） | `https://api.dicebear.com/10.x/<style>/svg?seed=<str>&backgroundColor=b6e3f4&radius=50` | 合成头像，按 seed 唯一 | 优先 `/svg`（位图限 256²）|
| **Pravatar**（真人头像，~70 张） | `https://i.pravatar.cc/150?img=<1-70>` | 真人脸、不可主题定向、会重复 | 多个不同头像用 DiceBear |

> 🔴 **头号陷阱：`source.unsplash.com` 已于 2024-06 彻底关停**——`source.unsplash.com/1600x900/?golf` 这类**会 404**。模型凭训练记忆很容易吐出这种死链，**绝对不要用**。要主题定向又没现成 id：Unsplash API（`https://api.unsplash.com/photos/random?query=<kw>&orientation=landscape&client_id=<KEY>`，返回 JSON，从 `urls.regular` 取 `images.unsplash.com` 直链；**API 地址本身不能直接 `<img src>`**），或改用 Pexels。

### 视频（背景）

| 源 | 直链写法 | 主题定向 | 备注 |
|---|---|---|---|
| **Pexels Videos**（**推荐默认**） | `https://videos.pexels.com/video-files/<id>/<id>-hd_1920_1080_30fps.mp4` | ✅ 免费 API 按主题搜，从 `video_files[].link` 取确切 mp4 | 免费商用、官方支持直链；CORS+Range OK。**用 hd 1920×1080**，别用 4K uhd（拖慢 autoplay/LCP）|
| **Google 示例桶**（**最稳兜底**） | `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/<Clip>.mp4` | ❌ 固定 ~13 片，非主题 | 十年老链、无 key、永不挂；电影级 `Sintel.mp4`/`TearsOfSteel.mp4`，抽象循环 `ForBiggerBlazes.mp4`。**偏占位感** |
| **Cloudinary /demo**（要 URL 内变换） | `https://res.cloudinary.com/demo/video/upload/q_auto,f_auto,w_1920/sea_turtle.mp4` | ❌ 一小撮 demo 片 | URL 里直接 `q_auto,f_auto,w_1920`/`.webm`。demo 账号，原型用 |
| **Coverr**（无署名正版+主题） | API `https://api.coverr.co/videos?query=<topic>&urls=true`（Bearer key），读 `hits[].urls.mp4` | ✅ | 需免费 key + 对 `mp4_download` ping 一次 |
| **Mixkit** | — | — | ⚠️ **禁止热链**（许可禁止 + CDN Referer 403）。只能下载后自托管 |

**视频三件套**（缺一不能 autoplay）：`<video autoplay muted loop playsinline>`；iOS 必须 `playsinline`；选 1920×1080 控体积；确认源支持 Range/CORS 才能 loop/seek。

---

## ④ 截图裁切（仅「强 1:1 像素级」时）

只有截图模式下**必须是原图那张照片**时才用——这是兜底，不是默认。URL 模式优先走上面的 URL 抽取，而不是截图裁切。

- **从截图裁切**（截图里实质可见、且必须是那张原图时）：
  ```bash
  # macOS 自带 sips —— -c 高 宽，--cropOffset 上 左（Y X）
  sips -c 260 210 --cropOffset 905 435 screenshot.png --out card.png
  # ImageMagick —— WxH+X+Y，可顺手放大
  magick screenshot.png -crop 210x260+435+905 +repage card.png
  magick card.png -resize 200% card@2x.png
  ```
  要点：先量像素坐标（截图实际像素）；小缩略图 OK，全幅 hero 别硬裁（糊）；logo 优先重画内联 SVG；裁出的文件随项目放 `public/`，并在素材清单注明 "cropped from screenshot"。
  ⚠️ 注意截图里**烤进图的文字/标签**：直接当整卡图用就别再叠 live 文字（否则重影）；要 live 文字就改用 ① 简报/② stock 的无字图。

---

## ⑤ 头像 / 图标

- **头像**：多个不同 → DiceBear（`api.dicebear.com/10.x/<style>/svg?seed=`，按 seed 唯一）；少量真人感 → Pravatar `?img=N`。
- **图标**：优先 `lucide-react` 具名图标（`ArrowRight/Menu/X/Check/Play/Trophy/Utensils/…`）；库里没有的（高尔夫挥杆等）→ 内联 `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">` 手画。

---

## 在复刻 prompt 里怎么写「素材清单」

放 prompt 顶部，每条 = 稳定原站 URL 或生成简报（`fetch-only` 才加兜底）：
```
素材清单 / ASSETS — target_asset_mode=url-extracted-assets-primary or image-gen-capable:
- Hero bg video: [VID] seamless looping drone aerial of a golf course, olive-green+cream
  palette, soft light, no text/watermark; autoplay muted loop playsinline object-cover.
  fetch-only fallback only if requested: https://videos.pexels.com/video-files/.../...-hd_1920_1080_30fps.mp4
- About card 1/2/3: [IMG 4:5] golf irons on grass / woman golfer with towel / putting green
  with flag & tree shadows; same palette, editorial, no text. (object-cover)
- Avatars: [IMG] OR https://api.dicebear.com/10.x/lorelei/svg?seed=...
- Logo: inline SVG mark (drawn) — see Custom Components.
All <video> use autoplay muted loop playsinline; images object-cover w/ stated object-position.
```

---

## 陷阱清单

- **截图默认是「生成简报」不是裁文件**——保持 prompt 单文件可移植。
- **URL 默认是稳定原站资源优先**——可抓取的真实图片/视频/字体/SVG/Lottie 应写入 prompt，不能抓取再生成简报。
- **image-gen-capable 路径默认不附 stock 兜底**——兜底 URL 是 fetch-only 兼容层，不是主路径；如果当前环境没有生图权限，再切到 fetch-only 或记录素材缺口。
- **生成简报必写「色调对齐本页色板」+「no text/no watermark/no logo」**，否则生成图配色乱、又冒文字，复刻垮。
- **`source.unsplash.com` 死了**（2024-06 关停）——首要避雷。
- **`api.unsplash.com` 返回 JSON 不是图**，不能直接 `<img src>`；从 `urls.*` 取 `images.unsplash.com` 直链。
- **Picsum 无主题定向**；要稳定必须带 `/seed/`。
- **Pexels/创作者可删片**，硬编 id 可能 404；背景用 hd 别用 4K。
- **Mixkit 禁止热链**（许可+403），只能下载自托管。
- **Coverr 链 JWT 签到你的 key**，要 `urls=true` 且 ping `mp4_download` 一次。
- **Cloudinary /demo、Google 桶是 demo 设施**，原型/复刻可用，真生产应自托管。
- **背景视频必须 `muted` 才能 autoplay**，iOS 必须 `playsinline`；源要支持 Range/CORS。
- **"免费"≠ CC0**（Google 桶背后 Blender 影片是 CC-BY 例外）：单张做内部 demo 背景通常够用；公开发布前核对许可、署名和自托管要求，别再分发整库、别暗示背书。
