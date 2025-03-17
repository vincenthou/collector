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

    return { tags, license, stars };
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
    const description = this.isGitHubPage() ? document.title.split(':')[1].trim() : this.getMetaContent('description') || 
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