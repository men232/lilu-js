export default function promiseDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
