const tencentcloud = require("tencentcloud-sdk-nodejs");
const {SecretID, SecretKey} = require('./config.json');

const IaiClient = tencentcloud.iai.v20180301.Client;
const models = tencentcloud.iai.v20180301.Models;

const Credential = tencentcloud.common.Credential;
const ClientProfile = tencentcloud.common.ClientProfile;
const HttpProfile = tencentcloud.common.HttpProfile;

let cred = new Credential(SecretID, SecretKey);
let httpProfile = new HttpProfile();
httpProfile.endpoint = "iai.tencentcloudapi.com";
let clientProfile = new ClientProfile();
clientProfile.httpProfile = httpProfile;
let client = new IaiClient(cred, "", clientProfile);

let req = new models.AnalyzeFaceRequest();

// 云函数入口函数
exports.main = async (event, context) => {

  let imgContent = event.imgContent;

  let params = `{"Image":"${imgContent}"}`
  req.from_json_string(params);

  return new Promise(function (resolve, reject) {
    client.AnalyzeFace(req, function (errMsg, response) {

      if (errMsg) {

        console.log(errMsg);
        reject({
          message: errMsg.message,
          stack: errMsg.stack
        });

      } else {

        console.log(response.to_json_string());
        resolve(response)

      }

    });
  })
}