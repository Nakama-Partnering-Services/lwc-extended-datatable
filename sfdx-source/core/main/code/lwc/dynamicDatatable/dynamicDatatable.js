/* eslint-disable guard-for-in */
import { LightningElement, api, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { getRecordNotifyChange } from 'lightning/uiRecordApi';

import { registerListener, unregisterAllListeners } from 'c/pubsub';
import { showToastSuccess } from 'c/showToastUtility';
import { handleAsyncError, removeSpecialChars } from 'c/utils';

import { update, sortBy, hasNestedRows, numberOfMaxDepthChildren, getMaxDepthTable } from './utils';

import TableHelper from './tableHelper';
import ColumnsProcessor from './columnsProcessor';
import DataProcessor from './dataProcessor';

import Update_Record_Error_Title from '@salesforce/label/c.Update_Record_Error_Title';
import Records_Updated_Successfully from '@salesforce/label/c.Records_Updated_Successfully';

/*eslint no-extend-native: ["error", { "exceptions": ["Array"] }]*/
Array.prototype.move = function (from, to) {
	this.splice(to, 0, this.splice(from, 1)[0]);
	return this;
};

const actions = [
	{ label: 'View', name: 'view' },
	{ label: 'Edit', name: 'edit' },
	{ label: 'Delete', name: 'delete' }
];

export default class DynamicDatatable extends LightningElement {
	@wire(CurrentPageReference) pageRef;

	label = {
		Update_Record_Error_Title,
		Records_Updated_Successfully
	};

	// Required
	@api recordId;
	@api relatedList;
	@api fieldset;

	// Optional
	@api relationshipField;
	@api orderBy = 'Id ASC NULLS LAST, CreatedDate';
	@api recordsToLoad = 6;
	@api height = 'auto';

	// Optional, datatable specific
	@api showRowNumberColumn;
	@api hideCheckboxColumn;
	@api resizeColumnDisabled;
	@api enableInfiniteLoading;

	// Optional, columns specific
	@api hideDefaultColumnsActions;
	@api searchable;
	@api sortable;
	@api enableInlineEditing;

	// Optional, treeGrid specific
	@api nestingRelationshipField;
	@api maxDepth;

	// Optional, not available for manual input
	@api actions = actions;
	@api implementsDragAndDrop;
	@api customHandleSave;

	columns = [];
	data = [];
	draftValues = [];

	sortedDirection = 'asc';
	sortedBy;

	showSpinner;

	_recordsOffset = 0;
	_allRows;
	_allRowsSearchApplied;
	_rowsToSlice = '_allRows';
	// Assigned the first time that "loadMoreData" is called
	_table;
	_searchTerm = '';
	_maxDepthStyle = 0;
	_blockTreeGridActions;

	// If provided, other required attributes will be ignored
	_tableInfo;
	@api get tableInfo() {
		return this._tableInfo;
	}

	set tableInfo(value) {
		this._tableInfo = value;
		if (value) {
			this._recordsOffset = 0;
			this.data = [];
			this.draftValues = [];
			this._applyTableInfo();
		}
	}

	get tableHelper() {
		return new TableHelper(this)
			.objectApiName(this.relatedList)
			.fieldSetName(this.fieldset)
			.hideDefaultColumnsActions(this.hideDefaultColumnsActions)
			.sortable(this.sortable)
			.editable(this.enableInlineEditing)
			.searchable(this.searchable)
			.relationshipField(this.relationshipField)
			.parentId(this.recordId)
			.orderBy(this.orderBy)
			.recordsLimit(this.numberOfRecords + 1)
			.recordsOffset(this._realQueryOffset)
			.nestingRelationshipField(this.nestingRelationshipField)
			.maxDepth(this.maxDepth);
	}

	get _realQueryOffset() {
		let getTotalRowsExpanded = 0;
		if (this.data) {
			for (const row of this.data) {
				if (!parseInt(row.myClass.substring(20), 10)) {
					getTotalRowsExpanded += this._getTotalRowsToCollapse(row);
				}
			}
		}
		const result = this._recordsOffset - getTotalRowsExpanded;
		return result > 0 ? result : 0;
	}

	@api get tableComponent() {
		return (
			this.template.querySelector('c-lightning-datatable-extended') ||
			this.template.querySelector('lightning-datatable')
		);
	}

	get containerStyle() {
		return `height: ${this.height};`;
	}

	get isDraggable() {
		return this.implementsDragAndDrop || this.tableInfo?.implementsDragAndDrop;
	}

	// If this.recordsToLoad is received from the parent, we need to parse it from string to number: parseInt(this.recordsToLoad)
	get numberOfRecords() {
		return parseInt(this.recordsToLoad, 10);
	}

	async connectedCallback() {
		// Retrieve table information in connectedCallback instead of wired methods
		// to be able to set properly the showSpinner value and because we also need
		// to retrieve data imperatively for "onloadmore" event
		this.showSpinner = true;
		if (this.recordId) {
			await this._setTableInformation();
		}
		this.showSpinner = false;

		registerListener('dropRowEvent', this._switchRowsAfterDrag, this);
	}

	disconnectedCallback() {
		unregisterAllListeners(this);
	}

	// API EXPOSED

	@api handleRefresh() {
		this._setData();
	}

	@api
	handleSearch(searchTerm) {
		this._searchTerm = removeSpecialChars(searchTerm.toLowerCase());
		this._applySearch();
	}

	// PUBLIC

	handleRowSelection(event) {
		this.dispatchEvent(new CustomEvent('rowselection', event));
	}

	handleHeaderAction(event) {
		this.dispatchEvent(new CustomEvent('headeraction', event));
	}

	handleRowAction(event) {
		const action = event.detail.action;
		const row = JSON.parse(JSON.stringify(event.detail.row));
		// eslint-disable-next-line default-case
		if (action.iconName?.fieldName === 'icon' && !this._blockTreeGridActions) {
			this._applyTreeGridActions(row);
		}

		// Deep cloned to avoid sending a reference
		event.detail.tableRows = JSON.parse(JSON.stringify(this.data));
		this.dispatchEvent(new CustomEvent('rowaction', event));
	}

	handleSort(event) {
		if (getMaxDepthTable(this.data)) {
			return;
		}
		const { fieldName: sortedBy, sortDirection } = event.detail;
		const cloneData = [...this.data];
		// This is to properly order lookup columns from a user perspective
		// Not using replace('Link', '') because matching the whole word is safer
		cloneData.sort(sortBy(sortedBy.replace('LinkName', 'Name'), sortDirection === 'asc' ? 1 : -1));
		this.data = cloneData;
		this.sortedDirection = sortDirection;
		this.sortedBy = sortedBy;
	}

	async loadMoreData(event) {
		// event.target is null after await so we save it in a variable
		this._table = event.target;
		this._table.isLoading = true;

		if (this.tableInfo) {
			if (this._recordsOffset < this[this._rowsToSlice].length) {
				this._sliceRowsIntoData();
			} else {
				this._table.enableInfiniteLoading = false;
			}
		} else {
			const data = await this.tableHelper.getRowsData();

			if (this.nestingRelationshipField) {
				this._flattenRecordsWithChildren(data);
			}

			if (data && data.length) {
				const retrievedRowsEvent = new CustomEvent('retrievedrows', {
					detail: {
						numberOfRecordsRetrieved: data.length
					}
				});
				this.dispatchEvent(retrievedRowsEvent);

				if (data.length > this.numberOfRecords) {
					data.pop();
				}

				const processedData = new DataProcessor(data).execute();
				this.data = [...this.data, ...processedData];
				this._allRows = [...this._allRows, ...processedData];
				this._applyStyle();
				this._applySearch(true);
				this._recordsOffset += this.numberOfRecords;
			} else {
				this._table.enableInfiniteLoading = false;
			}
		}

		this._table.isLoading = false;
	}

	async handleSave(event) {
		this.draftValues = [];

		if (this.customHandleSave) {
			this.dispatchEvent(new CustomEvent('inlineeditsave', event));
		} else {
			this.showSpinner = true;

			const safeUpdateRecords = handleAsyncError(update, {
				title: this.label.Update_Record_Error_Title
			});

			const records = event.detail.draftValues;
			const result = await safeUpdateRecords(this, { records });
			// If it is null (because apex method returns void) or any other value,
			// it means that updateRecords is successful
			if (result !== undefined) {
				showToastSuccess(this, {
					title: this.label.Records_Updated_Successfully
				});

				this.dispatchEvent(new CustomEvent('recordsupdated'));

				if (!this.tableInfo) {
					await this._setData();
				}

				const notifyChangeIds = records.map((row) => ({ recordId: row.Id }));

				getRecordNotifyChange(notifyChangeIds);
			}
			this.showSpinner = false;
		}
	}

	// PRIVATE

	_applyTableInfo() {
		const isTreeGrid = hasNestedRows(this.tableInfo.rows);
		this.columns = JSON.parse(
			JSON.stringify(
				new ColumnsProcessor(
					JSON.parse(JSON.stringify(this.tableInfo.columns)),
					isTreeGrid,
					this.tableInfo.actions,
					this.tableInfo.implementsDragAndDrop
				).execute()
			)
		);

		if (this.tableInfo.rows) {
			const newAllRows = new DataProcessor(this.tableInfo.rows).execute();
			if (isTreeGrid && this._allRows) {
				this._restorePreviouslyExpandedRows(newAllRows);
			}
			this._allRows = newAllRows;
			this._applyStyle();
			this._sliceRowsIntoData();
			this._applySearch(true);
		}

		if (this._table) {
			this._table.enableInfiniteLoading = true;
		}
	}

	_restorePreviouslyExpandedRows(newAllRows) {
		for (let i = 0; i < newAllRows.length; i++) {
			const previousRow = this._allRows[i];
			const newRow = newAllRows[i];
			if (previousRow.Id === newRow.Id) {
				newRow.icon = previousRow.icon;
				newRow.rowsToCollapse = previousRow.rowsToCollapse;
				// TODO: map also possible NEW values of previousRow.collapsedRows into newRow

				if (newRow.icon === 'utility:chevrondown') {
					newAllRows.splice(i, 1, newRow, ...newRow._children);
				}
			}
		}
	}

	_applyStyle() {
		const style = document.createElement('style');

		style.innerText = ``;

		const maxDepth = numberOfMaxDepthChildren(this._allRows);

		if (maxDepth > this._maxDepthStyle) {
			for (; this._maxDepthStyle <= maxDepth; this._maxDepthStyle++) {
				style.innerText += `
                    .depth${this._maxDepthStyle} {
                        padding-left: ${this._maxDepthStyle}rem !important;
                    }
                `;
			}
			this._maxDepthStyle = maxDepth;
		}
		this.template.querySelector('.dynamic-datatable').appendChild(style);
	}

	_sliceRowsIntoData() {
		this._recordsOffset += this.numberOfRecords;
		const currentDataLength = this.data.length;
		this.data = this[this._rowsToSlice].slice(0, this._recordsOffset);
		const retrievedRowsEvent = new CustomEvent('retrievedrows', {
			detail: {
				numberOfRecordsRetrieved: this[this._rowsToSlice].slice(currentDataLength, this._recordsOffset + 1)
					.length
			}
		});
		this.dispatchEvent(retrievedRowsEvent);
	}

	async _applySearch(avoidRefresh) {
		this.showSpinner = true;

		if (avoidRefresh && this._searchTerm === '') {
			this._rowsToSlice = '_allRows';
			if (this.tableInfo && hasNestedRows(this.tableInfo.rows)) {
				this._blockTreeGridActions = false;
			}
			const searchAppliedEvent = new CustomEvent('searchapplied', {
				detail: {
					tableRows: JSON.parse(JSON.stringify(this._allRows)),
					withoutChanges: true
				}
			});
			this.dispatchEvent(searchAppliedEvent);
		} else if (this._searchTerm === '') {
			this._rowsToSlice = '_allRows';
			if (this.tableInfo) {
				if (hasNestedRows(this.tableInfo.rows)) {
					this._blockTreeGridActions = false;
				}
				if (this._table) {
					this._table.enableInfiniteLoading = true;
				}
				this._recordsOffset = 0;
				this.data.length = 0;
				this._sliceRowsIntoData();
				const searchAppliedEvent = new CustomEvent('searchapplied', {
					detail: {
						tableRows: JSON.parse(JSON.stringify(this._allRows)),
						numberOfRecordsRetrieved: this._allRows.slice(0, this.data.length + 1).length,
						isRefresh: true
					}
				});
				this.dispatchEvent(searchAppliedEvent);
			} else {
				await this._setData();
			}
		} else if (this._searchTerm.length >= 2) {
			if (this.tableInfo && hasNestedRows(this.tableInfo.rows)) {
				this._blockTreeGridActions = true;
			}

			const rows = [];

			this._allRows.forEach((row) => {
				for (const field in row) {
					const col = this.columns.find((column) => column.fieldName === field);
					if (col && col.searchable) {
						const urlLabelField = col.typeAttributes?.label?.fieldName;
						const matchUrlLabel = removeSpecialChars(row[urlLabelField]?.toLowerCase())?.includes(
							this._searchTerm
						);
						const matchFieldValue =
							!field.includes('LinkName') &&
							removeSpecialChars((row[field] + '').toLowerCase())?.includes(this._searchTerm);
						if (matchUrlLabel || matchFieldValue) {
							rows.push(row);
							break;
						}
					}
				}
			});

			/**
			 * TODO: Improve this. Add lazy loading too when recordId
			 */
			let searchAppliedEvent;
			if (this.recordId) {
				this.data = rows;
				searchAppliedEvent = new CustomEvent('searchapplied', {
					detail: {
						tableRows: JSON.parse(JSON.stringify(this.data)),
						numberOfRecordsRetrieved: this.data.length
					}
				});
			} else {
				this._allRowsSearchApplied = rows;
				this._rowsToSlice = '_allRowsSearchApplied';
				this._recordsOffset = 0;
				this.data.length = 0;
				this._sliceRowsIntoData();
				searchAppliedEvent = new CustomEvent('searchapplied', {
					detail: {
						tableRows: JSON.parse(JSON.stringify(this._allRowsSearchApplied)),
						numberOfRecordsRetrieved: this._allRowsSearchApplied.slice(0, this.data.length + 1).length,
						isRefresh: true
					}
				});
			}
			this.dispatchEvent(searchAppliedEvent);
		}

		this.showSpinner = false;
	}

	async _setTableInformation() {
		await Promise.all([this._setColumns(), this._setData()]);
	}

	async _setColumns() {
		const columns = await this.tableHelper.getColumnsConfig();
		this.columns = JSON.parse(
			JSON.stringify(
				new ColumnsProcessor(
					JSON.parse(JSON.stringify(columns)),
					this.nestingRelationshipField,
					this.actions,
					this.implementsDragAndDrop
				).execute()
			)
		);
	}

	async _setData() {
		// Reset in case we are refreshing the data
		this._recordsOffset = 0;
		const data = await this.tableHelper.getRowsData();

		if (this.nestingRelationshipField) {
			this._flattenRecordsWithChildren(data);
		}

		if (data) {
			const retrievedRowsEvent = new CustomEvent('retrievedrows', {
				detail: {
					numberOfRecordsRetrieved: data.length
				}
			});
			this.dispatchEvent(retrievedRowsEvent);

			if (data.length > this.numberOfRecords) {
				data.pop();
			}

			this.data = new DataProcessor(data).execute();
			if (this.nestingRelationshipField && this._allRows) {
				/**
				 * Not working properly
				 */
				// this._restorePreviouslyExpandedRows(this.data);
			}
			this._allRows = [...this.data];
			this._applyStyle();
			this._applySearch(true);
			this._recordsOffset += this.numberOfRecords;
		}

		if (this._table) {
			this._table.enableInfiniteLoading = true;
		}
	}

	_flattenRecordsWithChildren(rows) {
		for (let i = 0; i < rows.length; i++) {
			if (rows[i].children && rows[i].children.length) {
				this._flattenRecordsWithChildren(rows[i].children);
				Object.assign(rows[i].record, { _children: rows[i].children });
			}
			rows[i] = Object.assign({}, rows[i].record);
		}
	}

	_applyTreeGridActions(row) {
		if (!row.icon) {
			return;
		}
		const rows = this.data;
		const rowIndex = rows.findIndex((el) => row.Id === el.Id);
		let numberOfRecordsRetrieved;
		if (row.icon === 'utility:chevronright') {
			numberOfRecordsRetrieved = this._expandRows(row, rows, rowIndex);
		} else if (row.icon === 'utility:chevrondown') {
			numberOfRecordsRetrieved = this._collapseRows(row, rows, rowIndex);
		}
		this.columns[0].fixedWidth = 35 + getMaxDepthTable(rows) * 16;
		const retrievedRowsEvent = new CustomEvent('retrievedrows', {
			detail: {
				numberOfRecordsRetrieved: numberOfRecordsRetrieved,
				forceAllRecords: true
			}
		});
		this.dispatchEvent(retrievedRowsEvent);
		this.columns = JSON.parse(JSON.stringify(this.columns));
		this.data = JSON.parse(JSON.stringify(rows));
	}

	_expandRows(row, rows, rowIndex) {
		row.icon = 'utility:chevrondown';
		row.rowsToCollapse = row._children.length;

		if (row.collapsedRows) {
			rows.splice(rowIndex, 1, ...row.collapsedRows);
			this._allRows.splice(rowIndex, 1, ...row.collapsedRows);
			this._recordsOffset += row.collapsedRows.length - 1;
			return row.collapsedRows.length - 1;
		}

		rows.splice(rowIndex, 1, row, ...row._children);
		this._allRows.splice(rowIndex, 1, row, ...row._children);
		this._recordsOffset += row._children.length;
		return row._children.length;
	}

	_collapseRows(row, rows, rowIndex) {
		row.icon = 'utility:chevronright';
		const rowsToCollapse = this._getTotalRowsToCollapse(row);
		row.rowsToCollapse = 0;
		row.collapsedRows = rows.splice(rowIndex, rowsToCollapse + 1, row);
		this._allRows.splice(rowIndex, rowsToCollapse + 1, row);
		this._recordsOffset -= rowsToCollapse;
		return rowsToCollapse * -1;
	}

	_getTotalRowsToCollapse(row) {
		return (row.rowsToCollapse || 0) + this._getChildRowsCollapse(row);
	}

	_getChildRowsCollapse(row) {
		let result = 0;
		if (row._children) {
			row._children.forEach((child) => {
				const tableRecord = this.data.find((record) => record.Id === child.Id);
				if (tableRecord) {
					result += (tableRecord.rowsToCollapse || 0) + this._getChildRowsCollapse(tableRecord);
				}
			});
		}
		return result;
	}

	_switchRowsAfterDrag(detail) {
		const draggingBeginsAt = detail.draggingBeginsAt;
		const draggingEndsAt = detail.draggingEndsAt;

		if (draggingBeginsAt === draggingEndsAt) {
			return;
		}

		this.data = this.data.move(draggingBeginsAt, draggingEndsAt);

		const dropRowEvent = new CustomEvent('droprow', {
			// Deep cloned to avoid sending a reference
			detail: { tableRows: JSON.parse(JSON.stringify(this.data)) }
		});
		this.dispatchEvent(dropRowEvent);
	}
}
