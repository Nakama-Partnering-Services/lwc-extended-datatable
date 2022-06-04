public with sharing class RelatedListCtrl {
	@AuraEnabled(cacheable=true)
	public static RelatedListConfig completeRelatedListConfig(
		String parentId,
		String relatedList,
		String fromObject,
		String relationshipField
	) {
		return new RelatedListConfig(parentId, relatedList, fromObject, relationshipField);
	}
}
