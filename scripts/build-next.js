// 直接调用Next.js构建函数，避免bin文件路径问题
const { execSync } = require('child_process');
const path = require('path');

console.log('开始构建Next.js应用...');

try {
  // 获取项目根目录
  const projectRoot = process.cwd();
  console.log(`项目根目录: ${projectRoot}`);
  
  // 尝试直接使用npx执行最新的next命令
  console.log('使用npx执行next build...');
  execSync('npx next@14.2.30 build', { 
    stdio: 'inherit',
    cwd: projectRoot
  });
  
  console.log('Next.js构建成功完成！');
} catch (error) {
  console.error('构建失败:', error.message);
  process.exit(1);
}