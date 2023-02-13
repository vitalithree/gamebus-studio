import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';

@Pipe({
  name: 'mdToHtml'
})
export class MdToHtmlPipe implements PipeTransform {

  transform(value: any, args?: any[]): any {

    const renderer = new marked.Renderer();
    renderer.link = (href, title, text) => `<a target="_blank" href="${href}" title="${title}">${text}</a>`;

    if (value && value.length > 0) {
      return marked(value, { renderer });
    }
    return value;
  }

}
