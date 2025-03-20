import { ContentCollector } from '@/common/services/collector';

function getAllLinks() {
  const links = Array.from(document.querySelectorAll('a'));
  return links.map(link => ({
    url: link.href,
    text: link.textContent?.trim() || link.href
  })).filter(link => link.url && link.url.startsWith('http'));
}

export default defineContentScript({
  matches: ['*://*/*'],
  main() {
    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
      if (message.type === 'CONFIRM_DELETE') {
        const result = confirm(message.message);
        sendResponse(result);
        return true;
      }
      if (message.type === 'GET_LINKS') {
        const links = getAllLinks();
        sendResponse({ links });
        return true;
      }
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
            isSuccess: true,
            message: '页面收藏成功'
          });
        } catch (err) {
          await chrome.runtime.sendMessage({
            type: 'SHOW_MESSAGE',
            message: err instanceof Error ? err.message : '页面收藏失败'
          });
        }
      }
    });
  },
});
