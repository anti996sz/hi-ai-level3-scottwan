const config = require('./config/index.js')
const {
  SecretID,
  SecretKey,
} = config


const tencentcloud = require("tencentcloud-sdk-nodejs");

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
let client = new IaiClient(cred, "ap-guangzhou", clientProfile);

exports.main = async (event) => {

  let tempUrl = event.tempUrl;
  let req = new models.DetectFaceRequest();
  let params = `{"MaxFaceNum":20,"Url":"${tempUrl}","NeedFaceAttributes":1}`
  // let params = '{"Url":"https://7363-scottwan-app-demo-7zo30-1301611203.tcb.qcloud.la/img-to-detect.jpg?sign=a83b3b6848632f89bb0f1faa2d60b825&t=1588471529"}'
  req.from_json_string(params);


  return new Promise(function (resolve, reject) {
    client.DetectFace(req, function (errMsg, response) {

      if (errMsg) {

        console.log(errMsg);
        reject(errMsg);

      } else {

        console.log(response.to_json_string());
        resolve(response);
      }


    });
  });

}