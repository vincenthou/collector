import { useState, useEffect } from 'react';
import { FeishuConfig } from '@/common/types/feishu';

interface Link {
  url: string;
  text: string;
}
import {
  getFeishuConfig,
  saveFeishuConfig,
  clearFeishuConfig
} from '@/common/utils/storage';
import './App.css';

const APP_MANAGEMENT_URL = 'https://open.feishu.cn/app';

function App() {
  const [config, setConfig] = useState<FeishuConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [links, setLinks] = useState<Link[]>([]);

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
      appId: formData.get('appId') as string,
      appSecret: formData.get('appSecret') as string,
      appToken: formData.get('appToken') as string,
      tableId: formData.get('tableId') as string
    };

    try {
      await saveFeishuConfig(newConfig);
      setConfig(newConfig);
      setError('');
      setSuccess('');
      isEditing && setIsEditing(false);
    } catch (err) {
      setError('保存配置失败');
    }
  };

  useEffect(() => {
    const messageListener = (message: any) => {
      if (message.type === 'SHOW_MESSAGE') {
        const func = message.isSuccess ? setSuccess : setError;
        func(message.message);
        setLoading(false)
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, []);

  const handleCollect = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return;
      await chrome.tabs.sendMessage(tab.id, { type: 'COLLECT_DATA' });
    } catch (err) {
      setError('数据收藏失败');
    }
  };

  const handleGetLinks = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setLinks([]);
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return;
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_LINKS' });
      setLinks(response.links);
    } catch (err) {
      setError('获取链接失败');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLink = (url: string) => {
    chrome.tabs.create({ url, active: false });
  };

  const [isEditing, setIsEditing] = useState(false);

  const handleEditConfig = () => {
    setIsEditing(true);
  };

  const handleClearConfig = async () => {
    if (!window.confirm('确定要清空配置吗？')) return;
    try {
      await clearFeishuConfig();
      setConfig(null);
      setError('');
      setSuccess('');
    } catch (err) {
      setError('清除配置失败');
    }
  };

  return (
    <div className="w-[400px] bg-white rounded-xl shadow-lg p-6 space-y-6">
      {(!config || isEditing) ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">飞书配置</h2>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">App ID</label>
            <input
              type="text"
              name="appId"
              required
              defaultValue={config?.appId}
              placeholder="请输入App ID"
              className="block p-2 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm transition duration-200"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              在飞书开放平台 - <a href={APP_MANAGEMENT_URL} target='_blank' className="text-blue-600 hover:text-blue-700 underline">开发者后台</a> 中获取
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">App Secret</label>
            <input
              type="password"
              name="appSecret"
              required
              defaultValue={config?.appSecret}
              placeholder="请输入App Secret"
              className="block p-2 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm transition duration-200"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              在飞书开放平台 - <a href={APP_MANAGEMENT_URL} target='_blank' className="text-blue-600 hover:text-blue-700 underline">开发者后台</a> 中获取
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">表格token</label>
            <input
              type="text"
              name="appToken"
              required
              defaultValue={config?.appToken}
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
              defaultValue={config?.tableId}
              placeholder="请输入表格 ID"
              className="block p-2 w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm transition duration-200"
            />
            <p className="mt-1.5 text-xs text-gray-500">打开多维表格，从URL中复制表格ID（table=后面形如 tbl开头的字符串）</p>
          </div>
          <div className='flex gap-2'>
            <button type="submit" className="w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transform transition duration-200 hover:scale-[1.02] active:scale-[0.98]">{isEditing ? '保存修改' : '保存配置'}</button>
            {isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-full py-2.5 px-4 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500/50 transform transition duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                取消编辑
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="relative text-center space-y-4 pt-2">
          <h2 className="text-2xl font-bold text-gray-900">内容收藏</h2>
          <div className="absolute top-0 right-0 flex space-x-2">
            <button
              onClick={handleEditConfig}
              className="p-2 rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-200 focus:outline-none cursor-pointer transition-colors duration-200"
              title="编辑配置"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button
              onClick={handleClearConfig}
              className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 focus:outline-none cursor-pointer transition-colors duration-200"
              title="清除配置"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600">配置已保存，点击下方按钮开始收藏页面内容</p>
          <div className="flex gap-2">
            <button
              onClick={handleCollect}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transform transition duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '收藏中...' : '开始收藏'}
            </button>
            <button
              onClick={handleGetLinks}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500/50 transform transition duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '识别中...' : '识别链接'}
            </button>
          </div>
          {links.length > 0 && (
            <div className="mt-4 max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-4">
              {links.map((link, index) => (
                <div
                  key={index}
                  onClick={() => handleOpenLink(link.url)}
                  className="p-2 hover:bg-gray-50 rounded cursor-pointer text-sm text-blue-600 hover:text-blue-700 truncate"
                  title={link.text}
                >
                  {link.text}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {error && <pre className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</pre>}
      {success && <pre className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">{success}</pre>}
    </div>
  );
}

export default App;
