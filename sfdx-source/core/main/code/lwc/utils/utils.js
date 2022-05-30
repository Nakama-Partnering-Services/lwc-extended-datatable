import { showToastError } from 'c/showToastUtility';

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
					message: error.body ? error.body.message : error.message
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

export { handleAsyncError, getDebouncedFunction, removeSpecialChars };
