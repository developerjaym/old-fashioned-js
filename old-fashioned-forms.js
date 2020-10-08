class Validator {
    constructor(label, invalid = (val) => false) {
        this.label = label;
        this.invalid = invalid;
    }
}

class RegexValidator extends Validator {
    constructor(label, regex) {
        super(label, (val) => !val || !([].concat(val.match(regex)).some(match => match === val)))
    }
}

class StringValidators {
    static NOT_EMPTY = new Validator("Required", (val) => !val);
    static OF_LENGTH = (min, max) => new Validator(`Input must be between ${min} and ${max} characters.`, (val) => !val || val.length < min || val.length > max);
}

class FormLayout extends Layout {
    constructor() {
        super(Layout.FORM_LAYOUT);
    }
    getStyle() {
        return ``;
    }
}

class BaseFormEntry {
    constructor(key, value, label, ...validators) {
        this.key = key;
        this.value = value;
        this.label = label;
        this.validators = [].concat(...validators);
    }
    getValidationErrors() {
        return this.validators.filter(validator => validator.invalid(this.getValue()));
    }
    getObject() {
        throw 'abstract base form entry';
    }
    getComponent() {
        throw 'abstract base form entry';
    }
}
class BaseInputFormEntry extends BaseFormEntry {
    constructor(key, value, label, inputComponent, ...validators) {
        super(key, value, label, ...validators);
        this.component = new Container(new GridLayout(2));
        this.inputComponent = inputComponent;
        this.inputComponent.addActionListener(v => this.getValidationErrors());
        this.validationErrorsContainer = new Container(new GridLayout(1));
        this.component.add(new Label(this.label).setFor(this.inputComponent)).add(this.inputComponent).add(this.validationErrorsContainer);
    }
    getValidationErrors() {
        this.validationErrorsContainer.removeAll();
        const validationErrors = super.getValidationErrors();
        validationErrors.forEach(error => this.validationErrorsContainer.add(new Label(error.label, 'invalid')));
        return validationErrors;
    }
    getValue() {
        return this.inputComponent.getValue();
    }
    getObject() {
        return `"${this.key}": "${this.getValue()}"`;
    }
    getComponent() {
        return this.component;
    }
}
class TextFormEntry extends BaseInputFormEntry {
    constructor(key, value, label, ...validators) {
        super(key, value, label, new TextField(value || ''), ...validators);
    }
}
class NumberFormEntry extends BaseInputFormEntry {
    constructor(key, value, label, ...validators) {
        super(key, value, label, new NumberField(value || 0), ...validators);
    }
    getObject() {
        return `"${this.key}": ${this.getValue()}`;
    }
}
class DropdownListFormEntry extends BaseInputFormEntry {
    constructor(key, value, label, arraySupplier, ...validators) {
        super(key, value, label, new DropdownList(value || '', arraySupplier), ...validators);
    }
}

class DateFormEntry extends BaseInputFormEntry {
    constructor(key, value, label, ...validators) {
        super(key, value, label, new DateField(value || ''), ...validators);
    }
}

class FormEntryGroup extends BaseFormEntry {

    constructor(key, value, label, ...validators) {
        super(key, value, label, ...validators);
        this.children = [];
        this.component = new Container(new GridLayout(1));
        this.component.add(new Label(this.label));
    }
    getValidationErrors() {
        const childErrors = this.children.filter(child => child.getValidationErrors().length > 0);
        return childErrors.concat(this.validators.filter(validator => validator.invalid(this.getValue())));
    }
    addChildren(...formEntry) {
        this.component.removeAll();
        this.component.add(new Label(this.label));
        this.children.push(...formEntry);
        this.children.forEach(
            child => this.component.add(child.getComponent())
        )
        return this;
    }
    getValue() {
        return `{${this.children.map(child => child.getObject()).join(", ")}}`;
    }
    getObject() {
        return `"${this.key}" : ${this.getValue()}`;
    }
    getComponent() {
        return this.component;
    }
}

class SubmissionForm extends FormEntryGroup {
    constructor(label, listener, buttonLabel='Submit') {
        super('', {}, label);
        this.component = new Container(new FormLayout());
        this.listener = listener;
        this.submissionButton = new Button(buttonLabel);//, 'disabled');
        this.submissionButton.addActionListener((e) => this.submit());
        this.center = new Container(new GridLayout(1));
        this.component.add(new Label(this.label, FontSize.LARGE), Position.NORTH)
            .add(this.submissionButton, Position.SOUTH).add(this.center, Position.CENTER);
    }
    submit() {
        const valid = this.children.reduce((pre, cur) => {
            if(cur.getValidationErrors().length) {
                return false;
            }
            if(!pre) {
                return false;
            }
            return true;
        }, true);
        if(!valid) {
            this.submissionButton.classes.push('disabled');
        }
        else { 
            this.submissionButton.classes.splice(this.submissionButton.classes.indexOf('disabled'), 1);
            this.listener(this.getObject());
        }
        this.component.paint();
    }
    addChildren(...formEntry) {
        this.center.removeAll();
        this.children.push(...formEntry);
        this.children.forEach(
            child => this.center.add(child.getComponent())
        )
        return this;
    }
    getValue() {
        return JSON.parse(`{${this.children.map(child => child.getObject()).join(", ")}}`);
    }
    getObject() {
        return this.getValue();
    }
    getComponent() {
        return this.component;
    }
}

class FormEntryGroupArray extends FormEntryGroup {

    constructor(key, value, label, formEntrySupplier, addLabel = 'Add', ...validators) {
        super(key, value, label, ...validators);
        this.formEntrySupplier = formEntrySupplier;
        this.component = new Container(new FormLayout());
        const addInputButton = new Button(addLabel);
        addInputButton.addActionListener((e) => {
            this.addChildren(this.formEntrySupplier({}, this.children.length + 1));
        });
        this.center = new Container(new GridLayout(1));
        this.component.add(new Label(this.label), Position.NORTH)
            .add(addInputButton, Position.SOUTH).add(this.center, Position.CENTER);
        if(this.value && this.value.length) {
            this.value.forEach(item => this.addChildren(this.formEntrySupplier(item, this.children.length + 1)))
        }   
        
    }
    addChildren(...formEntry) {
        this.center.removeAll();
        this.children.push(...formEntry);
        this.children.forEach(
            child => this.center.add(child.getComponent())
        )
        return this;
    }
    getValue() {
        return `[${this.children.map(child => child.getValue()).join(", ")}]`;
    }
    getObject() {
        return `"${this.key}" : ${this.getValue()}`;
    }
    getComponent() {
        return this.component;
    }
}