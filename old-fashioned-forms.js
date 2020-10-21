const FormClasses = {
  FORM_LABEL: 'form-label',
  INVALID: "invalid"
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
  NOT_EMPTY: new Validator("Required", (val) => !val || !JSON.parse(val).length)
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
    this.component = new Container(new NcsLayout());
    this.inputComponent = inputComponent;
    this.inputComponent.addActionListener((v) => {
      this.getValidationErrors();
      this.actionListeners.forEach(listener => listener(v));
    });
    this.validationErrorsContainer = new Container(
      new GridLayout(1)
    );
    this.component
      .add(new Label(this.label, FormClasses.FORM_LABEL).setFor(this.inputComponent), Position.NORTH)
      .add(this.inputComponent, Position.CENTER)
      .add(this.validationErrorsContainer, Position.SOUTH);
  }
  getValidationErrors() {
    this.validationErrorsContainer.removeAll();
    const validationErrors = super.getValidationErrors();
    validationErrors.forEach((error) =>
      this.validationErrorsContainer.add(new Label(error.label, FormClasses.INVALID, FormClasses.FORM_LABEL))
    );
    return validationErrors;
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
      this.component.add(new Container().add(
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
    if(!this.children.includes(formEntry)) {
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
    this.component = new Container(new NcsLayout());
    this.listener = listener;
    this.submissionButton = new Button(buttonLabel);
    this.submissionButton.addActionListener((e) => this.submit());
    this.center = new Container(new GridLayout(1));
    this.component
      .add(new Label(this.label, FontSize.FIRST_HEADER), Position.NORTH)
      .add(this.submissionButton, Position.SOUTH)
      .add(this.center, Position.CENTER);
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
    if(!this.children.includes(formEntry)) {
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
      .add(new Container()
        .add(new Label(this.label, FontSize.SECOND_HEADER), Position.NORTH)
        .add(this.validationErrorsContainer, Position.CENTER), Position.NORTH)
      .add(this.addInputButton, Position.SOUTH)
      .add(this.center, Position.CENTER);
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
    if(!this.children.includes(formEntry)) {
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
