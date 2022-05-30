@IsTest
private with sharing class ApplicationExceptionTest {
	@IsTest
	private static void messageInConstructor() {
		// Setup
		String testMessage = 'test error';

		// Exercise
		Exception ex = new ApplicationException(testMessage);

		// Verify
		System.assertEquals(testMessage, ex.getMessage());
	}

	@IsTest
	private static void throwsAuraWithMessageInConstructor() {
		// Setup
		String testMessage = 'test error';

		// Exercise
		Exception ex;
		try {
			new ApplicationException(testMessage).throwAuraHandled();
		} catch (AuraHandledException e) {
			ex = e;
		}

		// Verify
		System.assertEquals(testMessage, ex.getMessage());
	}

	@IsTest
	private static void throwWithAuraHandled() {
		// Setup
		String testMessage = 'test error';
		Exception testException = new ApplicationException(testMessage);

		// Exercise
		Exception ex;
		try {
			throw new ApplicationException().auraHandled(testException);
		} catch (Exception e) {
			ex = e;
		}

		// Verify
		System.assertEquals(testMessage, ex.getMessage());
	}
}
