import { ContentCollector } from '@/common/services/collector';

export default defineContentScript({
  matches: ['*://*/*'],
  main() {
    chrome.runtime.onMessage.addListener(async (message) => {
      if (message.type === 'COLLECT_DATA') {
        try {
          const collector = new ContentCollector();
          const data = await collector.collect();

          const response = await chrome.runtime.sendMessage({
            type: 'SAVE_DATA',
            data: data
          });

          if (!response.success) {
            throw new Error(response.error);
          }

          await chrome.runtime.sendMessage({
            type: 'SHOW_MESSAGE',
            message: '数据采集成功'
          });
        } catch (err) {
          await chrome.runtime.sendMessage({
            type: 'SHOW_MESSAGE',
            message: err instanceof Error ? err.message : '数据采集失败'
          });
        }
      }
    });
  },
});
