export interface FeishuConfig {
  appId: string;
  appSecret: string;
  appToken: string;
  tableId: string;
}

export interface TenantAccessTokenResponse {
  code: number;
  msg: string;
  tenant_access_token: string;
  expire: number;
}

export interface CollectedData {
  url: string;
  title: string;
  description: string;
  image: string;
  video: string;
  githubInfo?: {
    tags: string[];
    license: string;
    stars: number;
    readme?: string;
  };
}