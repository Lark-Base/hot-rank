import requests
from bs4 import BeautifulSoup
import time
import random
import sys
import json
from urllib.parse import urljoin, urlparse

# 请求头
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
}

def get_page(url):
    """获取网页内容"""
    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"请求失败: {e}")
        return None

def parse_bestsellers_page(html):
    """解析亚马逊畅销榜页面"""
    soup = BeautifulSoup(html, 'html.parser')
    
    # 查找产品列表容器 - 使用用户提供的正确结构
    product_container = soup.find('ol', class_='a-ordered-list a-vertical p13n-gridRow _cDEzb_grid-row_3Cywl')
    if not product_container:
        # 尝试其他可能的容器选择器
        product_container = soup.find('ol', class_=lambda x: x and 'p13n-gridRow' in x and '_cDEzb_grid-row_3Cywl' in x)
        if not product_container:
            product_container = soup.find('ol', class_=lambda x: x and 'a-ordered-list' in x and 'a-vertical' in x)
    
    if not product_container:
        print("未找到产品列表容器")
        return []
    
    # 查找所有产品项 - 使用正确的li选择器
    items = product_container.find_all('li', class_='zg-no-numbers')
    if not items:
        # 尝试其他可能的li选择器
        items = product_container.find_all('li', class_=lambda x: x and 'zg-no-numbers' in x)
        if not items:
            items = product_container.find_all('li')
    
    print(f"找到 {len(items)} 个产品项")
    
    results = []
    for idx, item in enumerate(items, 1):
        try:
            # 获取产品名称 - 使用精确的选择器
            name_elem = item.find(class_='_cDEzb_p13n-sc-css-line-clamp-3_g3dy1')
            if name_elem:
                name = name_elem.get_text(strip=True)
            else:
                # 备用方案：从图片alt属性获取
                img_tag = item.find('img')
                name = img_tag.get('alt', 'N/A') if img_tag else 'N/A'
            
            # 获取产品链接
            link_elem = item.find('a', href=lambda x: x and '/dp/' in x)
            if not link_elem:
                link_elem = item.find('a', class_='a-link-normal')
            link = link_elem['href'] if link_elem else ''
            full_link = f'https://www.amazon.sg{link}' if link else 'N/A'
            
            # 获取价格 - 使用精确的选择器
            price_elem = item.find(class_='_cDEzb_p13n-sc-price_3mJ9Z')
            if price_elem:
                price = price_elem.get_text(strip=True)
            else:
                # 备用方案
                price_span = item.find('span', class_='p13n-sc-price')
                if not price_span:
                    price_span = item.find('span', class_='a-price-whole')
                if not price_span:
                    price_span = item.find('span', class_='a-offscreen')
                price = price_span.get_text(strip=True) if price_span else 'N/A'
            
            # 获取评分和评论数 - 从a-icon-row div中提取
            rating = "N/A"
            reviews = "N/A"
            
            # 查找包含评分信息的a-icon-row div
            icon_row = item.find('div', class_='a-icon-row')
            if icon_row:
                # 从链接的aria-label属性获取评分
                rating_link = icon_row.find('a', {'aria-label': True})
                if rating_link:
                    aria_label = rating_link.get('aria-label', '')
                    if 'out of 5 stars' in aria_label:
                        rating = aria_label
                        
                        # 从同一个aria-label中提取评论数
                        import re
                        review_match = re.search(r'([\d,]+)\s+ratings?', aria_label)
                        if review_match:
                            reviews = review_match.group(1).replace(',', '')
                
                # 备用方案：从span中获取评论数
                if reviews == "N/A":
                    review_span = icon_row.find('span', class_='a-size-small')
                    if review_span:
                        review_text = review_span.get_text(strip=True)
                        import re
                        review_numbers = re.findall(r'[\d,]+', review_text)
                        if review_numbers:
                            reviews = review_numbers[0].replace(',', '')
            
            # 如果没有找到a-icon-row，使用原有的备用方案
            if rating == "N/A":
                rating_element = item.find('i', class_='a-icon-star-small')
                if rating_element:
                    rating_text = rating_element.find('span', class_='a-icon-alt')
                    if rating_text:
                        rating = rating_text.get_text(strip=True)
            
            if reviews == "N/A":
                reviews_span = item.find('span', class_='a-size-small')
                if reviews_span and reviews_span.get_text(strip=True).replace(',', '').isdigit():
                    reviews = reviews_span.get_text(strip=True)
                else:
                    review_link = item.find('a', class_='a-size-small a-link-normal')
                    reviews = review_link.get_text(strip=True) if review_link else 'N/A'
            
            # 获取图片链接
            img_tag = item.find('img')
            if img_tag:
                # 优先从src属性获取图片URL
                image_url = img_tag.get('src', 'N/A')
            else:
                # 如果没有找到img标签，尝试查找带有特定class的img标签
                img_tag = item.find('img', class_='a-dynamic-image')
                image_url = img_tag.get('src', 'N/A') if img_tag else 'N/A'
            
            # 获取排名（从父容器中提取）
            rank_elem = item.find_parent().find('span', class_='zg-badge-text')
            rank = rank_elem.get_text(strip=True) if rank_elem else f'#{idx}'
            
            product_data = {
                'rank': rank,
                'name': name,
                'price': price,
                'rating': rating,
                'reviews': reviews,
                'link': full_link,
                'image_url': image_url
            }
            
            results.append(product_data)
            print(f"成功解析产品 #{idx}: {name[:50]}...")
            
        except Exception as e:
            print(f"解析产品 #{idx} 失败: {e}")
            continue
    
    return results



def main(url=None):
    """主函数，返回爬取的产品数据"""
    # 如果没有提供URL，从命令行参数获取
    if url is None:
        if len(sys.argv) < 2:
            return {
                "error": "请提供Amazon畅销榜URL作为参数",
                "usage": "python amazon_bestsellers_crawler.py <amazon_url>",
                "data": [],
                "count": 0
            }
        url = sys.argv[1]
    
    # 验证URL
    if not url.startswith('https://www.amazon.'):
        return {
            "error": "请提供有效的Amazon URL",
            "data": [],
            "count": 0
        }
    
    # 获取页面内容
    html = get_page(url)
    if not html:
        return {
            "error": "无法获取页面内容，请检查URL是否正确",
            "data": [],
            "count": 0
        }
    
    # 解析页面
    products = parse_bestsellers_page(html)
    
    # 返回结果
    return {
        "success": True,
        "url": url,
        "data": products,
        "count": len(products)
    }

if __name__ == '__main__':
    result = main()
    # 输出JSON格式结果，便于GitHub Actions处理
    print(json.dumps(result, ensure_ascii=False, indent=2))