import { FeishuService } from '@/common/services/feishu';
import { getFeishuConfig } from '@/common/utils/storage';

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SAVE_DATA') {
      (async () => {
        try {
          const config = await getFeishuConfig();
          if (!config) {
            throw new Error('请先配置飞书信息');
          }

          const feishuService = new FeishuService(config);
          await feishuService.saveData(message.data);
          sendResponse({ success: true });
        } catch (err) {
          sendResponse({ 
            success: false, 
            error: err instanceof Error ? err.message : '数据保存失败'
          });
        }
      })();
      return true;
    }
  });
});
