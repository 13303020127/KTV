#!/bin/bash

# KatelyaTV GitHub 初始化脚本
# 这个脚本帮助你初始化Git仓库并推送到GitHub

echo "========================================"
echo "KatelyaTV GitHub 初始化脚本"
echo "========================================"

# 检查Git是否安装
if ! command -v git &> /dev/null; then
    echo "错误: Git 未安装，请先安装Git"
    exit 1
fi

# 初始化Git仓库
echo "初始化Git仓库..."
git init
git add .
git commit -m "Initial commit"

# 提示用户输入GitHub仓库URL
echo ""
echo "请确保你已经在GitHub上创建了一个空仓库"
echo "格式: https://github.com/你的用户名/你的仓库名.git"
read -p "请输入你的GitHub仓库URL: " github_url

# 添加远程仓库并推送到GitHub
echo "添加远程仓库..."
git remote add origin "$github_url"

echo "推送到GitHub..."
git push -u origin master

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "成功! 项目已上传到GitHub"
    echo "接下来你可以按照 CLOUDFLARE_DEPLOYMENT_GUIDE.md 进行部署"
    echo "========================================"
else
    echo ""
    echo "错误: 推送失败，请检查你的GitHub URL和网络连接"
    exit 1
fi