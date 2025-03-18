import { useState, useEffect } from 'react';
import { FeishuConfig } from '@/common/types/feishu';
import {
  getFeishuConfig,
  saveFeishuConfig,
  clearFeishuConfig
} from '@/common/utils/storage';
import './App.css';

const TOKEN_DOC_URL = 'https://open.feishu.cn/document/server-docs/api-call-guide/calling-process/get-access-token';
const BITABLE_RECORD_API_DOC_URL = 'https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-record/search';

function App() {
  const [config, setConfig] = useState<FeishuConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const parseFeishuUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      if (!urlObj.hostname.includes('feishu.cn')) return null;
      
      const pathParts = urlObj.pathname.split('/');
      const baseIndex = pathParts.indexOf('base');
      if (baseIndex === -1) return null;
      
      const appToken = pathParts[baseIndex + 1];
      const tableId = new URLSearchParams(urlObj.search).get('table');
      if (!appToken || !tableId) return null;
      
      return { appToken, tableId };
    } catch {
      return null;
    }
  };

  const loadConfig = async () => {
    try {
      const savedConfig = await getFeishuConfig();
      if (savedConfig) {
        setConfig(savedConfig);
      } else {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url) {
          const urlParams = parseFeishuUrl(tab.url);
          if (urlParams) {
            const formElement = document.querySelector('form') as HTMLFormElement;
            if (formElement) {
              const appTokenInput = formElement.elements.namedItem('appToken') as HTMLInputElement;
              const tableIdInput = formElement.elements.namedItem('tableId') as HTMLInputElement;
              if (appTokenInput && tableIdInput) {
                appTokenInput.value = urlParams.appToken;
                tableIdInput.value = urlParams.tableId;
              }
            }
          }
        }
      }
    } catch (err) {
      setError('加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newConfig: FeishuConfig = {
      feishuToken: formData.get('feishuToken') as string,
      appToken: formData.get('appToken') as string,
      tableId: formData.get('tableId') as string,
    };

    try {
      await saveFeishuConfig(newConfig);
      setConfig(newConfig);
      setError('');
      setSuccess('');
    } catch (err) {
      setError('保存配置失败');
    }
  };

  useEffect(() => {
    const messageListener = (message: any) => {
      if (message.type === 'SHOW_MESSAGE') {
        const func = message.isSuccess ? setSuccess : setError;
        func(message.message);
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, []);

  const handleCollect = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return;
      setError('');
      setSuccess('');
      await chrome.tabs.sendMessage(tab.id, { type: 'COLLECT_DATA' });
    } catch (err) {
      setError('数据采集失败');
    }
  };

  const handleClearConfig = async () => {
    try {
      await clearFeishuConfig();
      setConfig(null);
      setError('');
      setSuccess('');
    } catch (err) {
      setError('清除配置失败');
    }
  };

  if (loading) {
    return <div className="container">加载中...</div>;
  }

  return (
    <div className="w-[400px] bg-white rounded-xl shadow-lg p-6 space-y-6">
      {!config ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">飞书配置</h2>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">获取访问凭证</label>
            <input
              type="text"
              name="feishuToken"
              required
              placeholder="请输入获取访问凭证"
              className="block p-2 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm transition duration-200"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              飞书开放平台 - 
              <a href={TOKEN_DOC_URL} target='_blank' className="text-blue-600 hover:text-blue-700 underline">获取访问凭证</a> 或者 
              <a href={BITABLE_RECORD_API_DOC_URL} target='_blank' className="text-blue-600 hover:text-blue-700 underline">在API调试台获取</a>
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">表格token</label>
            <input
              type="text"
              name="appToken"
              required
              placeholder="请输入表格token"
              className="block p-2 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm transition duration-200"
            />
            <p className="mt-1.5 text-xs text-gray-500">打开多维表格，从URL中复制 /base 后面的参数</p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">表格 ID</label>
            <input
              type="text"
              name="tableId"
              required
              placeholder="请输入表格 ID"
              className="block p-2 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm transition duration-200"
            />
            <p className="mt-1.5 text-xs text-gray-500">打开多维表格，从URL中复制表格ID（table=后面形如 tbl开头的字符串）</p>
          </div>
          <button type="submit" className="w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transform transition duration-200 hover:scale-[1.02] active:scale-[0.98]">保存配置</button>
        </form>
      ) : (
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">内容采集</h2>
          <p className="text-gray-600">配置已保存，点击下方按钮开始采集页面内容</p>
          <div className="space-y-2">
            <button onClick={handleCollect} className="w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transform transition duration-200 hover:scale-[1.02] active:scale-[0.98]">开始采集</button>
            <button onClick={handleClearConfig} className="w-full py-2.5 px-4 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 transform transition duration-200 hover:scale-[1.02] active:scale-[0.98]">清除配置</button>
          </div>
        </div>
      )}
      {error && <pre className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</pre>}
      {success && <pre className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">{success}</pre>}
    </div>
  );
}

export default App;
