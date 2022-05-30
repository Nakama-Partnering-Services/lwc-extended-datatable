export default class ColumnsProcessor {
	columns;
	isTreeGrid;
	actions;
	implementsDragAndDrop;

	constructor(columns, isTreeGrid, actions, implementsDragAndDrop) {
		this.columns = columns;
		this.isTreeGrid = isTreeGrid;
		this.actions = actions;
		this.implementsDragAndDrop = implementsDragAndDrop;
	}

	execute() {
		if (this.columns && this.columns.length) {
			this._setExpandCollapseColumn();
			this._setActionsColumn();
			this._setDragAndDropColumn();
		}
		return this.columns;
	}

	_setExpandCollapseColumn() {
		if (this.isTreeGrid) {
			const cellAttributes = Object.assign({}, this.columns[0].cellAttributes, {
				class: { fieldName: 'myClass' }
			});
			this.columns[0] = Object.assign(this.columns[0], { cellAttributes: cellAttributes });
			this.columns = [
				{
					type: 'button-icon',
					fixedWidth: 35,
					name: 'expand-collapse',
					typeAttributes: {
						variant: 'bare',
						iconName: { fieldName: 'icon' },
						class: { fieldName: 'myClass' }
					},
					cellAttributes: { alignment: 'left' }
				},
				...this.columns
			];
		}
	}

	_setActionsColumn() {
		if (this.actions && this.actions.length) {
			this.columns = [
				...this.columns,
				{
					type: 'action',
					fixedWidth: 62,
					typeAttributes: { rowActions: this.actions }
				}
			];
		}
	}

	_setDragAndDropColumn() {
		if (this.implementsDragAndDrop) {
			this.columns = [
				...this.columns,
				{
					hideDefaultActions: true,
					fixedWidth: 62,
					cellAttributes: { iconName: 'utility:drag_and_drop', iconAlternativeText: 'Drag and Drop' }
				}
			];
		}
	}
}
