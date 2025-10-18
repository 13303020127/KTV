#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('开始Cloudflare Pages构建流程...');

// 确保日志目录存在
const logDir = path.join(__dirname, '../logs');
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (error) {
  console.error('创建日志目录失败:', error.message);
}

// 执行命令并记录日志
function runCommand(command, description) {
  console.log(`\n执行: ${description} (${command})`);
  try {
    const startTime = Date.now();
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    const endTime = Date.now();
    console.log(`${description} 完成! 用时: ${(endTime - startTime) / 1000}秒`);
    return { success: true, output };
  } catch (error) {
    console.error(`${description} 失败!`);
    console.error('错误输出:', error.stderr || error.stdout || error.message);
    return { success: false, error: error.message, output: error.stdout };
  }
}

// 清理旧的构建目录
try {
  const nextDir = path.join(__dirname, '../.next');
  if (fs.existsSync(nextDir)) {
    console.log('清理旧的构建目录...');
    fs.rmSync(nextDir, { recursive: true, force: true });
  }
} catch (error) {
  console.error('清理旧构建目录失败:', error.message);
}

// 执行npm install
const installResult = runCommand('npm install --legacy-peer-deps', '安装依赖');
if (!installResult.success) {
  console.error('依赖安装失败，尝试使用 --force 选项...');
  const forceInstallResult = runCommand('npm install --force', '强制安装依赖');
  if (!forceInstallResult.success) {
    console.error('强制安装也失败，使用 --no-package-lock 选项...');
    const noLockInstallResult = runCommand('npm install --no-package-lock', '无锁安装依赖');
    if (!noLockInstallResult.success) {
      console.error('所有安装尝试都失败，退出构建过程');
      process.exit(1);
    }
  }
}

// 执行预构建脚本
runCommand('npm run gen:runtime', '生成运行时配置');
runCommand('npm run gen:manifest', '生成清单文件');

// 执行构建
const buildResult = runCommand('npm run build', '构建应用');

if (buildResult.success) {
  // 清理大型缓存文件，避免超过Cloudflare Pages 25MB限制
  try {
    console.log('\n开始清理大型缓存文件...');
    const cacheDir = path.join(__dirname, '../.next/cache');
    if (fs.existsSync(cacheDir)) {
      console.log(`正在删除缓存目录: ${cacheDir}`);
      fs.rmSync(cacheDir, { recursive: true, force: true });
      console.log('大型缓存文件已清理完成');
    }
  } catch (error) {
    console.error('清理缓存文件时出错:', error.message);
    // 即使清理失败，构建也是成功的，继续执行
  }
  
  console.log('\n✅ Cloudflare Pages构建成功完成!');
  process.exit(0);
} else {
  console.error('\n❌ Cloudflare Pages构建失败!');
  process.exit(1);
}