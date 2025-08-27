// 抖音热榜API调用模块

/**
 * 抖音热榜数据接口
 */
export interface DouyinHotItem {
  hot_content: string;  // 热榜内容
  hot_type: string;     // 热榜类型（热、新、热议等）
  hot_value: number;    // 热度值
}

/**
 * API响应接口
 */
export interface DouyinApiResponse {
  code: number;
  data: string;  // JSON字符串，需要解析
  debug_url: string;
  msg: string;
  usage: {
    input_count: number;
    output_count: number;
    token_count: number;
  };
}

/**
 * 解析后的数据接口
 */
export interface DouyinHotListData {
  output: DouyinHotItem[];
}

/**
 * 调用抖音热榜API获取数据
 * @returns Promise<DouyinHotItem[]>
 */
export async function fetchDouyinHotList(): Promise<DouyinHotItem[]> {
  try {
    const response = await fetch('https://api.coze.cn/v1/workflow/run', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer sat_y5lEDHjaJE09K0wn3P0vSQGHQbKV1AtiOnYCwOaQ6pGigv3JxZGFR6hx0SGdCPqC',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        workflow_id: '7542724146842026019',
        parameters: {
          input: ''
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResult: DouyinApiResponse = await response.json();
    
    // 检查API返回状态
    if (apiResult.code !== 0) {
      throw new Error(`API error: ${apiResult.msg}`);
    }

    // 解析data字段中的JSON字符串
    const parsedData: DouyinHotListData = JSON.parse(apiResult.data);
    
    if (!parsedData.output || !Array.isArray(parsedData.output)) {
      throw new Error('Invalid data format: output array not found');
    }

    return parsedData.output;
  } catch (error) {
    console.error('抖音热榜API调用失败:', error);
    throw error;
  }
}

/**
 * 格式化热度值显示
 * @param value 热度值
 * @returns 格式化后的字符串
 */
export function formatHotValue(value: number): string {
  if (value >= 10000000) {
    return `${(value / 10000000).toFixed(1)}千万`;
  } else if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`;
  } else {
    return value.toString();
  }
}

/**
 * 获取热榜类型的显示文本
 * @param type 热榜类型
 * @returns 显示文本
 */
export function getHotTypeDisplay(type: string): string {
  if (!type || type.trim() === '') {
    return '普通';
  }
  return type;
}