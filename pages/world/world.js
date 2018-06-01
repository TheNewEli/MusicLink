import { DBWorld } from '../../db/DBWorld.js';

Page({
  data: {
  },

  //生命周期函数--监听页面加载
  onLoad: function (options) {
    var worldList=this.getAllData();
    this.setData({
      worldList: worldList
    })
  },

  //重新绑定数据，刷新world界面
  onShow: function () {
    var worldList =this.getAllData();
    this.setData({
      worldList: worldList
    })
  },

  //获取全部数据，同时添加progress数据
  getAllData: function(){
    var dbWorld = new DBWorld();
    var worldList = dbWorld.getSortedWorldData();
    var len = worldList.length;
    for (var i = 0; i < len; i++) {
      worldList[i].progress = parseInt(worldList[i].participantNum / worldList[i].totalNum * 100);
    }
    return worldList;
  },




  //world-detail界面待完成
  onTapToDetail(event) {
    var worldId = event.currentTarget.dataset.worldId;
    console.log(worldId);
    wx.navigateTo({
      url: '../select/select?id=' + worldId
    })
  },

})