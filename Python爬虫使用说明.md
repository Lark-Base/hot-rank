# 亚马逊新加坡产品数据抓取工具使用说明

## 概述

本工具是一个专门用于抓取亚马逊新加坡站点产品数据的Python脚本，特别针对畅销商品页面进行优化。支持多种产品类别的数据抓取，包括时尚、电子产品、家居用品等。基于对亚马逊新加坡站点畅销榜页面结构的深度分析开发，能够适应网站结构的动态变化。

## 功能特点

### 🎯 数据抓取能力
- **产品排名**: 畅销榜排名位置
- **产品标题**: 完整的产品名称
- **价格信息**: 新加坡元(S$)价格
- **评分数据**: 用户评分(1-5星)
- **评论数量**: 用户评论总数
- **产品图片**: 高质量产品图片URL
- **产品链接**: 完整的产品详情页链接
- **品牌信息**: 自动提取的品牌名称
- **分类信息**: 产品所属类别

### 🛡️ 反检测机制
- **随机延迟**: 请求间隔随机化，避免被识别为机器人
- **真实浏览器头**: 模拟真实浏览器的User-Agent和请求头
- **会话保持**: 使用Session维持连接状态
- **重试机制**: 自动重试失败的请求
- **验证码检测**: 自动识别并处理验证码页面

### 📊 数据输出格式
- **CSV格式**: 便于Excel打开和数据分析
- **JSON格式**: 便于程序处理和API集成
- **UTF-8编码**: 完美支持中文和特殊字符

## 安装和环境配置

### 1. Python环境要求
```bash
# 确保Python版本 >= 3.7
python --version
```

### 2. 安装依赖包
```bash
# 使用pip安装所需依赖
pip install -r requirements.txt

# 或者手动安装
pip install requests beautifulsoup4 pandas lxml
```

### 3. 依赖包说明
- **requests**: HTTP请求库，用于网页抓取
- **beautifulsoup4**: HTML解析库，用于提取数据
- **pandas**: 数据处理库，用于CSV导出
- **lxml**: XML/HTML解析器，提高解析性能

## 使用方法

### 基本使用
```bash
# 直接运行脚本
python amazon_scraper.py
```

### 高级使用

#### 1. 修改目标URL
```python
# 在main()函数中修改url变量
url = "https://www.amazon.sg/gp/bestsellers/你的目标分类/"
```

#### 2. 自定义输出文件名
```python
# 修改保存文件名
scraper.save_to_csv(products, 'my_products.csv')
scraper.save_to_json(products, 'my_products.json')
```

#### 3. 调整抓取参数
```python
# 修改请求延迟时间
time.sleep(random.uniform(2, 5))  # 增加延迟时间

# 修改重试次数
soup = self.get_page(url, max_retries=5)
```

## 输出数据格式

### CSV文件示例
```csv
rank,title,price,rating,review_count,image_url,product_url,brand,category
1,"rosyclo Cloud Slippers for Women and Men, Pillow House Slippers Shower Shoes Indoor Slides Bathroom Sandals, Ultimate Comfort, Lightweight, Thick Sole, Non-Slip, Easy to Clean","S$42.14","4.2","20118","https://images-fe.ssl-images-amazon.com/images/I/710IlAOol2S._AC_UL300_SR300,200_.jpg","https://www.amazon.sg/rosyclo-Slippers-Bathroom-Ultimate-Lightweight/dp/B0BHL28RVT","rosyclo","Women's Slippers"
2,"Nike Air Max Verona Women's Running Shoes","S$423.27","4.2","156","https://...","https://...","Nike","Women's Sports and Outdoor Shoes"
```

### JSON文件示例
```json
[
  {
    "rank": "1",
    "title": "rosyclo Cloud Slippers for Women and Men, Pillow House Slippers Shower Shoes Indoor Slides Bathroom Sandals, Ultimate Comfort, Lightweight, Thick Sole, Non-Slip, Easy to Clean",
    "price": "S$42.14",
    "rating": "4.2",
    "review_count": "20118",
    "image_url": "https://images-fe.ssl-images-amazon.com/images/I/710IlAOol2S._AC_UL300_SR300,200_.jpg",
    "product_url": "https://www.amazon.sg/rosyclo-Slippers-Bathroom-Ultimate-Lightweight/dp/B0BHL28RVT",
    "brand": "rosyclo",
    "category": "Women's Slippers"
  }
]
```

## 技术实现细节

### 网站结构分析

基于对目标网站的分析，该脚本针对以下HTML结构进行了优化：

1. **产品容器选择器**:
   - `li.zg-no-numbers` - 主要的畅销商品容器
   - `.zg-item-immersion` - 备用选择器
   - `.s-result-item` - 搜索结果项
   - `[data-component-type="s-search-result"]` - 组件类型标识

2. **数据提取选择器**:
   - 排名: `.zg-bdg-text`
   - 标题: `._cDEzb_p13n-sc-css-line-clamp-3_g3dy1`, `img[alt]`
   - 价格: `._cDEzb_p13n-sc-price_3mJ9Z`, `.a-price-whole`
   - 评分: `.a-icon-alt`
   - 图片: `img.a-dynamic-image`, `img[src]`, `img[data-src]`
   - 链接: `a.a-link-normal[href]`

### 错误处理机制

```python
# 网络请求错误处理
try:
    response = self.session.get(url, timeout=30)
    response.raise_for_status()
except requests.RequestException as e:
    print(f"请求失败: {e}")
    
# 数据解析错误处理
try:
    product_info = self.extract_product_info(element)
except Exception as e:
    print(f"解析产品信息时出错: {e}")
```

## 常见问题和解决方案

### 1. 访问被拒绝 (403/429错误)
**原因**: 请求频率过高或被识别为机器人

**解决方案**:
- 增加请求间隔时间
- 更换User-Agent
- 使用代理服务器
- 减少并发请求

### 2. 验证码页面
**现象**: 页面返回验证码或"证明你不是机器人"

**解决方案**:
- 脚本会自动检测并重试
- 手动在浏览器中访问一次网站
- 更换IP地址或使用VPN

### 3. 数据提取不完整
**原因**: 网站结构发生变化

**解决方案**:
- 检查控制台输出的调试信息
- 更新CSS选择器
- 查看网页源代码确认结构变化

### 4. 编码问题
**现象**: 中文字符显示乱码

**解决方案**:
- 确保使用UTF-8编码保存文件
- 在Excel中选择UTF-8编码打开CSV

## 法律和道德考虑

### ⚖️ 使用须知
1. **遵守robots.txt**: 尊重网站的爬虫协议
2. **合理使用频率**: 避免对服务器造成过大负担
3. **数据使用规范**: 仅用于个人学习和研究目的
4. **版权尊重**: 不得用于商业用途或侵犯版权

### 🔒 隐私保护
- 不收集用户个人信息
- 仅抓取公开的产品信息
- 不存储用户行为数据

## 扩展和定制

### 添加新的数据字段
```python
# 在extract_product_info方法中添加
product_info['new_field'] = ''

# 添加提取逻辑
new_elem = product_element.select_one('.new-selector')
if new_elem:
    product_info['new_field'] = new_elem.get_text(strip=True)
```

### 支持其他亚马逊站点
```python
# 修改base_url
self.base_url = 'https://www.amazon.com'  # 美国站
self.base_url = 'https://www.amazon.co.uk'  # 英国站
self.base_url = 'https://www.amazon.de'  # 德国站
```

### 添加数据库存储
```python
import sqlite3

def save_to_database(self, products):
    conn = sqlite3.connect('amazon_products.db')
    df = pd.DataFrame(products)
    df.to_sql('products', conn, if_exists='append', index=False)
    conn.close()
```

## 性能优化建议

1. **并发控制**: 使用线程池但限制并发数
2. **缓存机制**: 缓存已访问的页面
3. **增量更新**: 只抓取新增或变化的数据
4. **数据压缩**: 对大量数据进行压缩存储

## 技术支持

如果在使用过程中遇到问题，请检查：
1. Python和依赖包版本是否正确
2. 网络连接是否正常
3. 目标网站是否可正常访问
4. 控制台输出的错误信息

---

**免责声明**: 本工具仅供学习和研究使用，使用者需自行承担使用风险，并遵守相关法律法规和网站服务条款。