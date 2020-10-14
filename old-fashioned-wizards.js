//composite pattern again?
//chain of responsibility? Something has to determine if the wizard is done
/*

Wizard
-accumulator
-starting fork

Fork
-name/id
-form
-routing function (take in input and output name/id of next fork)
-done function? The wizard needs some way to know it's at a terminus

*/

class WizardFork extends Model {
    constructor(name, component, evaluator) {
        this.name = name;
        this.component = component;
        this.evaluator = evaluator;
    }
    setInput(input) {
        this.component.onUpdate(input);
    }
    finish() {
        this.e
    }
}

class Wizard extends Observer {
    constructor(onFinish, accumulator = {}) {
        this.forks = {}; // a map
        this.onFinish = onFinish;
        this.accumulator = accumulator;
        this.activeFork;
    }
    addFork(fork) {
        this.forks[fork.name] = fork;
        fork.parentWizard = this;
        fork.addObserver(this);
    }
    progressTo(name) {
        this.activeFork = this.forks[name];
        this.activeFork.setInput(accumulator);
    }
    onUpdate(message) {
        if (message.finished) {
            this.onFinish(accumulator);
        }
        else if (message.next) {
            this.progressTo(message.next);
        }
    }

}

class WizardForm extends FormEntryGroup {
    constructor(label, onSubmit) {
        super("", {}, label);
        this.component = new Container(new BorderLayout());
        this.onSubmit = onSubmit;
        this.submissionButton = new Button('Submit');
        this.submissionButton.addActionListener((e) => this.submit());
        this.center = new Container(new GridLayout(1));
        this.index = 0;
        this.previousButton = new Button('Previous').addActionListener(e => this.previous());
        this.nextButton = new Button('Next').addActionListener(e => this.progress());
        this.component
            .add(new Label(this.label, FontSize.FIRST_HEADER), Position.NORTH)
            // .add(this.submissionButton, Position.SOUTH)
            // .add(this.previousButton, Position.WEST)
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
        if (!valid) {
            // this.submissionButton.setDisabled(true);
        } else {
            // this.submissionButton.setDisabled(false);
            this.onSubmit(this.getObject());
        }
        this.component.paint();
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