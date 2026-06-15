export type FieldType = 'text' | 'number' | 'tel' | 'textarea' | 'select' | 'hidden' | 'custom';

export interface DynamicField {
  key: string;
  type: FieldType;
  label?: string;
  placeholder?: string;
  cssClass?: string; // 'full', 'half', etc.
  options?: { label: string; value: any }[]; // For select dropdowns
  customTemplateName?: string; // Identifier for custom templates within a field
  min?: number;
  max?: number;
  rows?: number;
  validators?: string[]; // e.g. ['required', 'email', 'min:5']
  defaultValue?: any;
}

export interface DynamicSection {
  title?: string;
  stepNum?: number;
  fields?: DynamicField[];
  customTemplateName?: string; // For completely custom section content like the Location picker
  cssClass?: string; // For section layout e.g. 'form-grid'
  autoTag?: string; // e.g., 'من حسابك' for the reporter section
}

export interface DynamicFormConfig {
  sections: DynamicSection[];
  apiPath?: string;
  apiMethod?: 'POST' | 'PUT' | 'PATCH';
  payloadMapper?: (formValue: any) => any;
}
