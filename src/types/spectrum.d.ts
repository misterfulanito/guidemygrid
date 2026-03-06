// Declaraciones de tipos para Adobe Spectrum Web Components (UXP)
// Estos componentes son inyectados por el runtime de UXP — no son npm packages

declare namespace JSX {
  interface IntrinsicElements {
    'sp-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      variant?: 'cta' | 'primary' | 'secondary' | 'warning' | 'overBackground';
      size?: 'xs' | 's' | 'm' | 'l' | 'xl';
      disabled?: boolean | undefined;
      quiet?: boolean;
      onClick?: React.MouseEventHandler<HTMLElement>;
    };
    'sp-textfield': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      type?: string;
      value?: string;
      placeholder?: string;
      min?: string;
      max?: string;
      step?: string;
      disabled?: boolean | undefined;
      quiet?: boolean;
      multiline?: boolean;
      onInput?: React.ChangeEventHandler<HTMLInputElement>;
      onChange?: React.ChangeEventHandler<HTMLInputElement>;
      class?: string;
    };
    'sp-switch': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      checked?: boolean | undefined;
      disabled?: boolean;
      onClick?: React.MouseEventHandler<HTMLElement>;
    };
    'sp-badge': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      variant?: 'informative' | 'positive' | 'negative' | 'notice' | 'neutral';
      title?: string;
      style?: React.CSSProperties;
    };
    'sp-tabs': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      selected?: string;
      direction?: 'horizontal' | 'vertical';
      onChange?: React.ChangeEventHandler<HTMLElement & { selected: string }>;
      class?: string;
    };
    'sp-tab': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      label?: string;
      value?: string;
      disabled?: boolean;
      class?: string;
    };
    'sp-tab-panel': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      value?: string;
      class?: string;
    };
    'sp-radio-group': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      selected?: string;
      onChange?: React.ChangeEventHandler<HTMLElement & { selected: string }>;
    };
    'sp-radio': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      value?: string;
      disabled?: boolean;
    };
    'sp-action-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      size?: 'xs' | 's' | 'm' | 'l' | 'xl';
      quiet?: boolean;
      disabled?: boolean;
      title?: string;
      onClick?: React.MouseEventHandler<HTMLElement>;
      'aria-label'?: string;
    };
  }
}
