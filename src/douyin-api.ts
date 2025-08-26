// 视频号视频数据接口
export interface VideoChannelVideo {
  videoId: string;
  title: string;
  // playCount: number; // 删除这个字段
  likeCount: number;
  commentCount: number;
  shareCount: number;
  collectCount: number;
  createTime: string;
  duration: number;
  coverUrl: string;
  videoUrl: string;
  playUrl: string; // 新增播放链接字段
  description: string;
  nickname: string;
  creatorId: string;
}

// 视频号博主信息接口
export interface VideoChannelCreator {
  creatorId: string;
  nickname: string;
  avatar: string;
  followerCount: number;
  followingCount: number;
  likeCount: number;
  videoCount: number;
  description: string;
}

// 抓取结果接口
export interface CrawlResult {
  user: VideoChannelCreator;
  videos: VideoChannelVideo[];
  success: boolean;
  message: string;
}

/**
 * 抓取视频号博主数据
 */
// 第45行，修改默认参数为更大的值
export async function crawlVideoChannelData(
  creatorName: string,
  videoCount: number = 1000, // 改为1000或更大的数字
  onProgress?: (progress: number, message: string) => void
): Promise<CrawlResult> {
  try {
    console.log('🚀 开始抓取视频号数据，博主名称:', creatorName);
    onProgress?.(10, '正在查找博主信息...');
    
    console.log('✅ 博主名称验证成功，开始获取视频数据...');
    onProgress?.(20, '正在获取博主视频数据...');
    
    // 获取视频数据
    const videos = await fetchVideoChannelVideos(creatorName, videoCount, onProgress);
    console.log('获取到的视频数量:', videos.length);
    
    if (videos.length === 0) {
      throw new Error('未获取到视频数据，可能是API限制或博主名称无效');
    }
    
    // 从第一个视频中获取博主信息
    const user: VideoChannelCreator = {
      creatorId: `creator_${Date.now()}`,
      nickname: videos[0]?.nickname || creatorName,
      avatar: '',
      followerCount: 0,
      followingCount: 0,
      likeCount: videos.reduce((sum, video) => sum + video.likeCount, 0),
      videoCount: videos.length,
      description: '通过视频数据获取的博主信息'
    };
    
    console.log('博主信息:', user);
    onProgress?.(100, '数据抓取完成');
    
    return {
      user,
      videos,
      success: true,
      message: '数据抓取成功'
    };
    
  } catch (error) {
    console.error('抓取视频号数据失败:', error);
    return {
      user: {} as VideoChannelCreator,
      videos: [],
      success: false,
      message: `抓取失败: ${(error as Error).message}`
    };
  }
}

/**
 * 获取视频号视频数据 - 使用Coze API
 */
async function fetchVideoChannelVideos(
  creatorName: string,
  maxCount: number,
  onProgress?: (progress: number, message: string) => void
): Promise<VideoChannelVideo[]> {
  const videos: VideoChannelVideo[] = [];
  
  try {
    console.log('🌐 开始请求Coze API...');
    onProgress?.(30, '正在请求Coze API...');
    
    const response = await fetch('https://api.coze.cn/v1/workflow/run', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer pat_qPvhDJYwhmQvwh9Z39o4MAbepdxFe7T1MtpWRA4j2Ot0JOHzuN7lxN9bHAITA1tV',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        workflow_id: '7523427005947592743',
        parameters: {
          input: creatorName
        }
      })
    });
    
    console.log('📡 Coze API响应状态:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`Coze API请求失败: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('📦 Coze API响应数据:', result);
    
    onProgress?.(60, '正在处理API返回数据...');
    
    // 检查返回数据结构
    if (!result.data) {
      console.warn('API返回数据中没有data字段:', result);
      throw new Error('API返回数据格式异常：缺少data字段');
    }
    
    // 替换第141-180行的数据解析部分
    
    // 解析嵌套的JSON字符串
    let parsedData;
    try {
      parsedData = JSON.parse(result.data);
      console.log('📦 第一层解析后的数据:', parsedData);
    } catch (parseError) {
      console.error('解析data字段失败:', parseError);
      throw new Error('API返回的data字段不是有效的JSON格式');
    }
    
    // 检查content_type和data字段
    if (!parsedData.data) {
      throw new Error('API返回数据中缺少data字段');
    }
    
    // 解析data字段中的JSON字符串
    let videoDataArray = [];
    try {
      // parsedData.data是一个JSON字符串，需要再次解析
      const dataArray = JSON.parse(parsedData.data);
      console.log('📦 第二层解析后的数据:', dataArray);
      
      // dataArray应该是一个数组，每个元素可能是字符串或对象
      if (Array.isArray(dataArray)) {
        for (const item of dataArray) {
          if (typeof item === 'string') {
            // 如果是字符串，再次解析
            const videoData = JSON.parse(item);
            if (Array.isArray(videoData)) {
              videoDataArray.push(...videoData);
            } else {
              videoDataArray.push(videoData);
            }
          } else {
            // 如果已经是对象，直接添加
            videoDataArray.push(item);
          }
        }
      } else {
        // 如果不是数组，可能是单个对象
        videoDataArray.push(dataArray);
      }
      
      console.log('📦 最终解析后的视频数据数组:', videoDataArray);
    } catch (parseError) {
      console.error('解析视频数据失败:', parseError, 'parsedData.data:', parsedData.data);
      throw new Error('解析视频数据JSON失败');
    }
    
    console.log(`🔄 开始转换 ${videoDataArray.length} 个视频数据...`);
    
    // 处理每个视频数据
    for (let i = 0; i < Math.min(videoDataArray.length, maxCount); i++) {
      const item = videoDataArray[i];
      
      // 提取视频基本信息
      const video: VideoChannelVideo = {
        videoId: item.id || item.displayid || `video_${i}`,
        title: item.objectDesc?.description || '无标题',
        likeCount: item.likeCount || 0,
        commentCount: item.commentCount || 0,
        shareCount: item.forwardCount || 0,
        collectCount: item.favCount || 0,
        createTime: item.createtime ? new Date(item.createtime * 1000).toISOString() : new Date().toISOString(),
        duration: item.objectDesc?.media?.[0]?.videoPlayLen || 0,
        coverUrl: item.objectDesc?.media?.[0]?.thumbUrl || item.objectDesc?.media?.[0]?.coverUrl || '',
        videoUrl: '', // 视频号通常不直接提供视频URL
        playUrl: (item.objectDesc?.media?.[0]?.url || '') + (item.objectDesc?.media?.[0]?.urlToken || ''),
        description: item.objectDesc?.description || '',
        nickname: item.contact?.nickname || item.nickname || creatorName,
        creatorId: item.contact?.username || `creator_${Date.now()}`
      };
      
      videos.push(video);
      console.log(`✅ 处理视频 ${i + 1}: ${video.title}`);
    }
    
    console.log(`✅ 成功转换 ${videos.length} 个视频数据`);
    onProgress?.(90, `已处理 ${videos.length} 个视频数据...`);
    
    return videos;
    
  } catch (error) {
    console.error('获取视频数据失败:', error);
    throw error;
  }
}

/**
 * 验证博主名称格式
 */
export function validateCreatorName(name: string): boolean {
  // 简单验证：非空且长度合理
  return name.trim().length > 0 && name.trim().length <= 50;
}