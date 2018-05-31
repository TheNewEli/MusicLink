var FilePath;
Page({
  voiceStart: function (){
    wx.startRecord({
      success: function (res) {
        console.log(res)
          FilePath=res.tempFilePath
          
      },
      fail: function (res) {
        //录音失败
      }
    })
  },

  voiceEnd: function (){
    wx.stopRecord()
  },

  voicePlay: function (){
    console.log(FilePath)
        wx.playVoice({
          filePath: FilePath,
        complete: function () {
        }
    })
  }

})

