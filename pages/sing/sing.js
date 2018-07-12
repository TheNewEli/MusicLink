// pages/sing/sing.js
const timer = require('../../utils/timer');
const options = {
  duration: 300000,
  sampleRate: 44100,
  numberOfChannels: 2,
  encodeBitRate: 192000,
  format: 'mp3',
  frameSize: 50
};
var util = require('../../utils/util');

var app = getApp();

Page({

  data: {
    //by Alix
    currentLineNum: null,  //Alix添加
    Lyrics: {},        //Alix 带开始时间和结束时间的全部歌词
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
    recordStartTime: 0,
    recordTimeLate: 0,
    endTime: 0,
    currentTime: 0,
    remainedTime: 4,

    isReadying: true,
    isRecording: false,
    disableSkip: false,
    disableOrg: true,

    //进度和提示
    progress: 0,
    propt_motto: "",
    isDownloading: false,
    isUploading: false,
    cxt_arc: "",
    score:0,
    completedClipsNum:0,
    totalChoosedClipsCount:0,
    starsArray:[],
    currentProgress:0,

    //延迟修正
    hasModified: false,

    //记录是否上传
    hasUploaded:true,


    //记录跳转时间
    lastSkipTime: 0,
    lastClickTime: 0,
    //临时文件路径
    currentBCK_FilePath: "",
    currentOrg_FilePath: "",
    songId: -1,

    //原唱和伴奏的url
    BCK_url: "",
    Org_url: "",

    //录音后的所有临时文件录音
    all_Rec_Temp_File: [],

    //一些小动画
    animationDatas: [],

    //下载错误后记录文件个数
    file_length_OnError: 0,

    //用于切换动态提示
    old_progress: 0,

    //记录是否纠错中
    isCorrected: false,

    // //兼容设置
    compatibility: app.globalData.compatibility,

    //显示消息弹窗
    showDialog:false,
  },

  onLoad: function (options) {
    this.checkRecord();
    var songId = options.songId;
    this.setData({
      songId: songId
    })
    this.init();
    this.setAnimation();
  },

  onShow: function () {
    this.checkRecord();
    var currentClipNum = this.data.currentClipNum;
    var toView = this.data.toView;
    this.setData({
      toCurrentView: toView[currentClipNum - 1],
      remainedTime: 0,
      hasCompleted: false,
      isReadying: true,
      isRecording: false,
      startRecordClickAmount: 0,
      tryListeningClickAmount: 0,
    });

    var prompt_start = wx.getStorageSync("prompt_start");
    if (!prompt_start) {
      wx.showModal({
        title: "导航",
        content: "欢迎来到我们的大合唱界面，在这里你可以充分展示你美妙的歌声，唱完后你可选择分享给你的小伙伴，让他们共同完成这一首歌喔",
        cancelText: "不再提示",
        confirmText: "知道了",
        success: function (res) {
          if (res.cancel) {
            wx.setStorageSync("prompt_start", true);
          }
          wx.showModal({
            title: "导航",
            content: "如果你不是很熟悉这首歌，我们为你准备了原唱，唱歌过程中建议插着耳机喔，录音过程中是不能切换原唱和伴奏的喔！",
            cancelText: "不再提示",
            confirmText: "知道了",
            success: function (res) {
              if (res.cancel) {
                wx.setStorageSync("prompt_start", true);
              }
            }
          });
        }
      });
    }

    this.drawProgresCircleBar(100);
  },

  onReady: function () {
    var title = this.data.title
    wx.setNavigationBarTitle({
      title: title,
    })
    this.setData({
      Comp: {
        statusBarHeight: app.globalData.statusBarHeight,
        iSback: true,
        color: "#fff",
        text: title,
        background: "#dd1d10"
      }
    });

  },

  onHide: function () {

    if (!this.data.currentBCK_IAC.paused)
      this.data.currentBCK_IAC.stop();
    if (!this.data.currentRec_IAC.paused)
      this.data.currentRec_IAC.stop();
    if (!this.data.currentOrg_IAC.paused)
      this.data.currentOrg_IAC.stop();

    wx.getRecorderManager().stop();

    wx.getSavedFileList({
      success: function (res) {
        console.log(res.fileList)
      }
    });
  },

  onUnload: function () {
    this.data.currentBCK_IAC.destroy();
    this.data.currentRec_IAC.destroy();
    this.data.currentOrg_IAC.destroy();
    wx.getRecorderManager().stop();

    wx.getSavedFileList({
      success: function (res) {
        //console.log(res.fileList)
      }
    });
  },

  onBackTap: function () {
    wx.navigateBack({
      delta: 1
    })
  },

  /*由于页面每次被重新打开需要重新设置数据，
  **所以将onLoad的所有东西抽出来
  */
  init: function () {

    var that = this;

    var selectedData = wx.getStorageSync("selectedData");
    var songs = selectedData.songs;
    var created_songId = selectedData.createdSongId;
    var totalClipsCount = songs.lyrics[songs.lyrics.length - 1].clipCount;
    var toView = [];
    var clipsIndex = []; //wxml中用来在循环中顺序输出每段歌词


    for (var i = 0; i < totalClipsCount; i++) {
      toView.push("ClipCount" + i);
      clipsIndex.push(i);

      var temp_Record_File={
        createdSongId: -1,
        clipCount:-1,
        temp_path: "",
      }
      that.data.all_Rec_Temp_File[i]=temp_Record_File;
    }

    var ER = wx.getStorageSync("ER");

    if (ER == "" || ER.songId != that.data.songId) {
      that.setData({
        BCK_url: selectedData.allOriginData.bg_url,
        Org_url: selectedData.allOriginData.origin_url,
      })
      if (!that.data.isDownloading) {
     that.downloadFiles();
      }

    }
    else {
      that.setData({
        currentBCK_FilePath: ER.currentBCK_FilePath,
        currentOrg_FilePath: ER.currentOrg_FilePath,
      })
    }

    //获取手机的信息，设定scroll-view可视区域大小
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

    //初始话进度条

    that.setData({
      currentLineNum: currentLineNum,
      currentClipNum: currentClipNum,
      currentClip: selectedData.allOriginData.songs[currentClipNum - 1],
      currentBCK_IAC: currentBCK_IAC,
      currentRec_IAC: currentRec_IAC,
      currentOrg_IAC: currentOrg_IAC,
      clips: selectedData.clips,
      created_songId: created_songId,
      clipsIndex: clipsIndex,
      isRecording: false,
      hasCompleted: false,
      lastSkipTime: new Date().getTime(),
      remainedTime: 4,
      selectedData: selectedData,
      songs: songs,
      toView: toView,
      toCurrentView: toView[0],
      title: songs.music.title,
      hasModified: false,
      totalChoosedClipsCount:selectedData.clips.length,
    })

    that.getPlayInfoDataFromServer();
    that.registerAllCallBack(1);

  },

  skipToLastClips: function () {

    var that = this;
    //如果录音已经开始，按键失效
    if (!that.data.currentBCK_IAC.paused || !that.data.currentRec_IAC.paused || that.data.isDownloading
      || that.data.disableSkip)
      return;

    that.playAnimaton("last");

    var currentClipNum = that.data.currentClipNum;
    var clips = that.data.clips;
    var index = 0;
    var nowSkipTime = new Date().getTime();

    //防止频繁点击
    if (!that.diffTime(nowSkipTime, that.data.lastSkipTime))
      return;

    for (var i in clips) {
      if (currentClipNum == clips[i]) {
        index = i;
      }
    }
    if (index != 0) {
      index--;
      var currentClipNum = clips[index];

      for (var i in that.data.songs.lyrics) {
        var lyric = that.data.songs.lyrics[i];
        if (lyric.clipCount == currentClipNum) {
          var currentLineNum = i;
          break;
        }
      }

      //让被唱的那一段的前一段，跳转到顶部，达到让被唱段搂在中部的目的，
      //若要让被唱段跳转到顶部，"ClipCount" + (currentClipNum - 1) 就行
      var toCurrentView = "ClipCount" + (currentClipNum - 1);
      var currentClip = that.data.selectedData.allOriginData.songs[currentClipNum - 1];

      var hasCompleted = false;

      if (that.data.all_Rec_Temp_File[currentClipNum - 1] != undefined &&
        that.data.all_Rec_Temp_File[currentClipNum - 1] != null)
        hasCompleted = true;
      that.setData({
        currentLineNum: currentLineNum,
        currentClipNum: clips[index],
        toCurrentView: toCurrentView,
        lastSkipTime: nowSkipTime,
        hasCompleted: hasCompleted,
        hasModified: false,
        isRecording: false,
        startRecordClickAmount: 0,
        tryListeningClickAmount: 0,
        currentClip: currentClip,
      })
    }

  },

  skipToNextClips: function () {

    var that = this;

    //如果录音已经开始，按键失效
    if (!that.data.currentBCK_IAC.paused || !that.data.currentRec_IAC.paused || that.data.isDownloading ||
      that.data.disableSkip)
      return;

    that.playAnimaton("next");

    var currentClipNum = that.data.currentClipNum;
    var clips = that.data.clips;
    var index = clips.length;
    var nowSkipTime = new Date().getTime();


    //防止用户频繁点击
    if (!that.diffTime(nowSkipTime, that.data.lastSkipTime))
      return;


    for (var i in clips) {
      if (currentClipNum == clips[i]) {
        index = i;
        index++;
      }
    }
    if (index < clips.length) {
      var currentClipNum = clips[index];
      var toCurrentView = "ClipCount" + (currentClipNum - 1);

      for (var i in that.data.songs.lyrics) {
        var lyric = that.data.songs.lyrics[i];
        if (lyric.clipCount == currentClipNum) {
          var currentLineNum = i;
          break;
        }
      }
      var currentClip = that.data.selectedData.allOriginData.songs[currentClipNum - 1];
      var hasCompleted = false;

      if (that.data.all_Rec_Temp_File[currentClipNum - 1].temp_path!="")
        hasCompleted = true;
      that.setData({
        currentLineNum: currentLineNum,
        currentClipNum: currentClipNum,
        toCurrentView: toCurrentView,
        lastSkipTime: nowSkipTime,
        hasCompleted: hasCompleted,
        hasModified: false,
        isRecording: false,
        startRecordClickAmount: 0,
        tryListeningClickAmount: 0,
        currentClip: currentClip,
      })
    }
  },

  //开始录制 
  startRecord: function () {

    if (!this.data.isGetRecord) {
      wx.showModal({
        title: '提示',
        content: '未授权，该功能无法使用，请前往"我的-设置-授权"进行授权',
        showCancel: true,
        confirmText: "前往",
        confirmColor: "#52a2d8",
        success: function (res) {
          //确认打开设置界面进行授权
          if (res.confirm) {
            wx.switchTab({
              url: '../me/me',
            })
          }
        }
      });
      return;
    }
    var that = this;
    that.playAnimaton("play");

    if (that.data.startRecordClickAmount == 1 || that.data.isDownloading) {
      wx.showToast({
        title: "还在录音中喔",
        icon: "none",
        mask: true,
        duration: 1500,
      })
      return;
    }


    const currentBCK_IAC = this.data.currentBCK_IAC;
    const currentRec_IAC = this.data.currentRec_IAC;
    const currentOrg_IAC = this.data.currentOrg_IAC;

    currentRec_IAC.offError();
    currentRec_IAC.offPlay();
    currentRec_IAC.offTimeUpdate();
    currentRec_IAC.offWaiting();
    currentRec_IAC.offSeeked();
    currentRec_IAC.offEnded();

    currentBCK_IAC.offPlay();
    currentBCK_IAC.offError();
    currentBCK_IAC.offStop();
    currentBCK_IAC.offSeeked();
    currentBCK_IAC.offWaiting();
    currentBCK_IAC.offTimeUpdate();

    currentBCK_IAC.onSeeked((res) => {
      console.log("BCK::Seeked");
      //currentBCK_IAC.pause();
      console.log("重置后伴奏音轨当前位置:" + currentBCK_IAC.currentTime);
      if (!that.data.hasOriginSinger) {
        that.data.currentBCK_IAC.volume = 0.7;
        that.data.currentOrg_IAC.volume = 0;
      }
      else {
        that.data.currentBCK_IAC.volume = 0;
        that.data.currentOrg_IAC.volume = 0.7;
      }


      //wx.getRecorderManager().resume();
      wx.showToast({
        title: "开始",
        image: "/images/icon/sing_icon.png",
        duration: 1500,
        mask: true,
      })

      that.setData({
        isRecording: true,
      })

      //that.data.currentOrg_IAC.volume=0.7;
      //currentBCK_IAC.play();
    });

    // currentOrg_IAC.onSeeked((res) => {
    //   console.log("ORG::Seeked");
    //   console.log("重置后伴奏音轨当前位置:" + currentOrg_IAC.currentTime);
    //   //that.data.currentBCK_IAC.volume = 0.7;
    //   // if(that.data.hasOriginSinger){
    //   //   that.data.currentOrg_IAC.volume=0.7;
    //   //   that.data.currentBCK_IAC.volume=0;
    //   // }
    //   // else{
    //   //   that.data.currentOrg_IAC.volume=0;
    //   //   that.data.currentBCK_IAC.volume=0.7;
    //   // }
    //   // that.data.currentBCK_IAC.play();


    //   //currentBCK_IAC.play();
    // })

    currentBCK_IAC.onError((err) => {
      wx.showToast({
        title: "文件丢失",
        image: "/images/icon/error_icon.png",
        mask: true,
      });
      wx.getRecorderManager().stop();
      wx.removeStorageSync('ER');
      that.setData({
        currentBCK_FilePath: "",
        currentOrg_FilePath: "",
        startRecordClickAmount: 0,
        tryListeningClickAmount: 0,
      });
      if (!that.data.isDownloading) {
     that.downloadFiles();
      }

    });

    currentBCK_IAC.onWaiting(() => {
      console.log("伴奏轨道加载中");
    });

    currentBCK_IAC.onStop(() => {
      if (!that.data.currentRec_IAC.paused)
        that.data.currentRec_IAC.stop();
    });

    currentBCK_IAC.onTimeUpdate((res) => {

      if (!that.data.isRecording)
        wx.getRecorderManager().start(options);

      var currentLineNum = that.data.currentLineNum;
      console.log("BCK:", currentBCK_IAC.currentTime, "Rec:", that.data.currentRec_IAC.currentTime,
        "Org:", that.data.currentOrg_IAC.currentTime);

      if (currentBCK_IAC.currentTime >= that.data.currentClip.end_time / 1000) {
        //console.log('该段结束');
        currentBCK_IAC.offTimeUpdate();
        currentBCK_IAC.stop();
        that.data.currentOrg_IAC.stop();
        if (!that.data.currentRec_IAC.paused)
          that.data.currentRec_IAC.stop();
        that.setData({
          hasCompleted: true,
          hasUploaded:false,
        });
        //that.playAnimaton("wave");
        wx.getRecorderManager().stop();
        that.play(3,that);
        return;
      }

      if (currentBCK_IAC.currentTime >= that.data.Lyrics[currentLineNum].endTime) {
        //console.log("Update row num：",that.data.currentLineNum);
        currentLineNum += 1;
        that.setData({
          currentLineNum: currentLineNum,
        });
        //console.log("更新后的行数是：",that.data.currentLineNum,"当前时间", currentBCK_IAC.currentTime);
      }
    });

    currentBCK_IAC.onPlay(() => {

      if (Math.abs(currentBCK_IAC.currentTime - currentBCK_IAC.startTime) > 1) {
        //currentBCK_IAC.stop();
        if (!that.data.isCorrected) {
          var diffTime = 0;
          if (!currentOrg_IAC.paused)
            diffTime = currentBCK_IAC.currentTime - currentOrg_IAC.currentTime;
          currentBCK_IAC.seek(currentBCK_IAC.startTime);
          currentOrg_IAC.seek(currentBCK_IAC.startTime + diffTime);
          //wx.getRecorderManager().pause();
          that.data.isCorrected = true;
        }
        return;
      }
      //currentBCK_IAC.seek(currentClip.begin_time / 1000);
      if (!that.data.hasOriginSinger) {
        that.data.currentBCK_IAC.volume = 0.7;
        that.data.currentOrg_IAC.volume = 0;
      }
      else {
        that.data.currentBCK_IAC.volume = 0;
        that.data.currentOrg_IAC.volume = 0.7;
      }

    });

    that.readyToRecord();

  },

  readyToRecord: function () {

    //this.reloadAudioObject();
    //this.registerAllCallBack(0);
    if (this.data.currentClip == {})
      return;
    var that = this;

    var remainedTime = 4;

    var currentBCK_IAC = that.data.currentBCK_IAC,
      currentOrg_IAC = that.data.currentOrg_IAC;

    that.setData({
      BCK_url: that.data.selectedData.allOriginData.bg_url,
      Org_url: that.data.selectedData.allOriginData.origin_url,
    });

    if (that.data.currentBCK_FilePath != "" && that.data.currentOrg_FilePath != "") {
      currentBCK_IAC.src = that.data.currentBCK_FilePath;
      currentOrg_IAC.src = that.data.currentOrg_FilePath;
    }
    else {
      //console.log("播放路径出错");
      wx.showToast({
        title: "文件丢失",
        image: "/images/icon/error_icon.png",
        mask: true,
      });
      if (!that.data.isDownloading) {
     that.downloadFiles();
        thats.setData({
          startRecordClickAmount: 0,
          tryListeningClickAmount: 0,
          progress: 0,
        })
      }

      return;
    }

    if (that.data.hasOriginSinger == true) {
      currentBCK_IAC.volume = 0;
      currentOrg_IAC.volume = 1;
    }

    //重新计算当前clip
    var currentClipNum = that.data.currentClipNum;
    var currentClip = that.data.selectedData.allOriginData.songs[currentClipNum - 1];
    var currentLineNum = that.getCurrentClipFirstLyricIndex();

    currentBCK_IAC.startTime = currentClip.begin_time / 1000;
    currentOrg_IAC.startTime = currentClip.begin_time / 1000;
    //that.myOwnSeek(currentBCK_IAC.startTime, currentBCK_IAC);
    ///console.log("伴奏音轨时间：", currentBCK_IAC.currentTime);

    that.setData({
      startRecordClickAmount: 1,
      currentClip: currentClip,
      currentLineNum: currentLineNum,
      isReadying: false,
      currentBCK_IAC: currentBCK_IAC,
      currentOrg_IAC: currentOrg_IAC,
      endTime: currentClip.end_time / 1000,
      startTime: currentBCK_IAC.startTime,
      hasModified: false,
      disableSkip: true,
      disableOrg: true,
    });

    timer.countDown(that, remainedTime);

  },

  //试听唱过的部分
  tryListening: function () {


    var that = this;

    that.playAnimaton("TL");

    if (!that.data.hasCompleted) {
      wx.showToast({
        title: "未完成，无法试听",
        icon: "none",
        mask: true,
        duration: 1500,
      })
      return;
    }
    if (!that.data.currentRec_IAC.paused || !that.data.currentBCK_IAC.paused) {
      wx.showToast({
        title: "播放中喔",
        icon: "none",
        duration: 1500,
        mask: true,
      })
      return;
    }


    var currentBCK_IAC = that.data.currentBCK_IAC;
    var currentRec_IAC = that.data.currentRec_IAC;
    //console.log("伴奏路径",currentBCK_IAC.src);

    currentBCK_IAC.src = that.data.currentBCK_FilePath;
    currentBCK_IAC.startTime = that.data.currentClip.begin_time / 1000;

    if (that.data.hasCompleted) {
      currentRec_IAC.src = that.data.all_Rec_Temp_File[that.data.currentClipNum - 1].temp_path;
      //console.log(that.data.all_Rec_Temp_File[that.data.currentClipNum-1].temp_path);
    }


    //console.log("试听->伴奏音轨时间",currentBCK_IAC.currentTime);

    //console.log("原唱路径",that.data.currentBCK_IAC.src);
    // console.log("起点",currentBCK_IAC.startTime,"理论时间",that.data.currentClip.begin_time/1000);

    that.setData({
      currentBCK_IAC: currentBCK_IAC,
      isCorrected: false,
    });

    if (!currentBCK_IAC.paused || !currentRec_IAC.paused) {
      wx.showToast({
        title: "播放中喔",
        image: "/images/icon/running_icon.png",
        mask: true,
        duration: 2000,
      });
      return;
    }

    currentBCK_IAC.stop();
    currentRec_IAC.stop();

    //console.log("试听中");

    that.setData({
      startRecordClickAmount: 0,
      tryListeningClickAmount: 1,
      currentLineNum: that.getCurrentClipFirstLyricIndex(),
    });

    currentBCK_IAC.volume = 0;
    currentRec_IAC.volume = 1;

    currentRec_IAC.offError();
    currentRec_IAC.offPlay();
    currentRec_IAC.offTimeUpdate();
    currentRec_IAC.offWaiting();
    currentRec_IAC.offSeeked();
    currentRec_IAC.offEnded();

    currentBCK_IAC.offPlay();
    currentBCK_IAC.offError();
    currentBCK_IAC.offStop();
    currentBCK_IAC.offSeeked();
    currentBCK_IAC.offWaiting();
    currentBCK_IAC.offTimeUpdate();

    currentRec_IAC.onEnded(() => {
      //console.log("录音轨道结束");
      currentBCK_IAC.stop();

      var prompt_next_or_last = wx.getStorageSync("prompt_next_or_last");
      if (!prompt_next_or_last) {
        wx.showModal({
          title: "导航",
          content: "试听结束，点击上一段或下一段继续你的演唱吧！",
          cancelText: "不再提示",
          confirmText: "知道了",
          success: function (res) {
            if (res.cancel) {
              wx.setStorageSync("prompt_next_or_last", true);
            }
          }
        })
      }

    })

    currentRec_IAC.onPlay(() => {
      console.log("合成音轨开始播放");
      //currentRec_IAC.seek(0.0);
     // currentRec_IAC.offPlay();
    });

    currentRec_IAC.onWaiting(() => {
      console.log("录音轨道缓冲中");
    });

    currentRec_IAC.onError((err) => {
      console.log(err);
      wx.showToast({
        title: "录音播放错误",
        iamge: "/images/icon/error_icon.png"
      });
      if (!that.data.currentRec_IAC.paused)
        that.data.currentBCK_IAC.stop();
      if (!that.data.currentBCK_IAC.paused)
        that.data.currentBCK_IAC.stop();
      that.setData({
        hasCompleted: false,
      })
      wx.getRecorderManager().stop();
    });

    currentRec_IAC.onTimeUpdate((res) => {
      //更新歌词
      var currentLineNum = that.data.currentLineNum;
      console.log("CurrnetLine: ", currentLineNum, "BCK: ", that.data.currentBCK_IAC.currentTime,
        "Rec: ", that.data.currentRec_IAC.currentTime);

      if (that.data.currentBCK_IAC.currentTime >= that.data.currentClip.end_time / 1000)
        return;

      if (that.data.currentBCK_IAC.currentTime >= that.data.Lyrics[currentLineNum].endTime) {
        currentLineNum += 1;
        that.setData({
          currentLineNum: currentLineNum,
        });
      }
    });

    currentBCK_IAC.onTimeUpdate((res) => {

      //console.log("BCK:", currentBCK_IAC.currentTime,
      //  "CURRENT:", that.data.currentClip.end_time / 1000);
      if (currentBCK_IAC.currentTime > that.data.currentClip.end_time / 1000) {
        currentBCK_IAC.stop();
      }
    })


    if (!that.data.hasModified) {
      var recordTimeLate = that.data.recordTimeLate;
      // if (recordTimeLate < -1 || recordTimeLate > 1) {
      //   wx.showModal({
      //     title: "录音延迟过高，重置数据中",
      //     icon: "none",
      //     showCancel: false,
      //   });
      //   that.data.recordTimeLate = 0;
      //   that.data.currentBCK_IAC.volume = 0;
      //   that.data.currentBCK_IAC.offStop();
      //   that.data.currentBCK_IAC.offPlay();
      //   that.data.currentBCK_IAC.play();
      //   console.log("异常->当前开始时间是: ", that.data.currentClip.begin_time / 1000);
      //   that.data.currentBCK_IAC.seek(that.data.currentClip.begin_time / 1000);
      //   that.data.currentBCK_IAC.onSeeked(() => {
      //     console.log("重定位完成,伴奏音轨目前位置：", that.data.currentBCK_IAC.currentTime);
      //     that.data.currentBCK_IAC.stop();
      //     that.data.currentRec_IAC.destroy();
      //     that.data.currentRec_IAC = wx.createInnerAudioContext();
      //     that.ensemble();
      //   });
      //   return;
      // }

      that.setData({
        recordTimeLate: recordTimeLate,
      })

      if (recordTimeLate > 0) {
        currentBCK_IAC.startTime = currentBCK_IAC.startTime + recordTimeLate;
        console.log("伴奏轨道向后延迟修正:", recordTimeLate);
      }
      else {
        currentRec_IAC.startTime = -recordTimeLate;
        console.log("人声轨道向后延迟修正:", recordTimeLate)
      }
      that.setData({
        hasModified: true,
        startTime: currentBCK_IAC.startTime,
        isRecording: false,
        isReadying: true,
      })
    }

    if (currentBCK_IAC.paused) {
      currentBCK_IAC.onPlay(() => {
        currentBCK_IAC.seek(that.data.currentClip.begin_time / 1000);
      });
      currentBCK_IAC.offSeeked();
      currentBCK_IAC.onSeeked((res) => {
        currentBCK_IAC.volume = 0.5;
        console.log("设置成功");
      });
      currentBCK_IAC.volume = 0;
      //currentRec_IAC.volume = 0;
      currentBCK_IAC.play();
      currentRec_IAC.startTime=0;
      currentRec_IAC.play();
    }
  },
  // 重唱该段
  ensemble: function () {

    var that = this;

    if (!that.data.hasCompleted)
      return;


    that.data.currentRec_IAC.offTimeUpdate();

    if (!that.data.currentBCK_IAC.paused) {
      that.data.currentBCK_IAC.offPlay();
      that.data.currentBCK_IAC.offStop();
      that.data.currentBCK_IAC.stop();
    }

    if (!that.data.currentRec_IAC.paused) {
      that.data.currentRec_IAC.stop();
      that.data.currentRec_IAC.startTime = 0;
    }
    that.playAnimaton("ensemble");

    if (that.data.hasOriginSinger) {
      that.data.currentBCK_IAC.volume = 0;
      that.data.hasOriginSinger = 0.7
    }
    else {
      that.data.currentBCK_IAC.volume = 0.7;
      that.data.hasOriginSinger = 0;
    }

    that.setData({
      startRecordClickAmount: 0,
      tryListeningClickAmount: 0,
      hasCompleted: false,
      isReadying: true,
      isRecording: false,
      remainedTime: 0,
      hasModified: false,
      recordTimeLate: 0,
      hasUploaded:true,
    })
  },
  // 该段原唱播放 
  playWithOriginalSinger: function () {

    if (this.data.disableOrg) {
      return;
    }

    var nowClickTime = new Date().getTime();
    console.log(nowClickTime);

    //防止频繁点击
    if (nowClickTime-this.data.lastClickTime<1000){
      wx.showToast({
        title: '太快了，受不了',
        icon: '/images/icon/running_icon.png',
        duration: 2000,
        mask:true,
      });
      return;
    }


    if (this.data.tryListeningClickAmount == 1 || !this.data.currentRec_IAC.paused) {
      wx.showToast({
        title: "试听中不能切换",
        icon: 'none',
        duration: 2000,
        mask: true,
      });
      return;
    }

    this.setData({
      hasOriginSinger: !this.data.hasOriginSinger,
      lastClickTime: nowClickTime,
    });

    if (this.data.hasOriginSinger) {
      this.data.currentBCK_IAC.volume = 0;
      this.data.currentOrg_IAC.volume = 0.7;
    }
    else {
      this.data.currentBCK_IAC.volume = 0.7;
      this.data.currentOrg_IAC.volume = 0;
    }

    // var currentBCK_IAC = this.data.currentBCK_IAC;

    // currentBCK_IAC.offStop();

    // currentBCK_IAC.onPause(()=>{
    //   console.log("切换原唱并停止伴奏音轨");
    //   var currentTime = currentBCK_IAC.currentTime;
    //   if(that.data.hasOriginSinger)
    //     currentBCK_IAC.src=that.data.currentOrg_FilePath;
    //   else
    //     currentBCK_IAC.src=that.data.currentBCK_FilePath;
    //   // currentBCK_IAC.offPlay();
    //   // currentBCK_IAC.onPlay(()=>{
    //   //   console.log("开始播放并重定位");
    //   //   console.log(currentTime);
    //   //   currentBCK_IAC.seek(currentTime);
    //   // });
    //   // currentBCK_IAC.volume=0;
    //   currentBCK_IAC.play();
    //   currentBCK_IAC.seek(currentTime);
    // })

    //currentBCK_IAC.pause();


    var that = this;
    that.playAnimaton("origin");
  },

  diffTime: function (now, last) {
    if (now - last > 500)
      return true;
    else
      return false;
  },

  downloadFiles: function () {

    var that = this;

    wx.getSavedFileList({
      success: function (res) {
        that.data.file_length_OnError = res.fileList.length;
        for (var i in res.fileList) {
          console.log("删除文件" + i);
          wx.removeSavedFile({
            filePath: res.fileList[i].filePath,
            success: function () {
              that.setData({
                file_length_OnError: that.data.file_length_OnError - 1
              })
            },
            complete: function (res) {
            }
          })
        }
      },
      fail: function (err) {
        console.log(err);
      }
    })

    if (that.data.file_length_OnError != 0)
      setTimeout(function () {
        console.log("等待文件删除中");
     that.downloadFiles();
      }, 500);

    that.setData({
      isDownloading: true,
    })

    var currentBCK_FilePath;
    var currentOrg_FilePath;

    if (that.data.BCK_url === undefined || that.data.Org_url === undefined) {
      console.log("文件路径丢失");
      return;
    }

    const downloadTask1 = wx.downloadFile({
      url: that.data.BCK_url,
      success: function (res) {
        if (res.statusCode === 200) {

          wx.saveFile({
            tempFilePath: res.tempFilePath,
            success: function (res) {
              currentBCK_FilePath = res.savedFilePath;
              that.setData({
                currentBCK_FilePath: currentBCK_FilePath,
              });
              const downloadTask2 = wx.downloadFile({
                url: that.data.Org_url,
                success: function (res) {
                  if (res.statusCode === 200) {
                    wx.saveFile({
                      tempFilePath: res.tempFilePath,
                      success: function (res) {
                        currentOrg_FilePath = res.savedFilePath;

                        that.setData({
                          isDownloading: false,
                          currentOrg_FilePath: currentOrg_FilePath,
                        });

                        var existedResource = {
                          currentBCK_FilePath: that.data.currentBCK_FilePath,
                          currentOrg_FilePath: that.data.currentOrg_FilePath,
                          songId: that.data.songId,
                        }

                        wx.setStorageSync("ER", existedResource);
                        // wx.showToast({
                        //   title: "数据加载成功",
                        //   icon: "success",
                        //   duration: 1000,
                        //   mask: true,
                        // });
                      },
                      fail: function (err) {
                        console.log(err);
                        wx.showToast({
                          title: '存储错误',
                        });
                        wx.getSavedFileList({
                          success: function (res) {
                            for (var i in res.fileList) {
                              console.log("删除文件" + i);
                              wx.removeSavedFile({
                                filePath: res.fileList[i].filePath,
                                success: function () {
                               that.downloadFiles();
                                },
                                complete: function (res) {
                                }
                              });
                            }
                          },
                          fail: function (err) {
                            console.log(err);
                          }
                        });

                      }
                    });
                  }
                },
                fail: function (err) {
                  console.log("下载失败");
                  console.log(err);
                  wx.getSavedFileList({
                    success: function (res) {
                      for (var i in res.fileList) {
                        wx.removeSavedFile({
                          filePath: res.fileList[i].filePath,
                          complete: function (res) {
                            console.log("删除文件" + i);
                          }
                        });
                      }
                    },
                    fail: function (err) {
                      console.log(err);
                    }
                  });

                }
              });

              downloadTask2.onProgressUpdate((res) => {
                that.setData({
                  progress: res.progress / 2 + 50
                });
                if (res.progress == 100) {
                  that.setData({
                    propt_motto: "下载已完成!马上进入...",
                    old_progress: res.progress,
                  });
                  return;
                }

                that.drawProgresCircleBar(res.progress / 2 + 50);
                console.log("下载任务二进度:"+(res.progress/2+50));

                if (res.progress % 40 < 20) {
                  that.setData({
                    propt_motto: "提示：戴上耳机唱歌效果更佳哟!",
                    old_progress: res.progress,
                  })
                }
                else {
                  that.setData({
                    propt_motto: "下载资源中，请耐心等候...",
                  })
                }
              });

            },
            fail: function (err) {
              console.log(err);
              wx.showToast({
                title: '存储错误',
              })
            }
          });


        }

      },
      fail: function (err) {
        console.log(err);
     that.downloadFiles();
      }
    });
    downloadTask1.onProgressUpdate((res) => {
      that.setData({
        progress: res.progress / 2,
      });

      that.drawProgresCircleBar(res.progress / 2);
      console.log("下载任务一进度:"+res.progress/2);

      if (res.progress % 40 < 20) {
        that.setData({
          propt_motto: "提示：戴上耳机唱歌效果更佳哟!",
          old_progress: res.progress,
        })
      }
      else {
        that.setData({
          propt_motto: "下载资源中，请耐心等候...",
        })
      }
    });
  },

  handleLyric: function () {
    //var currentLineNum = that.data.currentLineNum;  //当前唱到的歌词行

    var that = this;
    var originLyrics = that.data.Lyrics;
    var processedLyrics = new Array([originLyrics.length]);


    for (var i in originLyrics) {
      var lyric_temp = {
        beginTime: 0,
        endTime: 0,
      }
      lyric_temp.beginTime = (that.analysisTime(originLyrics[i].beginTime)) / 1000;
      lyric_temp.endTime = (that.analysisTime(originLyrics[i].endTime)) / 1000;
      processedLyrics[i] = lyric_temp;
    }

    that.setData({
      Lyrics: processedLyrics,
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

  getCurrentClipFirstLyricIndex: function () {
    var that = this;
    var index = 0;
    for (var i in that.data.selectedData.allOriginData.songs) {
      if (i < that.data.currentClipNum - 1) {
        var length = that.data.selectedData.allOriginData.songs[i].lyric.lyrics.length;
        index += length;
      }
      else {
        break;
      }

    }

    return index;
  },

  getCurrentClipLastLyricIndex: function () {

    var that = this;
    var index = 0;
    for (var i in that.data.selectedData.allOriginData.songs) {
      if (i <= that.data.currentClipNum - 1) {
        var length = that.data.selectedData.allOriginData.songs[i].lyric.lyrics.length;
        index += length;
      }
      else {
        break;
      }

    }
  },

  //获取带有开始和结束时间的歌词数据
  getPlayInfoDataFromServer: function () {

    var that = this;

    var data = {
      requestType: "GetPlayInfo",
      created_song_id: that.data.created_songId,
    }

    util.requestFromServer("GetPlayInfo", data).then((res) => {
      that.setData({
        Lyrics: res.data.lyrics
      });
      that.handleLyric();
    }).catch((err) => {
      console.log("请求失败");
    });
  },

  checkFilesToUpload: function () {

    this.play(3,this);


    if (!this.data.hasCompleted) {
      wx.showToast({
        title: "未完成录音",
        image: "/images/icon/null_icon.png"
      })
      return;
    }

    var that = this;
    var all_RecordFiles = that.data.all_Rec_Temp_File;
    var temp_path = all_RecordFiles[that.data.currentClipNum - 1].temp_path;

    if (temp_path === undefined||temp_path =="")
      return;

    that.playAnimaton("upload");

    // if (that.data.recordTimeLate < -1 || that.data.recordTimeLate > 1) {
    //   wx.showModal({
    //     title: "录音延迟过高，即将重置",
    //     icon: "none",
    //     showCancel: false,
    //   });
    //   that.setData({
    //     recordTimeLate: 0,
    //   })
    //   that.data.currentBCK_IAC.volume = 0;
    //   that.data.currentBCK_IAC.offStop();
    //   that.data.currentBCK_IAC.offPlay();
    //   that.data.currentBCK_IAC.play();
    //   console.log("异常->当前开始时间是: ", that.data.currentClip.begin_time / 1000);
    //   that.data.currentBCK_IAC.seek(that.data.currentClip.begin_time / 1000);
    //   that.data.currentBCK_IAC.onSeeked(() => {

    //     console.log("重定位完成,伴奏音轨目前位置：", that.data.currentBCK_IAC.currentTime);
    //     that.data.currentBCK_IAC.stop();
    //     that.data.currentRec_IAC.destroy();
    //     that.data.currentRec_IAC = wx.createInnerAudioContext();
    //     wx.showToast({
    //       title: "重置成功",
    //     });
    //     that.ensemble();
    //   });
    //   setTimeout(function () {
    //     console.log("修复中");
    //   }, 2000);
    //   return;
    // }

    wx.showModal({
      title: '提示',
      content: '确定上传你刚刚唱的那一段吗？',
      success: function (res) {
        if (res.confirm) {
          that.setData({
            isUploading: true,
          });

          const uploadTask = wx.uploadFile({
            url: "https://oss.caoyu.online",
            filePath: temp_path,
            name: "file",
            formData: {
              name: temp_path,
              key: "s" + that.data.created_songId + "c" + that.data.currentClipNum + ".mp3",
              policy: "eyJleHBpcmF0aW9uIjoiMjAyMC0wMS0wMVQxMjowMDowMC4wMDBaIiwiY29" +
                "uZGl0aW9ucyI6W1siY29udGVudC1sZW5ndGgtcmFuZ2UiLDAsMTA0ODU3NjAwMF1dfQ==",
              OSSAccessKeyId: "LTAIqWHGKJovzgCy",
              success_action_status: "200",
              signature: "Peiz2ohiIFqIhvR8oxgSkwidmWw="
            },
            success: function (res) {
              console.log("上传成功", res);
              that.setData({
                isUploading: false,
              });
              var data = {
                requestType: "SingClip",
                created_song_id: that.data.created_songId,
                clip_count: that.data.currentClipNum,
                delay: that.data.recordTimeLate * 10000,
              }
              console.log(data);

              util.requestFromServer("SingClip", data).then((res) => {
                // wx.showToast({
                //   title: "上传完成",
                //   duration: 1500,
                //   mask: true,
                // });

                console.log(res);
                that.checkSongisCompeleted();


                that.setData({
                  hasUploaded:true,
                  score:res.data.score,
                  showDialog:true,
                  starsArray:util.convertToStarsArray(res.data.score/1000),
                });

              }).catch((err) => {
                console.log("上传时通知服务器失败", err);
              })

            },
            fail: function (err) {
              console.log("上传失败".err);
            }
          });

          uploadTask.onProgressUpdate((res) => {
            that.setData({
              progress: res.progress,
              propt_motto: "上传中...",
            });

            that.drawProgresCircleBar(res.progress);
          })
        }
      }
    })

  },

  setAnimation: function () {

    var that = this;

    var animaton = wx.createAnimation({
      timingFunction: "ease-in-out"
    });

    that.animation = animaton;
  },

  playAnimaton: function (key) {
    var that = this;
    var animationDatas = {};

    if (key == "upload") {

      that.animation.scale(1.5).step();
      //that.animation.translate3d(100, 100, 20).step({ duration: 1000 })
      animationDatas[key] = {
        animationData: that.animation.export(),
      }
      that.setData({
        animationDatas: animationDatas,
      });

      setTimeout(function () {
        that.animation.scale(1).step();
        animationDatas[key] = {
          animationData: that.animation.export(),
        }
        that.setData({
          animationDatas: animationDatas,
        });
      }.bind(that), 300);


    }
    else if (key == 'wave') {
      that.animation.opacity(0).scale(3, 3).step();//修改透明度,放大
      animationDatas[key] = {
        animationData: that.animation.export(),
      }
      this.setData({
        animationDatas: animationDatas,
      })
    }
    else {
      that.animation.scale(1.2).step();
      animationDatas[key] = {
        animationData: that.animation.export(),
      }
      that.setData({
        animationDatas: animationDatas,
      });

      setTimeout(function () {
        that.animation.scale(1).step();
        animationDatas[key] = {
          animationData: that.animation.export(),
        }
        that.setData({
          animationDatas: animationDatas,
        });
      }.bind(that), 300);
    }
  },

  //检查录音授权信息
  checkRecord: function () {
    var that = this;
    wx.getSetting({
      success: function (res) {
        console.log(res);
        if (!res.authSetting['scope.record']) {
          that.setData({
            isGetRecord: false
          })
        } else {
          that.setData({
            isGetRecord: true
          })
        }
      }
    })
  },

  onShareAppMessage: function (res) {
    var isShare = true;
    var category = 'Select';
    var userInfo = app.globalData.userInfo;

    var titleString = userInfo.nickName + "邀请你和他一起唱 《" + this.data.title + "》";
    return {
      title: titleString,
      path: '/pages/welcome/welcome?isShare=' + isShare + '&created_song_id=' + this.data.created_songId + '&song_id=' + this.data.songs.songId + '&category=' + category,
      imageUrl: this.data.songs.music.coverImg,
    }
  },

  checkSongisCompeleted: function () {

    var clips = this.data.clips;
    var all_Rec_Temp_File = this.data.all_Rec_Temp_File;

    for (var i in clips) {
      if (all_Rec_Temp_File[clips[i] - 1] === undefined)
        return;
    }

    var data = {
      requestType: "IsCompleted",
      created_song_id: this.data.created_songId
    }

    var that = this;

    util.requestFromServer("IsCompleted", data).then((res) => {

      if (res.data.IsCompleted == "false") {
        wx.showModal({
          title: "提示",
          content: "恭喜你完成你选择的所有部分，但是这首歌还未被全部完成喔，点击右上角分享邀请更多的人吧",
          success: function (res) {
            if (res.confirm) {
              that.onShareAppMessage("");
            }
            else {
              wx.showModal({
                title: "提示",
                content: "好吧，现在你可以选择返回到其他人的分享界面查看更多歌曲了！",
                success: function (res) {
                  if (res.confirm) {
                    wx.navigateBack({
                      url: '../world/world'
                    })
                  }
                }
              })
            }
          }
        });
      }
      else if (res.data.IsCompleted == "true") {
        wx.showModal({
          title: "提示",
          content: "经过你的努力，这首歌由你最后完成了，是否前往试听",
          success: function (res) {
            if (res.confirm)
              wx.redirectTo({
                url: "../player/player?isShare=true&created_song_id=" + that.data.created_songId,
              })
          }
        })
      }

    }).catch((err) => {
      console.log(err);
    });

  },

  //注册所有回调函数
  registerAllCallBack: function (firstTime) {

    var that = this;

    const recorderManager = wx.getRecorderManager();
    if (firstTime) {
      // recorderManager.onStart((res) => {
      //   console.log("录音开始");
      //   console.log("暂停前时间", that.data.currentBCK_IAC.currentTime);
      //   that.data.currentBCK_IAC.pause();
      //   console.log("暂停后时间", that.data.currentBCK_IAC.currentTime);
      //   var recordStartTime = that.data.currentBCK_IAC.currentTime;
      //   that.setData({
      //     recordStartTime: recordStartTime,
      //     isRecording: true,
      //     hasModified: false,
      //   });
      //   console.log("录音开始时伴奏音轨时刻：", that.data.recordStartTime);
      //   console.log(that.data.recordStartTime - that.data.currentBCK_IAC.startTime);
      //   var recordTimeLate = that.data.recordStartTime - that.data.currentBCK_IAC.startTime;
      //   that.setData({
      //     recordTimeLate: recordTimeLate,
      //   });
      //   if (Math.abs(recordTimeLate) > 1) {
      //     that.data.currentBCK_IAC.stop();
      //     wx.getRecorderManager().stop();
      //     console.log("伴奏音轨起点异常，重置！");
      //     that.setData({
      //       isRecording: false,
      //       hasModified: false,
      //       startRecordClickAmount: 0,
      //     });
      //     return;
      //   }
      //   that.data.currentBCK_IAC.offPlay();
      //   that.data.currentBCK_IAC.play();

      // })

      recorderManager.onStop((res) => {

        if (!that.data.hasCompleted)
          return;

        var completedClipsNum = that.data.completedClipsNum;
        var currentProgress;

          
        if(that.data.all_Rec_Temp_File[that.data.currentClipNum-1].temp_path==""){
            completedClipsNum++;
            currentProgress=parseInt(completedClipsNum/that.data.totalChoosedClipsCount*100);
        }

        console.log("Recorder stop", res);
        const { tempFilePath } = res
        var temp_IAC = that.data.currentRec_IAC;
        temp_IAC.src = tempFilePath;

        var temp_Record_File = {
          createdSongId: that.data.created_songId,
          clipCount: that.data.currentClipNum,
          temp_path: tempFilePath,
        }

        var prompt_finished = wx.getStorageSync("prompt_finished");
        if (!prompt_finished) {
          wx.showModal({
            title: "导航",
            content: "恭喜你唱完了这段，去点击试听按钮播放你美妙的歌声吧",
            cancelText: "不再提示",
            confirmText: "知道了",
            success: function (res) {
              if (res.cancel) {
                wx.setStorageSync("prompt_finished", true);
              }
            }
          })
        }

        that.data.all_Rec_Temp_File[that.data.currentClipNum - 1] = temp_Record_File;
        console.log(that.data.all_Rec_Temp_File);
        that.setData({
          currentRec_IAC: temp_IAC,
          startRecordClickAmount: 0,
          tryListeningClickAmount: 0,
          isReadying: true,
          hasCompleted: true,
          isCorrected: false,
          disableSkip: false,
          isRecording: false,
          completedClipsNum:completedClipsNum,
          currentProgress:currentProgress,
        });
      });

    }

  },

  //绘制圆形进度条
  drawProgresCircleBar: function (progress) {

    if (progress % 10 != 0)
      return;

    //计算终止弧度
    console.log("当前进度：" + progress);

    var cxt_arc = wx.createCanvasContext("canvasArc");
    cxt_arc.setLineWidth(3);
    cxt_arc.setStrokeStyle('#20183b');
    cxt_arc.setLineCap('round')
    cxt_arc.beginPath();//开始一个新的路径
    cxt_arc.arc(106, 106, 65, 0, 2 * Math.PI, false);//设置一个原点(106,106)，半径为100的圆的路径到当前路径
    cxt_arc.stroke();//对当前路径进行描边

    var gradient = cxt_arc.createLinearGradient(200, 100, 100, 200);
    gradient.addColorStop("0", "#2661DD");
    gradient.addColorStop("0.5", "#40ED94");
    gradient.addColorStop("0.7", "#8d1bff");
    gradient.addColorStop("1.0", "#5956CC");


    cxt_arc.setLineWidth(10);
    cxt_arc.setStrokeStyle(gradient);
    cxt_arc.setLineCap('round')
    cxt_arc.beginPath();//开始一个新的路径

    var angle = (progress / 100 - 0.25) * 2 * Math.PI;

    cxt_arc.arc(106, 106, 65, -Math.PI * 1 / 2, angle, false);
    cxt_arc.stroke();//对当前路径进行描边
    cxt_arc.draw();

  },

  //播放上传波纹动画
  play: function (count,that) {

    if (count < 0) {
      console.log("播放结束");
      return;
    }
    console.log("点击中");

      //波纹放大,淡出动画
      var animation = wx.createAnimation({
        timingFunction: "ease-in-out",
      });
      animation.opacity(0).scale(2, 2).step();//修改透明度,放大
      animation.scale(1, 1).opacity(1).step({ duration: 700 });//修改透明度,放大

      that.setData({
        animation_wave: animation.export()
      });
      count--;

    setTimeout(function () {
      
      that.play(count,that);
    }, 1200)

  },

  cancel:function(event){
    //console.log(event);
    this.setData({
      showDialog:false,
    })
  }

})