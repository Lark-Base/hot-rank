#!/usr/bin/env python3
"""
GitHub Actions API触发脚本
用于触发Amazon爬虫工作流
"""

import requests
import json
import sys
import os
from datetime import datetime

def trigger_crawler_workflow(repo_owner, repo_name, token, url, issue_number=None):
    """
    触发GitHub Actions爬虫工作流
    
    Args:
        repo_owner: GitHub仓库所有者
        repo_name: GitHub仓库名称
        token: GitHub Personal Access Token
        url: 要爬取的Amazon URL
        issue_number: 可选，Issue编号用于回复评论
    """
    
    # GitHub API端点
    api_url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/dispatches"
    
    # 请求头
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
    }
    
    # 请求体
    payload = {
        "event_type": "crawl-request",
        "client_payload": {
            "url": url,
            "timestamp": datetime.now().isoformat(),
            "triggered_by": "api"
        }
    }
    
    # 如果提供了Issue编号，添加到payload中
    if issue_number:
        payload["client_payload"]["issue_number"] = issue_number
    
    try:
        # 发送请求
        response = requests.post(api_url, headers=headers, json=payload)
        
        if response.status_code == 204:
            print(f"✅ 成功触发爬虫工作流")
            print(f"📊 URL: {url}")
            print(f"🔗 查看工作流: https://github.com/{repo_owner}/{repo_name}/actions")
            return True
        else:
            print(f"❌ 触发失败: {response.status_code}")
            print(f"错误信息: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ 请求异常: {str(e)}")
        return False

def main():
    """
    主函数
    """
    if len(sys.argv) < 5:
        print("使用方法:")
        print("python trigger_crawler.py <repo_owner> <repo_name> <github_token> <amazon_url> [issue_number]")
        print("")
        print("示例:")
        print("python trigger_crawler.py username myrepo ghp_xxxx 'https://www.amazon.sg/gp/bestsellers/...'")
        print("python trigger_crawler.py username myrepo ghp_xxxx 'https://www.amazon.sg/gp/bestsellers/...' 123")
        sys.exit(1)
    
    repo_owner = sys.argv[1]
    repo_name = sys.argv[2]
    token = sys.argv[3]
    url = sys.argv[4]
    issue_number = int(sys.argv[5]) if len(sys.argv) > 5 else None
    
    # 验证URL
    if not url.startswith('https://www.amazon.'):
        print("❌ 请提供有效的Amazon URL")
        sys.exit(1)
    
    # 触发工作流
    success = trigger_crawler_workflow(repo_owner, repo_name, token, url, issue_number)
    
    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main()