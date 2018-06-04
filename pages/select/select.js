// pages/select/select.js
var util = require('../../utils/util');
var app=getApp();

Page({
  data: {
    songs:[],
    song_id:null,
    openId: "",
    userAvatar: "",
    clips:[],
    created_song_id:"",
  },

  onLoad: function (options) {
    var created_song_id=options.id;
    var openId = wx.getStorageSync('openid');
    var songId = wx.getStorageSync("to_create_song").songId;
    var userAvatar = app.globalData.userInfo.avatarUrl;
    this.setData({
      created_song_id: created_song_id,
      openId:openId,
      userAvatar: userAvatar,
      song_id: songId
    })
    this.getSongsLyricsData();
  },

  // getSelectedClips:function(){
  // },


  //获取歌曲详细信息
  getSongsLyricsData: function () {

    var that=this;
    var data={
      requestType: "GetClips",
      song_id: this.data.song_id
    }

    util.requestFromServer("GetClips", data).then((res) => {
      console.log("select: request success");
      that.processRequestData(res);
      that.getGetCreatedClips();
    }).catch((err) => {
      console.log("请求失败");
    })

  },

  //获取歌曲已经被选择的情况
  getGetCreatedClips: function () {
    var that = this;
    var data = {
      requestType: "GetCreatedClips",
      createdSongId: this.data.created_song_id,
    }

    util.requestFromServer("GetCreatedClips", data).then((res) => {
      console.log("select: request success");
      console.log(res);
      that.processRequestData_Create(res);
    }).catch((err) => {
      console.log("请求失败");
    })
  },
  
  //绑定请求后的数据
  processRequestData_Create:function(res){
    var selected = res.data.selected_info;
    var songs = this.data.songs;
    var lyrics = songs.lyrics;
    var clips=[];
    for(var i in selected){

      if (selected[i].openid == this.data.openId){
        clips.push(selected[i].clip_count);
      }
      for(var j in lyrics){
        if (lyrics[j].clipCount == selected[i].clip_count){
          lyrics[j].selected_user_avatar = selected[i].avatar;
          lyrics[j].selected_user_openId = selected[i].openid;
          lyrics[j].isSelected = true;
          //isSing变量待确定
          // lyrics[selected[i].clip_count].isSing = null;
        }
      } 
    }

    this.setData({
      songs: songs,
      clips: clips
    })
  },


  //处理数据
  processRequestData:function(res){
    var that = this;
    var songs={
      songId:res.data.song_id,
      music:{
        title:res.data.title,
        coverImg:res.data.cover_url,
        singer:res.data.artist,
      },
      lyrics:[],
    }

    for (var i in res.data.songs){
      var song =res.data.songs[i];
      for (var j in song.lyric.lyrics) {
         var temp={
           lyric: song.lyric.lyrics[j].line,
           clipCount: song.clipCount,
           selected_user_avatar:null,
           selected_user_openId: null,
           isSelected: null,
           isSing:null,
         }
         songs.lyrics.push(temp);
      }
    }
    that.setData({
      songs:songs
    })
  },


  selectLyrics:function(event){
    var lyricId = event.currentTarget.dataset.lyricId;
    var songs = this.data.songs;
    var lyrics = songs.lyrics[lyricId];
    var clipCount = songs.lyrics[lyricId].clipCount;

    if (this.data.openId == lyrics.selected_user_openId || lyrics.selected_user_openId == null){
      var clips = [];
      if (lyrics.isSelected){
        for (var i in this.data.clips){
          if (this.data.clips[i] != lyrics.clipCount){
            clips.push(this.data.clips[i])
          }
        }
      }else{
        for (var i in this.data.clips) {
            clips.push(this.data.clips[i])
        }
        clips.push(lyrics.clipCount);
      }

      for(var i in songs.lyrics){
        if (songs.lyrics[i].clipCount == clipCount){

          var lyric = songs.lyrics[i];
          //对未选择的歌词换头像,修改OpenId
          if (!lyric.isSelected) {
            lyric.selected_user_avatar = this.data.userAvatar;
            lyric.selected_user_openId = this.data.openId;
          } else {
            lyric.selected_user_avatar = null;
            lyric.selected_user_openId = null;
          }
          lyric.isSelected = !lyric.isSelected;
        }
      }
    
      this.setData({
        songs: songs,
        clips: clips
      })
    }
  },


  // 锁定已选择歌词，给出交互信息，
  // 对成功锁定的歌词进行成功反馈，对锁定失败的歌词进行失败反馈
  // 锁定后可再次进行，锁定，解锁
  lock:function(){
    var that = this;
    var data = {
      requestType: "CreateClips",
      createdSongId: this.data.created_song_id,
      openid: this.data.openId,
      clips: this.data.clips,
    }

    util.requestFromServer("CreateClips", data).then((res) => {
      console.log("select: request success");
      console.log(res);
      this.processRequestData_Create(res);
      var success = res.data.succeed;
      var failed = res.data.failed;
      var failedString ="";
      var successString ="";

      for (var i in success){
        successString = successString + ' '+success[i];
      }
      successString = successString + "段";

      if (failed.len>0){
        failedString="，失败锁定第";
        for (var i in failed) {
          failedString = failedString + ' ' + failed[i];
        }
        failedString = failedString + "段";
      }


      wx.showModal({
        title: '提示',
        content: '成功锁定第 ' + successString + failedString,
        showCancel: false,
        confirmText: "确定",
      })
    }).catch((err) => {
      console.log("请求失败");
    })


  },

  // 对整个选择整体提交服务器，点击后不能再选
  //提交后跳转至唱歌界面
  handon:function(){
    this.lock();

    wx.navigateTo({
      url: '../sing/sing?id=' + this.data.song_id,
    })
  }

})

