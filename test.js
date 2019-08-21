const filmConcatter = require('./');

filmConcatter.handler({
  body: JSON.stringify({ films: ['paimei.mp4', 'paimei2.mp4' ] }),
}, {
  done: (err, url)=> err ? console.error(err) : console.log('success!', url),
});
