import { FeishuConfig } from '@/common/types/feishu';

export const FEISHU_CONFIG_KEY = 'feishu_config';

export async function getFeishuConfig(): Promise<FeishuConfig | null> {
  const result = await chrome.storage.local.get(FEISHU_CONFIG_KEY);
  return result[FEISHU_CONFIG_KEY] || null;
}

export async function saveFeishuConfig(config: FeishuConfig): Promise<void> {
  await chrome.storage.local.set({ [FEISHU_CONFIG_KEY]: config });
}

export async function hasFeishuConfig(): Promise<boolean> {
  const config = await getFeishuConfig();
  return config !== null;
}

export async function clearFeishuConfig(): Promise<void> {
  await chrome.storage.local.remove(FEISHU_CONFIG_KEY);
}