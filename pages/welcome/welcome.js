
const app = getApp();

Page({
  data: {
    motto: '开始你的音乐之旅',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },


  onLoad: function () {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      });

    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }


  },

  getAllAuthorized: function (e) {
    //获取用户信息
    this.getUserInfo(e);
    //获取录音权限
    this.getRecorderAuthority();
  },

  getUserInfo: function (e) {
    console.log("UserInfo getted");
    app.globalData.userInfo = e.detail.userInfo
    
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    });
    console.log(e.detail.rawData);

    this.login(e, (err, res) => {
      if (err) return console.log('login function has error');
    })

  },

  getRecorderAuthority: function () {
    //获取录音权限
    wx.authorize({
      scope: 'scope.record',
      success() {
        console.log("Authorized succeed");
      },
      fail() {
        console.log("First authorized failed");
        wx.showModal({
          title: '提示',
          content: '未授权，录音发无法使用',
          showCancel: true,
          confirmText: "授权",
          confirmColor: "#52a2d8",
          success: function (res) {
            //确认打开设置界面进行授权
            if (res.confirm) {
              wx.showModal({
                title: '提示',
                content: '未授权，录音功能无法使用，刚刚干嘛去了',
                showCancel: true,
                confirmText: "知道了",
              })
            }
          },
          fail: function () {
            console.log("授权设置录音失败");
          },
        });
      }
    });

  },

  login(userinfo, callback) {
    wx.login({
      //login是异步请求
      success: function (res) {
        var code
        if (res.code) {
          code = res.code
        } else {
          console.log('登录失败  ！' + res.errMsg)
        }
        if (userinfo.detail.errMsg == 'getUserInfo:ok') {
          wx.request({
            url: getApp().globalData.server_base + '/OnLogin',
            method: 'Get',
            data: {
              requestType: 'wechat_login',
              code: code,
              userInfo: userinfo.detail.rawData
            }
          }) // 将用户信息、匿名识别符发送给服务器，调用成功时执行 callback(null, res)
        }
        else if (userinfo.detail.errMsg == 'getUserInfo:fail auth deny') { // 当用户点击拒绝时
          wx.showModal({
            title: '登陆失败！',
            content: '微信一键登录失败，请重新登陆并确认允许获取用户信息'
          }) // 提示用户，需要授权才能登录
          callback('fail to modify scope', null)
        }
      },
      fail: function (res) {
      }
    }) //只有需要使用微信登录鉴别用户，才需要用到它，用来获取用户的匿名识别符
  },

  enterPostPage: function (event) {
    wx.switchTab({
      url: '../world/world',
    })
  }

})











