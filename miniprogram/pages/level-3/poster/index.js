// miniprogram/pages/level-3/poster/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

    imgSrc: 'https://n1image.hjfile.cn/res7/2020/04/26/2041af2867f22e62f8fce32b29cd1fb0.png'

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    let id = options.id

    if(id){

      wx.cloud.database().collection('hi-ai-poster').doc(id).get().then(({data}) => {
        console.log(data)
        let fileID = data.fileID
        wx.cloud.getTempFileURL({
          fileList: [fileID]
        }).then(({fileList}) => {
          this.setData({
            imgSrc: fileList[0].tempFileURL
          })
        })
      })

    }


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
    let path = this.data.id ? '/pages/level-3/poster/index?id=' + this.data.id : '/pages/level-3/poster/index'

    return {
      title: '让我们快快戴口罩，抗击疫情吧！',
      imageUrl: this.data.imgSrc,
      path
    };
  },

  async savePoster(){

    const url = this.data.imgSrc

    var {tempFilePath} = await new Promise(function (resolve, reject) {

      wx.downloadFile({
        url,
  
        success(res){
          resolve(res)
        },

        fail(err){
          reject(err)
        }
      })

    })

    wx.saveImageToPhotosAlbum({

      filePath: tempFilePath,

      success(res) { 
        // console.log(res)
        wx.showToast({
          title: '保存到相册成功',
        })
      },

      fail(err){
        console.log(err)
      }
    })
  }
})