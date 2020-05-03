// miniprogram/pages/level-2/index.js
const _utils = require('./utils.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    tips: '上传带人脸的正面照'
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

    const that = this

    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'],

      success: async chooseResult => {

        wx.showLoading({
          title: '图片检测中',

        })

        const filePath = chooseResult.tempFilePaths[0]
        const cloudPath = 'img-to-detect/' + Date.now() + filePath.match(/\.[^.]+?$/)[0]

        // console.log(cloudPath)

        this.setData({
          faceImageUrl: filePath,
          showCutList: []
        })

        // 将图片上传至云存储空间
        let {
          fileID
        } = await wx.cloud.uploadFile({
          cloudPath,
          filePath
        })

        await this.safeCheck(cloudPath)

        const {
          fileList
        } = await wx.cloud.getTempFileURL({
          fileList: [fileID]
        })

        const tempUrl = fileList[0].tempFileURL + '?imageMogr2/scrop/600x600'
        const mainColerUrl = fileList[0].tempFileURL + '?imageAve'

        wx.request({
          url: mainColerUrl,
          success: ({
            data
          }) => {
            that.setData({
              mainColor: '#' + data.RGB.substring(2)
            })
          }
        })

        // 获得头像列表

        wx.cloud.callFunction({
          name: 'DetectFace',
          data: {
            tempUrl
          }
        }).then(({
          result
        }) => {

          this.setDataList(result, tempUrl)

        }).catch(error => {

          wx.showToast({
            title: '没有检测到人脸！',
            icon: 'none',
            duration: 3000
          })

        })

      },
    })
  },


  async safeCheck(cloudPath) {

    let {
      result
    } = await wx.cloud.callFunction({
      name: 'imgDetect',
      data: {
        action: 'DetectType',
        cloudPath,
        opts: {
          type: ["porn", "terrorist", "politics"] // "porn" 
        }
      }
    });

    if (result.RecognitionResult) {
      wx.showToast({
        title: '图片安全检查完成',
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

    }
  },


  // getFaceRects(res) {
  //   const {
  //     ImageWidth,
  //     ImageHeight,
  //     FaceInfos
  //   } = res;
  //   return FaceInfos.map(item => ({
  //     ...item,
  //     rectX: (item.X / ImageWidth) * 100 + '%',
  //     rectY: (item.Y / ImageHeight) * 100 + '%',
  //     rectWidth: (item.Width / ImageWidth) * 100 + '%',
  //     rectHeight: (item.Height / ImageHeight) * 100 + '%',
  //   }));
  // },

  setDataList(res, faceImageUrl) {

    const {
      ImageWidth,
      ImageHeight,
      FaceInfos
    } = res;

    let shapeList = [];
    let showCutList = [];

    if (FaceInfos.length > 0) {
      shapeList = FaceInfos.map(function (item, shapeIndex) {
        var X = (item.X / ImageWidth) * 100,
          Y = (item.Y / ImageHeight) * 100,
          Width = (item.Width / ImageWidth) * 100,
          Height = (item.Height / ImageHeight) * 100,
          _item$FaceAttributesI = item.FaceAttributesInfo,
          FaceAttributesInfo = _item$FaceAttributesI === undefined ? {} : _item$FaceAttributesI;

        var Gender = FaceAttributesInfo.Gender,
          Age = FaceAttributesInfo.Age,
          Expression = FaceAttributesInfo.Expression,
          Beauty = FaceAttributesInfo.Beauty,
          Glass = FaceAttributesInfo.Glass,
          Hat = FaceAttributesInfo.Hat,
          Mask = FaceAttributesInfo.Mask;


        return {
          shapeIndex: shapeIndex,
          left: X,
          top: Y,
          width: Width,
          height: Height,
          age: Age,
          genderStr: _utils.GENDER_STATUS[Gender],
          expressionStr: _utils.EXPRESS_MOOD[parseInt(Expression / 10, 10)],
          beauty: Beauty,
          glassStr: _utils.HAVE_STATUS[Number(Glass)],
          hatStr: _utils.HAVE_STATUS[Number(Hat)],
          maskStr: _utils.HAVE_STATUS[Number(Mask)],
          style: `left: ${X}%; top: ${Y}%; width: ${Width}%; height: ${Height}%;`
        };
      });

      showCutList = FaceInfos.map(function (item, shapeIndex) {
        var X = item.X,
          Y = item.Y,
          Height = item.Height,
          Width = item.Width;


        var rule = '|imageMogr2/cut/' + Width + 'x' + Height + 'x' + X + 'x' + Y;

        return {
          shapeIndex: shapeIndex,
          cutFileUrl: faceImageUrl + rule,
          x: X,
          y: Y,
          width: Width,
          height: Height
        };
      });
    }

    this.setData({
      currentShapeIndex: 0,
      shapeList: shapeList,
      showCutList: showCutList,
      tips: '点击人脸框，可以显示人脸魅力值'
    });
  },

  onChooseShape(e) {
    let newIndex = e.mark.currentShapeIndex
    // console.log(e.mark.currentShapeIndex)
    this.setData({
      currentShapeIndex: newIndex == this.data.currentShapeIndex ? -1 : newIndex
    })

  }


})