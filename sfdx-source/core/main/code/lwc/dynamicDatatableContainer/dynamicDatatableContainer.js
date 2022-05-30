import { LightningElement } from 'lwc';

import getRecords from '@salesforce/apex/TreeGridDataAdapter.getRecords';

const COLUMNS = [
	{
		type: 'text',
		fieldName: 'Name',
		label: 'Name',
		initialWidth: 300,
		editable: true,
		searchable: true
	},
	{
		fieldName: 'CreatedBy.LinkName',
		label: 'CreatedBy ',
		initialWidth: 300,
		editable: true,
		searchable: true,
		type: 'url',
		typeAttributes: {
			label: {
				fieldName: 'CreatedBy.Name'
			},
			target: '_top'
		}
	},
	{
		type: 'Phone',
		fieldName: 'Phone',
		label: 'Phone Number'
	}
];
export default class DynamicDatatableContainer extends LightningElement {
	tableInfo;

	connectedCallback() {
		this._setTableInfo();
	}

	// TEMPLATE

	handleRecordsUpdated() {
		this._setTableInfo();
	}

	// PRIVATE

	async _setTableInfo() {
		const records = await getRecords({
			query: 'SELECT ParentId, Id, Name, CreatedBy.Name, Phone FROM Account',
			relationshipField: 'ParentId',
			maxDepth: null
		});

		this._flattenRecordsWithChildren(records);

		this.tableInfo = {
			columns: JSON.parse(JSON.stringify(COLUMNS)),
			rows: JSON.parse(JSON.stringify(records))
		};
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
}
