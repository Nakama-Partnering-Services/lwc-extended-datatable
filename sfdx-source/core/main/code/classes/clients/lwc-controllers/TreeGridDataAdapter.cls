public with sharing class TreeGridDataAdapter {
	// PUBLIC

	@AuraEnabled
	public static List<RecordWithChildren> getRecords(String query, String relationshipField, Integer maxDepth) {
		try {
			return new RecursiveDataSelector(query, relationshipField).queryRecursively(maxDepth);
		} catch (Exception e) {
			throw new ApplicationException().auraHandled(e);
		}
	}
}
