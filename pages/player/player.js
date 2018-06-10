var util = require('../../utils/util');

//跳转player需要传入 created_songId

Page({
  data:{
    created_songId:null,
    duration_print: '5:28', 
    duration: 328,
    currentSong:null,
    currentLyric: '',
    Lyrics:null,
    playUrl:'http://dl.stream.qqmusic.qq.com/C400000FR5GV0lwW18.m4a?vkey=8F8E86F58CDEBFBC5F91DC72152A57256F56E5DD3D444AA4242B2AAFD87E2F81312F808E982BFB6A209AC82F7B318F1591AA17EB94DC174B&guid=6322766144&uin=0&fromtag=66',
    currentLineNum:0,
    toLineNum: -1,
    playIcon: 'icon-play',
    cdCls: 'pause',
    dotsArray: new Array(2),
    currentDot: 0,
  },

  onLoad:function(options){
    var created_songId = options.created_songId;
    var MyFinishedSongs = wx.getStorageSync("MyFinishedSongs");

    for (var i in MyFinishedSongs.songs){
      if (created_songId == MyFinishedSongs.songs[i].created_song_id){
        var currentSong = MyFinishedSongs.songs[i];
        var currentIndex=i;
      }
    }

    this.setData({
      created_songId: created_songId,
      currentSong: currentSong,
      currentIndex: currentIndex
    })

    this.getPlayInfoDataFromServer();
    this._createAudio(this.data.playUrl);
  },
  // onShow:function(){
  //   var selectData = wx.getStorageSync("selectedData");
  //   this.setData({
  //     currentSong:selectData.songs,
  //   })
  //   this._createAudio(this.data.playUrl);
  // },

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
      // if (this.data.playMod === SINGLE_CYCLE_MOD) {
      //   this._init()
      //   return
      // }
      // this.next()
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

  },

  prev: function () {
    // app.currentIndex = this.getNextIndex(false)
    // this._init()
  },
  
  next: function () {
    // app.currentIndex = this.getNextIndex(true)
    // this._init()
  },

  share:function(){

  },

  //获取带有开始和结束时间的歌词数据
  getPlayInfoDataFromServer: function () {

    var that = this;

    var data = {
      requestType: "GetPlayInfo",
      createdSongId: this.data.created_song_id,  
    }

    util.requestFromServer("GetPlayInfo", data).then((res) => {
      console.log(res);
      that.setData({
        Lyrics: res.data.lyrics
      })
    }).catch((err) => {
      console.log("请求失败");
    })
  },

})
