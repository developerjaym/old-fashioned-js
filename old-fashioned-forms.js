const FormClasses = {
  FORM_LABEL: 'form-label',
  INVALID: "invalid",
  FORM: "form"
}
class Validator {
  constructor(label, invalid) {
    this.label = label;
    this.invalid = invalid;
  }
}

class RegexValidator extends Validator {
  constructor(label, regex) {
    super(
      label,
      (val) =>
        val && ![].concat(val.match(regex)).some((match) => match === val)
    );
  }
}

const StringValidators = {
  NOT_EMPTY: new Validator("Required", (val) => !val),
  OF_LENGTH: (min, max) =>
    new Validator(
      `Input must be between ${min} and ${max} characters.`,
      (val) => !val || val.length < min || val.length > max
    )
}

const ArrayValidators = {
  NOT_EMPTY: new Validator("Required", (val) =>
    !val || !JSON.parse(val).length
  )

}

const DateValidators = {
  BEFORE: (max) =>
    new Validator(
      `Date must be before ${max}.`,
      (val) => val && new Date(val + 'T23:59:59.999Z') >= new Date(max + 'T23:59:59.999Z')
    ),
  AFTER: (min) =>
    new Validator(
      `Date must be after ${min}`,
      (val) => val && new Date(val + 'T23:59:59.999Z') <= new Date(min + 'T23:59:59.999Z')
    ),
  BETWEEN: (min, max) =>
    new Validator(
      `Date must be between ${min} and ${max}`,
      (val) =>
        val &&
        (new Date(val) <= new Date(min) || new Date(val + 'T23:59:59.999Z') >= new Date(max + 'T23:59:59.999Z'))
    ),
  AFTER_TODAY: new Validator("Date must be after today.", (val) => val && new Date(val + 'T23:59:59.999Z') <= new Date())
}

class FormContainer extends Container {
  constructor(layout = new BorderLayout(), ...classes) {
    super(layout, ...classes);
    this.e = BAR.e2("div", this.id, this.classes);
    this.e.style.cssText += this.layout.getStyle();
  }
}

class BaseFormEntry {
  constructor(key, value, label, ...validators) {
    this.key = key;
    this.value = value;
    this.label = label;
    this.validators = [].concat(...validators);
    this.actionListeners = [];
  }
  getValidationErrors() {
    return this.validators.filter((validator) =>
      validator.invalid(this.getValue())
    );
  }
  getObject() {
    throw "abstract base form entry";
  }
  getComponent() {
    throw "abstract base form entry";
  }
  setDisabled(disabled) {
    throw "abstract base form entry";
  }
  addActionListener(listener) {
    this.actionListeners.push(listener);
  }
}
class BaseInputFormEntry extends BaseFormEntry {
  constructor(key, value, label, inputComponent, ...validators) {
    super(key, value, label, ...validators);
    this.component = new Container(new FlexLayout());
    this.inputComponent = inputComponent;
    this.changed = true;
    this.validationErrors = [];
    this.inputComponent.addActionListener((v) => {
      this.changed = true;
      this.getValidationErrors();
      this.actionListeners.forEach(listener => listener(v));
    });
    this.validationErrorsContainer = new Container(
      new GridLayout(1)
    );
    if (this.label) {
      this.component
        .add(new Label(this.label, FormClasses.FORM_LABEL).setFor(this.inputComponent), Position.NORTH);
    }
    this.component.add(this.inputComponent, Position.CENTER)
      .add(this.validationErrorsContainer, Position.SOUTH);
  }
  getValidationErrors() {
    if (!this.changed) {
       return this.validationErrors;
    }
    this.validationErrorsContainer.removeAll();
    this.validationErrors = super.getValidationErrors();
    this.validationErrors.forEach((error) =>
      this.validationErrorsContainer.add(new Label(error.label, FormClasses.INVALID, FormClasses.FORM_LABEL))
    );
    this.changed = false;
    return this.validationErrors;
  }
  getValue() {
    return this.inputComponent.getValue();
  }
  getObject() {
    return `"${this.key}": ${this.getValue() ? `${JSON.stringify(this.getValue())}` : null}`;
  }
  getComponent() {
    return this.component;
  }
  setDisabled(disabled) {
    this.inputComponent.setDisabled(disabled);
    return this;
  }
}
class BaseArrayFormEntry extends BaseInputFormEntry {
  constructor(key, value, label, addLabel) {
    super(key, value, label, new TextField(""));
    this.component.remove(this.inputComponent);
    this.inputContainer = new Container();
    this.childrenContainer = new Container(new FlexLayout(LayoutDirection.COLUMN));
    this.inputContainer.add(this.childrenContainer, Position.CENTER);
    this.children = [];
    this.arrayLevelValidators = [];
    this.elementLevelValidators = [];
    this.additionalComponents = [];
    this.value.forEach(item => {
      this.supplyChild(item);
    });
    this.addButton = new Button(addLabel).addActionListener(e => this.supplyChild());
    this.inputContainer.add(this.addButton, Position.SOUTH);
    this.component.add(this.inputContainer, Position.CENTER);
  }
  addArrayLevelValidators(...arrayLevelValidators) {
    this.arrayLevelValidators = this.arrayLevelValidators.concat(...arrayLevelValidators);
    return this;
  }
  addElementLevelValidators(...elementLevelValidators) {
    this.elementLevelValidators = this.elementLevelValidators.concat(...elementLevelValidators);
    this.children.forEach(child => child.validators.push(...elementLevelValidators));
    return this;
  }
  supplyChild(val) {
    throw 'abstract BaseArrayFormEntry';
  }
  getValue() {
    return `[${this.children.map(child => `${JSON.stringify(child.getValue())}`)}]`;
  }
  getObject() {
    return `"${this.key}": ${this.getValue() ? `${this.getValue()}` : '[]'}`;
  }
  getValidationErrors() {
    this.validationErrorsContainer.removeAll();
    const arrayLevelValidationErrors = this.arrayLevelValidators.filter((validator) =>
      validator.invalid(this.getValue())
    );
    arrayLevelValidationErrors.forEach((error) =>
      this.validationErrorsContainer.add(new Label(error.label, FormClasses.INVALID, FormClasses.FORM_LABEL))
    );
    return arrayLevelValidationErrors.concat(this.children.reduce((pre, cur) => pre.concat(cur.getValidationErrors()), []));
  }
}
class TextArrayFormEntry extends BaseArrayFormEntry {
  constructor(key, value, label, addLabel) {
    super(key, value, label, addLabel);
  }
  supplyChild(val) {
    const textField = new TextFormEntry('', val, '', this.elementLevelValidators);
    this.children.push(textField);
    const xButton = new Button("X", CommonClasses.WARNING, 'start')
    .addActionListener(e => {
      this.children.splice(this.children.indexOf(textField), 1);
      this.childrenContainer.remove(container)
      this.getValidationErrors();
    });
    this.additionalComponents.push(xButton);
    const container = new Container(new BorderLayout(), CommonClasses.SMALL_CONTAINER)
      .add(textField.getComponent(), Position.CENTER)
      .add(xButton
        ,
        Position.EAST
      );
    this.childrenContainer.add(container);
    this.getValidationErrors();
  }
  setDisabled(disabled) {
    if(disabled) {
      this.inputContainer.remove(this.addButton);
    }
    else {
      this.inputContainer.add(this.addButton, Position.SOUTH);
    }
    this.additionalComponents.forEach(comp => comp.e.setAttribute("hidden", disabled));
    for(const child of this.children) {
      child.setDisabled(disabled);
    }
    for(const additional of this.additionalComponents) {
      additional.setDisabled(disabled);
    }
  }
}
class CheckboxFormEntry extends BaseInputFormEntry {
  constructor(key, value, label, ...validators) {
    super(key, value, label, new Checkbox(value || false), ...validators);
  }
  getObject() {
    return `"${this.key}": ${this.getValue() ? `${this.getValue()}` : false}`;
  }
}
class TextFormEntry extends BaseInputFormEntry {
  constructor(key, value, label, ...validators) {
    super(key, value, label, new TextField(value || ""), ...validators);
  }
}
class TextAreaFormEntry extends BaseInputFormEntry {
  constructor(key, value, label, ...validators) {
    super(key, value, label, new TextArea(value || ""), ...validators);
  }
}
class PasswordFormEntry extends BaseInputFormEntry {
  constructor(key, value, label, ...validators) {
    super(key, value, label, new PasswordField(value || ""), ...validators);
  }
}
class NumberFormEntry extends BaseInputFormEntry {
  constructor(key, value, label, ...validators) {
    super(key, value, label, new NumberField(value || 0), ...validators);
  }
  getObject() {
    return `"${this.key}": ${this.getValue() ? `${this.getValue()}` : null}`;
  }
}
class DropdownListFormEntry extends BaseInputFormEntry {
  constructor(key, value, label, arraySupplier, ...validators) {
    super(
      key,
      value,
      label,
      new DropdownList(value || "", arraySupplier),
      ...validators
    );
  }
}

class DateFormEntry extends BaseInputFormEntry {
  constructor(key, value, label, ...validators) {
    super(key, value, label, new DateField(value || ""), ...validators);
  }
}

class FormEntryGroup extends BaseFormEntry {
  constructor(key, value, label, ...validators) {
    super(key, value, label, ...validators);
    this.children = [];
    this.component = new Container(new GridLayout(1));
    this.validationErrorsContainer = new Container(
      new GridLayout(1)
    );
    this.removableGroup = false;
    this.onRemoval = () => { };
    this.removeButton = new Button("Remove", CommonClasses.WARNING).addActionListener((e) => this.onRemoval());
  }
  addRemovalListener(removalListener) {
    this.onRemoval = removalListener;
    return this;
  }
  removable() {
    this.removableGroup = true;
    return this;
  }
  getGroupLevelValidationErrors() {
    this.validationErrorsContainer.removeAll();
    const validationErrors = super.getValidationErrors();
    validationErrors.forEach((error) =>
      this.validationErrorsContainer.add(new Label(error.label, FormClasses.INVALID, FormClasses.FORM_LABEL))
    );
    return validationErrors;
  }
  getValidationErrors() {
    const validationErrors = this.getGroupLevelValidationErrors();
    const childErrors = this.children.filter(
      (child) => child.getValidationErrors().length > 0
    );
    return childErrors.concat(
      validationErrors
    );
  }
  addChildren(...formEntry) {
    this.component.removeAll();
    if (this.removableGroup) {
      this.component.add(new Container(new NcsLayout()).add(
        new Label(this.label, FontSize.SECOND_HEADER), Position.CENTER
      )
        .add(
          this.removeButton, Position.SOUTH
        )
      );
    }
    else {
      this.component.add(new Label(this.label, FontSize.SECOND_HEADER));

    }
    this.component.add(this.validationErrorsContainer);
    this.children.push(...formEntry);
    this.children.forEach((child) => {
      this.component.add(child.getComponent());
      child.addActionListener(v => this.getGroupLevelValidationErrors());
    });
    return this;
  }
  addReaction(formEntry, dependentFormEntry, shouldDisplayFunction) {
    this.addChildren(formEntry);
    shouldDisplayFunction(formEntry.getValue()) ?
      this.addChildren(dependentFormEntry)
      : this.removeChild(dependentFormEntry)
    formEntry.addActionListener(v => shouldDisplayFunction(v) ?
      this.addChildren(dependentFormEntry)
      : this.removeChild(dependentFormEntry));
    return this;
  }
  removeChild(formEntry) {
    if (!this.children.includes(formEntry)) {
      return;
    }
    this.children.splice(this.children.indexOf(formEntry), 1);
    this.component.remove(formEntry.getComponent());
  }
  getValue() {
    return `{${this.children.map((child) => child.getObject()).join(", ")}}`;
  }
  getObject() {
    return `"${this.key}" : ${this.getValue()}`;
  }
  getComponent() {
    return this.component;
  }
  setDisabled(disabled) {
    this.children.forEach((child) => child.setDisabled(disabled));
    return this;
  }
}

class SubmissionForm extends FormEntryGroup {
  constructor(label, listener, buttonLabel = "Submit") {
    super("", {}, label);
    this.component = new FormContainer(new NcsLayout(), FormClasses.FORM);
    this.listener = listener;
    this.submissionButton = new Button(buttonLabel).setType("submit");
    this.submissionButton.addActionListener((e) => this.submit());
    this.center = new Container(new GridLayout(1));
    this.component
      .add(new Label(this.label, FontSize.FIRST_HEADER), Position.NORTH)
      .add(this.center, Position.CENTER)
      .add(this.submissionButton, Position.SOUTH);
  }
  submit() {
    const valid = this.children.reduce((pre, cur) => {
      if (cur.getValidationErrors().length) {
        return false;
      }
      return pre;
    }, true);

    if (valid) {
      this.listener(this.getObject());
    }
  }
  addChildren(...formEntry) {
    this.center.removeAll();
    this.children.push(...formEntry);
    this.children.forEach((child) => this.center.add(child.getComponent()));
    return this;
  }
  removeChild(formEntry) {
    if (!this.children.includes(formEntry)) {
      return;
    }
    this.center.removeAll();
    this.validationErrorsContainer.removeAll();

    this.children.splice(this.children.indexOf(formEntry), 1);
    this.children.forEach((child) => {
      this.center.add(child.getComponent());
      child.addActionListener(v => this.getGroupLevelValidationErrors());
    });
  }
  getValue() {
    return JSON.parse(
      `{${this.children.map((child) => child.getObject()).join(", ")}}`
    );
  }
  getObject() {
    return this.getValue();
  }
  getComponent() {
    return this.component;
  }
}

class FormEntryGroupArray extends FormEntryGroup {
  constructor(
    key,
    value,
    label,
    formEntrySupplier,
    addLabel = "Add",
    ...validators
  ) {
    super(key, value, label, ...validators);
    this.formEntrySupplier = formEntrySupplier;
    this.component = new Container(new NcsLayout());
    this.addInputButton = new Button(addLabel);
    this.addInputButton.addActionListener((e) => {
      const childGroup = this.formEntrySupplier({}, this.children.length + 1);
      childGroup.addRemovalListener(() => {
        this.removeChild(childGroup);
      });
      this.addChildren(childGroup);
    });
    this.center = new Container(new GridLayout(1));
    this.component
      .add(new Container(new NcsLayout())
        .add(new Label(this.label, FontSize.SECOND_HEADER), Position.NORTH)
        .add(this.validationErrorsContainer, Position.CENTER), Position.NORTH)
      .add(this.center, Position.CENTER)
      .add(this.addInputButton, Position.SOUTH);
    if (this.value && this.value.length) {
      this.value.forEach((item) => {
        const childGroup = this.formEntrySupplier(item, this.children.length + 1);
        childGroup.addRemovalListener(() => {
          this.removeChild(childGroup);
        });
        this.addChildren(childGroup);
      }
      );
    }
  }
  addChildren(...formEntry) {
    this.center.removeAll();
    this.validationErrorsContainer.removeAll();
    this.children.push(...formEntry);
    this.children.forEach((child) => {
      this.center.add(child.getComponent());
      child.addActionListener(v => this.getGroupLevelValidationErrors());
    });
    return this;
  }
  removeChild(formEntry) {
    if (!this.children.includes(formEntry)) {
      return;
    }
    this.center.removeAll();
    this.validationErrorsContainer.removeAll();

    this.children.splice(this.children.indexOf(formEntry), 1);
    this.children.forEach((child) => {
      this.center.add(child.getComponent());
      child.addActionListener(v => this.getGroupLevelValidationErrors());
    });
  }
  getValue() {
    return `[${this.children.map((child) => child.getValue()).join(", ")}]`;
  }
  getObject() {
    return `"${this.key}" : ${this.getValue()}`;
  }
  getComponent() {
    return this.component;
  }
  setDisabled(disabled) {
    super.setDisabled(disabled);
    this.addInputButton.setDisabled(disabled);
    if (disabled) {
      this.component.remove(this.addInputButton);
    } else {
      this.component.add(this.addInputButton, Position.SOUTH);
    }
    return this;
  }
}
