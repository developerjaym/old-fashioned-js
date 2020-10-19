class Theme {
    static DEFAULT = {
      '--background-image': 'none',
      '--main-bg-color': 'rgba(244, 244, 244, 1)',
      '--main-fg-color': 'rgb(9, 9, 9)',
      '--secondary-bg-color': 'rgb(244, 244, 244)',
      '--secondary-fg-color': 'rgb(9, 9, 9)',
      '--accent-bg-color': 'rgb(35, 135, 66)',
      '--accent-fg-color': 'rgb(244, 244, 244)',
      '--error-fg-color': 'rgb(153, 29, 13)',
      '--main-font-size': '16px',
      '--code-font-size': '14px',
      '--code-line-height': '16px',
      '--direction': 'ltr',
      '--flex-row-direction': 'row',
      '--flex-align': 'flex-end',
      '--text-align': 'left'
    };
    constructor(initialStyle) {
      this.style = initialStyle;
    }
    setTheme(newStyle) {
      this.style = newStyle;
      for (const key in this.style) {
        if (this.style[key] !== '') {
          BAR.doc.documentElement.style.setProperty(key, this.style[key]);
        }
      }
    }
    apply() {
      this.setTheme(this.style);
    }
  }