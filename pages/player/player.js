Page({
  data:{
    duration_print: '5:28', 
    duration: 328,
    currentSong:null,
    currentLyric: '',
    playUrl:'http://dl.stream.qqmusic.qq.com/C400000FR5GV0lwW18.m4a?vkey=5C2977C9B5B27FFAD57E941822E1D2E416F087D64E62F5854CA3ACB5294C222A307572C1707CD3E55A01B8884335B82C557187E36AF419E4&guid=6322766144&uin=0&fromtag=66',
    currentLineNum:0,
    toLineNum: -1,
    playIcon: 'icon-play',
    cdCls: 'pause',
    dotsArray: new Array(2),
    currentDot: 0,
  },
  onShow:function(){
    var selectData = wx.getStorageSync("selectedData");
    this.setData({
      currentSong:selectData.songs,
    })
    this.setLyrics();
    this._createAudio(this.data.playUrl);
  },

  // 创建播放器
  _createAudio: function (playUrl) {
    wx.playBackgroundAudio({
      dataUrl: playUrl,
      title: this.data.currentSong.title,
      coverImgUrl: this.data.currentSong.music.coverImg,
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
        currentTime: this._formatTime(currentTime),
        percent: currentTime / this.data.duration
      })
      // if (this.data.currentLyric) {
      //   this.handleLyric(currentTime * 1000)
      // }
      this.handleLyric(currentTime * 1000);
    })
  },
  // 歌词滚动回调函数
  handleLyric: function (currentTime) {
    var currentLineNum = this.data.currentLineNum,  //当前唱到的歌词行
        toLineNum;        //跳转到顶部的行，不一定是当前唱到的歌词
    var lyrics=this.data.lyrics; 
    for (var i in lyrics){
      var beginTime = this.analysisTime(lyrics[i].beginTime);
      var endTime = this.analysisTime(lyrics[i].endTime);
      if (currentTime > beginTime  && currentTime < endTime ){
        currentLineNum = i;
        console.log("currentLineNum:" + currentLineNum + " beginTime:" + beginTime + " currentTime:" + currentTime)
        break;
      }
    }

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

  analysisTime:function(time){
    var Time=time.split(":");
    var analysisTime=0;
    parseFloat(Time[0])
    analysisTime = parseFloat(Time[0]) * 60 + parseFloat(Time[1]);
    return analysisTime * 1000;
  },

  _formatTime: function (interval) {
    interval = interval | 0
    const minute = interval / 60 | 0
    const second = this._pad(interval % 60)
    return `${minute}:${second}`
  },
  /*秒前边加0*/
  _pad(num, n = 2) {
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

  prev: function () {
    // app.currentIndex = this.getNextIndex(false)
    // this._init()
  },
  
  next: function () {
    // app.currentIndex = this.getNextIndex(true)
    // this._init()
  },

  setLyrics:function(){
      var lyrics=[
        {
          lyric: '让我掉下眼泪的 不止昨夜的酒',
          beginTime: '00:18.69',
          endTime: '00:25.10',
        },
        {
          lyric: '让我依依不舍的 不止你的温柔',
          beginTime: '00:26.48',
          endTime: '00:33.14',
        },
        {
          lyric: '余路还要走多久 你攥着我的手',
          beginTime: '00:34.41',
          endTime: '00:40.83',
        },
        {
          lyric: '让我感到为难的 是挣扎的自由',
          beginTime: '00:42.39',
          endTime: '00:48.86',
        },
        {
          lyric: '分别总是在九月 回忆是思念的愁',
          beginTime: '00:52.12',
          endTime: '00:58.68',
        },
        {
          lyric: '深秋嫩绿的垂柳 亲吻着我额头',
          beginTime: '01:00.12',
          endTime: '01:06.59',
        },
        {
          lyric: '在那座阴雨的小城里',
          beginTime: '01:07.88',
          endTime: '01:11.37',
        },
        {
          lyric: '我从未忘记你',
          beginTime: '01:11.99',
          endTime: '01:14.57',
        },
        {
          lyric: '成都 带不走的 只有你',
          beginTime: '01:15.89',
          endTime: '01:20.50',
        },
        {
          lyric: '和我在成都的街头走一走',
          beginTime: '01:23.86',
          endTime: '01:29.38',
        },
        {
          lyric: '直到所有的灯都熄灭了也不停留',
          beginTime: '01:31.75',
          endTime: '01:38.35',
        },
        {
          lyric: '你会挽着我的衣袖',
          beginTime: '01:39.78',
          endTime: '01:42.03',
        },
        {
          lyric: '我会把手揣进裤兜',
          beginTime: '01:43.66',
          endTime: '',
        },
      ];
      this.setData({
        lyrics:lyrics
      })
  },

})


// const app = getApp().globalData
// const song = require('../../utils/song.js')
// const Lyric = require('../../utils/lyric.js')
// const util = require('../../utils/util.js')

// const SEQUENCE_MODE = 1
// const RANDOM_MOD = 2
// const SINGLE_CYCLE_MOD = 3

// Page({
//   data: {
//     playurl: '',
//     playIcon: 'icon-play',
//     cdCls: 'pause',
//     currentLyric: null,
//     currentLineNum: 0,
//     toLineNum: -1,
//     currentSong: null,
//     dotsArray: new Array(2),
//     currentDot: 0,
//     playMod: SEQUENCE_MODE
//   },

//   onShow: function () {
//     this._init()
//   },

//   //初始化
//   _init: function () {
//     let songslist = (app.songlist.length && app.songlist) || wx.getStorageSync('songlist')
//     let currentSong = app.songlist[app.currentIndex] || (songslist && songslist[app.currentIndex])
//     let duration = currentSong && currentSong.duration

//     this.setData({
//       currentSong: currentSong,
//       duration: this._formatTime(duration),
//       songslist: songslist,
//       currentIndex: app.currentIndex
//     })

//     this._getPlayUrl(currentSong.mid)
//     this._getLyric(currentSong)
//   },

//   // 获取背景播放音乐的songmidid
//   _getBackPlayfileName: function () {
//     return new Promise((resolve, reject) => {
//       wx.getBackgroundAudioPlayerState({
//         success: function (res) {
//           var dataUrl = res.dataUrl
//           let ret = dataUrl && dataUrl.split('?')[0].split('/')[3]
//           resolve({ ret, res })
//         },
//         fail: function (e) {
//           let ret = false
//           reject(ret)
//         }
//       })
//     })
//   },

//   // 获取播放地址
//   _getPlayUrl: function (songmidid) {
//     const _this = this
//     wx.request({
//       url: `https://c.y.qq.com/base/fcgi-bin/fcg_music_express_mobile3.fcg?g_tk=5381&inCharset=utf-8&outCharset=utf-8&notice=0&format=jsonp&hostUin=0&loginUin=0&platform=yqq&needNewCode=0&cid=205361747&uin=0&filename=C400${songmidid}.m4a&guid=3913883408&songmid=${songmidid}&callback=callback`,
//       data: {
//         g_tk: 5381,
//         inCharset: 'utf-8',
//         outCharset: 'utf-8',
//         notice: 0,
//         format: 'jsonp',
//         hostUin: 0,
//         loginUin: 0,
//         platform: 'yqq',
//         needNewCode: 0,
//         cid: 205361747,
//         uin: 0,
//         filename: `C400${songmidid}.m4a`,
//         guid: 3913883408,
//         songmid: songmidid,
//         callback: 'callback',
//       },
//       success: function (res) {
//         var res1 = res.data.replace("callback(", "")
//         var res2 = JSON.parse(res1.substring(0, res1.length - 1))
//         const playUrl = `http://dl.stream.qqmusic.qq.com/${res2.data.items[0].filename}?vkey=${res2.data.items[0].vkey}&guid=3913883408&uin=0&fromtag=66`
//         _this._getBackPlayfileName().then((nowPlay) => {
//           if (!(res2.data.items[0].filename === nowPlay.ret)) {
//             _this._createAudio(playUrl)
//           }
//         }).catch((err) => {
//           _this._createAudio(playUrl)
//         })
//       }
//     })
//   },

//   // 创建播放器
//   _createAudio: function (playUrl) {
//     wx.playBackgroundAudio({
//       dataUrl: playUrl,
//       title: this.data.currentSong.name,
//       coverImgUrl: this.data.currentSong.image
//     })
//     // 监听音乐播放。
//     wx.onBackgroundAudioPlay(() => {
//       this.setData({
//         playIcon: 'icon-pause',
//         cdCls: 'play'
//       })
//     })
//     // 监听音乐暂停。
//     wx.onBackgroundAudioPause(() => {
//       this.setData({
//         playIcon: 'icon-play',
//         cdCls: 'pause'
//       })
//     })
//     // 监听音乐停止。
//     wx.onBackgroundAudioStop(() => {
//       if (this.data.playMod === SINGLE_CYCLE_MOD) {
//         this._init()
//         return
//       }
//       this.next()
//     })
//     // 监听播放拿取播放进度
//     const manage = wx.getBackgroundAudioManager()
//     manage.onTimeUpdate(() => {
//       const currentTime = manage.currentTime
//       this.setData({
//         currentTime: this._formatTime(currentTime),
//         percent: currentTime / this.data.currentSong.duration
//       })
//       if (this.data.currentLyric) {
//         this.handleLyric(currentTime * 1000)
//       }
//     })
//   },
//   // 获取歌词
//   _getLyric: function (currentSong) {
//     const _this = this
//     this._getBackPlayfileName().then((res) => {
//       const nowMid = res.ret.split('.')[0].replace('C400', '')
//       if (!(nowMid === currentSong.mid)) {
//         if (this.data.currentLyric) {
//           //this.data.currentLyric.stop && this.data.currentLyric.stop()
//         }
//         _this._getLyricAction(currentSong)
//       }
//     }).catch(() => {
//       _this._getLyricAction(currentSong)
//     })
//   },

//   // 获取处理歌词
//   _getLyricAction: function (currentSong) {
//     song.getLyric(currentSong.musicId).then((res) => {
//       if (res.data.showapi_res_body.ret_code == 0) {
//         const lyric = this._normalizeLyric(res.data.showapi_res_body.lyric)
//         const currentLyric = new Lyric(lyric)
//         this.setData({
//           currentLyric: currentLyric
//         })
//       } else {
//         this.setData({
//           currentLyric: null,
//           currentText: ''
//         })
//       }
//     })
//   },
//   // 去掉歌词中的转义字符
//   _normalizeLyric: function (lyric) {
//     return lyric.replace(/&#58;/g, ':').replace(/&#10;/g, '\n').replace(/&#46;/g, '.').replace(/&#32;/g, ' ').replace(/&#45;/g, '-').replace(/&#40;/g, '(').replace(/&#41;/g, ')')
//   },
//   // 歌词滚动回调函数
//   handleLyric: function (currentTime) {
//     let lines = [{ time: 0, txt: '' }], lyric = this.data.currentLyric, lineNum
//     lines = lines.concat(lyric.lines)
//     for (let i = 0; i < lines.length; i++) {
//       if (i < lines.length - 1) {
//         let time1 = lines[i].time, time2 = lines[i + 1].time
//         if (currentTime > time1 && currentTime < time2) {
//           lineNum = i - 1
//           break;
//         }
//       } else {
//         lineNum = lines.length - 2
//       }
//     }
//     this.setData({
//       currentLineNum: lineNum,
//       currentText: lines[lineNum + 1] && lines[lineNum + 1].txt
//     })

//     let toLineNum = lineNum - 5
//     if (lineNum > 5 && toLineNum != this.data.toLineNum) {
//       this.setData({
//         toLineNum: toLineNum
//       })
//     }
//   },
//   _formatTime: function (interval) {
//     interval = interval | 0
//     const minute = interval / 60 | 0
//     const second = this._pad(interval % 60)
//     return `${minute}:${second}`
//   },
//   /*秒前边加0*/
//   _pad(num, n = 2) {
//     let len = num.toString().length
//     while (len < n) {
//       num = '0' + num
//       len++
//     }
//     return num
//   },
//   changeMod: function () {
//     let playMod = this.data.playMod + 1
//     if (playMod > SINGLE_CYCLE_MOD) {
//       playMod = SEQUENCE_MODE
//     }
//     this.setData({
//       playMod: playMod
//     })
//   },
//   prev: function () {
//     app.currentIndex = this.getNextIndex(false)
//     this._init()
//   },
//   next: function () {
//     app.currentIndex = this.getNextIndex(true)
//     this._init()
//   },
//   /**
//    * 获取不同播放模式下的下一曲索引
//    * @param nextFlag: next or prev
//    * @returns currentIndex
//    */
//   getNextIndex: function (nextFlag) {
//     let ret,
//       currentIndex = app.currentIndex,
//       mod = this.data.playMod,
//       len = this.data.songslist.length
//     if (mod === RANDOM_MOD) {
//       ret = util.randomNum(len)
//     } else {
//       if (nextFlag) {
//         ret = currentIndex + 1 == len ? 0 : currentIndex + 1
//       } else {
//         ret = currentIndex - 1 < 0 ? len - 1 : currentIndex - 1
//       }
//     }
//     return ret
//   },
//   togglePlaying: function () {
//     wx.getBackgroundAudioPlayerState({
//       success: function (res) {
//         var status = res.status
//         if (status == 1) {
//           wx.pauseBackgroundAudio()
//         } else {
//           wx.playBackgroundAudio()
//         }
//       }
//     })
//   },
//   openList: function () {
//     if (!this.data.songslist.length) {
//       return
//     }
//     this.setData({
//       translateCls: 'uptranslate'
//     })
//   },
//   close: function () {
//     this.setData({
//       translateCls: 'downtranslate'
//     })
//   },
//   playthis: function (e) {
//     const index = e.currentTarget.dataset.index
//     app.currentIndex = index
//     this._init()
//     this.close()
//   },
//   changeDot: function (e) {
//     this.setData({
//       currentDot: e.detail.current
//     })
//   }
// })