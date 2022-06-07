import { handleAsyncError } from 'c/utils';

import { getColumnsConfig, getRowsData } from './utils';

import Fetch_Columns_Config_Error from '@salesforce/label/c.Fetch_Columns_Config_Error';
import Fetch_Data_Error from '@salesforce/label/c.Fetch_Data_Error';

export default class TableHelper {
	parentComponentInstance;

	get columnsConfiguration() {
		return {
			columnsConfiguration: {
				objectApiName: this.parentComponentInstance._childObjectName,
				fieldSetName: this.parentComponentInstance.fieldset,
				hideDefaultColumnsActions: this.parentComponentInstance.hideDefaultColumnsActions,
				sortable: this.parentComponentInstance.sortable,
				editable: this.parentComponentInstance.enableInlineEditing,
				searchable: this.parentComponentInstance.searchable
			}
		};
	}

	get queryConfig() {
		return {
			queryConfig: {
				selectFieldSet: this.parentComponentInstance.fieldset,
				fromObject: this.parentComponentInstance._childObjectName,
				relationshipField: this.parentComponentInstance._relationshipField,
				parentId: this.parentComponentInstance.recordId,
				orderBy: this.parentComponentInstance.orderBy,
				recordsLimit: this.parentComponentInstance.numberOfRecords + 1,
				recordsOffset: this.parentComponentInstance._realQueryOffset,
				nestingRelationshipField: this.parentComponentInstance.nestingRelationshipField
			},
			maxDepth: this.parentComponentInstance.maxDepth
		};
	}

	constructor(parentComponentInstance) {
		this.parentComponentInstance = parentComponentInstance;
	}

	// PUBLIC

	getColumnsConfig() {
		const safeFetchColumnsConfig = handleAsyncError(getColumnsConfig, {
			title: Fetch_Columns_Config_Error
		});

		return safeFetchColumnsConfig(this.parentComponentInstance, this.columnsConfiguration);
	}

	async getRowsData() {
		const safeFetchData = handleAsyncError(getRowsData, {
			title: Fetch_Data_Error
		});

		let result = await safeFetchData(this.parentComponentInstance, this.queryConfig);

		if (result) {
			result = JSON.parse(result);
		}

		return result;
	}
}
