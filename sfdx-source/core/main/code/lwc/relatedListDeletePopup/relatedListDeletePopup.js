import { LightningElement, api } from 'lwc';
import { deleteRecord } from 'lightning/uiRecordApi';

import { showToastSuccess, showToastError } from 'c/showToastUtility';
import { reduceErrors } from 'c/utils';

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

	showSpinner;

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
		this.showSpinner = true;
		this.hide();

		// Note: handleAsyncError is not used because when the function success it returns undefined
		// as well as when it fails, so success can not be checked
		try {
			await deleteRecord(this.recordId);
			showToastSuccess(this, {
				title: `${this.sobjectLabel} deleted.`
			});

			this.dispatchEvent(new CustomEvent('recorddeleted'));
		} catch (error) {
			showToastError(this, {
				title: this.label.Error_Deleting_Record,
				message: reduceErrors(error)
			});
			console.error(error);
		}
		this.showSpinner = false;
	}
}
