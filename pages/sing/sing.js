// pages/sing/sing.js
const timer = require('../../utils/timer');
var util = require('../../utils/util');

var BCK_url = "https://oss.caoyu.online/music/test.m4a";

var app = getApp();

Page({

  data: {
    //by Alix
    currentLineNum: null,  //Alix添加
    Lyrics: null,        //Alix 带开始时间和结束时间的全部歌词
    currentClipNum: null,
    clips: null,
    title: null,
    created_songId: null,
    songs: null,
    toView: null,
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
    currentBCK_FilePath: "",
    currentOrg_FilePath: "",
    songId: -1,

    //原唱和伴奏的url
    BCK_url: "",
    Org_url: "",
  },

  onLoad: function (options) {
    var songId = options.songId;
    this.setData({
      songId: songId
    })
    this.init();
  },

  onShow: function () {

    var currentClipNum = this.data.currentClipNum;
    var toView = this.data.toView;
    this.setData({
      currentClip: this.data.selectedData.allOriginData.songs[currentClipNum - 1],
      toCurrentView: toView[currentClipNum - 1],
      remainedTime: 3,
      lastSkipTime: new Date().getTime(),
      hasCompleted: false,
      isDownloading: false,
    })
  },

  onReady: function () {
    wx.setNavigationBarTitle({
      title: this.data.title,
    })
  },

  onHide: function () {
    this.data.currentBCK_IAC.stop();
    this.data.currentRec_IAC.stop();
    wx.getRecorderManager().stop();
  },

  onUnload: function () {
    this.data.currentBCK_IAC.destroy();
    this.data.currentRec_IAC.destroy();
    wx.getRecorderManager().stop();
  },

  /*由于页面每次被重新打开需要重新设置数据，
  **所以将onLoad的所有东西抽出来
  */
  init: function () {


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

    if (ER == "" || ER.songId != this.data.songId) {
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
    for (var i in songs.lyrics) {
      var lyric = songs.lyrics[i];
      if (lyric.clipCount == currentClipNum) {
        var currentLineNum = i;
        break;
      }
    }

    var currentBCK_IAC = wx.createInnerAudioContext(),
      currentRec_IAC = wx.createInnerAudioContext(),
      currentOrg_IAC = wx.createInnerAudioContext();

    this.setData({
      currentLineNum: currentLineNum,
      currentClipNum: currentClipNum,
      currentClip: selectedData.allOriginData.songs[currentClipNum - 1],
      title: songs.music.title,
      songs: songs,
      clips: selectedData.clips,
      created_songId: created_songId,
      toView: toView,
      toCurrentView: toView[0],
      clipsIndex: clipsIndex,
      remainedTime: 3,
      selectedData: selectedData,
      lastSkipTime: new Date().getTime(),
      currentBCK_IAC: currentBCK_IAC,
      currentRec_IAC: currentRec_IAC,
      currentOrg_IAC: currentOrg_IAC,
    })

    this.getPlayInfoDataFromServer();


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

      for (var i in this.data.songs.lyrics) {
        var lyric = this.data.songs.lyrics[i];
        if (lyric.clipCount == currentClipNum) {
          var currentLineNum = i;
          break;
        }
      }

      //让被唱的那一段的前一段，跳转到顶部，达到让被唱段搂在中部的目的，
      //若要让被唱段跳转到顶部，"ClipCount" + (currentClipNum - 1) 就行
      var toCurrentView = "ClipCount" + (currentClipNum - 2);
      this.setData({
        currentLineNum: currentLineNum,
        currentClipNum: clips[index],
        toCurrentView: toCurrentView,
        lastSkipTime: nowSkipTime,
        hasCompleted: false,
        startRecordClickAmount: 0,
        tryListeningClickAmount: 0,
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

      for (var i in this.data.songs.lyrics) {
        var lyric = this.data.songs.lyrics[i];
        if (lyric.clipCount == currentClipNum) {
          var currentLineNum = i;
          break;
        }
      }
      this.setData({
        currentLineNum: currentLineNum,
        currentClipNum: currentClipNum,
        toCurrentView: toCurrentView,
        lastSkipTime: nowSkipTime,
        hasCompleted: false,
        startRecordClickAmount: 0,
        tryListeningClickAmount: 0,
      })
    }
  },

  //开始录制 
  startRecord: function () {

    var that = this;

    if (that.data.startRecordClickAmount == 1 || that.data.isDownloading)
      return;

    const recorderManager = wx.getRecorderManager();


    recorderManager.onStop((res) => {

      console.log("Recorder stop", res);
      const { tempFilePath } = res
      var temp_IAC = wx.createInnerAudioContext();
      temp_IAC.src = tempFilePath;

      that.setData({
        hasCompleted: true,
        currentRec_IAC: temp_IAC,
        startRecordClickAmount: 0,
        tryListeningClickAmount: 0,
      })
    });

    that.readyToRecord();

  },

  readyToRecord: function () {

    var that = this;


    var remainedTime = 3;

    var currentBCK_IAC = that.data.currentBCK_IAC,
      currentOrg_IAC = that.data.currentOrg_IAC;

    if (that.data.currentBCK_FilePath != "" && that.data.currentOrg_FilePath != "") {
      currentBCK_IAC.src = that.data.currentBCK_FilePath;
      currentOrg_IAC.src = that.data.currentOrg_FilePath;
    }
    else {
      console.log("播放路径出错");
      wx.showToast({
        title: "文件丢失",
        image: "/images/icon/error_icon.png",
        mask: true,
      });
      if (!that.data.isDownloading)
        that.downloadFiles();
      return;
    }

    if (that.data.hasOriginSinger = true) {
      currentBCK_IAC.src = currentOrg_IAC.src;
    }

    //重新计算当前clip
    var currentClipNum = that.data.currentClipNum;
    var currentClip = that.data.selectedData.allOriginData.songs[currentClipNum - 1];
    var currentLineNum = that.getCurrentClipFirstLyricIndex();

    currentBCK_IAC.startTime = currentClip.begin_time / 1000;
    // console.log(currentBCK_IAC.startTime);

    //app.globalData.currentBCK_IAC = currentBCK_IAC;

    wx.setStorageSync("hasOriginSinger", that.data.hasOriginSinger);

    that.setData({
      startRecordClickAmount: 1,
      currentClip: currentClip,
      currentLineNum: currentLineNum,
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

      // console.log(currentBCK_IAC.currentTime);
      //console.log(that.data.endTime);
      var currentLineNum = that.data.currentLineNum;

      // console.log(that.data.Lyrics[currentLineNum].endTime);

      //歌词滚动 CurrentLineNum 刷新
      this.handleLyric(currentBCK_IAC.currentTime*1000,that);
      if (currentBCK_IAC.currentTime >= that.data.Lyrics[currentLineNum].endTime) {
        that.setData({
          currentLineNum: currentClipNum++,
        });
      }

      if (currentBCK_IAC.currentTime >= that.data.endTime) {
        console.log('该段结束');
        wx.getRecorderManager().stop();
        currentBCK_IAC.stop();
      }
    });

    timer.countDown(that, remainedTime);
    // console.log("here");

  },

  //试听唱过的部分
  tryListening: function () {


    var that = this;

    // if(!that.hasCompleted)
    //    return;

    var currentBCK_IAC = that.data.currentBCK_IAC;
    var currentRec_IAC = that.data.currentRec_IAC;
    //防止重复点击导致重复播放
    if (that.data.tryListeningClickAmount == 1) {
      currentBCK_IAC.stop();
      currentRec_IAC.stop();
    }

    console.log("Listening")

    that.setData({
      startRecordClickAmount: 0,
      tryListeningClickAmount: 1,
    });

    currentBCK_IAC.volume = 0.2;
    currentRec_IAC.volume = 1;

    currentRec_IAC.play();
    currentBCK_IAC.play();

  },
  // 重唱该段
  ensemble: function () {

    var that = this;

    if (!that.data.hasCompleted)
      return;

    that.data.currentBCK_IAC.stop();
    that.data.currentRec_IAC.stop();

    that.setData({
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

    var that = this;

    that.setData({
      isDownloading: true,
    })

    var currentBCK_FilePath;
    var currentOrg_FilePath;


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
              wx.showToast({
                title: "数据加载成功",
                icon: "success",
              })
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
      that.setData({
        progress: res.progress
      })
    });
  },


  // // 歌词滚动回调函数  添加By Alix
  // handleLyric: function (currentTime, that) {
  //   var currentLineNum = that.data.currentLineNum;  //当前唱到的歌词行
  //   var lyrics = that.data.Lyrics;
  //   for (var i in lyrics) {
  //     var beginTime = that.analysisTime(lyrics[i].beginTime);
  //     var endTime = that.analysisTime(lyrics[i].endTime);
  //     if (currentTime > beginTime && currentTime < endTime) {
  //       currentLineNum = i;
  //       break;
  //     }
  //   }
  //   that.setData({
  //     currentLineNum: currentLineNum,
  //   })
  // },

  handleLyric: function (currentTime, that) {
    var currentLineNum = that.data.currentLineNum;  //当前唱到的歌词行
    var lyrics = that.data.Lyrics;
    for (var i in lyrics) {
      var beginTime = that.analysisTime(lyrics[i].beginTime);
      var endTime = that.analysisTime(lyrics[i].endTime);
      if (currentTime > beginTime && currentTime < endTime) {
        currentLineNum = i;
        console.log("currentLineNum:" + currentLineNum + " beginTime:" + beginTime + " currentTime:" + currentTime + " endTime:" + endTime);
        break;
      }
    }
    that.setData({
      currentLineNum: currentLineNum,
    })
  },

  // handleLyric: function () {
  //   //var currentLineNum = that.data.currentLineNum;  //当前唱到的歌词行
  //   var originLyrics = this.data.Lyrics;
  //   var processedLyrics = new Array([originLyrics.length]);


  //   for (var i in originLyrics) {
  //     var lyric_temp = {
  //       beginTime: 0,
  //       endTime: 0,
  //       // lyric:"",
  //     }
  //     lyric_temp.beginTime = (this.analysisTime(originLyrics[i].beginTime)) / 1000;
  //     lyric_temp.endTime = (this.analysisTime(originLyrics[i].endTime)) / 1000;
  //     //lyric_temp.lyric = lyrics[i].lyric;
  //     processedLyrics[i] = lyric_temp;
  //   }

  //   this.setData({
  //     Lyrics: processedLyrics,
  //   })
  // },


  // lyrics 时间解析
  analysisTime: function (time) {
    var Time = time.split(":");
    var analysisTime = 0;
    parseFloat(Time[0])
    analysisTime = parseFloat(Time[0]) * 60 + parseFloat(Time[1]);
    return analysisTime * 1000;
  },

  getCurrentClipFirstLyricIndex() {


    var index = 0;

    for (var i in this.data.selectedData.allOriginData.songs) {
      if (i < this.data.currentClipNum - 1) {
        var length = this.data.selectedData.allOriginData.songs[i].lyric.lyrics.length;
        index += length;
      }
      else {
        break;
      }

    }

    return index;
  },

  //获取带有开始和结束时间的歌词数据
  getPlayInfoDataFromServer: function () {

    var that = this;

    var data = {
      requestType: "GetPlayInfo",
      createdSongId: this.data.created_songId,
    }

    util.requestFromServer("GetPlayInfo", data).then((res) => {
      that.setData({
        Lyrics: res.data.lyrics
      });
      // this.handleLyric();
    }).catch((err) => {
      console.log("请求失败");
    });
  },

})