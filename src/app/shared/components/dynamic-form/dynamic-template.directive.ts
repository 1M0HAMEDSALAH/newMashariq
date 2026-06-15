import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[dynamicTemplate]',
  standalone: true
})
export class DynamicTemplateDirective {
  @Input('dynamicTemplate') name!: string;
  constructor(public template: TemplateRef<any>) {}
}
