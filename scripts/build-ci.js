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

// 清理旧的构建目录和缓存
try {
  console.log('开始清理构建环境...');
  
  // 先单独清理缓存目录（如果存在）
  const cacheDir = path.join(__dirname, '../.next/cache');
  if (fs.existsSync(cacheDir)) {
    console.log(`预清理缓存目录: ${cacheDir}`);
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
  
  // 然后清理整个构建目录
  const nextDir = path.join(__dirname, '../.next');
  if (fs.existsSync(nextDir)) {
    console.log(`清理构建目录: ${nextDir}`);
    fs.rmSync(nextDir, { recursive: true, force: true });
  }
  
  console.log('构建环境清理完成');
} catch (error) {
  console.error('清理构建环境失败:', error.message);
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
  // 构建后再次清理大型缓存文件，避免超过Cloudflare Pages 25MB限制
  try {
    console.log('\n开始深度清理大型缓存文件...');
    
    // 检查并清理.next/cache目录
    const cacheDir = path.join(__dirname, '../.next/cache');
    if (fs.existsSync(cacheDir)) {
      console.log(`正在删除缓存目录: ${cacheDir}`);
      fs.rmSync(cacheDir, { recursive: true, force: true });
      console.log(`缓存目录 ${cacheDir} 已删除`);
    } else {
      console.log(`缓存目录 ${cacheDir} 不存在`);
    }
    
    // 再次检查是否还有webpack缓存文件
    const webpackCacheDir = path.join(__dirname, '../.next/cache/webpack');
    if (fs.existsSync(webpackCacheDir)) {
      console.log(`发现残留的webpack缓存目录: ${webpackCacheDir}`);
      fs.rmSync(webpackCacheDir, { recursive: true, force: true });
      console.log('残留的webpack缓存已删除');
    }
    
    // 确认清理后的文件状态
    console.log('验证清理结果...');
    if (fs.existsSync(cacheDir)) {
      // 如果缓存目录仍然存在，尝试列出其中的文件
      try {
        const files = fs.readdirSync(cacheDir, { recursive: true });
        console.log(`缓存目录中仍有 ${files.length} 个文件`);
        // 尝试再次删除
        fs.rmSync(cacheDir, { recursive: true, force: true });
      } catch (e) {
        console.error('无法读取缓存目录内容:', e.message);
      }
    } else {
      console.log('缓存目录已完全清理');
    }
    
    console.log('大型缓存文件深度清理完成');
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