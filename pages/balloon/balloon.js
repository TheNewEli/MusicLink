var util = require('../../utils/util.js');
var app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
  
    boom0_hidden:true,
    boom1_hidden: true,
    boom2_hidden: true,
    balloon_hidden:true,
    animationData_boom0:{},
    animationData_boom1:{},
    animationData_boom2:{},
    animationData_balloon_up: {},
    playStopped:true,
    windowHeight: app.globalData.windowHeight,
    compatibility: app.globalData.compatibility,
    Comp: {
      statusBarHeight: app.globalData.statusBarHeight,
      iSback: true,
      color: "#000",
      text: "发现",
      background: "",
      iSpadding: false
    },
    currentSong: -1

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var openid = wx.getStorageSync("openid");
    this.setData({
      openid: openid
    })
    this.getMyCreatedDataFromServer();
  },

  onBackTap: function () {
    wx.navigateBack({
      delta: 1
    })
  },


  //获取已发起的歌曲信息
  getMyCreatedDataFromServer: function () {
    var that = this;
    var data = {
      requestType: "GetMyCreated",
      openid: that.data.openid
    }
    wx.showLoading({
      title: '加载中',
    })
    util.requestFromServer("GetMyCreated", data).then((res) => {
      that.setAllData(res);
    }).catch((err) => {
      console.log("请求失败");
    })
  },


  setAllData: function (res) {
    var ListItem = [];
    var songs = res.data.songs;
    var progress, create_time_read;
    for (var i in songs) {
      var song = songs[i];
      progress = parseInt(song.reserved_clips / song.clip_number * 100);
      create_time_read = util.getDiffTime(song.song_created_time / 1000, true);
      var temp = {
        create_time_read: create_time_read,
        progress: progress,
        avatar_url: song.avatar_url,
        cover_url: song.cover_url,
        created_song_id: song.created_song_id,
        song_id: song.song_id,
        title: song.title,
        world_shared: song.world_shared
      }
      if (progress!=100){
        ListItem.push(temp);
      }
    }
    wx.hideLoading();
    this.setData({
      ListItem: ListItem
    })
  },


  onTapToDetail:function(event){
    var created_song_id = event.currentTarget.dataset.createdSongId;
    var song_id = event.currentTarget.dataset.songId;
    this.setData({
      currentSong: created_song_id
    })
  },












  fireWork:function(){

    var animation_boom0=wx.createAnimation({
      duration: 800,
      timingFunction: 'ease-out',
    });

    var animation_boom1 = wx.createAnimation({
      duration: 800,
      timingFunction: 'ease-out',
    });

    var animation_boom2 = wx.createAnimation({
      duration: 800,
      timingFunction: 'ease-out',
    });

    this.animation = animation_boom0;
    setTimeout(function() {
      animation_boom0.scale(4,4).rotate(180).opacity(0).step()
      this.setData({
        animationData_boom0:animation_boom0.export(),
      })

    }.bind(this), 200);

    this.setData({
      boom0_hidden: false,
    });

    setTimeout(function(){
      this.setData({
        boom1_hidden: false,
      });
    }.bind(this),550)

    this.animation = animation_boom1;
    setTimeout(function () {
      animation_boom1.scale(4, 4).rotate(180).opacity(0).step()
      this.setData({
        animationData_boom1: animation_boom1.export(),
      })

    }.bind(this), 600)


    setTimeout(function () {
      this.setData({
        boom2_hidden: false,
      });
    }.bind(this), 1000)

    this.animation = animation_boom2;
    setTimeout(function () {
      animation_boom2.scale(4, 4).rotate(180).opacity(0).step()
      this.setData({
        animationData_boom2: animation_boom2.export(),
      })

    }.bind(this), 1050)


    setTimeout(function(){
      this.resumeAllImgAfterThrow();
    }.bind(this),2000)
  
  },

  resumeAllImgAfterThrow:function(){

    this.setData({
      boom0_hidden:true,
      boom1_hidden:true,
      boom2_hidden:true,
    })

    var animation_boom_resume = wx.createAnimation({
      duration: 500,
      timingFunction: 'step-start',
    });

    animation_boom_resume.scale(1,1).opacity(1).step();

    this.setData({
      animationData_boom0: animation_boom_resume.export(),
    })

    animation_boom_resume.scale(1, 1).opacity(1).step();

    this.setData({
      animationData_boom1: animation_boom_resume.export(),
    })

    animation_boom_resume.scale(1, 1).opacity(1).step();

    this.setData({
      animationData_boom2: animation_boom_resume.export(),
    })

    //重置气球位置
    var animation_balloon_resume = wx.createAnimation({
      duration: 500,
      timingFunction: 'step-start',
    })

    animation_balloon_resume.translateY(this.data.windowHeight * 0.22).scale(1,1).opacity(1).step()

    this.setData({
      animationData_balloon_up:animation_balloon_resume.export(),
      playStopped:true,
    })

  },

  resumeAllImgAfterPick:function(){
    this.setData({
      balloon_hidden:true,
    })

    var animation_balloon_resume = wx.createAnimation({
      duration: 500,
      timingFunction: 'step-start',
    });

    animation_balloon_resume.scale(1,1).opacity(1).step();

    this.setData({
      animationData_balloon_up: animation_balloon_resume.export(),
      playStopped:true,
    })

  },

  throw:function(){

    if(!this.data.playStopped)
      return;

    this.data.playStopped=false;
    
    var animation1 = wx.createAnimation({
      duration: 2000,
      timingFunction: 'ease-out',
    });

    this.animation = animation1;


    animation1.scale(3, 3).translateY(this.data.windowHeight*-0.22).step();

    setTimeout(function(){
      this.setData({
        balloon_hidden:false
      })
    }.bind(this),50)

    setTimeout(function(){
      this.setData({
        animationData_balloon_up:animation1.export()
      });
    }.bind(this),100)  

  
    setTimeout(function(){
      animation1.opacity(0).step();

      this.setData({
        animationData_balloon_up: animation1.export()
      });
      this.fireWork();
    }.bind(this),2000)

    setTimeout(function(){
      this.setData({
        balloon_hidden:true
      })
    }.bind(this),2100)
  },

  pick:function(){

    //初始气球位置

    if(!this.data.playStopped)
      return;
    
    this.setData({
      playStopped:false,
    })

    var animation_init = wx.createAnimation({
      duration:100,
      timingFunction: 'step-start',
    })

    setTimeout(function(){
      animation_init.translateY(this.data.windowHeight * -1).opacity(0).step();
      this.setData({
        animationData_balloon_up:animation_init.export(),
      })
    }.bind(this),200)

    setTimeout(function(){
      this.setData({
        balloon_hidden:false,
      })
    }.bind(this),250)

    var animation_pick = wx.createAnimation({
      duration:2000,
      timingFunction: 'ease-in',
    })

    setTimeout(function(){
      animation_pick.scale(3, 3).translateY(this.data.windowHeight * -0.2).opacity(1).step();
    
    this.setData({
      animationData_balloon_up:animation_pick.export(),
    })
    }.bind(this),400)

    setTimeout(function(){
      this.resumeAllImgAfterPick();
    }.bind(this),3000)

  }
})