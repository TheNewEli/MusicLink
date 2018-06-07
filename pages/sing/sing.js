// pages/sing/sing.js
const timer = require('../../utils/timer');
//var BCK_url = "https://resource.caoyu.online/%E6%88%90%E9%83%BD%E4%BC%B4%E5%A5%8F.m4a";
var BCK_url = "https://oss.caoyu.online/music/test.m4a";

var app = getApp();

Page({

  data: {
    //by Alix
    currentLineNum: null,  //Alix添加
    Lyrics:null,        //Alix 带开始时间和结束时间的全部歌词
    currentClipNum: null,
    clips: null,
    title: null,
    created_songId: null,
    songs: null,
    toview: null,
    toCurrentView: null,
    systemInfo: {},
    clipsIndex: null,


    //by Wayne
    //当前clip伴奏
    currentBCK_IAC: "",
    //当前clip收入得录音
    currentRec_IAC: "",
    //当前clip原唱
    currentOrg_IAC: "",
    //当前clip
    currentClip: {},
    //标记此次录音是否结束
    hasCompleted: false,
    //是否和原唱一起唱
    hasOriginSinger: false,
    //记录按键点击次数
    startRecordClickAmount: 0,
    tryListeningClickAmount: 0,
    //记录上个页面记录的所有的页面数据
    selectedData: {},
    startTime: 0,
    endTime: 0,
    currentTime: 0,
    remainedTime: 3,

    isReadying: true,
    progress: 0,
    isDownloading: false,

    //记录跳转时间
    lastSkipTime: 0,
    //临时文件路径
    currentBCK_Temp_FilePath: {},
    currentOrg_Temp_FilePath: {},
    songId: -1,
  },

  onLoad: function (options) {

    var songId = options.songId;
    var selectedData = wx.getStorageSync("selectedData");
    var songs = selectedData.songs;
    var created_songId = selectedData.createdSongId;
    var totalClipsCount = songs.lyrics[songs.lyrics.length - 1].clipCount;
    var toView = [];
    var clipsIndex = []; //wxml中用来在循环中顺序输出每段歌词


    for (var i = 0; i < totalClipsCount; i++) {
      toView.push("ClipCount" + i);
      clipsIndex.push(i);
    }

    var ER = wx.getStorageSync("ER");

    if (ER == "" || ER.songId != songId)
      this.downloadFiles();
    else {
      this.setData({
        currentBCK_Temp_FilePath: ER.currentBCK_Temp_FilePath,
        currentOrg_Temp_FilePath: ER.currentOrg_Temp_FilePath,
      })
    }

    //获取手机的信息，设定scroll-view可视区域大小
    var that = this;
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          systemInfo: res,
        })
      },
    })

    var currentClipNum = selectedData.clips[0];

    this.setData({
      currentClipNum: currentClipNum,
      currentClip: selectedData.allOriginClips[currentClipNum - 1],
      title: songs.music.title,
      songs: songs,
      clips: selectedData.clips,
      created_songId: created_songId,
      toview: toView,
      toCurrentView: toView[0],
      clipsIndex: clipsIndex,
      remainedTime: 3,
      selectedData: selectedData,
      lastSkipTime: new Date().getTime(),
      songId: songId,
    })
  },

  onReady: function () {
    wx.setNavigationBarTitle({
      title: this.data.title,
    })
  },


  skipToLastClips: function () {

    var currentClipNum = this.data.currentClipNum;
    var clips = this.data.clips;
    var index = 0;
    var nowSkipTime = new Date().getTime();

    //防止频繁点击
    if (!this.diffTime(nowSkipTime, this.data.lastSkipTime))
      return;

    for (var i in clips) {
      if (currentClipNum == clips[i]) {
        index = i;
      }
    }
    if (index != 0) {
      index--;
      var currentClipNum = clips[index];
      //让被唱的那一段的前一段，跳转到顶部，达到让被唱段搂在中部的目的，
      //若要让被唱段跳转到顶部，"ClipCount" + (currentClipNum - 1) 就行
      var toCurrentView = "ClipCount" + (currentClipNum - 2);
      this.setData({
        currentClipNum: clips[index],
        toCurrentView: toCurrentView,
        lastSkipTime: nowSkipTime,
      })
    }

  },

  skipToNextClips: function () {
    var currentClipNum = this.data.currentClipNum;
    var clips = this.data.clips;
    var index = clips.length;
    var nowSkipTime = new Date().getTime();


    //防止用户频繁点击
    if (!this.diffTime(nowSkipTime, this.data.lastSkipTime))
      return;

    for (var i in clips) {
      if (currentClipNum == clips[i]) {
        index = i;
        index++;
      }
    }
    if (index < clips.length) {
      var currentClipNum = clips[index];
      var toCurrentView = "ClipCount" + (currentClipNum - 2);
      this.setData({
        currentClipNum: currentClipNum,
        toCurrentView: toCurrentView,
        lastSkipTime: nowSkipTime,
      })
    }
  },

  //开始录制 
  startRecord: function () {

    if (this.data.startRecordClickAmount == 1 || this.data.isDownloading)
      return;

    const recorderManager = wx.getRecorderManager();

    recorderManager.onStop((res) => {

      console.log("Recorder stop", res);
      const { tempFilePath } = res
      var temp_IAC = wx.createInnerAudioContext();
      temp_IAC.src = tempFilePath;

      this.setData({
        hasCompleted: true,
        currentRec_IAC: temp_IAC,
        startRecordClickAmount: 1,
        tryListeningClickAmount: 0,
      })
    });

    this.readyToRecord();

  },

  readyToRecord: function () {

    //防止重复点击
    if (this.data.startRecordClickAmount == 1)
      return;

    var that = this;
    var remainedTime = 3;

    var currentBCK_IAC = wx.createInnerAudioContext(),
      currentRec_IAC = wx.createInnerAudioContext(),
      currentOrg_IAC = wx.createInnerAudioContext();

    if (this.data.currentBCK_Temp_FilePath && this.data.currentOrg_Temp_FilePath) {
      currentBCK_IAC.src = this.data.currentBCK_Temp_FilePath;
      currentOrg_IAC.src = this.data.currentOrg_Temp_FilePath;
    }
    else {
      console.log("播放路径出错");
    }


    currentBCK_IAC.onPlay(() => {
      console.log('开始播放')
    });
    currentBCK_IAC.onEnded(() => {
      console.log('该段结束');
      wx.getRecorderManager().stop();
    });
    currentBCK_IAC.onTimeUpdate((res) => {

      // console.log(currentBCK_IAC.currentTime);
      // console.log(that.data.endTime);

      if(currentBCK_IAC.currentTime>=that.data.endTime){
        console.log('该段结束');
        wx.getRecorderManager().stop();
        currentBCK_IAC.stop();
      }
    });


    //重新计算当前clip
    var currentClipNum = this.data.currentClipNum;
    var currentClip = this.data.selectedData.allOriginClips[currentClipNum - 1];

    currentBCK_IAC.startTime = currentClip.begin_time / 1000;
    console.log(currentBCK_IAC.startTime);

    //app.globalData.currentBCK_IAC = currentBCK_IAC;

    if (that.data.hasOriginSinger)
      app.globalData.currentBCK_IAC = currentBCK_IAC;
    else
      app.globalData.currentBCK_IAC = currentOrg_IAC;

    wx.setStorageSync("hasOriginSinger", that.data.hasOriginSinger);

    that.setData({
      startRecordClickAmount: 1,
      currentClip: currentClip,
      isReadying: false,
      currentBCK_IAC: currentBCK_IAC,
      currentOrg_IAC: currentOrg_IAC,
      endTime: currentClip.end_time/1000,
    });

    timer.countDown(that, remainedTime);
    console.log("here");

  },

  //试听唱过的部分
  tryListening: function () {


    var currentBCK_IAC = this.data.currentBCK_IAC;
    var currentRec_IAC = this.data.currentRec_IAC;
    //防止重复点击导致重复播放
    if (this.data.tryListeningClickAmount == 1) {

      if (this.data.hasOriginSinger) {
        currentBCK_IAC.stop();
        currentRec_IAC.stop();
      }
      else {
        currentOrg_IAC.stop();
        currentRec_IAC.stop();
      }
      return;
    }
    console.log("Listening")

    this.setData({
      startRecordClickAmount: 0,
      tryListeningClickAmount: 1,
    });

    if (this.data.hasOriginSinger) {
      currentOrg_IAC.volume = 0.2;
      currentOrg_IAC.play();

    } else {
      currentBCK_IAC.volume = 0.2;
      currentBCK_IAC.play();
    }
    currentRec_IAC.volume = 1;
    currentRec_IAC.play();

  },
  // 重唱该段
  ensemble: function () {

    // if (!this.data.hasCompleted)
    //   return;

    this.data.currentBCK_IAC.stop();
    this.data.currentRec_IAC.stop();

    this.setData({
      startRecordClickAmount: 0,
      tryListeningClickAmount: 0,
      hasCompleted: false,
      isReadying: true,
      remainedTime: 0,
    })
  },

  // 该段原唱播放 
  playWithOriginalSinger: function () {
    this.setData({
      hasOriginSinger: true,
    })
  },

  diffTime: function (now, last) {
    if (now - last > 500)
      return true;
    else
      return false;
  },

  downloadFiles: function () {

    this.setData({
      isDownloading: true,
    })

    var currentBCK_Temp_FilePath;
    var currentOrg_Temp_FilePath;

    var that = this;
    const downloadTask1 = wx.downloadFile({
      url: BCK_url,
      success: function (res) {
        if (res.statusCode === 200) {

          wx.getSavedFileList({
            success: function (res) {
              if (res.fileList.length > 0) {
                wx.removeSavedFile({
                  filePath: res.fileList[0].filePath,
                  complete: function (res) {
                    console.log(res)
                  }
                })
              }
            }
          })

          wx.saveFile({
            tempFilePath: res.tempFilePath,
            success: function (res) {
              currentBCK_Temp_FilePath = res.savedFilePath;
              currentOrg_Temp_FilePath = res.savedFilePath;

              var existedResource = {
                currentBCK_Temp_FilePath: currentBCK_Temp_FilePath,
                currentOrg_Temp_FilePath: currentOrg_Temp_FilePath,
                songId: that.data.songId,
              }

              that.setData({
                isDownloading: false,
                currentBCK_Temp_FilePath: currentBCK_Temp_FilePath,
                currentOrg_Temp_FilePath: currentOrg_Temp_FilePath,
              })

              wx.setStorageSync("ER", existedResource);
            },
            fail: function (err) {
              console.log(err);
              wx.showToast({
                title: '存文件失败',
              })
            }
          });



          // currentBCK_Temp_FilePath = res.tempFilePath;
          // const downloadTask2 = wx.downloadFile({
          //   url: BCK_url,
          //   success: function (res) {
          //     console.log(res);
          //     if (res.statusCode === 200) {
          //       currentOrg_Temp_FilePath = res.tempFilePath;
          //       var existedResource = {
          //         currentBCK_Temp_FilePath: currentBCK_Temp_FilePath,
          //         currentOrg_Temp_FilePath: currentOrg_Temp_FilePath,
          //         songId: that.data.songId,
          //       }
          //       that.setData({
          //         isDownloading: false,
          //         currentBCK_Temp_FilePath: currentBCK_Temp_FilePath,
          //         currentOrg_Temp_FilePath: currentOrg_Temp_FilePath,
          //       })

          //       wx.setStorageSync("ER", existedResource);
          //   }
          //   else {
          //     wx.showModal({
          //       title: '提示',
          //       content: '您的网络好像有问题喔',
          //     })
          //   }
        }
      },

    });
    // downloadTask2.onProgressUpdate((res) => {
    //   that.setData({
    //     progress: res.progress / 2 + 50
    //   })

    downloadTask1.onProgressUpdate((res) => {
      this.setData({
        progress: res.progress
      })
    });
  },


  // 歌词滚动回调函数  添加By Alix
  handleLyric: function (currentTime) {
    var currentLineNum = this.data.currentLineNum;  //当前唱到的歌词行
    var lyrics = this.data.currentClip.lyric.lyrics;
    for (var i in lyrics) {
      var beginTime = this.analysisTime(lyrics[i].beginTime);
      var endTime = this.analysisTime(lyrics[i].endTime);
      if (currentTime > beginTime && currentTime < endTime) {
        currentLineNum = i;
        break;
      }
    }
    this.setData({
      currentLineNum: currentLineNum,
    })
  },

  // lyrics 时间解析
  analysisTime: function (time) {
    var Time = time.split(":");
    var analysisTime = 0;
    parseFloat(Time[0])
    analysisTime = parseFloat(Time[0]) * 60 + parseFloat(Time[1]);
    return analysisTime * 1000;
  },

})