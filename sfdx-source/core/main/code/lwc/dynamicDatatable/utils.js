import fetchColumnsConfig from '@salesforce/apex/DynamicDatatableCtrl.fetchColumnsConfig';
import fetchData from '@salesforce/apex/DynamicDatatableCtrl.fetchData';
import updateRecords from '@salesforce/apex/DynamicDatatableCtrl.updateRecords';

/**
 * Wrapper function with self (although unused) parameter so it can be used by handlerAsyncError
 */
export function getColumnsConfig(self, columnsConfig) {
	return fetchColumnsConfig(columnsConfig);
}

/**
 * Wrapper function with self (although unused) parameter so it can be used by handlerAsyncError
 */
export function getRowsData(self, queryConfig) {
	return fetchData(queryConfig);
}

/**
 * Wrapper function with self (although unused) parameter so it can be used by handlerAsyncError
 */
export function update(self, records) {
	return updateRecords(records);
}

/**
 * NOTE: Special characters like á are understood as greater than z
 */
export function sortBy(field, reverse) {
	const key = (x) => x[field];

	return (a, b) => {
		a = key(a);
		b = key(b);
		return reverse * ((a > b) - (b > a));
	};
}

export function hasNestedRows(rows) {
	let result = false;
	for (const row of rows) {
		if (row._children && row._children.length > 0) {
			result = true;
		}
	}
	return result;
}

export function numberOfMaxDepthChildren(allRows) {
	let result = 0;
	allRows.forEach((row) => {
		const depth = _increaseMaxDepth(row, result);
		if (result < depth) {
			result = depth;
		}
	});
	return result;
}

function _increaseMaxDepth(row, maxDepth) {
	if (row._children && row._children.length) {
		maxDepth++;
		row._children.forEach((childRow) => {
			const depth = _increaseMaxDepth(childRow, maxDepth);
			if (maxDepth < depth) {
				maxDepth = depth;
			}
		});
	}
	return maxDepth;
}

export function getMaxDepthTable(rows) {
	let result = 0;

	rows.forEach((row) => {
		const depth = parseInt(row.myClass.substring(20), 10);
		if (result < depth) {
			result = depth;
		}
	});

	return result;
}
