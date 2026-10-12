# Landing Page Iteration · 落地页设计与迭代

一个从真实落地页制作过程提炼的 Codex Skill，帮助你对齐需求、分析参考、制作可预览页面、持续迭代、调试动效，并在明确授权后发布到 GitHub Pages。

**[功能与使用说明](https://a357960406-tech.github.io/skills/landing-page-iteration/) · [Skill 源文件](.agents/skills/landing-page-iteration/) · [下载 Skill ZIP](https://a357960406-tech.github.io/skills/landing-page-iteration/assets/landing-page-iteration.zip) · [实际项目示例](https://a357960406-tech.github.io/design-v1/)**

## 能做什么

- 对齐产品、目标设备、参考页面和本轮修改范围，保留已经确认的设计要求。
- 将参考站的布局、滚动和悬停效果转化为符合产品的可运行页面。
- 检查高清素材、主体裁切、卡片倾斜、滚动翻转、视差和交互层级。
- 按反馈局部修改，并在浏览器里验证受影响的布局与功能。
- 在明确要求后提交代码、同步 GitHub、发布 Pages，并检查正式网址。

它提供制作与验收的方法，没有固定视觉模板，也不强制使用某种前端框架。

## 项目级安装

在目标项目的 Codex 对话中粘贴：

```text
请将这个 Skill 安装到当前项目的 .agents/skills/landing-page-iteration/：
https://github.com/a357960406-tech/a357960406-tech.github.io/tree/main/.agents/skills/landing-page-iteration
读取 SKILL.md，保留 agents/ 和 references/，安装完成后告诉我触发方式。
```

也可以下载上面的 ZIP，将其中的 `landing-page-iteration` 文件夹放进项目的 `.agents/skills/`，保留全部文件。

## 怎么使用

在能读取项目 Skill 的 Codex 对话里，用 `$landing-page-iteration` 加具体任务调用。例如：

```text
$landing-page-iteration
基于当前最新版本，把作品卡片的间距缩小一点。
保留现有图片、颜色和交互，其他区块保持不变。
检查实际间距与相邻区块，完成后给我可预览页面。
```

新建页面时附上产品说明和参考网址；修复交互时描述问题发生的位置和操作；需要 GitHub 上传或公开发布时，在任务里明确说明。更多场景见[介绍页](https://a357960406-tech.github.io/skills/landing-page-iteration/#examples)。

## 文件位置

```text
.agents/skills/landing-page-iteration/  Skill 指令、界面信息与参考资料
skills/landing-page-iteration/         介绍页和可下载 Skill 包
design-v1/                            实际制作案例与历史版本
```

## 实际制作案例

仓库保留 Unsplash Inspiration v31：一个以图片探索为主题的桌面端单页网站。包含曲面环绕图片、水波纹、鼠标图片拖尾、五张素材的类型与风格筛选、3D 倾斜、滚动翻转与景深，以及预览、收藏和下载。

无需安装依赖或构建，在项目目录运行：

```sh
python3 -m http.server 4173
```

Skill 介绍页：http://localhost:4173/skills/landing-page-iteration/ 。图片案例：http://localhost:4173/design-v1/ 。

## GitHub Pages

来源为 **main / (root)**，使用 **Deploy from a branch**。更新 `main` 后自动发布；现有根入口仍跳转到 `design-v1/`，Skill 介绍页有独立地址。

`.github/workflows/pages.yml` 仅保留手动发布备用，上传同一根目录。仓库右侧 About 的描述、Website 和 Topics 需独立配置，不会由 README 或 Pages 部署自动填写。

## 项目级 Skills

- [`landing-page-iteration`](.agents/skills/landing-page-iteration/SKILL.md)：本项目制作过程的复盘，覆盖需求、参考分析、预览迭代、动效调试与发布验证。调用：`$landing-page-iteration`。
- [`web-clone-prompt`](.agents/skills/web-clone-prompt/SKILL.md)：根据截图或 URL 生成网页复刻提示词。调用：`$web-clone-prompt`。

`web-clone-prompt` 来自 [xiaopu-ai/web-clone-prompt](https://github.com/xiaopu-ai/web-clone-prompt)，安装版本为 `e943ee25da8d503354619098d4e8c66c8721913b`，保留上游 MIT 许可证。两个 Skill 安装在本项目 `.agents/skills/` 中。

## 素材与许可

代码采用 [MIT License](LICENSE)。摄影、字体及其他第三方素材按其各自许可使用，来源记录见 [素材说明](design-v1/assets/v31-credits.md)。MIT 许可不覆盖第三方图片或商标。
