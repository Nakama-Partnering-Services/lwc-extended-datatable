import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { encodeDefaultFieldValues } from 'lightning/pageReferenceUtils';
import { loadStyle } from 'lightning/platformResourceLoader';

import { handleAsyncError, getDebouncedFunction } from 'c/utils';

import relatedListResources from '@salesforce/resourceUrl/relatedListResources';
import completeRelatedListConfig from '@salesforce/apex/RelatedListCtrl.completeRelatedListConfig';

import Message_when_too_short from '@salesforce/label/c.Message_when_too_short';
import New from '@salesforce/label/c.New';
import Related_List_Error from '@salesforce/label/c.Related_List_Error';
import Search from '@salesforce/label/c.Search';
import Search_this_list from '@salesforce/label/c.Search_this_list';
import View_All from '@salesforce/label/c.View_All';

const actions = [
	{ label: 'View', name: 'view' },
	{ label: 'Edit', name: 'edit' },
	{ label: 'Delete', name: 'delete' }
];

// Global value that will increase for each component instance
let _numberOfCurrentInstance = 0;

export default class RelatedList extends NavigationMixin(LightningElement) {
	label = {
		Message_when_too_short,
		New,
		Related_List_Error,
		Search,
		Search_this_list,
		View_All
	};

	// Required
	@api recordId;
	@api fieldset;

	// Optional
	@api orderBy = 'Id ASC NULLS LAST, CreatedDate';
	@api recordsToLoad = 6;
	@api height = 'auto';

	@api hideHeader;
	@api headerIcon;
	@api customTitle;
	@api showSubtitle;
	@api customSubtitle;
	@api hideNewAction;
	@api showSearch;
	@api hideFooter;
	@api isOuterComponent;

	// Optional, datatable specific
	@api showRowNumberColumn;
	@api hideCheckboxColumn;
	@api resizeColumnDisabled;
	@api enableInfiniteLoading;

	@api hideDefaultColumnsActions;
	@api sortable;
	@api enableInlineEditing;

	// Optional, treeGrid specific
	@api nestingRelationshipField;
	@api maxDepth;

	// Optional, not available for manual input
	@api tableInfoHasEditableColumns;
	@api actions = actions;
	@api implementsDragAndDrop;
	@api customHandleNewEnabled;
	@api customHandleRowActionEnabled;
	@api customHandleSave;

	showSpinner;

	// Needed to give a different id to each individual instance of this component in the same page,
	// so that we can individually scope css dynamically for each of them
	instance = `instance${_numberOfCurrentInstance}`;

	_iconName;
	_sobjectLabel;
	_sobjectLabelPlural;
	_accumulatedRecordsRetrieved = 0;
	_numberOfRecordsTitle;
	_isStyleApplied;

	// required from app builder
	_relatedList;
	@api get relatedList() {
		return this._relatedList;
	}

	set relatedList(value) {
		this._relatedList = value;
	}

	// Not available from manual input, required if relatedList is not specified, this should.
	_childObjectName;
	@api get childObjectName() {
		return this._childObjectName;
	}

	set childObjectName(value) {
		this._childObjectName = value;
	}

	// Optional
	_relationshipField;
	@api get relationshipField() {
		return this._relationshipField;
	}

	set relationshipField(value) {
		this._relationshipField = value;
	}

	// If provided, other required attributes will be ignored
	_tableInfo;
	@api get tableInfo() {
		return this._tableInfo;
	}

	set tableInfo(value) {
		this._tableInfo = value;
		if (value) {
			this._accumulatedRecordsRetrieved = 0;
		}
	}

	@api get tableComponent() {
		return this.template.querySelector('c-dynamic-datatable').tableComponent;
	}

	get iconName() {
		return this.headerIcon || this._iconName;
	}

	get title() {
		return (
			this.customTitle ||
			`${this._sobjectLabelPlural || ''} ${
				this._numberOfRecordsTitle ? '(' + this._numberOfRecordsTitle + ')' : ''
			}`
		);
	}

	get subtitle() {
		const items = this._numberOfRecordsTitle === '1' ? 'item' : 'items';
		return this.customSubtitle || `${this._numberOfRecordsTitle ? this._numberOfRecordsTitle + ' ' + items : ''}`;
	}

	_baseLightningLayoutClasses = 'slds-m-top_x-small';
	get lightningLayoutClasses() {
		return this.isOuterComponent
			? this._baseLightningLayoutClasses
			: `${this._baseLightningLayoutClasses} slds-box slds-p-around_none`;
	}

	_baseHeaderClasses = 'slds-col slds-media slds-media_center slds-has-flexi-truncate';
	get headerClasses() {
		return this.isOuterComponent
			? this._baseHeaderClasses
			: `${this._baseHeaderClasses} slds-p-top_medium slds-p-horizontal_medium`;
	}

	_baseSubheaderClasses = 'slds-col slds-grid slds-grid_align-spread slds-p-top_x-small';
	get subheaderClasses() {
		return this.isOuterComponent
			? this._baseSubheaderClasses
			: `${this._baseSubheaderClasses} slds-p-horizontal_medium`;
	}

	_baseFooterClasses = 'slds-card__footer slds-m-top_none';
	get footerClasses() {
		return this.height !== 'auto' ? this._baseFooterClasses : `${this._baseFooterClasses} no-border-top`;
	}

	// If this.recordsToLoad is received from the parent, we need to parse it from string to number: parseInt(this.recordsToLoad)
	get numberOfRecords() {
		return parseInt(this.recordsToLoad, 10);
	}

	async connectedCallback() {
		_numberOfCurrentInstance++;
		// Retrieve related list configuration in connectedCallback instead of wired methods
		// since relationshipField is optional and, if it is never assigned, wired method is never called
		if (this.recordId) {
			this.showSpinner = true;
			await this._getRelatedListConfig();
			this.showSpinner = false;
		}
	}

	renderedCallback() {
		loadStyle(this, relatedListResources + '/relatedList.css');
		this._applyStyle();
	}

	// API EXPOSED

	@api handleRefresh() {
		this._accumulatedRecordsRetrieved = 0;
		this.template.querySelector('c-dynamic-datatable').handleRefresh();
	}

	// PUBLIC

	handleRetrievedRows(event) {
		const numberOfRecordsRetrieved = event.detail.numberOfRecordsRetrieved;
		let numberOfRecordsTitle;

		if (numberOfRecordsRetrieved > this.numberOfRecords && !event.detail.forceAllRecords) {
			this._accumulatedRecordsRetrieved += this.numberOfRecords;
			numberOfRecordsTitle = `${this._accumulatedRecordsRetrieved}+`;
		} else {
			this._accumulatedRecordsRetrieved += numberOfRecordsRetrieved;
			numberOfRecordsTitle = `${this._accumulatedRecordsRetrieved}`;
		}

		this._numberOfRecordsTitle = numberOfRecordsTitle;

		this.dispatchEvent(new CustomEvent('retrievedrows', event));
	}

	handleCreateRecord() {
		if (this.customHandleNewEnabled) {
			this.dispatchEvent(new CustomEvent('createrecord'));
		} else {
			let defaultValues = '';
			if (this.recordId && this._relationshipField) {
				defaultValues = encodeDefaultFieldValues({
					[this._relationshipField]: this.recordId
				});
			}

			this[NavigationMixin.Navigate]({
				type: 'standard__objectPage',
				attributes: {
					objectApiName: this._childObjectName,
					actionName: 'new'
				},
				state: {
					defaultFieldValues: defaultValues,
					useRecordTypeCheck: 1
				}
			});
		}
	}

	handleSearch(event) {
		const applySearchDebounced = getDebouncedFunction(this._applySearch, 500);
		applySearchDebounced(this, event.target.value);
	}

	handleRowAction(event) {
		if (this.customHandleRowActionEnabled) {
			this.dispatchEvent(new CustomEvent('rowaction', event));
		} else {
			const actionName = event.detail.action.name;
			const row = event.detail.row;
			this.handleDefaultActions(actionName, row);
		}
	}

	handleDefaultActions(actionName, row) {
		switch (actionName) {
			case 'view':
				this[NavigationMixin.Navigate]({
					type: 'standard__recordPage',
					attributes: {
						recordId: row.Id,
						actionName: 'view'
					}
				});
				break;
			case 'edit':
				this[NavigationMixin.Navigate]({
					type: 'standard__recordPage',
					attributes: {
						recordId: row.Id,
						actionName: 'edit'
					}
				});
				break;
			case 'delete':
				this._handleDeleteRecord(row);
				break;
			default:
		}
	}

	handleGoToRelatedList() {
		if (this.recordId && this._relatedList) {
			this[NavigationMixin.Navigate]({
				type: 'standard__recordRelationshipPage',
				attributes: {
					recordId: this.recordId,
					relationshipApiName: this._relatedList,
					actionName: 'view'
				}
			});
		}
	}

	handleDropRow(event) {
		this.dispatchEvent(new CustomEvent('droprow', event));
	}

	handleInlineEditSave(event) {
		this.dispatchEvent(new CustomEvent('inlineeditsave', event));
	}

	handleRecordsUpdated(event) {
		this._accumulatedRecordsRetrieved = 0;
		this.dispatchEvent(new CustomEvent('recordsupdated', event));
	}

	handleRowSelection(event) {
		this.dispatchEvent(new CustomEvent('rowselection', event));
	}

	handleHeaderAction(event) {
		this.dispatchEvent(new CustomEvent('headeraction', event));
	}

	handleSearchApplied(event) {
		if (!event.detail.withoutChanges) {
			const numberOfRecordsRetrieved = event.detail.numberOfRecordsRetrieved;
			if (event.detail.isRefresh && numberOfRecordsRetrieved > this.numberOfRecords) {
				this._accumulatedRecordsRetrieved = this.numberOfRecords;
				this._numberOfRecordsTitle = `${this._accumulatedRecordsRetrieved}+`;
			} else {
				this._accumulatedRecordsRetrieved = numberOfRecordsRetrieved;
				this._numberOfRecordsTitle = `${this._accumulatedRecordsRetrieved}`;
			}
		}
		this.dispatchEvent(new CustomEvent('searchapplied', event));
	}

	// PRIVATE

	async _getRelatedListConfig() {
		const safeCompleteRelatedListConfig = handleAsyncError(this._completeRelatedListConfig, {
			title: this.label.Related_List_Error
		});

		const relatedListConfig = await safeCompleteRelatedListConfig(this, {
			parentId: this.recordId,
			relatedList: this._relatedList,
			childObjectName: this._childObjectName,
			relationshipField: this.relationshipField
		});

		if (relatedListConfig) {
			this._iconName = relatedListConfig.iconName;
			this._relatedList = relatedListConfig.relatedList;
			this._childObjectName = relatedListConfig.childObjectName;
			this._relationshipField = relatedListConfig.relationshipField;
			this._sobjectLabel = relatedListConfig.sobjectLabel;
			this._sobjectLabelPlural = relatedListConfig.sobjectLabelPlural;
		}
	}

	/*Separate first real column header from the left of the table*/
	_applyStyle() {
		if (!this._isStyleApplied) {
			let firstColumnIndex = 1;
			if (this.showRowNumberColumn || this.enableInlineEditing || this.tableInfoHasEditableColumns) {
				firstColumnIndex++;
			}
			if (!this.hideCheckboxColumn) {
				firstColumnIndex++;
			}
			const style = document.createElement('style');
			// TODO: add proper width to the same element where padding-left is applied,
			// in order to make resize border visible if column resizing is enabled
			style.innerText = `
                [data-instance="${this.instance}"] thead>tr>th:nth-child(${firstColumnIndex}) {
                    padding-left: var(--lwc-varSpacingXSmall);
                }
            `;
			this.template.querySelector('.related-list').appendChild(style);
			this._isStyleApplied = true;
		}
	}

	/**
	 * Wrapper function with self (although unused) parameter so it can be used by handlerAsyncError
	 */
	_completeRelatedListConfig(self, queryConfig) {
		return completeRelatedListConfig(queryConfig);
	}

	_applySearch(searchTerm) {
		this._accumulatedRecordsRetrieved = 0;
		this.template.querySelector('c-dynamic-datatable').handleSearch(searchTerm);
	}

	_handleDeleteRecord(row) {
		const deletePopup = this.template.querySelector('c-related-list-delete-popup');
		deletePopup.recordId = row.Id;
		deletePopup.sobjectLabel = this._sobjectLabel;
		deletePopup.show();
	}
}
