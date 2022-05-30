public with sharing class RecordWithChildren {
	@AuraEnabled
	public SObject record;
	@AuraEnabled
	public List<RecordWithChildren> children;

	// CTOR

	public RecordWithChildren(SObject record) {
		this.record = record;
	}
}
