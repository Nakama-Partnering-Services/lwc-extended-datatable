import { showToastError } from 'c/showToastUtility';

/**
 * Reduces one or more LDS errors into a string of comma-separated error messages.
 * @param {FetchResponse|FetchResponse[]} errors
 * @return {String} Error messages separated by comma
 */
const reduceErrors = (errors) => {
	if (!Array.isArray(errors)) {
		errors = [errors];
	}

	return (
		errors
			// Remove null/undefined items
			.filter((error) => !!error)
			// Extract an error message
			.map((error) => {
				const body = error.body;
				if (body) {
					// UI API read errors
					if (body.duplicateResults?.length) {
						return body.duplicateResults.map((e) => e.message);
					} else if (body.fieldErrors?.length) {
						return body.fieldErrors.map((e) => e.message);
					} else if (body.pageErrors?.length) {
						return body.pageErrors.map((e) => e.message);
					} else if (Array.isArray(body)) {
						return body.map((e) => e.message);
					}
					// UI API DML, Apex and network errors
					else if (typeof body.message === 'string') {
						if (body.output?.errors?.length) {
							return body.message + ' ' + body.output.errors.map((e) => e.errorCode + ': ' + e.message);
						}
						return body.message;
					}
				}

				// JS errors
				else if (typeof error.message === 'string') {
					return error.message;
				}
				// Unknown error shape so try HTTP status text
				return error.statusText;
			})
			// Flatten
			.reduce((prev, curr) => prev.concat(curr), [])
			// Remove empty strings
			.filter((message) => !!message)
			.join()
	);
};

/**
 * Returns an async function wrapped to handle its possible errors
 * @param {function} asyncFunction - Async function to wrap. It should return a promise
 * @param {object} onErrorOptions - Toast options for the error notification if function fails
 */
const handleAsyncError =
	(asyncFunction, onErrorOptions) =>
	(context, ...params) =>
		asyncFunction(context, ...params).catch((error) => {
			showToastError(
				context,
				Object.assign(onErrorOptions, {
					message: reduceErrors(error)
				})
			);
			console.error(error);
		});

/**
 * Returns a function ready to be executed after the provided delay if it has not been called again in the meantime
 * @param {function} functionToDebounce - Function that will wait before being executed
 * @param {object} delay - Time that the function should wait before being executed
 * @warning this method sets the "_timeout" variable available for usage in the context from which this function is called,
 *          so that the context can use the variable at its own discretion to, for example, call the clearTimeout() method
 */
const getDebouncedFunction =
	(functionToDebounce, delay) =>
	(context, ...params) => {
		clearTimeout(context._timeout);
		// eslint-disable-next-line @lwc/lwc/no-async-operation
		context._timeout = setTimeout(() => functionToDebounce.call(context, ...params), delay);
	};

// Explanation: https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
const removeSpecialChars = (str) => str?.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export { handleAsyncError, reduceErrors, getDebouncedFunction, removeSpecialChars };
