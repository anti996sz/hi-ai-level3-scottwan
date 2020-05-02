// miniprogram/pages/level-1/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'],

      success: chooseResult => {

        wx.showLoading({
          title: '图片检测中',
        })
        
        const filePath = chooseResult.tempFilePaths[0]
        const cloudPath = 'img-to-detect' + filePath.match(/\.[^.]+?$/)[0]

        this.setData({
          faceImageUrl: filePath,
          labelList: []
        })

        // 将图片上传至云存储空间
        wx.cloud.uploadFile({
          // 指定上传到的云路径
          cloudPath,
          // 指定要上传的文件的小程序临时文件路径
          filePath,
          // 成功回调
          success: async res => {
            // console.log('上传成功', res)

            let {result} = await wx.cloud.callFunction({
              name: 'imgDetect',
              data: {
                action: 'DetectType',
                cloudPath,
                opts: { 
                  type: ["porn", "terrorist", "politics"] // "porn" 
                }
              }
            });

            if(result.RecognitionResult.PornInfo.Code != 0){
              wx.showToast({
                title: '图片违规',
                complete: (res) => {},
                // duration: 0,
                fail: (res) => {},
                // icon: icon,
                // image: 'image',
                mask: true,
                success: (res) => {},
              })

              wx.hideLoading({
                complete: (res) => {},
              })

              return
            }

            wx.cloud.callFunction({
              name: 'imgDetect',
              data: {
                action: 'DetectLabel',
                cloudPath
              }
            }).then(({
              result
            }) => {

              this.setData({
                labelList: result.RecognitionResult.Labels
              })

              wx.hideLoading({
                complete: (res) => {},
              })
            })
          },
        })
      },
    })
  }
})