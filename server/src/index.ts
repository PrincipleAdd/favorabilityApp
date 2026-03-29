/**
 * 好感度管理系统 - 后台服务入口
 * 初始化数据库并启动 Express 服务器
 */
import app from './app.js';
import { initDatabase } from './database.js';

const PORT = Number(process.env.PORT) || 3000;

async function main() {
  await initDatabase('./data/affinity.db');
  app.listen(PORT, () => {
    console.log(`好感度管理系统后台服务已启动，端口：${PORT}`);
  });
}

main().catch((err) => {
  console.error('服务启动失败：', err);
  process.exit(1);
});
