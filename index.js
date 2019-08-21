const AWS = require('aws-sdk');

let TO_BUCKET, FROM_BUCKET, ffmpeg, tmp;

if( process.env.MODE === 'LOCAL' ){
  const credentials = new AWS.SharedIniFileCredentials({
    profile: 'default'
  });
  AWS.config.credentials = credentials;
  AWS.config.region = 'us-west-2';
  
  const localConfig = require('./config-local.json');
  TO_BUCKET = localConfig.TO_BUCKET;
  FROM_BUCKET = localConfig.FROM_BUCKET;
  ffmpeg = localConfig.ffmpeg;
  tmp = localConfig.tmp;
  
} else {
  const lambdaConfig = require('./config-lambda.json');
  TO_BUCKET = lambdaConfig.TO_BUCKET;
  FROM_BUCKET = lambdaConfig.FROM_BUCKET;
  ffmpeg = lambdaConfig.ffmpeg;
  tmp = lambdaConfig.tmp;
}

const s3 = new AWS.S3();
const fs = require('fs');
const { spawn } = require('child_process');

exports.handler = (event, context)=> {
  let films;
  
  if(event.isBase64Encoded) {
    let buff = new Buffer(event.body, 'base64');
    films = JSON.parse(buff.toString('ascii')).films;
  } else {
    films = JSON.parse(event.body).films;
  }

  fs.writeFileSync(tmp+'/films.txt', films.reduce((txt, film)=> txt + 'file \''+tmp+'/'+film+'\'\n', ''));

  // load from s3

  Promise.all( films.map(film=>
    (new Promise((resolve, reject)=>
      s3.getObject({
        Bucket: FROM_BUCKET, Key: film
      }, (err, response)=>{
        if( err ) return reject(err);
      
        fs.writeFile(tmp+'/'+film, response.Body, err=>
          err ? reject(err) : resolve()
        )
      })
    ))
  )).then(()=>
    (new Promise((resolve, reject)=> {
      
      const proc = spawn(ffmpeg, ['-f', 'concat', '-i', tmp+'/films.txt', '-c', 'copy', tmp + '/output.mp4']);

      let err = '';
      proc.stderr.on('data', e=> err += e);
      
      proc.on('close', code=> code ? reject(err) : resolve());      
    }))

  ).then(()=>
    // then send to s3
    (new Promise((resolve, reject)=>

      fs.readFile(tmp + '/output.mp4', (err, filedata)=> {
        if( err ) return reject(err);

        s3.putObject({
          Bucket: TO_BUCKET,
          Key: (''+Math.random()).split('.')[1] + '.mp4',
          Body: filedata,
          
        }, (err, response)=>
          err ? reject(err) : resolve()
        );
      })
    ))
    
  ).then(()=>
    context.done(null, {
      statusCode: 200,
      body: 'blah',
    })
  ).catch(err=> context.done(null, { statusCode: 500, body: err }));
};
