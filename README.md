# Amazon畅销榜爬虫 - GitHub Actions API服务

这是一个基于GitHub Actions的Amazon畅销榜爬虫API服务，支持通过API调用来爬取任意Amazon畅销榜页面的产品信息。

## 🚀 功能特性

- 🕷️ 支持爬取任意Amazon站点的畅销榜页面
- 🔄 通过GitHub Actions API触发爬虫任务
- 📊 返回结构化的产品数据（排名、名称、价格、评分、评论数等）
- 💬 支持在GitHub Issue中自动回复爬取结果
- 📁 自动保存爬取结果为工件文件
- 🛡️ 内置错误处理和输入验证

## 📋 部署步骤

### 1. Fork或克隆仓库

```bash
git clone <your-repo-url>
cd <your-repo-name>
```

### 2. 推送到GitHub

确保将代码推送到GitHub仓库，GitHub Actions工作流会自动激活。

### 3. 获取GitHub Personal Access Token

1. 访问 GitHub Settings > Developer settings > Personal access tokens
2. 创建新的token，需要以下权限：
   - `repo` (完整仓库访问权限)
   - `workflow` (工作流权限)

## 🔧 使用方法

### 方法1：使用提供的Python脚本

```bash
# 安装依赖
pip install requests

# 触发爬虫（基本用法）
python trigger_crawler.py <repo_owner> <repo_name> <github_token> <amazon_url>

# 触发爬虫并在指定Issue中回复结果
python trigger_crawler.py <repo_owner> <repo_name> <github_token> <amazon_url> <issue_number>
```

**示例：**
```bash
# 爬取Amazon新加坡鞋类畅销榜
python trigger_crawler.py username myrepo ghp_xxxxxxxxxxxx "https://www.amazon.sg/gp/bestsellers/shoes/6833566051/ref=zg_bs_nav_shoes_2_6833566051"

# 爬取并在Issue #123中回复结果
python trigger_crawler.py username myrepo ghp_xxxxxxxxxxxx "https://www.amazon.sg/gp/bestsellers/shoes/6833566051/ref=zg_bs_nav_shoes_2_6833566051" 123
```

### 方法2：直接调用GitHub API

```bash
curl -X POST \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "crawl-request",
    "client_payload": {
      "url": "https://www.amazon.sg/gp/bestsellers/shoes/6833566051/ref=zg_bs_nav_shoes_2_6833566051",
      "issue_number": 123
    }
  }' \
  https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO/dispatches
```

### 方法3：手动触发工作流

1. 访问仓库的 Actions 页面
2. 选择 "Amazon Crawler API" 工作流
3. 点击 "Run workflow"
4. 输入要爬取的Amazon URL
5. 点击 "Run workflow" 按钮

## 📊 返回数据格式

成功爬取后，会返回以下格式的JSON数据：

```json
{
  "success": true,
  "url": "https://www.amazon.sg/gp/bestsellers/...",
  "count": 30,
  "data": [
    {
      "rank": "1",
      "name": "产品名称",
      "price": "S$99.99",
      "rating": "4.5 out of 5 stars",
      "reviews": "1,234 ratings",
      "link": "https://www.amazon.sg/dp/...",
      "image_url": "https://images-na.ssl-images-amazon.com/..."
    }
  ]
}
```

## 🔍 支持的Amazon站点

理论上支持所有Amazon站点的畅销榜页面，包括但不限于：

- 🇸🇬 Amazon Singapore (amazon.sg)
- 🇺🇸 Amazon US (amazon.com)
- 🇬🇧 Amazon UK (amazon.co.uk)
- 🇩🇪 Amazon Germany (amazon.de)
- 🇯🇵 Amazon Japan (amazon.co.jp)
- 🇨🇦 Amazon Canada (amazon.ca)
- 🇦🇺 Amazon Australia (amazon.com.au)

## 📝 工作流程

1. **API触发**：通过GitHub repository_dispatch事件触发工作流
2. **环境准备**：设置Python环境并安装依赖
3. **执行爬虫**：运行爬虫脚本并传入URL参数
4. **结果处理**：解析爬取结果并格式化输出
5. **结果反馈**：
   - 在指定Issue中创建评论（如果提供了issue_number）
   - 上传结果文件作为工件
   - 在Actions日志中显示详细信息

## ⚠️ 注意事项

1. **频率限制**：请合理使用，避免过于频繁的请求
2. **URL格式**：确保提供的是有效的Amazon畅销榜URL
3. **Token安全**：妥善保管GitHub Personal Access Token
4. **网络环境**：GitHub Actions运行在海外服务器，访问某些地区的Amazon可能受限

## 🛠️ 本地测试

你也可以在本地直接运行爬虫脚本：

```bash
# 安装依赖
pip install -r requirements.txt

# 运行爬虫
python amazon_bestsellers_crawler.py "https://www.amazon.sg/gp/bestsellers/shoes/6833566051/ref=zg_bs_nav_shoes_2_6833566051"
```

## 📄 许可证

本项目仅供学习和研究使用，请遵守相关网站的robots.txt和使用条款。

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！
