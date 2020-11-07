const CellType = {
    HEAD: "th",
    DATA: "td"
}
const SortDirection = {
    OFF: 'off',
    ASC: 'asc',
    DESC: 'desc'
}
class SortState {
    constructor(sortDirection) {
        this.sortDirection = sortDirection;
    }
    next() {
        throw 'abstract sort state';
    }
    getSortDirection() {
        return this.sortDirection;
    }
    getIcon() {
        throw 'abstract sort state';
    }
}
class OffSortState extends SortState {
    constructor() {
        super(SortDirection.OFF);
    }
    next() {
        return new AscSortState();
    }
    getIcon() {
        return '⇅';
    }
}
class AscSortState extends SortState {
    constructor() {
        super(SortDirection.ASC);
    }
    next() {
        return new DescSortState();
    }
    getIcon() {
        return '↑';
    }
}
class DescSortState extends SortState {
    constructor() {
        super(SortDirection.DESC);
    }
    next() {
        return new OffSortState();
    }
    getIcon() {
        return '↓';
    }
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
        if (this.actionListener) {
            this.classes.push('clickable-row');
        }
        this.e = BAR.e2("tr", this.id, this.classes);
        this.e.addEventListener("click", (e) => this.actionListener());
    }
}
class ColumnDecorator {
    constructor() {
        this.listeners = [];
    }
    getValue() {
        return {};
    }
    onChange() {
        this.listeners.forEach(listener => listener(this.getValue()));
    }
    addChangeListener(changeListener) {
        this.listeners.push(changeListener);
        return this;
    }
    onUpdate(message) {
        this.child.onUpdate(message);
    }
}
class Column extends ColumnDecorator {
    constructor(key, label, transformer = val => val) {
        super();
        this.key = key;
        this.label = label;
        this.transformer = transformer;
    }
    onUpdate(message) {}
    getHeader() {
        return new Cell(this.label, CellType.HEAD);
    }
    getCell(dataRow) {
        const keys = this.key.split(".");
        let val = dataRow;
        for (let key of keys) {
            val = val[key];
        }
        return new Cell(val, CellType.DATA).setTransformer(this.transformer);
    }
    getValue() {
        return {key: this.key};
    }
}
class SortableColumn extends ColumnDecorator {
    constructor(column, initialSort = SortDirection.OFF) {
        super();
        this.child = column;
        this.child.addChangeListener(e => this.onChange());
        this.sortButton = new Button('').addActionListener(e => {
            this.sort = this.sort.next();
            this.sortButton.setText(this.sort.getIcon());
            this.onChange();
        });
        this.setSort(initialSort);
    }
    setSort(sortDirection) {
        if(sortDirection === SortDirection.ASC) {
            this.sort = new AscSortState();
        }
        else if(sortDirection === SortDirection.DESC) {
            this.sort = new DescSortState();
        }
        else {
            this.sort = new OffSortState();
        }
        this.sortButton.setText(this.sort.getIcon());
    }
    onUpdate(columnsMessage) {
        const thisColumn = columnsMessage.find(col => col.key = this.child.key);
        if(thisColumn && thisColumn.sort) {
            this.setSort(thisColumn.sort);
        }
        else {
            this.setSort(SortDirection.OFF);
        }
    }
    getHeader() {
        return new Container().add(this.child.getHeader(), Position.CENTER).add(this.sortButton, Position.EAST);
    }
    getCell(dataRow) {
        return this.child.getCell(dataRow);
    }
    getValue() {
        const params = this.child.getValue();
        params.sort = this.sort.getSortDirection();
        return params;
    }
}
class Pagination extends Container {
    constructor(resultsPerPage = 1, currentPage = 1) {
        super(new BorderLayout(), 'pagination');
        this.resultsPerPage = resultsPerPage;
        this.currentPage = currentPage;
        this.maxPage = 0;
        this.pageChangeListener = (newPageNumber, newResultsPerPage) => { console.log(newPageNumber, newResultsPerPage); };
        this.backButton = new Button('Go Back').addActionListener(e => this.changePage('back'));
        this.label = new Label(`Page ${this.currentPage} of ${this.maxPage}`, 'wide');
        this.nextButton = new Button('Go to Next Page').addActionListener(e => this.changePage('next'));
        this.add(
            this.backButton
            , Position.WEST)
            .add(
                this.label, Position.CENTER
            )
            .add(
                this.nextButton
                , Position.EAST);
    }
    onUpdate(newPagination) {
        this.resultsPerPage = newPagination.resultsPerPage;
        this.currentPage = newPagination.currentPage;
        this.maxPage = Math.ceil(newPagination.totalCount / this.resultsPerPage);
        this.label.setText(`Page ${this.currentPage} of ${this.maxPage}`);
        if (this.maxPage === this.currentPage) {
            this.remove(this.nextButton);
        }
        else {
            this.add(this.nextButton);
        }
        if (this.currentPage === 1) {
            this.remove(this.backButton);
        }
        else {
            this.add(this.backButton);
        }
    }
    addPageChangeListener(pageChangeListener) {
        this.pageChangeListener = pageChangeListener;
        return this;
    }
    changePage(direction) {
        if (direction === 'back') {
            this.currentPage = this.currentPage - (this.currentPage > 1); // true = 1, false = 0
        }
        else {
            this.currentPage = this.currentPage + (this.currentPage < this.maxPage);
        }
        this.pageChangeListener(this.currentPage, this.resultsPerPage);
    }
}

class TableDecorator extends Container {
    constructor(tableContainer) {
        super(new NcsLayout());
        this.child = tableContainer;
        this.listeners = [];

    }
    getValue() {
        return {};
    }
    onChange() {
        this.listeners.forEach(listener => listener(this.getValue()));
    }
    addChangeListener(changeListener) {
        this.listeners.push(changeListener);
        return this;
    }
    onUpdate(message) {
        this.child.onUpdate(message);
    }
}

class TableImpl extends TableDecorator {
    constructor(...classes) {
        super(null);
        this.classes = ["grid-table"].concat(...classes);
        this.columns = [];

        this.e = BAR.e2("table", this.id, this.classes);
        this.headerRow = new Row();
        this.add(this.headerRow);
        this.rowElements = [];
        this.rowClickListeners = [];
    }
    addRowClickListener(listener) {
        this.rowClickListeners.push(listener);
        return this;
    }
    addColumns(...columns) {
        columns.forEach(column => {
            column.addChangeListener(e => this.onChange());
            this.headerRow.add(column.getHeader());
        });
        this.columns.push(...columns);
        return this;
    }
    onUpdate(newValue) {
        this.rowElements.forEach(rowElement => this.remove(rowElement));
        for (let dataRow of newValue.content) {
            const rowElement = new Row(
                this.rowClickListeners.length > 0 ? (e) => this.rowClickListeners.forEach(listener => listener(dataRow)) : null
            );
            this.rowElements.push(rowElement);
            for (let column of this.columns) {
                rowElement.add(column.getCell(dataRow));
                column.onUpdate(newValue.sorts)
            }
            this.add(rowElement);
        }
    }
    getValue() {
        const params = {};
        const columnParams = [];
        for(let column of this.columns) {
            columnParams.push(column.getValue());
        }
        params.columns = columnParams;
        return params;
    }
}

class TableSearch extends TableDecorator {
    constructor(tableContainer) {
        super(tableContainer);
        this.child.addChangeListener(e => this.onChange());
        this.searchField = new TextField().setAriaLabel("Search");
        const searchButton = new Button("Search").addActionListener((e) => this.onChange());
        this.add(new Container().add(this.searchField, Position.CENTER).add(searchButton, Position.EAST), Position.NORTH);
        this.add(this.child, Position.CENTER);
    }

    getValue() {
        const params = this.child.getValue();
        params.searchTerm = this.searchField.getValue();
        return params;
    }
    onUpdate(message) {
        super.onUpdate(message);
    }

}
class TablePagination extends TableDecorator {
    constructor(tableContainer, resultsPerPage, currentPage) {
        super(tableContainer);
        this.child.addChangeListener(e => this.onChange());

        this.pagination = new Pagination(resultsPerPage, currentPage);
        this.pagination.addPageChangeListener(e => this.onChange());
        this.add(this.pagination,
            Position.SOUTH
        );
        this.add(this.child, Position.CENTER);
    }
    getValue() {
        const params = this.child.getValue();
        params.pagination = {
            resultsPerPage: this.pagination.resultsPerPage,
            currentPage: this.pagination.currentPage
        }
        return params;
    }
    onUpdate(message) {
        this.pagination.onUpdate(message.pagination);
        super.onUpdate(message);
    }
}

class DecoratedTableBuilder {
    constructor() {
        this.table = new TableImpl();
        this.changeListener = (e) => { };
    }
    addRowClickListener(rowClickListener) {
        this.table.addRowClickListener(rowClickListener);
        return this;
    }
    addColumns(...columns) {
        this.table.addColumns(...columns);
        return this;
    }
    addSearch() {
        // Search should decorate the grid
        this.table = new TableSearch(this.table);
        return this;
    }
    addPagination() {
        // Pagination should 'decorate' the grid
        this.table = new TablePagination(this.table, 1, 1);
        return this;
    }
    addChangeListener(changeListener) {
        this.changeListener = changeListener;
        return this;
    }
    build() {
        return this.table.addChangeListener(this.changeListener);
    }
}