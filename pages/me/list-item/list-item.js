var util = require('../../../utils/util.js');
var app=getApp();

Page({
  data: {
    openid:null,
    id: null,
    finished:'list-item-other',

    //兼容
    compatibility: app.globalData.compatibility

  },

  //生命周期函数--监听页面加载
  onLoad: function (options) {
    var id = options.id;   //页面跳转的id，0为已发起的歌曲，1为参与的歌曲，2为已完成的歌曲
    var openid = wx.getStorageSync("openid");
    this.setData({
      openid:openid,
      id:id,
      finished:'list-item-other'
    })
    this._init();
  },

  //重新绑定数据，刷新world界面
  onShow: function () {
    this._init();
  },


  onReady: function () {
    var navigationText;
    if (this.data.id == 0){
      navigationText = "我发起的歌曲";
    } else if (this.data.id == 1){
      navigationText = "我参与的歌曲";
    } else if (this.data.id == 2) {
      navigationText = "我完成的歌曲";
    }

    wx.setNavigationBarTitle({
      title: navigationText,
    })

    this.setData({
      Comp: {
        statusBarHeight: app.globalData.statusBarHeight,
        iSback: true,
        color: "#000",
        text: navigationText,
        background: "#8aaed7"
      }
    })
  },

  onBackTap:function(){
    wx.navigateBack({
      delta: 1
    })
  },


  _init:function(){
    if(this.data.openid){
      if (this.data.id == 0) {
        //0为已发起的歌曲
        this.getMyCreatedDataFromServer();
      } else if (this.data.id == 1) {
        //1为参与的歌曲
        this.getMyParticipatedDataFromServer();
      } else if (this.data.id == 2) {
        //2为完成的歌曲
        this.getMyFinishedDataFromServer();
        this.setData({
          progress:100,
          finished:"list-item-finished"
        })
      }
    }
  
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
  
  //获取已参与的歌曲信息
  getMyParticipatedDataFromServer: function () {
    var that = this;
    var data = {
      requestType: "GetMyParticipated",
      openid:that.data.openid
    }
    wx.showLoading({
      title: '加载中',
    })
    util.requestFromServer("GetMyParticipated", data).then((res) => {
        that.setAllData(res);
    }).catch((err) => {
      console.log("请求失败");
    })
  },

  //获取已发起的歌曲信息
  getMyFinishedDataFromServer: function () {
    var that = this;
    var data = {
      requestType: "GetMyFinished",
      openid: that.data.openid
    }
    wx.showLoading({
      title: '加载中',
    })
    util.requestFromServer("GetMyFinished", data).then((res) => {
      that.setAllData(res);
    }).catch((err) => {
      console.log("请求失败");
    })
  },

  setAllData:function(res){
    console.log(res.data);
    var ListItem=[];
    var songs = res.data.songs;
    var progress, create_time_read;
    for (var i in songs) {
      var song=songs[i];
      progress = parseInt(song.reserved_clips / song.clip_number * 100);
      create_time_read = util.getDiffTime(song.song_created_time / 1000, true);
      var temp={
        create_time_read:create_time_read,
        progress: progress,
        avatar_url: song.avatar_url,
        cover_url: song.cover_url,
        created_song_id: song.created_song_id,
        song_id: song.song_id,
        title: song.title,
        world_shared: song.world_shared
      }
      ListItem.push(temp);
    }
    wx.hideLoading();
    this.setData({
      ListItem:ListItem
    })
  },

  //world-detail界面
  onTapToDetail(event) {
    var created_song_id = event.currentTarget.dataset.createdSongId;
    var song_id = event.currentTarget.dataset.songId;
    var Type=event.currentTarget.dataset.type;
    var isShare=false;
    if(Type==0 || Type==1){
      wx.navigateTo({
        url: '../../select/select?created_song_id=' + created_song_id + "&song_id=" + song_id,
      })
    }else if(Type==2){
      wx.setStorageSync("MyFinishedSongs", this.data.ListItem);
      wx.navigateTo({
        url: '../../player/player?isShare=' + isShare+'&created_song_id=' + created_song_id,
      })
    }

  },

})