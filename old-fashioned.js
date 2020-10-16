const CommonClasses = {
   INVALID : "invalid",
   DISABLED : "disabled",
   HIDDEN : "hidden",
   WARNING : "warning"
}
const ACTION_LISTENER_CONTEXT = {};

const WEB_CONTEXT = {
  doc: document,
  window: window
};

const Position = {
   NORTH : "north",
  EAST : "east",
  SOUTH : "south",
   WEST : "west",
   CENTER : "center"
}
const LayoutType = {
   BORDER_LAYOUT : "border-layout",
   GRID_LAYOUT : "grid-layout",
   FORM_LAYOUT : "form-layout"
}
class Layout {
  
  constructor(type) {
    this.type = type;
    this.counter = 0;
  }
  getStyle() {
    throw "abstract layout";
  }
  add(newComponent, containerComponents, ...constraints) {
    containerComponents[`${this.counter++}`] = newComponent;
  }
}

class GridLayout extends Layout {
  constructor(width) {
    super(LayoutType.GRID_LAYOUT);
    this.width = width;
  }
  getStyle() {
    let gridTemplateColumns = `repeat( ${this.width}, minmax(auto, 1fr) );`;
    return `display: grid; grid-template-columns: ${gridTemplateColumns}`;
  }
}

class BorderLayout extends Layout {
  constructor() {
    super(LayoutType.BORDER_LAYOUT);
  }
  getStyle() {
    return ``;
  }
  add(newComponent, containerComponents, ...constraints) {
    newComponent.addClasses(constraints[0]);
    containerComponents[`${constraints[0]}`] = newComponent;
  }
}

const FontSize = {
   SMALL : "small-font",
   FIRST_HEADER : "first-header",
   SECOND_HEADER : "second-header",
   THIRD_HEADER : "third-header"
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
    this.observers.forEach((observer) => observer.onUpdate(this.value));
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
    this.id = `${this.classes.reverse()[0]}${Math.floor(
      Math.random() * 1000000000
    )}`;
    this.parent = null;
    this.attributes = {};
    this.element = null;
  }
  setParent(parentContainer) {
    this.parent = parentContainer;
  }
  setDisabled(disabled) {
    this.disabled = disabled;
    if (this.element) {
      this.addClasses(CommonClasses.DISABLED);
    }
    return this;
  }
  addClasses(...classes) {
    this.classes.push(...classes);
    this.element.classList.add(...classes.reverse());
  }

  removeClass(classToRemove) {
    if (this.element) {
      this.element.classList.remove(classToRemove);
    }
  }
}

class Container extends Component {
  constructor(layout = new BorderLayout(), ...classes) {
    super(["container", layout.type].concat(...classes));
    this.layout = layout;
    this.components = {};
    this.counter = 0;
    this.disabled = false;

    this.element = WEB_CONTEXT.doc.createElement("div");
    this.element.classList.add(...this.classes.reverse());
    this.element.setAttribute("id", this.id);
    this.element.style.cssText += this.layout.getStyle();
  }
 
  setDisabled(disabled) {
    this.disabled = disabled;
    for (const key of Object.keys(this.components)) {
      if (this.components[key]) {
        this.components[key].setDisabled(disabled);
      }
    }
    return this;
  }
  add(component, ...constraints) {
    this.layout.add(component, this.components, ...constraints);
    component.setParent(this);
    if (component.element) {
      this.element.appendChild(component.element);
    }
    return this;
  }
  remove(componentToRemove) {
    const newComponents = {};
    for (const key of Object.keys(this.components)) {
      if (
        this.components[key] &&
        this.components[key].id !== componentToRemove.id
      ) {
        newComponents[key] = this.components[key];
      }
    }
    componentToRemove.setParent(null);
    this.components = newComponents;
    if (componentToRemove.element && this.element.contains(componentToRemove.element)) {
      this.element.removeChild(componentToRemove.element);
    }
    return this;
  }
  removeAll() {
    for (const key of Object.keys(this.components)) {
      if (this.components[key]) {
        this.components[key].setParent(null);
        if (this.components[key].element) {
          this.element.removeChild(this.components[key].element);
        }
      }
    }
    this.components = {};
    return this;
  }
}

class ImageLabel extends Component {
  constructor(src, width, height, ...classes) {
    super(["image-label"].concat(...classes));
    this.src = src;
    this.width = width;
    this.height = height;
    this.element = WEB_CONTEXT.doc.createElement("div");
    this.element.classList.add(...this.classes.reverse());
    let heightWidth = "";
    if (this.height) {
      heightWidth = `height: ${this.height}; `;
    }
    if (this.width) {
      heightWidth += `width: ${this.width}; `;
    }
    this.element.style.cssText += heightWidth + `; background-image: url(${this.src
      }); background-repeat: no-repeat; background-size: contain;`;

    this.element.setAttribute("id", this.id);
  }
}

class LongText extends Component {
  constructor(text, ...classes) {
    super(["long-text"].concat(...classes));
    this.text = text;
    this.element = WEB_CONTEXT.doc.createElement("div");
    this.element.classList.add(...this.classes.reverse());
    this.element.appendChild;
    this.text
      .split("\n")
      .map((p) => {
        const paragraph = WEB_CONTEXT.doc.createElement("p");
        paragraph.innerText = p;
        return paragraph;
      })
      .forEach((p) => this.element.appendChild(p));
    this.element.setAttribute("id", this.id);
  }
}

class Label extends Component {
  constructor(text, ...classes) {
    super(["label"].concat(...classes));
    this.text = text;
    this.for = "";
    this.element = WEB_CONTEXT.doc.createElement("label");
    this.element.classList.add(...this.classes.reverse());
    this.element.innerText = this.text;
    this.element.setAttribute("id", this.id);
    this.element.setAttribute("for", this.for);
  }
  setFor(inputComponent) {
    this.for = inputComponent.id;
    this.element.setAttribute("for", this.for);
    return this;
  }
}

class BaseInputComponent extends Component {
  constructor(value, ...classes) {
    super(["input-component"].concat(...classes));
    this.value = value || "";
    this.actionListeners = [];

    this.element = WEB_CONTEXT.doc.createElement("input");
    this.element.classList.add(...this.classes.reverse());
    this.element.setAttribute("id", this.id);
    this.element.value = this.value;
    this.element.addEventListener("input", (e) => {
      this.value = e.target.value;
      this.actionListeners.forEach((listener) => {
        if (!this.disabled) {
          listener(this.value);
        }
      });
    });
  }
  addActionListener(actionListener) {
    this.actionListeners.push(actionListener);
    return this;
  }
  getValue() {
    return this.value;
  }
  setDisabled(disabled) {
    this.disabled = disabled;
    this.element.disabled = disabled;
    return this;
  }
}

class DropdownList extends BaseInputComponent {
  constructor(value, arraySupplier, ...classes) {
    super(value, ["dropdown"].concat(...classes));
    this.options = [];
    arraySupplier.then((arr) => {
      this.options = arr;
      this.options.forEach(option => {
        const optionElement =  WEB_CONTEXT.doc.createElement("option");
        optionElement.value = option;
        this.datalistElement.appendChild(optionElement)
      })
    });
    this.element.setAttribute("list", `${this.id}list`);

    this.datalistElement = WEB_CONTEXT.doc.createElement("datalist");
    this.datalistElement.setAttribute('id', `${this.id}list`);

    this.inputElement = this.element;
    this.element = WEB_CONTEXT.doc.createElement("div");
    this.element.appendChild(this.inputElement);
    this.element.appendChild(this.datalistElement); 
  }
  setDisabled(disabled) {
    this.disabled = disabled;
    this.inputElement.disabled = disabled;
    return this;
  }
}

class Button extends BaseInputComponent {
  constructor(value, ...classes) {
    super(value, ["button"].concat(...classes));
    this.actionListeners = [];

    this.element = WEB_CONTEXT.doc.createElement("button");
    this.element.classList.add(...this.classes.reverse());
    this.element.setAttribute("id", this.id);
    this.element.innerText = this.value;
    this.element.addEventListener("click", (e) =>
      this.actionListeners.forEach((listener) => listener()));
  }
}

class TextField extends BaseInputComponent {
  constructor(text, ...classes) {
    super(text, ["textfield"].concat(...classes));
    this.element.setAttribute("type", "text");
  }
}

class PasswordField extends BaseInputComponent {
  constructor(text, ...classes) {
    super(text, ["password"].concat(...classes));
    this.element.setAttribute("type", "password");
  }
}

class TextArea extends BaseInputComponent {
  constructor(text, ...classes) {
    super(text, ["textarea"].concat(...classes));
    this.element = WEB_CONTEXT.doc.createElement("textarea");
    this.element.classList.add(...this.classes.reverse());
    this.element.setAttribute("id", this.id);
    this.element.value = this.value;
    this.element.addEventListener("input", (e) => {
      this.value = e.target.value;
      this.actionListeners.forEach((listener) => {
        if (!this.disabled) {
          listener(this.value);
        }
      });
    });
  }
}

class DateField extends BaseInputComponent {
  constructor(text, ...classes) {
    super(text, ["datefield"].concat(...classes));
    this.element.setAttribute("type", "date");
  }
}

class NumberField extends BaseInputComponent {
  constructor(text, ...classes) {
    super(text, ["numberfield"].concat(...classes));
    this.element.setAttribute("type", "number");
  }
}

class ColorField extends BaseInputComponent {
  constructor(text, ...classes) {
    super(text, ["colorfield"].concat(...classes));
    this.element.setAttribute("type", "color");
  }
}

class Scene extends Container {
  constructor(route, title = "Scene") {
    super(new BorderLayout(), "scene");
    this.title = title;
    this.id = route;
    this.element.setAttribute("id", this.id);
    this.hidden = true;
    this.addClasses(CommonClasses.HIDDEN);
  }
  open() {
    WEB_CONTEXT.doc.title = this.title;
    this.classes = this.classes.filter((cls) => cls !== CommonClasses.HIDDEN);
    this.removeClass(CommonClasses.HIDDEN);
    this.hidden = false;
  }
  close() {
    this.hidden = true;
    this.addClasses(CommonClasses.HIDDEN);
  }
}

class SceneManager extends Container {
  constructor(title = "Old-Fashioned") {
    super(new GridLayout(), "glass");
    this.id = "glass";
    this.element = WEB_CONTEXT.doc.getElementById('glass');
    WEB_CONTEXT.doc.title = this.title;
    this.routes = {};
    this.currentRoute = undefined;
    this.previousRoutes = [];

    WEB_CONTEXT.window.addEventListener("hashchange", (event) => {
      // browser updates location, take that hash (sceneId) and route to it.
      this.routeTo(location.hash.replace(/^#/, ""));
    });
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
    if (
      this.routes[sceneId] &&
      this.currentRoute &&
      this.currentRoute.id === sceneId
    ) {
      this.previousRoutes.unshift(this.routes[sceneId]); // so we can go back to it later
    }

    for (const id of Object.keys(this.routes)) {
      if (this.routes[id] && sceneId === id) {
        this.routes[id].open();
        this.currentRoute = this.routes[id];
        WEB_CONTEXT.window.location.href = "#" + id;
      } else if (this.routes[id] && sceneId !== id) {
        this.routes[id].close();
      }
    }
  }
}
