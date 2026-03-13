import { defineConfig } from 'vite';

// 构建后去掉 crossorigin 属性，避免微信浏览器 CORS 问题
function removeCrossOrigin() {
  return {
    name: 'remove-crossorigin',
    enforce: 'post',
    transformIndexHtml(html) {
      return html.replace(/ crossorigin/g, '');
    },
  };
}

export default defineConfig({
  plugins: [removeCrossOrigin()],
  build: {
    modulePreload: { polyfill: false },
  },
});
