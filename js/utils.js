// 工具套件
class Utils {
  /**
   * 执行网络请求
   * https://stackoverflow.com/a/48969580/8179418
   * @param {string} url 请求的网站
   * @param {object} [data] POST的数据，可以为对象，也可以为字符串型的数据；为null则表示GET请求
   * @param {Object} [headers] 请求头
   * @return {{success: boolean, status: number, text: string}}
   */
  static async request(url, data = null, headers) {
    let options = {
      headers: headers || {},
      credentials: "include"
    };

    // 根据是否发送数据，判断POST或GET请求
    if (data) {
      options.method = "POST";
      if (typeof data === "object") {
        // Post json数据
        options.body = JSON.stringify(data);
        options.headers["Content-Type"] = "application/json";
      } else if (typeof data === "string") {
        // Post x-www-form-urlencoded
        options.body = data;
        options.headers["Content-Type"] = "application/x-www-form-urlencoded";
      } else {
        console.log("request", "未知的数据类型", data);
        return;
      }
    } else {
      options.method = "GET";
    }

    let response = await fetch(url, options);
    let text = await response.text();
    return {
      success: response.ok,
      status: response.status,
      text: text
    };
  }

  /**
   * 等待指定的毫秒时间
   * 用法为: await Utils.sleep(1000) 或 Utils.sleep(1000).then(...)
   * @param time 等待的毫秒
   * @return {Promise}
   */
  static async sleep(time) {
    await new Promise(resolve => setTimeout(resolve, time));
  }

  /**
   * 等待直到指定的元素存在（需在async函数中await调用）
   * @param selector CSS元素选择器
   * @param interval 等待判断的间隔时间（单位毫秒，不指定时为300毫秒）
   */
  static async waitFor(selector, interval = 300) {
    while (!document.querySelector(selector)) {
      await Utils.sleep(interval);
    }
  }

  /**
   * 返回可读的日期，格式如 "2002/8/15 08:32:08"
   * @param {Date} [date] 日期对象，默认为 new Date()
   * @param {Boolean} [hour12] 是否为 12 小时制，默认 false
   * @return {string} 对应的可读日期
   */
  static date(date = new Date(), hour12 = false) {
    return new Date().toLocaleString("chinese", {hour12: hour12});
  }

  /**
   * 返回指定日期的时分
   * @param {Date} date 日期
   * @returns {string} 时分，如：15:20
   */
  static hourMinute(date = new Date()) {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: 'numeric',
      minute: 'numeric'
    });
  }

  /**
   * 将秒数转为时分秒
   * @param {number} seconds 秒数
   * @param {boolean} [needTrim] 当小时位为 0 时，是否删除开头的"00:"。默认不删除
   * @return {string} 时分秒：01:02:03
   */
  static sec(seconds, needTrim = false) {
    let str = new Date(seconds * 1000).toISOString().substr(11, 8);
    if (needTrim && str.indexOf("00:") === 0) {
      return str.replace("00:", "");
    }
    return str;
  }

  /**
   * 复制文本到剪贴板
   * @param {string} text 文本
   */
  static copyText(text) {
    let textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.value = text;
    textarea.focus();
    textarea.select();
    document.execCommand("Copy");
    textarea.remove();
  }

  /**
   * 滚动到目标元素
   * @param {string} selector 选择器（如 'div.p'）
   */
  static async scrollIntoView(selector) {
    await Utils.waitFor(selector);
    let elem = document.querySelector(selector);
    elem.scrollIntoView();
  }
}
