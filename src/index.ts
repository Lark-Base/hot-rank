import $ from 'jquery';
import { bitable } from '@lark-base-open/js-sdk';
import './index.scss';
// 导入亚马逊相关功能
import { crawlAmazonProducts, isValidAmazonUrl } from './amazon-api';
import { createAmazonProductTable, writeAmazonDataToTable } from './amazon-table-operations';

$(async function() {
  try {
    // 初始化 Lark Base SDK
    addDebugLog('正在初始化 Lark Base SDK...');
    
    // 检查是否在 Lark Base 环境中
    if (typeof bitable === 'undefined') {
      throw new Error('未检测到 Lark Base 环境');
    }
    
    addDebugLog('SDK 初始化成功', 'success');
    
    // 显示环境状态
    showEnvironmentStatus('success', '✅ Lark Base 环境正常');
    
    // 添加调试面板
    addDebugPanel();
    
    // 绑定亚马逊抓取按钮事件
    $('#startAmazonCrawl').on('click', handleAmazonCrawlClick);
    
    // 绑定回车键事件
    $('#amazonUrl').on('keypress', function(e) {
      if (e.which === 13) { // 回车键
        handleAmazonCrawlClick();
      }
    });
    
  } catch (error) {
    console.error('SDK 初始化失败:', error);
    addDebugLog(`SDK 初始化失败: ${(error as Error).message}`, 'error');
    
    // 添加调试面板以便查看错误
    addDebugPanel();
    
    // 显示详细的环境信息
    addDebugLog('当前环境检查:', 'info');
    addDebugLog(`- window.location: ${window.location.href}`, 'info');
    addDebugLog(`- bitable 对象: ${typeof bitable}`, 'info');
    addDebugLog(`- 是否在 iframe 中: ${window.self !== window.top}`, 'info');
    
    showMessage('❌ 插件需要在 Lark Base 环境中运行。当前环境可能不支持完整功能。', 'error');
    
    // 显示环境状态
    showEnvironmentStatus('warning', '⚠️ 非 Lark Base 环境，功能受限');
    
    // 仍然绑定事件，但会在执行时给出警告
    $('#startAmazonCrawl').on('click', handleAmazonCrawlClick);
    $('#amazonUrl').on('keypress', function(e) {
      if (e.which === 13) {
        handleAmazonCrawlClick();
      }
    });
  }
});

/**
 * 添加调试面板
 */
function addDebugPanel() {
  const debugHtml = `
    <div id="debugContainer" class="mt-3" style="display: none;">
      <div class="card">
        <div class="card-header">
          <h6 class="mb-0">调试信息</h6>
          <button id="clearDebug" class="btn btn-sm btn-outline-secondary">清空日志</button>
        </div>
        <div class="card-body">
          <div id="debugLog" style="max-height: 300px; overflow-y: auto; font-family: monospace; font-size: 12px; background: #f8f9fa; padding: 10px; border-radius: 4px;"></div>
        </div>
      </div>
    </div>
  `;
  
  $('.main').append(debugHtml);
  
  $('#clearDebug').on('click', () => {
    $('#debugLog').empty();
  });
}

/**
 * 添加调试日志
 */
function addDebugLog(message: string, type: 'info' | 'error' | 'success' = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const colorClass = {
    info: 'text-primary',
    error: 'text-danger', 
    success: 'text-success'
  }[type];
  
  const logEntry = `<div class="${colorClass}">[${timestamp}] ${message}</div>`;
  $('#debugLog').append(logEntry);
  $('#debugContainer').show();
  
  // 自动滚动到底部
  const debugLog = document.getElementById('debugLog');
  if (debugLog) {
    debugLog.scrollTop = debugLog.scrollHeight;
  }
  
  // 同时输出到控制台
  console.log(`[${timestamp}] ${message}`);
}

/**
 * 处理亚马逊抓取按钮点击事件
 */
async function handleAmazonCrawlClick() {
  const amazonUrl = $('#amazonUrl').val() as string;
  
  addDebugLog(`开始处理亚马逊抓取请求，输入URL: ${amazonUrl}`);
  
  // 验证输入
  if (!amazonUrl.trim()) {
    addDebugLog('输入验证失败：亚马逊URL为空', 'error');
    showMessage('请输入亚马逊产品URL', 'error');
    return;
  }
  
  if (!isValidAmazonUrl(amazonUrl)) {
    addDebugLog('输入验证失败：亚马逊URL格式不正确', 'error');
    showMessage('请输入有效的亚马逊产品URL', 'error');
    return;
  }
  
  addDebugLog('亚马逊URL验证通过，开始抓取流程', 'success');
  
  // 开始抓取流程
  await startAmazonCrawlProcess(amazonUrl);
}

/**
 * 开始亚马逊抓取流程
 */
async function startAmazonCrawlProcess(amazonUrl: string) {
  try {
    addDebugLog('设置加载状态...');
    
    // 环境检查
    if (typeof bitable === 'undefined' || !bitable.base) {
      throw new Error('当前环境不支持 Lark Base 功能。请在 Lark Base 中运行此插件。');
    }
    
    // 显示加载状态
    setLoadingState(true);
    showProgress(0, '开始抓取亚马逊产品数据...');
    
    addDebugLog('开始调用crawlAmazonProducts函数...');
    addDebugLog(`亚马逊URL: ${amazonUrl}`);
    
    // 抓取亚马逊产品数据
     const maxProducts = parseInt($('#maxProducts').val() as string) || 50;
     const crawlResult = await crawlAmazonProducts(amazonUrl, maxProducts, (progress: number, message: string) => {
       addDebugLog(`抓取进度: ${progress}% - ${message}`);
       showProgress(progress * 0.6, message); // 抓取占60%进度
     });
    
    addDebugLog(`抓取结果: success=${crawlResult.success}, message=${crawlResult.message}`);
    addDebugLog(`获取到 ${crawlResult.products.length} 个产品数据`);
    
    if (!crawlResult.success) {
      addDebugLog(`抓取失败: ${crawlResult.message}`, 'error');
      throw new Error(crawlResult.message);
    }
    
    if (crawlResult.products.length === 0) {
      addDebugLog('未获取到产品数据', 'error');
      throw new Error('未获取到产品数据，请检查URL是否正确');
    }
    
    // 打印前3个产品的详细信息用于调试
     crawlResult.products.slice(0, 3).forEach((product, index) => {
       addDebugLog(`产品${index + 1}: ID=${product.productId}, 标题=${product.title}, 价格=${product.price}`);
     });
    
    showProgress(60, '正在创建数据表...');
    addDebugLog('开始创建亚马逊产品数据表');
    
    // 创建新的数据表
     const siteName = new URL(amazonUrl).hostname.replace('www.', '');
     const table = await createAmazonProductTable(siteName);
    addDebugLog('数据表创建成功', 'success');
    
    showProgress(70, '数据表创建成功，开始写入数据...');
    addDebugLog('开始写入数据到表格...');
    
    // 写入数据到新表格
    await writeAmazonDataToTable(table, crawlResult.products, (progress, message) => {
      addDebugLog(`写入进度: ${progress}% - ${message}`);
      showProgress(70 + progress * 0.3, message); // 写入占30%进度
    });
    
    addDebugLog('数据写入完成', 'success');
    
    // 显示成功消息
    showMessage(
      `🎉 抓取完成！\n` +
      `📊 已创建数据表并写入 ${crawlResult.products.length} 条产品数据`, 
      'success'
    );
    
  } catch (error) {
    const errorMessage = (error as Error).message;
    addDebugLog(`抓取流程失败: ${errorMessage}`, 'error');
    console.error('抓取流程失败:', error);
    showMessage(`❌ 抓取失败: ${errorMessage}`, 'error');
  } finally {
    addDebugLog('重置加载状态');
    setLoadingState(false);
    hideProgress();
  }
}

/**
 * 格式化数字显示
 */
function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toString();
}

/**
 * 设置加载状态
 */
function setLoadingState(loading: boolean) {
  const button = $('#startAmazonCrawl');
  const text = $('#amazonCrawlText');
  const spinner = $('#amazonLoadingSpinner');
  const input = $('#amazonUrl');
  
  if (loading) {
    button.prop('disabled', true);
    input.prop('disabled', true);
    text.text('抓取中...');
    spinner.show();
  } else {
    button.prop('disabled', false);
    input.prop('disabled', false);
    text.text('开始抓取亚马逊产品');
    spinner.hide();
  }
}

/**
 * 显示进度
 */
function showProgress(progress: number, message: string) {
  const container = $('#progressContainer');
  const bar = $('#progressBar');
  const text = $('#progressText');
  
  container.show();
  bar.css('width', `${Math.min(100, Math.max(0, progress))}%`);
  text.text(message);
}

/**
 * 隐藏进度
 */
function hideProgress() {
  $('#progressContainer').hide();
}

/**
 * 显示消息
 */
function showMessage(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const container = $('#resultContainer');
  const messageEl = $('#resultMessage');
  
  const alertClass = {
    success: 'alert-success',
    error: 'alert-danger',
    info: 'alert-info'
  }[type];
  
  messageEl
    .removeClass('alert-success alert-danger alert-info')
    .addClass(alertClass)
    .html(message.replace(/\n/g, '<br>'));
  
  container.show();
  
  // 成功消息8秒后自动隐藏
  if (type === 'success') {
    setTimeout(() => {
      container.hide();
    }, 8000);
  }
}

/**
 * 显示环境状态
 */
function showEnvironmentStatus(type: 'success' | 'warning' | 'error', message: string) {
  const alertClass = {
    success: 'alert-success',
    warning: 'alert-warning',
    error: 'alert-danger'
  }[type];
  
  const statusElement = $('#environmentStatus');
  const statusText = $('#statusText');
  
  statusElement.removeClass('alert-info alert-success alert-warning alert-danger');
  statusElement.addClass(alertClass);
  statusText.text(message);
  statusElement.show();
}