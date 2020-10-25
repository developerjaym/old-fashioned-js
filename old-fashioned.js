const BAR = {
  doc: document,
  w: window,
  e: (t) => document.createElement(t)
};
const CommonClasses = {
  DISABLED: "disabled",
  HIDDEN: "hidden",
  WARNING: "warning",
  SMALL_CONTAINER: "width-360"
}
const Position = {
  NORTH: "north",
  EAST: "east",
  SOUTH: "south",
  WEST: "west",
  CENTER: "center"
}
const LayoutDirection = {
  ROW: "row",
  COLUMN: "column"
}
const LayoutType = {
  BORDER_LAYOUT: "border-layout",
  GRID_LAYOUT: "grid-layout",
  NCS_LAYOUT: "ncs-layout",
  FLEX_LAYOUT: "flex-layout"
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

class NcsLayout extends Layout {
  constructor() {
    super(LayoutType.NCS_LAYOUT);
  }
  getStyle() {
    return ``;
  }
  add(newComponent, containerComponents, ...constraints) {
    newComponent.addClasses(constraints[0]);
    containerComponents[`${constraints[0]}`] = newComponent;
  }
}

class FlexLayout extends Layout {
  constructor(direction = LayoutDirection.COLUMN) {
    super(LayoutType.FLEX_LAYOUT);
    this.direction = direction;
  }
  getStyle() {
    return `flex-direction: ${this.direction}`;
  }
}

const FontSize = {
  SMALL: "small-font",
  FIRST_HEADER: "first-header",
  SECOND_HEADER: "second-header",
  THIRD_HEADER: "third-header"
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
    this.e = null;
  }
  setParent(parentContainer) {
    this.parent = parentContainer;
    return this;
  }
  setDisabled(disabled) {
    this.disabled = disabled;
    if (this.disabled) {
      this.addClasses(CommonClasses.DISABLED);
    }
    else if (!this.disabled) {
      this.removeClass(CommonClasses.DISABLED);
    }
    return this;
  }
  addClasses(...classes) {
    this.classes.push(...classes);
    this.e.classList.add(...classes.reverse());
    return this;
  }

  removeClass(classToRemove) {
    this.e.classList.remove(classToRemove);
    return this;
  }
}

class Container extends Component {
  constructor(layout = new BorderLayout(), ...classes) {
    super(["container", layout.type].concat(...classes));
    this.layout = layout;
    this.components = {};
    this.counter = 0;
    this.disabled = false;

    this.e = BAR.e("div");
    this.e.classList.add(...this.classes.reverse());
    this.e.setAttribute("id", this.id);
    this.e.style.cssText += this.layout.getStyle();
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
    if (component.e) {
      this.e.appendChild(component.e);
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
    if (componentToRemove.e && this.e.contains(componentToRemove.e)) {
      this.e.removeChild(componentToRemove.e);
    }
    return this;
  }
  removeAll() {
    for (const key of Object.keys(this.components)) {
      if (this.components[key]) {
        this.components[key].setParent(null);
        if (this.components[key].e) {
          this.e.removeChild(this.components[key].e);
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
    this.e = BAR.e("div");
    this.e.classList.add(...this.classes.reverse());
    let heightWidth = "";
    if (this.height) {
      heightWidth = `height: ${this.height}; `;
    }
    if (this.width) {
      heightWidth += `width: ${this.width}; `;
    }
    this.e.style.cssText += heightWidth + `; background-image: url(${this.src
      }); background-repeat: no-repeat; background-size: contain;`;

    this.e.setAttribute("id", this.id);
  }
}

class LongText extends Component {
  constructor(text, ...classes) {
    super(["long-text"].concat(...classes));
    this.e = BAR.e("div");
    this.e.classList.add(...this.classes.reverse());
    this.e.appendChild;
    text
      .split("\n")
      .map((p) => {
        const paragraph = BAR.e("p");
        paragraph.innerText = p;
        return paragraph;
      })
      .forEach((p) => this.e.appendChild(p));
    this.e.setAttribute("id", this.id);
  }
}

class Label extends Component {
  constructor(text, ...classes) {
    super(["label"].concat(...classes));
    this.e = BAR.e("label");
    this.e.classList.add(...this.classes.reverse());
    this.e.innerText = text;
    this.e.setAttribute("id", this.id);
  }
  setFor(inputComponent) {
    this.for = inputComponent.id;
    this.e.setAttribute("for", this.for);
    return this;
  }
}

class BaseInputComponent extends Component {
  constructor(value, ...classes) {
    super(["input-component"].concat(...classes));
    this.actionListeners = [];

    this.e = BAR.e("input");
    this.e.classList.add(...this.classes.reverse());
    this.e.setAttribute("id", this.id);
    this.e.value = value || "";
    this.e.addEventListener("input", (e) => {
      this.actionListeners.forEach((listener) => {
        if (!this.disabled) {
          listener(e.target.value);
        }
      });
    });
  }
  addActionListener(actionListener) {
    this.actionListeners.push(actionListener);
    return this;
  }
  getValue() {
    return this.e.value;
  }
  setDisabled(disabled) {
    this.disabled = disabled;
    this.e.disabled = disabled;
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
        const optionElement = BAR.e("option");
        optionElement.value = option;
        this.datalistElement.appendChild(optionElement)
      })
    });
    this.e.setAttribute("list", `${this.id}list`);

    this.datalistElement = BAR.e("datalist");
    this.datalistElement.setAttribute('id', `${this.id}list`);
    this.e.appendChild(this.datalistElement);
  }
  setDisabled(disabled) {
    this.disabled = disabled;
    this.e.disabled = disabled;
    return this;
  }
}

class Button extends BaseInputComponent {
  constructor(value, ...classes) {
    super(value, ["button"].concat(...classes));
    this.actionListeners = [];

    this.e = BAR.e("button");
    this.e.classList.add(...this.classes.reverse());
    this.e.setAttribute("id", this.id);
    this.e.innerText = value;
    this.e.addEventListener("click", (e) =>
      this.actionListeners.forEach((listener) => listener()));
  }
}

class TextField extends BaseInputComponent {
  constructor(text, ...classes) {
    super(text, ["textfield"].concat(...classes));
    this.e.setAttribute("type", "text");
  }
}

class PasswordField extends BaseInputComponent {
  constructor(text, ...classes) {
    super(text, ["password"].concat(...classes));
    this.e.setAttribute("type", "password");
  }
}

class TextArea extends BaseInputComponent {
  constructor(text, ...classes) {
    super(text, ["textarea"].concat(...classes));
    this.e = BAR.e("textarea");
    this.e.classList.add(...this.classes.reverse());
    this.e.setAttribute("id", this.id);
    this.e.value = text || "";
    this.e.addEventListener("input", (e) => {
      this.actionListeners.forEach((listener) => {
        if (!this.disabled) {
          listener(e.target.value);
        }
      });
    });
  }
}

class DateField extends BaseInputComponent {
  constructor(text, ...classes) {
    super(text, ["datefield"].concat(...classes));
    this.e.setAttribute("type", "date");
  }
}

class NumberField extends BaseInputComponent {
  constructor(text, ...classes) {
    super(text, ["numberfield"].concat(...classes));
    this.e.setAttribute("type", "number");
  }
}

class ColorField extends BaseInputComponent {
  constructor(text, ...classes) {
    super(text, ["colorfield"].concat(...classes));
    this.e.setAttribute("type", "color");
  }
}

class Scene extends Container {
  constructor(route, title = "Scene") {
    super(new BorderLayout(), "scene");
    this.title = title;
    this.id = route;
    this.e.setAttribute("id", this.id);
    this.hidden = true;
    this.addClasses(CommonClasses.HIDDEN);
  }
  open() {
    BAR.doc.title = this.title;
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
    this.e = BAR.doc.getElementById('glass');
    this.e.innerText = '';
    BAR.doc.title = this.title;
    this.routes = {};

    BAR.w.addEventListener("hashchange", (event) => {
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
  routeTo(sceneId) {
    for (const id of Object.keys(this.routes)) {
      if (this.routes[id] && sceneId === id) {
        this.routes[id].open();
        BAR.w.location.href = "#" + id;
      } else if (this.routes[id] && sceneId !== id) {
        this.routes[id].close();
      }
    }
  }
}
