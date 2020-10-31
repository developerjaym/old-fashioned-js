// const CommonTransformers = {

// };
// const ColumnType = {
//     CHECK_BOX: (val) => new ,
//     TEXT,
//     NUMBER_INPUT
// }
const CellType = {
    HEAD: "th",
    DATA: "td"
}
class Cell extends Component {
    constructor(value, type = CellType.DATA, ...classes) {
        super([type, 'cell'].concat(...classes));
        this.e = BAR.e2(type, this.id, this.classes);
        this.value = value;
        this.e.innerText = this.value;
    }
    setTransformer(transformer) {
        this.transformer = transformer;
        this.e.innerText = this.transformer(this.value);
        return this;
    }
}
class Row extends Container {
    constructor(actionListener) {
        super(new NoLayout(), 'row');
        this.actionListener = actionListener;
        this.e = BAR.e2("tr", this.id, this.classes);
        this.e.addEventListener("click", (e) => this.actionListener(dataRow));
    }
}
class Column {
    constructor(key, label, transformer = val => val) {
        this.key = key;
        this.label = label;
        this.transformer = transformer;
    }
    getHeader() {
        return new Cell(this.label, CellType.HEAD);
    }
    getCell(dataRow) {
        const keys = this.key.split(".");
        let val = dataRow;
        for(let key of keys) {
            val = val[key];
        }
        return new Cell(val, CellType.DATA).setTransformer(this.transformer);
    }
}
class GridTable extends Container {
    constructor(...classes) {
        super(new NoLayout(), ...classes);
        this.classes = ["grid-table"].concat(...classes);
        this.columns = [];

        this.e = BAR.e2("table", this.id, this.classes);
        this.headerRow = new Row();//BAR.e2('tr', `${this.id}-th-row`);
        this.add(this.headerRow);
        this.rowElements = [];
        this.listeners = [];
    }
    addActionListener(listener) {
        this.listeners.push(listener);
        return this;
    }
    addColumns(...columns) {
        columns.forEach(column => this.headerRow.add(column.getHeader()));
        this.columns.push(...columns);
        return this;
    }
    onUpdate(newValue) {
        this.rowElements.forEach(rowElement => this.remove(rowElement));
        for(let dataRow of newValue) {
            const rowElement = new Row((e) => this.listeners.forEach(listener => listener(dataRow)));
            this.rowElements.push(rowElement);
            for(let column of this.columns) {
                rowElement.add(column.getCell(dataRow));
            }
            this.add(rowElement);
        }
    }
}