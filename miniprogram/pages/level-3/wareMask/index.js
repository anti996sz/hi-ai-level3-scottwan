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

    let url = options.url
    if(!url) return

    this.setData({
      cutImageSrc: url
    })

    wx.downloadFile({
      url,
      success (res) {
        // 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，业务需要自行判断是否下载到了想要的内容
        if (res.statusCode === 200) {
          that.processImg(res.tempFilePath)
        }
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
  onShareAppMessage: async function () {

    let path = '/pages/level-3/poster/index'
    let imageUrl = 'https://n1image.hjfile.cn/res7/2020/04/26/2041af2867f22e62f8fce32b29cd1fb0.png';

    if(this.data.posterData){

      imageUrl = this.data.posterData.posterSrc

      // 上传图片到云

      let {fileID} = await wx.cloud.uploadFile({
        filePath: imageUrl,
        cloudPath: 'poster/' + Date.now() + imageUrl.match(/\.[^.]+?$/)[0]
      })

      // let {fileList} = await wx.cloud.getTempFileURL({
      //   fileList: [fileID]
      // })

      // imageUrl = fileList[0].tempFileURL

      // 保存数据
      let {_id} = await wx.cloud.database().collection('hi-ai-poster').add({
        data: {
          fileID,
          // imageUrl
        }
      })

      // 生成链接
      path += `?id=${_id}`
    }

    // console.log(imageUrl)

    return {
      title: '让我们快快戴口罩，抗击疫情吧！',
      imageUrl,
      path
    };

  },

  onGetUserInfo(e) {
    // console.log(e.detail)
    this.setData({
      cutImageSrc: e.detail.userInfo.avatarUrl
    })

    let that = this

    wx.downloadFile({
      url: e.detail.userInfo.avatarUrl,
      success (res) {
        // 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，业务需要自行判断是否下载到了想要的内容
        if (res.statusCode === 200) {
          that.processImg(res.tempFilePath)
        }
      }
    })

  },

  onRemoveImage() {
    this.setData({
      cutImageSrc: null,
      maskList: []
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

    mask.centerX += this.data.endX - this.data.startX
    mask.centerY += this.data.endY - this.data.startY

    mask.top += this.data.endY - this.data.startY,
    mask.left += this.data.endX - this.data.startX,

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

  async onChooseImage(){
    let {tempFilePaths} = await this.chooseImage()

    this.setData({
      cutImageSrc: tempFilePaths[0]
    })

    let filePath = await tempFilePaths[0]

    this.processImg(filePath)
  },

  async processImg(filePath) {

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
      let centerX = (mouthEndPoints.rightPoint.X + mouthEndPoints.leftPoint.X) /2  * picRatio
      let centerY = (mouthEndPoints.rightPoint.Y + mouthEndPoints.leftPoint.Y) /2  * picRatio
      let top = centerY - width / 2
      let left = centerX - width / 2

      let diff_y = mouthEndPoints.rightPoint.Y - mouthEndPoints.leftPoint.Y
      let diff_x = mouthEndPoints.rightPoint.X - mouthEndPoints.leftPoint.X
      let rotate = (Math.atan2(diff_y, diff_x) / Math.PI) * 180;

      return {
        id,
        centerX,
        centerY,
        top,
        left,
        width,
        scale,
        rotate
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
      
    } else {

      this.data.maskList.push({
        id: maskId,
        top: 100,
        left:100,
        width: 100,
        height: 100,
        centerX: 150,
        centerY: 150
      })
    }

    this.setData({
      maskList: this.data.maskList
    })
  },

  async generateImage(){

    let {ImageWidth, ImageHeight} = this.data.faceData // 原图大小

    // 画布宽度与高度
    let width = 300 
    let height = width * ImageHeight / ImageWidth

    let canvasContext =  wx.createCanvasContext('canvasMask', this)
    canvasContext.clearRect(0, 0, width, height);
    canvasContext.drawImage(this.data.cutImageSrc, 0, 0, width, height);

    for(var index = 0; index < this.data.maskList.length; index++){

      let mask = this.data.maskList[index]

      // 部分口罩图片不是正方形，直接绘制会变形
      let maskImgSrc = `../../../images/mask-${mask.id}@2x.png`
      let maskImgInfo = await new Promise(function (resolve, reject) {

        wx.getImageInfo({

          src: maskImgSrc,

          success(res){
            resolve(res);
          },

          fail(error) {
            // console.log(error)
            reject(error)
          }
        })
  
      });

      // console.log(maskImgInfo)
      let maskHeight = mask.width * maskImgInfo.height / maskImgInfo.width

      canvasContext.save()
      canvasContext.translate(mask.centerX, mask.centerY);
      canvasContext.rotate(mask.rotate * Math.PI / 180)
      canvasContext.drawImage(maskImgSrc, -mask.width / 4,  -maskHeight / 4, mask.width / 2, maskHeight / 2)
      canvasContext.restore()

    }

    let that = this

    canvasContext.draw(true, () => {
      
      wx.canvasToTempFilePath({
        canvasId: 'canvasMask',
        x: 0,
        y: 0,
        height,
        width,
        fileType: 'jpg',
        quality: 0.9,
        success: function success(res) {
          that.setData({
            posterData: {
              posterSrc: res.tempFilePath,
              isShowPoster: true
            }
          });
        },
        fail: function fail() {
          wx.showToast({
            title: '图片生成失败，请重试'
          });
        }
      });
    })

  },

  onHidePoster(){
    this.setData({
      posterData: {
        posterSrc: null,
        isShowPoster: false
      }
    })
  },

  savePoster(){
    
    var filePath = this.data.posterData.posterSrc;

    wx.saveImageToPhotosAlbum({
      filePath,
      success(res) { 
        // console.log(res)
        wx.showToast({
          title: '保存到相册成功',
        })
      }
    })
  },

  removeShape(e){
    let index = e.mark.index
    this.data.maskList.splice(index,1)
    this.setData({
      maskList: this.data.maskList
    })
  },

  rotateStart(e) {
    // console.log('touch start: ', e)
    this.data.maskIndex = e.mark.index
    this.data.startX = e.touches[0].clientX
    this.data.startY = e.touches[0].clientY
  },

  rotateMove(e) {
    // console.log('touch move: ', e)
    this.data.endX = e.touches[0].clientX
    this.data.endY = e.touches[0].clientY

    let mask = this.data.maskList[this.data.maskIndex]

    let diff_x_before = this.data.startX - mask.centerX;
    let diff_y_before = this.data.startY - mask.centerY;
    let diff_x_after = this.data.endX - mask.centerX;
    let diff_y_after = this.data.endY - mask.centerY;

    let angle_before =    (Math.atan2(diff_y_before, diff_x_before) / Math.PI) * 180;
    let angle_after =    (Math.atan2(diff_y_after, diff_x_after) / Math.PI) * 180;

    mask.rotate = angle_after - angle_before + this.rotate

    this.setData({
      maskList: this.data.maskList
    })

    this.data.startX = this.data.endX
    this.data.startY = this.data.endY
  },

  resizeStart(e){
    this.data.maskIndex = e.mark.index
    this.data.startX = e.touches[0].clientX
    this.data.startY = e.touches[0].clientY
  },

  resizeMove(e){
    this.data.endX = e.touches[0].clientX
    this.data.endY = e.touches[0].clientY

    let mask = this.data.maskList[this.data.maskIndex]

    mask.width += -(this.data.endX - this.data.startX) * 2
    mask.height += -(this.data.endY - this.data.startY) * 2
    mask.left -= -(this.data.endX - this.data.startX)
    mask.top -= -(this.data.endY - this.data.startY)

    this.setData({
      maskList: this.data.maskList
    })

    this.data.startX = this.data.endX
    this.data.startY = this.data.endY

  }

})
