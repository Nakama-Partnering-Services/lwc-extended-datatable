public with sharing class DynamicDatatableCtrl {
	@AuraEnabled(cacheable=true)
	public static List<ColumnConfig> fetchColumnsConfig(DynamicDatatableColumnsConfiguration columnsConfiguration) {
		return columnsConfiguration.getColumnsConfig();
	}

	@AuraEnabled
	public static String fetchData(DynamicDatatableQueryConfiguration queryConfig, Integer maxDepth) {
		Object result;
		String nestingRelationshipField = queryConfig.nestingRelationshipField;
		if (String.isNotBlank(nestingRelationshipField)) {
			result = TreeGridDataAdapter.getRecords(
				queryConfig.getFormattedQuery(),
				nestingRelationshipField,
				maxDepth
			);
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
