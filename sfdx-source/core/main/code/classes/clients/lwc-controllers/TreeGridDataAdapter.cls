public with sharing class TreeGridDataAdapter {
	@AuraEnabled
	public static List<RecordWithChildren> getRecords(String query, String relationshipField, Integer maxDepth) {
		return new RecursiveDataSelector(query, relationshipField).queryRecursively(maxDepth);
	}
}
