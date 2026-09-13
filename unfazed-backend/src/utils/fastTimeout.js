/**
 * Executes a promise with a fast timeout limit.
 * If the promise takes longer than timeoutMs, it returns the fallback value immediately.
 */
const withFastTimeout = (promise, fallbackValue, timeoutMs = 1500) => {
  let timer;
  const timeoutPromise = new Promise((resolve) => {
    timer = setTimeout(() => resolve(fallbackValue), timeoutMs);
  });

  return Promise.race([
    promise.then((res) => {
      clearTimeout(timer);
      return res;
    }).catch(() => fallbackValue),
    timeoutPromise,
  ]);
};

module.exports = withFastTimeout;
