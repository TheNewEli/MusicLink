// pages/sing/sing.js
const timer = require('../../utils/timer');
var util = require('../../utils/util');

var app = getApp();
const CORRECT_TIME = 0.6;

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
    recordStartTime: 0,
    endTime: 0,
    currentTime: 0,
    remainedTime: 3,

    isReadying: true,
    isRecording: false,

    //进度和提示
    progress: 0,
    propt_motto: "",
    isDownloading: false,
    isUploading: false,

    //延迟修正
    hasModified: false,

    //记录跳转时间
    lastSkipTime: 0,
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
    animation: {},
    animation_last:{},
    animation_next:{},

  },

  onLoad: function (options) {
    var songId = options.songId;
    this.setData({
      songId: songId
    })
    this.init();
    this.setAnimation();
  },

  onShow: function () {

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
    })
  },

  onReady: function () {
    wx.setNavigationBarTitle({
      title: this.data.title,
    })
  },

  onHide: function () {

    if (!this.data.currentBCK_IAC.paused)
      this.data.currentBCK_IAC.stop();
    if (!this.data.currentRec_IAC.paused)
      this.data.currentRec_IAC.stop();

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
    wx.getRecorderManager().stop();

    wx.getSavedFileList({
      success: function (res) {
        console.log(res.fileList)
      }
    });
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
      if (!this.data.isDownloading)
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


    //如果录音已经开始，按键失效
    if (!this.data.currentBCK_IAC.paused)
      return;

    var that = this;
    that.animation_last.scale(2).step();
    that.setData({
      animation_last: that.animation_last.export(),
    });

    setTimeout(function () {
      that.animation_last.scale(1).step();
      that.setData({
        animation_last: that.animation_last.export(),
      });
    }.bind(that), 300);

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
      var toCurrentView = "ClipCount" + (currentClipNum - 1);
      this.setData({
        currentLineNum: currentLineNum,
        currentClipNum: clips[index],
        toCurrentView: toCurrentView,
        lastSkipTime: nowSkipTime,
        hasCompleted: false,
        hasModified: false,
        startRecordClickAmount: 0,
        tryListeningClickAmount: 0,
      })
    }

  },

  skipToNextClips: function () {

    //如果录音已经开始，按键失效
    if (!this.data.currentBCK_IAC.paused)
      return;

    var that = this;
    that.animation_next.scale(2).step();
    that.setData({
      animation_next: that.animation_next.export(),
    });

    setTimeout(function () {
      that.animation_next.scale(1).step();
      that.setData({
        animation_next: that.animation_next.export(),
      });
    }.bind(that), 300);

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
      var toCurrentView = "ClipCount" + (currentClipNum - 1);

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
        hasModified: false,
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

    recorderManager.onStart((res) => {
      console.log("录音开始");
      console.log("伴奏音轨到了：", that.data.currentBCK_IAC.currentTime);
      that.setData({
        recordStartTime: that.data.currentBCK_IAC.currentTime,
      });
    })

    recorderManager.onStop((res) => {

      //console.log("?",that.data.hasCompleted);

      if (!that.data.hasCompleted)
        return;
      console.log("Recorder stop", res);
      const { tempFilePath } = res
      var temp_IAC = that.data.currentRec_IAC;
      temp_IAC.src = tempFilePath;

      var temp_Record_File = {
        createdSongId: that.data.created_songId,
        clipCount: that.data.currentClipNum,
        temp_path: tempFilePath,
      }

      that.data.all_Rec_Temp_File[that.data.currentClipNum - 1] = temp_Record_File;
      console.log(that.data.all_Rec_Temp_File);
      that.setData({
        currentRec_IAC: temp_IAC,
        startRecordClickAmount: 0,
        tryListeningClickAmount: 0,
        isReadying: true,
      });
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

    // currentBCK_IAC.startTime = currentClip.begin_time / 1000;
    currentBCK_IAC.startTime = that.data.Lyrics[currentLineNum].beginTime;
    currentBCK_IAC.volume = 1;

    wx.setStorageSync("hasOriginSinger", that.data.hasOriginSinger);

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
    });


    currentBCK_IAC.onTimeUpdate((res) => {

      if (currentBCK_IAC.currentTime < currentBCK_IAC.startTime) {
        currentBCK_IAC.seek(currentBCK_IAC.startTime);
        return;
      }

      var currentLineNum = that.data.currentLineNum;
      var startRecordTime = that.data.Lyrics[that.getCurrentClipFirstLyricIndex()].beginTime;

      if (currentBCK_IAC.currentTime - startRecordTime > 0.01 && !that.data.isRecording) {
        const options = {
          duration: 300000,
          sampleRate: 44100,
          numberOfChannels: 2,
          encodeBitRate: 192000,
          format: 'mp3',
          frameSize: 50
        }
        console.log("countDown completed");
        wx.getRecorderManager().start(options);
        that.setData({
          isRecording: true,
        })
      }

      if (currentBCK_IAC.currentTime >= that.data.endTime) {
        console.log('该段结束');
        currentBCK_IAC.stop();
        this.setData({
          hasCompleted: true,
        })
        wx.getRecorderManager().stop();
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
        currentOrg_IAC: "",
      });
      if (!that.data.isDownloading)
        that.downloadFiles();
    });

    currentBCK_IAC.onSeeking((res) => {
      console.log("Seeking:", "currentime:", currentBCK_IAC.currentTime, "startTime:", currentBCK_IAC.startTime);

    });
    currentBCK_IAC.onSeeked((res) => {
      console.log("Seeked: currentime:", currentBCK_IAC.currentTime, "startTime:", currentBCK_IAC.startTime);
    });
    currentBCK_IAC.onStop(() => {
      if (currentBCK_IAC.paused) {
        currentBCK_IAC.play();
        currentBCK_IAC.seek(that.data.startTime);
        currentBCK_IAC.offStop();
        currentBCK_IAC.stop();
      }

    })

    timer.countDown(that, remainedTime);
    // console.log("here");

  },

  //试听唱过的部分
  tryListening: function () {


    var that = this;

    if (!that.data.hasCompleted)
      return;

    var currentBCK_IAC = that.data.currentBCK_IAC;
    var currentRec_IAC = that.data.currentRec_IAC;
    //防止重复点击导致重复播放
    if (that.data.tryListeningClickAmount == 1) {
      currentBCK_IAC.stop();
      currentRec_IAC.stop();
    }

    console.log("Try Listening")

    that.setData({
      startRecordClickAmount: 0,
      tryListeningClickAmount: 1,
      currentLineNum: that.getCurrentClipFirstLyricIndex(),
    });

    currentBCK_IAC.volume = 0.3;
    currentRec_IAC.volume = 1;


    if (!that.data.hasModified) {
      var recordTimeLate = that.data.recordStartTime - that.data.currentBCK_IAC.startTime;
      if (recordTimeLate > 0) {
        currentBCK_IAC.startTime = currentBCK_IAC.startTime + recordTimeLate;
      }
      else
        currentRec_IAC.startTime = recordTimeLate;
      console.log("延迟修正:", recordTimeLate);
      that.setData({
        hasModified: true,
        startTime: currentBCK_IAC.startTime,
      })
    }

    currentBCK_IAC.offTimeUpdate();

    currentRec_IAC.onEnded(() => {
      that.data.currentBCK_IAC.offPlay();
      that.data.currentBCK_IAC.offStop();
      that.data.currentBCK_IAC.stop();
      that.data.currentBCK_IAC.offTimeUpdate();
      currentRec_IAC.offTimeUpdate();
    });

    currentRec_IAC.onTimeUpdate((res) => {

      //更新歌词
      var currentLineNum = that.data.currentLineNum;
      //console.log(currentLineNum);
      console.log("CurrnetLine: ", currentLineNum, "BCK: ", that.data.currentBCK_IAC.currentTime,
        "Rec: ", currentRec_IAC.currentTime);


      if (that.data.currentBCK_IAC.currentTime >= that.data.Lyrics[currentLineNum].endTime) {
        currentLineNum += 1;
        that.setData({
          currentLineNum: currentLineNum,
        });
      }
    });

    currentRec_IAC.onPlay(() => {
      console.log("合成音轨开始播放");
    });


    if (currentBCK_IAC.paused)
      currentBCK_IAC.play();
    if (currentRec_IAC.paused)
      currentRec_IAC.play();

  },
  // 重唱该段
  ensemble: function () {

    var that = this;

    if (!that.data.hasCompleted)
      return;

    if (!that.data.currentBCK_IAC.paused)
      that.data.currentBCK_IAC.stop();
    if (!that.data.currentRec_IAC.paused)
      that.data.currentRec_IAC.stop();

    that.setData({
      startRecordClickAmount: 0,
      tryListeningClickAmount: 0,
      hasCompleted: false,
      isReadying: true,
      isRecording: false,
      remainedTime: 0,
      hasModified: false,
      recordTimeLate: 0,
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
                duration: 1000,
                mask: true,
              })
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
      }

    });
    // downloadTask2.onProgressUpdate((res) => {
    //   that.setData({
    //     progress: res.progress / 2 + 50
    //   })

    downloadTask1.onProgressUpdate((res) => {
      that.setData({
        progress: res.progress,
        propt_motto: "下载中：",
      })
    });
  },

  handleLyric: function () {
    //var currentLineNum = that.data.currentLineNum;  //当前唱到的歌词行
    var originLyrics = this.data.Lyrics;
    var processedLyrics = new Array([originLyrics.length]);


    for (var i in originLyrics) {
      var lyric_temp = {
        beginTime: 0,
        endTime: 0,
      }
      lyric_temp.beginTime = (this.analysisTime(originLyrics[i].beginTime)) / 1000;
      lyric_temp.endTime = (this.analysisTime(originLyrics[i].endTime)) / 1000;
      processedLyrics[i] = lyric_temp;
    }

    this.setData({
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
      that.handleLyric();
    }).catch((err) => {
      console.log("请求失败");
    });
  },

  checkFilesToUpload: function () {

    if(!this.data.hasCompleted){
      wx.showToast({
        title:"你还没有录制喔",
        image:"/images/icon/null_icon.png"
      })
      return;
    }
    

    var that = this;
    var all_RecordFiles = that.data.all_Rec_Temp_File;
    var temp_path = all_RecordFiles[that.data.currentClipNum - 1].temp_path;

    if (temp_path === undefined)
      return;

    wx.showModal({
      title: '提示',
      content: '确定上传你刚刚唱的那一段吗？',
      success: function (res) {
        if (res.confirm) {
          that.setData({
            isUploading: true,
          });

          that.animation.scale(2).step();
          that.setData({
            animation: that.animation.export(),
          });

          setTimeout(function () {
            that.animation.scale(1).step();
            that.setData({
              animation: that.animation.export(),
            });
          }.bind(this), 300);

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
                clip_count: that.data.currentClipNum - 1,
              }

              util.requestFromServer("SingClip", data).then((res) => {
                wx.showToast({
                  title: "上传完成",
                  duration: 1500,
                  mask: true,
                });

                console.log(res);

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
              propt_motto: "上传中：",
            })
          })
        }
      }
    })

  },

  setAnimation: function () {
    var animaton = wx.createAnimation({
      timingFunction: "case-in-out"
    });

    this.animation = animaton;
    this.animation_last = animaton;
    this.animation_next = animaton;
  },
})