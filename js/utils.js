// 工具套件
class Utils {
  // 日志的标志
  static TAG = "CEXT";

  // showMsg() 参数
  static MSG = {info: "info", success: "success", warning: "warning", error: "error"};

  // chromium storage 操作
  static Storage = {
    get: function (obj) {
      return new Promise(resolve => {
        chrome.storage.sync.get(obj, resolve);
      });
    },
    set: function (obj) {
      return new Promise(resolve => {
        chrome.storage.sync.set(obj, resolve);
      });
    },
    clear: function () {
      return new Promise(resolve => {
        chrome.storage.sync.clear(resolve);
      });
    }
  };

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

  // Copyright 2018 Google LLC
  /**
   * 获取当前网页中正在播放的占用最大面积的视频元素
   * @return {Element} video 实例
   */
  findLargestPlayingVideo() {
    /** @namespace video.disablePictureInPicture **/
    const videos = Array.from(document.querySelectorAll('video'))
      .filter(video => video.readyState !== 0)
      .filter(video => video.disablePictureInPicture === false)
      .sort((v1, v2) => {
        const v1Rect = v1.getClientRects()[0] || {width: 0, height: 0};
        const v2Rect = v2.getClientRects()[0] || {width: 0, height: 0};
        return ((v2Rect.width * v2Rect.height) - (v1Rect.width * v1Rect.height));
      });

    if (videos.length === 0) {
      return undefined;
    }
    return videos[0];
  }

  /**
   * 创建chromium桌面通知
   * @param {string} title 消息的标题
   * @param {string} msg 消息的内容
   * @param {object[]} [actions] 包含2个action对象的数组：
   * @param {boolean} [silent] 是否是静音通知
   * [{title:"title1",action:callback1},{title:"title2",action:callback2}]
   * 参考：actions for chrome notification not working: https://stackoverflow.com/a/52109693
   */
  static notify(title, msg, actions, silent) {
    let myNotificationID = null;
    // 通知选项： https://developer.chrome.com/extensions/notifications#NotificationOptions
    let bns = null;
    if (actions) {
      bns = [{title: actions[0] ? actions[0].title : "确定"},
        {title: actions[1] ? actions[1].title : "取消"}];
    }
    let options = {
      type: "basic",
      iconUrl: "/icons/extension_32.png",
      title: title,
      message: msg,
      buttons: bns,
      silent: silent
    };
    // 发送通知
    chrome.notifications.create(options, (notificationId) => {
      myNotificationID = notificationId;
    });

    // 为通知的按钮添加点击事件
    if (!actions) return;
    chrome.notifications.onButtonClicked.addListener((noID, btnIdx) => {
      if (noID === myNotificationID) {
        if (btnIdx === 0) {
          actions[0] ? actions[0].action() : "";
        } else if (btnIdx === 1) {
          actions[1] ? actions[1].action() : "";
        }
      }
    });
  }

  /**
   * 将html字符串转换为html的Element对象
   * 此方法可能会自动下载其中的图片等资源，如果仅需解析html strings，可以使用下面的parseHtml()
   * 如果该html只有一个顶层元素，那么返回该element
   * 如果该html有多个顶层元素，则将其用div包裹后返回
   * 参考：https://stackoverflow.com/a/494348/8179418
   * @param {string} str 需解析的html
   * @return {Element} 解析得到的 Node 对象
   */
  static elemOf(str) {
    let div = document.createElement('div');
    div.innerHTML = str;

    // Change this to div.childNodes to support multiple top-level nodes
    if (div.children.length === 1) {
      return div.firstElementChild;
    }
    return div;
  }

  /**
   * 解析字符串为 document
   * 因为上面的 elemOf()解析后，会自动下载其中的图片等资源。若只需解析html，可使用此方法
   * @param {string} htmlString 需解析的html string
   * @return {Document} HTML Document 对象
   * 参考：https://stackoverflow.com/a/21870431/8179418
   */
  static parseHtml(htmlString) {
    return new DOMParser().parseFromString(htmlString, 'text/html');
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
   * 引入JS文件
   * @param {string} src js的URL
   * @return {Node} 当前js文件所在的Node对象
   */
  static loadJS = src => {
    let script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', src);
    document.body.appendChild(script);
    return script;
  };

  /**
   * 插入内联JavaScript
   * @param code JavaScript内容
   * @return {Node} 当前js内容所在的Node对象
   */
  static insertJS(code) {
    let script = document.createElement("script");
    // 使用匿名函数是为了避免干扰原执行环境，如报变量已存在的错误
    script.textContent = '(' + code + ')()';
    (document.head || document.documentElement).appendChild(script);
    script.parentNode.removeChild(script);
  }

  /**
   * 引入CSS文件
   * @param {string} src css的URL
   * @return {Node} 当前css文件所在的Node对象
   */
  static loadCSS = src => {
    let link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = src;
    document.head.appendChild(link);
    return link;
  };

  /**
   * 在网页内显示通知
   * @param {string} message 通知内容
   * @param {string} [type] 通知类型，可选 MSG 中的值。默认为"info"，还可选"success","warning","error"
   * @param {int} [duration] 通知持续的时间（毫秒），默认 3 秒
   * @return {Promise<void>}
   */
  static async showMsg(message, type = this.MSG.info, duration = 3000) {
    // 获取消息的的 html 文本
    let htmlURL = chrome.runtime.getURL("htmls/message.html");
    let resp = await Utils.request(htmlURL);
    let html = Utils.elemOf(resp.text);
    // 消息盒子，内含消息。已存在则重用，不存在则用新的
    let msgBox = document.querySelector("#do-msgbox") || html.querySelector("#do-msgbox");
    // 消息
    let msg = html.querySelector(".do-msg");
    // 显示对应类型的消息、文本
    msg.querySelector(`.do-msg-${type}`).style.display = "inline-block";
    msg.querySelector(".do-msg-text").innerText = message;
    document.body.appendChild(msgBox);
    // 添加到消息盒子中（添加动画）
    requestAnimationFrame(() => {
      setTimeout(() => {
        msgBox.appendChild(msg);
      }, 20);
    });

    // 一段时间后移除消息
    setTimeout(() => {
      msg.style.opacity = 0;
      if (msgBox.children.length === 0) {
        msgBox.remove();
      }
    }, duration);
    // 消失动画结束后才移除元素
    msg.addEventListener("transitionend", () => {
      msg.style.display = "none";
    }, true);
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

  /**
   * 元素滚动到顶部或底部时触发
   * @param {Element} elem 将绑定的可滚动的元素
   * @param {function} toBottom 当到达底部时触发的回调函数
   * @param {number} bottom 触发回调到时底部的距离，单位像素点（px）
   * @param {function} toTop 当到达顶部时触发的回调函数
   * @param {number} top 触发回调时到顶部的距离，单位像素点（px）
   */
  static whenScrollToEnd(elem, toBottom, bottom = 0, toTop = null, top = 0) {
    !function () {
      let oldPos = 0;   // 用于判断滚动方向的临时值
      let directionBottom = true;   // 滚动方向
      elem.addEventListener("scroll", _ => {
        // 判断滚动方向
        directionBottom = elem.scrollTop > oldPos;
        oldPos = elem.scrollTop;
        if (directionBottom && elem.scrollTop >= elem.scrollHeight - elem.offsetHeight - bottom) {
          toBottom();
        } else if (!directionBottom && elem.scrollTop <= top) {
          toTop();
        }
      });
    }();
  }
}
