const AWS = require('aws-sdk');
const encrypted = process.env['PD_API_TOKEN'];
let decrypted;
const https = require('https')

exports.handler = (event, context, callback) => {
  if (decrypted) {
    processEvent(event, context, callback);
  } else {
        // Decrypt code should run once and variables stored outside of the function
        // handler so that these are decrypted once per container
        const kms = new AWS.KMS();
        kms.decrypt({ CiphertextBlob: new Buffer(encrypted, 'base64') }, (err, data) => {
          if (err) {
            console.log('Decrypt error:', err);
            return callback(err);
          }
          decrypted = data.Plaintext.toString('ascii');
          console.log("decrypted: " + decrypted)
          processEvent(event, context, callback);
        });
      }
    };


    function processEvent(event, context, callback) {
      console.log("process.env:" + process.env)
      console.log("event:" + event)
      const postData = JSON.stringify({
        "service_key": process.env.PD_API_TOKEN,
        "event_type": "trigger",
        "description": "web demo",
        "details": {"important": "Following docs from client_url"},
        "client": "susibutton_js",
        "client_url": "https://v2.developer.pagerduty.com/v2/docs/trigger-events",
        "contexts": []
      })

      const options = {
        hostname: 'events.pagerduty.com',
        port: 443,
        path: '/generic/2010-04-15/create_event.json',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          console.log(`BODY: ${chunk}`);
        });
        res.on('end', () => {
          console.log('No more data in response.');
        });
      });

      req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
      });

      // write data to request body
      req.write(postData);
      req.end();

}

