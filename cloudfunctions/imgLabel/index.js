// 云函数入口文件
const extCi = require("@cloudbase/extension-ci");
const tcb = require("tcb-admin-node");

tcb.init()
tcb.registerExtension(extCi);

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const res = await tcb.invokeExtension("CloudInfinite", {
      action: "DetectLabel",
      cloudPath: event.cloudPath // 需要分析的图像的绝对路径，与tcb.uploadFile中一致
    });
    console.log(JSON.stringify(res.data, null, 4));
    return res.data
  } catch (err) {
    console.log(JSON.stringify(err, null, 4));
    return { message: error.message, stack: error.stack }
  }
}