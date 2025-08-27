import { bitable, FieldType, ITable } from '@lark-base-open/js-sdk';
import { DouyinHotItem, formatHotValue, getHotTypeDisplay } from './douyin-api';

/**
 * 创建或更新抖音热榜表格字段
 */
export async function setupDouyinTableFields(table: ITable): Promise<void> {
  try {
    // 获取现有字段
    const existingFields = await table.getFieldMetaList();
    const fieldNames = existingFields.map(field => field.name);
    
    // 定义需要的字段
    const requiredFields = [
      { name: '排名', type: FieldType.Number },
      { name: '热榜内容', type: FieldType.Text },
      { name: '热榜类型', type: FieldType.Text },
      { name: '热度值', type: FieldType.Number },
      { name: '热度显示', type: FieldType.Text },
      { name: '获取时间', type: FieldType.DateTime }
    ];
    
    // 创建缺失的字段
    for (const field of requiredFields) {
      if (!fieldNames.includes(field.name)) {
        await table.addField({
          type: field.type as FieldType.Text | FieldType.Number | FieldType.DateTime,
          name: field.name
        });
        console.log(`创建字段: ${field.name}`);
      }
    }
    
  } catch (error) {
    console.error('设置抖音热榜表格字段失败:', error);
    throw new Error('表格字段设置失败');
  }
}

/**
 * 创建新的抖音热榜数据表
 */
export async function createDouyinHotListTable(): Promise<ITable> {
  try {
    console.log('开始创建抖音热榜数据表');
    const tableName = `抖音热榜_${new Date().toLocaleDateString().replace(/\//g, '-')}_${new Date().toLocaleTimeString().replace(/:/g, '-')}`;
    console.log('表格名称:', tableName);
    
    // 检查是否有基础权限
    console.log('检查基础权限...');
    if (!bitable || !bitable.base) {
      throw new Error('Lark Base SDK 未正确初始化');
    }
    
    // 检查表格是否已存在
    console.log('获取现有表格列表...');
    const existingTables = await bitable.base.getTableMetaList();
    console.log('现有表格数量:', existingTables.length);
    const existingTable = existingTables.find(table => table.name === tableName);
    
    let table: ITable;
    
    if (existingTable) {
      console.log('表格已存在，使用现有表格:', tableName);
      table = await bitable.base.getTableById(existingTable.id);
      console.log('获取现有表格成功');
      // 清空现有数据
      console.log('清空现有数据...');
      await clearTableData(table);
    } else {
      console.log('创建新表格:', tableName);
      const addTableResult = await bitable.base.addTable({
        name: tableName,
        fields: [
          {
            type: FieldType.Number,
            name: '排名'
          }
        ]
      });
      table = await bitable.base.getTableById(addTableResult.tableId);
      console.log('新表格创建成功');
    }
    
    // 设置表格字段
    console.log('设置表格字段...');
    await setupDouyinTableFields(table);
    
    return table;
    
  } catch (error) {
    console.error('创建抖音热榜数据表失败:', error);
    throw new Error('创建数据表失败，请检查权限设置');
  }
}

/**
 * 将抖音热榜数据写入表格
 */
export async function writeDouyinDataToTable(
  table: ITable, 
  hotList: DouyinHotItem[],
  onProgress?: (progress: number, message: string) => void
): Promise<void> {
  try {
    if (hotList.length === 0) {
      throw new Error('没有热榜数据需要写入');
    }

    console.log(`开始写入 ${hotList.length} 条热榜数据到表格`);
    
    // 获取字段映射
    const fieldMap = await getDouyinFieldMap(table);
    
    // 批量写入数据
    const batchSize = 10; // 每批处理10条记录
    const totalBatches = Math.ceil(hotList.length / batchSize);
    const currentTime = Date.now();
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, hotList.length);
      const batchItems = hotList.slice(startIndex, endIndex);
      
      const records = batchItems.map((item, index) => ({
        fields: {
          [fieldMap['排名']]: startIndex + index + 1,
          [fieldMap['热榜内容']]: item.hot_content,
          [fieldMap['热榜类型']]: getHotTypeDisplay(item.hot_type),
          [fieldMap['热度值']]: item.hot_value,
          [fieldMap['热度显示']]: formatHotValue(item.hot_value),
          [fieldMap['获取时间']]: currentTime
        }
      }));
      
      await table.addRecords(records);
      
      const progress = ((batchIndex + 1) / totalBatches) * 100;
      const processedCount = endIndex;
      
      if (onProgress) {
        onProgress(progress, `已写入 ${processedCount}/${hotList.length} 条热榜数据`);
      }
      
      console.log(`批次 ${batchIndex + 1}/${totalBatches} 完成，已处理 ${processedCount} 条记录`);
      
      // 添加小延迟避免API限制
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('所有热榜数据写入完成');
    
  } catch (error) {
    console.error('写入热榜数据到表格失败:', error);
    throw new Error('数据写入失败，请重试');
  }
}

/**
 * 获取抖音热榜字段映射
 */
async function getDouyinFieldMap(table: ITable): Promise<Record<string, string>> {
  const fields = await table.getFieldMetaList();
  const fieldMap: Record<string, string> = {};
  
  const fieldNames = [
    '排名', '热榜内容', '热榜类型', '热度值', '热度显示', '获取时间'
  ];
  
  for (const fieldName of fieldNames) {
    const field = fields.find(f => f.name === fieldName);
    if (field) {
      fieldMap[fieldName] = field.id;
    }
  }
  
  return fieldMap;
}

/**
 * 检查表格是否存在
 */
export async function checkDouyinTableExists(tableName: string): Promise<boolean> {
  try {
    const tables = await bitable.base.getTableMetaList();
    return tables.some(table => table.name === tableName);
  } catch (error) {
    console.error('检查表格存在性失败:', error);
    return false;
  }
}

/**
 * 清空表格数据
 */
export async function clearTableData(table: ITable): Promise<void> {
  try {
    const recordIds = await table.getRecordIdList();
    if (recordIds.length > 0) {
      // 分批删除记录，避免一次删除太多
      const batchSize = 50;
      for (let i = 0; i < recordIds.length; i += batchSize) {
        const batch = recordIds.slice(i, i + batchSize);
        await table.deleteRecords(batch);
        console.log(`删除了 ${batch.length} 条记录`);
      }
    }
    console.log('表格数据清空完成');
  } catch (error) {
    console.error('清空表格数据失败:', error);
    throw new Error('清空表格数据失败');
  }
}