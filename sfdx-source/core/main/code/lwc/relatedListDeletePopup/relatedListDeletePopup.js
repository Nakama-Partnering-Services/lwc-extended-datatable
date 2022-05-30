import { LightningElement, api } from 'lwc';
import { deleteRecord } from 'lightning/uiRecordApi';

import { handleAsyncError } from 'c/utils';
import { showToastSuccess } from 'c/showToastUtility';

import Cancel from '@salesforce/label/c.Cancel';
import Delete from '@salesforce/label/c.Delete';
import Delete_Confirmation from '@salesforce/label/c.Delete_Confirmation';
import Error_Deleting_Record from '@salesforce/label/c.Error_Deleting_Record';

export default class RelatedListDeletePopup extends LightningElement {
	label = {
		Cancel,
		Delete,
		Delete_Confirmation,
		Error_Deleting_Record
	};

	@api recordId;
	@api sobjectLabel;

	get body() {
		return `${this.label.Delete_Confirmation} ${this.sobjectLabel ? this.sobjectLabel.toLowerCase() : ''}?`;
	}

	get title() {
		return `${this.label.Delete} ${this.sobjectLabel}`;
	}

	@api show() {
		this.template.querySelector('c-modal').show();
	}

	@api hide() {
		this.template.querySelector('c-modal').hide();
	}

	handleCancel() {
		this.hide();
	}

	async handleDelete() {
		this.hide();

		const safeDeleteRecord = handleAsyncError(this.deleteRecord, {
			title: this.label.Error_Deleting_Record
		});
		await safeDeleteRecord(this, this.recordId);

		showToastSuccess(this, {
			title: `${this.sobjectLabel} deleted.`
		});
		this.dispatchEvent(new CustomEvent('recorddeleted'));
	}

	/**
	 * Wrapper function with self (although unused) parameter so it can be used by handlerAsyncError
	 */
	deleteRecord(self, recordId) {
		return deleteRecord(recordId);
	}
}
