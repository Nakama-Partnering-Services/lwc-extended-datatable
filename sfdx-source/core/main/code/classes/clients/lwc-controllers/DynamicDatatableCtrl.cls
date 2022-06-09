public with sharing class DynamicDatatableCtrl {
	@AuraEnabled(cacheable=true)
	public static List<ColumnConfig> fetchColumnsConfig(DynamicDatatableColumnsConfiguration columnsConfiguration) {
		return columnsConfiguration.getColumnsConfig();
	}

	// Note: this method is not cached since data fetching is incremental and records may have changed
	@AuraEnabled
	public static String fetchData(DynamicDatatableQueryConfiguration queryConfig, Integer maxDepth) {
		Object result;
		final String nestingRelationshipField = queryConfig.nestingRelationshipField;

		// Note: queryConfig.getFormattedQuery() uses WITH SECURITY_ENFORCED
		if (String.isNotBlank(nestingRelationshipField)) {
			result = new RecursiveDataSelector(queryConfig.getFormattedQuery(), nestingRelationshipField)
				.queryRecursively(maxDepth);
		} else {
			result = Database.query(queryConfig.getFormattedQuery());
		}
		return JSON.serialize(result);
	}

	@AuraEnabled
	public static void updateRecords(List<SObject> records) {
		// FALSE POSITIVE: OLS and FLS checks are already performed by the LWC where this method is being used
		update records;
	}
}
