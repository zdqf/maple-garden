import { useEffect } from 'react';

export function usePageMeta(title: string, description: string, noindex = false): void {
  useEffect(() => {
    document.title = title;
    let descriptionElement = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (descriptionElement === null) {
      descriptionElement = document.createElement('meta');
      descriptionElement.name = 'description';
      document.head.append(descriptionElement);
    }
    descriptionElement.content = description;
    let robotsElement = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (noindex) {
      if (robotsElement === null) {
        robotsElement = document.createElement('meta');
        robotsElement.name = 'robots';
        document.head.append(robotsElement);
      }
      robotsElement.content = 'noindex';
    } else if (robotsElement !== null) {
      robotsElement.remove();
    }
  }, [description, noindex, title]);
}
