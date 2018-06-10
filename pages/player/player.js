var util = require('../../utils/util');

//跳转player需要传入 created_songId

Page({
  data:{
    created_songId:null,
    duration_print: null, 
    duration: 0,
    currentSong:null,
    currentLyric: '',
    Lyrics:null,
    playUrl:'',
    currentLineNum:0,
    toLineNum: -1,
    playIcon: 'icon-play',
    cdCls: 'pause',
    dotsArray: new Array(2),
    currentDot: 0,
    isShare:false,
    SongList_created:[]
  },

  onLoad:function(options){
    var created_songId = options.created_song_id;
    var isShare = options.isShare;
    var SongList_created=[];
    if(!isShare){
      var MyFinishedSongs = wx.getStorageSync("MyFinishedSongs");
      for (var i in MyFinishedSongs) {

        SongList_created.push(MyFinishedSongs[i].created_song_id);

        if (created_songId == MyFinishedSongs[i].created_song_id) {
          var currentIndex = i;
        }
      }
    }else{
      currentIndex=-10;
    }


    this.setData({
      created_songId: created_songId,
      currentIndex: currentIndex,
      SongList_created: SongList_created
    })

    this.getPlayInfoDataFromServer();
  },
  
  init: function (currentIndex){
    var SongList_created = this.data.SongList_created;
    if (!this.isShare && currentIndex < SongList_created.length && currentIndex > -1) {
      this.setData({
        created_songId: SongList_created[currentIndex],
        currentIndex: currentIndex
      })
    }
    this.getPlayInfoDataFromServer();
  },

  // 创建播放器
  _createAudio: function (playUrl) {
    wx.playBackgroundAudio({
      dataUrl: playUrl,
      title: this.data.currentSong.title,
      coverImgUrl: this.data.currentSong.cover_url,
    })
    // 监听音乐播放
    wx.onBackgroundAudioPlay(() => {
      this.setData({
        playIcon: 'icon-pause',
        cdCls: 'play'
      })
    })
    // 监听音乐暂停
    wx.onBackgroundAudioPause(() => {
      this.setData({
        playIcon: 'icon-play',
        cdCls: 'pause'
      })
    })
    // 监听音乐停止
    wx.onBackgroundAudioStop(() => {
      this.next();
    })

    // 监听播放拿取播放进度
    const manage = wx.getBackgroundAudioManager()
    manage.onTimeUpdate(() => {
      const currentTime = manage.currentTime
      this.setData({
        currentTime: this.formatTime(currentTime),
        percent: currentTime / this.data.duration
      })
        this.handleLyric(currentTime * 1000)
    })
  },
  
  // 歌词滚动回调函数
  handleLyric: function (currentTime) {
    //当前唱到的歌词行
    var currentLineNum = this.data.currentLineNum;
    //跳转到顶部的行，不一定是当前唱到的歌词
    var toLineNum;        
    
    //处理异步问题造成的错误，当Lyrics数据还未从服务器获取时，直接退出。
    if (this.data.Lyrics==null){
      return;
    }

    var lyrics=this.data.Lyrics; 
    for (var i in lyrics){
      var beginTime = this.analysisTime(lyrics[i].beginTime);
      var endTime = this.analysisTime(lyrics[i].endTime);
      if (currentTime > beginTime  && currentTime < endTime ){
        currentLineNum = i;
        console.log("currentLineNum:" + currentLineNum + " beginTime:" + beginTime + " currentTime:" + currentTime)
        break;
      }
    }
    
    //为保证currentLineNum大于5时 唱到的歌词在中间
    var toLineNum = currentLineNum - 5;
    if (currentLineNum > 5 && toLineNum != this.data.toLineNum) {
      this.setData({
        toLineNum: toLineNum
      })
    }

    this.setData({
      currentLineNum: currentLineNum,
      currentLyric: lyrics[currentLineNum].lyric
    })

  },
  // 解析时间
  analysisTime:function(time){
    var Time=time.split(":");
    var analysisTime=0;
    parseFloat(Time[0])
    analysisTime = parseFloat(Time[0]) * 60 + parseFloat(Time[1]);
    return analysisTime * 1000;
  },

  formatTime: function (interval) {
    interval = interval | 0
    const minute = interval / 60 | 0
    const second = this.pad(interval % 60)
    return `${minute}:${second}`
  },
  /*秒前边加0*/
  pad(num, n = 2) {
    let len = num.toString().length
    while (len < n) {
      num = '0' + num
      len++
    }
    return num
  },

  changeDot: function (e) {
    this.setData({
      currentDot: e.detail.current
    })
  },

  togglePlaying: function () {
    wx.getBackgroundAudioPlayerState({
      success: function (res) {
        var status = res.status
        if (status == 1) {
          wx.pauseBackgroundAudio()
        } else {
          wx.playBackgroundAudio()
        }
      }
    })
  },
  
  Return:function(){
    wx.switchTab({
      url: '../post/post',
    })
  },

  prev: function () {
    var currentIndex = this.data.currentIndex-1;
    this.init(currentIndex);
  },
  
  next: function () {
    var currentIndex = this.data.currentIndex + 1;
    this.init(currentIndex);
  },

  share:function(){

  },

  //获取带有开始和结束时间的歌词数据
  getPlayInfoDataFromServer: function () {

    var that = this;

    var data = {
      requestType: "GetPlayInfo",
      created_song_id: this.data.created_songId,  
    }

    util.requestFromServer("GetPlayInfo", data).then((res) => {
      wx.setStorageSync("currentSong", res.data);
      that.setData({
        currentSong:res.data,
        duration:res.data.duration,
        Lyrics:res.data.lyrics,
        duration_print: that.formatTime(res.data.duration)
      })
      this._createAudio(res.data.bg_url);
    }).catch((err) => {
      console.log("请求失败");
    })
  },

  onShareAppMessage: function (res) {
    var isShare = true;
    var category = 'Player';
    var userInfo = app.globalData.userInfo;
    var titleString = userInfo.nickName + "邀请你欣赏他的作品" + this.data.currentSong.title;
    return {
      title: titleString,
      path: '/pages/player/player?isShare=' + isShare + '&created_song_id=' + this.data.created_songId,
      imageUrl: this.data.currentSong.cover_url,
    }
  },

})
