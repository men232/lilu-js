export default function timer() {
  let startAt = Date.now();

  const instance = {
    reset: () => {
      startAt = Date.now();

      return instance;
    },
    click: () => Date.now() - startAt
  };

  return instance;
}
