// 简单的HTTP服务器，提供Markdown解析和文件监控功能
const http = require('http');
const fs = require('fs');
const path = require('path');
const MarkdownParser = require('./parser.js');

class MarkdownGraphServer {
  constructor(port = 3001) {
    this.port = port;
    this.parser = new MarkdownParser();
    this.lastModified = null;
    this.cachedData = null;
    this.dataFile = path.join(__dirname, 'datas.md');
    this.clients = new Set(); // WebSocket客户端集合（简化版）
  }

  // 启动服务器
  start() {
    const server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    server.listen(this.port, () => {
      console.log(`Markdown Graph Server running at http://localhost:${this.port}`);
      console.log(`Watching file: ${this.dataFile}`);
    });

    // 监控文件变化
    this.watchFile();
  }

  // 处理HTTP请求
  handleRequest(req, res) {
    const url = new URL(req.url, `http://localhost:${this.port}`);
    
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    switch (url.pathname) {
      case '/api/graph-data':
        this.handleGraphData(req, res);
        break;
      case '/api/status':
        this.handleStatus(req, res);
        break;
      case '/api/reload':
        this.handleReload(req, res);
        break;
      default:
        this.handle404(res);
    }
  }

  // 获取图数据
  async handleGraphData(req, res) {
    try {
      const data = await this.getGraphData();
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error generating graph data:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Failed to generate graph data' }));
    }
  }

  // 获取状态信息
  handleStatus(req, res) {
    const stats = fs.existsSync(this.dataFile) ? fs.statSync(this.dataFile) : null;
    const status = {
      file: this.dataFile,
      exists: fs.existsSync(this.dataFile),
      lastModified: stats ? stats.mtime : null,
      cached: this.cachedData !== null,
      nodesCount: this.cachedData ? this.cachedData.nodes.length : 0,
      edgesCount: this.cachedData ? this.cachedData.edges.length : 0
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify(status, null, 2));
  }

  // 强制重新加载
  async handleReload(req, res) {
    this.lastModified = null;
    this.cachedData = null;
    
    try {
      const data = await this.getGraphData();
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({ 
        message: 'Reloaded successfully',
        nodesCount: data.nodes.length,
        edgesCount: data.edges.length 
      }));
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Failed to reload data' }));
    }
  }

  // 处理404
  handle404(res) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }

  // 获取图数据（带缓存）
  async getGraphData() {
    if (!fs.existsSync(this.dataFile)) {
      throw new Error(`File not found: ${this.dataFile}`);
    }

    const stats = fs.statSync(this.dataFile);
    const currentModified = stats.mtime.getTime();

    // 检查缓存是否有效
    if (this.cachedData && this.lastModified === currentModified) {
      console.log('Returning cached data');
      return this.cachedData;
    }

    console.log('Parsing markdown file...');
    const markdownContent = fs.readFileSync(this.dataFile, 'utf8');
    const graphData = this.parser.parse(markdownContent);
    
    // 更新缓存
    this.cachedData = graphData;
    this.lastModified = currentModified;

    console.log(`Generated ${graphData.nodes.length} nodes and ${graphData.edges.length} edges`);
    return graphData;
  }

  // 监控文件变化
  watchFile() {
    if (!fs.existsSync(this.dataFile)) {
      console.log(`Warning: ${this.dataFile} does not exist. Will watch for creation.`);
    }

    // 监控文件变化
    fs.watchFile(this.dataFile, { interval: 1000 }, (curr, prev) => {
      if (curr.mtime !== prev.mtime) {
        console.log(`File ${this.dataFile} has been modified`);
        this.lastModified = null;
        this.cachedData = null;
        
        // 这里可以添加WebSocket推送通知客户端刷新
        console.log('Data invalidated, clients should reload');
      }
    });
  }
}

// 如果直接运行此文件，启动服务器
if (require.main === module) {
  const server = new MarkdownGraphServer(3001);
  server.start();
}

module.exports = MarkdownGraphServer;