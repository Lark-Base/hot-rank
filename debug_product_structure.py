#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
from bs4 import BeautifulSoup
import time
import random

def debug_product_structure():
    url = "https://www.amazon.sg/gp/bestsellers/fashion/6833566051"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    }
    
    try:
        print(f"正在访问: {url}")
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # 查找产品容器
        product_container = soup.find('ol', class_='a-ordered-list a-vertical p13n-gridRow _cDEzb_grid-row_3Cywl')
        if not product_container:
            product_container = soup.find('ol', class_=lambda x: x and 'p13n-gridRow' in x and '_cDEzb_grid-row_3Cywl' in x)
            if not product_container:
                product_container = soup.find('ol', class_=lambda x: x and 'a-ordered-list' in x and 'a-vertical' in x)
        
        if not product_container:
            print("未找到产品容器")
            return
        
        print(f"找到产品容器: {product_container.name} with classes: {product_container.get('class')}")
        
        # 查找产品项
        product_items = product_container.find_all('li', class_='zg-no-numbers')
        if not product_items:
            product_items = product_container.find_all('li', class_=lambda x: x and 'zg-no-numbers' in x)
            if not product_items:
                product_items = product_container.find_all('li')
        
        print(f"找到 {len(product_items)} 个产品项")
        
        # 分析前3个产品项的结构
        for i, item in enumerate(product_items[:3]):
            print(f"\n=== 产品 #{i+1} 结构分析 ===")
            print(f"Li classes: {item.get('class')}")
            
            # 查找产品链接
            links = item.find_all('a', href=lambda x: x and '/dp/' in x)
            print(f"找到 {len(links)} 个产品链接")
            
            if links:
                main_link = links[0]
                print(f"主链接: {main_link.get('href')[:100]}...")
                
                # 分析链接内的文本内容
                link_text = main_link.get_text(strip=True)
                if link_text:
                    print(f"链接文本: {link_text[:100]}...")
                
                # 查找图片
                img = main_link.find('img')
                if img:
                    print(f"图片alt: {img.get('alt', 'N/A')[:100]}...")
                    print(f"图片src: {img.get('src', 'N/A')[:100]}...")
            
            # 查找价格相关元素
            price_selectors = [
                '.a-price .a-offscreen',
                '.a-price-whole',
                '.a-price-fraction',
                '.p13n-sc-price',
                '[data-a-price]',
                '.a-price',
                'span[class*="price"]'
            ]
            
            print("\n价格元素搜索:")
            for selector in price_selectors:
                elements = item.select(selector)
                if elements:
                    for elem in elements[:2]:  # 只显示前2个
                        print(f"  {selector}: {elem.get_text(strip=True)}")
            
            # 查找评分相关元素
            rating_selectors = [
                '.a-icon-alt',
                '[data-hook="review-star-rating"]',
                '.a-star-mini',
                'span[class*="star"]',
                'i[class*="star"]'
            ]
            
            print("\n评分元素搜索:")
            for selector in rating_selectors:
                elements = item.select(selector)
                if elements:
                    for elem in elements[:2]:  # 只显示前2个
                        text = elem.get_text(strip=True) or elem.get('alt', '') or elem.get('title', '')
                        if text:
                            print(f"  {selector}: {text}")
            
            # 查找评论数相关元素
            review_selectors = [
                '.a-size-small .a-link-normal',
                '[data-hook="total-review-count"]',
                'a[href*="#customerReviews"]',
                'span[class*="review"]'
            ]
            
            print("\n评论数元素搜索:")
            for selector in review_selectors:
                elements = item.select(selector)
                if elements:
                    for elem in elements[:2]:  # 只显示前2个
                        text = elem.get_text(strip=True)
                        if text and any(char.isdigit() for char in text):
                            print(f"  {selector}: {text}")
            
            # 显示完整的HTML结构（简化版）
            print("\n简化HTML结构:")
            print(str(item)[:500] + "..." if len(str(item)) > 500 else str(item))
            
            print("\n" + "="*50)
    
    except Exception as e:
        print(f"调试过程中出错: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_product_structure()