const ACTION_LISTENER_CONTEXT = {};

const WEB_CONTEXT = {
  doc: document
}

class Position {
  static NORTH = "north";
  static EAST = "east";
  static SOUTH = "south";
  static WEST = "west";
  static CENTER = "center";
}
class Layout {
  static BORDER_LAYOUT = "border-layout";
  static GRID_LAYOUT = "grid-layout";
  static FORM_LAYOUT = "form-layout";
  constructor(type) {
    this.type = type;
  }
  getStyle() {
    throw 'no style selected';
  }
}

class GridLayout extends Layout {
  constructor(width) {
    super(Layout.GRID_LAYOUT);
    this.width = width;
  }
  getStyle() {
    let gridTemplateColumns = `repeat( ${this.width}, minmax(auto, 1fr) );`;
    return `display: grid; grid-template-columns: ${gridTemplateColumns}`;
  }
}

class BorderLayout extends Layout {
  constructor() {
    super(Layout.BORDER_LAYOUT);
  }
  getStyle() {
    return ``;
  }
}

class FontSize {
  static SMALL = "small-font";
  static MEDIUM = "medium-font";
  static LARGE = "large-font";
}

class Observer {
  onUpdate(message) {
    throw "NYI";
  }
}

class Component extends Observer {
  constructor(...classes) {
    super();
    this.classes = ["component"].concat(...classes);
    this.id = `${this.classes.reverse()[0]}${Math.floor(Math.random() * 1000000000)}`;
  }
  getHtml() {
    throw "NYI";
  }
}

class Container extends Component {
  constructor(layout = new BorderLayout(), ...classes) {
    super(["container", layout.type].concat(...classes));
    this.layout = layout;
    this.components = {};
    this.counter = 0;
  }
  getHtml() {
    let html = `<div class="${this.classes.join(" ")}" style="${this.layout.getStyle()}" id="${this.id}">`;
    html += this.getInnerHtml();
    html += `</div>`;
    return html;
  }
  getInnerHtml() {
    let innerHTML = '';
    for (const property in this.components) {
      const value = this.components[property];
      innerHTML += value.getHtml();
    }
    return innerHTML;
  }
  add(component, ...constraints) {
    switch (this.layout.type) {
      case Layout.BORDER_LAYOUT:
        component.classes.push(constraints[0]);
        this.components[`${constraints[0]}`] = component;
        break;
      case Layout.GRID_LAYOUT:
      default:
        this.components[`${this.counter++}`] = component;
        break;
    }
    this.paint();
    return this;
  }
  remove(componentToRemove) {
    const newComponents = {};
    for (const key of Object.keys(this.components)) {
      if (this.components[key] && this.components[key].id !== componentToRemove.id) {
        newComponents[key] = this.components[key];
      }
    }
    this.components = newComponents;
    this.paint();
    return this;
  }
  paint() {
    if (WEB_CONTEXT.doc.getElementById(this.id)) {
      WEB_CONTEXT.doc.getElementById(this.id).innerHTML = this.getInnerHtml();
    }
  }
}

class ImageLabel extends Component {
  constructor(src, width, height, ...classes) {
    super(["image-label"].concat(...classes));
    this.src = src;
    this.width = width;
    this.height = height;
  }
  getHtml() {
    let heightWidth = '';
    if (this.height) {
      heightWidth = `height: ${this.height}; `;
    }
    if (this.width) {
      heightWidth += `width: ${this.width}; `;
    }
    // background-image: url("data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9JzMwMHB4JyB3aWR0aD0nMzAwcHgnICBmaWxsPSIjMDAwMDAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGRhdGEtbmFtZT0iTGF5ZXIgMSIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHg9IjBweCIgeT0iMHB4Ij48dGl0bGU+Q29ja3RhaWxfR2xhc3N3YXJlXzAxX1BlcnNwZWN0aXZlPC90aXRsZT48cGF0aCBkPSJNNjkuMDA1OSwxNy4yNjMyQzYzLjkyMzgsMTYuNzcxLDU3LjE3MzgsMTYuNSw1MCwxNi41cy0xMy45MjM4LjI3MS0xOS4wMDU5Ljc2MzJjLTguMDc4Ni43ODI3LTguNzM1OCwxLjc0MzEtOC43MzU4LDIuODI2NmEuOTcuOTcsMCwwLDAsLjAwNjMuMTExOWw2LjM2NzIsNTYuNDc0MUE0LjUzMjMsNC41MzIzLDAsMCwwLDMxLjU0LDgwLjQyLDUyLjY4MjYsNTIuNjgyNiwwLDAsMCw0OS45NTU2LDgzLjVhNTMuMjYwOSw1My4yNjA5LDAsMCwwLDE4LjQ5MzEtMy4wODMsNC41Myw0LjUzLDAsMCwwLDIuOTItMy43NDk1bDYuMzY2My01Ni40NjU4YS45Ny45NywwLDAsMCwuMDA2My0uMTExOUM3Ny43NDE3LDE5LjAwNjMsNzcuMDg0NSwxOC4wNDU5LDY5LjAwNTksMTcuMjYzMlpNNTAsMTguNWMxNC4xMjksMCwyMy4zOTI5LDEuMDI1LDI1LjUzLDEuODYxOEM3Mi45MjU2LDIxLjIxODQsNjMuOTE3MiwyMi4xOCw1MCwyMi4xOHMtMjIuOTI1Ni0uOTYxMy0yNS41My0xLjgxNzlDMjYuNjA3MSwxOS41MjUsMzUuODcxLDE4LjUsNTAsMTguNVpNNjkuMzgxOCw3Ni40NDM0YTIuNTQsMi41NCwwLDAsMS0xLjYzNzIsMi4xMDE1QTUxLjIyMTUsNTEuMjIxNSwwLDAsMSw0OS45NTU2LDgxLjVhNTAuNjUsNTAuNjUsMCwwLDEtMTcuNzA3MS0yLjk1LDIuNTQwNiwyLjU0MDYsMCwwLDEtMS42Mjk0LTIuMDk4NkwyNC40MDEyLDIxLjMwMjlDMjkuOTI4NiwyMy4xMTc3LDQ3LjY1MTIsMjMuMTgsNTAsMjMuMThzMjAuMDcxNC0uMDYyLDI1LjU5ODgtMS44NzY4WiI+PC9wYXRoPjwvc3ZnPg==");

    return `<div class="${this.classes.join(" ")}" id="${this.id}" style="${heightWidth}; background-image: url(${this.src}); background-repeat: no-repeat; background-size: contain;"></div>`
  }
}

class Label extends Component {
  constructor(text, ...classes) {
    super(["label"].concat(...classes));
    this.text = text;
  }
  getHtml() {
    return `<label class="${this.classes.join(" ")}"  id="${this.id}">${this.text}</label>`;
  }
}

class Button extends Label {
  constructor(text, ...classes) {
    super(text, ["button"].concat(...classes));
    this.actionListeners = [];
    ACTION_LISTENER_CONTEXT[this.id] = () => this.actionListeners.forEach(listener => listener());
  }
  addActionListener(actionListener) {
    this.actionListeners.push(actionListener);
  }
  getHtml() {
    return `<button class="${this.classes.join(" ")}" onclick="ACTION_LISTENER_CONTEXT['${this.id}']()"  id="${this.id}">${this.text}</button>`;
  }
}

class TextComponent extends Component {
  constructor(text, ...classes) {
    super(["text-component"].concat(...classes));
    this.text = text || '';
    this.actionListeners = [];
    ACTION_LISTENER_CONTEXT[`${this.id}`] = (e) => this.text = e.target.value;
  }
  addActionListener(actionListener) {
    this.actionListeners.push(actionListener);
  }
  getValue() {
    return this.text;
  }
  getHtml() {
    throw 'abstract';
  }
}

class TextField extends TextComponent {
  constructor(text, ...classes) {
    super(text, ["textfield"].concat(...classes));
  }
  getHtml() {
    return `<input type="text" class="${this.classes.join(" ")}" value="${this.text}" onInput="ACTION_LISTENER_CONTEXT['${this.id}'](event)"  id="${this.id}">`;
  }
}

class TextArea extends TextComponent {
  constructor(text, ...classes) {
    super(text, ["textarea"].concat(...classes));
  }
  getHtml() {
    return `<textarea class="${this.classes.join(" ")}" onInput="ACTION_LISTENER_CONTEXT['${this.id}'](event)"  id="${this.id}">${this.text}</textarea>`;
  }
}

class Theme {
  static DEFAULT = {
    '--background-image': 'none',
    '--main-bg-color': 'rgba(244, 244, 244, 1)',
    '--main-fg-color': 'rgb(9, 9, 9)',
    '--secondary-bg-color': 'rgb(244, 244, 244)',
    '--secondary-fg-color': 'rgb(9, 9, 9)',
    '--accent-bg-color': 'rgb(35, 135, 66)',
    '--accent-fg-color': 'rgb(244, 244, 244)',
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
        WEB_CONTEXT.doc.documentElement.style.setProperty(key, this.style[key]);
      }
    }
  }
  apply() {
    this.setTheme(this.style);
  }
}

class Scene extends Container {
  constructor(route, title = "Scene", theme = Theme.DEFAULT) {
    super(new BorderLayout(), "scene");
    this.title = title;
    this.id = route;
    this.theme = new Theme(theme);
    this.hidden = true;
    this.classes.push('hidden');
  }
  open() {
    WEB_CONTEXT.doc.title = this.title;
    this.classes.splice(this.classes.indexOf("hidden"), 1);
    this.hidden = false;
    this.paint();
  }
  close() {
    this.hidden = true;
    if (!this.classes.includes("hidden")) {
      this.classes.push("hidden");
    }
  }
}

class SceneManager extends Container {
  constructor(title = "Old-Fashioned", theme = Theme.DEFAULT) {
    super(new GridLayout(), "glass");
    this.id = 'glass';
    this.theme = new Theme(theme);
    this.routes = {};
    this.currentRoute = undefined;
    this.previousRoutes = [];
  }
  createScene(route, title) {
    const newScene = new Scene(route, title, this.theme);
    this.add(newScene);
    return newScene;
  }
  add(scene) {
    this.routes[scene.id] = scene;
    return super.add(scene);
  }
  remove(scene) {
    delete this.routes[scene.id];
    return super.remove(scene);
  }
  goBack() {
    this.routeTo(this.previousRoutes.shift().id);
  }
  routeTo(sceneId) {
    if (this.routes[sceneId] && this.currentRoute && this.currentRoute.id === sceneId) {
      this.previousRoutes.unshift(this.routes[sceneId]); // so we can go back to it later
    }

    for (const id of Object.keys(this.routes)) {
      if (this.routes[id] && sceneId === id) {
        this.routes[id].open();
        this.currentRoute = this.routes[id];
        window.location.href = "#" + id;
      }
      else if (this.routes[id] && sceneId !== id) {
        this.routes[id].close();
      }
    }
    this.paint();
  }
}