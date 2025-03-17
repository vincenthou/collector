import { CollectedData } from '@/common/types/feishu';

export class ContentCollector {
  private isGitHubPage(): boolean {
    return window.location.hostname === 'github.com';
  }

  private getMetaContent(name: string): string {
    const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    return meta?.getAttribute('content') || '';
  }

  private async collectGitHubInfo() {
    if (!this.isGitHubPage()) return undefined;

    const tagsElements = document.querySelectorAll('a.topic-tag');
    const tags = Array.from(tagsElements).map(el => el.textContent?.trim() || '');

    const licenseElements = document.querySelectorAll('a.Link--muted');
    const license = Array.from(licenseElements)
      .find(el => el.textContent?.toLowerCase().includes('license'))?.textContent?.trim() || '';

    const starsElement = document.querySelector('#repo-stars-counter-star');
    const stars = parseInt(starsElement?.getAttribute('title')?.replace(',', '') || '0', 10);

    // 从URL中获取owner和repo信息
    const pathParts = window.location.pathname.split('/');
    const owner = pathParts[1];
    const repo = pathParts[2];
    
    // 构建README.md的raw URL
    const readmeUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`;
    let readme = '';
    try {
      const response = await fetch(readmeUrl);
      if (response.ok) {
        readme = await response.text();
      } else {
        // 如果main分支不存在，尝试master分支
        const masterReadmeUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/README.md`;
        const masterResponse = await fetch(masterReadmeUrl);
        if (masterResponse.ok) {
          readme = await masterResponse.text();
        }
      }
    } catch (error) {
      console.error('Failed to fetch README:', error);
      // 如果获取失败，回退到DOM方式
      const readmeElement = document.querySelector('.markdown-body');
      readme = readmeElement?.textContent?.trim() || '';
    }

    return { tags, license, stars, readme };
  }

  private getImage(): string {
    const wrapperClass = this.isGitHubPage() ? '.markdown-body' : '';
    const images: HTMLMediaElement[] = Array.from(document.querySelectorAll(`${wrapperClass} img`));
    const urls = images
      .map(img => img.src)
      .filter(url => url && !url.startsWith('data:') && !url.includes('avatar') && !url.includes('icon'))
      .filter(url => url.includes('png') || url.includes('jpg') || url.includes('jpeg'));
    if (urls.length > 0) {
      // 优先使用gif
      const image = urls.find(url => url.includes('gif'));
      if (image) {
        return image;
      }
      return urls[0];
    }
    return '';
  }

  private getVideo(): string {
    const wrapperClass = this.isGitHubPage() ? '.markdown-body' : '';
    const videos: HTMLMediaElement[] = Array.from(document.querySelectorAll(`${wrapperClass} video`));
    const urls = videos.map((video) => video.src).filter(Boolean);
    return urls.length ? urls[0]: '';
  }

  private getGitHubTitle(): string {
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length >= 3) {
      return pathParts[2]; // 返回项目名称
    }
    return document.title;
  }

  async collect(): Promise<CollectedData> {
    const url = window.location.href;
    const title = this.isGitHubPage() ? this.getGitHubTitle() : document.title;
    const titleParts = document.title.split(':');
    const description = this.isGitHubPage() ? titleParts.slice(1, titleParts.length).join(':')?.trim() : this.getMetaContent('description') || 
                       this.getMetaContent('og:description') || 
                       document.querySelector('p')?.textContent || '';

    return {
      url,
      title,
      description,
      image: this.getImage(),
      video: this.getVideo(),
      githubInfo: await this.collectGitHubInfo(),
    };
  }
}