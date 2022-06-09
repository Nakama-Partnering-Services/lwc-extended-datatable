import { handleAsyncError } from 'c/utils';

import completeRelatedListConfig from '@salesforce/apex/RelatedListCtrl.completeRelatedListConfig';

import Related_List_Error from '@salesforce/label/c.Related_List_Error';

function _completeRelatedListConfig(context) {
	return completeRelatedListConfig({
		relatedListConfig: {
			recordId: context.recordId,
			relatedList: context.relatedList,
			childObjectName: context.childObjectName,
			relationshipField: context.relationshipField
		}
	});
}

export async function getRelatedListConfig(context) {
	const safeCompleteRelatedListConfig = handleAsyncError(_completeRelatedListConfig, {
		title: Related_List_Error
	});

	const relatedListConfig = await safeCompleteRelatedListConfig(context);

	if (relatedListConfig) {
		context._iconName = relatedListConfig.iconName;
		context._relatedList = relatedListConfig.relatedList;
		context._childObjectName = relatedListConfig.childObjectName;
		context._relationshipField = relatedListConfig.relationshipField;
		context._sobjectLabel = relatedListConfig.sobjectLabel;
		context._sobjectLabelPlural = relatedListConfig.sobjectLabelPlural;
	}
}
