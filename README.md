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

在仓库 **Settings → Pages → Build and deployment** 中选择 **GitHub Actions**。推送到 `main` 后，`.github/workflows/pages.yml` 会自动发布 `design-v1` 目录。所有资源使用相对路径，支持 GitHub Pages 项目网址。

## 素材与许可

代码采用 [MIT License](LICENSE)。摄影、字体及其他第三方素材按其各自许可使用，来源记录见 [素材说明](design-v1/assets/v31-credits.md)。MIT 许可不覆盖第三方图片或商标。
