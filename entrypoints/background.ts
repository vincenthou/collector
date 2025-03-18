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
          const existingRecord = await feishuService.findRecordByUrl(message.data.url);

          if (existingRecord) {
            const confirmDelete = await new Promise(resolve => {
              chrome.tabs.sendMessage(sender.tab?.id || 0, {
                type: 'CONFIRM_DELETE',
                message: '该URL已经收藏过了，是否删除旧记录并重新收藏？'
              }, (result) => {
                resolve(result);
              });
            });

            if (!confirmDelete) {
              sendResponse({ success: false, error: '已取消收藏' });
              return;
            }

            await feishuService.deleteRecord(existingRecord.record_id);
          }

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
