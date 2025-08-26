import { bitable, FieldType, ITable } from '@lark-base-open/js-sdk';
import { VideoChannelVideo, VideoChannelCreator } from './douyin-api';

/**
 * 创建或更新表格字段
 */
export async function setupTableFields(table: ITable): Promise<void> {
  try {
    // 获取现有字段
    const existingFields = await table.getFieldMetaList();
    const fieldNames = existingFields.map(field => field.name);
    
    // 定义需要的字段
    const requiredFields = [
      { name: '视频ID', type: FieldType.Text },
      { name: '视频标题', type: FieldType.Text },
      { name: '播放量', type: FieldType.Number },
      { name: '点赞量', type: FieldType.Number },
      { name: '评论量', type: FieldType.Number },
      { name: '分享量', type: FieldType.Number },
      { name: '收藏量', type: FieldType.Number },
      { name: '发布时间', type: FieldType.DateTime },
      { name: '视频时长(毫秒)', type: FieldType.Number },
      { name: '封面链接', type: FieldType.Url },
      { name: '视频链接', type: FieldType.Url },
      { name: '视频描述', type: FieldType.Text },
      { name: '博主昵称', type: FieldType.Text },
      { name: '博主ID', type: FieldType.Text }
    ];
    
    // 创建缺失的字段
    for (const field of requiredFields) {
      if (!fieldNames.includes(field.name)) {
        await table.addField({
          type: field.type as FieldType.Text | FieldType.Number | FieldType.DateTime | FieldType.Url,
          name: field.name
        });
        console.log(`创建字段: ${field.name}`);
      }
    }
    
  } catch (error) {
    console.error('设置表格字段失败:', error);
    throw new Error('表格字段设置失败');
  }
}

/**
 * 创建新的数据表
 */
export async function createVideoChannelDataTable(creatorName: string): Promise<ITable> {
  try {
    // 生成表格名称，添加时间戳确保唯一性
    const tableName = `${creatorName}_videos_${Date.now()}`;
    
    // 创建新表格
    const tableResult = await bitable.base.addTable({
      name: tableName,
      fields: [
        { type: FieldType.Text, name: 'video_id' },
        { type: FieldType.Text, name: 'title' },
        // { type: FieldType.Number, name: 'play_count' }, // 删除这行
        { type: FieldType.Number, name: 'like_count' },
        { type: FieldType.Number, name: 'comment_count' },
        { type: FieldType.Number, name: 'share_count' },
        { type: FieldType.Number, name: 'collect_count' },
        { type: FieldType.Text, name: 'create_time' },
        { type: FieldType.Number, name: 'duration' },
        { type: FieldType.Text, name: 'nickname' },
        { type: FieldType.Text, name: 'creator_id' },
        { type: FieldType.Text, name: 'cover_url' },
        { type: FieldType.Text, name: 'play_url' }, // 新增播放链接字段
        { type: FieldType.Text, name: 'description' }
      ]
    });
    
    console.log(`成功创建数据表: ${tableName}`);
    
    // 获取表格实例并等待初始化完成
    const table = await bitable.base.getTableById(tableResult.tableId);
    
    // 等待表格完全初始化
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 验证字段是否创建成功
    const fieldMetaList = await table.getFieldMetaList();
    console.log('表格字段创建完成:', fieldMetaList.map(f => f.name));
    
    return table;
    
  } catch (error) {
    console.error('创建数据表失败:', error);
    throw new Error('创建数据表失败');
  }
}

/**
 * 将视频号数据写入表格
 */
export async function writeDataToTable(
  table: ITable, 
  user: VideoChannelCreator, 
  videos: VideoChannelVideo[],
  onProgress?: (progress: number, message: string) => void
): Promise<void> {
  try {
    // 获取字段元数据并创建字段名到ID的映射
    const fieldMetaList = await table.getFieldMetaList();
    console.log('表格实际字段列表:', fieldMetaList.map(f => `${f.name} (${f.id})`));
    
    // 创建字段名到字段ID的映射
    const fieldMap = new Map<string, string>();
    fieldMetaList.forEach(field => {
      fieldMap.set(field.name, field.id);
    });
    
    console.log('字段映射:', Object.fromEntries(fieldMap));
    
    console.log('开始写入数据，视频数量:', videos.length);
    console.log('用户信息:', user);
    
    onProgress?.(0, '正在准备写入数据...');
    
    // 验证数据完整性
    if (!videos || videos.length === 0) {
      throw new Error('没有可写入的视频数据');
    }
    
    onProgress?.(20, '正在写入视频数据...');
    
    // 批量添加记录 - 使用字段ID而不是字段名
    const records = videos.map((video, index) => {
      try {
        console.log(`处理视频 ${index + 1}:`, video);
        
        if (!video) {
          console.error(`视频 ${index + 1} 数据为空`);
          return null;
        }
        
        // 使用字段ID构建记录
        const record: IRecordValue = {
          fields: {
            [fieldMap.get('video_id')!]: String(video?.videoId || `video_${index + 1}`),
            [fieldMap.get('title')!]: String(video?.title || '无标题'),
            // [fieldMap.get('play_count')!]: Number(video?.playCount) || 0, // 删除这行
            [fieldMap.get('like_count')!]: Number(video?.likeCount) || 0,
            [fieldMap.get('comment_count')!]: Number(video?.commentCount) || 0,
            [fieldMap.get('share_count')!]: Number(video?.shareCount) || 0,
            [fieldMap.get('collect_count')!]: Number(video?.collectCount) || 0,
            [fieldMap.get('create_time')!]: String(video?.createTime || new Date().toISOString()),
            [fieldMap.get('duration')!]: Number(video?.duration) || 0,
            [fieldMap.get('nickname')!]: String(video?.nickname || user?.nickname || '未知博主'),
            [fieldMap.get('creator_id')!]: String(video?.creatorId || user?.creatorId || `creator_${Date.now()}`),
            [fieldMap.get('cover_url')!]: String(video?.coverUrl || ''),
            [fieldMap.get('play_url')!]: String(video?.playUrl || ''), // 新增播放链接字段
            [fieldMap.get('description')!]: String(video?.description || '')
          }
        };
        
        console.log(`视频 ${index + 1} 处理成功:`, record);
        return record;
      } catch (error) {
        console.error(`处理视频 ${index + 1} 数据时出错:`, error, video);
        // 返回一个基本记录
        return {
          fields: {
            [fieldMap.get('video_id')!]: `video_${index + 1}`,
            [fieldMap.get('title')!]: video?.title || `视频_${index + 1}`,
            // [fieldMap.get('play_count')!]: 0, // 删除这行
            [fieldMap.get('like_count')!]: Number(video?.likeCount) || 0,
            [fieldMap.get('comment_count')!]: Number(video?.commentCount) || 0,
            [fieldMap.get('share_count')!]: Number(video?.shareCount) || 0,
            [fieldMap.get('collect_count')!]: Number(video?.collectCount) || 0,
            [fieldMap.get('create_time')!]: new Date().toISOString(),
            [fieldMap.get('duration')!]: 0,
            [fieldMap.get('nickname')!]: user?.nickname || '未知博主',
            [fieldMap.get('creator_id')!]: user?.creatorId || `creator_${Date.now()}`,
            [fieldMap.get('cover_url')!]: '',
            [fieldMap.get('play_url')!]: video?.playUrl || '', // 新增播放链接字段
            [fieldMap.get('description')!]: video?.description || ''
          }
        };
      }
    });
    
    // 验证所有必需字段是否存在
    const requiredFieldNames = [
      'video_id', 'title', /* 'play_count', */ 'like_count', 'comment_count', 
      'share_count', 'collect_count', 'create_time', 'duration', 
      'nickname', 'creator_id', 'cover_url', 'play_url', 'description' // 更新字段列表
    ];
    
    // ... existing code ...
    
    // 移除filter，确保所有记录都被保留
    console.log('处理后的记录数量:', records.length);
    console.log('所有记录:', records);
    
    console.log('准备写入的记录数量:', records.length);
    
    if (records.length === 0) {
      throw new Error('所有视频数据处理失败');
    }
    
    // 分批写入数据
    const batchSize = 5;
    let totalWritten = 0;
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      console.log(`写入批次 ${Math.floor(i/batchSize) + 1}，包含 ${batch.length} 条记录`);
      
      try {
        const result = await table.addRecords(batch.filter((record): record is { fields: { [key: string]: string | number } } => record !== null));
        console.log('批次写入成功，返回结果:', result);
        
        totalWritten += batch.length;
        const progress = 20 + (totalWritten / records.length) * 70;
        onProgress?.(progress, `已写入 ${totalWritten}/${records.length} 条记录`);
        
        // 添加延迟，避免请求过快
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (batchError) {
        console.error(`批次 ${Math.floor(i/batchSize) + 1} 写入失败:`, batchError);
        
        // 尝试单条写入
        for (let j = 0; j < batch.length; j++) {
          const record = batch[j];
          try {
            console.log(`尝试单条写入记录 ${i + j + 1}:`, record);
            const singleResult = record ? await table.addRecord(record) : null;
            console.log('单条写入成功:', singleResult);
            totalWritten++;
          } catch (singleError) {
            console.error(`单条记录 ${i + j + 1} 写入失败:`, singleError, record);
          }
        }
      }
    }
    
    console.log(`数据写入完成，总共写入 ${totalWritten} 条记录`);
    onProgress?.(100, `成功写入 ${totalWritten} 条视频数据`);
    
  } catch (error) {
    console.error('写入数据失败:', error);
    throw new Error(`数据写入失败: ${(error as Error).message}`);
  }
}

function isValidDate(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * 检查表格是否已存在
 */
export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const tableList = await bitable.base.getTableMetaList();
    return tableList.some(table => table.name === tableName);
  } catch (error) {
    console.error('检查表格失败:', error);
    return false;
  }
}

/**
 * 清空表格数据（可选功能）
 */
export async function clearTableData(table: ITable): Promise<void> {
  try {
    const recordIds = await table.getRecordIdList();
    if (recordIds.length > 0) {
      await table.deleteRecords(recordIds);
      console.log(`清空了 ${recordIds.length} 条记录`);
    }
  } catch (error) {
    console.error('清空表格失败:', error);
    throw new Error('清空表格失败');
  }
}