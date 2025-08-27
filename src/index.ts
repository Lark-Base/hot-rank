import $ from 'jquery';
import { bitable } from '@lark-base-open/js-sdk';
import './index.scss';
// 导入抖音热榜相关功能
import { fetchDouyinHotList, DouyinHotItem } from './douyin-api';
import { createDouyinHotListTable, writeDouyinDataToTable } from './douyin-table-operations';

$(async function() {
  try {
    // 初始化 Lark Base SDK
    addDebugLog('正在初始化 Lark Base SDK...');
    
    // 检查是否在 Lark Base 环境中
    if (typeof bitable === 'undefined') {
      throw new Error('未检测到 Lark Base 环境');
    }
    
    addDebugLog('SDK 初始化成功', 'success');
    

    
    // 添加调试面板
    addDebugPanel();
    
    // 绑定抖音热榜按钮事件
    $('#getDouyinHotList').on('click', handleDouyinHotList);
    
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
    

    
    // 绑定抖音热榜按钮事件
    $('#getDouyinHotList').on('click', handleDouyinHotList);
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
 * 格式化数字显示
 */
function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toString();
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
 * 处理抖音热榜获取
 */
async function handleDouyinHotList() {
  try {
    addDebugLog('开始获取抖音热榜数据');
    setDouyinLoadingState(true);
    showDouyinProgress(10, '正在获取抖音热榜数据...');
    
    // 获取抖音热榜数据
    const hotListData = await fetchDouyinHotList();
    addDebugLog(`成功获取到 ${hotListData.length} 条热榜数据`);
    
    if (!hotListData || hotListData.length === 0) {
      throw new Error('未获取到热榜数据，请稍后重试');
    }
    
    showDouyinProgress(50, '正在创建热榜数据表...');
    addDebugLog('开始创建抖音热榜数据表');
    
    // 创建新的数据表
    const table = await createDouyinHotListTable();
    addDebugLog('抖音热榜数据表创建成功', 'success');
    
    showDouyinProgress(70, '数据表创建成功，开始写入数据...');
    addDebugLog('开始写入热榜数据到表格...');
    
    // 写入数据到新表格
    await writeDouyinDataToTable(table, hotListData, (progress, message) => {
      addDebugLog(`写入进度: ${progress}% - ${message}`);
      showDouyinProgress(70 + progress * 0.3, message);
    });
    
    addDebugLog('抖音热榜数据写入完成', 'success');
    
    // 显示成功消息
    showDouyinMessage(
      `🎉 抖音热榜获取完成！\n` +
      `📊 已创建数据表并写入 ${hotListData.length} 条热榜数据\n` +
      `🔥 数据来源: 抖音热榜API`, 
      'success'
    );
    
  } catch (error) {
    const errorMessage = (error as Error).message;
    addDebugLog(`抖音热榜获取失败: ${errorMessage}`, 'error');
    console.error('抖音热榜获取失败:', error);
    showDouyinMessage(`❌ 抖音热榜获取失败: ${errorMessage}`, 'error');
  } finally {
    addDebugLog('重置抖音热榜加载状态');
    setDouyinLoadingState(false);
    hideDouyinProgress();
  }
}

/**
 * 设置抖音热榜加载状态
 */
function setDouyinLoadingState(loading: boolean) {
  const button = $('#getDouyinHotList');
  const text = $('#douyinText');
  const spinner = $('#douyinLoadingSpinner');
  
  if (loading) {
    button.prop('disabled', true);
    text.text('获取中...');
    spinner.show();
  } else {
    button.prop('disabled', false);
    text.text('获取抖音热榜');
    spinner.hide();
  }
}

/**
 * 显示抖音热榜进度
 */
function showDouyinProgress(progress: number, message: string) {
  const container = $('#douyinProgressContainer');
  const bar = $('#douyinProgressBar');
  const text = $('#douyinProgressText');
  const percentage = $('.progress-percentage');
  
  container.show();
  const progressValue = Math.min(100, Math.max(0, progress));
  bar.css('width', `${progressValue}%`);
  text.text(message);
  percentage.text(`${Math.round(progressValue)}%`);
}

/**
 * 隐藏抖音热榜进度
 */
function hideDouyinProgress() {
  $('#douyinProgressContainer').hide();
}

/**
 * 显示抖音热榜消息
 */
function showDouyinMessage(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const container = $('#douyinResultContainer');
  const messageEl = $('#douyinResultMessage');
  
  const cssClass = {
    success: 'success',
    error: 'error',
    info: 'info'
  }[type];
  
  messageEl
    .removeClass('success error info')
    .addClass(cssClass)
    .html(message.replace(/\n/g, '<br>'));
  
  container.show();
  
  // 添加淡入动画效果
  container.css('opacity', '0').animate({ opacity: 1 }, 300);
  
  // 成功消息8秒后自动隐藏
  if (type === 'success') {
    setTimeout(() => {
      container.animate({ opacity: 0 }, 300, () => {
        container.hide().css('opacity', '1');
      });
    }, 8000);
  }
}