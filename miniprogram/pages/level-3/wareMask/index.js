// miniprogram/pages/level-3/wareMask/index.js
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

    const that = this

    wx.getSystemInfo({
      success (res) {
        // console.log(res.model)
        // console.log(res.pixelRatio)
        that.setData({
          pixelRatio: res.pixelRatio
        })
        // console.log(res.windowWidth)
        // console.log(res.windowHeight)
        // console.log(res.language)
        // console.log(res.version)
        // console.log(res.platform)
      }
    })

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

  onGetUserInfo(e) {
    // console.log(e.detail)
    this.setData({
      cutImageSrc: e.detail.userInfo.avatarUrl
    })
  },

  onRemoveImage() {
    this.setData({
      cutImageSrc: null
    })
  },

  touchStart(e) {
    // console.log('touch start: ', e)
    this.data.maskIndex = e.mark.index
    this.data.startX = e.touches[0].clientX
    this.data.startY = e.touches[0].clientY
  },

  touchMove(e) {
    // console.log('touch move: ', e)
    this.data.endX = e.touches[0].clientX
    this.data.endY = e.touches[0].clientY

    let mask = this.data.maskList[this.data.maskIndex]

    mask.top = this.data.endY - this.data.startY + mask.top,
      mask.left = this.data.endX - this.data.startX + mask.left,

      this.setData({
        maskList: this.data.maskList
      })

    this.data.startX = this.data.endX
    this.data.startY = this.data.endY
  },

  touchEnd(e) {
    // console.log('touch end: ', e)
    // this.data.endX = e.changedTouches[0].clientX
    // this.data.endY = e.changedTouches[0].clientY
    // this.setData({
    //   style: `top: ${this.data.endY}px; left: ${this.data.endX-40}px;`,
    // })
    // console.log(this.data.style)
  },

  async onChooseImage() {

    let {
      tempFilePaths
    } = await this.chooseImage()
    this.setData({
      cutImageSrc: tempFilePaths[0]
    })

    let filePath = await tempFilePaths[0]

    // 压缩图片

    let {
      tempFilePath
    } = await this.imgCompress(filePath)
    let imgContent = wx.getFileSystemManager().readFileSync(tempFilePath, 'base64')
    // console.log(imgContent)

    // 五官分析

    let {
      result
    } = await wx.cloud.callFunction({
      name: 'AnalyzeFace',
      data: {
        imgContent
      }
    })

    // console.log(result)
    this.setData({
      faceData: result
    })
    // this.data.faceData = result

    // 随机戴口罩

    this.wareMask(result)





    // 上传到云空间

    // let cloudPath = 'hi-ai-l3/' + Date.now() + filePath.match(/\.[^.]+?$/)[0]

    // let {fileID} = wx.cloud.uploadFile({
    //   filePath,
    //   cloudPath
    // })

    // console.log(fileID)


    // 检测人脸，返回每个人脸的位置信息

    // 给每个人脸戴口罩

  },

  chooseImage() {

    return new Promise(function (resolve, reject) {

      wx.chooseImage({

        complete: (res) => {
          // console.log(res)
          resolve(res);
        },

        fail(error) {
          // console.log(error)
          reject(error)
        }
      })

    });
  },

  imgCompress(filePath) {

    return new Promise(function (resolve, reject) {

      wx.compressImage({

        src: filePath,
        quality: 0.1,

        success(res) {
          // console.log(res)
          resolve(res)
        },

        fail(err) {
          reject(err)
        }
      })

    })

  },

  wareMask(faceData) {

    // console.log(faceData)
    const {
      ImageWidth,
      ImageHeight,
      FaceShapeSet
    } = faceData

    let maskList = FaceShapeSet.map(face => {

      let id = Math.floor(Math.random() * 10) % 7 + 1

      // 嘴的中心与口罩的中心

      let mouthData = face.Mouth
      let getEndPoints = (result, point) => {
        return {
          leftPoint: result.leftPoint.X < point.X ? result.leftPoint : point,
          rightPoint: result.rightPoint.X > point.X ? result.rightPoint : point
        }
      }
      let mouthEndPoints = mouthData.reduce(getEndPoints, {leftPoint: mouthData[0], rightPoint: mouthData[0]})

      let scale = 1 // (mouthEndPoints.rightPoint.X - mouthEndPoints.leftPoint.X) * 2 * this.data.pixelRatio / 200
      let picRatio = 600 / this.data.pixelRatio / ImageWidth

      // 口罩宽度为口宽的3倍
      let width = (mouthEndPoints.rightPoint.X - mouthEndPoints.leftPoint.X) * 6 * picRatio

      // 嘴的中心减去口罩的宽度
      let top = mouthEndPoints.leftPoint.Y * picRatio - width / 2
      let left = (mouthEndPoints.rightPoint.X + mouthEndPoints.leftPoint.X) /2  * picRatio - width / 2

      return {
        id,
        top,
        left,
        width,
        scale,
        rotate: 0
      }
    })

    this.setData({
      maskList
    })
  },

  selectMask(e){
    let currentShapeIndex = e.mark.index
    this.setData({
      currentShapeIndex: currentShapeIndex == this.data.currentShapeIndex ? -1 : currentShapeIndex
    })
  },

  setMask(e){
    let maskId = e.mark.id
    if(this.data.currentShapeIndex >= 0){
      let mask = this.data.maskList[this.data.currentShapeIndex]
      mask.id = maskId
      
      this.setData({
        maskList: this.data.maskList
      })
    }
  }

})