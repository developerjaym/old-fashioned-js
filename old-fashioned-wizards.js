class WizardForm extends FormEntryGroup {
    constructor(label, onSubmit) {
        super("", {}, label);
        this.component = new Container(new BorderLayout(), FormClasses.FORM);
        this.onSubmit = onSubmit;
        this.submissionButton = new Button('Submit');
        this.submissionButton.addActionListener((e) => this.submit());
        this.center = new Container(new GridLayout(1));
        this.index = 0;
        this.previousButton = new Button('Previous').addActionListener(e => this.previous());
        this.nextButton = new Button('Next').addActionListener(e => this.progress());
        this.component
            .add(new Label(this.label, FontSize.FIRST_HEADER), Position.NORTH)
            .add(this.nextButton, Position.EAST)
            .add(this.center, Position.CENTER);
    }
    progress() {
        if (this.children[this.index].getValidationErrors().length) {
            return;
        }
        else if (this.index === this.children.length - 1) {
            this.submit();
        }
        else {
            this.index++;
            this.center.removeAll();
            this.component.remove(this.previousButton);
            this.center.add(this.children[this.index].getComponent());
            this.component.add(this.previousButton, Position.WEST);
        }
    }
    previous() {
        if (this.index <= 0) {
            return;
        }
        else if (this.index === 1) {
            this.component.remove(this.previousButton);
        }
        this.index--;
        this.center.removeAll();
        this.center.add(this.children[this.index].getComponent());
    }
    submit() {
        const valid = this.children.reduce((pre, cur) => {
            if (cur.getValidationErrors().length) {
                return false;
            }
            if (!pre) {
                return false;
            }
            return true;
        }, true);
        if (valid) {
            this.onSubmit(this.getObject());
        }
    }
    isValid() {
        return this.children.reduce((pre, cur) => {
            if (cur.getValidationErrors().length) {
                return false;
            }
            if (!pre) {
                return false;
            }
            return true;
        }, true);
    }
    addChildren(...formEntry) {
        this.center.removeAll();
        this.children.push(...formEntry);
        this.center.add(this.children[this.index].getComponent());
        return this;
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