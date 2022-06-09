public with sharing class RelatedListCtrl {
	@AuraEnabled(cacheable=true)
	public static RelatedListConfig completeRelatedListConfig(RelatedListConfig relatedListConfig) {
		return relatedListConfig.completeAllAttributes();
	}
}
