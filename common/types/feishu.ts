export interface FeishuConfig {
  feishuToken: string;
  appToken: string;
  tableId: string;
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