const filmConcatter = require('./');

filmConcatter.handler({}, {
  fail: err => console.error(err),
  succeed: url=> console.log('success!', url),
});
