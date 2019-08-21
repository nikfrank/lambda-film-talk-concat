const AWS = require('aws-sdk');

let TO_BUCKET, FROM_BUCKET;

if( process.env.MODE === 'LOCAL' ){
  const credentials = new AWS.SharedIniFileCredentials({
    profile: 'default'
  });
  AWS.config.credentials = credentials;
  AWS.config.region = 'us-west-2';
  
  const localConfig = require('./config-local.json');
  TO_BUCKET = localConfig.TO_BUCKET;
  FROM_BUCKET = localConfig.FROM_BUCKET;
  
} else {
  const lambdaConfig = require('./config-lambda.json');
  TO_BUCKET = lambdaConfig.TO_BUCKET;
  FROM_BUCKET = lambdaConfig.FROM_BUCKET;
}

const s3 = new AWS.S3();

exports.handler = (event, context)=> {
  console.log(event.body);

  context.done(null, 'blah');
};
