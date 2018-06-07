// pages/sing/sing.js
const timer = require('../../utils/timer');

var BCK_url = "https://oss.caoyu.online/music/test.m4a";

var app = getApp();

Page({

  data: {

    //by Alix
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
    currentBCK_FilePath: {},
    currentOrg_FilePath: {},
    songId: -1,

    //原唱和伴奏的url
    BCK_url: "",
    Org_url: "",
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

    if (ER == "" || ER.songId != songId) {
      this.setData({
        BCK_url: selectedData.allOriginData.bg_url,
        Org_url: selectedData.allOriginData.origin_url,
      })
      this.downloadFiles();
    }
    else {
      this.setData({
        currentBCK_FilePath: ER.currentBCK_FilePath,
        currentOrg_FilePath: ER.currentOrg_FilePath,
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
      currentClip: selectedData.allOriginData.songs[currentClipNum - 1],
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
    console.log(nowSkipTime);

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
      console.log(currentClipNum);
      //让被唱的那一段的前一段，跳转到顶部，达到让被唱段搂在中部的目的，
      //若要让被唱段跳转到顶部，"ClipCount" + (currentClipNum - 1) 就行
      var toCurrentView = "ClipCount" + (currentClipNum - 2);
      this.setData({
        currentClipNum: clips[index],
        toCurrentView: toCurrentView,
        lastSkipTime: nowSkipTime,
      })
    }
    // 测试的时候发现连续频繁点击last的时候，会出现回不到首段的效果。
    if (this.data.currentClipNum == 1) {
      this.setData({
        currentClipNum: 1,
        toCurrentView: "ClipCount0",
      })
    }
  },

  skipToNextClips: function () {
    var currentClipNum = this.data.currentClipNum;
    var clips = this.data.clips;
    var index = clips.length;
    var nowSkipTime = new Date().getTime();
    console.log(nowSkipTime);


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
      console.log(currentClipNum);
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

    if (this.data.currentBCK_FilePath && this.data.currentOrg_FilePath) {
      currentBCK_IAC.src = this.data.currentBCK_FilePath;
      currentOrg_IAC.src = this.data.currentOrg_FilePath;
    }
    else {
      console.log("播放路径出错");
    }


    if (that.data.hasOriginSinger=true){
      currentBCK_IAC.src=currentOrg_IAC.src;
    }

    


    //重新计算当前clip
    var currentClipNum = this.data.currentClipNum;
    var currentClip = this.data.selectedData.allOriginData.songs[currentClipNum - 1];

    currentBCK_IAC.startTime = currentClip.begin_time / 1000;
    console.log(currentBCK_IAC.startTime);

    //app.globalData.currentBCK_IAC = currentBCK_IAC;

    wx.setStorageSync("hasOriginSinger", that.data.hasOriginSinger);

    that.setData({
      startRecordClickAmount: 1,
      currentClip: currentClip,
      isReadying: false,
      currentBCK_IAC: currentBCK_IAC,
      currentOrg_IAC: currentOrg_IAC,
      endTime: currentClip.end_time / 1000,
    });

    currentBCK_IAC.onPlay(() => {
      console.log('开始播放')
    });
    currentBCK_IAC.onEnded(() => {
      console.log('该段结束');
      wx.getRecorderManager().stop();
    });
    currentBCK_IAC.onTimeUpdate((res) => {

      console.log(currentBCK_IAC.currentTime);
      console.log(that.data.endTime);

      if (currentBCK_IAC.currentTime >= that.data.endTime) {
        console.log('该段结束');
        wx.getRecorderManager().stop();
        currentBCK_IAC.stop();
      }
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
        currentBCK_IAC.stop();
        currentRec_IAC.stop();
    }
    
    console.log("Listening")

    this.setData({
      startRecordClickAmount: 0,
      tryListeningClickAmount: 1,
    });

    currentBCK_IAC.volume = 0.2;
    currentBCK_IAC.play();

  },
  // 重唱该段
  ensemble: function () {

    if (!this.data.hasCompleted)
      return;

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

    var currentBCK_FilePath;
    var currentOrg_FilePath;

    var that = this;
    const downloadTask1 = wx.downloadFile({
      url: that.data.Org_url,
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
            },
            fail: function (err) {
              console.log(err);
            }
          })

          wx.saveFile({
            tempFilePath: res.tempFilePath,
            success: function (res) {
              currentBCK_FilePath = res.savedFilePath;
              currentOrg_FilePath = res.savedFilePath;

              var existedResource = {
                currentBCK_FilePath: currentBCK_FilePath,
                currentOrg_FilePath: currentOrg_FilePath,
                songId: that.data.songId,
              }

              that.setData({
                isDownloading: false,
                currentBCK_FilePath: currentBCK_FilePath,
                currentOrg_FilePath: currentOrg_FilePath,
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



          // currentBCK_FilePath = res.tempFilePath;
          // const downloadTask2 = wx.downloadFile({
          //   url: BCK_url,
          //   success: function (res) {
          //     console.log(res);
          //     if (res.statusCode === 200) {
          //       currentOrg_FilePath = res.tempFilePath;
          //       var existedResource = {
          //         currentBCK_FilePath: currentBCK_FilePath,
          //         currentOrg_FilePath: currentOrg_FilePath,
          //         songId: that.data.songId,
          //       }
          //       that.setData({
          //         isDownloading: false,
          //         currentBCK_FilePath: currentBCK_FilePath,
          //         currentOrg_FilePath: currentOrg_FilePath,
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
      fail: function (err) {
        console.log(err);
      }

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

})