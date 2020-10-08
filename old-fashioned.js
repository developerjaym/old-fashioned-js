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
    throw 'abstract layout';
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

class Controller {
  constructor(model) {
    this.model = model;
  }
  onModelUpdate(newValue) {
    this.model.onUpdate(newValue);
  }
}

class Model {
  constructor(value = {}) {
    this.value = value;
    this.observers = [];
  }
  addObserver(observer) {
    this.observers.push(observer);
    return this;
  }
  onUpdate(newValue) {
    this.value = newValue;
    this.observers.forEach(observer => observer.onUpdate(this.value));
  }
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
    this.parent = null;
  }
  getHtml() {
    throw "NYI";
  }
  setParent(parentContainer) {
    this.parent = parentContainer;
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
      case Layout.FORM_LAYOUT:
      case Layout.BORDER_LAYOUT:
        component.classes.push(constraints[0]);
        this.components[`${constraints[0]}`] = component;
        break;
      case Layout.GRID_LAYOUT:
      default:
        this.components[`${this.counter++}`] = component;
        break;
    }
    component.setParent(this);
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
    componentToRemove.setParent(null);
    this.components = newComponents;
    this.paint();
    return this;
  }
  removeAll() {
    for (const key of Object.keys(this.components)) {
      if (this.components[key]) {
        this.components[key].setParent(null);
      }
    }
    this.components = {};
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
    return `<div class="${this.classes.join(" ")}" id="${this.id}" style="${heightWidth}; background-image: url(${this.src}); background-repeat: no-repeat; background-size: contain;"></div>`
  }
}

class Label extends Component {
  constructor(text, ...classes) {
    super(["label"].concat(...classes));
    this.text = text;
    this.for = '';
  }
  getHtml() {
    return `<label ${this.for} class="${this.classes.join(" ")}"  id="${this.id}">${this.text}</label>`;
  }
  setFor(inputComponent) {
    this.for = `for="${inputComponent.id}"`;
    return this;
  }
}

class BaseInputComponent extends Component {
  constructor(value, ...classes) {
    super(["input-component"].concat(...classes));
    this.value = value || '';
    this.actionListeners = [];
    ACTION_LISTENER_CONTEXT[`${this.id}`] = (e) => {
      this.value = e.target.value;
      this.actionListeners.forEach(listener => listener(this.value));
    };
  }
  addActionListener(actionListener) {
    this.actionListeners.push(actionListener);
  }
  getValue() {
    return this.value;
  }
  getHtml() {
    throw 'abstract';
  }
}

class DropdownList extends BaseInputComponent {
  constructor(value, arraySupplier, ...classes) {
    super(value, ["dropdown"].concat(...classes));
    this.options = [];
    arraySupplier.then(
      arr => {
        this.options = arr;
        if(this.parent) {
          this.parent.paint();
        }
      }
     );
  }
  getHtml() {
    return `
    <input list="${this.id}list" class="${this.classes.join(" ")}" value="${this.value}" onInput="ACTION_LISTENER_CONTEXT['${this.id}'](event)">

    <datalist id="${this.id}list">
      ${this.options.map(option => `<option value="${option}">`).join(" ")}
    </datalist>
    `
    // return `<button class="${this.classes.join(" ")}" onclick="ACTION_LISTENER_CONTEXT['${this.id}']()"  id="${this.id}">${this.value}</button>`;
  }
}

class Button extends BaseInputComponent {
  constructor(value, ...classes) {
    super(value, ["button"].concat(...classes));
    this.actionListeners = [];
    ACTION_LISTENER_CONTEXT[`${this.id}`] = () => this.actionListeners.forEach(listener => listener());
  }
  getHtml() {
    return `<button class="${this.classes.join(" ")}" onclick="ACTION_LISTENER_CONTEXT['${this.id}']()"  id="${this.id}">${this.value}</button>`;
  }
}

class TextField extends BaseInputComponent {
  constructor(text, ...classes) {
    super(text, ["textfield"].concat(...classes));
  }
  getHtml() {
    return `<input type="text" class="${this.classes.join(" ")}" value="${this.value}" onInput="ACTION_LISTENER_CONTEXT['${this.id}'](event)"  id="${this.id}">`;
  }
}

class TextArea extends BaseInputComponent {
  constructor(text, ...classes) {
    super(text, ["textarea"].concat(...classes));
  }
  getHtml() {
    return `<textarea class="${this.classes.join(" ")}" onInput="ACTION_LISTENER_CONTEXT['${this.id}'](event)"  id="${this.id}">${this.value}</textarea>`;
  }
}

class DateField extends BaseInputComponent {
  constructor(text, ...classes) {
    super(text, ["datefield"].concat(...classes));
  }
  getHtml() {
    return `<input type="date" class="${this.classes.join(" ")}" value="${this.value}" onInput="ACTION_LISTENER_CONTEXT['${this.id}'](event)"  id="${this.id}">`;
  }
}

class NumberField extends BaseInputComponent {
  constructor(text, ...classes) {
    super(text, ["numberfield"].concat(...classes));
  }
  getHtml() {
    return `<input type="number" class="${this.classes.join(" ")}" value="${this.value}" onInput="ACTION_LISTENER_CONTEXT['${this.id}'](event)"  id="${this.id}">`;
  }
}

class ColorField extends BaseInputComponent {
  constructor(text, ...classes) {
    super(text, ["colorfield"].concat(...classes));
  }
  getHtml() {
    return `<input type="color" class="${this.classes.join(" ")}" value="${this.value}" onInput="ACTION_LISTENER_CONTEXT['${this.id}'](event)"  id="${this.id}">`;
  }
}

class Scene extends Container {
  constructor(route, title = "Scene") {
    super(new BorderLayout(), "scene");
    this.title = title;
    this.id = route;
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
  constructor(title = "Old-Fashioned") {
    super(new GridLayout(), "glass");
    this.id = 'glass';
    this.routes = {};
    this.currentRoute = undefined;
    this.previousRoutes = [];
  }
  createScene(route, title) {
    const newScene = new Scene(route, title);
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