var app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    statusBarHeight: app.globalData.statusBarHeight,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var MyFinishedSongs = wx.getStorageSync("MyFinishedSongs");
    var created_song_id = options.created_song_id;
    var isShare=options.isShare;
    var FinishedSong={};
    for (var i in MyFinishedSongs){
      if (MyFinishedSongs[i].ids.created_song_id == created_song_id){
        FinishedSong = MyFinishedSongs[i];
        break;
      }
    }
    var max = FinishedSong.Paticipants[0].clip_score;
    var Max_user = FinishedSong.Paticipants[0].nickname;
    for (var i in FinishedSong.Paticipants) {
      if (i < FinishedSong.Paticipants.length-1) {
        var temp = parseInt(i)+ 1;
        if (max < FinishedSong.Paticipants[temp].clip_score){
          max = FinishedSong.Paticipants[temp].clip_score;
          Max_user = FinishedSong.Paticipants[temp].nickname;
        }
      }

    }
    this.setData({
      created_song_id: created_song_id,
      isShare:isShare,
      FinishedSong: FinishedSong,
      max:{
        Max_user: Max_user,
        clip_score: max
      }
    })
  },

  
  onShow: function () {
  
  },

  onBackTap: function () {
    wx.navigateBack({
      delta: 1
    })
  },

  onTapToPlay(event) {
    wx.navigateTo({
      url: '../player/player?isShare=false' + '&created_song_id=' + this.data.created_song_id,
    })
  },


  onShareAppMessage: function (res) {
    if (res.from === 'menu') {
      console.log(res.target)
    }

    var isShare = true;
    var category = 'Player';
    var userInfo = app.globalData.userInfo;
    var titleString = userInfo.nickName + "邀请你和他一起欣赏 《" + this.data.FinishedSong.music.title + " " + this.data.FinishedSong.initiatorNick + "(Cover " + this.data.FinishedSong.music.singer+")》";
    return {
      title: titleString,
      path: '/pages/player/player?isShare=' + isShare + '&created_song_id=' + this.data.created_song_id,
      imageUrl: this.data.FinishedSong.music.coverImg,
    }
  },

})