/* eslint-disable guard-for-in */
export default class DataProcessor {
	data;

	constructor(data) {
		this.data = data;
	}

	execute() {
		const result = [];
		this.data.forEach((record) => {
			const row = JSON.parse(JSON.stringify(record));
			this._addExpandIcon(row, 0);
			this._processRow(row);
			result.push(row);
		});

		return result;
	}

	_addExpandIcon(row, depth) {
		// slds-cell-edit because otherwise, if the field is editable, this class is overridden by depth
		row.myClass = 'slds-cell-edit depth' + depth;
		if (row._children && row._children.length) {
			depth++;
			row.icon = 'utility:chevronright';
			row._children.forEach((childRow) => {
				this._addExpandIcon(childRow, depth);
			});
		}
	}

	_processRow(row, path, ancestor) {
		row.LinkName = '/' + row.Id;
		for (const propertyName in row) {
			const propertyValue = row[propertyName];
			if (typeof propertyValue === 'object') {
				const newValue = propertyValue.Id ? '/' + propertyValue.Id : null;
				this._flattenStructure(row, propertyName + '.', propertyValue);
				if (newValue !== null) {
					row[propertyName + '.LinkName'] = newValue;
					const currentPath = path ? path + propertyName + '.' : propertyName + '.';
					if (ancestor) {
						ancestor[currentPath + 'LinkName'] = newValue;
					}
					this._processRow(propertyValue, currentPath, row);
				}
			}
		}
		if (row._children && row._children.length) {
			row._children.forEach((childRow) => {
				this._processRow(childRow);
			});
		}
	}

	_flattenStructure(topObject, prefix, toBeFlattened) {
		for (const propertyName in toBeFlattened) {
			const propertyValue = toBeFlattened[propertyName];
			if (typeof propertyValue === 'object') {
				this._flattenStructure(topObject, prefix + propertyName + '.', propertyValue);
			} else {
				topObject[prefix + propertyName] = propertyValue;
			}
		}
	}
}
