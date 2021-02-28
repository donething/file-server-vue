new Vue({
  el: '#app',
  data() {
    return {
      relPaths: ["."],   // 路径导航栏中表示当前的路径（为相对路径），listFiles()等需要使用
      filesList: [],     // 当前路径下的文件列表，用于数据视图绑定
      auth: "",          // 授权码，将保存到 localstorage中，用于在删除文件操作时在请求头中传递认证信息
      authVisible: false
    };
  },
  methods: {
    /**
     * 点击了路径导航栏，显示更新后的路径下的文件
     * @param index 路径导航栏数组的 index
     */
    onPathNavClicked(index) {
      // 取路径数组的[0,index]表示更新后的路径
      this.relPaths = this.relPaths.slice(0, index + 1);
      this.listFiles();
    },
    /**
     * 当点击了文件名时，如果为文件，则下载；为目录，则显示该目录下的文件
     * @param filename 被点击的文件名
     */
    onFileNameClicked(filename) {
      let index = this.filesList.findIndex(file => file.name === filename);
      if (index === -1) {
        this.$message.error("未能根据文件名查到到索引");
        console.log("未能根据文件名查到到索引：", this.relPaths, this.filename);
        return;
      }
      if (this.filesList[index].is_dir) {
        this.relPaths.push(filename);
        this.listFiles();
      } else {
        this.downFile(`${this.relPaths.join("/")}/${filename}`);
      }
    },
    /**
     * 点击了删除文件的按钮
     * @param filename 文件名
     */
    onDelBnClicked(filename) {
      let vm = this;
      this.$confirm({
        title: `确认删除文件`,
        content: `"${filename}"`,
        okText: "删除",
        okType: "danger",
        cancelText: "取消",
        destroyOnClose: true,
        onOk() {
          vm.delFile(`${vm.relPaths.join("/")}/${filename}`);
        },
      });
    },
    onMoreClicked(e) {
      switch (e.key) {
        case "auth":
          this.authVisible = true;
          break;
        case "nginx":
          window.open("/downloads/", "_blank");
          break;
        case "magnet":
          window.open("http://itoa.site:2020/", "_blank");
          break;
        case "link":
          window.open("/ariang/", "_blank");
          break;
        default:
          console.log("未知的操作 key：", e.key);
          this.$message.warn("未知的操作 key：" + e.key);
      }
    },
    /**
     * 列出文件，路径为数组 relPaths
     */
    listFiles() {
      let path = this.relPaths.join("/");
      console.log("列出目录下文件：", path);
      Utils.request(`/api/file?op=list&rel=${path}`).then(response => {
        let data = JSON.parse(response.text);
        if (data.code === 10) {
          this.filesList = data.data;
        } else {
          console.log(`列出目录(${this.relPaths})失败：`, response.text);
          this.$message.warning("列出目录失败");
        }
      }).catch(error => {
        console.log(`列出目录"${this.relPaths}"出错：${error}`);
        this.$message.error("列出目录出错");
      });
    },
    /**
     * 下载文件
     * @param path 相对路径
     */
    downFile(path) {
      console.log("下载该文件：", path);
      window.open(`/api/file?op=down&rel=${path}`);
    },
    /**
     * 删除文件
     * @param path 相对路径
     */
    delFile(path) {
      console.log("删除该文件", path);
      let headers = {"Authorization": localStorage.getItem("auth")};
      Utils.request(`/api/file?op=del&rel=${path}`, null, headers).then(response => {
        // 删除文件需要提供授权码
        if (response.status === 401) {
          console.log(`文件"${path}"删除失败：未提供授权码`);
          this.$message.warning(`文件删除失败：未提供授权码`);
          return;
        }

        // 其它情况，解析返回的结果
        let result = JSON.parse(response.text);
        if (result.code === 10) {
          this.$message.success("文件删除成功");
        } else {
          console.log(`文件(${path})删除失败：`, response.text);
          this.$message.warning("文件删除失败：" + response.text);
        }
      }).catch(error => {
        console.log(`删除文件"${path}"出错：`, error);
        this.$message.error("删除文件出错");
      });
      this.listFiles();
    },
    // 保存授权码到本地（用于删除文件的请求头中携带认证信息）
    saveAuth() {
      localStorage.setItem("auth", this.auth);
      this.authVisible = false;
      console.log(`已保存授权码`);
      this.$message.info("已保存授权码");
    }
  },
  mounted() {
    this.listFiles();
  }
});
