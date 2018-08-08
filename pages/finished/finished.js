var util = require('../../utils/util');
var app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    compatibility: app.globalData.compatibility,
    windowHeight: app.globalData.windowHeight,


    //伴奏音量
    volume_bck: 0.6,

    //人声音量
    volume_vocal: 1,
    //手动修正对其时间
    delay_manual: 0,
    //该段分数
    score: 9000,
    //未完成段数
    clipsToBeSong: 5,
    //歌曲进度
    progress: 0,
    progress_format: "00:00",
    //歌曲长度
    duration: 0,

    startTime: 0,

    isPlaying: false,

    currentBCK_IAC: "",
    currentRec_IAC: "",

    currentBCK_FilePath: "",
    record_tempFilePath: "",

    hasModified: false,

    created_song_id:-1,
    clip_count:-1,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var Comp = {
      statusBarHeight: app.globalData.statusBarHeight,
      iSback: true,
      color: "#fff",
      text: options.title,
      background: "#3e3837",
      iSpadding: true
    };
    this.setData({
      Comp: Comp
    })

  },

  onShow: function () {


    var ER = wx.getStorageSync("ER");
    var currentBCK_FilePath = ER.currentBCK_FilePath;
    //var currentBCK_FilePath = "http://other.web.rf01.sycdn.kuwo.cn/resource/n1/77/17/2299001074.mp3";
    var record_info = wx.getStorageSync("record_info");
    console.log(record_info);

    var that = this;

    var currentBCK_IAC = wx.createInnerAudioContext();
    var currentRec_IAC = wx.createInnerAudioContext();

    wx.showLoading({
      title: "加载中",
    })

    wx.downloadFile({
      url: record_info.url,
      success: function (res) {
        wx.hideLoading();
        if (res.statusCode === 200) {

          currentBCK_IAC.src = currentBCK_FilePath;
          //currentBCK_IAC.src= res.tempFilePath;
         
          currentRec_IAC.src = res.tempFilePath;
          var duration = record_info.duration/1000;
          //var duration = 5;
          var startTime = record_info.startTime;
          //var startTime = 17;

          that.setData({
            record_tempFilePath: res.tempFilePath,
            currentBCK_IAC: currentBCK_IAC,
            currentRec_IAC: currentRec_IAC,
            duration: duration,
            startTime: startTime,
            
          })

          wx.showToast({
            title: '加载成功',
          });
        }
      }
    });
  },

  onProgressChange: function (e) {

    if (!this.data.currentBCK_IAC.paused) {
      this.data.currentBCK_IAC.stop();
    }
    if (!this.data.currentRec_IAC.paused) {
      this.data.currentRec_IAC.stop();
    }

    var value = e.detail.value;

    var progress_format = this.timeFormat(parseInt(this.data.duration * value / 100));

    this.setData({
      progress_format: progress_format,
      progress: value,
    });

    this.data.currentBCK_IAC.offPlay();
    this.data.currentRec_IAC.offPlay();

    this.data.currentRec_IAC.offTimeUpdate();
    this.play();
  },

  onDelayJustified: function (e) {
    var delay = e.detail.value;

    var startTime = this.data.startTime;

    if (startTime + delay/1000 < 0)
      startTime = 0;
    else
      startTime += delay/1000;
    this.setData({
      delay_manual: delay,
      startTime: startTime,
      hasModified: true,
    })
  },

  play: function () {
    var currentBCK_IAC = this.data.currentBCK_IAC;
    var currentRec_IAC = this.data.currentRec_IAC;
    var progress = this.data.progress;
    var duration = this.data.duration;
    var startTime = this.data.startTime;

    var current_pos = duration * progress / 100;

    var that = this;

    currentBCK_IAC.onPlay(() => {
      console.log("伴奏播放");
      currentBCK_IAC.seek(current_pos+startTime);
      currentBCK_IAC.offPlay();
    });

    currentBCK_IAC.onTimeUpdate((res) => {
      // var progress = parseInt(currentBCK_IAC.currentTime / that.data.duration * 100);
      // console.log("CurrentTime:",currentBCK_IAC.currentTime, "Duration", that.data.duration)

      // console.log("进度：" + progress);

      // var progress_format = that.timeFormat(parseInt(currentBCK_IAC.currentTime));
      // that.setData({
      //   progress: progress,
      //   progress_format: progress_format,
      // })
    })

    currentRec_IAC.onPlay(() => {
      console.log("录音播放");
      currentRec_IAC.seek(current_pos);
      currentRec_IAC.offPlay();
    });

    currentRec_IAC.onTimeUpdate((res) => {
      var progress = parseInt(currentRec_IAC.currentTime / that.data.duration * 100);
      console.log("CurrentTime:", currentRec_IAC.currentTime, "Duration", that.data.duration)

      console.log("进度：" + progress);

      var progress_format = that.timeFormat(parseInt(currentRec_IAC.currentTime));
      that.setData({
        progress: progress,
        progress_format: progress_format,
      })
    })
   
    currentRec_IAC.onEnded(() => {
      currentBCK_IAC.stop();
      that.setData({
        isPlaying: false,
        progress: 0,
        progress_format: "00:00",
      })
    })

    that.setData({
      isPlaying: true,
    })
    currentBCK_IAC.volume = that.data.volume_bck;
    currentRec_IAC.volume = that.data.volume_vocal;
    currentBCK_IAC.play();
    currentRec_IAC.play();

  },

  pause: function () {
    if (!this.data.currentBCK_IAC.paused)
      this.data.currentBCK_IAC.pause();
    if (!this.data.currentRec_IAC.paused)
      this.data.currentRec_IAC.pause();
    this.setData({
      isPlaying: false,
    })
  },

  stop: function () {
    if (!this.data.currentBCK_IAC.paused) {
      this.data.currentBCK_IAC.stop();
    }
    if (!this.data.currentRec_IAC.paused) {
      this.data.currentRec_IAC.stop();
    }

    // this.myFukingCustomnSeek(this.data.currentBCK_IAC, this.data.startTime);
    //this.myFukingCustomnSeek(this.data.currentBCK_IAC, 0);
    var currentBCK_IAC = wx.createInnerAudioContext();
    var currentRec_IAC = wx.createInnerAudioContext();
    currentBCK_IAC.src = this.data.currentBCK_IAC.src;
    currentRec_IAC.src = this.data.currentRec_IAC.src;
    // this.data.currentBCK_IAC.destory();
    // this.data.currentRec_IAC.destory();


    this.setData({
      isPlaying: false,
      progress: 0,
      progress_format: "00:00",
      currentBCK_IAC:currentBCK_IAC,
      currentRec_IAC:currentRec_IAC,
    })
  },

  applicate: function () {
    this.setData({
      hasModified: false,
      progress:0,
    });
    this.play();
  },

  submit: function () {

    return;
    var data = {
          requestType: "SingClip",
          created_song_id: that.data.created_song_Id,
          clip_count: that.data.clip_count,
          delay: that.data.delay_manual,
        };
        console.log(data);

        util.requestFromServer("SingClip", data).then((res) => {

          console.log(res);
          that.setData({
            hasModified:false,
            score: res.data.score,
          });

        }).catch((err) => {
          console.log("上传时通知服务器失败", err);
        })
  },

  onVocalVolumeChange: function (e) {
    var value = e.detail.value;
    var volume = value / 100;

    this.setData({
      volume_vocal: volume,
      hasModified: true,
    })
  },

  onBckVolumeChange: function (e) {
    var value = e.detail.value;
    var volume = value / 100;

    this.setData({
      volume_bck: volume,
      hasModified: true,
    })
  },

  //自定义seek函数
  myFukingCustomnSeek: function (currentIAC, time) {
    setTimeout(function () {

      //console.log(time);
      wx.showLoading({
        title: '加载中',
      });

      var volume = currentIAC.volume;
      currentIAC.volume = 0;

      currentIAC.onPlay(() => {
        currentIAC.seek(time);
      });

      currentIAC.onSeeked((res) => {
        console.log("定位成功")
        currentIAC.offPlay();
        currentIAC.pause();
        currentIAC.volume = 0.7;
        wx.hideLoading();
      })

      currentIAC.play();
    }.bind(this), 300);

  },

  timeFormat: function (seconds) {
    var min_part = parseInt(seconds / 60);
    var second_part = seconds % 60 + 1;

    var min_str = "";
    var sec_str = "";

    if (min_part < 10)
      min_str += "0" + min_part;
    else
      min_str += min_part;

    if (second_part < 10)
      sec_str += "0";

    sec_str += second_part;

    //console.log(min_str + ":" + sec_str);

    return min_str + ":" + sec_str;
  }
})