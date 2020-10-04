class FormLayout extends Layout {
    constructor() {
        super(Layout.FORM_LAYOUT);
    }
    getStyle() {
        return `display: grid; grid-template-columns: 1fr;`;
    }
}

class BaseFormContainer extends Container {
    constructor(...subforms) {
        super(new FormLayout(), 'form');
        this.subforms = subforms;
        for(let subform of this.subforms) {
            this.add(subform);
        }
    }
    getJSON() {
        return `${this.subforms.map(subform => subform.getJSON()).join(", ")}`;
    }
}

class SimpleFormContainer extends BaseFormContainer {
    constructor(...subforms) {
        super(...subforms);
        const submitButton = new Button('Submit');
        submitButton.addActionListener((e) => console.log(this.getJSON()));
        this.add(submitButton);
    }
    getJSON() {
        return `{${this.subforms.map(subform => subform.getJSON()).join(", ")}}`;
    }
}


class BaseFormInput extends Container {
    constructor(label, key) {
        super(new GridLayout(2), 'form-input');
        this.label = label;
        this.key = key;
    }
    getJSON() {
        throw 'abstract form input';
    }
}
class SimpleFormInput extends BaseFormInput {
    constructor(label, key) {
        super(label, key);
        this.textField = new TextField();
        this.add(new Label(this.label)).add(this.textField);
    }
    getJSON() {
        return `"${this.key}": "${this.textField.getValue()}"`;
    }
}
