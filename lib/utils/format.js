export default function format(fmt, ...args) {
  const re = /(%?)(%([jdsoO]))/g;

  if (args.length) {
    fmt = fmt.replace(re, (match, escaped, ptn, flag) => {
      let arg = args.shift();
      switch(flag) {
        case 's':
          arg = '' + arg;
          break;
        case 'd':
          arg = Number(arg);
          break;
        case 'j':
          arg = JSON.stringify(arg);
          break;
        case 'o':
          arg = JSON.stringify(arg);
          break;
        case 'O':
          arg = JSON.stringify(arg, null, 2);
          break;
      }
      if(!escaped) {
        return arg;
      }
      args.unshift(arg);
      return match;
    })
  }

  if (args.length) {
    fmt += ' ' + args.join(' ');
  }

  // update escaped %% values
  fmt = fmt.replace(/%{2}/g, '%');

  return '' + fmt;
}
