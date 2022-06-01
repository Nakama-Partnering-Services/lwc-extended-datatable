public with sharing class RelatedListCtrl {
	@AuraEnabled(cacheable=true)
	public static RelatedListConfig fetchRelatedListConfig(
		String parentId,
		String fromObject,
		String relationshipField
	) {
		return new RelatedListConfig(parentId, fromObject, relationshipField);
	}
}
