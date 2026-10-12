# Unsplash Inspiration

一个以图片探索为主题的桌面端单页网站，当前版本为 v31。

包含曲面环绕图片、水波纹交互、鼠标图片拖尾、五张精选素材的类型与风格筛选、3D 倾斜、滚动翻转与景深画面，以及图片预览、收藏和下载。

## 本地预览

无需安装依赖或构建。在项目目录运行：

```sh
python3 -m http.server 4173 --directory design-v1
```

打开 http://localhost:4173/ 。主入口为 `design-v1/index.html`；历史设计版本保留在同目录。

## GitHub Pages

当前使用仓库 **Settings → Pages → Build and deployment → Deploy from a branch**，来源为 **main / (root)**。更新 `main` 后自动发布；根入口会跳转到 `design-v1/`。

在线访问：https://a357960406-tech.github.io/

`.github/workflows/pages.yml` 保留为手动发布备用，不再与分支自动发布同时触发；手动流程上传同一根目录，保持入口与资源路径一致。

## Skill 介绍页

[落地页设计与迭代 · 功能与使用说明](https://a357960406-tech.github.io/skills/landing-page-iteration/)：介绍功能、项目级安装方法、调用示例，并提供 Skill ZIP 下载。源码位于 `skills/landing-page-iteration/`。

## 项目级 Skills

- [`landing-page-iteration`](.agents/skills/landing-page-iteration/SKILL.md)：本项目制作过程的复盘，覆盖需求、参考分析、预览迭代、动效调试与发布验证。调用：`$landing-page-iteration`。
- [`web-clone-prompt`](.agents/skills/web-clone-prompt/SKILL.md)：根据截图或 URL 生成网页复刻提示词。调用：`$web-clone-prompt`。

`web-clone-prompt` 来自 [xiaopu-ai/web-clone-prompt](https://github.com/xiaopu-ai/web-clone-prompt)，安装版本为 `e943ee25da8d503354619098d4e8c66c8721913b`，保留上游 MIT 许可证。两个 Skill 安装在本项目 `.agents/skills/` 中。

## 素材与许可

代码采用 [MIT License](LICENSE)。摄影、字体及其他第三方素材按其各自许可使用，来源记录见 [素材说明](design-v1/assets/v31-credits.md)。MIT 许可不覆盖第三方图片或商标。
