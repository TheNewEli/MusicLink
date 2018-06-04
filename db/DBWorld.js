var util = require('../utils/util.js');

class DBWorld {
  constructor(worldId) {
    this.storageKeyName = 'worldList';
    this.worldId = worldId;
  }

  //获取world全部信息
  getAllWorldData() {
    var res = wx.getStorageSync(this.storageKeyName);
    if (!res) {
      res = require('../data/data.js').worldList;
      this.execSetStorageSync(res);
    }
    return res;
  }

  execSetStorageSync(data) {
    wx.setStorageSync(this.storageKeyName, data);
  }

  //通过worldId获取对应活动信息
  getWorldItemById() {
    var worldData = this.getAllWorldData();
    var len = worldData.length;
    for (var i = 0; i < len; i++) {
      if (worldData[i].worldId == this.worldId) {
        return {
          index: i,
          data: worldData[i]
        }
      }
    }
  }


  getSortedWorldData() {
    var itemData = this.getAllWorldData();

    //将合唱根据时间降序排列，让最新的评论在上方
    itemData.sort(this.compareWithTime);
    var len = itemData.length;
    var item;

    //将创建时间转换为可阅读的时间格式，例如“5分钟前”等等
    for (var i = 0; i < len; i++) {
      item = itemData[i];
      item.create_time_read = util.getDiffTime(item.date, true);
      //console.log("date:", item.create_time_read);
    }
    return itemData;
  }

  //自定义函数，规定sort的排序规则为降序排列
  compareWithTime(Value1, Vaule2) {
    var flag = parseFloat(Value1.date) - parseFloat(Vaule2.date);
    if (flag < 0) {
      return 1;
    } else if (flag > 0) {
      return -1;
    } else {
      return 0;
    }
  }

};

export{DBWorld};