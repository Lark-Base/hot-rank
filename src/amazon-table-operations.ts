import { bitable, FieldType, ITable } from '@lark-base-open/js-sdk';
import { AmazonProduct } from './amazon-api';

/**
 * 创建或更新亚马逊产品表格字段
 */
export async function setupAmazonTableFields(table: ITable): Promise<void> {
  try {
    // 获取现有字段
    const existingFields = await table.getFieldMetaList();
    const fieldNames = existingFields.map(field => field.name);
    
    // 定义需要的字段
    const requiredFields = [
      { name: '产品ID', type: FieldType.Text },
      { name: '产品标题', type: FieldType.Text },
      { name: '价格', type: FieldType.Text },
      { name: '原价', type: FieldType.Text },
      { name: '折扣', type: FieldType.Text },
      { name: '评分', type: FieldType.Number },
      { name: '评论数', type: FieldType.Number },
      { name: '产品图片', type: FieldType.Url },
      { name: '产品链接', type: FieldType.Url },
      { name: '产品描述', type: FieldType.Text },
      { name: '品牌', type: FieldType.Text },
      { name: '分类', type: FieldType.Text },
      { name: '库存状态', type: FieldType.Text },
      { name: '排名', type: FieldType.Number }
    ];
    
    // 创建缺失的字段
    for (const field of requiredFields) {
      if (!fieldNames.includes(field.name)) {
        await table.addField({
          type: field.type as FieldType.Text | FieldType.Number | FieldType.Url,
          name: field.name
        });
        console.log(`创建字段: ${field.name}`);
      }
    }
    
  } catch (error) {
    console.error('设置亚马逊产品表格字段失败:', error);
    throw new Error('表格字段设置失败');
  }
}

/**
 * 创建新的亚马逊产品数据表
 */
export async function createAmazonProductTable(siteName: string): Promise<ITable> {
  try {
    console.log('开始创建亚马逊产品数据表，站点:', siteName);
    const tableName = `亚马逊产品数据_${siteName}_${new Date().toLocaleDateString().replace(/\//g, '-')}`;
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
            type: FieldType.Text,
            name: '产品ID'
          }
        ]
      });
      table = await bitable.base.getTableById(addTableResult.tableId);
      console.log('新表格创建成功');
    }
    
    // 设置表格字段
    console.log('设置表格字段...');
    await setupAmazonTableFields(table);
    
    return table;
    
  } catch (error) {
    console.error('创建亚马逊产品数据表失败:', error);
    throw new Error('创建数据表失败，请检查权限设置');
  }
}

/**
 * 将亚马逊产品数据写入表格
 */
export async function writeAmazonDataToTable(
  table: ITable, 
  products: AmazonProduct[],
  onProgress?: (progress: number, message: string) => void
): Promise<void> {
  try {
    if (products.length === 0) {
      throw new Error('没有产品数据需要写入');
    }

    console.log(`开始写入 ${products.length} 条产品数据到表格`);
    
    // 获取字段映射
    const fieldMap = await getAmazonFieldMap(table);
    
    // 批量写入数据
    const batchSize = 10; // 每批处理10条记录
    const totalBatches = Math.ceil(products.length / batchSize);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, products.length);
      const batchProducts = products.slice(startIndex, endIndex);
      
      const records = batchProducts.map(product => ({
        fields: {
          [fieldMap['产品ID']]: product.productId,
          [fieldMap['产品标题']]: product.title,
          [fieldMap['价格']]: product.price,
          [fieldMap['原价']]: product.originalPrice || '',
          [fieldMap['折扣']]: product.discount || '',
          [fieldMap['评分']]: product.rating,
          [fieldMap['评论数']]: product.reviewCount,
          [fieldMap['产品图片']]: product.imageUrl,
          [fieldMap['产品链接']]: product.productUrl,
          [fieldMap['产品描述']]: product.description,
          [fieldMap['品牌']]: product.brand || '',
          [fieldMap['分类']]: product.category,
          [fieldMap['库存状态']]: product.availability,
          [fieldMap['排名']]: product.rank || 0
        }
      }));
      
      await table.addRecords(records);
      
      const progress = ((batchIndex + 1) / totalBatches) * 100;
      const processedCount = endIndex;
      
      if (onProgress) {
        onProgress(progress, `已写入 ${processedCount}/${products.length} 条产品数据`);
      }
      
      console.log(`批次 ${batchIndex + 1}/${totalBatches} 完成，已处理 ${processedCount} 条记录`);
      
      // 添加小延迟避免API限制
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('所有产品数据写入完成');
    
  } catch (error) {
    console.error('写入产品数据到表格失败:', error);
    throw new Error('数据写入失败，请重试');
  }
}

/**
 * 获取亚马逊产品字段映射
 */
async function getAmazonFieldMap(table: ITable): Promise<Record<string, string>> {
  const fields = await table.getFieldMetaList();
  const fieldMap: Record<string, string> = {};
  
  const fieldNames = [
    '产品ID', '产品标题', '价格', '原价', '折扣', '评分', '评论数',
    '产品图片', '产品链接', '产品描述', '品牌', '分类', '库存状态', '排名'
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
export async function checkAmazonTableExists(tableName: string): Promise<boolean> {
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
      // 批量删除记录
      const batchSize = 50;
      for (let i = 0; i < recordIds.length; i += batchSize) {
        const batch = recordIds.slice(i, i + batchSize);
        await table.deleteRecords(batch);
      }
      console.log(`清空了 ${recordIds.length} 条记录`);
    }
  } catch (error) {
    console.error('清空表格数据失败:', error);
    throw new Error('清空表格数据失败');
  }
}