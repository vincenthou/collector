import { FeishuConfig, CollectedData } from '@/common/types/feishu';

interface FieldInfo {
  field_name: string;
  type: string;
  property?: {
    options?: Array<{ name: string }>;
  };
}

const FEISHU_FIELD_TYPE_MAP: Record<string, string> = {
  '1': '文本',
  '2': '数字',
  '3': '单选',
  '4': '多选',
  '5': '日期',
  '7': '复选框',
  '11': '人员',
  '13': '电话号码',
  '15': '超链接',
  '17': '附件',
  '18': '关联',
  '20': '公式',
  '21': '双向关联',
  '22': '地理位置',
  '23': '群组',
  '1001': '创建时间',
  '1002': '最后更新时间',
  '1003': '创建人',
  '1004': '修改人',
  '1005': '自动编号',
};

const getFieldTypeName = (type: string): string => {
  return FEISHU_FIELD_TYPE_MAP[type] || type;
};

interface TableMetaResponse {
  code: number;
  data: {
    items: Array<FieldInfo>;
  };
}

export class FeishuService {
  private config: FeishuConfig;

  constructor(config: FeishuConfig) {
    this.config = config;
  }

  private async request(path: string, method: string, data?: any) {
    const baseUrl = 'https://open.feishu.cn/open-apis/bitable/v1';
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.config.feishuToken}`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Feishu API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getTableFields(): Promise<FieldInfo[]> {
    const path = `/apps/${this.config.appToken}/tables/${this.config.tableId}/fields`;
    const response = await this.request(path, 'GET') as TableMetaResponse;
    return response.data.items;
  }

  private validateFieldType(value: any, fieldType: string): boolean {
    switch (fieldType) {
      case '1':
        return typeof value === 'string';
      case '2':
        return typeof value === 'number';
      case '4':
        return Array.isArray(value);
      default:
        return true;
    }
  }

  async saveData(data: CollectedData): Promise<void> {
    const tableFields = await this.getTableFields();
    const fields: any = {
      'URL': {
        link: data.url,
        text: data.title
      },
      '标题': data.title,
      '描述': data.description,
      ...(data.githubInfo && {
        '标签': data.githubInfo.tags,
        '协议': data.githubInfo.license,
        'Star数': data.githubInfo.stars,
      }),
    };

    if (data.image) {
      fields['图片'] = {
        link: data.image,
        text: data.image,
      }
    }

    if (data.video) {
      fields['视频'] = {
        link: data.video,
        text: data.video,
      }
    }

    const requiredFields = [
      { name: 'URL', type: '15' },
      { name: '标题', type: '1' },
      { name: '描述', type: '1' },
      { name: '图片', type: '15' },
      { name: '视频', type: '15' },
      { name: '标签', type: '4', optional: true },
      { name: '协议', type: '3', optional: true },
      { name: 'Star数', type: '2', optional: true },
    ];

    const missingFields = requiredFields
      .filter(required => {
        if (required.optional && !data.githubInfo) return false;
        return !tableFields.some(field => field.field_name === required.name);
      })
      .map(field => field.name);

    const typeErrors = requiredFields
      .filter(required => {
        if (required.optional && !data.githubInfo) return false;
        const tableField = tableFields.find(field => field.field_name === required.name);
        return tableField && tableField.type.toString() !== required.type;
      })
      .map(field => {
        const tableField = tableFields.find(f => f.field_name === field.name);
        return `${field.name}(需要类型: ${getFieldTypeName(field.type)}, 当前类型: ${getFieldTypeName(tableField?.type || '')})`;
      });

    if (missingFields.length > 0 || typeErrors.length > 0) {
      const errorMsg = [];
      if (missingFields.length > 0) {
        errorMsg.push(`表格缺少必要字段:\n${missingFields.join('\n')}\n`);
      }
      if (typeErrors.length > 0) {
        errorMsg.push(`表格字段类型不正确:\n${typeErrors.join('\n')}`);
      }
      throw new Error(errorMsg.join('\n'));
    }

    const path = `/apps/${this.config.appToken}/tables/${this.config.tableId}/records`;
    await this.request(path, 'POST', { fields });
  }
}